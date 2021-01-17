import { Client, Message, MessageEmbed, TextChannel, User } from "discord.js"
import { getQual, getTemplatedb, getThemes, insertQual } from "../../db"
import { Command, Qual } from "../../types"

export const splitqual: Command = {
    name: "split-qual",
    description: "",
    group: "qual",
    owner: true,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        if (message.mentions.users.array().length < 4 || message.mentions.users.array().length > 6) return message.reply("Please mention the users");

        if (await getQual(message.channel.id)) return message.reply("On going match.");


        let q:Qual = {
            _id:message.channel.id,
            players:[],
            temp:{
                istheme:false,
                link:""
            },
            votes:[],
            votingperiod:false,
            votetime:0
        }

        for(let u of message.mentions.users.array()){
            q.players.push({
                userid:u.id,
                memedone:false,
                memelink:"",
                time:0,
                split:false,
                failed:false
            })

            q.votes.push([])
        }

        if (args.includes("theme")) {
            q.temp.istheme = true
        }

        let c: TextChannel = <TextChannel>await client.channels.fetch(await message.guild!.channels.cache.find(x => x.name.toLowerCase() === "mod-bot-spam")!.id)
        let em = new MessageEmbed()

        let temps: string[] = []

        if (q.temp.istheme) {
            temps = await (await getThemes()).list

            em.setTitle(`Theme for ${c.name}`)
                .setDescription(temps[Math.floor(Math.random() * temps.length)])
        }

        else {
            temps = await (await getTemplatedb()).list

            em.setTitle(`Template for ${c.name}`)
                .setImage(temps[Math.floor(Math.random() * temps.length)])
        }

        let msg = await c.send(em)

        msg.react('✅')
        msg.react('❌')
        msg.react('🌀')

        const approveFilter = (reaction: { emoji: { name: string; }; }, user: User) => reaction.emoji.name === '✅' && !user.bot;
        const disapproveFilter = (reaction: { emoji: { name: string; }; }, user: User) => reaction.emoji.name === '❌' && !user.bot;
        const randomizeFilter = (reaction: { emoji: { name: string; }; }, user: User) => reaction.emoji.name === '🌀' && !user.bot;

        const approve = msg.createReactionCollector(approveFilter, { time: 120000 });
        const disapprove = msg.createReactionCollector(disapproveFilter, { time: 120000 });
        const randomize = msg.createReactionCollector(randomizeFilter, { time: 120000 });

        randomize.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));

            if (q.temp.istheme) {
                temps = await (await getThemes()).list

                let eem = new MessageEmbed()
                    .setTitle(`Theme for ${c.name}`)
                    .setDescription(temps[Math.floor(Math.random() * temps.length)])
                    .setColor("PURPLE")

                msg.edit(eem)
            }

            else {
                temps = await (await getTemplatedb()).list

                let eem = new MessageEmbed()
                    .setTitle(`Template for ${c.name}`)
                    .setImage(temps[Math.floor(Math.random() * temps.length)])
                    .setColor("PURPLE")

                msg.edit(eem)
            }

        });

        disapprove.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            msg.channel.send(
                new MessageEmbed()
                    .setColor("RED")
                    .setTitle("FAILED")
                    .setDescription("Please try again")
            )
            randomize.on("end", async () => { })
            approve.on("end", async () => { })
        });

        approve.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));

            if (q.temp.istheme) q.temp.link = msg.embeds[0].description!;

            else q.temp.link = msg.embeds[0].image?.url!;

            await insertQual(q)

            return await message.channel.send(
                new MessageEmbed()
                    .setTitle(`Qualifier Match`)
                    .setColor("#d7be26")
                    .setDescription(`${c.name}, your match has been split.\nYou must complete your portion within given round\n Contact admins if you have an issue.`)
                    .setTimestamp()
            ).then(async m => {
                let emojis = ['🇦', '🇧', '🇨','🇩','🇪','🇫']
                for(let i = 0; i < q.players.length; i++){
                    m.react(emojis[i])
                }
            });

        });
        
    }
}