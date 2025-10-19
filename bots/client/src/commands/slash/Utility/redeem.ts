import { SlashCommandInterface } from '@projectdiscord/shared';
import { BaseClient, scheduleGuildScan } from '@projectdiscord/core';
import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

const command: SlashCommandInterface = {
	cooldown: 5,
	isDeveloperOnly: false,
	data: new SlashCommandBuilder()
		.setName('redeem')
		.setDescription('Redeem a premium code for your guild')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addStringOption((options) => options.setName('code').setDescription('Premium code').setRequired(true)),
	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });
		const codeInput = interaction.options.getString('code', true);

		try {
			const code = await client.prisma.premiumCode.findUnique({ where: { code: codeInput } });
			if (!code) return interaction.editReply({ content: '`❌` Invalid premium code.' });
			if (code.redeemed) return interaction.editReply({ content: '`❌` This code has already been redeemed.' });

			const guildId = interaction.guild!.id;
			const expiresAt = new Date(Date.now() + code.duration * 86400000);

			await client.prisma.guildConfig.upsert({
				where: { guildId },
				update: { premiumTier: code.tier, premiumExpiresAt: expiresAt, redeemedPremiumCode: code.code },
				create: { guildId, premiumTier: code.tier, premiumExpiresAt: expiresAt, redeemedPremiumCode: code.code },
			});

			await client.prisma.premiumCode.update({
				where: { code: code.code },
				data: { redeemed: true },
			});

			scheduleGuildScan(client, guildId, code.tier);

			return interaction.editReply({
				content: `\`✅\` Guild upgraded to ${code.tier} premium until <t:${Math.floor(expiresAt.getTime() / 1000)}:F>`,
			});
		} catch (err) {
			console.error(err);
			return interaction.editReply({ content: `\`❌\` An error occurred: ${String(err)}` });
		}
	},
};

export default command;
