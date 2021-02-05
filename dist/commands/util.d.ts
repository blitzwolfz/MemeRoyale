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
export declare let emojis: string[];
export declare let timeconsts: {
    match: {
        votingtime: number;
        memetime: number;
    };
    qual: {
        votingtime: number;
        memetime: number;
        results: number;
    };
};
export declare function toHHMMSS(timestamp: number, howlong: number): Promise<string>;
