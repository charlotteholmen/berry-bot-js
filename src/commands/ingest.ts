import type {ChatInputCommandInteraction, FetchMessagesOptions, Message, SlashCommandOptionsOnlyBuilder, TextChannel} from 'discord.js';

import {ChannelType, SlashCommandBuilder} from 'discord.js';

import type {Command} from '../types.js';

import {getDatabase} from '../common/sqlite.js';
import {sleep} from '../utils.js';

const MESSAGE_LIMIT = 100;
const BATCH_SIZE = 100;
const RATE_LIMIT_DELAY = 1000;

interface IngestOptions {
    channel: TextChannel;
    continuous?: boolean;
    guildId: string;
    limit?: number;
    onProgress?: (totalProcessed: number, batchCount: number) => Promise<void> | void;
}

/**
 * Ingest messages from a channel into the database
 * Can be called programmatically or from Discord command
 */
export const ingestMessages = async (options: IngestOptions): Promise<{batchCount: number; totalProcessed: number;}> => {
    const {channel, continuous = false, guildId, limit, onProgress} = options;

    const db = getDatabase();
    const channelId = channel.id;

    let totalProcessed = 0;
    let batchCount = 0;
    let hasMore = true;

    let lastId = db.getLastIngestedId(guildId, channelId);

    console.log(`Starting ingestion for channel ${channelId}`);
    console.log(`Last ingested ID: ${lastId || 'none (starting from most recent)'}`);

    while (hasMore) {
        const fetchOptions: FetchMessagesOptions = {limit: BATCH_SIZE};

        if (lastId) {
            fetchOptions.before = lastId;
        }

        console.log(`Fetching batch ${batchCount + 1} with options:`, fetchOptions);

        const messages = await channel.messages.fetch(fetchOptions);

        console.log(`Fetched ${messages.size} messages (batch ${batchCount + 1})`);

        if (messages.size === 0) {
            console.log('No messages fetched, stopping');
            hasMore = false;
            break;
        }

        const messagesArray = Array.from(messages.values())
            .filter(msg => !msg.author.bot && msg.content.trim().length > 0);

        console.log(`Filtered to ${messagesArray.length} valid messages (non-bot, non-empty)`);

        if (messagesArray.length > 0) {
            const messagesWithEmbeddings = await Promise.all(
                messagesArray.map(async (msg) => ({
                    content : msg.content,
                    date    : msg.createdAt.toISOString(),
                    username: msg.author.username,
                    // embedding: await getEmbedding(msg.content),
                }))
            );

            db.insertMessages(guildId, messagesWithEmbeddings);
            totalProcessed += messagesWithEmbeddings.length;
        }

        const newLastId = messages.last()?.id;
        console.log(`New last ID: ${newLastId}`);

        if (newLastId) {
            lastId = newLastId;
            db.setLastIngestedId(guildId, channelId, newLastId);
        } else {
            // No more messages
            console.log('No last message ID, stopping');
            hasMore = false;
            break;
        }

        batchCount++;

        if (batchCount % 5 === 0 && onProgress) {
            await onProgress(totalProcessed, batchCount);
        }

        if (!continuous) {
            // Single batch mode
            console.log('Not in continuous mode, stopping after one batch');
            hasMore = false;
            break;
        }

        if (limit && totalProcessed >= limit) {
            // Reached the limit
            console.log(`Reached limit of ${limit}, stopping`);
            hasMore = false;
            break;
        }

        if (messages.size < BATCH_SIZE) {
            // Fetched fewer messages than requested - reached the end of channel history
            console.log(`Fetched ${messages.size} < ${BATCH_SIZE}, reached end of channel history`);
            hasMore = false;
            break;
        }

        console.log(`Waiting ${RATE_LIMIT_DELAY}ms before next batch...\n`);
        await sleep(RATE_LIMIT_DELAY);
    }

    console.log(`\nIngestion complete: ${totalProcessed} total messages, ${batchCount} batches`);
    return {batchCount, totalProcessed};
};

const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const channel = interaction.options.getChannel('source') as TextChannel;
    const limit = interaction.options.getInteger('limit') ?? MESSAGE_LIMIT;
    const continuous = interaction.options.getBoolean('continuous') ?? false;

    if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply('Please select a valid text channel');
        return;
    }

    await interaction.deferReply();

    try {
        const guildId = interaction.guildId ?? 'unknown';

        const result = await ingestMessages({
            channel,
            continuous,
            guildId,
            limit,
            onProgress: async (totalProcessed, batchCount) => {
                await interaction.editReply(`Processing... ${totalProcessed} messages ingested (${batchCount} batches)`);
            },
        });

        await interaction.editReply(
            `Completed! Processed ${result.totalProcessed} messages from channel: ${channel.name} in ${result.batchCount} batches`
        );
    } catch (error) {
        console.error('Error fetching messages:', error);
        await interaction.editReply('An error occurred while fetching messages');
    }
};

const createIngestCommand = (): SlashCommandOptionsOnlyBuilder => {
    const command = new SlashCommandBuilder()
        .setName('ingest')
        .setDescription('Ingest messages from channel')
        .addChannelOption((option) => (
            option
                .setName('source')
                .setDescription('The channel to ingest messages from')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ))
        .addBooleanOption((option) => (
            option
                .setName('continuous')
                .setDescription('Continuously ingest all available messages')
                .setRequired(false)
        ))
        .addIntegerOption((option) => (
            option
                .setName('limit')
                .setDescription('Maximum number of messages to ingest (default: 100)')
                .setRequired(false)
        ));

    return command;
};

export const ingestCommand: Command = {
    data: createIngestCommand(),
    execute,
};
