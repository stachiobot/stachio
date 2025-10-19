import { premiumLimits } from './premiumLimits.js';
import { BaseClient } from '@projectdiscord/core';

type Tier = keyof typeof premiumLimits;

export async function getGuildPremium(client: BaseClient, guildId: string) {
	const guild = await client.prisma.guildConfig.findUnique({
		where: { guildId },
		select: { premiumTier: true, premiumExpiresAt: true },
	});

	let tier: Tier = 'Free';

	if (guild?.premiumTier && guild.premiumExpiresAt && guild.premiumExpiresAt > new Date()) {
		tier = guild.premiumTier as Tier;
	}

	return {
		tier,
		expiresAt: guild?.premiumExpiresAt ?? null,
		limits: premiumLimits[tier],
	};
}

export async function isPremiumGuild(client: BaseClient, guildId: string) {
	const { tier } = await getGuildPremium(client, guildId);
	return tier !== 'Free';
}

export async function requirePremiumTier(client: BaseClient, guildId: string, minTier: Tier) {
	const order = ['Free', 'Silver', 'Gold', 'Platinum'] as const;
	const { tier } = await getGuildPremium(client, guildId);

	if (order.indexOf(tier) < order.indexOf(minTier)) {
		throw new Error(`❌ This action requires at least **${minTier}** tier. Your server is on **${tier}**.`);
	}
	return true;
}

export async function checkGuildLimit(
	client: BaseClient,
	guildId: string,
	key: keyof (typeof premiumLimits)['Free'],
	current: number = 0,
) {
	const { limits } = await getGuildPremium(client, guildId);
	const value = limits[key];

	if (typeof value === 'number') {
		if (value !== Infinity && current >= value) {
			throw new Error(`❌ This server has reached the limit for **${key}** (${value}). Upgrade to unlock more.`);
		}
	} else if (typeof value === 'boolean') {
		if (!value) {
			throw new Error(`❌ The feature **${key}** is not available on your current plan. Upgrade to unlock it.`);
		}
	}

	return true;
}
