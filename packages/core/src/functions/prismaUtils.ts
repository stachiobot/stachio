import { PrismaClient } from '@prisma/client';
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
	entryData: {
		usertype: 'FiveM' | 'General';
		status: 'PERMANENT' | 'TEMPORARY' | 'INDEFINITE';
		community?: string;
		reason?: string;
		reportedBy?: string;
		evidence?: string;
		expiresAt?: Date;
	},
) {
	const user = await upsertBlacklistedUser(discordId, entryData.reportedBy ?? 'Unknown');

	return prisma.blacklistEntry.create({
		data: {
			...entryData,
			userId: user.id,
		},
	});
}

/**
 * Update an existing blacklist entry
 */
export async function updateBlacklistEntry(
	entryId: number,
	updates: Partial<{
		status: 'PERMANENT' | 'TEMPORARY' | 'INDEFINITE';
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
 * Delete a blacklisted user and all their entries
 */
export async function deleteBlacklistedUser(discordId: string) {
	const user = await prisma.blacklistedUser.findUnique({
		where: { discordId },
		include: { blacklists: true },
	});

	if (!user) return null;

	// Delete entries first
	await prisma.blacklistEntry.deleteMany({
		where: { userId: user.id },
	});

	// Delete user
	return prisma.blacklistedUser.delete({
		where: { discordId },
	});
}

/**
 * Get a blacklisted user with their entries and metadata
 */
export async function getBlacklistedUser(discordId: string) {
	return prisma.blacklistedUser.findUnique({
		where: { discordId },
		include: { blacklists: true },
	});
}

/**
 * Get all blacklisted users with their entries
 * (useful for dashboards or exports)
 */
export async function getAllBlacklistedUsers() {
	return prisma.blacklistedUser.findMany({
		include: { blacklists: true },
		orderBy: { createdAt: 'desc' },
	});
}

/**
 * Find active blacklist entries (not expired, still active)
 */
export async function getActiveBlacklistEntries() {
	return prisma.blacklistEntry.findMany({
		where: {
			active: true,
			OR: [
				{ status: 'PERMANENT' },
				{ status: 'INDEFINITE' },
				{
					status: 'TEMPORARY',
					expiresAt: { gt: new Date() }, // still valid
				},
			],
		},
		include: { user: true },
	});
}

/**
 * Get a specific blacklist entry by ID
 */
export async function getBlacklistEntryById(entryId: number) {
	return prisma.blacklistEntry.findUnique({
		where: { id: entryId },
		include: {
			user: true, // include linked user for context
		},
	});
}

/**
 * Get all blacklist entries for a user
 */
export async function getUserBlacklistEntries(discordId: string) {
	const user = await prisma.blacklistedUser.findUnique({
		where: { discordId },
		include: { blacklists: true }, // includes all related entries
	});

	if (!user) {
		return null; // user not found
	}

	return user.blacklists; // array of entries
}

/**
 * Count blacklisted users
 */
export async function countBlacklistedUsers() {
	return prisma.blacklistedUser.count();
}

/**
 * Count active entries grouped by type
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
