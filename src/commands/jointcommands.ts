import type { Client, Message, TextChannel } from "discord.js";
import type { Command } from "../types";
import { getMatch, getQual, updateMatch, updateQual } from "../db";
import { cancelmatch } from "./match";
import { cancelqual, endqual } from "./quals/index";
import { endmatch } from "./match/utils";

export const pause: Command = {
    name: "pause",
    description: " `!pause <@mention channel>`. Either mention the channel you wish to pause, or do it in the channel.",
    group: "tourny",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: true, async execute(message: Message, client: Client, args: string[]) {
        let id = message.mentions.channels.first() ? message.mentions.channels.first()!.id : message.channel.id!;
        let channel = await <TextChannel>client.channels.cache.get(id);

        if(!(await getMatch(id))&& !(await getQual(id))) return message.reply(`There is no match in <#${id}>`)

        if (channel.type === "text" && channel?.parent?.name.toLowerCase() === "matches") {
            let m = await getMatch(id);
            m.pause = m.pause ? false : true;
            await updateMatch(m);

            return message.reply(`Match is now ${m.pause ? "paused" : "un-paused"}.`);
        }

        if (channel.type === "text" && channel?.parent?.name.toLowerCase() === "qualifiers") {
            let m = await getQual(id);
            m.pause = m.pause ? false : true;
            await updateQual(m);

            return message.reply(`Qualifier is now ${m.pause ? "paused" : "un-paused"}.`);
        }
    }
};

export const cancel: Command = {
    name: "cancel",
    description: " `!cancel <@mention channel>`. Either mention the channel you wish to cancel, or do it in the" +
        " channel.",
    group: "tourny",
    groupCommand: false,
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let id = message.mentions.channels.first() ? message.mentions.channels.first()!.id : message.channel.id!;
        let m = await getMatch(id)
        let q = await getQual(id)

        if(m && !q){
            return await cancelmatch.execute(message, client, args)
        }

        if(!m && q){
            return await cancelqual.execute(message, client, args)
        }

        if(!m && !q) return message.reply(`No match or qualifier in <#${id}>`)
    }
};

export const end: Command = {
    name: "end",
    description: " `!end <@mention channel>`. Either mention the channel you wish to end, or do it in the channel.",
    group: "tourny",
    groupCommand: false,
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let id = message.mentions.channels.first() ? message.mentions.channels.first()!.id : message.channel.id!;
        let m = await getMatch(id)
        let q = await getQual(id)

        if(m && !q){
            return await endmatch.execute(message, client, args)
        }

        if(!m && q){
            return await endqual.execute(message, client, args)
        }

        if(!m && !q) return message.reply(`No match or qualifier in <#${id}>`)
    }
};

export default [
    pause,
    cancel,
    end
];