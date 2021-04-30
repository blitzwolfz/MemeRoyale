import { Client, Message, MessageEmbed } from "discord.js";
import { getDoc, updateDoc } from "../../db";
import { MatchList, QualList } from "../../types";
import { Command } from "../../types";
const challonge = require("challonge-js")

export const matchchannelcreate: Command = {
    name: "channelcreate",
    description: "!channelcreate <round number> <time in hours to complete>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        if (!args) return message.reply("Please input round number and how long the round is!")

        else {
    
            let names: { str: string, id: string }[] = []
    
            let match: MatchList = await getDoc("config", "matchlist")
    
            for (let i = 0; i < match.users.length; i++) {
                //console.log(match.users[i])
                try {
                    let name = (await (await client.users.fetch(match.users[i])).username)
                    names.push({
                        str: name,
                        id: (match.users[i])
                    })
                } catch { message.channel.send(`<@${match.users[i]}>/${match.users[i]} is fucked`) }
                //names.concat([((await (await message.guild!.members.fetch(i)).nickname) || await (await disclient.users.fetch(i)).username), i])
            }
    
            const cclient = challonge.createClient({
                apiKey: process.env.CHALLONGE
            });
    
            let matchlist: MatchList = await getDoc("config", "matchlist")
    
            await cclient.matches.index({
                id: matchlist.url,
                callback: async (err: any, data: any) => {
                    if (err) console.log(err)
    
                    for (let d of data) {
                        if (d.match.round === parseInt(args[0])) {
                            if (d.match.player1Id === null || d.match.player2Id === null) continue;
    
                            let channelstringname: string = "", name1: string = "", name2: string = ""
    
                            cclient.participants.index({
                                id: matchlist.url,
                                callback: async (err: any, data: any) => {
                                    if (err) console.log(err)
    
                                    while (channelstringname.length === 0 && name1.length === 0 && name2.length === 0) {
                                        for (let x = 0; x < data.length; x++) {
                                            if (data[x].participant.id === d.match.player1Id) {
                                                //channelstringname += data[x].participant.name.substring(0, 10)
                                                name1 = data[x].participant.name
                                            }
    
                                            if (data[x].participant.id === d.match.player2Id) {
                                                name2 = data[x].participant.name
                                            }
                                        }
    
                                        if (name2.length > 0 && name1.length > 0) {
                                            channelstringname += name1.substring(0, 10) + "-vs-" + name2.substring(0, 10)
                                        }
                                    }
    
                                    await message.guild!.channels.create(channelstringname, { type: 'text', topic: `48h to complete` })
                                        .then(async channel => {
                                            let category = await message.guild!.channels.cache.find(c => c.name == "matches" && c.type == "category");
    
                                            await channel.send(`<@${names.find(x => x.str === name1)?.id}> <@${names.find(x => x.str === name2)?.id}> You have ${args[1]}h to complete this match. Contact a ref to begin, you may also split your match`)
                                            if (!category) throw new Error("Category channel does not exist");
                                            await channel.setParent(category.id);
                                            await channel.lockPermissions()
                                        });
                                }
                            }
    
                            )
                        }
                    }
                }
            })
        }
        return message.reply("Made all channels")
    }
}

export const qualchannelcreate: Command = {
    name: "qualchannelcreate",
    description: "!qualchannelcreate <portion> <time in hours to complete>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let time = args[1]
        let qlist: QualList = await getDoc("config", "quallist")
    
        for (let i = 0; i < qlist.users.length; i++) {
    
            if (qlist.users[i].length > 0) {
    
                let category = await message.guild!.channels.cache.find(c => c.name == "qualifiers" && c.type == "category");
    
                await message.guild!.channels.create(`Group ${i + 1}`, { type: 'text', topic: `Round ${args[0]}`, parent: category!.id })
                    .then(async channel => {
                        let string = ""
    
                        for (let u of qlist.users[i]) {
                            string += `<@${u}> `
                        }
    
                        await channel.send(`${string}, Portion ${args[0]} has begun, and you have ${time}h to complete it. Contact a ref to begin your portion!`)
                        
                    });
            }
    
        }
    
        return message.reply("Made all channels")
    }
}

export const matchbracket: Command = {
    name: "create-bracket",
    description: "Will make bracket",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        const cclient = challonge.createClient({
            apiKey: process.env.CHALLONGE
        });
    
        let matchid = (args.join("")).replace("https://challonge.com/", "");
    
        let matchlist: MatchList = await getDoc("config", "matchlist")

        let randrun = Math.floor(Math.random() * 10) + 1;
    
        while(randrun !== 0){
            for (let i = matchlist.users.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [matchlist.users[i], matchlist.users[j]] = [matchlist.users[j], matchlist.users[i]];
            }
        }
    
        for (let i = 0; i < matchlist.users.length; i++) {
            let name = await (await client.users.fetch(matchlist.users[i])).username
    
            cclient.participants.create({
                id: matchid,
                participant: {
                    name: name
                },
                callback: (err: any, data: any) => {
                    console.log(err, data);
                }
            });
        }

        matchlist.url = `${matchid}`
    
        await updateDoc("config", "matchlist", matchlist)
    
        //await ChannelCreation(message, disclient, ["1"])
    
        await message.reply(new MessageEmbed()
            .setColor("#d7be26")
            .setTitle(`Meme Mania ${args[0]}`)
            .setDescription(`Here's the link to the brackets\nhttps://www.challonge.com/${matchid}`)
            .setTimestamp()
        )
    }
}

export const channeldelete: Command = {
    name: "deletechannels",
    description: "!deletechannels <category>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let catchannels = message!.guild!.channels.cache.array()!

        for (let channel of catchannels) {
      
          try {
            if (channel.parent && channel.parent!.name === args[0]) {
              await channel.delete()
            }
      
          } catch {
            continue
          }
        }
    }
}

export default[
    matchchannelcreate,
    qualchannelcreate,
    matchbracket
].sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1;
    else if (k1.name > k2.name) return 1;
    else return 0;
})