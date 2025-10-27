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
import { GuildCategory, AppealStatus } from '@prisma/client';

const command: SlashCommandInterface = {
	cooldown: 3,
	isDeveloperOnly: true,
	data: new SlashCommandBuilder()
		.setName('appeals')
		.setDescription('Manage user appeals submitted through Watchdog.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addSubcommand((sub) => sub.setName('list').setDescription('List all pending appeals'))
		.addSubcommand((sub) =>
			sub
				.setName('review')
				.setDescription('Review and resolve a pending appeal')
				.addIntegerOption((opt) => opt.setName('id').setDescription('Appeal ID').setRequired(true))
				.addStringOption((opt) =>
					opt
						.setName('decision')
						.setDescription('Review decision')
						.setRequired(true)
						.addChoices({ name: '✅ Approve', value: 'APPROVED' }, { name: '❌ Deny', value: 'DENIED' }),
				)
				.addStringOption((opt) =>
					opt.setName('response').setDescription('Response or justification to the user').setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('delete')
				.setDescription('Delete an appeal record')
				.addIntegerOption((opt) => opt.setName('id').setDescription('Appeal ID').setRequired(true)),
		),

	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		const sub = interaction.options.getSubcommand();
		await interaction.deferReply({ flags: ['Ephemeral'] });

		if (sub === 'list') {
			const appeals = await client.prisma.appeal.findMany({
				where: { status: 'PENDING' },
				take: 5,
				orderBy: { createdAt: 'desc' },
			});

			if (!appeals.length)
				return interaction.editReply({
					content: '`✅` There are no pending appeals.',
				});

			const embed = new EmbedBuilder()
				.setTitle('📋 Pending Appeals')
				.setColor(client.config.colors.warning)
				.setDescription(
					appeals
						.map(
							(a) =>
								`**\`#${a.id}\`** — ${a.username || a.userId}\n**Reason:** ${a.reason}\n**Status:** ${a.status}\n\`🕒\` ${a.createdAt.toLocaleString()}`,
						)
						.join('\n\n'),
				);

			return interaction.editReply({ embeds: [embed] });
		}

		if (sub === 'review') {
			const id = interaction.options.getInteger('id', true);
			const decision = interaction.options.getString('decision', true) as AppealStatus;
			const response = interaction.options.getString('response', true);

			const appeal = await client.prisma.appeal.findUnique({ where: { id } });
			if (!appeal)
				return interaction.editReply({
					content: `\`⚠️\` No appeal found with ID **${id}**.`,
				});

			if (appeal.status !== 'PENDING')
				return interaction.editReply({
					content: `\`⚠️\` Appeal **#${id}** has already been reviewed.`,
				});

			const channel = client.channels.cache.get(appeal.channelId!) as TextChannel | undefined;
			if (channel && channel.isTextBased()) {
				await interaction.editReply({
					content: `\`⌛\` Processing **Appeal #${id}** and generating transcript...`,
				});

				const transcriptId = crypto.randomUUID().slice(0, 9);
				const transcriptFile = `appeal-${transcriptId}.html`;
				const transcriptDir = path.join(process.cwd(), 'transcripts');
				if (!fs.existsSync(transcriptDir)) fs.mkdirSync(transcriptDir);

				const attachment = await discordTranscripts.createTranscript(channel, {
					limit: -1,
					returnType: discordTranscripts.ExportReturnType.Buffer,
					filename: transcriptFile,
					footerText: 'Exported {number} message{s}',
					DisableTranscriptLogs: true,
					FileConfig: {
						SaveAttachments: true,
						SaveExternalEmojis: true,
						SaveStickers: true,
						AttachmentOptions: { FetchAttachmentFiles: true },
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
					headerText: `📁 Watchdog Appeal #${id} | Exported {date}`,
					headerColor: 'white',
					hydrate: false,
				});

				const transcriptPath = path.join(transcriptDir, transcriptFile);
				fs.writeFileSync(transcriptPath, attachment);

				await client.prisma.appeal.update({
					where: { id },
					data: {
						status: decision,
						reviewedBy: interaction.user.username,
						reviewedAt: new Date(),
						response,
						transcriptId,
					},
				});

				await channel.send({
					content: `\`📁\` This appeal has been **${decision.toLowerCase()}** by **${interaction.user.username}**.\n**Response:** ${response}\nTranscript saved as \`${transcriptFile}\`.\n\nThis channel will be deleted automatically in **30 seconds**.`,
				});

				setTimeout(async () => {
					try {
						await channel.delete(`Appeal #${id} reviewed by ${interaction.user.username}`);
					} catch (err) {
						logger.error(`Failed to delete appeal channel #${appeal.channelId}:`, err);
					}
				}, 30000);

				await sendGuildActionLog(client, {
					description: `Appeal \`#${id}\` reviewed by **${interaction.user.username}**.\n**Decision:** ${decision}\n**Response:** ${response}`,
					color:
						decision === 'APPROVED'
							? (client.config.colors.success as unknown as string)
							: (client.config.colors.error as unknown as string),
					category: GuildCategory.HEAD_SUPPORT,
				});

				return interaction.followUp({
					content: `\`✅\` Appeal **#${id}** has been marked as **${decision}** and archived.\nTranscript file: \`${transcriptFile}\`.`,
					flags: ['Ephemeral'],
				});
			}

			await client.prisma.appeal.update({
				where: { id },
				data: {
					status: decision,
					reviewedBy: interaction.user.username,
					reviewedAt: new Date(),
					response,
				},
			});

			await sendGuildActionLog(client, {
				description: `Appeal \`#${id}\` reviewed by **${interaction.user.username}**.\n**Decision:** ${decision}\n**Response:** ${response}`,
				color:
					decision === 'APPROVED'
						? (client.config.colors.success as unknown as string)
						: (client.config.colors.error as unknown as string),
				category: GuildCategory.HEAD_SUPPORT,
			});

			return interaction.editReply({
				content: `\`✅\` Appeal **#${id}** has been marked as **${decision}** (no active channel found).`,
			});
		}

		if (sub === 'delete') {
			const id = interaction.options.getInteger('id', true);
			const appeal = await client.prisma.appeal.findUnique({ where: { id } });

			if (!appeal)
				return interaction.editReply({
					content: `\`⚠️\` No appeal found with ID **${id}**.`,
				});

			const channel = client.channels.cache.get(appeal.channelId!) as TextChannel | undefined;
			if (channel) {
				try {
					await channel.delete(`Appeal #${id} deleted by ${interaction.user.username}`);
				} catch (err) {
					logger.warn(`Could not delete channel for appeal #${id}:`, err);
				}
			}

			await client.prisma.appeal.delete({ where: { id } });

			await sendGuildActionLog(client, {
				description: `Appeal \`#${id}\` deleted by **${interaction.user.username}**.`,
				color: client.config.colors.primary as unknown as string,
				category: GuildCategory.HEAD_SUPPORT,
			});

			return interaction.editReply({
				content: `\`🗑️\` Appeal **#${id}** has been **deleted**.`,
			});
		}
	},
};

export default command;
