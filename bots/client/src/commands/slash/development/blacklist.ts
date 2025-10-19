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
} from '@projectdiscord/core';
import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, Guild } from 'discord.js';

const command: SlashCommandInterface = {
	cooldown: 5,
	isDeveloperOnly: true,
	data: new SlashCommandBuilder()
		.setName('blacklist')
		.setDescription('Manage the blacklist system')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((sub) =>
			sub
				.setName('add')
				.setDescription('Add a blacklist entry')
				.addStringOption((o) => o.setName('discordid').setDescription('Discord ID').setRequired(true))
				.addStringOption((o) =>
					o
						.setName('usertype')
						.setDescription('User type')
						.addChoices({ name: 'FiveM', value: 'FiveM' }, { name: 'General', value: 'General' })
						.setRequired(true),
				)
				.addStringOption((o) =>
					o
						.setName('status')
						.setDescription('Blacklist status')
						.addChoices(
							{ name: 'Permanent', value: 'PERMANENT' },
							{ name: 'Temporary', value: 'TEMPORARY' },
							{ name: 'Indefinite', value: 'INDEFINITE' },
						)
						.setRequired(true),
				)
				.addStringOption((o) => o.setName('reason').setDescription('Reason for blacklist'))
				.addStringOption((o) => o.setName('community').setDescription('Community name'))
				.addStringOption((o) => o.setName('reportedby').setDescription('Who reported this?'))
				.addStringOption((o) => o.setName('evidence').setDescription('Evidence link'))
				.addIntegerOption((o) => o.setName('expiresin').setDescription('Expiry in days (for TEMPORARY)')),
		)
		.addSubcommand((sub) =>
			sub
				.setName('update')
				.setDescription('Update a blacklist entry')
				.addIntegerOption((o) => o.setName('entryid').setDescription('Entry ID').setRequired(true))
				.addStringOption((o) => o.setName('status').setDescription('New status'))
				.addStringOption((o) => o.setName('reason').setDescription('Update reason'))
				.addStringOption((o) => o.setName('community').setDescription('Update community'))
				.addStringOption((o) => o.setName('reportedby').setDescription('Update reporter'))
				.addStringOption((o) => o.setName('evidence').setDescription('Update evidence'))
				.addIntegerOption((o) => o.setName('expiresin').setDescription('Expiry in days (TEMPORARY only)')),
		)
		.addSubcommand((sub) =>
			sub
				.setName('delete')
				.setDescription('Delete a blacklist entry')
				.addIntegerOption((o) => o.setName('entryid').setDescription('Entry ID').setRequired(true)),
		)
		.addSubcommand((sub) =>
			sub
				.setName('get')
				.setDescription('Get all blacklist entries for a user')
				.addStringOption((o) => o.setName('discordid').setDescription('Discord ID').setRequired(true)),
		)
		.addSubcommand((sub) =>
			sub
				.setName('remove-user')
				.setDescription('Completely remove a user from blacklist (and all their entries)')
				.addStringOption((o) => o.setName('discordid').setDescription('Discord ID').setRequired(true)),
		)
		.addSubcommand((sub) =>
			sub
				.setName('info')
				.setDescription('Get detailed info about a specific blacklist entry')
				.addIntegerOption((o) => o.setName('entryid').setDescription('Entry ID').setRequired(true)),
		)
		.addSubcommand((sub) =>
			sub
				.setName('scan')
				.setDescription('Scan the current guild for blacklisted users')
				.addStringOption((options) => options.setName('guildid').setDescription('Guild ID').setRequired(true)),
		),

	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });

		const sub = interaction.options.getSubcommand();

		try {
			if (sub === 'add') {
				const discordId = interaction.options.getString('discordid', true);
				const usertype = interaction.options.getString('usertype', true) as 'FiveM' | 'General';
				const status = interaction.options.getString('status', true) as 'PERMANENT' | 'TEMPORARY' | 'INDEFINITE';
				const reason = interaction.options.getString('reason') ?? undefined;
				const community = interaction.options.getString('community') ?? undefined;
				const reportedBy = interaction.options.getString('reportedby') ?? interaction.user.username;
				const evidence = interaction.options.getString('evidence') ?? undefined;
				const expiresIn = interaction.options.getInteger('expiresin');

				const expiresAt = status === 'TEMPORARY' && expiresIn ? new Date(Date.now() + expiresIn * 86400000) : undefined;

				const entry = await addBlacklistEntry(discordId, {
					usertype,
					status,
					reason,
					community,
					reportedBy,
					evidence,
					expiresAt,
				});

				return interaction.editReply({ content: `\`✅\` Added blacklist entry \`${entry.id}\` for user ${discordId}` });
			}

			if (sub === 'update') {
				const entryId = interaction.options.getInteger('entryid', true);
				const updates: any = {};

				if (interaction.options.getString('status'))
					updates.status = interaction.options.getString('status') as 'PERMANENT' | 'TEMPORARY' | 'INDEFINITE';
				if (interaction.options.getString('reason')) updates.reason = interaction.options.getString('reason');
				if (interaction.options.getString('community')) updates.community = interaction.options.getString('community');
				if (interaction.options.getString('reportedby'))
					updates.reportedBy = interaction.options.getString('reportedby');
				if (interaction.options.getString('evidence')) updates.evidence = interaction.options.getString('evidence');

				const expiresIn = interaction.options.getInteger('expiresin');
				if (expiresIn) updates.expiresAt = new Date(Date.now() + expiresIn * 86400000);

				const updated = await updateBlacklistEntry(entryId, updates);

				return interaction.editReply({ content: `\`✏️\` Updated entry \`${updated.id}\`.` });
			}

			if (sub === 'delete') {
				const entryId = interaction.options.getInteger('entryid', true);
				await deleteBlacklistEntry(entryId);

				return interaction.editReply({ content: `\`🗑️\` Deleted entry \`${entryId}\`.` });
			}

			if (sub === 'get') {
				const discordId = interaction.options.getString('discordid', true);
				const entries = await getUserBlacklistEntries(discordId);

				if (!entries!.length) return interaction.editReply({ content: `\`ℹ️\` No entries found for ${discordId}.` });

				const list = entries!
					.map((e) => `\`•\` \`[${e.id}]\` ${e.status} (${e.usertype}) - ${e.reason ?? 'No reason'}`)
					.join('\n');

				return interaction.editReply({ content: `**\`📋\` Entries for \`${discordId}\`**:\n${list}` });
			}

			if (sub === 'remove-user') {
				const discordId = interaction.options.getString('discordid', true);
				await deleteBlacklistedUser(discordId);

				return interaction.editReply({ content: `\`🚫\` Completely removed ${discordId} from blacklist.` });
			}

			if (sub === 'info') {
				const entryId = interaction.options.getInteger('entryid', true);

				const entry = await getBlacklistEntryById(entryId);

				if (!entry) return interaction.editReply({ content: `\`❌\` No entry found with ID ${entryId}.` });

				const lines = [
					`**User Type:** ${entry.usertype}`,
					`**Status:** ${entry.status}`,
					`**Community:** ${entry.community ?? 'N/A'}`,
					`**Reason:** ${entry.reason ?? 'No reason provided'}`,
					`**Reported By:** ${entry.reportedBy ?? 'Unknown'}`,
					`**Evidence:** ${entry.evidence ?? 'No evidence'}`,
					`**Active:** ${entry.active ? '✅ Yes' : '❌ No'}`,
					`**Expires At:** ${entry.expiresAt ? `<t:${Math.floor(entry.expiresAt.getTime() / 1000)}:F>` : 'Never'}`,
				];

				const embed = new EmbedBuilder()
					.setTitle(`📝 Blacklist Entry #${entry.id}`)
					.setColor(entry.status === 'PERMANENT' ? 0xff0000 : 0xffa500)
					.setDescription(lines.join('\n'))
					.setFooter({ text: `Discord ID: ${entry.user?.discordId ?? 'Unknown'}` })
					.setTimestamp();

				return interaction.editReply({ embeds: [embed] });
			}

			if (sub === 'scan') {
				const guildId = interaction.options.getString('guildid');
				const guild = await client.guilds.fetch(guildId!);
				
				await scanGuild(guild);

				return interaction.editReply({ content: `\`🔍\` Scan completed for guild \`${interaction.guild!.name}\`.` });
			}
		} catch (err) {
			console.error(err);
			return interaction.editReply({ content: `\`❌\` An error occurred: ${String(err)}` });
		}
	},
};

export default command;
