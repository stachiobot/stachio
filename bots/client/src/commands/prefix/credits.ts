import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { Message, EmbedBuilder, userMention } from 'discord.js';

const command: PrefixCommandInterface = {
	name: 'credits',
	description: 'Show the Stachio credits and contributors.',
	aliases: ['team', 'devs'],
	usage: 's?credits',
	cooldown: 5,
	isDeveloperOnly: false,
	async execute(client: BaseClient, message: Message) {
		const duckodas = await client.users.fetch('711712752246325343');
		const scarlot = await client.users.fetch('483357154502377473');
		const embed = new EmbedBuilder()
			.setTitle('💚 Stachio Credits')
			.setDescription(
				[
					`**Developers:**`,
					`${userMention(duckodas.id)} (${duckodas.username})`,
					`${userMention(scarlot.id)} (${scarlot.username})`,
					`**Community:** Project Partners & Supporters`,
					`**Framework:** Built with ❤️ using Discord.js & TypeScript`,
				].join('\n'),
			)
			.setFooter({ text: 'Thanks for helping Stachio grow 🌿' })
			.setColor(client.config.colors.primary);
		return message.reply({ embeds: [embed] });
	},
};

export default command;
