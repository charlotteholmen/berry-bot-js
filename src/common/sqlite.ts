import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import {randomUUID} from 'crypto';

export interface Message {
    id?: string;
    username: string;
    content: string;
    date: string; // ISO 8601 format
    embedding?: number[]; // text-embedding-3-small vector (1536 dimensions)
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
    }

    /**
     * Get sanitized table name for guild
     */
    private getGuildTableName(guildId: string): string {
        return `guild_${guildId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    }

    /**
     * Create table for a specific guild if it doesn't exist
     */
    createGuildTable(guildId: string): void {
        const tableName = this.getGuildTableName(guildId);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS ${tableName} (
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
            CREATE INDEX IF NOT EXISTS idx_${tableName}_username ON ${tableName}(username);
            CREATE INDEX IF NOT EXISTS idx_${tableName}_date ON ${tableName}(date);
            CREATE INDEX IF NOT EXISTS idx_${tableName}_created_at ON ${tableName}(created_at);
        `);
    }

    /**
   * Insert a new message with embedding
   */
    insertMessage(guildId: string, message: Message): string {
        const tableName = this.getGuildTableName(guildId);
        this.createGuildTable(guildId);

        const id = message.id || randomUUID();
        const stmt = this.db.prepare(`
            INSERT INTO ${tableName} (id, username, content, date, embedding)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            message.username,
            message.content,
            message.date,
            JSON.stringify(message.embedding || [])
        );

        return id;
    }

    /**
   * Insert multiple messages in a transaction for better performance
   */
    insertMessages(guildId: string, messages: Message[]): string[] {
        if (messages.length === 0) return [];

        const tableName = this.getGuildTableName(guildId);
        this.createGuildTable(guildId);

        const insert = this.db.prepare(`
            INSERT INTO ${tableName} (id, username, content, date, embedding)
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
                    JSON.stringify(msg?.embedding ?? [])
                );
                ids.push(id);
            }
            return ids;
        });

        return insertMany(messages);
    }

    /**
   * Get a message by ID
   */
    getMessageById(guildId: string, id: string): Message | null {
        const tableName = this.getGuildTableName(guildId);
        const stmt = this.db.prepare(`
            SELECT id, username, content, date, embedding
            FROM ${tableName}
            WHERE id = ?
        `);

        const row = stmt.get(id) as MessageRow | undefined;
        return row ? this.parseMessageRow(guildId, row) : null;
    }

    /**
   * Get messages by username
   */
    getMessagesByUsername(guildId: string, username: string, limit: number = 100): Message[] {
        const tableName = this.getGuildTableName(guildId);
        const stmt = this.db.prepare(`
            SELECT id, username, content, date, embedding
            FROM ${tableName}
            WHERE username = ?
            ORDER BY date DESC
            LIMIT ?
        `);

        const rows = stmt.all(username, limit) as MessageRow[];
        return rows.map(row => this.parseMessageRow(guildId, row));
    }

    /**
   * Get messages within a date range
   */
    getMessagesByDateRange(guildId: string, startDate: string, endDate: string, limit: number = 1000): Message[] {
        const tableName = this.getGuildTableName(guildId);
        const stmt = this.db.prepare(`
            SELECT id, username, content, date, embedding
            FROM ${tableName}
            WHERE date BETWEEN ? AND ?
            ORDER BY date DESC
            LIMIT ?
        `);

        const rows = stmt.all(startDate, endDate, limit) as MessageRow[];
        return rows.map(row => this.parseMessageRow(guildId, row));
    }

    /**
   * Get all messages with pagination
   */
    getAllMessages(guildId: string, limit: number = 100, offset: number = 0): Message[] {
        const tableName = this.getGuildTableName(guildId);
        const stmt = this.db.prepare(`
            SELECT id, username, content, date, embedding
            FROM ${tableName}
            ORDER BY date DESC
            LIMIT ? OFFSET ?
        `);

        const rows = stmt.all(limit, offset) as MessageRow[];
        return rows.map(row => this.parseMessageRow(guildId, row));
    }

    /**
   * Search messages by content (basic text search)
   */
    searchMessages(guildId: string, searchTerm: string, limit: number = 50): Message[] {
        const tableName = this.getGuildTableName(guildId);
        const stmt = this.db.prepare(`
            SELECT id, username, content, date, embedding
            FROM ${tableName}
            WHERE content LIKE ?
            ORDER BY date DESC
            LIMIT ?
        `);

        const rows = stmt.all(`%${searchTerm}%`, limit) as MessageRow[];
        return rows.map(row => this.parseMessageRow(guildId, row));
    }

    /**
   * Get message count
   */
    getMessageCount(guildId: string): number {
        const tableName = this.getGuildTableName(guildId);
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`);
        const result = stmt.get() as { count: number };
        return result.count;
    }

    /**
   * Get message count by username
   */
    getMessageCountByUsername(guildId: string, username: string): number {
        const tableName = this.getGuildTableName(guildId);
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName} WHERE username = ?`);
        const result = stmt.get(username) as { count: number };
        return result.count;
    }

    /**
   * Delete a message by ID
   */
    deleteMessage(guildId: string, id: string): boolean {
        const tableName = this.getGuildTableName(guildId);
        const stmt = this.db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
        const result = stmt.run(id);
        return result.changes > 0;
    }

    /**
   * Delete all messages by username
   */
    deleteMessagesByUsername(guildId: string, username: string): number {
        const tableName = this.getGuildTableName(guildId);
        const stmt = this.db.prepare(`DELETE FROM ${tableName} WHERE username = ?`);
        const result = stmt.run(username);
        return result.changes;
    }

    /**
   * Update message embedding
   */
    updateEmbedding(guildId: string, id: string, embedding: number[]): boolean {
        const tableName = this.getGuildTableName(guildId);
        const stmt = this.db.prepare(`UPDATE ${tableName} SET embedding = ? WHERE id = ?`);
        const result = stmt.run(JSON.stringify(embedding), id);
        return result.changes > 0;
    }

    /**
   * Get all embeddings for similarity search (returns id and embedding)
   */
    getAllEmbeddings(guildId: string): Array<{ id: string; embedding: number[] }> {
        const tableName = this.getGuildTableName(guildId);
        const stmt = this.db.prepare(`SELECT id, embedding FROM ${tableName}`);
        const rows = stmt.all() as Array<{ id: string; embedding: string }>;
        return rows.map(row => ({
            id       : row.id,
            embedding: JSON.parse(row.embedding),
        }));
    }

    /**
   * Helper function to parse database row to Message object
   */
    private parseMessageRow(guildId: string, row: MessageRow): Message {
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
