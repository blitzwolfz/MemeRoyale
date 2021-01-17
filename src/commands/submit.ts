import { Message, Client, TextChannel } from "discord.js";
import { getAllMatches, updateMatch } from "../db";
import { Command } from "../types";


export const submit: Command = {
    name: "submit",
    description: "",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        
        if(message.channel.type !== "dm"){
            return message.reply("You didn't not submit this in the DM with the bot.\nPlease delete and try again.")
        }

        if(message.attachments.array()[0].url.includes("imgur")){
            return message.reply("You can't submit imgur links")
        }
    
        else if (message.attachments.size > 1){
            return message.reply("You can't submit more than one image")
        }
        
        else if(message.attachments.size <= 0){
            return message.reply("Your image was not submitted properly. Contact a mod")
        };

        let m = (await (await getAllMatches())).find(x => (x.p1.userid === message.author.id || x.p2.userid === message.author.id))!

        let arr = [m.p1, m.p2]

        let e = arr.find(x => x.userid === message.author.id)!

        if(e.donesplit === false) return message.reply("You can't submit until your portion starts");

        e.memelink = message.attachments.array()[0].url
        e.memedone = true
        e.donesplit = true

        await (<TextChannel>client.channels.cache.get("793242781892083742")).send({
                                
            embed:{
                description: `<@${message.author.id}>/${message.author.tag} has submitted their meme\nChannel: <#${m._id}>`,
                color:"#d7be26",
                image: {
                    url: message.attachments.array()[0].url,
                },
                timestamp: new Date()
            }
        });

        if (m.p1.userid === e.userid) m.p1 = e;
        else m.p2 = e;

        if(m.p1.donesplit && m.p2.donesplit && m.split){
            m.split = false
            m.p1.time = Math.floor(Date.now() / 1000) - 3200
            m.p2.time = Math.floor(Date.now() / 1000) - 3200
        }

        await updateMatch(m)
        return await message.channel.send("Your meme has been attached!") 
    }
}