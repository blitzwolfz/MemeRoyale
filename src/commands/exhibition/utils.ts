import { Client, Message, TextChannel } from "discord.js"
import { getExhibition, getMatch, updateExhibition, updateMatch } from "../../db"
import { Command } from "../../types"
import { toHHMMSS } from "../util"

export const duelcheck: Command = {
    name: "duel -check",
    description: "",
    group: "duels",
    groupCommand:true,
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let ex = await getExhibition()

        if(!ex.cooldowns.some(x => x.user === message.author.id)){
            return message.reply("You can start another duel.")
        }
    
        else if(ex.cooldowns.some(x => x.user === message.author.id)){
            let i = ex.cooldowns.findIndex(x => x.user === message.author.id)
    
            await message.reply(`Time till you can start another duel: ${await toHHMMSS(ex.cooldowns[i].time, 3600)}`)
        }
    }
}

export const duelreload: Command = {
    name: "duel -reload",
    description: "",
    group: "duels",
    groupCommand:true,
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let match = await getMatch(message.channel.id)
        let channel = <TextChannel>await client.channels.cache.get(message.channel.id)!
        message.reply("Reloading").then(async m =>{
            for (let ms of match.messageID) {
                (await channel.messages.fetch(ms)).delete()
            }

            m.delete({timeout:1500})
        })

        match.votingperiod = false
        match.votetime = (Math.floor(Date.now() / 1000))

        await updateMatch(match)

    }
}

export const duelcooldownreset: Command = {
    name: "resetcd",
    description: "Resets cooldown for duels. `!resetcd @mentions`",
    group: "duels",
    owner: false,
    admins: false,
    mods: true,

    async execute(message: Message, client: Client, args: string[]){
        let ex = await getExhibition()

        for(let x of message.mentions.users.array()){
            ex.cooldowns.splice(ex.cooldowns.findIndex(c => c.user === x.id))
            await updateExhibition(ex)
            await message.channel.send(`<@${x.id}> has been reset`)
        } 
    }
}

export default[
    duelcooldownreset,
    duelreload,
    duelcheck
].sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1;
    else if (k1.name > k2.name) return 1;
    else return 0;
})