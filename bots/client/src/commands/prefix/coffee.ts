import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message } from 'discord.js';

const boosts = [
	'☕ You sip your coffee... productivity +10!',
	'🪫 No coffee left. You feel an existential dread.',
	'🥤 You drink an iced latte. You feel unstoppable.',
	'🔥 Coffee overdose! You code an entire feature in 3 minutes.',
	'🧋 Stachio Latte™ — now available in /dev/null!',
];

const command: PrefixCommandInterface = {
	name: 'coffee',
	description: 'Get a virtual Stachio coffee boost.',
	aliases: ['latte', 'caffeine'],
	usage: 's?coffee',
	cooldown: 3,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message) {
		const result = boosts[Math.floor(Math.random() * boosts.length)];
		return message.reply(result);
	},
};

export default command;
