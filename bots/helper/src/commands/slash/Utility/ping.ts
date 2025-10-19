import { SlashCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

const command: SlashCommandInterface = {
	cooldown: 2,
	isDeveloperOnly: false,
	data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });
		return interaction.editReply({ content: '🏓 Pong!' });
	},
};

export default command;
