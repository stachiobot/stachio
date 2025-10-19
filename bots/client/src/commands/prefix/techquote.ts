import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message } from 'discord.js';

const quotes = [
	'"It works on my machine." - Every Developer Ever',
	'"Commit messages are just modern poetry." - Unknown',
	'"There is no cloud. It\'s just someone else\'s computer."',
	'"sudo make me a sandwich."',
	'"Debugging is like being the detective in a crime movie where you\'re also the murderer."',
];

const command: PrefixCommandInterface = {
	name: 'techquote',
	description: 'Replies with a funny developer quote.',
	aliases: ['devquote', 'codequote'],
	usage: 's?techquote',
	cooldown: 4,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message) {
		const quote = quotes[Math.floor(Math.random() * quotes.length)];
		return message.reply(`💻 ${quote}`);
	},
};

export default command;
