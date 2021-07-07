import type { Client, Message, TextChannel } from "discord.js";
import type { Command, QualList } from "../types";
import { getDoc, getMatch, getQual, updateMatch, updateQual } from "../db";
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

export const search: Command = {
    name: "search",
    description: "!search <@mention>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {

        let matches = await message.guild!.channels.cache.find(c => c.name == "matches" && c.type == "category")!;
        let qualifiers = await message.guild!.channels.cache.find(c => c.name == "qualifiers" && c.type == "category")!;

        if(matches) {

            let id = (message.mentions?.users?.first()?.id || args[0] || message.author.id);
            if (!id) return message.reply("invaild input. Please use User ID or a User mention");
            let username = await client.users.cache.get(id)!.username.substring(0, 10)

            return  message.reply(`The channel is ${message.guild!.channels.cache.find(x => x.name.split("-vs-").includes(username))}`)

        }

        if(qualifiers) {
            let signup: QualList = await getDoc("config", "quallist");
            let id = (message.mentions?.users?.first()?.id || args[0] || message.author.id);
            if (!id) return message.reply("invaild input. Please use User ID or a User mention");

            //let name = await (await message.guild!.members.cache.get(id))!.nickname || await (await
            // client.users.fetch(id)).username
            if (message.member!.roles.cache.has('719936221572235295')) {
                for (let i = 0; i < signup.users.length; i++) {

                    if (signup.users[i].includes(id)) {
                        return await message.reply(`This person is in <#${message.guild!.channels.cache.find(channel => channel.name === `group-${i + 1}`)!.id}>`);
                    }
                }
                return message.reply("They are not in a group");
            }

            else {
                if (id !== message.author.id) {
                    return message.reply("You don't have those premissions");
                }
                else {
                    for (let i = 0; i < signup.users.length; i++) {

                        if (signup.users[i].includes(id)) {
                            return await message.reply(`You are in <#${message.guild!.channels.cache.find(channel => channel.name === `group-${i + 1}`)!.id}>`);
                        }
                    }
                    return message.reply("They are not in a group");
                }
            }
        }
    }
};

export default [
    pause,
    cancel,
    end,
    search
];