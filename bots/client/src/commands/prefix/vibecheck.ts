import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message } from 'discord.js';

const vibes = [
	'✅ Certified chill 😎',
	'🚫 Error 404: Vibes not found.',
	'🌈 Vibe level: cosmic.',
	'⚠️ Vibe instability detected.',
	'💫 Your aura is immaculate today.',
];

const command: PrefixCommandInterface = {
	name: 'vibecheck',
	description: 'Checks your current vibe.',
	aliases: ['vibe', 'checkvibes'],
	usage: 's?vibecheck',
	cooldown: 3,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message) {
		const vibe = vibes[Math.floor(Math.random() * vibes.length)];
		return message.reply(vibe);
	},
};

export default command;
