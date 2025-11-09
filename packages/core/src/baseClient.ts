import { SlashCommandInterface, EventInterface, PrefixCommandInterface } from '@projectdiscord/shared';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { config, ProjectInterface } from './config.js';
import { logger } from './logger.js';

import { PrismaClient as AuthioPrisma } from '../prisma/authio';
import { PrismaClient as GlobalPrisma } from '../prisma/global';
import { PrismaClient as MonitioPrisma } from '../prisma/monitio';
import { PrismaClient as SentioPrisma } from '../prisma/sentio';
import { PrismaClient as StachioPrisma } from '../prisma/stachio';

type PrismaMap = {
	authio: AuthioPrisma;
	global: GlobalPrisma;
	monitio: MonitioPrisma;
	sentio: SentioPrisma;
	stachio: StachioPrisma;
};

type PrismaEventClient = {
	$on(event: 'query' | 'info' | 'warn' | 'error', callback: (e: any) => void): void;
};

export class BaseClient extends Client {
	public slashCommands = new Collection<string, SlashCommandInterface>();
	public prefixCommands = new Collection<string, PrefixCommandInterface>();
	public events = new Collection<string, EventInterface>();

	public config: ProjectInterface;
	public db: PrismaMap;

	constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.GuildMessageTyping,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.GuildModeration,
				GatewayIntentBits.GuildWebhooks,
				GatewayIntentBits.GuildPresences,
				GatewayIntentBits.GuildScheduledEvents,
				GatewayIntentBits.GuildIntegrations,
				GatewayIntentBits.GuildInvites,
				GatewayIntentBits.GuildVoiceStates,
			],
			partials: [
				Partials.User,
				Partials.Channel,
				Partials.Message,
				Partials.Reaction,
				Partials.GuildMember,
				Partials.ThreadMember,
				Partials.GuildScheduledEvent,
			],
		});

		this.config = config;

		// Initialize Prisma clients
		this.db = {
			authio: new AuthioPrisma(),
			global: new GlobalPrisma(),
			monitio: new MonitioPrisma(),
			sentio: new SentioPrisma(),
			stachio: new StachioPrisma(),
		};

		this.initializeDatabaseLogging();
	}

	/**
	 * Attaches event logging for all Prisma clients
	 */
	private initializeDatabaseLogging() {
		for (const [name, client] of Object.entries(this.db)) {
			const prisma = client as unknown as PrismaEventClient;

			prisma.$on('query', (e) => logger.debug(`[${name.toUpperCase()}] Query: ${e.query}`));
			prisma.$on('info', (e) => logger.info(`[${name.toUpperCase()}] Info: ${e.message}`));
			prisma.$on('warn', (e) => logger.warn(`[${name.toUpperCase()}] Warning: ${e.message}`));
			prisma.$on('error', (e) => logger.error(`[${name.toUpperCase()}] Error: ${e.message}`));
		}

		logger.info('✅ Prisma clients initialized and event logging attached');
	}

	/**
	 * Gracefully disconnect all Prisma clients when shutting down
	 */
	public async disconnectDatabases() {
		logger.info('🧹 Disconnecting Prisma clients...');
		await Promise.all([this.db.global.$disconnect(), this.db.stachio.$disconnect()]);
		logger.info('✅ Prisma clients disconnected');
	}
}
