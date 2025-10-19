export const premiumLimits = {
	Free: {
		maxBlacklistChecks: 25, // Checks every guild join if watchdog enabled
		watchdogEnabled: true,
		apiAccess: false,
		priority: 1,
		supportLevel: 'Standard',
		memberScanInterval: null, // 🚫 No auto scans
	},
	Silver: {
		maxBlacklistChecks: 75, // Checks every guild join if watchdog enabled
		watchdogEnabled: true,
		apiAccess: false,
		priority: 2,
		supportLevel: 'Standard',
		memberScanInterval: 72, // ⏰ every 72h (3 days)
	},
	Gold: {
		maxBlacklistChecks: 125, // Checks every guild join if watchdog enabled
		watchdogEnabled: true,
		apiAccess: true,
		priority: 3,
		supportLevel: 'Priority',
		memberScanInterval: 24, // ⏰ every 24h (1 day)
	},
	Platinum: {
		maxBlacklistChecks: Infinity, // Checks every guild join if watchdog enabled
		watchdogEnabled: true,
		apiAccess: true,
		priority: 5,
		supportLevel: 'Dedicated',
		memberScanInterval: 12, // ⏰ every 12h (half a day)
	},
};
