import {
	GuildMember,
	TextChannel,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Guild,
	PermissionsBitField,
} from 'discord.js';
import { PrismaClient, PunishmentType, UserCategory } from '@prisma/client';
import { config, logger, permissionGuard } from '@projectdiscord/core';

const prisma = new PrismaClient();

/**
 * Check if a Discord user is blacklisted and return their active entries.
 */
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
				status: e.status,
				community: e.community,
				reason: e.reason,
				reportedBy: e.reportedBy,
				evidence: e.evidence,
				expiresAt: e.expiresAt,
				createdAt: e.createdAt,
			})),
		};
	} catch (err) {
		console.error('Error checking blacklist:', err);
		return { isBlacklisted: false, user: null, activeEntries: [] };
	}
}

/**
 * Scan a guild for blacklisted users and take action in batches.
 */
export async function scanGuild(guild: Guild) {
	try {
		await guild.members.fetch();
		const members = guild.members.cache;
		if (!members.size) {
			logger.info(`[SCAN] No members found in guild ${guild.id}`);
			return;
		}

		logger.info(`[SCAN] Starting blacklist scan in guild ${guild.id} with ${members.size} members`);

		const batchSize = 10;
		const delayMs = 1500;
		const memberArray = Array.from(members.values());

		for (let i = 0; i < memberArray.length; i += batchSize) {
			const batch = memberArray.slice(i, i + batchSize);

			for (const member of batch) {
				try {
					const { activeEntries } = await checkBlacklist(member.id);
					if (!activeEntries.length) continue;

					await actionUser(member);

					await new Promise((res) => setTimeout(res, delayMs));
				} catch (err) {
					logger.error(`[SCAN] Error processing ${member.id}:`, err);
				}
			}

			logger.info(`[SCAN] Processed ${Math.min(i + batchSize, memberArray.length)}/${memberArray.length}`);
		}

		logger.info(`[SCAN] Completed blacklist scan in guild ${guild.id}`);
	} catch (err) {
		logger.error(`[SCAN] Failed to scan guild ${guild.id}:`, err);
	}
}

/**
 * Apply the correct punishment to a user based on their blacklist entries and WatchdogConfig.
 */
export async function actionUser(member: GuildMember) {
	const user = await prisma.blacklistedUser.findUnique({
		where: { discordId: member.id },
		include: { blacklists: true },
	});
	if (!user) return;

	const guildConfig = await prisma.watchdogConfig.findUnique({
		where: { guildId: member.guild.id },
	});
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
	}

	if (hardestPunishment === 'NONE') return;

	const reason = `Blacklisted under ${hardestEntry.usercategory}${hardestEntry.reason ? `: ${hardestEntry.reason}` : ''}`;
	const last5 = user.blacklists.slice(-5);

	try {
		await member
			.send({
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
						.setTitle('🛡️ Stachio - Blacklist Notification')
						.setThumbnail(
							'https://github.com/MilkshakeCollective/stachio-web/blob/master/public/images/logo.png?raw=true',
						)
						.addFields({
							name: 'History',
							value: last5
								.map(
									(e) =>
										`**\`•\` Case \`#${e.id}\`** — ${e.community || 'Unknown'}\n` +
										` **\`•\` Reason:** ${e.reason || 'Not specified'}\n` +
										` **\`•\` Status:** ${e.status}\n`,
								)
								.join('\n'),
						})
						.setDescription(
							[
								'You have been blacklisted by **Stachio** for rule violations.\n\n',
								'Please review the rules and take corrective action to avoid further punishment.',
							].join('\n'),
						)
						.setFooter({ text: 'Stachio Watchdog • Please keep this for your records' })
						.setTimestamp(),
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setLabel('Join Support Discord')
							.setStyle(ButtonStyle.Link)
							.setURL('https://stachio.dk/discord'),
						new ButtonBuilder().setLabel('Read FAQ').setStyle(ButtonStyle.Link).setURL('https://stachio.dk/faq'),
					),
				],
			})
			.catch(() => null);

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
						.setThumbnail(
							'https://github.com/stachiobot/web/blob/master/public/images/logo.png?raw=true',
						)
						.setDescription(
							`A blacklist action was enforced on **${member.user.tag}** (${member.id}).\n\n` +
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
						.setFooter({ text: 'Stachio Watchdog • Log' })
						.setTimestamp(),
				],
			});
		}
	} catch (err) {
		logger.error('Failed to take action:', err);
	}
}
