import { PrismaClient, GuildCategory, StaffRoles, PremiumTier } from '../../../prisma/global';
export const prismaGlobal = new PrismaClient();

// ─────────────────────────────────────────────
// 🌍 Support Guilds
// ─────────────────────────────────────────────

export async function getOrCreateSupportGuild(guildId: string, guildName: string) {
	return prismaGlobal.supportGuilds.upsert({
		where: { guildId },
		update: { guildName },
		create: { guildId, guildName },
		include: { StaffUsers: true },
	});
}

export async function updateSupportGuild(
	guildId: string,
	data: Partial<{ guildName: string; language: string; category: GuildCategory; logChannelId: string }>,
) {
	return prismaGlobal.supportGuilds.update({
		where: { guildId },
		data,
	});
}

export async function getSupportGuild(guildId: string) {
	return prismaGlobal.supportGuilds.findUnique({
		where: { guildId },
		include: { StaffUsers: true },
	});
}

export async function getAllSupportGuilds() {
	return prismaGlobal.supportGuilds.findMany({
		include: { StaffUsers: true },
	});
}

// ─────────────────────────────────────────────
// 👥 Staff Users
// ─────────────────────────────────────────────

export async function addStaffUser(
	guildId: string,
	userId: string,
	username?: string,
	role: StaffRoles = StaffRoles.Trial_Moderator,
	departments?: string[],
) {
	return prismaGlobal.staffUsers.create({
		data: {
			guildId,
			userId,
			username,
			role,
			departments: departments ? JSON.stringify(departments) : undefined,
		},
	});
}

export async function updateStaffUser(
	userId: string,
	guildId: string,
	data: Partial<{ username: string; role: StaffRoles; departments: string[] }>,
) {
	return prismaGlobal.staffUsers.updateMany({
		where: { userId, guildId },
		data: {
			username: data.username,
			role: data.role,
			departments: data.departments ? JSON.stringify(data.departments) : undefined,
		},
	});
}

export async function removeStaffUser(guildId: string, userId: string) {
	return prismaGlobal.staffUsers.deleteMany({
		where: { guildId, userId },
	});
}

export async function getStaffUsersByGuild(guildId: string) {
	return prismaGlobal.staffUsers.findMany({
		where: { guildId },
	});
}

export async function getStaffUser(guildId: string, userId: string) {
	return prismaGlobal.staffUsers.findFirst({
		where: { guildId, userId },
	});
}

export async function getStaffByRole(guildId: string, role: StaffRoles) {
	return prismaGlobal.staffUsers.findMany({
		where: { guildId, role },
	});
}

// ─────────────────────────────────────────────
// 💎 Premium System
// ─────────────────────────────────────────────

// ── Premium Codes ──

export async function createPremiumCode(tier: PremiumTier, duration: number) {
	return prismaGlobal.premiumCode.create({
		data: {
			tier,
			duration,
		},
	});
}

export async function getPremiumCode(code: string) {
	return prismaGlobal.premiumCode.findUnique({ where: { code } });
}

export async function redeemPremiumCode(code: string) {
	return prismaGlobal.premiumCode.update({
		where: { code },
		data: { redeemed: true },
	});
}

// ── Premium Guild Config ──

export async function getOrCreatePremiumGuild(guildId: string, guildName?: string) {
	return prismaGlobal.premiumGuildConfig.upsert({
		where: { guildId },
		update: { guildName },
		create: { guildId, guildName },
	});
}

export async function updatePremiumGuild(
	guildId: string,
	data: Partial<{ premiumTier: PremiumTier; premiumExpiresAt: Date; redeemedPremiumCode: string }>,
) {
	return prismaGlobal.premiumGuildConfig.update({
		where: { guildId },
		data,
	});
}

export async function setPremiumStatus(
	guildId: string,
	tier: PremiumTier,
	durationDays: number,
	redeemedCode?: string,
) {
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + durationDays);

	return prismaGlobal.premiumGuildConfig.update({
		where: { guildId },
		data: {
			premiumTier: tier,
			premiumExpiresAt: expiresAt,
			redeemedPremiumCode: redeemedCode,
		},
	});
}

export async function revokePremium(guildId: string) {
	return prismaGlobal.premiumGuildConfig.update({
		where: { guildId },
		data: {
			premiumTier: PremiumTier.Free,
			premiumExpiresAt: null,
			redeemedPremiumCode: null,
		},
	});
}

export async function getActivePremiumGuilds() {
	return prismaGlobal.premiumGuildConfig.findMany({
		where: {
			premiumTier: { not: PremiumTier.Free },
			premiumExpiresAt: { gt: new Date() },
		},
	});
}
