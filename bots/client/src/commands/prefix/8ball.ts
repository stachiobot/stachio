import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message } from 'discord.js';

const responses = [
	'It is certain.',
	'Without a doubt.',
	'You may rely on it.',
	'Ask again later.',
	'Better not tell you now.',
	'My sources say no.',
	'Very doubtful.',
	'Absolutely not.',
	'Of course!',
	'Nah, not happening.',
];

const command: PrefixCommandInterface = {
	name: '8ball',
	description: 'Ask the magic 8-ball a question.',
	aliases: ['ball', 'fortune'],
	usage: 's?8ball <question>',
	cooldown: 5,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message, args: string[]) {
		if (!args.length) return message.reply('🎱 You need to ask a question!');
		const answer = responses[Math.floor(Math.random() * responses.length)];
		return message.reply(`🎱 ${answer}`);
	},
};

export default command;
