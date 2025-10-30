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

const REPORT_CATEGORY_ID = process.env.REPORT_CATEGORY_ID as string;
const REPORT_STAFF_IDs = [process.env.REPORT_STAFF_ROLE_ID as string, process.env.STACHIO_STAFF_ROLE_ID as string];

const event: EventInterface<'interactionCreate'> = {
	name: 'interactionCreate',
	options: { once: false, rest: false },
	async execute(client: BaseClient, interaction: ModalSubmitInteraction) {
		try {
			if (!interaction.isModalSubmit()) return;

			if (interaction.customId === 'reportModal') {
				await interaction.deferReply({ flags: ['Ephemeral'] });

				const reportedUser = interaction.fields.getTextInputValue('reportedUser')!;
				if (!reportedUser) {
					return interaction.editReply({
						content: '`⚠️` No user id was provided in the report form.',
					});
				}
				const user = await client.users.fetch(reportedUser).catch(() => null);
				if (!user) return interaction.editReply({ content: '`❌` Invalid user ID.' });

				const reason = interaction.fields.getTextInputValue('reason');
				const evidence = interaction.fields.getTextInputValue('evidence');

				const guild = interaction.guild;
				if (!guild) {
					return interaction.editReply({
						content: '`❌` This command can only be used inside a server.',
					});
				}

				const category = guild.channels.cache.get(REPORT_CATEGORY_ID) as CategoryChannel | undefined;
				if (!category || category.type !== ChannelType.GuildCategory) {
					return interaction.editReply({
						content: '`⚠️` Report category not found or invalid. Please check configuration.',
					});
				}

				const channelName = `report-${interaction.user.username}-${user.username}`.toLowerCase();

				const reportChannel = await guild.channels.create({
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
						...REPORT_STAFF_IDs.map((id) => ({
							id,
							allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
						})),
					],
					reason: `Report created by ${interaction.user.username}`,
				});

				const report = await prisma.report.create({
					data: {
						reporterId: interaction.user.id,
						reporterUsername: interaction.user.username,
						reportedUser: user.id,
						reason,
						evidence,
						channelId: reportChannel.id,
					},
				});

				const embed = new EmbedBuilder()
					.setColor(client.config.colors.error)
					.setTitle('New Report Submitted')
					.setDescription('A new user report has been filed and requires staff review.')
					.addFields({
						name: 'Report Information',
						value: [
							`> **Report ID:** ${report.id}`,
							`> **Reporter:** ${userMention(interaction.user.id)}`,
							`> **Reported User:** ${userMention(user.id)}`,
							`> **Reason:** ${reason?.trim() || 'No reason provided.'}`,
							`> **Evidence:** ${evidence?.trim() || 'No evidence provided.'}`,
						].join('\n'),
					})
					.setTimestamp()
					.setFooter({
						text: `Submitted by ${interaction.user.username}`,
						iconURL: interaction.user.displayAvatarURL(),
					});

				await (reportChannel as TextChannel).send({
					content: `${roleMention(process.env.REPORT_STAFF_ROLE_ID!)} ${userMention(interaction.user.id)}`,
					embeds: [embed],
				});

				await interaction.editReply({
					content: `\`✅\` Your report has been submitted successfully. A staff member will review it shortly. Your report is in ${channelMention(reportChannel.id)}.`,
				});
			}

			if (interaction.customId === 'appealModal') {
				const caseId = interaction.fields.getTextInputValue('caseId');
				const reason = interaction.fields.getTextInputValue('reason');
				const evidence = interaction.fields.getTextInputValue('evidence');

				await prisma.appeal.create({
					data: {
						userId: interaction.user.id,
						username: interaction.user.username,
						reason,
						evidence,
					},
				});

				await interaction.reply({
					content: '`📨` Your appeal has been submitted and will be reviewed soon.',
					flags: ['Ephemeral'],
				});
			}
		} catch (error) {
			logger.error('Error handling modal submission:', error);
			if (interaction.isRepliable()) {
				await interaction.reply({
					content: '`❌` An unexpected error occurred while processing your submission.',
					flags: ['Ephemeral'],
				});
			}
		}
	},
};

export default event;
