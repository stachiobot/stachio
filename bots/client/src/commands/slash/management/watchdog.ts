import { SlashCommandInterface } from '@projectdiscord/shared';
import { BaseClient, permissionGuard } from '@projectdiscord/core';
import {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	ChannelType,
	Role,
	PermissionsBitField,
	TextChannel,
} from 'discord.js';
import { PunishmentType } from '@prisma/client';

const command: SlashCommandInterface = {
	cooldown: 5,
	isDeveloperOnly: false,
	data: new SlashCommandBuilder()
		.setName('watchdog')
		.setDescription('Configure the guild watchdog settings')
		.addSubcommand((sub) => sub.setName('setup').setDescription('Create initial watchdog configuration for this guild'))
		.addSubcommand((sub) =>
			sub
				.setName('setpunishment')
				.setDescription('Set punishment for a specific user type')
				.addStringOption((opt) =>
					opt
						.setName('usertype')
						.setDescription('Type of user to configure')
						.setRequired(true)
						.addChoices(
							{ name: 'General', value: 'General' },
							{ name: 'FiveM', value: 'FiveM' },
							{ name: 'Discord', value: 'Discord' },
							{ name: 'Roblox', value: 'Roblox' },
							{ name: 'OtherGame', value: 'OtherGame' },
							{ name: 'Marketplace', value: 'Marketplace' },
						),
				)
				.addStringOption((opt) =>
					opt
						.setName('punishment')
						.setDescription('Punishment type')
						.setRequired(true)
						.addChoices(
							{ name: 'NONE', value: 'NONE' },
							{ name: 'WARN', value: 'WARN' },
							{ name: 'ROLE', value: 'ROLE' },
							{ name: 'KICK', value: 'KICK' },
							{ name: 'BAN', value: 'BAN' },
						),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('setrole')
				.setDescription('Set the role assigned for ROLE punishment')
				.addRoleOption((opt) => opt.setName('role').setDescription('Role to assign').setRequired(true)),
		)
		.addSubcommand((sub) =>
			sub
				.setName('setlog')
				.setDescription('Set the log channel for blacklist actions')
				.addChannelOption((opt) =>
					opt
						.setName('channel')
						.setDescription('Channel to log actions')
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText),
				),
		),
	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });
		const sub = interaction.options.getSubcommand();
		const prisma = client.prisma;

		if (sub === 'setup') {
			await prisma.guildConfig.upsert({
				where: { guildId: interaction.guildId! },
				update: {},
				create: {
					guildId: interaction.guildId!,
					guildName: interaction.guild?.name || 'Unknown',
					WatchdogConfig: {
						create: {
							generalPunishment: PunishmentType.BAN,
							fivemPunishment: PunishmentType.WARN,
							discordPunishment: PunishmentType.KICK,
							robloxPunishment: PunishmentType.WARN,
							otherGamePunishment: PunishmentType.WARN,
							marketplacePunishment: PunishmentType.BAN,
						},
					},
				},
				include: { WatchdogConfig: true },
			});

			await interaction.editReply('`✅` Watchdog setup completed!');
			return;
		}

		const guildConfig = await prisma.guildConfig.findUnique({
			where: { guildId: interaction.guildId! },
			include: { WatchdogConfig: true },
		});

		if (!guildConfig?.WatchdogConfig) {
			await interaction.editReply('`❌` Watchdog is not set up yet. Use /watchdog setup first.');
			return;
		}

		const watchdog = guildConfig.WatchdogConfig;

		if (sub === 'setpunishment') {
			const usertype = interaction.options.getString('usertype', true);
			const punishment = interaction.options.getString('punishment', true) as PunishmentType;

			const fieldMap: Record<string, keyof typeof watchdog> = {
				General: 'generalPunishment',
				FiveM: 'fivemPunishment',
				Discord: 'discordPunishment',
				Roblox: 'robloxPunishment',
				OtherGame: 'otherGamePunishment',
				Marketplace: 'marketplacePunishment',
			};

			const field = fieldMap[usertype];
			await prisma.watchdogConfig.update({
				where: { id: watchdog.id },
				data: { [field]: punishment },
			});

			await interaction.editReply(`\`✅\` Punishment for ${usertype} set to ${punishment}`);
		} else if (sub === 'setrole') {
			const role = interaction.options.getRole('role', true) as Role;

			const check = await permissionGuard({
				action: `Assign ${role.name}`,
				botMember: await interaction.guild?.members.fetchMe()!,
				targetRole: role,
				requiredPerms: [PermissionsBitField.Flags.ManageRoles],
			});

			if (check !== true) {
				return interaction.editReply(check);
			}

			await prisma.watchdogConfig.update({
				where: { id: watchdog.id },
				data: { roleId: role.id },
			});
			await interaction.editReply(`\`✅\` Role for ROLE punishment set to ${role.name}`);
		} else if (sub === 'setlog') {
			const channel = interaction.options.getChannel('channel', true);

			const check = await permissionGuard({
				action: `Assigned new log channel ${channel.name}`,
				botMember: await interaction.guild?.members.fetchMe()!,
				channel: channel as TextChannel,
				requiredPerms: [PermissionsBitField.Flags.ManageChannels],
			});

			if (check !== true) {
				return interaction.editReply(check);
			}

			await prisma.watchdogConfig.update({
				where: { id: watchdog.id },
				data: { logChannelId: channel.id },
			});
			await interaction.editReply(`\`✅\` Log channel set to ${channel.name}`);
		}
	},
};

export default command;
