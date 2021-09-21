import { Client, CommandInteraction, Message, MessageEmbed, MessageReaction, User } from "discord.js";
import type { Command } from "../types";
import { help } from "./help";
import { cancelmatch, splitmatch, startmatch, startsplit } from "./match";
import { endmatch, forcevote, matchList, matchStats, reload_match } from "./match/utils";
import { cancelqual, endqual, splitqual, startsplitqual } from "./quals";
import { forcevote_qual, qual_result_sum, qual_stats, qual_winner, reload_qual, removeQualWinner } from "./quals/util";
import { modqualsubmit, modsubmit, qualsubmit, submit, templateSubmission, themeSubmission } from "./submit";
import * as b from "./tournament/index";
import * as c from "./exhibition/index";
import * as d from "./user";
import * as e from "./jointcommands";
import * as f from "./verification";
import * as imageCommands from "./imagecommands/index";
import * as level from "./levelsystem";
import { delay } from "./reminders";
import { getConfig, updateConfig } from "../db";
import { cmd } from "../index";
import { transition } from "./convertMMtoMR";
import { defaultSlashPermissions } from "./util";

//@ts-ignore
export const example: Command = {
    name: "EXAMPLE",
    description: "EXAMPLE",
    group: "EXAMPLE",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    async execute(message: Message, client: Client, args: string[]) {

    },
    async slashCommandFunction(interaction: CommandInteraction, client: Client) {
        if(!interaction.isCommand()) return;
    },
    slashCommandData:[
        {
            name: 'EXAMPLE',
            description: 'An example!',
        },
    ],
    slashCommandPermissions: defaultSlashPermissions
};

export const ping: Command = {
    name: "ping",
    aliases:["pong"],
    description: "You can ping, lmao",
    group: "ping",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:true,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        message.channel.send({
            embeds:[
                new MessageEmbed()
                    .setAuthor(`Pinging`)
            ]
        }).then(async m => {
            // The math thingy to calculate the user's ping
            let ping = m.createdTimestamp - message.createdTimestamp;

            // Basic embed

            let embed = new MessageEmbed()
            .setTitle(`Your ping is ${ping} ms`)
            // .setImage("https://cdn.discordapp.com/attachments/722306381893599242/855600330405838849/catping.gif")
            .setColor(m.embeds![0]!.hexColor!);
            // Then It Edits the message with the ping variable embed that you created
            await m.edit({embeds: [embed]}).then(async m => {
                let embed = new MessageEmbed()
                .setTitle(`Your ping is ${ping} ms`)
                .setImage("https://cdn.discordapp.com/attachments/722306381893599242/855600330405838849/catping.gif")
                .setColor(m.embeds![0]!.hexColor!);
                await m.edit({embeds:[embed]})
            });
        });
    },
    async slashCommandFunction(interaction: CommandInteraction, client: Client) {
        if(!interaction.isCommand()) return;
        await interaction.editReply({
            content: "Pong"
        })
    },
    slashCommandData:[
        {
            name: 'ping',
            description: 'Replies with Pong!',
        },
        {
            name: 'pong',
            description: 'Replies with Ping!',
        }
    ],
    slashCommandPermissions: defaultSlashPermissions
};

export const disableCommands: Command = {
    name: "disable",
    description: "owner",
    group: "owner",
    owner: true,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let config = await getConfig();

        if (args[0] === "all") {
            config.disabledcommands = cmd.map(x => x.name);
            config.disabledcommands.splice(config.disabledcommands.indexOf("enable"), 1);
            config.disabledcommands.splice(config.disabledcommands.indexOf("disable"), 1);
            await updateConfig(config);
            return message.reply(`${cmd.map(x => x.name).length - 2} commands disabled.`);
        }

        else {
            if (args[0] === undefined) return message.reply("Please pass the name of the command you want to enable. If you wish to disable all of them, do `!enable all`.");
            config.disabledcommands.splice(config.disabledcommands.indexOf("enable"), 1);
            config.disabledcommands.splice(config.disabledcommands.indexOf("disable"), 1);
            config.disabledcommands.push(args[0]);
            await updateConfig(config);
            return message.reply(`Disabled ${args[0]}.`);
        }
    }
};

export const enableCommands: Command = {
    name: "enable",
    description: "owner",
    group: "owner",
    owner: true,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let config = await getConfig();

        if (args[0] === "all") {
            config.disabledcommands = [];
            await updateConfig(config);
            return message.reply(`${cmd.map(x => x.name).length - 2} commands enabled.`);
        }

        else {
            if (args[0] === undefined) return message.reply("Please pass the name of the command you want to enable. If you wish to enable all of them, do `!enable all`.");
            config.disabledcommands.splice(config.disabledcommands.indexOf(args[0]), 1);
            console.log(config);
            await updateConfig(config);
            return message.reply(`Enabled ${args[0]}.`);
        }
    }
};

export const deleteSlashCommands: Command = {
    name: "delete",
    description: "owner",
    group: "owner",
    owner: true,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let guild = await client.guilds.cache.get('719406444109103117')!

        if (args[0] === "all") {
            for(let c of guild.commands.cache.values()) {
                c.delete()
            }

            return message.reply("Deleted all commands")
        }

        else {
            if (args[0] === undefined) return message.reply("Please pass the name of the command you want to enable. If you wish to enable all of them, do `!enable all`.");

            let c = [...guild.commands.cache.values()].find(x => x.name === args[0].toLowerCase())
            if(!c) return  message.reply("Command does not exist");
            c.delete()

            return message.reply(`Deleted ${c.name}.`);
        }
    }
};

export const editConfig: Command = {
    name: "edit",
    description: "owner",
    group: "owner",
    owner: true,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let config = await getConfig();

        if (args.length === 0) {
            let copy = config

            if (copy.disabledcommands.length > 0) {
                copy.disabledcommands = [];
            }

            let s = JSON.stringify(copy, null, 4);
            console.log(s);
            let arr = s.match(/"\w+":/g)!;
            arr.splice(0, 2);
            console.log(arr.join(", ").replace(/:/gi, "").replace(/"/gi, ""));
            await message.channel.send(`The edit options are ${arr.join(", ")
            .replace(/:/gi, "")
            .replace(/"/gi, "")
            .replace("servers", "disableserver, enableserver")}`);
            await message.channel.send("For disabling and enabling commands, there are separate commands called `!disable` and `!enable`.");
        }

        else {
            let symbol: "colour" | "status" | "isfinale" | "disableserver" | "enableserver" = "isfinale";

            switch (args[0]?.[0]) {
                case "c":
                    symbol = "colour";
                    break;
                case "s":
                    symbol = "status";
                    break;
                case "d":
                    symbol = "disableserver";
                    break;
                case "e":
                    symbol = "enableserver";
                    break;
                default:
                    symbol = "isfinale";
            }

            switch (symbol) {
                case "colour":
                    if (typeof args[1] !== 'string') {
                        return message.reply("Colour requires the hex code as a string");
                    }

                    config.colour = args[1];
                    await updateConfig(config);
                    break;

                case "status":
                    if (typeof args.slice(1).join(" ") !== 'string') {
                        return message.reply("Status requires a string");
                    }

                    config.status = args.slice(1).join(" ");
                    await client.user!.setActivity(`${args.slice(1).join(" ")}`);
                    await updateConfig(config);
                    break;

                case "disableserver":
                    if (args[1]) {
                        config.servers.push(args[1]);
                    }

                    else {
                        config.servers.push(message.guild!.id!);
                    }

                    await message.reply(`Server is now blocked.`);
                    await updateConfig(config);
                    break;

                case "enableserver":
                    if (args[1]) {
                        config.servers.push(args[1]);
                    }

                    else {
                        config.servers.push(message.guild!.id!);
                    }

                    await message.reply(`Server is unblocked.`);
                    await updateConfig(config);
                    break;

                case "isfinale":
                    if(!args[1]) return  message.reply("isfinale must either be true or false");
                    await message.channel.send("No type check. Click emote to continue").then(async msg => {

                        await msg.react(`✔️`);
                        let emoteFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === '✔️' && !user.bot;
                        const approve = msg.createReactionCollector({filter:emoteFilter, time: 50000});

                        approve.on('collect', async () => {
                            if (args[1] === "true") {
                                config.isfinale = true;
                            }

                            if (args[1] === "false") {
                                config.isfinale = false;
                            }

                            await updateConfig(config);
                            config.isfinale ? await message.reply("All matches are now evaluated as a" +
                                " finale match.") : await message.reply("All matches are now evaluated as a non" +
                                " finale" +
                                " match.")
                        });

                    });
                    break;

                default:
                    await message.channel.send("Not available yet");
                    break;
            }
        }
    }
};

export default [
    editConfig,
    deleteSlashCommands,
    transition,
    enableCommands,
    disableCommands,
    startmatch,
    delay,
    startsplit,
    endmatch,
    reload_match,
    reload_qual,
    qual_result_sum,
    ping,
    endmatch,
    forcevote,
    forcevote_qual,
    qual_winner,
    removeQualWinner,
    splitmatch,
    cancelmatch,
    submit,
    qualsubmit,
    modsubmit,
    modqualsubmit,
    splitqual,
    help,
    startsplitqual,
    matchList,
    cancelqual,
    endqual,
    qual_stats,
    matchStats,
    templateSubmission,
    themeSubmission,
]
.concat(b.default)
.concat(c.default)
.concat(d.default)
.concat(e.default)
.concat(f.default)
.concat(imageCommands.default)
.concat(level.default)
.sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1; else if (k1.name > k2.name) return 1; else return 0;
});