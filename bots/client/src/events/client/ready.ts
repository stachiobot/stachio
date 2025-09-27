import { BaseClient, logger, getAllVersions } from '@projectdiscord/core';
import { EventInterface } from '@projectdiscord/shared';
import { ActivityType, PresenceData, PresenceUpdateStatus } from 'discord.js';

const readyEvent: EventInterface<'clientReady'> = {
	name: 'clientReady',
	options: { once: true, rest: false },
	execute(client: BaseClient) {
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
						name: 'with ProjectDiscord bots',
						type: ActivityType.Playing,
					},
				],
				status: PresenceUpdateStatus.Online,
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
			{
				activities: [
					{
						name: '',
						type: ActivityType.Custom,
						state: '✨ Running on the new bot template',
					},
				],
				status: PresenceUpdateStatus.Idle,
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
