import {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	ModalBuilder,
	TextInputStyle,
	TextDisplayBuilder,
	LabelBuilder,
	ComponentType,
} from 'discord.js';
import { BaseClient } from '@projectdiscord/core';
import { SlashCommandInterface } from '@projectdiscord/shared';

const command: SlashCommandInterface = {
	cooldown: 10,
	isDeveloperOnly: false,

	data: new SlashCommandBuilder().setName('report').setDescription('Submit a report about a user.'),

	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		const modal = new ModalBuilder().setCustomId('reportModal').setTitle('Submit a User Report');

		modal.addTextDisplayComponents(
			new TextDisplayBuilder({
				content: 'Please fill out all fields truthfully and clearly.',
			}),
		);

		modal.addLabelComponents(
			new LabelBuilder({
				label: 'Reported User (User ID)',
				component: {
					type: ComponentType.TextInput,
					custom_id: 'reportedUser',
					style: TextInputStyle.Short,
					required: true,
					placeholder: 'Example: 123456789012345678',
				},
			}),
			new LabelBuilder({
				label: 'Reason for Report',
				component: {
					type: ComponentType.TextInput,
					custom_id: 'reason',
					style: TextInputStyle.Paragraph,
					required: true,
					placeholder: 'Explain what happened in details...',
				},
			}),
			new LabelBuilder({
				label: 'Evidence (links, screenshots, etc.)',
				component: {
					type: ComponentType.TextInput,
					custom_id: 'evidence',
					style: TextInputStyle.Paragraph,
					required: false,
					placeholder: 'Provide links, image URLs, or text evidence.',
				},
			}),
		);

		await interaction.showModal(modal);
	},
};

export default command;
