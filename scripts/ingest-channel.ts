import type {TextChannel} from 'discord.js';

import {Client, GatewayIntentBits} from 'discord.js';

import {ingestMessages} from '../src/commands/ingest.js';
import {closeDatabase} from '../src/common/sqlite.js';

const runIngest = async (): Promise<void> => {
    const token = process.env.TOKEN;
    const guildId = process.env.INGEST_GUILD_ID;
    const channelId = process.env.INGEST_CHANNEL_ID;

    if (!token) {
        console.error('TOKEN environment variable not set');
        process.exit(1);
    }

    if (!guildId || !channelId) {
        console.error('INGEST_GUILD_ID and INGEST_CHANNEL_ID environment variables must be set');
        console.error('Example:');
        console.error('  INGEST_GUILD_ID=669712877447413760');
        console.error('  INGEST_CHANNEL_ID=1234567890123456789');
        process.exit(1);
    }

    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
    });

    client.once('ready', async () => {
        console.log('Bot connected!\n');

        try {
            const guild = await client.guilds.fetch(guildId);
            const channel = await guild.channels.fetch(channelId);

            if (!channel || !channel.isTextBased()) {
                console.error('Channel not found or is not a text channel');
                process.exit(1);
            }

            console.log(`Starting ingest for #${channel.name} in ${guild.name}`);
            console.log('This will ingest ALL messages continuously...\n');

            const result = await ingestMessages({
                channel   : channel as TextChannel,
                continuous: true,
                guildId,
                onProgress: async (totalProcessed, batchCount) => {
                    console.log(`Progress: ${totalProcessed} messages ingested (${batchCount} batches)`);
                },
            });

            console.log('\n=== Ingestion Complete ===');
            console.log(`Total messages processed: ${result.totalProcessed}`);
            console.log(`Total batches: ${result.batchCount}`);
            console.log('==========================\n');

            closeDatabase();
            await client.destroy();
            process.exit(0);
        } catch (error) {
            console.error('Error during ingestion:', error);
            closeDatabase();
            await client.destroy();
            process.exit(1);
        }
    });

    await client.login(token);
};

runIngest();
