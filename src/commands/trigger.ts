import {SlashCommandBuilder} from 'discord.js';
import type {ChatInputCommandInteraction, CommandInteractionOption, SlashCommandSubcommandsOnlyBuilder} from 'discord.js';
import type {Command} from '../types';

const addTrigger = async (options: readonly CommandInteractionOption[]): Promise<void> => {
    console.log('yuh');
};

const removeTrigger = async (options: readonly CommandInteractionOption[]): Promise<void> => {
    console.log('yuh');
};

// Could probably do a select menu here
const listTriggers = async (options: readonly CommandInteractionOption[]): Promise<void> => {
    console.log('yuh');
};

const getTrigger = async (options: readonly CommandInteractionOption[]): Promise<void> => {
    console.log('yuh');
};


const ACTIONS = [
    {name: 'add', description: 'Add trigger to bot', action: addTrigger},
    {name: 'remove', description: 'Remove trigger from bot', action: removeTrigger},
    {name: 'list', description: 'List all triggers', action: listTriggers},
    {name: 'get', description: 'Get all triggers', action: getTrigger},
];

const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const subcommand = interaction.options.getSubcommand();
    const options = interaction.options.data.find((option) => option.name === subcommand)?.options ?? [];
    let result = '';

    await interaction.deferReply();

    ACTIONS.forEach(({name, action}) => {
        if (subcommand === name) {
            action(options);
        }
    });

    interaction.editReply(result);
};

const createServerCommand = (): SlashCommandSubcommandsOnlyBuilder => {
    const command = new SlashCommandBuilder()
        .setName('server')
        .setDescription('Perform actions on game servers');

    ACTIONS.forEach((action) => (
        command.addSubcommand((subcommand) => (
            subcommand.setName(action.name)
                .setDescription(action.description)
                .addStringOption((option) => {
                    option.setName('target')
                        .setDescription('Target Game Server')
                        .setRequired(true)
                        .addChoices(...SERVERS);

                    return option;
                })
        ))
    ));

    return command;
};

export const serverCommand: Command = {
    data: createServerCommand(),
    execute,
};
