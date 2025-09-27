import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message } from 'discord.js';

const command: PrefixCommandInterface = {
	name: 'ping',
	description: 'Replies with Pong!',
	aliases: ['p'],
	usage: '!ping',
	cooldown: 3,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message) {
		return message.reply('🏓 Pong!');
	},
};

export default command;
