import type {ChatInputCommandInteraction, SlashCommandSubcommandsOnlyBuilder} from 'discord.js';

import {DescribeInstancesCommand, type DescribeInstancesCommandOutput, EC2Client, StartInstancesCommand, StopInstancesCommand, waitUntilInstanceRunning} from '@aws-sdk/client-ec2';
import {SlashCommandBuilder} from 'discord.js';

import type {Command, McStatusResp} from '../types';

const ec2 = new EC2Client({region: 'us-east-1'});

const ACTIONS = [
    {description: 'Start game server', name: 'start'},
    {description: 'Stop game server', name: 'stop'},
    {description: 'Get game server status', name: 'status'},
    {description: 'Get players on minecraft server', name: 'players'},
];

const SERVERS = [
    {name: 'minecraft', value: process.env.MINECRAFT_INSTANCE ?? '0'},
    {name: 'factorio', value: process.env.FACTORIO_INSTANCE ?? '0'},
    {name: 'grug', value: process.env.GRUG_INSTANCE ?? '0'},
];

const startInstanceAndWait = async (instanceId: string): Promise<string> => {
    const startResp = await ec2.send(new StartInstancesCommand({InstanceIds: [instanceId]}));
    const status = startResp.$metadata.httpStatusCode;

    if (status !== 200) {
        return `Server start request returned status: ${status}`;
    }

    const waitResponse = await waitUntilInstanceRunning(
        {client: ec2, maxWaitTime: 30},
        {InstanceIds: [instanceId]}
    );

    if (waitResponse.state !== 'SUCCESS') {
        return `Waiter returned status: ${waitResponse.state}`;
    }

    const resp = await getInstanceById(instanceId);
    const instanceInfo = resp.Reservations?.[0].Instances?.[0];
    const ip = instanceInfo?.PublicIpAddress;

    return `Successfully started server with ip: ${ip}`;
};

const stopInstance = async (instanceId: string): Promise<string> => {
    const resp = await ec2.send(new StopInstancesCommand({InstanceIds: [instanceId]}));
    const status = resp.$metadata.httpStatusCode;

    if (status !== 200) {
        return `Server stop request returned status: ${status}`;
    }

    return 'Server successfully stopped';
};

const getInstanceById = async (instanceId: string): Promise<DescribeInstancesCommandOutput> => {
    return await ec2.send(new DescribeInstancesCommand({InstanceIds: [instanceId]}));
};

const getPlayerCount = async (ip: string): Promise<string[] | undefined> => {
    const apiUrl = `https://api.mcstatus.io/v2/status/java/${ip}:25565`;
    const resp = await fetch(apiUrl);
    const json = await resp.json() as McStatusResp;

    if (!json.online) {
        return undefined;
    }

    return json.players.list.map((player) => player.name_clean);
};

const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const subcommand = interaction.options.getSubcommand();
    const instanceId = interaction.options.getString('target');
    let result = '';

    if (!instanceId) {
        interaction.reply('Could not find instance id');
        return;
    }

    await interaction.deferReply();

    if (subcommand === 'start') {
        result = await startInstanceAndWait(instanceId);
    } else if (subcommand === 'stop') {
        result = await stopInstance(instanceId);
    } else if (subcommand === 'status') {
        const resp = await getInstanceById(instanceId);
        const instance = resp.Reservations?.[0].Instances?.[0];
        const state = instance?.State?.Name;

        if (instance && state === 'running') {
            const ip = instance.PublicIpAddress;
            result = `Server is currently running with ip: ${ip}`;
        } else {
            result = `Server is currently in state: ${state}`;
        }
    } else if (subcommand === 'players') {
        const resp = await getInstanceById(instanceId);
        const instance = resp.Reservations?.[0].Instances?.[0];
        const state = instance?.State?.Name;

        if (instance && state === 'running') {
            const ip = instance.PublicIpAddress ?? '';
            const players = await getPlayerCount(ip);

            if (players) {
                result = `Server has the following players online: \n${players.map((player) => `\n${player}`)}`;
            } else {
                result = 'Could not find players online for server';
            }
        } else {
            result = 'Server is not currently running';
        }
    }

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
