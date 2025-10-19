import { BaseClient, actionUser, logger, premiumLimits } from '@projectdiscord/core';
import { EventInterface } from '@projectdiscord/shared';
import { GuildMember } from 'discord.js';

const event: EventInterface<'guildMemberAdd'> = {
	name: 'guildMemberAdd',
	options: { once: false, rest: false },
	async execute(client: BaseClient, member: GuildMember) {
		try {
			const guildId = member.guild.id;

			const guildConfig = await client.prisma.guildConfig.findUnique({ where: { guildId } });
			if (!guildConfig) return;

			const tier = guildConfig.premiumTier;

			const now = new Date();
			const lastReset = guildConfig.blacklistCheckLastReset;
			const oneWeekMs = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

			if (now.getTime() - lastReset.getTime() >= oneWeekMs) {
				await client.prisma.guildConfig.update({
					where: { guildId },
					data: {
						blacklistCheckUsage: 0,
						blacklistCheckLastReset: now,
					},
				});
			}

			const updatedConfig = await client.prisma.guildConfig.findUnique({ where: { guildId } });
			if (updatedConfig!.blacklistCheckUsage >= (premiumLimits[tier].maxBlacklistChecks ?? Infinity)) {
				logger.info(`Guild ${guildId} reached max blacklist checks for this week`);
				return;
			}

			await actionUser(member);

			await client.prisma.guildConfig.update({
				where: { guildId },
				data: {
					blacklistCheckUsage: updatedConfig!.blacklistCheckUsage + 1,
				},
			});
		} catch (err) {
			logger.error('Failed to check blacklist on member join:', err);
		}
	},
};

export default event;
