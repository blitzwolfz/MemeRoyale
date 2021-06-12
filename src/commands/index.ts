import { Message, Client, MessageEmbed } from "discord.js";
import { Command } from "../types";
import { help } from "./help";
import { cancelmatch, endmatch, splitmatch, startmatch, startsplit } from "./match";
import { forcevote, match_stats, reload_match } from "./match/utils";
import { cancelqual, splitqual, startsplitqual, endqual } from "./quals";
import { qual_stats, reload_qual } from "./quals/util";
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
        message.channel.send("Pinging...").then(m =>{
            // The math thingy to calculate the user's ping
            let ping = m.createdTimestamp - message.createdTimestamp;
  
            // Basic embed
            let embed = new MessageEmbed()
            .setAuthor(`Your ping is ${ping}`)
            .setColor("RANDOM");
              
            // Then It Edits the message with the ping variable embed that you created
            m.edit(embed)
          });
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
            config.disabledcommands.splice(config.disabledcommands.indexOf(args[0]), 1)
            console.log(config)
            await updateConfig(config)
            return message.reply(`Enabled ${args[0]}.`)
        }
    }
}



export default [
    enableCommands,
    disableCommands,
    startmatch,
    delay,
    startsplit,
    endmatch,
    reload_match,
    reload_qual,
    ping,
    forcevote,
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