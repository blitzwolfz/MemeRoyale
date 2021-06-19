import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { getDoc, getProfile, getQual, updateDoc, updateProfile, updateQual } from "../../db";
import { Command, MatchList, QualList } from "../../types";


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

export const qual_result_sum: Command = {
    name: "qra",
    description: "`!qra <msg id> <msg id>`",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {

        if(args.length <= 1 && args.length >= 2) return message.reply("Please supply two msg ids.")

        let channel = <TextChannel>await client.channels.cache.get(message.channel.id)

        let emm = await QualifierResults(channel, client, [args[0], args[1]])
    
        await message.channel.send({ embed:emm }).then(async m => m.react('👌'))

        await (await (<TextChannel>client.channels.cache.get("722291182461386804")))
        .send({ embed:emm });
    }
}

export const forcevote_qual: Command = {
    name: "forcevote-match",
    description: "This will force the voting portion of a match to come.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {

        // let match = await getQual(message.channel.id)

        // match.votingperiod = false


        // await updateQual(match)

        return message.reply("Unfinished. Contact <@239516219445608449>")

    }
}

export const search: Command = {
    name: "search",
    description: "!creategroup #Amount in each group",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let signup:QualList = await getDoc("config", "quallist")
        let id = (message.mentions?.users?.first()?.id || args[0] || message.author.id)
        if (!id) return message.reply("invaild input. Please use User ID or a User mention")
    
        //let name = await (await message.guild!.members.cache.get(id))!.nickname || await (await client.users.fetch(id)).username
        if (message.member!.roles.cache.has('719936221572235295')) {
            for (let i = 0; i < signup.users.length; i++) {
    
                if (signup.users[i].includes(id)) {
                    return await message.reply(`This person is in <#${message.guild!.channels.cache.find(channel => channel.name === `group-${i + 1}`)!.id}>`)
                }
            }
            return message.reply("They are not in a group")
        }
    
        else {
            if (id !== message.author.id) return message.reply("You don't have those premissions");
            else {
                for (let i = 0; i < signup.users.length; i++) {
    
                    if (signup.users[i].includes(id)) {
                        return await message.reply(`You are in <#${message.guild!.channels.cache.find(channel => channel.name === `group-${i + 1}`)!.id}>`)
                    }
                }
                return message.reply("They are not in a group")
            }
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

export const qual_winner: Command = {
    name: "dqw",
    description: "!dqw <@mentions>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[], owner: "2", silentargs: string[]) {
        let ids: string[] = (message.mentions?.users?.array().map(a => a.id) || args)
        let list: MatchList = await getDoc('config', "matchlist")

        if (list) {
            for (let id of ids) {
                if (list.users.includes(id)) {
                    return message.reply("User has already been added.")
                }

                else {
                    list.users.push(id)
                    let u = await getProfile(id)
                    u.wins += 1
                    u.points += 25
                    await updateProfile(u)
                    await client.users.cache.get(id)?.send("Congrats on winning your qualifer. Now get ready for the bracket portion")
                }
            }

            if (message.mentions.users) {
                await updateDoc('config', list._id, list)
                return message.reply("Added users.")
            }

            else {
                message.channel.send(`<@${silentargs[0]}> Added users.`)
                return await updateDoc('config', list._id, list)
            }
        }

        else {

            let list: MatchList = {
                _id: "matchlist",
                url: "",
                users: [],
            }

            for (let id of ids) {
                list.users.push(id)
                let u = await getProfile(id)
                u.wins += 1
                u.points += 25
                await updateProfile(u)
                await client.users.cache.get(id)?.send("Congrats on winning your qualifer. Now get ready for the bracket portion")
            }

            if (message.mentions.users) {
                await updateDoc('config', list._id, list)
                return message.reply("Added users.")
            }

            else {
                message.channel.send(`<@${silentargs[0]}> Added users.`)
                return await updateDoc('config', list._id, list)
            }
        }
    }
}