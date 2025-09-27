import SoftUI from 'dbd-soft-ui';
import { BaseClient, config } from '@projectdiscord/core';
import DBD from 'discord-dashboard';
import DLU from '@dbd-soft-ui/logs';
import KeyvMysql from '@keyv/mysql';
import 'dotenv/config';

const client = new BaseClient();
client.login(config.client.client_token);

// @ts-expect-error
const Handler = new DBD.Handler({ store: new KeyvMysql(process.env.DATABASE_URL) });

client.on('ready', () => {
	DLU.register(client, {
		dashboard_url: config.dashboard?.domain as string,
		key: config.dashboard!.license,
	});
});

(async () => {
	if (!config.dashboard?.license) {
		throw new Error('Dashboard license missing in config.');
	}
	await DBD.useLicense(config.dashboard.license);
	DBD.Dashboard = DBD.UpdatedClass();

	const Dashboard = new DBD.Dashboard({
		port: config.dashboard?.port,
		client: { id: config.client.client_id, secret: config.client.client_secret },
		redirectUri: `${config.dashboard?.domain}${config.dashboard?.redirectUri}`,
		domain: config.dashboard?.domain,
		ownerIDs: config.dashboard?.ownerIDs,
		acceptPrivacyPolicy: true,
		noCreateServer: false,
		useCategorySet: true,
		invite: {
			clientId: config.client.client_id,
			scopes: ['bot', 'applications.commands'],
			permissions: '139452737783',
			redirectUri: config.dashboard?.domain,
		},
		guildAfterAuthorization: {
			use: true,
			guildId: config.guilds[0].id, // grabs first guild from config
		},
		minimizedLogs: false,
		rateLimits: {
			manage: {
				windowMs: config.dashboard?.rateLimits?.windowMs || 15 * 60 * 1000,
				max: config.dashboard?.rateLimits?.max || 100,
				message: config.dashboard?.rateLimits?.message || 'You are being rate limited!',
				store: null,
			},
		},
		requiredPermissions: Object.values(DBD.DISCORD_FLAGS.Permissions), // full perms
		supportServer: {
			slash: config.dashboard?.supportSlashUrl || '/support',
			inviteUrl: config.dashboard?.supportServerUrl || '',
		},
		underMaintenanceAccessKey: config.dashboard?.underMaintenanceAccessKey,
		underMaintenanceAccessPage: config.dashboard?.underMaintenanceAccessPage,
		useUnderMaintenance: config.dashboard?.useUnderMaintenance || false,
		underMaintenance: {
			title: "🚧 We're Upgrading!",
			contentTitle: 'This page is temporarily unavailable',
			texts: [
				'👷‍♂️ Our team is currently performing scheduled improvements.',
				"We're making changes to bring you faster, smoother, and more reliable services.",
				'<br>',
				`⏳ Please check back soon. Meanwhile, join our <a href="${config.dashboard?.supportServerUrl}">Discord Support Server</a> for updates!`,
			],
			bodyBackgroundColors: ['#ffa191', '#ffc247'],
			buildingsColor: '#ff6347',
			craneDivBorderColor: '#ff6347',
			craneArmColor: '#f88f7c',
			craneWeightColor: '#f88f7c',
			outerCraneColor: '#ff6347',
			craneLineColor: '#ff6347',
			craneCabinColor: '#f88f7c',
			craneStandColors: ['#ff6347', '#f29b8b'],
		},
		useTheme: true,
		bot: client,
		useTheme404: true,
		theme: SoftUI({
			customThemeOptions: {
				index: async ({ req, res, config }) => {
					return {
						cards: [
							{
								icon: 'fas fa-server',
								getValue: `${client.guilds.cache.size} Servers`,
							},
							{
								icon: 'fas fa-users',
								getValue: `${client.users.cache.size} Users`,
								progressBar: {
									enabled: true,
									getProgress: Math.min((client.users.cache.size / 1000) * 100, 100),
								},
							},
						],
						graph: {
							values: [30, 40, 50, 70],
							labels: ['10s', '20s', '30s', '40s'],
						},
					};
				},
			},
			websiteName: config.dashboard?.websiteName!,
			colorScheme: config.dashboard?.colorScheme!,
			themeColors: {
				primaryColor: config.dashboard?.theme?.primaryColor || '#5865F2',
				secondaryColor: config.dashboard?.theme?.secondaryColor || '#99AAB5',
			},
			supporteMail: config.dashboard?.supportMail!,
			icons: {
				// @ts-expect-error
				backgroundImage: config.dashboard?.theme?.backgroundImage,
				favicon: config.dashboard?.theme?.favicon!,
				noGuildIcon: config.dashboard?.theme?.noGuildIcon!,
				sidebar: {
					darkUrl: config.dashboard?.theme?.favicon!,
					lightUrl: config.dashboard?.theme?.favicon!,
					hideName: false,
					borderRadius: false,
					alignCenter: true,
				},
			},
			index: {
				graph: {
					enabled: true,
					lineGraph: false,
					tag: 'Memory (MB)',
					max: 100,
				},
			},
			sweetalert: {
				errors: {
					requirePremium: 'You need to be a premium member to do this.',
				},
				success: {
					login: 'Successfully logged in.',
				},
			},
			preloader: {
				image: '/img/soft-ui.webp',
				spinner: false,
				text: 'Page is loading',
			},
			addons: ['@softui'],
			locales: {},
			footer: {
				replaceDefault: true,
				text: 'Bot Template by ProjectDiscord',
			},
			admin: {
				pterodactyl: {
					enabled: false,
					apiKey: '',
					panelLink: '',
					serverUUIDs: [],
				},
				logs: {
					enabled: false,
					key: 'place your key here!',
				},
			},
			premium: {
				enabled: config.dashboard?.premium?.enabled || false,
				card: {
					title: config.dashboard?.premium?.title!,
					description: config.dashboard?.premium?.description!,
					bgImage: config.dashboard?.theme?.backgroundImage!,
					button: {
						text: config.dashboard?.premium?.buttonText!,
						url: config.dashboard?.premium?.buttonUrl!,
					},
				},
			},
			meta: {
				author: 'ProjectDiscord',
				owner: 'ProjectDiscord',
				description: config.dashboard?.meta?.description || 'Bot dashboard',
				ogLocale: 'en_US',
				ogTitle: `${config.dashboard?.websiteName} Bot Dashboard`,
				ogImage: config.dashboard?.meta?.ogImage!,
				ogType: 'website',
				ogUrl: config.dashboard?.domain || '',
				ogSiteName: `${config.dashboard?.websiteName} Dashboard`,
				ogDescription: config.dashboard?.meta?.description!,
				twitterTitle: `${config.dashboard?.websiteName} Bot Dashboard`,
				twitterDescription: config.dashboard?.meta?.description!,
				twitterDomain: config.dashboard?.domain || '',
				twitterUrl: config.dashboard?.domain || '',
				twitterCard: 'summary',
				twitterSite: config.dashboard?.meta?.twitterHandle!,
				twitterCreator: config.dashboard?.meta?.twitterHandle!,
				twitterImage: config.dashboard?.meta?.ogImage!,
				twitterSiteId: '',
				twitterCreatorId: '',
			},
			error: {
				error404: {
					title: 'Error 404',
					subtitle: 'Page Not Found',
					description: 'It seems you have stumbled into the abyss. Click the button below to return to the dashboard',
				},
				dbdError: {
					disableSecretMenu: false,
					secretMenuCombination: ['69', '82', '82', '79', '82'],
				},
			},
			blacklisted: {
				title: 'Blacklisted',
				subtitle: 'Access denied',
				description: 'Unfortunately it seems that you have been blacklisted from the dashboard.',
				button: {
					enabled: false,
					text: 'Return',
					link: 'https://google.com',
				},
			},
			storage: Handler,
		}),
		settings: [],
	});

	Dashboard.init();
})();
