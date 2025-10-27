import {
	ModalSubmitInteraction,
	PermissionFlagsBits,
	TextChannel,
	CategoryChannel,
	ChannelType,
	EmbedBuilder,
	userMention,
	roleMention,
	channelMention,
} from 'discord.js';
import { EventInterface } from '@projectdiscord/shared';
import { BaseClient, logger } from '@projectdiscord/core';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const APPEAL_CATEGORY_ID = process.env.APPEAL_CATEGORY_ID as string;
const APPEAL_STAFF_ROLE_ID = process.env.APPEAL_STAFF_ROLE_ID as string;
const STACHIO_STAFF_ROLE_ID = process.env.STACHIO_STAFF_ROLE_ID as string;

const event: EventInterface<'interactionCreate'> = {
	name: 'interactionCreate',
	options: { once: false, rest: false },
	async execute(client: BaseClient, interaction: ModalSubmitInteraction) {
		try {
			if (!interaction.isModalSubmit()) return;

			if (interaction.customId === 'watchdogAppealModal') {
				await interaction.deferReply({ flags: ['Ephemeral'] });

				const punishmentType = interaction.fields.getStringSelectValues('punishmentType');
				const punishmentDate = interaction.fields.getTextInputValue('punishmentDate');
				const appealReason = interaction.fields.getTextInputValue('appealReason');
				const appealEvidence = interaction.fields.getTextInputValue('appealEvidence');

				const guild = interaction.guild;
				if (!guild) {
					return interaction.editReply({
						content: '`❌` This command can only be used inside a server.',
					});
				}

				// Verify category for appeals
				const category = guild.channels.cache.get(APPEAL_CATEGORY_ID) as CategoryChannel | undefined;
				if (!category || category.type !== ChannelType.GuildCategory) {
					return interaction.editReply({
						content: '`⚠️` Appeal category not found or invalid. Please check configuration.',
					});
				}

				// Create appeal thread channel
				const channelName = `appeal-${interaction.user.username}-${punishmentType}`.toLowerCase();

				const appealChannel = await guild.channels.create({
					name: channelName.slice(0, 90),
					type: ChannelType.GuildText,
					parent: category.id,
					permissionOverwrites: [
						{
							id: guild.roles.everyone,
							deny: [PermissionFlagsBits.ViewChannel],
						},
						{
							id: interaction.user.id,
							allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
						},
						{
							id: APPEAL_STAFF_ROLE_ID,
							allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
						},
						{
							id: STACHIO_STAFF_ROLE_ID,
							allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
						},
					],
					reason: `Appeal submitted by ${interaction.user.username}`,
				});

				// Save to database
				const appeal = await prisma.appeal.create({
					data: {
						userId: interaction.user.id,
						username: interaction.user.username,
						guildId: guild.id,
						reason: appealReason,
						evidence: appealEvidence,
						channelId: appealChannel.id,
					},
				});

				const embed = new EmbedBuilder()
					.setColor(client.config.colors.primary)
					.setTitle('🐾 New Watchdog Appeal Submitted')
					.setDescription('A new appeal has been submitted and requires staff review.')
					.addFields({
						name: 'Appeal Information',
						value: [
							`> **Appeal ID:** ${appeal.id}`,
							`> **User:** ${userMention(interaction.user.id)}`,
							`> **Punishment Type:** ${punishmentType || 'N/A'}`,
							`> **Punishment Date:** ${punishmentDate?.trim() || 'Not provided'}`,
							`> **Reason for Appeal:** ${appealReason?.trim() || 'No reason provided.'}`,
							`> **Evidence:** ${appealEvidence?.trim() || 'No evidence provided.'}`,
						].join('\n'),
					})
					.setTimestamp()
					.setFooter({
						text: `Submitted by ${interaction.user.username}`,
						iconURL: interaction.user.displayAvatarURL(),
					});

				await (appealChannel as TextChannel).send({
					content: `${roleMention(APPEAL_STAFF_ROLE_ID)} ${userMention(interaction.user.id)}`,
					embeds: [embed],
				});

				await interaction.editReply({
					content: `\`✅\` Your appeal has been submitted successfully. A staff member will review it shortly.\nYou can follow your appeal here: ${channelMention(appealChannel.id)}.`,
				});
			}
		} catch (error) {
			logger.error('Error handling appeal modal submission:', error);
			if (interaction.isRepliable()) {
				await interaction.reply({
					content: '`❌` An unexpected error occurred while processing your appeal submission.',
					flags: ['Ephemeral'],
				});
			}
		}
	},
};

export default event;
