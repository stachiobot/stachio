import { PrismaClient } from '@prisma/client';
import { EmbedBuilder } from 'discord.js';

const prisma = new PrismaClient();

export async function getOrCreateReputation(userId: string, username: string) {
	let rep = await prisma.userReputation.findUnique({ where: { userId } });
	if (!rep) {
		rep = await prisma.userReputation.create({
			data: { userId, username },
		});
	}
	return rep;
}

export async function addPositive(userId: string, username: string, note?: string) {
	let rep = await getOrCreateReputation(userId, username);
	const newScore = Math.min(rep.trustScore + 5, 100);

	rep = await prisma.userReputation.update({
		where: { userId },
		data: {
			trustScore: newScore,
			positive: rep.positive + 1,
			notes: appendNote(rep.notes, `✅ Positive feedback: ${note || 'No note provided'}`),
		},
	});

	return rep;
}

export async function addNegative(userId: string, username: string, note?: string) {
	let rep = await getOrCreateReputation(userId, username);
	const newScore = Math.max(rep.trustScore - 5, 0);
	const addStrike = newScore <= 20;

	rep = await prisma.userReputation.update({
		where: { userId },
		data: {
			trustScore: newScore,
			negative: rep.negative + 1,
			strikes: addStrike ? rep.strikes + 1 : rep.strikes,
			notes: appendNote(rep.notes, `❌ Negative feedback: ${note || 'No note provided'}`),
		},
	});

	return rep;
}

export async function resetReputation(userId: string) {
	return prisma.userReputation.update({
		where: { userId },
		data: {
			trustScore: 100,
			positive: 0,
			negative: 0,
			strikes: 0,
			notes: null,
		},
	});
}

export async function addStrike(userId: string, reason?: string) {
	const rep = await prisma.userReputation.findUnique({ where: { userId } });
	if (!rep) return null;

	return prisma.userReputation.update({
		where: { userId },
		data: {
			strikes: rep.strikes + 1,
			trustScore: Math.max(rep.trustScore - 10, 0),
			notes: appendNote(rep.notes, `⚠️ Strike added: ${reason || 'No reason provided'}`),
		},
	});
}

export async function removeStrike(userId: string, reason?: string) {
	const rep = await prisma.userReputation.findUnique({ where: { userId } });
	if (!rep || rep.strikes <= 0) return rep;

	return prisma.userReputation.update({
		where: { userId },
		data: {
			strikes: rep.strikes - 1,
			trustScore: Math.min(rep.trustScore + 5, 100),
			notes: appendNote(rep.notes, `✅ Strike removed: ${reason || 'No reason provided'}`),
		},
	});
}

// Utility
function appendNote(existing: string | null, newNote: string) {
	const time = new Date().toLocaleString();
	return `${existing ? `${existing}\n` : ''}[${time}] ${newNote}`;
}

// Display helpers
export function getTrustColor(score: number) {
	if (score >= 80) return 0x57f287;
	if (score >= 50) return 0xfee75c;
	if (score >= 20) return 0xed4245;
	return 0x992d22;
}

export function getScoreBadge(score: number) {
	if (score >= 90) return '🟢 Excellent';
	if (score >= 70) return '🟡 Reliable';
	if (score >= 40) return '🟠 Caution';
	return '🔴 Untrustworthy';
}

export function getProgressBar(score: number) {
	const totalBlocks = 10;
	const filled = Math.round((score / 100) * totalBlocks);
	return `\`${'▰'.repeat(filled)}${'▱'.repeat(totalBlocks - filled)}\``;
}

export function buildReputationEmbed(username: string, rep: any, avatarURL: string) {
	const embed = new EmbedBuilder()
		.setAuthor({ name: `${username}'s Reputation`, iconURL: avatarURL })
		.setColor(getTrustColor(rep.trustScore))
		.setThumbnail(avatarURL)
		.addFields(
			{
				name: '🏆 Trust Score',
				value: `${getScoreBadge(rep.trustScore)} ${rep.trustScore}/100\n${getProgressBar(rep.trustScore)}`,
			},
			{
				name: '📊 Stats',
				value: `**Positive:** ${rep.positive} **Negative:** ${rep.negative} **Strikes:** ${rep.strikes}`,
			},
		)
		.setFooter({ text: `Last updated • ${rep.updatedAt.toLocaleString()}` });

	if (rep.notes) {
		const trimmed = rep.notes.length > 900 ? rep.notes.slice(-900) + '…' : rep.notes;
		embed.addFields({ name: '🗒️ Notes', value: '```' + trimmed + '```' });
	}
	return embed;
}
