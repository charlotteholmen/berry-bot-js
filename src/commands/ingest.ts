import {ChannelType, SlashCommandBuilder, TextChannel} from 'discord.js';
import type {ChatInputCommandInteraction, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder} from 'discord.js';
import type {Command, McStatusResp} from '../types';

const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const channel = interaction.options.getChannel('source') as TextChannel;
    
    if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply('Please select a valid text channel');
        return;
    }

    await interaction.deferReply();

    try {
        let messagesCount = 0;
        // Fetch messages in batches of 100 (Discord.js limit)
        let lastId: string | undefined;
        
        while (true) {
            const options: { limit: number; before?: string } = { limit: 100 };
            if (lastId) options.before = lastId;
            
            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) break;
            
            messages.forEach(message => {
                console.log(`[${message.createdAt}] ${message.author.username}: ${message.content}`);
                messagesCount++;
            });
            
            lastId = messages.last()?.id;
        }
        
        await interaction.editReply(`Processed ${messagesCount} messages from channel: ${channel.name}`);
    } catch (error) {
        console.error('Error fetching messages:', error);
        await interaction.editReply('An error occurred while fetching messages');
    }

    
    await interaction.editReply(`Selected channel: ${channel.name}`);    
}

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
