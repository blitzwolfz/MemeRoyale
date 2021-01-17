import { User } from "discord.js";
export declare const backwardsFilter: (reaction: {
    emoji: {
        name: string;
    };
}, user: User) => boolean;
export declare const forwardsFilter: (reaction: {
    emoji: {
        name: string;
    };
}, user: User) => boolean;
