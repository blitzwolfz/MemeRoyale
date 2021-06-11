import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { getQual, updateQual } from "../../db";
import { Command } from "../../types";


export const reload_qual: Command = {
    name: "reload-qual",
    description: "This reload the voting portion of a Qualifier.",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {

        let match = await getQual(message.channel.id)
        let channel = <TextChannel>await client.channels.cache.get(message.channel.id)!
        for (let ms of match.messageID) {
            (await channel.messages.fetch(ms)).delete()
        }

        for(let p of match.players){
            p.votes = []
        }

        match.votingperiod = false

        await updateQual(match)
        return message.reply("Reloading").then(m =>{
            m.delete({timeout:1500})
        })
    }
}

export const qual_stats: Command = {
    name: "qual-stats",
    description: "View Qualifier Statistics except voting.\mJust mention the channel name"+`\`!qual-stats @Channel\``,
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        if(!message.mentions.channels.first()) return message.reply("Please mention channel");

        else{
            let q = await getQual(message.mentions.channels.first()!.id!)

            if(!q) return message.reply("No qualifier is in that channel.")

            let statsEmbed = new MessageEmbed()
            .setTitle(`${message.mentions.channels.first()!.name}`)
            .setColor("LUMINOUS_VIVID_PINK")
            .setFooter("blitzwolfz#9338", "https://cdn.discordapp.com/avatars/239516219445608449/12fa541557ca2635a34a5af5e8c65d26.webp?size=512")

            for(let p of q.players){
                statsEmbed.addFields(
                    { name: `${(await client.users.cache.get(p.userid)!).username} Meme Done:`, value: `${p.memedone ? `Yes` : `No`}`, inline: true },
                    { name: 'Match Portion Done:', value: `${p.split ? `Yes` : `No`}`, inline: true },
                    { name: 'Meme Link:', value: `${p.memedone ? `${p.memelink}` : `No meme submitted yet`}`, inline: true },
                    { name: 'Time left', value: `${p.split ? `${p.memedone ? "Submitted meme" : `${30 - Math.floor(((Date.now() / 1000) - p.time) / 60)} mins left`}` : `${p.split ? `Hasn't started portion` : `Time up`}`}`, inline: true },
                    { name: '\u200B', value: '\u200B' },
                )
            }

            return await message.channel.send(statsEmbed)
        }
    }
}

export async function QualifierResults(channel: TextChannel, client: Client, ids:string[]){
    let msgArr:Message[] = [];

    for(let i of ids){
        msgArr.push(await channel.messages.fetch(i))
    }


    let finalResults:Array<{
        name:string,
        value:number
    }> = []

    console.log(finalResults)

    for(let msg of msgArr){
        let embed = msg.embeds[0]!

        for(let f of embed.fields){
            let key = `${f.value.match(/\d+/g)?.splice(1)[1]}`.toString()
            if(!finalResults.find(x => x.name === key)){
                finalResults.push({
                    name:key,
                    value: parseInt(f.value.match(/\d+/g)?.splice(1)[0]!)
                })
            }

            else{
                finalResults[finalResults.findIndex(x => x.name === key)].value += parseInt(f.value.match(/\d+/g)?.splice(1)[0]!)
            }
        }

    }
    
    finalResults.sort(function(a, b){
        return b.value - a.value
    })

    for(let f of finalResults){
        //@ts-ignore
        //Ik types are important, but sometimes you want to cheat 
        //and do this since it's much easier to work with lol
        f.value = `Got ${f.value} in total | UserID:${f.name}`
        f.name = (await client.users.fetch(f.name)).username
    }

    return {
        title: `Final Results for Group ${channel.name}`,
        description: `Players with highest move on`,
        fields:finalResults,
        color: "#d7be26",
        timestamp: new Date()
      }
}