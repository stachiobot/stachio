import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message } from 'discord.js';

const replies = [
	'🪲 Bug reported! Our interns will look into it... eventually.',
	"🐛 Thanks! We've labeled it 'won't fix' already.",
	"🤖 Bug logged to the void. It's gone forever.",
	'⚠️ Error 404: Motivation not found.',
	'✅ Thanks for reporting! Totally not ignoring this.',
];

const command: PrefixCommandInterface = {
	name: 'bugreport',
	description: 'Report a bug (not really).',
	aliases: ['bug', 'issue'],
	usage: 's?bugreport <description>',
	cooldown: 5,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message, args: string[]) {
		const reply = replies[Math.floor(Math.random() * replies.length)];
		return message.reply(reply);
	},
};

export default command;
