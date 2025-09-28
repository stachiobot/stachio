import { SlashCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, TextChannel, Role } from 'discord.js';
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
		const sub = interaction.options.getSubcommand();

		// Use client.prisma
		const prisma = client.prisma;

		if (sub === 'setup') {
			// Create initial guild config if missing
			const guildConfig = await prisma.guildConfig.upsert({
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

			await interaction.reply({ content: '✅ Watchdog setup completed!', ephemeral: true });
			return;
		}

		// Fetch existing config
		const guildConfig = await prisma.guildConfig.findUnique({
			where: { guildId: interaction.guildId! },
			include: { WatchdogConfig: true },
		});
		if (!guildConfig?.WatchdogConfig) {
			await interaction.reply({
				content: '❌ Watchdog is not set up yet. Use /watchdog setup first.',
				ephemeral: true,
			});
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

			await interaction.reply({ content: `✅ Punishment for ${usertype} set to ${punishment}`, ephemeral: true });
		} else if (sub === 'setrole') {
			const role = interaction.options.getRole('role', true) as Role;
			await prisma.watchdogConfig.update({
				where: { id: watchdog.id },
				data: { roleId: role.id },
			});
			await interaction.reply({ content: `✅ Role for ROLE punishment set to ${role.name}`, ephemeral: true });
		} else if (sub === 'setlog') {
			const channel = interaction.options.getChannel('channel', true) as TextChannel;
			await prisma.watchdogConfig.update({
				where: { id: watchdog.id },
				data: { logChannelId: channel.id },
			});
			await interaction.reply({ content: `✅ Log channel set to ${channel.name}`, ephemeral: true });
		}
	},
};

export default command;
