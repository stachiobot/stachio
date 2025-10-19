import { BaseClient, logger, getAllVersions, scheduleGuildScan, premiumLimits } from '@projectdiscord/core';
import { EventInterface } from '@projectdiscord/shared';
import { ActivityType, PresenceData, PresenceUpdateStatus } from 'discord.js';

const readyEvent: EventInterface<'clientReady'> = {
	name: 'clientReady',
	options: { once: true, rest: false },
	async execute(client: BaseClient) {
		const guilds = await client.prisma.guildConfig.findMany();

		for (const guild of guilds) {
			const tier = guild.premiumTier || 'Free';
			scheduleGuildScan(client, guild.guildId, tier as keyof typeof premiumLimits);
		}

		console.log(`✅ Scheduled scans for all premium guilds`);

		const versions = getAllVersions();

		logger.info(`✅ Client ready as ${client.user?.tag}`);

		const formatted = Object.entries(versions)
			.map(([ws, v]) => `   • ${ws}: v${v}`)
			.join('\n');
		logger.info(`🔖 Workspace Versions:\n${formatted}`);

		const presences: PresenceData[] = [
			{
				activities: [
					{
						name: '',
						type: ActivityType.Custom,
						state: '⚡ Powered by ProjectDiscord',
					},
				],
				status: PresenceUpdateStatus.Online,
			},
			{
				activities: [
					{
						name: 'with TypeScript & Discord.js',
						type: ActivityType.Playing,
					},
				],
				status: PresenceUpdateStatus.Idle,
			},
			{
				activities: [
					{
						name: 'over your servers 👀',
						type: ActivityType.Watching,
					},
				],
				status: PresenceUpdateStatus.DoNotDisturb,
			},
			{
				activities: [
					{
						name: 'GitHub commits fly by',
						type: ActivityType.Watching,
					},
				],
				status: PresenceUpdateStatus.Idle,
			},
			{
				activities: [
					{
						name: 'your feedback 📢',
						type: ActivityType.Listening,
					},
				],
				status: PresenceUpdateStatus.Online,
			},
			{
				activities: [
					{
						name: 'in the bot leaderboard 🏆',
						type: ActivityType.Competing,
					},
				],
				status: PresenceUpdateStatus.Online,
			},
		];

		let index = 0;
		const updatePresence = () => {
			client.user?.setPresence(presences[index]);
			index = (index + 1) % presences.length;
		};

		updatePresence();
		setInterval(updatePresence, 60_000);
	},
};

export default readyEvent;
