import { SlashCommandInterface } from '@projectdiscord/shared';
import { BaseClient, getAllVersions } from '@projectdiscord/core';
import {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	ComponentType,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder as ButtonRow,
} from 'discord.js';
import path from 'path';

interface CommandInfo {
	name: string;
	description: string;
	category: string;
	cooldown: number;
	dev: boolean;
}

const command: SlashCommandInterface = {
	cooldown: 5,
	isDeveloperOnly: false,
	data: new SlashCommandBuilder().setName('help').setDescription('View all commands and their descriptions'),

	async execute(client: BaseClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });

		const slashCommandsArray = Array.from(client.slashCommands.values());

		const commands: CommandInfo[] = slashCommandsArray.flatMap((cmd: any) => {
			let category = 'Utility';
			if (cmd.filePath) {
				const folderName = path.basename(path.dirname(cmd.filePath));
				category = folderName.toLowerCase() === 'slash' ? 'Utility' : folderName;
			}

			const baseCommand: CommandInfo = {
				name: cmd.data.name,
				description: cmd.data.description || 'No description provided',
				category,
				cooldown: cmd.cooldown || 0,
				dev: cmd.isDeveloperOnly || false,
			};

			if ('options' in cmd.data && Array.isArray(cmd.data.options) && cmd.data.options.length > 0) {
				const optionsJSON = cmd.data.options.map((opt: any) => opt.toJSON());
				const subs = optionsJSON
					.filter((o: any) => o.type === 1 || o.type === 2)
					.flatMap((o: any) => {
						if (o.type === 1) {
							return [
								{
									name: `${cmd.data.name} ${o.name}`,
									description: o.description || 'No description provided',
									category,
									cooldown: cmd.cooldown || 0,
									dev: cmd.isDeveloperOnly || false,
								},
							];
						} else if (o.type === 2 && o.options) {
							return o.options.map((sub: any) => ({
								name: `${cmd.data.name} ${o.name} ${sub.name}`,
								description: sub.description || 'No description provided',
								category,
								cooldown: cmd.cooldown || 0,
								dev: cmd.isDeveloperOnly || false,
							}));
						}
						return [];
					});

				return [baseCommand, ...subs];
			}

			return [baseCommand];
		});

		const categories = [...new Set(commands.map((c) => c.category))];

		const versions = getAllVersions();
		const versionInfo = Object.entries(versions)
			.map(([ws, ver]) => `> • **${ws}**: \`${ver}\``)
			.join('\n');

		const homeEmbed = new EmbedBuilder()
			.setTitle('📖 Command Help Menu')
			.setDescription(
				[
					`Welcome to the **Stachio Help Center**, ${interaction.user}!`,
					'Browse command categories using the menu below to explore features and tools.',
					'',
					'**🧠 Quick Tips**',
					'> • Use `/commandname` directly to execute a command.',
					'> • Developer-only commands are marked with ⚙️.',
					'',
					'**📦 Stats**',
					`> 💬 Total Commands: \`${commands.length}\``,
					`> 📂 Categories: \`${categories.length}\``,
					'**🛠️ Versions**',
					versionInfo,
					'',
					'**🔗 Useful Links**',
					'🌐 [Dashboard](https://dashboard.stachio.dk) • 📚 [Docs](https://docs.projectdiscord.com) • 🛠️ [Support](https://stachio.dk/discord) • 🤖 [Invite](https://stachio.dk/invite) • 💵 [Store](https://stachio.dk/store)',
					'',
					'**💎 Premium Access**',
					'> ✨ Unlock faster cooldowns, higher limitations on features, automation tools & early access.',
					'> 🛒 [Upgrade Now](https://stachio.dk/store)',
					'',
					'**🚫 Blacklist & Appeals**',
					'> Protected by our **Watchdog System**. Appeal via our [Support Discord](https://stachio.dk/discord).',
				].join('\n'),
			)
			.setThumbnail(interaction.client.user?.displayAvatarURL() || null)
			.setColor(client.config.colors.primary)
			.setFooter({
				text: `Requested by ${interaction.user.username} • /help`,
				iconURL: interaction.user.displayAvatarURL(),
			});

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('help-menu')
			.setPlaceholder('📂 Choose a category...')
			.addOptions([
				{
					label: '🏠 Home',
					value: 'home',
					description: 'Return to the main help overview',
					emoji: '🏠',
				},
				...categories.map((cat) => ({
					label: cat,
					value: cat,
					description: `View commands in ${cat}`,
					emoji: '📁',
				})),
			]);

		const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

		const buttonRow = new ButtonRow<ButtonBuilder>().addComponents(
			new ButtonBuilder().setLabel('🌐 Dashboard').setStyle(ButtonStyle.Link).setURL('https://dashboard.stachio.dk'),
			new ButtonBuilder().setLabel('📚 Docs').setStyle(ButtonStyle.Link).setURL('https://docs.projectdiscord.com'),
			new ButtonBuilder().setLabel('🛠️ Support').setStyle(ButtonStyle.Link).setURL('https://stachio.dk/discord'),
			new ButtonBuilder().setLabel('🤖 Invite').setStyle(ButtonStyle.Link).setURL('https://stachio.dk/invite'),
			new ButtonBuilder()
				.setLabel('💎 Get Premium')
				.setStyle(ButtonStyle.Link)
				.setURL('https://payrole.io/app/store?id=68dd974f163bff001237f1b9'),
		);

		const reply = await interaction.editReply({
			embeds: [homeEmbed],
			components: [menuRow, buttonRow],
		});

		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 90_000,
		});

		collector.on('collect', async (i: StringSelectMenuInteraction) => {
			if (i.user.id !== interaction.user.id)
				return i.reply({ content: '❌ You cannot use this menu.', ephemeral: true });

			const selected = i.values[0];
			if (selected === 'home') {
				await i.update({ embeds: [homeEmbed], components: [menuRow, buttonRow] });
				return;
			}

			const cmds = commands.filter((c) => c.category === selected);

			const catEmbed = new EmbedBuilder()
				.setTitle(`📂 ${selected} Commands`)
				.setColor(client.config.colors.info)
				.setDescription(
					cmds.length > 0
						? cmds
								.map((c) =>
									[
										`🧩 **/${c.name.replace(/\s+/g, ' ')}**${c.dev ? ' • ⚙️ *Developer Only*' : ''}`,
										`💬 ${c.description}`,
										`⏱️ Cooldown: **${c.cooldown}s**`,
									].join('\n'),
								)
								.join('\n\n')
						: 'No commands found in this category.',
				)
				.setFooter({
					text: `${cmds.length} command${cmds.length !== 1 ? 's' : ''} in this category`,
				});

			await i.update({ embeds: [catEmbed], components: [menuRow, buttonRow] });
		});

		collector.on('end', async () => {
			const endedEmbed = EmbedBuilder.from(homeEmbed)
				.setColor(client.config.colors.secondary)
				.setFooter({ text: '⏰ Help menu expired — use /help again to reopen.' });

			const disabledMenu = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
			const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(disabledMenu);

			await reply.edit({ embeds: [endedEmbed], components: [disabledRow, buttonRow] }).catch(() => {});
		});
	},
};

export default command;
