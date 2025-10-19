import { SlashCommandInterface } from '@projectdiscord/shared';
import { BaseClient, stopGuildScan } from '@projectdiscord/core';
import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { randomUUID } from 'crypto';
import { PremiumTier } from '@prisma/client';

const command: SlashCommandInterface = {
	cooldown: 5,
	isDeveloperOnly: true,
	data: new SlashCommandBuilder()
		.setName('premium')
		.setDescription('Manage premium tiers and codes')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((sub) =>
			sub
				.setName('create-code')
				.setDescription('Create a new premium code')
				.addStringOption((o) =>
					o
						.setName('tier')
						.setDescription('Premium tier')
						.setRequired(true)
						.addChoices(
							{ name: 'Silver', value: 'Silver' },
							{ name: 'Gold', value: 'Gold' },
							{ name: 'Platinum', value: 'Platinum' },
						),
				)
				.addIntegerOption((o) => o.setName('duration').setDescription('Duration in days').setRequired(true)),
		)
		.addSubcommand((sub) =>
			sub
				.setName('remove')
				.setDescription('Remove premium from a guild')
				.addStringOption((o) => o.setName('guildid').setDescription('Guild ID').setRequired(true)),
		)
		.addSubcommand((sub) =>
			sub
				.setName('renew')
				.setDescription('Extend a guild’s premium by a number of days')
				.addStringOption((o) => o.setName('guildid').setDescription('Guild ID').setRequired(true))
				.addIntegerOption((o) => o.setName('days').setDescription('Number of days to extend').setRequired(true)),
		),

	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });
		const sub = interaction.options.getSubcommand();

		try {
			if (sub === 'create-code') {
				const tier = interaction.options.getString('tier', true) as PremiumTier;
				const duration = interaction.options.getInteger('duration', true);
				const code = randomUUID();

				await client.prisma.premiumCode.create({
					data: { code, tier, duration },
				});

				return interaction.editReply({
					content: `\`✅\` Created premium code: \`${code}\` for ${tier} (${duration} days)`,
				});
			}

			if (sub === 'remove') {
				const guildId = interaction.options.getString('guildid', true);

				await client.prisma.guildConfig.updateMany({
					where: { guildId },
					data: { premiumTier: 'Free', premiumExpiresAt: null, redeemedPremiumCode: null },
				});

				stopGuildScan(guildId);
				return interaction.editReply({ content: `\`✅\` Premium removed for guild ${guildId}` });
			}

			if (sub === 'renew') {
				const guildId = interaction.options.getString('guildid', true);
				const days = interaction.options.getInteger('days', true);

				const guild = await client.prisma.guildConfig.findUnique({ where: { guildId } });
				if (!guild) return interaction.editReply({ content: `\`❌\` Guild not found.` });

				const now = new Date();
				const currentExpiry = guild.premiumExpiresAt ?? now;
				const newExpiry = new Date(Math.max(currentExpiry.getTime(), now.getTime()));
				newExpiry.setDate(newExpiry.getDate() + days);

				await client.prisma.guildConfig.update({
					where: { guildId },
					data: { premiumExpiresAt: newExpiry },
				});

				return interaction.editReply({
					content: `\`✅\` Premium for guild ${guildId} has been extended by ${days} days. New expiry: ${newExpiry.toDateString()}`,
				});
			}
		} catch (err) {
			console.error(err);
			return interaction.editReply({ content: `\`❌\` An error occurred: ${String(err)}` });
		}
	},
};

export default command;
