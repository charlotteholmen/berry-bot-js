import Database from 'better-sqlite3';
const db = new Database('data/messages.db'); // Replace with your database file

try {
    const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'').all();
    console.log('Deleting all tables:');
    tables.forEach(table => {
        console.log(`Dropping table: ${table.name}`);
        db.prepare(`DROP TABLE IF EXISTS "${table.name}"`).run();
    });
} catch (error) {
    console.error('Error dropping tables:', error);
} finally {
    db.close(); // Close the database connection when done
}
