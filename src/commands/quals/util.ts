import { Client, Message, TextChannel } from "discord.js";
import { getQual, updateQual } from "../../db";
import { Command } from "../../types";


export const reload_qual: Command = {
    name: "reload-qual",
    description: "This reload the voting portion of a match.",
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

    console.log(finalResults)

    for(let f of finalResults){
        f.name = (await client.users.fetch(f.name)).username
        //@ts-ignore
        f.value = `Got ${f.value} in total`
    }
    console.log(finalResults)

    return {
        title: `Final Results for Group ${channel.name}`,
        description: `Players with highest move on`,
        fields:finalResults,
        color: "#d7be26",
        timestamp: new Date()
      }
}