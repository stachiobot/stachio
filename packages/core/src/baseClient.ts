import { SlashCommandInterface, EventInterface, PrefixCommandInterface } from '@projectdiscord/shared';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { config, ProjectInterface } from './config.js';

import { logger } from './logger.js';

import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient({
	log: [
		{ emit: 'event', level: 'query' },
		{ emit: 'event', level: 'info' },
		{ emit: 'event', level: 'warn' },
		{ emit: 'event', level: 'error' },
	],
});

export class BaseClient extends Client {
	public slashCommands: Collection<string, SlashCommandInterface> = new Collection();
	public prefixCommands: Collection<string, PrefixCommandInterface> = new Collection();
	public events: Collection<string, EventInterface> = new Collection();
	public prisma: typeof prisma;
	public config: ProjectInterface;

	constructor() {
		super({
			intents: [
				GatewayIntentBits.AutoModerationConfiguration,
				GatewayIntentBits.AutoModerationExecution,
				GatewayIntentBits.DirectMessagePolls,
				GatewayIntentBits.DirectMessageReactions,
				GatewayIntentBits.DirectMessageTyping,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.GuildExpressions,
				GatewayIntentBits.GuildIntegrations,
				GatewayIntentBits.GuildInvites,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessagePolls,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.GuildMessageTyping,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildModeration,
				GatewayIntentBits.GuildPresences,
				GatewayIntentBits.GuildScheduledEvents,
				GatewayIntentBits.GuildVoiceStates,
				GatewayIntentBits.GuildWebhooks,
				GatewayIntentBits.Guilds,
				GatewayIntentBits.MessageContent,
			],
			partials: [
				Partials.Channel,
				Partials.GuildMember,
				Partials.GuildScheduledEvent,
				Partials.Message,
				Partials.Reaction,
				Partials.SoundboardSound,
				Partials.ThreadMember,
				Partials.User,
			],
		});

		this.prisma = prisma;
		this.config = config;

		prisma.$on('query', (e) => {
			logger.debug(`Prisma Query: ${e.query}`, e);
		});
		prisma.$on('info', (e) => {
			logger.info(`Prisma Info: ${e.message}`);
		});
		prisma.$on('warn', (e) => {
			logger.warn(`Prisma Warning: ${e.message}`);
		});
		prisma.$on('error', (e) => {
			logger.error(`Prisma Error: ${e.message}`);
		});
	}
}
