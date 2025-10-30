import { SlashCommandInterface } from '@projectdiscord/shared';
import {
	BaseClient,
	addBlacklistEntry,
	updateBlacklistEntry,
	deleteBlacklistEntry,
	deleteBlacklistedUser,
	getUserBlacklistEntries,
	getBlacklistEntryById,
	scanGuild,
	sendGuildActionLog,
} from '@projectdiscord/core';
import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { BlacklistStatus, GuildCategory, UserType, UserCategory } from '@prisma/client';

const command: SlashCommandInterface = {
	cooldown: 5,
	isDeveloperOnly: true,
	data: new SlashCommandBuilder()
		.setName('blacklist')
		.setDescription('Manage the blacklist system')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

		// ADD
		.addSubcommand((sub) =>
			sub
				.setName('add')
				.setDescription('Add a blacklist entry')
				.addUserOption((o) => o.setName('discordid').setDescription('Discord user to blacklist').setRequired(true))
				.addStringOption((o) =>
					o
						.setName('category')
						.setDescription('User Category')
						.addChoices(
							{ name: 'Scammer', value: 'SCAMMER' },
							{ name: 'Advertiser', value: 'ADVERTISER' },
							{ name: 'DDoSer', value: 'DDOSER' },
							{ name: 'Other', value: 'OTHER' },
						)
						.setRequired(true),
				)
				.addStringOption((o) =>
					o
						.setName('usertype')
						.setDescription('Where the blacklist applies')
						.addChoices({ name: 'FiveM', value: 'FiveM' }, { name: 'General', value: 'General' })
						.setRequired(true),
				)
				.addStringOption((o) =>
					o
						.setName('status')
						.setDescription('Blacklist type')
						.addChoices(
							{ name: 'Permanent', value: 'PERMANENT' },
							{ name: 'Temporary', value: 'TEMPORARY' },
							{ name: 'Indefinite', value: 'INDEFINITE' },
						)
						.setRequired(true),
				)
				.addStringOption((o) => o.setName('reason').setDescription('Reason'))
				.addStringOption((o) => o.setName('community').setDescription('Community name'))
				.addStringOption((o) => o.setName('reportedby').setDescription('Reporter'))
				.addStringOption((o) => o.setName('evidence').setDescription('Evidence link'))
				.addIntegerOption((o) => o.setName('expiresin').setDescription('Expiry in days (TEMPORARY only)')),
		)

		// UPDATE
		.addSubcommand((sub) =>
			sub
				.setName('update')
				.setDescription('Update a blacklist entry')
				.addIntegerOption((o) => o.setName('entryid').setDescription('Entry ID').setRequired(true))
				.addStringOption((o) => o.setName('category').setDescription('New category'))
				.addStringOption((o) => o.setName('status').setDescription('New status'))
				.addStringOption((o) => o.setName('reason').setDescription('New reason'))
				.addStringOption((o) => o.setName('community').setDescription('New community'))
				.addStringOption((o) => o.setName('reportedby').setDescription('Updated reporter'))
				.addStringOption((o) => o.setName('evidence').setDescription('New evidence'))
				.addIntegerOption((o) => o.setName('expiresin').setDescription('Expiry in days')),
		)

		// DELETE
		.addSubcommand((sub) =>
			sub
				.setName('delete')
				.setDescription('Delete a blacklist entry')
				.addIntegerOption((o) => o.setName('entryid').setDescription('Entry ID').setRequired(true)),
		)

		// GET USER ENTRIES
		.addSubcommand((sub) =>
			sub
				.setName('get')
				.setDescription('Get blacklist entries for a user')
				.addUserOption((o) => o.setName('discordid').setDescription('Discord ID').setRequired(true)),
		)

		// REMOVE USER
		.addSubcommand((sub) =>
			sub
				.setName('remove-user')
				.setDescription('Remove user and all blacklist entries')
				.addUserOption((o) => o.setName('discordid').setDescription('Discord ID').setRequired(true)),
		)

		// ENTRY INFO
		.addSubcommand((sub) =>
			sub
				.setName('info')
				.setDescription('Get detailed info about a blacklist entry')
				.addIntegerOption((o) => o.setName('entryid').setDescription('Entry ID').setRequired(true)),
		)

		// SCAN
		.addSubcommand((sub) =>
			sub
				.setName('scan')
				.setDescription('Scan a guild for blacklisted users')
				.addStringOption((o) => o.setName('guildid').setDescription('Guild ID').setRequired(true)),
		),

	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });

		const sub = interaction.options.getSubcommand();

		if (sub === 'add') {
			const user = interaction.options.getUser('discordid', true);
			const category = interaction.options.getString('category', true) as UserCategory;
			const usertype = interaction.options.getString('usertype', true) as UserType;
			const status = interaction.options.getString('status', true) as BlacklistStatus;
			const reason = interaction.options.getString('reason') ?? undefined;
			const community = interaction.options.getString('community') ?? undefined;
			const reportedBy = interaction.options.getString('reportedby') ?? interaction.user.username;
			const evidence = interaction.options.getString('evidence') ?? undefined;
			const expiresIn = interaction.options.getInteger('expiresin');

			const expiresAt =
				status === BlacklistStatus.TEMPORARY && expiresIn ? new Date(Date.now() + expiresIn * 86400000) : null;

			const entry = await addBlacklistEntry(user.id, user.username, {
				category,
				usertype,
				status,
				community,
				reason,
				reportedBy,
				evidence,
				expiresAt,
			});

			return interaction.editReply({
				content: `\`✅\` Added blacklist entry **#${entry.id}** to **${user.username}**`,
			});
		}

		if (sub === 'update') {
			const entryId = interaction.options.getInteger('entryid', true);
			const updates: any = {};

			if (interaction.options.getString('category'))
				updates.category = interaction.options.getString('category') as UserCategory;
			if (interaction.options.getString('status'))
				updates.status = interaction.options.getString('status') as BlacklistStatus;
			if (interaction.options.getString('reason')) updates.reason = interaction.options.getString('reason');
			if (interaction.options.getString('community')) updates.community = interaction.options.getString('community');
			if (interaction.options.getString('reportedby')) updates.reportedBy = interaction.options.getString('reportedby');
			if (interaction.options.getString('evidence')) updates.evidence = interaction.options.getString('evidence');

			const expiresIn = interaction.options.getInteger('expiresin');
			if (expiresIn) updates.expiresAt = new Date(Date.now() + expiresIn * 86400000);

			await updateBlacklistEntry(entryId, updates);

			return interaction.editReply({ content: `\`✏️\` Updated entry **#${entryId}**.` });
		}

		if (sub === 'delete') {
			const entryId = interaction.options.getInteger('entryid', true);
			await deleteBlacklistEntry(entryId);
			return interaction.editReply({ content: `\`🗑️\` Deleted entry **#${entryId}**.` });
		}

		if (sub === 'get') {
			const discordId = interaction.options.getUser('discordid', true).id;
			const entries = await getUserBlacklistEntries(discordId);

			if (!entries?.length) return interaction.editReply({ content: `\`ℹ️\` No blacklist entries found.` });

			const list = entries
				.map((e) => `• **#${e.id}** | ${e.status} | ${e.usercategory} | ${e.reason ?? 'No reason'}`)
				.join('\n');

			return interaction.editReply({ content: `**Entries:**\n${list}` });
		}

		if (sub === 'remove-user') {
			const discordId = interaction.options.getUser('discordid', true).id;
			await deleteBlacklistedUser(discordId);
			return interaction.editReply({ content: `\`🚫\` Removed user and all entries.` });
		}

		if (sub === 'info') {
			const entryId = interaction.options.getInteger('entryid', true);
			const entry = await getBlacklistEntryById(entryId);

			if (!entry) return interaction.editReply({ content: `\`❌\` Entry does not exist.` });

			const embed = new EmbedBuilder()
				.setTitle(`Blacklist Entry #${entry.id}`)
				.setColor(client.config.colors.primary)
				.setDescription(
					[
						`**User:** ${entry.user?.username} (${entry.user?.discordId})`,
						`**Category:** ${entry.usercategory}`,
						`**Type:** ${entry.usertype}`,
						`**Status:** ${entry.status}`,
						`**Reason:** ${entry.reason ?? 'None'}`,
						`**Evidence:** ${entry.evidence ?? 'None'}`,
						`**Expires:** ${entry.expiresAt ? `<t:${Math.floor(entry.expiresAt.getTime() / 1000)}:R>` : 'Never'}`,
					].join('\n'),
				);

			return interaction.editReply({ embeds: [embed] });
		}

		if (sub === 'scan') {
			const guildId = interaction.options.getString('guildid', true);
			const guild = await client.guilds.fetch(guildId);
			await scanGuild(guild);
			return interaction.editReply({ content: `\`🔍\` Scan completed.` });
		}
	},
};

export default command;
