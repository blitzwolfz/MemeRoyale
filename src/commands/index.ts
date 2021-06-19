import { Message, Client, MessageEmbed, User } from "discord.js";
import { Command } from "../types";
import { help } from "./help";
import { cancelmatch, endmatch, splitmatch, startmatch, startsplit } from "./match";
import { forcevote, match_stats, reload_match, end_match } from "./match/utils";
import { cancelqual, splitqual, startsplitqual, endqual } from "./quals";
import { forcevote_qual, qual_result_sum, qual_stats, reload_qual, search } from "./quals/util";
import { modqualsubmit, modsubmit, qualsubmit, submit } from "./submit";
import * as b from "./tournament/index"
import * as c from "./exhibition/index"
import * as d from "./user"
import { delay } from "./reminders";
import { getConfig, updateConfig } from "../db";
import { cmd } from "../index";

//@ts-ignore
export const example: Command = {
    name: "EXAMPLE",
    description: "EXAMPLE",
    group: "EXAMPLE",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {

    }
}

export const ping: Command = {
    name: "ping",
    description: "ping",
    group: "",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        message.channel.send(new MessageEmbed()
            .setAuthor(`Pinging`)
            .setColor("RANDOM")).then(m => {
                // The math thingy to calculate the user's ping
                let ping = m.createdTimestamp - message.createdTimestamp;

                // Basic embed
                let embed = new MessageEmbed()
                    .setTitle(`Your ping is ${ping}`)
                    .setImage("https://cdn.discordapp.com/attachments/722306381893599242/855600330405838849/catping.gif")
                    .setColor("RANDOM");

                // Then It Edits the message with the ping variable embed that you created
                m.edit(embed)
            }
        );
    }
}

export const disableCommands: Command = {
    name: "disable",
    description: "owner",
    group: "owner",
    owner: true,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let config = await getConfig()

        if(args[0] === "all"){
            config.disabledcommands = cmd.map(x => x.name)
            config.disabledcommands.splice(config.disabledcommands.indexOf("enable"), 1)
            config.disabledcommands.splice(config.disabledcommands.indexOf("disable"), 1)
            await updateConfig(config)
            return message.reply(`${cmd.map(x => x.name).length - 2} commands disabled.`)
        }

        else{
            if(args[0] === undefined) return message.reply("Please pass the name of the command you want to enable. If you wish to disable all of them, do `!enable all`.")
            config.disabledcommands.push(args[0])
            config.disabledcommands.splice(config.disabledcommands.indexOf("enable"), 1)
            config.disabledcommands.splice(config.disabledcommands.indexOf("disable"), 1)
            await updateConfig(config)
            return message.reply(`Disabled ${args[0]}.`)
        }
    }
}

export const enableCommands: Command = {
    name: "enable",
    description: "owner",
    group: "owner",
    owner: true,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let config = await getConfig()

        if(args[0] === "all"){
            config.disabledcommands = []
            await updateConfig(config)
            return message.reply(`${cmd.map(x => x.name).length - 2} commands enabled.`)
        }

        else{
            if(args[0] === undefined) return message.reply("Please pass the name of the command you want to enable. If you wish to enable all of them, do `!enable all`.")
            config.disabledcommands.splice(config.disabledcommands.indexOf(args[0]), 1)
            console.log(config)
            await updateConfig(config)
            return message.reply(`Enabled ${args[0]}.`)
        }
    }
}

export const editConfig: Command = {
    name: "edit",
    description: "owner",
    group: "owner",
    owner: true,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let config = await getConfig()

        if(args.length === 0){

            if(config.disabledcommands.length > 0){
                config.disabledcommands = []
            }

            let s = JSON.stringify(config, null, 4);
            let arr = s.match(/"\w+":*/g)!
            arr.splice(0, 2)
            await message.channel.send(`The edit options are ${arr.join(", ").replace(/:/gi, "").replace(/"/gi, "")}`)
            await message.channel.send("For disabling and enabling commands, there are seperate commands called `!disable` and `!enable`.")
        }

        else{
            let symbol: "colour" | "status" | "isfinale"  = "status"

            switch (args[0]?.[0]) {
                case "c": symbol = "colour"; break;
                case "s": symbol = "status"; break;
                default: symbol = "isfinale";
            }

            switch (symbol) {
                case "colour":
                    if(typeof args[1] !== 'string'){
                        return message.reply("Colour requires the hex code as a string")
                    }

                    config.colour = args[1]
                    await updateConfig(config)
                break;

                case "status":
                    if(typeof args.slice(1).join(" ") !== 'string'){
                        return message.reply("Status requires the hex code as a string")
                    }

                    config.status = args.slice(1).join(" ")
                    await client.user!.setActivity(`${args.slice(1).join(" ")}`);
                    await updateConfig(config)
                break;

                case "isfinale":

                    await message.channel.send("No type check. Click emote to continue").then(async msg => {
            
                        await msg.react(`✔️`)
                        let emoteFilter = (reaction: { emoji: { name: string; }; }, user: User) => reaction.emoji.name === '✔️' && !user.bot;
                        const approve = msg.createReactionCollector(emoteFilter, { time: 50000 });
            
                        approve.on('collect', async () => {
                            if(args[1] === "true"){
                                config.isfinale = true
                            }

                            if(args[1] === "false"){
                                config.isfinale = false
                            }
                            
                            await updateConfig(config)
                        })
            
                    });
                break;

                default:
                    await message.channel.send("Not available yet")
                    break;
            }
        }
    }
}

export default [
    editConfig,
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
    end_match,
    forcevote,
    forcevote_qual,
    search,
    splitmatch,
    cancelmatch,
    submit,
    qualsubmit,
    modsubmit,
    modqualsubmit,
    splitqual,
    help,
    startsplitqual,
    cancelqual,
    endqual,
    qual_stats,
    match_stats
].concat(b.default)
.concat(c.default)
.concat(d.default)
.sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1;
    else if (k1.name > k2.name) return 1;
    else return 0;
})