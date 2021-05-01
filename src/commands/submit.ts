import { Message, Client, TextChannel } from "discord.js";
import { deleteReminder, getAllMatches, getAllQuals, getMatch, getQual, getReminder, updateMatch, updateQual, updateReminder } from "../db";
import { Command } from "../types";


export const submit: Command = {
    name: "submit",
    description: " `!submit` with an image in the message. Do `!submit -duel` if you are in a duel.",
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

        let duels = false;

        if(args.length > 0 && args[0].toLowerCase() === "-duel"){
            duels = true
        }

        let m = (await (await getAllMatches())).find(x => (x.p1.userid === message.author.id && x.p1.memedone === false && x.exhibition === duels
            || x.p2.userid === message.author.id && x.p2.memedone === false && x.exhibition === duels))!
        
        if(!m) {
            return await message.author.send("You are not in any match. If you are trying to submit for a duel use `!submit -duel` to submit.")
        }

        let arr = [m.p1, m.p2]

        let e = arr.find(x => x.userid === message.author.id)!

        if(e.donesplit === false) return message.reply("You can't submit until your portion starts");

        e.memelink = message.attachments.array()[0].url
        e.memedone = true
        e.donesplit = true
        
        if(m.exhibition === false){
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
        }


        if (m.p1.userid === e.userid){
            try {
                await deleteReminder(await getReminder(m.p1.userid))
                let r = await getReminder(m._id)

                r.mention = `<@${m.p2.userid}>`

                await updateReminder(r)
            } catch (error) {
                console.log("")
            }

            m.p1 = e;
        }

        else{
            try {
                await deleteReminder(await getReminder(m.p2.userid))
                let r = await getReminder(m._id)

                r.mention = `<@${m.p1.userid}>`

                await updateReminder(r)
            } catch (error) {
                console.log("")
            }
            m.p2 = e;
        } 

        if(m.p1.donesplit && m.p1.memedone && m.p2.donesplit && m.p2.memedone && m.split){
            m.split = false
            m.p1.time = Math.floor(Date.now() / 1000) - 3200
            m.p2.time = Math.floor(Date.now() / 1000) - 3200
        }

        await updateMatch(m)
        return await message.channel.send("Your meme has been attached!") 
    }
}

export const qualsubmit: Command = {
    name: "qualsubmit",
    description: "",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        if(message.content.includes("imgur")){
            return message.reply("You can't submit imgur links")
        }
    
        if (message.attachments.size > 1){
            return message.reply("You can't submit more than one image")
        }
        
        else if(message.attachments.size <= 0){
            return message.reply("Your image was not submitted properly. Contact a mod")
        }
    
        else if(message.channel.type !== "dm"){
            return message.reply("You didn't not submit this in the DM with the bot.\nPlease delete and try again.")
        }
        
        else if(message.attachments.array()[0].url.toString().includes("mp4")) return message.reply("Video submissions aren't allowed")
    
        else{
            let match = await (await getAllQuals()).find(x => x.players.find(y => y.userid === message.author.id && y.memedone === false))!
            let index = match.players.findIndex(x => x.userid === message.author.id)
            let u = match.players[index]

            if(u.split === false) return message.reply("Can't submit when you haven't started your portion");

            u.split = true
            u.memedone = true
            u.memelink = message.attachments.array()[0].url

            await (<TextChannel>client.channels.cache.get("722616679280148504")).send({
                embed:{
                    description: `<@${message.author.id}> has submitted their meme\nChannel: <#${match._id}>`,
                    color:"#d7be26",
                    timestamp: new Date()
                }
            });

            await (<TextChannel>client.channels.cache.get("793242781892083742")).send({
                
                embed:{
                    description: `<@${message.author.id}>\\${message.author.tag} has submitted their meme\nChannel: <#${match._id}>`,
                    color:"#d7be26",
                    image: {
                        url: message.attachments.array()[0].url,
                    },
                    timestamp: new Date()
                }
            });

            match.players[index] = u

            await updateQual(match)

            try {
                let r = await getReminder(match._id)

                r.mention = r.mention.replace(`<@${message.author.id}>`, "")

                await updateReminder(r)
            } catch (error) {
                console.log("")
            }

            try {
                await deleteReminder(await getReminder(message.author.id))
            } catch (error) {
                console.log("")
            }
            
            return message.reply("Your meme for your qualifier has been attached.")
        }
    }
}

export const modsubmit: Command = {
    name: "modsubmit",
    description: "`!modsubmit <1 | 2> #channel` with an image in the message.",
    group: "tourny",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        
        let m = await getMatch(message.mentions.channels.first()!.id)
        
        if(!m) {
            return await message.author.send("Match doesn't exist.")
        }

        let arr = [m.p1, m.p2]

        let e = arr[parseInt(args[0])-1]

        //Modsubmit so their portion started already, unless bug from other area
        //if(e.donesplit === false) return message.reply("You can't submit until your portion starts");

        e.memelink = message.attachments.array()[0].url
        e.memedone = true
        e.donesplit = true
        
        if(m.exhibition === false){
            await (<TextChannel>client.channels.cache.get("793242781892083742")).send({
                                
                embed:{
                    description: `<@${e.userid}>/${(await client.users.cache.get(e.userid))!.tag} has submitted their meme\nChannel: <#${m._id}>`,
                    color:"#d7be26",
                    image: {
                        url: message.attachments.array()[0].url,
                    },
                    timestamp: new Date()
                }
            });
        }


        if (m.p1.userid === e.userid){
            try {
                await deleteReminder(await getReminder(m.p1.userid))
                let r = await getReminder(m._id)

                r.mention = `<@${m.p2.userid}>`

                await updateReminder(r)
            } catch (error) {
                console.log("")
            }

            m.p1 = e;
        }

        else{
            try {
                await deleteReminder(await getReminder(m.p2.userid))
                let r = await getReminder(m._id)

                r.mention = `<@${m.p1.userid}>`

                await updateReminder(r)
            } catch (error) {
                console.log("")
            }
            m.p2 = e;
        } 

        if(m.p1.donesplit && m.p1.memedone && m.p2.donesplit && m.p2.memedone && m.split){
            m.split = false
            m.p1.time = Math.floor(Date.now() / 1000) - 3200
            m.p2.time = Math.floor(Date.now() / 1000) - 3200
        }

        await updateMatch(m)
        return await message.channel.send("Your meme has been attached!") 
    }
}

export const modqualsubmit: Command = {
    name: "modqualsubmit",
    description: "`!modqualsubmit <player position> #channel` with an image in the message.",
    group: "tourny",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        if(message.content.includes("imgur")){
            return message.reply("You can't submit imgur links")
        }
    
        if (message.attachments.size > 1){
            return message.reply("You can't submit more than one image")
        }
        
        else if(message.attachments.size <= 0){
            return message.reply("Your image was not submitted properly. Contact a mod")
        }
           
        else if(message.attachments.array()[0].url.toString().includes("mp4")) return message.reply("Video submissions aren't allowed")
    
        else{
            let match = await getQual(message.mentions.channels.first()!.id)
            let index = parseInt(args[0]) - 1 
            let u = match.players[index]

            //Modsubmit so their portion started already, unless bug from other area
            //if(u.split === false) return message.reply("Can't submit when you haven't started your portion");

            u.split = true
            u.memedone = true
            u.memelink = message.attachments.array()[0].url

            await (<TextChannel>client.channels.cache.get("793242781892083742")).send({
                
                embed:{
                    description: `<@${u.userid}>\\${client.users.cache.get(u.userid)?.tag} has submitted their meme\nChannel: <#${match._id}>`,
                    color:"#d7be26",
                    image: {
                        url: message.attachments.array()[0].url,
                    },
                    timestamp: new Date()
                }
            });

            match.players[index] = u

            await updateQual(match)

            try {
                let r = await getReminder(match._id)

                r.mention = r.mention.replace(`<@${u.userid}>`, "")

                await updateReminder(r)
            } catch (error) {
                console.log("")
            }

            try {
                await deleteReminder(await getReminder(u.userid))
            } catch (error) {
                console.log("")
            }
            
            return message.reply("Your meme for your qualifier has been attached.")
        }
    }
}