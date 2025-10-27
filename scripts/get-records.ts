import {getDatabase, closeDatabase} from '../src/common/sqlite.js';

const testDatabase = async (): Promise<void> => {
    try {
        const db = getDatabase();

        console.log('Fetching 100 most recent records...\n');

        const messages = db.getAllMessages('177593112753995776', 100, 0);

        console.log(`Found ${messages.length} messages:\n`);

        messages.forEach((message, index) => {
            console.log(`${index + 1}. [${message.date}] ${message.username}: ${message.content}`);
            console.log(`   ID: ${message.id}`);
            console.log(`   Embedding dimensions: ${message.embedding?.length ?? 0}`);
            console.log('');
        });

        console.log(`\nTotal messages in database: ${db.getMessageCount('177593112753995776')}`);

        closeDatabase();
    } catch (error) {
        console.error('Error reading database:', error);
        closeDatabase();
        process.exit(1);
    }
};

testDatabase();
