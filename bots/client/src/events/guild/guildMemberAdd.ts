import { BaseClient, actionUser } from '@projectdiscord/core';
import { EventInterface } from '@projectdiscord/shared';
import { GuildMember } from 'discord.js';

const guildMemberAddEvent: EventInterface<'guildMemberAdd'> = {
	name: 'guildMemberAdd',
	options: { once: false, rest: false },
	async execute(client: BaseClient, member: GuildMember) {
		try {
			await actionUser(member);
		} catch (err) {
			console.error('Failed to check blacklist on member join:', err);
		}
	},
};

export default guildMemberAddEvent;
