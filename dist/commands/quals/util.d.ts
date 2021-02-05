import { Client, TextChannel } from "discord.js";
import { Command } from "../../types";
export declare const reload_qual: Command;
export declare const qual_stats: Command;
export declare function QualifierResults(channel: TextChannel, client: Client, ids: string[]): Promise<{
    title: string;
    description: string;
    fields: {
        name: string;
        value: number;
    }[];
    color: string;
    timestamp: Date;
}>;
