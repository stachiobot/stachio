import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message } from 'discord.js';

const command: PrefixCommandInterface = {
	name: 'boop',
	description: 'Boop someone affectionately.',
	aliases: ['poke', 'tap'],
	usage: 's?boop [@user]',
	cooldown: 3,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message) {
		const user = message.mentions.users.first();
		if (user) {
			return message.reply(`🫶 You booped ${user.username}!`);
		} else {
			return message.reply('🫶 You booped yourself. Self-care matters.');
		}
	},
};

export default command;
