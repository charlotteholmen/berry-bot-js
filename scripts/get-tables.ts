import Database from 'better-sqlite3';
const db = new Database('data/messages.db'); // Replace with your database file

try {
    const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'').all();
    tables.forEach(table => console.log(table.name));
} catch (error) {
    console.error('Error listing tables:', error);
} finally {
    db.close(); // Close the database connection when done
}
