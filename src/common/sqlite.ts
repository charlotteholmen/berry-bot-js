import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import {randomUUID} from 'crypto';
import {getEmbedding} from './openai.js';

export interface Message {
    id?: string;
    username: string;
    content: string;
    date: string; // ISO 8601 format
    embedding: number[]; // text-embedding-3-small vector (1536 dimensions)
}

export interface MessageInput {
    username: string;
    content: string;
    date: string; // ISO 8601 format
}

export interface MessageRow extends Omit<Message, 'embedding'> {
    id: string;
    embedding: string; // JSON string in database
}

class SQLiteDatabase {
    private db: Database.Database;
    private dbPath: string;

    constructor(dbPath: string = process.env.SQLITE_DB_PATH || './data/messages.db') {
        this.dbPath = dbPath;

        // Ensure directory exists
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {recursive: true});
        }

        this.db = new Database(dbPath);
        this.initialize();
    }

    private initialize(): void {
    // Create messages table with all required fields
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        embedding TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create indexes for better query performance
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_username ON messages(username);
            CREATE INDEX IF NOT EXISTS idx_date ON messages(date);
            CREATE INDEX IF NOT EXISTS idx_created_at ON messages(created_at);
        `);
    }

    /**
   * Insert a new message with embedding
   */
    insertMessage(message: Message): string {
        const id = message.id || randomUUID();
        const stmt = this.db.prepare(`
      INSERT INTO messages (id, username, content, date, embedding)
      VALUES (?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            message.username,
            message.content,
            message.date,
            JSON.stringify(message.embedding)
        );

        return id;
    }

    /**
   * Insert a new message without embedding (stores empty array)
   */
    insertMessageWithoutEmbedding(messageInput: MessageInput): string {
        const id = randomUUID();
        const stmt = this.db.prepare(`
      INSERT INTO messages (id, username, content, date, embedding)
      VALUES (?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            messageInput.username,
            messageInput.content,
            messageInput.date,
            JSON.stringify([])
        );

        return id;
    }

    /**
   * Insert a new message with automatic embedding generation
   */
    async insertMessageWithEmbedding(messageInput: MessageInput): Promise<string> {
        const embedding = await getEmbedding(messageInput.content);
        return this.insertMessage({
            ...messageInput,
            embedding,
        });
    }

    /**
   * Insert multiple messages in a transaction for better performance
   */
    insertMessages(messages: Message[]): string[] {
        const insert = this.db.prepare(`
      INSERT INTO messages (id, username, content, date, embedding)
      VALUES (?, ?, ?, ?, ?)
    `);

        const insertMany = this.db.transaction((msgs: Message[]) => {
            const ids: string[] = [];
            for (const msg of msgs) {
                const id = msg.id || randomUUID();
                insert.run(
                    id,
                    msg.username,
                    msg.content,
                    msg.date,
                    JSON.stringify(msg.embedding)
                );
                ids.push(id);
            }
            return ids;
        });

        return insertMany(messages);
    }

    /**
   * Insert multiple messages with automatic embedding generation
   */
    async insertMessagesWithEmbedding(messageInputs: MessageInput[]): Promise<string[]> {
        const messagesWithEmbeddings: Message[] = await Promise.all(
            messageInputs.map(async (input) => ({
                ...input,
                embedding: await getEmbedding(input.content),
            }))
        );
        return this.insertMessages(messagesWithEmbeddings);
    }

    /**
   * Get a message by ID
   */
    getMessageById(id: string): Message | null {
        const stmt = this.db.prepare(`
      SELECT id, username, content, date, embedding
      FROM messages
      WHERE id = ?
    `);

        const row = stmt.get(id) as MessageRow | undefined;
        return row ? this.parseMessageRow(row) : null;
    }

    /**
   * Get messages by username
   */
    getMessagesByUsername(username: string, limit: number = 100): Message[] {
        const stmt = this.db.prepare(`
      SELECT id, username, content, date, embedding
      FROM messages
      WHERE username = ?
      ORDER BY date DESC
      LIMIT ?
    `);

        const rows = stmt.all(username, limit) as MessageRow[];
        return rows.map(row => this.parseMessageRow(row));
    }

    /**
   * Get messages within a date range
   */
    getMessagesByDateRange(startDate: string, endDate: string, limit: number = 1000): Message[] {
        const stmt = this.db.prepare(`
      SELECT id, username, content, date, embedding
      FROM messages
      WHERE date BETWEEN ? AND ?
      ORDER BY date DESC
      LIMIT ?
    `);

        const rows = stmt.all(startDate, endDate, limit) as MessageRow[];
        return rows.map(row => this.parseMessageRow(row));
    }

    /**
   * Get all messages with pagination
   */
    getAllMessages(limit: number = 100, offset: number = 0): Message[] {
        const stmt = this.db.prepare(`
      SELECT id, username, content, date, embedding
      FROM messages
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `);

        const rows = stmt.all(limit, offset) as MessageRow[];
        return rows.map(row => this.parseMessageRow(row));
    }

    /**
   * Search messages by content (basic text search)
   */
    searchMessages(searchTerm: string, limit: number = 50): Message[] {
        const stmt = this.db.prepare(`
      SELECT id, username, content, date, embedding
      FROM messages
      WHERE content LIKE ?
      ORDER BY date DESC
      LIMIT ?
    `);

        const rows = stmt.all(`%${searchTerm}%`, limit) as MessageRow[];
        return rows.map(row => this.parseMessageRow(row));
    }

    /**
   * Get message count
   */
    getMessageCount(): number {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM messages');
        const result = stmt.get() as { count: number };
        return result.count;
    }

    /**
   * Get message count by username
   */
    getMessageCountByUsername(username: string): number {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM messages WHERE username = ?');
        const result = stmt.get(username) as { count: number };
        return result.count;
    }

    /**
   * Delete a message by ID
   */
    deleteMessage(id: string): boolean {
        const stmt = this.db.prepare('DELETE FROM messages WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    /**
   * Delete all messages by username
   */
    deleteMessagesByUsername(username: string): number {
        const stmt = this.db.prepare('DELETE FROM messages WHERE username = ?');
        const result = stmt.run(username);
        return result.changes;
    }

    /**
   * Update message embedding
   */
    updateEmbedding(id: string, embedding: number[]): boolean {
        const stmt = this.db.prepare('UPDATE messages SET embedding = ? WHERE id = ?');
        const result = stmt.run(JSON.stringify(embedding), id);
        return result.changes > 0;
    }

    /**
   * Update message embedding by fetching from OpenAI
   */
    async updateEmbeddingFromContent(id: string): Promise<boolean> {
        const message = this.getMessageById(id);
        if (!message) {
            return false;
        }
        const embedding = await getEmbedding(message.content);
        return this.updateEmbedding(id, embedding);
    }

    /**
   * Get all embeddings for similarity search (returns id and embedding)
   */
    getAllEmbeddings(): Array<{ id: string; embedding: number[] }> {
        const stmt = this.db.prepare('SELECT id, embedding FROM messages');
        const rows = stmt.all() as Array<{ id: string; embedding: string }>;
        return rows.map(row => ({
            id       : row.id,
            embedding: JSON.parse(row.embedding),
        }));
    }

    /**
   * Helper function to parse database row to Message object
   */
    private parseMessageRow(row: MessageRow): Message {
        return {
            id       : row.id,
            username : row.username,
            content  : row.content,
            date     : row.date,
            embedding: JSON.parse(row.embedding),
        };
    }

    /**
   * Close the database connection
   */
    close(): void {
        this.db.close();
    }

    /**
   * Execute raw SQL (use with caution)
   */
    exec(sql: string): void {
        this.db.exec(sql);
    }

    /**
   * Vacuum database to optimize storage
   */
    vacuum(): void {
        this.db.exec('VACUUM');
    }
}

// Export singleton instance
let dbInstance: SQLiteDatabase | null = null;

export const getDatabase = (dbPath?: string): SQLiteDatabase => {
    if (!dbInstance) {
        dbInstance = new SQLiteDatabase(dbPath);
    }
    return dbInstance;
};

export const closeDatabase = (): void => {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
};

export default SQLiteDatabase;
