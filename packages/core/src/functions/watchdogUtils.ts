import { GuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import { PrismaClient, PunishmentType } from '@prisma/client';
import { config } from '@projectdiscord/core';

const prisma = new PrismaClient();

/**
 * Check blacklist entries and punish user accordingly
 */
export async function actionUser(member: GuildMember) {
	const user = await prisma.blacklistedUser.findUnique({
		where: { discordId: member.id },
		include: { blacklists: true },
	});
	if (!user) return;

	const guildConfig = await prisma.guildConfig.findUnique({
		where: { guildId: member.guild.id },
		include: { WatchdogConfig: true },
	});
	if (!guildConfig?.WatchdogConfig) return;

	const watchdog = guildConfig.WatchdogConfig;

	for (const entry of user.blacklists) {
		if (!entry.active) continue;

		const usertype = entry.usertype;
		let punishment: PunishmentType;

		switch (usertype) {
			case 'General':
				punishment = watchdog.generalPunishment;
				break;
			case 'FiveM':
				punishment = watchdog.fivemPunishment;
				break;
			case 'Discord':
				punishment = watchdog.discordPunishment;
				break;
			case 'Roblox':
				punishment = watchdog.robloxPunishment;
				break;
			case 'OtherGame':
				punishment = watchdog.otherGamePunishment;
				break;
			case 'Marketplace':
				punishment = watchdog.marketplacePunishment;
				break;
			default:
				continue;
		}

		if (punishment === 'NONE') continue;

		const reason = `Blacklisted under ${usertype}${entry.reason ? `: ${entry.reason}` : ''}`;

		try {
			await member
				.send({
					embeds: [
						new EmbedBuilder()
							.setColor(config.colors.primary)
							.setTitle('🛡️ Stachio - Blacklist Notification')
							.setDescription(
								[
									'You are receiving this message because you have been **blacklisted** by the Stachio bot for violating server rules.',
									' ',
									`**Action Taken:** ${punishment === 'WARN' ? 'Warned ⚠️' : punishment === 'KICK' ? 'Kicked 👢' : punishment === 'BAN' ? 'Banned 🔨' : punishment === 'ROLE' ? 'Role Assigned 🏷️' : punishment}`,
									entry.reason ? `**Reason:** ${entry.reason}` : '',
									`**Violation Count:** ${user.blacklists.length} rule violation${user.blacklists.length > 1 ? 's' : ''} across servers.`,
									'## **Next Steps:**',
									'- Review your actions and ensure compliance with server rules.',
									'- Join the Stachio Discord for more information and support.',
									'## [Join the Stachio Discord](https://stachio.dk/discord)',
									'Please read the watchdog-faq channel when you join to understand the rules better.',
								]
									.filter(Boolean)
									.join('\n'),
							),
					],
				})
				.catch(() => null);

			if (punishment === 'WARN') {
				// DM already sent
			} else if (punishment === 'ROLE') {
				if (watchdog.roleId) {
					await member.roles.add(watchdog.roleId).catch(() => null);
				}
			} else if (punishment === 'KICK') {
				if (member.kickable) {
					await member.kick(reason);
				}
			} else if (punishment === 'BAN') {
				if (member.bannable) {
					await member.ban({ reason });
				}
			}

			if (watchdog.logChannelId) {
				const channel = member.guild.channels.cache.get(watchdog.logChannelId) as TextChannel;
				if (channel) {
					await channel.send({
						embeds: [
							new EmbedBuilder()
								.setColor(config.colors.error)
								.setTitle('🚨 Blacklist Action')
								.setDescription(`**${member.user.username}** was punished with **${punishment}** for **${usertype}**.`),
						],
					});
				}
			}
		} catch (err) {
			console.error('Failed to take action:', err);
		}
	}
}
