import { Command } from "../../types";
import { Client, MessageAttachment } from "discord.js";
export declare const reload: Command;
export declare const forcevote: Command;
export declare const matchlist: Command;
export declare function matchcard(client: Client, channelid: string, users: string[]): Promise<void>;
export declare function winner(client: Client, userid: string): Promise<MessageAttachment>;
export declare function grandwinner(client: Client, userid: string): Promise<MessageAttachment>;
