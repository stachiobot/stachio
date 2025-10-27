import {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	userMention,
	EmbedBuilder,
	PermissionFlagsBits,
} from 'discord.js';
import { SlashCommandInterface } from '@projectdiscord/shared';
import {
	BaseClient,
	addStaffUser,
	removeStaffUser,
	addDepartment,
	removeDepartment,
	isInDepartment,
	hasStaffRole,
	getStaffUser,
	sendGuildActionLog,
} from '@projectdiscord/core';
import { GuildCategory, StaffRoles } from '@prisma/client';

const command: SlashCommandInterface = {
	cooldown: 3,
	isDeveloperOnly: false,
	data: new SlashCommandBuilder()
		.setName('staff')
		.setDescription('Manage staff users, departments, and support guilds (Owner only)')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((sub) =>
			sub
				.setName('add')
				.setDescription('Add or update a staff user')
				.addUserOption((opt) => opt.setName('user').setDescription('User to add').setRequired(true))
				.addStringOption((opt) =>
					opt
						.setName('role')
						.setDescription('Staff role')
						.setRequired(true)
						.addChoices(
							{ name: 'Owner', value: 'Owner' },
							{ name: 'Senior Administrator', value: 'Senior_Administrator' },
							{ name: 'Administrator', value: 'Administrator' },
							{ name: 'Trial Administrator', value: 'Trial_Administrator' },
							{ name: 'Senior Moderator', value: 'Senior_Moderator' },
							{ name: 'Moderator', value: 'Moderator' },
							{ name: 'Trial Moderator', value: 'Trial_Moderator' },
						),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('remove')
				.setDescription('Remove a staff user')
				.addUserOption((opt) => opt.setName('user').setDescription('User to remove').setRequired(true)),
		)
		.addSubcommand((sub) =>
			sub
				.setName('add-department')
				.setDescription('Add a department to a staff user')
				.addUserOption((opt) => opt.setName('user').setDescription('User').setRequired(true))
				.addStringOption((opt) =>
					opt
						.setName('department')
						.setDescription('Department to add')
						.setRequired(true)
						.addChoices(
							{ name: 'Appeals', value: 'Appeals' },
							{ name: 'Reports', value: 'Reports' },
							{ name: 'Stachio', value: 'Stachio' },
						),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('remove-department')
				.setDescription('Remove a department from a staff user')
				.addUserOption((opt) => opt.setName('user').setDescription('User').setRequired(true))
				.addStringOption((opt) =>
					opt
						.setName('department')
						.setDescription('Department to remove')
						.setRequired(true)
						.addChoices(
							{ name: 'Appeals', value: 'Appeals' },
							{ name: 'Reports', value: 'Reports' },
							{ name: 'Stachio', value: 'Stachio' },
						),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('info')
				.setDescription('Check if a user is staff and what departments they are in')
				.addUserOption((opt) => opt.setName('user').setDescription('User to check').setRequired(true)),
		)
		.addSubcommandGroup((group) =>
			group
				.setName('support')
				.setDescription('Manage support guilds')
				.addSubcommand((sub) =>
					sub
						.setName('add')
						.setDescription('Add or update a support guild')
						.addStringOption((opt) => opt.setName('guildid').setDescription('Guild ID').setRequired(true))
						.addStringOption((opt) => opt.setName('name').setDescription('Guild name').setRequired(true))
						.addStringOption((opt) =>
							opt.setName('language').setDescription('Language (default: en-US)').setRequired(false),
						),
				)
				.addSubcommand((sub) =>
					sub
						.setName('remove')
						.setDescription('Remove a support guild')
						.addStringOption((opt) => opt.setName('guildid').setDescription('Guild ID').setRequired(true)),
				)
				.addSubcommand((sub) =>
					sub
						.setName('info')
						.setDescription('View support guild info')
						.addStringOption((opt) => opt.setName('guildid').setDescription('Guild ID').setRequired(true)),
				),
		),

	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });

		const sub = interaction.options.getSubcommand();
		const group = interaction.options.getSubcommandGroup(false);
		const guildId = interaction.guildId!;
		const executor = interaction.user;

		const hasPermission = await hasStaffRole(guildId, executor.id, [StaffRoles.Owner]);
		if (!hasPermission) {
			await interaction.editReply('`🚫` You must be an **Owner** to use this command.');
			return;
		}

		if (!group) {
			const target = interaction.options.getUser('user', true);
			switch (sub) {
				case 'add': {
					const role = interaction.options.getString('role', true) as StaffRoles;
					await addStaffUser(guildId, target.id, target.username, role);
					await sendGuildActionLog(client, {
						description: `User **${target.username}** (${target.id}) has been added as **${role.replaceAll('_', ' ')}**.`,
						color: client.config.colors.primary as unknown as string,
						category: GuildCategory.HEAD_SUPPORT,
					});
					await interaction.editReply(`\`✅\` ${userMention(target.id)} added as **${role}**.`);
					break;
				}
				case 'remove': {
					await removeStaffUser(guildId, target.id);
					await sendGuildActionLog(client, {
						description: `User **${target.username}** (${target.id}) has been removed from staff.`,
						color: client.config.colors.error as unknown as string,
						category: GuildCategory.HEAD_SUPPORT,
					});
					await interaction.editReply(`\`🗑️\` ${userMention(target.id)} removed from staff.`);
					break;
				}
				case 'add-department': {
					const dep = interaction.options.getString('department', true);
					await addDepartment(guildId, target.id, dep);
					await sendGuildActionLog(client, {
						description: `Department **${dep}** has been assigned to **${target.username}** (${target.id}).`,
						color: client.config.colors.primary as unknown as string,
						category: GuildCategory.HEAD_SUPPORT,
					});
					await interaction.editReply(`\`✅\` Added **${dep}** department to ${userMention(target.id)}.`);
					break;
				}
				case 'remove-department': {
					const dep = interaction.options.getString('department', true);
					await removeDepartment(guildId, target.id, dep);
					await sendGuildActionLog(client, {
						description: `Department **${dep}** has been removed from **${target.username}** (${target.id}).`,
						color: client.config.colors.error as unknown as string,
						category: GuildCategory.HEAD_SUPPORT,
					});
					await interaction.editReply(`\`🗑️\` Removed **${dep}** department from ${userMention(target.id)}.`);
					break;
				}
				case 'info': {
					const staff = await getStaffUser(guildId, target.id);
					if (!staff) return await interaction.editReply(`\`❌\` ${userMention(target.id)} is not a staff member.`);

					const departments = ['Appeals', 'Reports', 'Stachio'].filter(
						async (dep) => await isInDepartment(guildId, target.id, dep),
					);

					const embed = new EmbedBuilder()
						.setTitle(`👤 ${target.username}'s Staff Info`)
						.setColor(client.config.colors.primary)
						.addFields(
							{ name: 'User', value: userMention(target.id), inline: false },
							{ name: 'Role', value: staff.role, inline: false },
							{
								name: 'Departments',
								value: departments.length ? departments.join(', ') : 'None',
								inline: false,
							},
						)
						.setTimestamp();
					await interaction.editReply({ embeds: [embed] });
					break;
				}
			}
			return;
		}

		if (group === 'support') {
			switch (sub) {
				case 'add': {
					const sgid = interaction.options.getString('guildid', true);
					const name = interaction.options.getString('name', true);
					const language = interaction.options.getString('language') ?? 'en-US';

					await client.prisma.supportGuilds.upsert({
						where: { guildId: sgid },
						update: { guildName: name, language },
						create: { guildId: sgid, guildName: name, language },
					});

					await sendGuildActionLog(client, {
						description: `Support guild **${name}** (\`${sgid}\`) has been added/updated. Language: ${language}.`,
						color: client.config.colors.primary as unknown as string,
						category: GuildCategory.HEAD_SUPPORT,
					});

					await interaction.editReply(`\`✅\` Support guild **${name}** (\`${sgid}\`) saved successfully.`);
					break;
				}

				case 'remove': {
					const sgid = interaction.options.getString('guildid', true);
					const found = await client.prisma.supportGuilds.findUnique({ where: { guildId: sgid } });
					if (!found) {
						await interaction.editReply(`\`❌\` No support guild found with ID \`${sgid}\`.`);
						return;
					}
					await client.prisma.supportGuilds.delete({ where: { guildId: sgid } });

					await sendGuildActionLog(client, {
						description: `Support guild **${found.guildName}** (\`${sgid}\`) has been removed from the database.`,
						color: client.config.colors.error as unknown as string,
						category: GuildCategory.HEAD_SUPPORT,
					});

					await interaction.editReply(`\`🗑️\` Removed support guild **${found.guildName}** (\`${sgid}\`).`);
					break;
				}

				case 'info': {
					const sgid = interaction.options.getString('guildid', true);
					const guild = await client.prisma.supportGuilds.findUnique({
						where: { guildId: sgid },
						include: { StaffUsers: true },
					});
					if (!guild) {
						await interaction.editReply(`\`❌\` No support guild found with ID \`${sgid}\`.`);
						return;
					}

					const embed = new EmbedBuilder()
						.setTitle(`🏛️ Support Guild Info`)
						.setColor(client.config.colors.primary)
						.addFields(
							{ name: 'Guild ID', value: sgid, inline: false },
							{ name: 'Name', value: guild.guildName, inline: false },
							{ name: 'Language', value: guild.language, inline: false },
							{
								name: 'Staff Count',
								value: guild.StaffUsers.length.toString(),
								inline: false,
							},
						)
						.setTimestamp();

					await interaction.editReply({ embeds: [embed] });
					break;
				}
			}
		}
	},
};

export default command;
