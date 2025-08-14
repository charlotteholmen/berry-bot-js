import {ChannelType, SlashCommandBuilder} from 'discord.js';
import type {ChatInputCommandInteraction, Message, SlashCommandOptionsOnlyBuilder, TextChannel} from 'discord.js';
import type {Command} from '../types';

const MESSAGE_LIMIT = 10;

const sendToOpenSearch = async (endpoint: string, message: Message): Promise<void> => {
    const body = {
        timestamp: message.createdAt,
        username : message.author.username,
        content  : message.content,
        // embedding: ... // Add embedding if available
    };
    try {
        const res = await fetch(`${endpoint}/discord-message-test/messages/_doc`, {
            method : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            console.error('OpenSearch error:', await res.text());
        }
    } catch (err) {
        console.error('Failed to send to OpenSearch:', err);
    }
};

const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const channel = interaction.options.getChannel('source') as TextChannel;

    if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply('Please select a valid text channel');
        return;
    }

    await interaction.deferReply();


    const endpoint = process.env.OPENSEARCH_ENDPOINT;
    if (!endpoint) {
        await interaction.editReply('OpenSearch endpoint not configured');
        return;
    }

    try {
        let messagesCount = 0;
        let lastId: string | undefined;
        const options: { limit: number; before?: string } = {limit: MESSAGE_LIMIT};

        if (lastId) {
            options.before = lastId;
        }

        const messages = await channel.messages.fetch(options);

        for (const message of messages.values()) {
            await sendToOpenSearch(endpoint, message);
            messagesCount++;
        }

        lastId = messages.last()?.id;

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
        )
        );

    return command;
};

export const ingestCommand: Command = {
    data: createIngestCommand(),
    execute,
};
