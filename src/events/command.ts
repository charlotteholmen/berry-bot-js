import {Events, type Interaction} from 'discord.js';

import type {Client, Command, Event} from '../types';


const execute = async (interaction: Interaction): Promise<void> => {
    if (!interaction.isChatInputCommand()) return;

    const client = interaction.client as Client;
    const command = client.commands?.get(interaction.commandName) as Command;

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (e) {
        console.error(e);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({content: `There was an error while executing this command: ${e}`, ephemeral: true});
        } else {
            await interaction.reply({content: `There was an error while executing this command: ${e}`, ephemeral: true});
        }
    }
};

export const commandEvent: Event = {
    execute,
    name: Events.InteractionCreate,
    once: false,
};
