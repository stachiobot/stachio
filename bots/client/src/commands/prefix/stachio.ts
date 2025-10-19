import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message } from 'discord.js';

const facts = [
	'🌿 Stachio runs on pure caffeine and good vibes.',
	'🔥 Fun fact: 99% uptime, 1% mysterious maintenance.',
	'⚙️ Built by devs, for servers that *actually care*.',
	'💚 Stachio believes in partnerships, not ads.',
	'🪴 Growing communities, one integration at a time.',
];

const command: PrefixCommandInterface = {
	name: 'stachio',
	description: 'Get a fun Stachio fact or tagline.',
	aliases: ['info', 'fact'],
	usage: 's?stachio',
	cooldown: 3,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message) {
		const reply = facts[Math.floor(Math.random() * facts.length)];
		return message.reply(reply);
	},
};

export default command;
