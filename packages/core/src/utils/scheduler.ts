import cron, { ScheduledTask } from 'node-cron';
import { premiumLimits } from './premiumLimits.js';
import { BaseClient, scanGuild, logger } from '@projectdiscord/core';

const scheduledScans = new Map<string, ScheduledTask>();

export function scheduleGuildScan(client: BaseClient, guildId: string, tier: keyof typeof premiumLimits) {
	const limits = premiumLimits[tier];

	if (scheduledScans.has(guildId)) {
		scheduledScans.get(guildId)!.stop();
		scheduledScans.delete(guildId);
	}

	if (!limits.memberScanInterval) {
		logger.info(`⏹️ Guild ${guildId} has no auto-scans for tier ${tier}`);
		return;
	}

	// Run every X hours
	const intervalHours = limits.memberScanInterval;
	const cronExp = `0 */${intervalHours} * * *`; // minute 0, every X hours

	const task = cron.schedule(cronExp, async () => {
		try {
			const discordGuild = client.guilds.cache.get(guildId);
			if (!discordGuild) return;

			logger.info(`🔍 Running scheduled scan for guild ${guildId} (${tier})`);
			await scanGuild(discordGuild);
		} catch (err) {
			logger.error(`❌ Failed scheduled scan for ${guildId}`, err);
		}
	});

	scheduledScans.set(guildId, task);

	logger.info(`⏰ Scheduled auto-scan for guild ${guildId} every ${intervalHours}h`);
}

export function stopGuildScan(guildId: string) {
	if (scheduledScans.has(guildId)) {
		scheduledScans.get(guildId)!.stop();
		scheduledScans.delete(guildId);
		logger.info(`🛑 Stopped auto-scan for guild ${guildId}`);
	}
}

async function onGuildPremiumChange(client: BaseClient, guildId: string, newTier: keyof typeof premiumLimits) {
	// Stop previous schedule if any
	stopGuildScan(guildId);

	// Schedule new one if tier allows
	scheduleGuildScan(client, guildId, newTier);
}
