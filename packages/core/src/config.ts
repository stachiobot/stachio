import { ObjectNameIDArray } from '@projectdiscord/shared';
import 'dotenv/config';

interface BotInterface {
	client_token: string;
	client_id: string;
	client_secret: string;
	client_prefix: string;
}

export interface ProjectInterface {
	dashboard?: {
		port: number;
		domain: string;
		redirectUri: string;
		license: string;
		ownerIDs: string[];
		websiteName: string;
		colorScheme: 'dark' | 'pink' | 'blue' | 'red' | 'green' | 'yellow' | 'custom';
		supportMail: string;

		supportServerUrl?: string; // Discord invite
		supportSlashUrl?: string; // e.g. "/support"
		useUnderMaintenance?: boolean;
		underMaintenanceAccessKey?: string;
		underMaintenanceAccessPage?: string;
		theme?: {
			primaryColor: string;
			secondaryColor: string;
			backgroundImage?: string;
			favicon?: string;
			noGuildIcon?: string;
		};
		premium?: {
			enabled: boolean;
			title?: string;
			description?: string;
			buttonText?: string;
			buttonUrl?: string;
		};
		meta?: {
			description: string;
			ogImage?: string;
			twitterHandle?: string;
		};
		rateLimits?: {
			windowMs: number;
			max: number;
			message: string;
		};
	};
	client: BotInterface;
	helper: BotInterface;
	guilds: ObjectNameIDArray;
	colors: {
		success: number;
		error: number;
		warning: number;
		info: number;
		secondary: number;
		primary: number;
	};
}

export const config: ProjectInterface = {
	dashboard: {
		port: process.env.DASHBOARD_PORT as unknown as number,
		domain: process.env.DASHBOARD_DOMAIN as string,
		redirectUri: process.env.DASHBOARD_REDIRECT_URI as string,
		license: process.env.DASHBOARD_LICENSE as string,
		ownerIDs: ['711712752246325343'],
		websiteName: 'Stachio.dk',
		colorScheme: 'pink',
		supportMail: 'support@stachio.dk',

		supportServerUrl: 'https://discord.gg/invite',
		supportSlashUrl: '/support',
		useUnderMaintenance: false,
		underMaintenanceAccessKey: process.env.UNDER_MAINT_KEY || 'totalsecretkey',
		underMaintenanceAccessPage: '/maintenance-access',
		theme: {
			primaryColor: '#ff0000',
			secondaryColor: '#ff0000',
			backgroundImage: 'https://www.imageshine.in/uploads/gallery/geometric-Blue-Wallpaper-Free-Download.jpg',
			favicon: 'https://github.com/ProjectDiscord.png',
			noGuildIcon: 'https://pnggrid.com/wp-content/uploads/2021/05/Discord-Logo-Circle-1024x1024.png',
		},
		premium: {
			enabled: true,
			title: 'Want more from Stachio?',
			description: 'Check out premium features below!',
			buttonText: 'Become Premium',
			buttonUrl: 'https://github.com/projectdiscord',
		},
		meta: {
			description: 'smh its a bot',
			ogImage: '',
			twitterHandle: '@stachio',
		},
		rateLimits: {
			windowMs: 15 * 60 * 1000,
			max: 100,
			message: 'Sorry, you are ratelimited!',
		},
	},
	client: {
		client_token: process.env.CLIENT_TOKEN as string,
		client_id: process.env.CLIENT_ID as string,
		client_secret: process.env.CLIENT_SECRET as string,
		client_prefix: process.env.CLIENT_PREFIX as string,
	},
	helper: {
		client_token: process.env.HELPER_CLIENT_TOKEN as string,
		client_id: process.env.HELPER_CLIENT_ID as string,
		client_secret: process.env.HELPER_CLIENT_SECRET as string,
		client_prefix: process.env.HELPER_CLIENT_PREFIX as string,
	},
	guilds: [
		{
			name: 'Stachio',
			id: '1413898198266941522',
		},
		{
			name: 'Stachio Development',
			id: '1415312628175339553',
		},
	],
	colors: {
		success: 0x57f287,
		error: 0xed4245,
		warning: 0xfaa61a,
		info: 0x5865f2,
		secondary: 0x37373d,
		primary: 0x5865f2,
	},
};
