import type { Client, Message, TextChannel } from "discord.js";
import type { AutoCommands, Command, Match, MatchList, QualList, Signups } from "../types";
import { getAllMatches, getAllQuals, getConfig, getDoc, getMatch, getQual, updateConfig, updateDoc, updateMatch, updateQual } from "../db";
import { cancelmatch } from "./match";
import { cancelqual, endqual } from "./quals/index";
import { endmatch } from "./match/utils";
import { signup_manager } from "./tournament/signup";


export const pause: Command = {
    name: "pause",
    description: " `!pause <@mention channel>`. Either mention the channel you wish to pause, or do it in the channel.",
    group: "tourny",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let id = message.mentions.channels.first() ? message.mentions.channels.first()!.id : message.channel.id!;
        let channel = await <TextChannel>client.channels.cache.get(id);

        if (!(await getMatch(id)) && !(await getQual(id))) return message.reply(`There is no match in <#${id}>`)

        if (channel.type === "GUILD_TEXT" && channel?.parent?.name.toLowerCase() === "matches") {
            let m = await getMatch(id);
            m.pause = m.pause ? false : true;
            await updateMatch(m);

            return message.reply(`Match is now ${m.pause ? "paused" : "un-paused"}.`);
        }

        if (channel.type === "GUILD_TEXT" && channel?.parent?.name.toLowerCase() === "qualifiers") {
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
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let id = message.mentions.channels.first() ? message.mentions.channels.first()!.id : message.channel.id!;
        let m = await getMatch(id)
        let q = await getQual(id)

        if (m && !q) {
            return await cancelmatch.execute(message, client, args)
        }

        if (!m && q) {
            return await cancelqual.execute(message, client, args)
        }

        if (!m && !q) return message.reply(`No match or qualifier in <#${id}>`)
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
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let id = message.mentions.channels.first() ? message.mentions.channels.first()!.id : message.channel.id!;
        let m = await getMatch(id)
        let q = await getQual(id)

        if (m && !q) {
            return await endmatch.execute(message, client, args)
        }

        if (!m && q) {
            return await endqual.execute(message, client, args)
        }

        if (!m && !q) return message.reply(`No match or qualifier in <#${id}>`)
    }
};

export const search: Command = {
    name: "search",
    description: "!search <@mention>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let id = (message.mentions?.users?.first()?.id || args[0] || message.author.id);

        let searchFilter = function (x: Match) {
            return ((x.p1.userid === id) || (x.p2.userid === id));
        };
        let m = (await getAllMatches()).find(searchFilter)
        let q = (await getAllQuals()).find(x => x.players.some(y => y.userid === id))!;

        if (m !== undefined && q !== undefined) return message.reply(`You are in a Qualifier: <#${q._id}> & Match: <#${m._id}>`);
        if (m !== undefined) return message.reply(`The channel is <#${m._id}>`);
        if (q !== undefined) return message.reply(`The channel is <#${q._id}>`);

        if(m === undefined) {
            let username = (await client.users.fetch(id)).username.toLowerCase()
            let channelID = message.guild!.channels.cache.find(x => x.name.toLowerCase().includes(username))?.id

            if(channelID) return message.reply(`The channel is <#${channelID}>`)

        }
        
        if (q === undefined) {
            let g: QualList = await getDoc("config", "quallist");
            
            for (let i = 0; i < g.users.length; i++) {
        
                if (g.users[i].includes(id)) {
                    return await message.reply(`Is in <#${message.guild!.channels.cache.find(channel => channel.name === `group-${i + 1}`)!.id}>`)
                }
            }
            return message.reply("Not in a group")
        }

        return message.reply("Not in a match or qualifier.")
    }
};

export const cycleRestart: Command = {
    name: "cycle-restart",
    description: "!cycle-restart [<true> to open signup] [<false> 'message to put in status']",
    group: "tournament-manager",
    owner: false,
    admins: true,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        if (![
            "true",
            "false"
        ].includes(args[0].toLowerCase())) return message.reply("Need a true or false.");

        let signup: Signups = await getDoc("config", "signups");
        let matchlist: MatchList = await getDoc("config", "matchlist");
        let quallist: QualList = await getDoc("config", "quallist");
        let config = await getConfig();

        signup.autoClose = 64;
        signup.users = [];
        signup.msgID = "";
        signup.open = false;

        matchlist.url = "";
        matchlist.users = [];

        quallist.users = [];

        config.isfinale = false;

        await updateDoc("config", signup._id, signup);
        await updateDoc("config", matchlist._id, matchlist);
        await updateDoc("config", quallist._id, quallist);
        await updateConfig(config);

        if (args[0].toLowerCase() === "true") {
            config.status = "Signup now open!";
            await client.user!.setActivity("Signup now open!");
            await signup_manager.execute(message, client, ["-open"])
        }


        if (args[0].toLowerCase() === "false") {
            if (typeof args.slice(1).join(" ") !== 'string') {
                return message.reply("Status requires a string");
            }

            config.status = args.slice(1).join(" ");
            await client.user!.setActivity(`${args.slice(1).join(" ")}`);
        }

        return message.reply("Cycle restarted");
    }
}

export const autoCommand: Command = {
    name: "auto",
    description: "!auto <Date> <hours after 12 am EST> <command name> <arguments,arguments2,etc>",
    group: "owner",
    owner: true,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let date = args[0];
        let hours = args[1];
        let cmdName = args[2];
        let autoArgs = args[3] !== undefined ? args.slice(3) : [];

        if (!date.match(/\d{4}\.(0?[1-9]|1[012])\.(0?[1-9]|[12][0-9]|3[01])*/g)) return message.reply("Invalid date.")
        if (!hours.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g)) return message.reply("Invalid hour")

        let hoursToSeconds = (parseInt(hours.split(':')[0])) * 60 * 60 + (parseInt(hours.split(':')[1])) * 60

        let timestamp = Math.floor(new Date(date).getTime() / 1000)

        timestamp += hoursToSeconds

        let autoList: AutoCommands = await getDoc("config", "autocommands");

        if (autoArgs === undefined) autoArgs = [];

        autoList.todo.push(
            {
                _id: `${cmdName}`,
                args: autoArgs,
                message: {
                    id: message.id,
                    channelID: message.channel.id,
                },
                timestamp: timestamp
            }
        )

        await updateDoc("config", autoList._id, autoList);
        return await message.reply(`Will execute command ${cmdName}${args[3] !== undefined ? ` with arguments ${args.slice(3)
            .join(", ")} ` : ` `}on ${date} at ${hours} EST.`);

    },
}

export async function autoRunCommandLoop(commands: Command[], client: Client) {
    let autoList = await getDoc<AutoCommands>("config", "autocommands");
    let iterations = autoList.todo.length;

    for (let i = iterations - 1; i >= 0; i--) {
        let c = autoList.todo[i];
        let channel = await <TextChannel>client.channels.cache.get(c.message.channelID);
        let m = await channel.messages.fetch(c.message.id);
        let potentialCommand = commands.find(x => x.name.toLowerCase() === c._id);

        if (potentialCommand === undefined) {
            autoList.todo.splice(i, 1);
            console.log(`${c._id} is not a command.`);
            await m.reply(`${c._id} is not a command.`)

        }
        else {
            if (!((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) >= c.timestamp)) {
                continue
            }


            await potentialCommand.execute(m, client, c.args)
            autoList.todo.splice(i, 1);
        }
    }

    await updateDoc("config", autoList._id, autoList);
}

export default [
    pause,
    cancel,
    end,
    search,
    cycleRestart,
    autoCommand
];