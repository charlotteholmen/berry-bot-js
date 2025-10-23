import {ChannelType, SlashCommandBuilder} from 'discord.js';
import type {ChatInputCommandInteraction, FetchMessagesOptions, Message, SlashCommandOptionsOnlyBuilder, TextChannel} from 'discord.js';
import type {Command} from '../types.js';
import {readFileSync, writeFileSync} from 'fs';
import {getEmbedding} from '../common/openai.js';
import {getDatabase} from '../common/sqlite.js';

const MESSAGE_LIMIT = 10;
const LAST_ID_FILE = 'last-id.txt';

const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const channel = interaction.options.getChannel('source') as TextChannel;
    const limit = interaction.options.getInteger('limit') ?? MESSAGE_LIMIT;

    if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply('Please select a valid text channel');
        return;
    }

    await interaction.deferReply();

    try {
        let messagesCount = 0;
        let lastId: string;

        try {
            lastId = readFileSync(LAST_ID_FILE, 'utf8').trim();
        } catch {
            lastId = '';
        }

        const options: FetchMessagesOptions = {limit};

        if (lastId) {
            options.before = lastId;
        }

        const messages = await channel.messages.fetch(options);

        const messagesArray = Array.from(messages.values())
            .filter(msg => !msg.author.bot && msg.content.trim().length > 0);

        // Insert messages into SQLite database with embeddings
        const db = getDatabase();
        const guildId = interaction.guildId ?? 'unknown';

        // Generate embeddings and create Message objects
        const messagesWithEmbeddings = await Promise.all(
            messagesArray.map(async (msg) => ({
                username: msg.author.username,
                content : msg.content,
                date    : msg.createdAt.toISOString(),
                // embedding: await getEmbedding(msg.content),
            }))
        );

        db.insertMessages(guildId, messagesWithEmbeddings);

        messagesCount = messagesWithEmbeddings.length;

        lastId = messages.last()?.id ?? '';
        writeFileSync(LAST_ID_FILE, lastId);

        await interaction.editReply(`Processed ${messagesCount} messages from channel: ${channel.name}`);
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
        .addIntegerOption((option) => (
            option
                .setName('limit')
                .setDescription('Limit number of messages to ingest')
                .setRequired(false)
        ));

    return command;
};

export const ingestCommand: Command = {
    data: createIngestCommand(),
    execute,
};
