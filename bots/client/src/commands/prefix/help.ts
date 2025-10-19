import { PrefixCommandInterface } from '@projectdiscord/shared';
import { BaseClient } from '@projectdiscord/core';
import {
	Message,
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	ComponentType,
	ButtonBuilder,
	ButtonStyle,
} from 'discord.js';
import path from 'path';
import { getAllVersions } from '@projectdiscord/core';

interface CommandInfo {
	name: string;
	description: string;
	category: string;
	cooldown: number;
	dev: boolean;
	usage?: string;
	aliases?: string[];
}

const command: PrefixCommandInterface = {
	name: 'help',
	description: 'Displays all prefix commands and their descriptions.',
	aliases: ['commands', 'cmds'],
	usage: 's?help',
	cooldown: 5,
	isDeveloperOnly: false,

	async execute(client: BaseClient, message: Message) {
		try {
			const prefixCommandsArray = Array.from(client.prefixCommands.values());

			const commands: CommandInfo[] = prefixCommandsArray.map((cmd: any) => {
				let category = 'Utility';
				if (cmd.filePath) {
					const folderName = path.basename(path.dirname(cmd.filePath));
					category = folderName.toLowerCase() === 'prefix' ? 'Utility' : folderName;
				}

				return {
					name: cmd.name,
					description: cmd.description || 'No description provided',
					category,
					cooldown: cmd.cooldown || 0,
					dev: cmd.isDeveloperOnly || false,
					usage: cmd.usage || '',
					aliases: cmd.aliases || [],
				};
			});

			// 🧹 Fjern duplikerede kommandoer
			const uniqueCommands = new Map();
			for (const cmd of commands) {
				if (!uniqueCommands.has(cmd.name)) {
					uniqueCommands.set(cmd.name, cmd);
				}
			}
			const filteredCommands = Array.from(uniqueCommands.values());

			const categories = [...new Set(filteredCommands.map((c) => c.category))];
			const versions = getAllVersions();
			const versionInfo = Object.entries(versions)
				.map(([ws, ver]) => `> • **${ws}**: \`${ver}\``)
				.join('\n');

			const homeEmbed = new EmbedBuilder()
				.setTitle('📖 Stachio Prefix Help Menu')
				.setDescription(
					[
						`Welcome to the **Stachio Prefix Help Center**, ${message.author}!`,
						'Browse command categories using the menu below to explore features and tools.',
						'',
						'**🧠 Quick Tips**',
						'> • Prefix commands start with `!` (e.g. `!ping`).',
						'> • Developer-only commands are marked with ⚙️.',
						'',
						'**📦 Stats**',
						`> 💬 Total Commands: \`${filteredCommands.length}\``,
						`> 📂 Categories: \`${categories.length}\``,
						'',
						'**🛠️ Versions**',
						versionInfo,
						'',
						'**🔗 Useful Links**',
						'🌐 [Dashboard](https://dashboard.stachio.dk) • 📚 [Docs](https://docs.projectdiscord.com) • 🛠️ [Support](https://stachio.dk/discord) • 🤖 [Invite](https://stachio.dk/invite) • 💵 [Store](https://stachio.dk/store)',
						'',
						'**💎 Premium Access**',
						'> ✨ Unlock faster cooldowns, higher limits, automation tools & early access.',
						'> 🛒 [Upgrade Now](https://stachio.dk/store)',
						'',
						'**🚫 Blacklist & Appeals**',
						'> Protected by our **Watchdog System**. Appeal via our [Support Discord](https://stachio.dk/discord).',
					].join('\n'),
				)
				.setThumbnail(client.user?.displayAvatarURL() || null)
				.setColor(client.config.colors.primary)
				.setFooter({
					text: `Requested by ${message.author.username} • !help`,
					iconURL: message.author.displayAvatarURL(),
				});

			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('prefix-help-menu')
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

			const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setLabel('🌐 Dashboard').setStyle(ButtonStyle.Link).setURL('https://dashboard.stachio.dk'),
				new ButtonBuilder().setLabel('📚 Docs').setStyle(ButtonStyle.Link).setURL('https://docs.projectdiscord.com'),
				new ButtonBuilder().setLabel('🛠️ Support').setStyle(ButtonStyle.Link).setURL('https://stachio.dk/discord'),
				new ButtonBuilder().setLabel('🤖 Invite').setStyle(ButtonStyle.Link).setURL('https://stachio.dk/invite'),
				new ButtonBuilder()
					.setLabel('💎 Get Premium')
					.setStyle(ButtonStyle.Link)
					.setURL('https://payrole.io/app/store?id=68dd974f163bff001237f1b9'),
			);

			const sent = await message.reply({
				embeds: [homeEmbed],
				components: [menuRow, buttonRow],
			});

			const collector = sent.createMessageComponentCollector({
				componentType: ComponentType.StringSelect,
				time: 90_000,
			});

			collector.on('collect', async (i: StringSelectMenuInteraction) => {
				try {
					if (i.user.id !== message.author.id)
						return i.reply({ content: '❌ You cannot use this menu.', ephemeral: true });

					const selected = i.values[0];
					if (selected === 'home') {
						await i.update({ embeds: [homeEmbed], components: [menuRow, buttonRow] });
						return;
					}

					const cmds = filteredCommands.filter((c) => c.category === selected);

					let descriptionText = cmds
						.map((c) =>
							[
								`🧩 **!${c.name}**${c.dev ? ' • ⚙️ *Developer Only*' : ''}`,
								`💬 ${c.description}`,
								c.usage ? `📘 Usage: \`${c.usage}\`` : '',
								c.aliases?.length ? `🔁 Aliases: \`${c.aliases.join(', ')}\`` : '',
								`⏱️ Cooldown: **${c.cooldown}s**`,
							]
								.filter(Boolean)
								.join('\n'),
						)
						.join('\n\n');

					// ⚠️ Sikring mod for lange embeds
					if (descriptionText.length > 4096) {
						descriptionText = descriptionText.slice(0, 4080) + '\n... (truncated)';
					}

					const catEmbed = new EmbedBuilder()
						.setTitle(`📂 ${selected} Commands`)
						.setColor(client.config.colors.info)
						.setDescription(descriptionText || 'No commands found in this category.')
						.setFooter({
							text: `${cmds.length} command${cmds.length !== 1 ? 's' : ''} in this category`,
						});

					await i.update({ embeds: [catEmbed], components: [menuRow, buttonRow] });
				} catch (err) {
					console.error('Error while updating help menu:', err);
				}
			});

			collector.on('end', async () => {
				try {
					const endedEmbed = EmbedBuilder.from(homeEmbed)
						.setColor(client.config.colors.secondary)
						.setFooter({ text: '⏰ Help menu expired — use !help again to reopen.' });

					const disabledMenu = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
					const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(disabledMenu);

					await sent.edit({ embeds: [endedEmbed], components: [disabledRow, buttonRow] }).catch(() => {});
				} catch (err) {
					console.error('Error cleaning up help menu:', err);
				}
			});
		} catch (error) {
			console.error('Help command error:', error);
			return message.reply('❌ An unexpected error occurred while showing the help menu.');
		}
	},
};

export default command;
