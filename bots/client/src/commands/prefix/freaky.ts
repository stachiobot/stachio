import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message } from 'discord.js';

const freakyLinesSelf = [
	'😉 You just freakied yourself... self-love is powerful!',
	'😏 Feeling bold today, huh? Freakying yourself counts!',
	'🔥 You gave yourself a little flirt boost. Respect.',
	'💋 Self-freaky mode activated. Confidence level: 100.',
	'💞 Sometimes you gotta flirt with yourself first.',
];

const freakyLinesOther = [
	'😳 You just sent some freaky vibes to {user}...',
	'💋 {user}, you\'ve been blessed with a friendly flirt!',
	'🔥 {user}, someone couldn\'t resist your energy.',
	'😉 {user}, things just got a little... interesting.',
	'💞 {user}, looks like you\'re someone\'s favorite today.',
];

const command: PrefixCommandInterface = {
	name: 'freaky',
	description: 'Send a fun, flirty (PG-friendly) vibe to someone.',
	aliases: ['flirt', 'vibe'],
	usage: 's?freaky [@user]',
	cooldown: 5,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message) {
		const user = message.mentions.users.first();

		if (user) {
			const line = freakyLinesOther[Math.floor(Math.random() * freakyLinesOther.length)];
			return message.reply(line.replace('{user}', user.toString()));
		} else {
			const line = freakyLinesSelf[Math.floor(Math.random() * freakyLinesSelf.length)];
			return message.reply(line);
		}
	},
};

export default command;
