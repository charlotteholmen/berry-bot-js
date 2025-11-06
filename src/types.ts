import type {ChatInputCommandInteraction, ClientEvents, Collection, Client as DiscordClient, Interaction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder} from 'discord.js';


export interface Client extends DiscordClient {
    commands?: Collection<string, unknown>;
}

export interface Command {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface Event {
    execute: (interaction: Interaction) => Promise<void>;
    name: keyof ClientEvents;
    once: boolean;
}

export interface McStatusResp {
    host: string;
    ip_address: string;
    motd: {
        clean: string;
        html: string;
        raw: string;
    };
    online: boolean;
    players: {
        list: {
            name_clean: string;
            name_html: string;
            name_raw: string;
            uuid: string;
        }[];
        max: number;
        online: number;
    };
    port: number;
    version: {
        name_clean: string;
        name_html: string;
        name_raw: string;
        protocol: number;
    };
}
