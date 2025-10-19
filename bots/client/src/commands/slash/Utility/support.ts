import { SlashCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} from 'discord.js';

const command: SlashCommandInterface = {
	cooldown: 5,
	isDeveloperOnly: false,
	data: new SlashCommandBuilder().setName('support').setDescription('Support the project & unlock premium features ✨'),
	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });

		const description = [
			'**Support the Project & Unlock Premium Perks!**',
			'Choose a tier below and help us keep developing amazing features for you.',
			'',
			'**`💠`** **Silver - €4.99 / Monthly**',
			'**`・`** Automated scans every **3 days**',
			'**`・`** **75 blacklist checks** per week',
			'**`・`** Standard support',
			'',
			'**`🥇`** **Gold - €9.99 / Monthly**',
			'**`・`** Automated scans **every day**',
			'**`・`** **125 blacklist checks** per week',
			'**`・`** Full API access',
			'**`・`** Priority support',
			'',
			'**`🏆`** **Platinum - €14.99 / Monthly**',
			'**`・`** Automated scans **every 12 hours**',
			'**`・`** **Unlimited blacklist checks**',
			'**`・`** Full API access',
			'**`・`** Dedicated support',
			'',
			'**`💎`** **Platinum Lifetime - €99.99 one-time**',
			'**`・`** Pay once, enjoy forever!',
			'**`・`** **Unlimited blacklist checks**',
			'**`・`** Automated scans **every 12 hours**',
			'**`・`** Full API access & dedicated support',
			'',
			'**`☕`** Prefer a one-time donation? Support us on [**Ko-fi**](https://ko-fi.com/duckodas) 💖',
			'',
			'**`🛒`** Or view all plans in our [**Store**](https://payrole.io/app/store?id=68dd974f163bff001237f1b9)',
		].join('\n');

		const embed = new EmbedBuilder()
			.setTitle('`🚀` Upgrade Your Protection Today!')
			.setDescription(description)
			.setColor(client.config.colors.primary || '#5865F2')
			.setThumbnail('https://cdn-icons-png.flaticon.com/512/2769/2769103.png')
			.setFooter({ text: 'Your support keeps the project alive 💙' });

		const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel('💠 Silver (€4.99)')
				.setStyle(ButtonStyle.Link)
				.setURL('https://payrole.io/checkout?package=68dd954f163bff001237df4f'),
			new ButtonBuilder()
				.setLabel('🥇 Gold (€9.99)')
				.setStyle(ButtonStyle.Link)
				.setURL('https://payrole.io/checkout?package=68dd96a4163bff001237eb42'),
			new ButtonBuilder()
				.setLabel('🏆 Platinum (€14.99)')
				.setStyle(ButtonStyle.Link)
				.setURL('https://payrole.io/checkout?package=68dd970c163bff001237f046'),
			new ButtonBuilder()
				.setLabel('💎 Platinum Lifetime (€99.99)')
				.setStyle(ButtonStyle.Link)
				.setURL('https://payrole.io/checkout?package=68dda3cd0687bb00139039d7'),
		);

		const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel('☕ Donate via Ko-fi')
				.setStyle(ButtonStyle.Link)
				.setURL('https://ko-fi.com/duckodas'),
			new ButtonBuilder()
				.setLabel('🛒 View Store')
				.setStyle(ButtonStyle.Link)
				.setURL('https://payrole.io/app/store?id=68dd974f163bff001237f1b9'),
		);

		return interaction.editReply({ embeds: [embed], components: [row1, row2] });
	},
};

export default command;
