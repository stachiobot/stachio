import { BlacklistStatus, PrismaClient, UserType, UserCategory } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create or update a blacklisted user
 */
export async function upsertBlacklistedUser(discordId: string, username: string) {
	return prisma.blacklistedUser.upsert({
		where: { discordId },
		update: { username },
		create: { discordId, username },
	});
}

/**
 * Add a blacklist entry for a user
 */
export async function addBlacklistEntry(
	discordId: string,
	username: string,
	entryData: {
		category: UserCategory;
		usertype: UserType;
		status: BlacklistStatus;
		community?: string;
		reason?: string;
		reportedBy?: string;
		evidence?: string;
		expiresAt?: Date | null;
	},
) {
	const user = await upsertBlacklistedUser(discordId, username);

	return prisma.blacklistEntry.create({
		data: {
			...entryData,
			userId: user.id,
		},
		include: { user: true },
	});
}

/**
 * Update an existing blacklist entry
 */
export async function updateBlacklistEntry(
	entryId: number,
	updates: Partial<{
		category: UserCategory;
		usertype: UserType;
		status: BlacklistStatus;
		community: string;
		reason: string;
		reportedBy: string;
		evidence: string;
		active: boolean;
		expiresAt: Date | null;
	}>,
) {
	return prisma.blacklistEntry.update({
		where: { id: entryId },
		data: updates,
		include: { user: true },
	});
}

/**
 * Delete a blacklist entry
 */
export async function deleteBlacklistEntry(entryId: number) {
	return prisma.blacklistEntry.delete({
		where: { id: entryId },
	});
}

/**
 * Delete a blacklisted user & their entries
 */
export async function deleteBlacklistedUser(discordId: string) {
	const user = await prisma.blacklistedUser.findUnique({
		where: { discordId },
		include: { blacklists: true },
	});

	if (!user) return null;

	await prisma.blacklistEntry.deleteMany({ where: { userId: user.id } });

	return prisma.blacklistedUser.delete({ where: { discordId } });
}

/**
 * Get user w/ blacklist entries
 */
export async function getBlacklistedUser(discordId: string) {
	return prisma.blacklistedUser.findUnique({
		where: { discordId },
		include: { blacklists: true },
	});
}

/**
 * Get all blacklisted users w/ entries
 */
export async function getAllBlacklistedUsers() {
	return prisma.blacklistedUser.findMany({
		include: { blacklists: true },
		orderBy: { createdAt: 'desc' },
	});
}

/**
 * Get active blacklist entries only
 */
export async function getActiveBlacklistEntries() {
	return prisma.blacklistEntry.findMany({
		where: {
			active: true,
			OR: [
				{ status: BlacklistStatus.PERMANENT },
				{ status: BlacklistStatus.INDEFINITE },
				{
					status: BlacklistStatus.TEMPORARY,
					expiresAt: { gt: new Date() },
				},
			],
		},
		include: { user: true },
	});
}

/**
 * Get blacklist entry by ID
 */
export async function getBlacklistEntryById(entryId: number) {
	return prisma.blacklistEntry.findUnique({
		where: { id: entryId },
		include: { user: true },
	});
}

/**
 * Get all entries for a specific user
 */
export async function getUserBlacklistEntries(discordId: string) {
	const user = await prisma.blacklistedUser.findUnique({
		where: { discordId },
		include: { blacklists: true },
	});

	return user?.blacklists ?? null;
}

/**
 * Count total blacklisted users
 */
export async function countBlacklistedUsers() {
	return prisma.blacklistedUser.count();
}

/**
 * Count entries grouped by usertype
 */
export async function countEntriesByType() {
	return prisma.blacklistEntry.groupBy({
		by: ['usertype'],
		_count: { _all: true },
	});
}

/**
 * Count entries grouped by status
 */
export async function countEntriesByStatus() {
	return prisma.blacklistEntry.groupBy({
		by: ['status'],
		_count: { _all: true },
	});
}
