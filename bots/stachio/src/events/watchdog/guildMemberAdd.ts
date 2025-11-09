import { BaseClient } from '@projectdiscord/core';
import { EventInterface } from '@projectdiscord/shared';
import { ActivityType } from 'discord.js';

const event: EventInterface<"guildMemberAdd"> = {
    name: 'guildMemberAdd',
    options: { once: false, rest: false },
    execute(client: BaseClient) {
        console.log(`[READY] Logged in as ${client.user?.tag}`);

        // Sæt bot presence
        client.user?.setPresence({
            status: 'online',
            activities: [{ name: 'ProjectDiscord', type: ActivityType.Streaming, url: 'https://github.com/ProjectDiscord' }], // 0 = Playing
        });
    },
};

export default event;
