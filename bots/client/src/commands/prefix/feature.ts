import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message } from 'discord.js';

const replies = [
	"✨ Feature added to backlog.txt (right under 'fix everything').",
	'🗂️ Added to the list. Expected release: 2099.',
	'🧠 Brilliant idea! We\'ll steal it immediately.',
	'🤝 Thanks! We\'ll totally pretend to consider it.',
	'🔮 Feature implemented in your dreams.',
];

const command: PrefixCommandInterface = {
	name: 'feature',
	description: 'Suggest a feature (for fun).',
	aliases: ['suggest', 'idea'],
	usage: 's?feature <idea>',
	cooldown: 5,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message, args: string[]) {
		if (!args.length) return message.reply('💡 You need to suggest something!');
		const reply = replies[Math.floor(Math.random() * replies.length)];
		return message.reply(reply);
	},
};

export default command;
