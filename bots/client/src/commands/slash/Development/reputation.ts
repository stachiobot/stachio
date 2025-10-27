import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import {
	BaseClient,
	getOrCreateReputation,
	addPositive,
	addNegative,
	resetReputation,
	addStrike,
	removeStrike,
	buildReputationEmbed,
	hasStaffRole,
} from '@projectdiscord/core';
import { SlashCommandInterface } from '@projectdiscord/shared';
import { StaffRoles } from '@prisma/client';

const command: SlashCommandInterface = {
	cooldown: 5,
	isDeveloperOnly: true,
	data: new SlashCommandBuilder()
		.setName('reputation')
		.setDescription("Manage or view a user's reputation / trust score.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addSubcommand((sub) =>
			sub
				.setName('view')
				.setDescription('View a user’s reputation')
				.addUserOption((o) => o.setName('user').setDescription('The user to view').setRequired(true)),
		)
		.addSubcommand((sub) =>
			sub
				.setName('add')
				.setDescription('Add positive reputation')
				.addUserOption((o) => o.setName('user').setDescription('The user to modify').setRequired(true))
				.addStringOption((o) => o.setName('note').setDescription('Optional note for the positive rep')),
		)
		.addSubcommand((sub) =>
			sub
				.setName('remove')
				.setDescription('Add negative reputation')
				.addUserOption((o) => o.setName('user').setDescription('The user to modify').setRequired(true))
				.addStringOption((o) => o.setName('note').setDescription('Optional note for the negative rep')),
		)
		.addSubcommand((sub) =>
			sub
				.setName('strike')
				.setDescription('Add a strike to a user')
				.addUserOption((o) => o.setName('user').setDescription('The user to strike').setRequired(true))
				.addStringOption((o) => o.setName('reason').setDescription('Reason for the strike')),
		)
		.addSubcommand((sub) =>
			sub
				.setName('strike-remove')
				.setDescription('Remove a strike from a user')
				.addUserOption((o) => o.setName('user').setDescription('The user to remove a strike from').setRequired(true))
				.addStringOption((o) => o.setName('reason').setDescription('Reason for removal')),
		)
		.addSubcommand((sub) =>
			sub
				.setName('reset')
				.setDescription('Reset a user’s reputation to default')
				.addUserOption((o) => o.setName('user').setDescription('The user to reset').setRequired(true)),
		),

	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });

		const sub = interaction.options.getSubcommand();
		const user = interaction.options.getUser('user', true);
		const note = interaction.options.getString('note') || interaction.options.getString('reason') || undefined;

		let rep;

		const hasPermission = await hasStaffRole(interaction.guildId!, interaction.user.id, [
			StaffRoles.Moderator,
			StaffRoles.Senior_Moderator,
			StaffRoles.Trial_Administrator,
			StaffRoles.Administrator,
			StaffRoles.Senior_Administrator,
			StaffRoles.Owner,
		]);

		if (!hasPermission) {
			await interaction.editReply({
				content: '`🚫` You do not have the correct role to use this command.',
			});
			return;
		}

		switch (sub) {
			case 'view':
				rep = await getOrCreateReputation(user.id, user.username);
				await interaction.editReply({
					embeds: [buildReputationEmbed(user.username, rep, user.displayAvatarURL())],
				});
				break;

			case 'add':
				rep = await addPositive(user.id, user.username, note);
				await interaction.editReply({
					content: `\`✅\` Added positive reputation to **${user.username}** — trust score now **${rep.trustScore}/100**.`,
				});
				break;

			case 'remove':
				rep = await addNegative(user.id, user.username, note);
				await interaction.editReply({
					content: `\`⚠️\` Added negative reputation to **${user.username}** — trust score now **${rep.trustScore}/100**.`,
				});
				break;

			case 'strike':
				rep = await addStrike(user.id, note);
				await interaction.editReply({
					content: `\`🚨\` Strike added to **${user.username}** — trust score now **${rep?.trustScore}/100**.`,
				});
				break;

			case 'strike-remove':
				rep = await removeStrike(user.id, note);
				await interaction.editReply({
					content: `\`🕊️\` Strike removed from **${user.username}** — trust score now **${rep?.trustScore}/100**.`,
				});
				break;

			case 'reset':
				await resetReputation(user.id);
				await interaction.editReply({
					content: `\`🔄\` Reputation for **${user.username}** has been reset.`,
				});
				break;
		}
	},
};

export default command;
