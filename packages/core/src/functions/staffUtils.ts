import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if a user has a staff role in a guild
 * @param guildId The Discord guild ID
 * @param userId The Discord user ID
 * @returns true if user is staff, otherwise false
 */
export async function isStaffUser(guildId: string, userId: string): Promise<boolean> {
  const staffUser = await prisma.staffUsers.findFirst({
    where: {
      guildId,
      userId,
    },
  });

  return staffUser !== null;
}

/**
 * Optionally check for minimum role hierarchy (e.g. only Moderator+)
 */
export async function hasStaffRole(
  guildId: string,
  userId: string,
  allowedRoles: string[] = ['Trial_Moderator', 'Moderator', 'Senior_Moderator', 'Administrator', 'Senior_Administrator', 'Owner']
): Promise<boolean> {
  const staffUser = await prisma.staffUsers.findFirst({
    where: {
      guildId,
      userId,
    },
  });

  if (!staffUser) return false;

  return allowedRoles.includes(staffUser.role);
}
