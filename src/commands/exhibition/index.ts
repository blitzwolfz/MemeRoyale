import { Client, Message, MessageEmbed } from "discord.js"
import { getExhibition, getTemplatedb, getThemes, insertMatch, updateExhibition } from "../../db"
import { Command, Match } from "../../types"
import { createDuelProfileatMatch } from "../user"
import * as s from "./utils"

export const duel: Command = {
    name: "duel",
    description: "",
    group: "duels",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        if (!message.mentions.users.array()){
            return message.reply("Please mention someone")
        }
    
        else if (message.mentions.users.first()?.id === message.author.id){
            return message.reply("You can't duel yourself.")
        }

        if (args.length < 2){
            return message.reply("Please use theme flag or template flag")
        }
    
        else if (args.length >= 3){
            return message.reply("No too many arguments. Use only the theme flag or template flag")
        }
    
        else if(!["template", "theme"].includes(args[1].toLowerCase())){
            return message.reply("Please use theme flag or template flag")
        }
    
        let ex = await getExhibition()

        if(ex.cooldowns.some(x => x.user === message.author.id)){
            return message.reply("It hasn't been 5 mins yet")
        }

        if(ex.cooldowns.some(x => x.user === message.mentions.users.first()!.id)){
            return message.reply(`It hasn't been 5 mins for <@${message.mentions.users.first()!.id}`)
        }

        let m = message

        const filter = (response:any) => {
            return (("accept").toLowerCase() === response.content.toLowerCase());
        };

        let id2 =  message.mentions.users.first()!

        ex.cooldowns.push({
            user:id2.id,
            time:Math.floor(Date.now() / 1000)
        })
    
        ex.cooldowns.push({
            user:m.author.id,
            time:Math.floor(Date.now() / 1000)
        })

        await updateExhibition(ex)
    
        ex = await getExhibition()

        var res;

        await message.mentions.users.first()?.send(`<@${m.author.id}> wants to duel you. Send Accept to continue, or don't reply to not`).then(async (userdm:Message) => {
            //console.log(userdm.channel.id)
            await userdm.channel.awaitMessages(filter, { max: 1, time: 90000, errors: ['time'] })
                //Don't know why it's raising an error in this code base but didn't in the old one
                //@ts-ignore
                .then(async collected => {
                    await m.channel.send(`${collected.first()!.author} accepted, <@${m.author.id}>!`);
                    res = true;
                })
                
                //Don't know why it's raising an error in this code base but didn't in the old one
                //@ts-ignore
                .catch(async collected => {
                    await m.author.send(`<@${m.author.id}> match has been declined`);
                    res = false;
    
                    
                    ex.cooldowns.splice(ex.cooldowns.findIndex(x => x.user === id2.id), 1)
                    ex.cooldowns.splice(ex.cooldowns.findIndex(x => x.user === m.author.id), 1)
                    await updateExhibition(ex)
                    return;
                });
        });

        if(res === true){
            await updateExhibition(ex)
    
            ex = await getExhibition()

            let guild = client.guilds.cache.get(message.guild!.id)!
            let category = await guild!.channels.cache.find(c => c.name.toLowerCase() == "duels" && c.type == "category")!;

            await guild?.channels
            .create(`${message.author.username}-vs-${message.mentions.users.first()?.username}`, { type: 'text', topic: `Exhibition Match`, parent: category!.id})
            .then(async channel => {

                try {
                    await channel.lockPermissions()
                } catch (error) {
                    console.log(error)
                    console.log("Can't lock channel")
                }
    
                let m: Match = {
                    _id: channel.id,
                    split: false,
                    exhibition:true,
                    messageID: [],
                    temp : {
                        istheme: false,
                        link: ""
                    },
                    tempfound: false,
                    p1: {
                        userid: message.author.id,
                        memedone: false,
                        donesplit: true,
                        time: Math.floor(Date.now() / 1000),
                        memelink: "",
                        votes: 0,
                        voters: []
                    },
                    p2: {
                        userid: message.mentions.users.first()!.id,
                        memedone: false,
                        donesplit: true,
                        time: Math.floor(Date.now() / 1000),
                        memelink: "",
                        votes: 0,
                        voters: []
                    },
                    votetime: Math.floor(Date.now() / 1000),
                    votingperiod: false,
                    // votemessage: null,
                }
                
                let user1 = message.author
                let user2 = message.mentions.users.first()!

                if (args[1] === "theme") {
                    m.temp.istheme = true
                }
   
                let temps: string[] = []

                if (m.temp.istheme) {
                    temps = await (await getThemes()).list

                    m.temp.link = temps[Math.floor(Math.random() * temps.length)];
                }
        
                else {
                    temps = await (await getTemplatedb()).list

                    m.temp.link = temps[Math.floor(Math.random() * temps.length)];
                }
    
                let embed = new MessageEmbed()
                .setTitle(`Match between ${user1.username ? user1.username : (await message.guild!.members.fetch(user1.id)).nickname} and ${user2.username ? user2.username :(await message.guild!.members.fetch(user2.id)).nickname}`)
                .setColor("#d7be26")
                .setDescription(`<@${user1.id}> and <@${user2.id}> both have 30 mins to complete your memes.\n Contact admins if you have an issue.`)
                .setTimestamp()

                channel.send({ embed })   
    
                if(m.temp.istheme){
                    await user1.send(`Your theme is: ${m.temp.link}`)
                    await user2.send(`Your theme is: ${m.temp.link}`)
    
                }
                
                else{
                    await user1.send(new MessageEmbed()
                    .setTitle("Your template")
                    .setImage(m.temp.link)
                    .setColor("#d7be26")
                    .setTimestamp())
                
                    await user2.send(new MessageEmbed()
                    .setTitle("Your template")
                    .setImage(m.temp.link)
                    .setColor("#d7be26")
                    .setTimestamp())
                }

                await user1.send(`You have 30 mins to complete your meme\nUse \`!submit\` to submit each image. If you have an active match in MemeRoyale, you will have to submit based on channel`)
                await user2.send(`You have 30 mins to complete your meme\nUse \`!submit\` to submit each image. If you have an active match in MemeRoyale, you will have to submit based on channel`)
                if(m.temp.link){
                    await user1.send(`Image link if embed doesn't show:\`${m.temp.link}\``)
                    await user2.send(`Image link if embed doesn't show:\`${m.temp.link}\``)
                }


                await insertMatch(m)
                ex.activematches.push(channel.id)
                await updateExhibition(ex)
                await createDuelProfileatMatch(user1.id, guild.id)
                return await createDuelProfileatMatch(user2.id, guild.id)
                
            });
        }

    }
}

export default[
    duel
]
.concat(s.default)
.sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1;
    else if (k1.name > k2.name) return 1;
    else return 0;
})