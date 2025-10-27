import { SlashCommandInterface } from '@projectdiscord/shared';
import { BaseClient, logger, sendGuildActionLog } from '@projectdiscord/core';
import {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	TextChannel,
} from 'discord.js';
import * as discordTranscripts from 't4discordjs';
import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { GuildCategory } from '@prisma/client';

const command: SlashCommandInterface = {
	cooldown: 3,
	isDeveloperOnly: true,
	data: new SlashCommandBuilder()
		.setName('reports')
		.setDescription('Manage user reports in Watchdog.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addSubcommand((sub) => sub.setName('list').setDescription('View currently open reports'))
		.addSubcommand((sub) =>
			sub
				.setName('close')
				.setDescription('Close and archive a report')
				.addIntegerOption((opt) => opt.setName('id').setDescription('Report ID').setRequired(true))
				.addStringOption((opt) => opt.setName('reason').setDescription('Reason for closing').setRequired(true)),
		)
		.addSubcommand((sub) =>
			sub
				.setName('delete')
				.setDescription('Delete a report and its associated channel')
				.addIntegerOption((opt) => opt.setName('id').setDescription('Report ID').setRequired(true)),
		),

	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		const sub = interaction.options.getSubcommand();
		await interaction.deferReply({ flags: ['Ephemeral'] });

		if (sub === 'list') {
			const reports = await client.prisma.report.findMany({
				where: { status: 'OPEN' },
				take: 5,
				orderBy: { createdAt: 'desc' },
			});

			if (!reports.length)
				return interaction.editReply({
					content: '`✅` There are currently no open reports.',
				});

			const embed = new EmbedBuilder()
				.setTitle('📋 Active Reports')
				.setColor(client.config.colors.warning)
				.setDescription(
					reports
						.map(
							(r) =>
								`**Report \`#${r.id}\`** — ${r.reportedUser}\n**Reason:** ${r.reason}\n🕒 ${r.createdAt.toLocaleString()}`,
						)
						.join('\n\n'),
				)
				.setFooter({ text: 'Showing the 5 most recent open reports' });

			return interaction.editReply({ embeds: [embed] });
		}

		if (sub === 'close') {
			const id = interaction.options.getInteger('id', true);
			const reason = interaction.options.getString('reason', true);

			const report = await client.prisma.report.findUnique({ where: { id } });
			if (!report)
				return interaction.editReply({
					content: `\`⚠️\` No report found with ID **#${id}**.`,
				});

			const channel = client.channels.cache.get(report.channelId!) as TextChannel;
			if (channel && channel.isTextBased()) {
				await interaction.editReply({
					content: `\`⌛\` Archiving **Report #${id}** and generating a transcript...`,
				});

				const transcriptId = nanoid(9);
				const transcriptFile = `report-${transcriptId}.html`;
				const transcriptDir = path.join(process.cwd(), 'transcripts');
				if (!fs.existsSync(transcriptDir)) fs.mkdirSync(transcriptDir);

				const attachment = await discordTranscripts.createTranscript(channel, {
					limit: -1,
					returnType: discordTranscripts.ExportReturnType.Buffer,
					filename: `report-${id}-transcript.html`,
					footerText: 'Exported {number} message{s}',
					DisableTranscriptLogs: true,
					FileConfig: {
						SaveAttachments: true,
						SaveExternalEmojis: true,
						SaveStickers: true,
						AttachmentOptions: {
							FetchAttachmentFiles: true,
						},
						ExternalEmojiOptions: {
							SaveReactionEmojis: true,
							SaveComponentEmojis: true,
							SaveMessageEmojis: true,
						},
					},
					callbacks: {
						resolveChannel: async (id) => channel.client.channels.fetch(id).catch(() => null),
						resolveUser: async (id) => channel.client.users.fetch(id).catch(() => null),
						resolveRole: channel.isDMBased()
							? () => null
							: async (id) => channel.guild?.roles.fetch(id).catch(() => null),
					},
					Language: 'English',
					poweredBy: false,
					useNewCSS: false,
					headerText: `📁 Watchdog Report #${id} | Exported {date}`,
					headerColor: 'white',
					hydrate: false,
				});

				const transcriptPath = path.join(transcriptDir, transcriptFile);
				fs.writeFileSync(transcriptPath, attachment);

				await client.prisma.report.update({
					where: { id },
					data: {
						status: 'CLOSED',
						closedBy: interaction.user.username,
						closedReason: reason,
						closedAt: new Date(),
						transcriptId,
					},
				});

				await channel.send({
					content: `\`📁\` This report has been **closed** by **${interaction.user.username}**.\n**Reason:** ${reason}\nTranscript saved as \`${transcriptFile}\`.\n\nThis channel will be deleted automatically in **30 seconds**.`,
				});

				setTimeout(async () => {
					try {
						await channel.delete(`Report #${id} closed by ${interaction.user.username}`);
					} catch (err) {
						logger.error(`Failed to delete report channel #${report.channelId}:`, err);
					}
				}, 30000);

				await sendGuildActionLog(client, {
					description: `**${interaction.user.username}** (${interaction.user.id}) closed **Report #${id}**.\n**Reason:** ${reason}`,
					color: client.config.colors.primary as unknown as string,
					category: GuildCategory.HEAD_SUPPORT,
				});

				return interaction.followUp({
					content: `\`✅\` Report **#${id}** has been successfully **closed and archived**.\nTranscript file: \`${transcriptFile}\`.`,
					flags: ['Ephemeral'],
				});
			} else {
				await client.prisma.report.update({
					where: { id },
					data: {
						status: 'CLOSED',
						closedBy: interaction.user.username,
						closedReason: reason,
						closedAt: new Date(),
					},
				});

				return interaction.editReply({
					content: `\`✅\` Report **#${id}** has been **closed** (no active channel found).`,
				});
			}
		}

		if (sub === 'delete') {
			const id = interaction.options.getInteger('id', true);
			const report = await client.prisma.report.findUnique({ where: { id } });

			if (!report)
				return interaction.editReply({
					content: `\`⚠️\` No report found with ID **#${id}**.`,
				});

			const channel = client.channels.cache.get(report.channelId!) as TextChannel | undefined;
			if (channel) {
				try {
					await channel.delete(`Report #${id} deleted by ${interaction.user.username}`);
				} catch (err) {
					logger.warn(`Could not delete channel for report #${id}:`, err);
				}
			}

			await client.prisma.report.delete({ where: { id } });

			await sendGuildActionLog(client, {
				description: `**${interaction.user.username}** (${interaction.user.id}) permanently deleted **Report #${id}**.`,
				color: client.config.colors.error as unknown as string,
				category: GuildCategory.HEAD_SUPPORT,
			});

			return interaction.editReply({
				content: `\`🗑️\` Report **#${id}** and its associated channel have been **permanently deleted**.`,
			});
		}
	},
};

export default command;
