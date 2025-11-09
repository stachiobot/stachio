import {
	PrismaClient,
	PunishmentType,
	UserCategory,
	UserType,
	BlacklistStatus,
	ReportStatus,
	AppealStatus,
} from '../../../prisma/stachio';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	GuildMember,
	PermissionsBitField,
	TextChannel,
} from 'discord.js';
import { permissionGuard, logger, config, BaseClient } from '../../index.js'; // adjust to your actual import paths
export const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// ⚙️ Guild Config
// ─────────────────────────────────────────────

export async function getOrCreateGuildConfig(guildId: string, guildName?: string) {
	return prisma.guildConfig.upsert({
		where: { guildId },
		update: { guildName },
		create: { guildId, guildName },
		include: { WatchdogConfig: true },
	});
}

export async function updateGuildConfig(
	guildId: string,
	data: Partial<{ guildName: string; language: string; errorLogChannelId: string }>,
) {
	return prisma.guildConfig.update({
		where: { guildId },
		data,
	});
}

export async function resetBlacklistUsage(guildId: string) {
	return prisma.guildConfig.update({
		where: { guildId },
		data: {
			blacklistCheckUsage: 0,
			blacklistCheckLastReset: new Date(),
		},
	});
}

// ─────────────────────────────────────────────
// 🐺 Watchdog Config
// ─────────────────────────────────────────────

export async function getOrCreateWatchdogConfig(guildId: string) {
	return prisma.watchdogConfig.upsert({
		where: { guildId },
		update: {},
		create: { guildId },
	});
}

export async function updateWatchdogPunishments(
	guildId: string,
	data: Partial<{
		generalPunishment: PunishmentType;
		fivemPunishment: PunishmentType;
		marketplacePunishment: PunishmentType;
		logChannelId: string;
		roleId: string;
	}>,
) {
	return prisma.watchdogConfig.update({
		where: { guildId },
		data,
	});
}

// ─────────────────────────────────────────────
// 🚫 Blacklist Users
// ─────────────────────────────────────────────

export async function getOrCreateBlacklistedUser(discordId: string, username: string) {
	return prisma.blacklistedUser.upsert({
		where: { discordId },
		update: { username },
		create: { discordId, username },
		include: { blacklists: true },
	});
}

export async function addBlacklistEntry(
	userDiscordId: string,
	data: {
		usercategory?: UserCategory;
		usertype?: UserType;
		status?: BlacklistStatus;
		community?: string;
		reason?: string;
		reportedBy?: string;
		evidence?: string;
		expiresAt?: Date;
	},
) {
	const user = await prisma.blacklistedUser.findUnique({ where: { discordId: userDiscordId } });
	if (!user) throw new Error(`User not found for blacklist entry: ${userDiscordId}`);

	return prisma.blacklistEntry.create({
		data: {
			userId: user.id,
			...data,
		},
	});
}

export async function getBlacklistEntries(discordId: string) {
	return prisma.blacklistedUser.findUnique({
		where: { discordId },
		include: { blacklists: true },
	});
}

export async function updateBlacklistEntry(
	id: number,
	data: Partial<{ reason: string; status: BlacklistStatus; active: boolean; expiresAt: Date }>,
) {
	return prisma.blacklistEntry.update({
		where: { id },
		data,
	});
}

export async function deactivateBlacklistEntry(id: number) {
	return prisma.blacklistEntry.update({
		where: { id },
		data: { active: false },
	});
}

// ─────────────────────────────────────────────
// 📋 Reports
// ─────────────────────────────────────────────

export async function createReport(data: {
	reporterId: string;
	reporterUsername: string;
	reportedUser: string;
	reason: string;
	evidence?: string;
	channelId?: string;
}) {
	return prisma.report.create({ data });
}

export async function closeReport(
	id: number,
	data: { closedBy: string; closedReason?: string; transcriptId?: string },
) {
	return prisma.report.update({
		where: { id },
		data: {
			status: ReportStatus.CLOSED,
			closedBy: data.closedBy,
			closedReason: data.closedReason,
			closedAt: new Date(),
			transcriptId: data.transcriptId,
		},
	});
}

export async function getOpenReports() {
	return prisma.report.findMany({ where: { status: ReportStatus.OPEN } });
}

export async function getReportByChannel(channelId: string) {
	return prisma.report.findUnique({ where: { channelId } });
}

// ─────────────────────────────────────────────
// 🙏 Appeals
// ─────────────────────────────────────────────

export async function createAppeal(data: {
	userId: string;
	username?: string;
	guildId?: string;
	reason: string;
	evidence?: string;
	channelId?: string;
}) {
	return prisma.appeal.create({ data });
}

export async function reviewAppeal(id: number, data: { reviewedBy: string; response: string; status: AppealStatus }) {
	return prisma.appeal.update({
		where: { id },
		data: {
			reviewedBy: data.reviewedBy,
			response: data.response,
			status: data.status,
			reviewedAt: new Date(),
		},
	});
}

export async function getAppealByChannel(channelId: string) {
	return prisma.appeal.findUnique({ where: { channelId } });
}

export async function getPendingAppeals() {
	return prisma.appeal.findMany({ where: { status: AppealStatus.PENDING } });
}

export async function checkBlacklist(discordId: string) {
	try {
		const user = await prisma.blacklistedUser.findUnique({
			where: { discordId },
			include: {
				blacklists: true,
			},
		});

		if (!user) return { isBlacklisted: false, user: null, activeEntries: [] };

		const activeEntries = user.blacklists.filter((entry) => entry.active);

		return {
			isBlacklisted: activeEntries.length > 0,
			user: {
				id: user.id,
				discordId: user.discordId,
				username: user.username,
			},
			activeEntries: activeEntries.map((e) => ({
				id: e.id,
				usercategory: e.usercategory,
				usertype: e.usertype,
				status: e.status,
				community: e.community,
				reason: e.reason,
				reportedBy: e.reportedBy,
				evidence: e.evidence,
				active: e.active,
				expiresAt: e.expiresAt,
				createdAt: e.createdAt,
				updatedAt: e.updatedAt,
			})),
		};
	} catch (err) {
		console.error('Error checking blacklist:', err);
		return { isBlacklisted: false, user: null, activeEntries: [] };
	}
}

export async function actionUser(client: BaseClient,member: GuildMember) {
	const user = await prisma.blacklistedUser.findUnique({
		where: { discordId: member.id },
		include: { blacklists: true },
	});
	if (!user) return;

	const guildConfig = await prisma.watchdogConfig.findUnique({ where: { guildId: member.guild.id } });
	if (!guildConfig) return;

	const activeEntries = user.blacklists.filter((e) => e.active);
	if (!activeEntries.length) return;

	const severity = { NONE: 0, WARN: 1, ROLE: 2, KICK: 3, BAN: 4 } as const;

	let hardestPunishment: PunishmentType = 'NONE';
	let hardestEntry = activeEntries[0];

	for (const entry of activeEntries) {
		let punishment: PunishmentType;

		switch (entry.usercategory) {
			case UserCategory.General:
				punishment = guildConfig.generalPunishment;
				break;
			case UserCategory.FiveM:
				punishment = guildConfig.fivemPunishment;
				break;
			case UserCategory.Marketplace:
				punishment = guildConfig.marketplacePunishment;
				break;
			default:
				punishment = 'NONE';
		}

		if (severity[punishment] > severity[hardestPunishment]) {
			hardestPunishment = punishment;
			hardestEntry = entry;
		}

		if (hardestPunishment === 'NONE') return;

		const reason = `Blacklisted under ${hardestEntry.usercategory}${hardestEntry.reason ? hardestEntry.reason : ' '}`;
		const last5 = user.blacklists.slice(-5);

		try {
			await member.send({ embeds: [], components: [] }).catch(() => null);

			const botMember = await member.guild.members.fetchMe();

			if (hardestPunishment === 'ROLE' && guildConfig.roleId) {
				const role = member.guild.roles.cache.get(guildConfig.roleId);
				if (!role) return;

				const check = await permissionGuard({
					action: `Watchdog: action user (Role) ${member.user.username}`,
					botMember,
					targetMember: member,
					targetRole: role,
					requiredPerms: [PermissionsBitField.Flags.ManageRoles],
				});
				if (check !== true) return;

				await member.roles.add(role).catch(() => null);
			} else if (hardestPunishment === 'KICK') {
				const check = await permissionGuard({
					action: `Watchdog: action user (Kick) ${member.user.username}`,
					botMember,
					targetMember: member,
					requiredPerms: [PermissionsBitField.Flags.KickMembers],
				});
				if (check !== true) return;

				if (member.kickable) await member.kick(reason);
			} else if (hardestPunishment === 'BAN') {
				const check = await permissionGuard({
					action: `Watchdog: action user (Ban) ${member.user.username}`,
					botMember,
					targetMember: member,
					requiredPerms: [PermissionsBitField.Flags.BanMembers],
				});
				if (check !== true) return;

				if (member.bannable) await member.ban({ reason });
			}

			if (guildConfig.logChannelId) {
				const channel = member.guild.channels.cache.get(guildConfig.logChannelId) as TextChannel;
				if (!channel) return;

				await channel.send({
					embeds: [
						new EmbedBuilder()
							.setColor(
								hardestPunishment === 'WARN'
									? 0xf1c40f
									: hardestPunishment === 'KICK'
										? 0xe67e22
										: hardestPunishment === 'BAN'
											? 0xe74c3c
											: config.colors.primary,
							)
							.setTitle('🚨 Watchdog Enforcement')
							.setDescription(
								`A blacklist action was enforced on **${member.user.username}** (${member.id}).\n\n` +
									`**Punishment:** ${hardestPunishment}\n` +
									`**Category:** ${hardestEntry.usercategory}\n` +
									`**Reason:** ${hardestEntry.reason || 'Not specified'}`,
							)
							.addFields({
								name: 'Recent History',
								value: last5
									.map(
										(e) =>
											`**\`•\` Case \`#${e.id}\`** — ${e.community || 'Unknown'}\n` +
											` **\`•\` Reason:** ${e.reason || 'Not specified'}\n` +
											` **\`•\` Status:** ${e.status}\n`,
									)
									.join('\n'),
							})
							.setFooter({ text: `${client.config.stachio.client_username} Watchdog • Log` })
							.setTimestamp(),
					],
				});
			}
		} catch (err) {
			logger.error('Failed to take action:', err);
		}
	}
}
