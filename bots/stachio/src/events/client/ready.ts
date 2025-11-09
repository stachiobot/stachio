import { BaseClient } from '@projectdiscord/core';
import { EventInterface } from '@projectdiscord/shared';
import { ActivityType, PresenceData, PresenceUpdateStatus } from 'discord.js';

const event: EventInterface<'ready'> = {
	name: 'ready',
	options: { once: true, rest: false },
	execute(client: BaseClient) {
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

export default event;
