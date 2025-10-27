import {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	ModalBuilder,
	TextInputStyle,
	TextDisplayBuilder,
	LabelBuilder,
	ComponentType,
	PermissionFlagsBits,
	StringSelectMenuOptionBuilder,
} from 'discord.js';
import { BaseClient } from '@projectdiscord/core';
import { SlashCommandInterface } from '@projectdiscord/shared';

const command: SlashCommandInterface = {
	cooldown: 10,
	isDeveloperOnly: false,
	data: new SlashCommandBuilder()
		.setName('appeal')
		.setDescription('Submit an appeal for a moderation action through Watchdog.')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		const requiredGuild = client.guilds.cache.get(client.config.guilds[0].id);
		if (!requiredGuild) {
			return interaction.reply({
				content: '`⚠️` The main guild is not accessible. Please contact staff if this issue persists.',
				flags: ['Ephemeral'],
			});
		}

		const member = await requiredGuild.members.fetch(interaction.user.id).catch(() => null);
		if (!member) {
			return interaction.reply({
				content: '`❌` You must be a verified member of the main server to submit a report.',
				flags: ['Ephemeral'],
			});
		}

		const modal = new ModalBuilder().setCustomId('watchdogAppealModal').setTitle('🐾 Watchdog Appeal Submission');

		modal.addTextDisplayComponents(
			new TextDisplayBuilder({
				content:
					'Please provide as much detail as possible. Watchdog appeals are reviewed manually by the moderation team.\n\n⚠️ False or troll appeals may result in disciplinary action.',
			}),
		);

		modal.addLabelComponents(
			new LabelBuilder({
				label: 'Punishment Type',
				component: {
					type: ComponentType.StringSelect,
					custom_id: 'punishmentType',
					placeholder: 'Select the punishment type...',
					required: true,
					options: [
						new StringSelectMenuOptionBuilder()
							.setLabel('Temporary')
							.setValue('temporary')
							.setDescription('Temporary ban.')
							.toJSON(),
						new StringSelectMenuOptionBuilder()
							.setLabel('Indefinite')
							.setValue('indefinite')
							.setDescription('Indefinite')
							.toJSON(),
					],
				},
			}),
			new LabelBuilder({
				label: 'Date or Time of Punishment',
				component: {
					type: ComponentType.TextInput,
					custom_id: 'punishmentDate',
					style: TextInputStyle.Short,
					required: false,
					placeholder: 'Example: October 25, 2025 (optional)',
				},
			}),
			new LabelBuilder({
				label: 'Reason for Appeal',
				component: {
					type: ComponentType.TextInput,
					custom_id: 'appealReason',
					style: TextInputStyle.Paragraph,
					required: true,
					placeholder: 'Explain why your punishment should be reconsidered...',
				},
			}),
			new LabelBuilder({
				label: 'Additional Context or Evidence',
				component: {
					type: ComponentType.TextInput,
					custom_id: 'appealEvidence',
					style: TextInputStyle.Paragraph,
					required: false,
					placeholder: 'Provide any relevant proof, links, or screenshots.',
				},
			}),
		);

		await interaction.showModal(modal);
	},
};

export default command;
