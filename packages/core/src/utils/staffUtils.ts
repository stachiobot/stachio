import { PrismaClient, StaffRoles } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if a user exists as staff in a guild
 */
export async function isStaffUser(guildId: string, userId: string): Promise<boolean> {
	const staffUser = await prisma.staffUsers.findFirst({
		where: { guildId, userId },
	});
	return staffUser !== null;
}

/**
 * Get a staff's data
 */
export async function getStaffUser(guildId: string, userId: string) {
	return await prisma.staffUsers.findFirst({ where: { guildId, userId } });
}

/**
 * Check if a user has one of the allowed staff roles
 */
export async function hasStaffRole(
	guildId: string,
	userId: string,
	allowedRoles: StaffRoles[] = [
		'Trial_Moderator',
		'Moderator',
		'Senior_Moderator',
		'Trial_Administrator',
		'Administrator',
		'Senior_Administrator',
		'Owner',
	],
): Promise<boolean> {
	const staffUser = await prisma.staffUsers.findFirst({
		where: { guildId, userId },
	});
	if (!staffUser) return false;
	return allowedRoles.includes(staffUser.role);
}

/**
 * Add a staff user (if not already exists)
 */
export async function addStaffUser(
	guildId: string,
	userId: string,
	username: string,
	role: StaffRoles = 'Trial_Moderator',
): Promise<void> {
	const existing = await prisma.staffUsers.findFirst({ where: { guildId, userId } });

	if (existing) {
		await prisma.staffUsers.update({
			where: { id: existing.id },
			data: { username, role },
		});
	} else {
		await prisma.staffUsers.create({
			data: { guildId, userId, username, role, departments: [] },
		});
	}
}

/**
 * Remove a staff user from a guild
 */
export async function removeStaffUser(guildId: string, userId: string): Promise<void> {
	await prisma.staffUsers.deleteMany({ where: { guildId, userId } });
}

/**
 * Add a department to a staff user (creates user if not exists)
 */
export async function addDepartment(guildId: string, userId: string, department: string): Promise<void> {
	const staffUser = await prisma.staffUsers.findFirst({ where: { guildId, userId } });

	if (!staffUser) {
		await prisma.staffUsers.create({
			data: { guildId, userId, departments: [department] },
		});
		return;
	}

	// Safely coerce JSON value to a string array
	const currentDepartments = Array.isArray(staffUser.departments) ? (staffUser.departments as string[]) : [];

	if (!currentDepartments.includes(department)) {
		await prisma.staffUsers.update({
			where: { id: staffUser.id },
			data: { departments: [...currentDepartments, department] },
		});
	}
}

/**
 * Remove a department from a staff user
 */
export async function removeDepartment(guildId: string, userId: string, department: string): Promise<void> {
	const staffUser = await prisma.staffUsers.findFirst({ where: { guildId, userId } });
	if (!staffUser || !staffUser.departments) return;

	const updatedDepartments = (staffUser.departments as string[]).filter((dep) => dep !== department);

	await prisma.staffUsers.update({
		where: { id: staffUser.id },
		data: { departments: updatedDepartments },
	});
}

/**
 * Check if user is part of a specific department
 */
export async function isInDepartment(guildId: string, userId: string, department: string): Promise<boolean> {
	const staffUser = await prisma.staffUsers.findFirst({ where: { guildId, userId } });
	if (!staffUser || !staffUser.departments) return false;

	return (staffUser.departments as string[]).includes(department);
}
