import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message } from 'discord.js';

const command: PrefixCommandInterface = {
	name: 'uptime',
	description: "Displays Stachio's fake uptime.",
	aliases: ['status', 'online'],
	usage: 's?uptime',
	cooldown: 3,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message) {
		return message.reply('⚡ Stachio uptime: 100% — as always 😎');
	},
};

export default command;
