import { Message, Client, MessageEmbed } from "discord.js";
import { Command } from "../types";
import { help } from "./help";
import { cancelmatch, endmatch, splitmatch, startmatch, startsplit } from "./match";
import { forcevote, match_stats, reload_match } from "./match/utils";
import { cancelqual, splitqual, startsplitqual, endqual } from "./quals";
import { qual_stats, reload_qual } from "./quals/util";
import { qualsubmit, submit } from "./submit";
import * as s from "./tournament/index"

// export const example: Command = {
//     name: "",
//     description: "",
//     group: "",
//     owner: false,
//     admins: false,
//     mods: true,
//     async execute(message: Message, client: Client, args: string[]) {

//     }
// }

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
              .setColor("RANDOM")
              
              // Then It Edits the message with the ping variable embed that you created
              m.edit(embed)
          });
    }
}


export default [
    startmatch,
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
    splitqual,
    help,
    startsplitqual,
    cancelqual,
    endqual,
    qual_stats,
    match_stats
]
.concat(s.default)
.sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1;
    else if (k1.name > k2.name) return 1;
    else return 0;
})