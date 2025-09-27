import { SlashCommandBuilder, ChatInputCommandInteraction, ClientEvents, RESTEvents, Message } from 'discord.js';

export type ObjectNameIDArray = Array[{ name: string; id: string }];

export interface EventInterface<K extends keyof ClientEvents | keyof RESTEvents = keyof ClientEvents> {
	name: K;
	options?: { once?: boolean; rest?: boolean };
	execute: (
		...args: K extends 'interactionCreate'
			? [client: any, interaction: ChatInputCommandInteraction]
			: K extends keyof ClientEvents
				? [client: any, ...ClientEvents[K]]
				: K extends keyof RESTEvents
					? [client: any, ...RESTEvents[K]]
					: [client: any, ...any[]]
	) => void | Promise<void>;
}

export interface SlashCommandInterface {
	cooldown: number;
	isDeveloperOnly: boolean;
	data: SlashCommandBuilder;
	execute: (client: any, interaction: ChatInputCommandInteraction) => Promise<void> | void;
}

export interface PrefixCommandInterface {
	name: string;
	description?: string;
	aliases?: string[];
	usage?: string;
	cooldown?: number;
	isDeveloperOnly?: boolean;
	execute: (client: any, message: Message, args: string[]) => void | Promise<void | Message>;
}
