import { Client, Message, MessageEmbed, TextChannel, User } from "discord.js"
import { deleteQual, getConfig, getQual, getTemplatedb, getThemes, insertQual, updateQual } from "../../db"
import { Command, Qual } from "../../types"

export const splitqual: Command = {
    name: "split-qual",
    description: "",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        if (message.mentions.users.array().length < 3 || message.mentions.users.array().length > 6) return message.reply("Please mention the users");

        if (await getQual(message.channel.id)) return message.reply("On going match.");


        let q: Qual = {
            _id: message.channel.id,
            messageID: [],
            players: [],
            temp: {
                istheme: true,
                link: ""
            },
            votingperiod: false,
            votetime: 0
        }

        for (let u of message.mentions.users.array()) {
            q.players.push({
                userid: u.id,
                memedone: false,
                memelink: "",
                time: 0,
                split: false,
                failed: false,
                votes: [],
            })
        }

        if (args.includes("template")) {
            q.temp.istheme = false
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

        let msg = await c.send(`<@${message.author.id}>`, em)

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
                    .setDescription(`Your qualifier has been split.\nYou must complete your portion within given round\n Contact admins if you have an issue.`)
                    .setTimestamp()
            ).then(async m => {
                let emojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫']
                for (let i = 0; i < q.players.length; i++) {
                    m.react(emojis[i])
                }
            });

        });

    }
}

export const startsplitqual: Command = {
    name: "start-qual",
    description: "",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        try {
            if (message.mentions.users.array().length === 0 && args.length === 0) return message.reply("Please mention the user.")

            let q = await getQual(message.channel.id)
            let id = "";

            if (message.mentions.users.first() === undefined) {
                id = args[0]
            }
            else {
                id = message.mentions.users.first()?.id!
            }

            let arr = q.players

            let e = arr.find(x => x.userid === id)!;

            (await client.users.cache.get(e.userid))!.send(
                `This is your ${q.temp.istheme ? "theme: " : "template: "}` +
                q.temp.link,
                new MessageEmbed()
                    .setColor(await (await getConfig()).colour)
                    .setDescription(
                        `<@${e.userid}> your match has been split.\n` +
                        `You have 30 mins to complete your meme\n` +
                        `Use \`!qualsubmit\` to submit to submit each image seperately`
                    )
            )

            e.split = true
            e.time = Math.floor(Date.now() / 1000)

            arr[arr.findIndex(x => x.userid === id)] = e

            q.players = arr

            await updateQual(q)

            return (<TextChannel>await client.channels.cache.get(q._id)!).send(
                new MessageEmbed()
                    .setColor(await (await getConfig()).colour)
                    .setDescription(
                        `<@${e.userid}> your match has been split.\n` +
                        `You have 30 mins to complete your meme\n` +
                        `Use \`!qualsubmit\` to submit to submit each image seperately`
                    )
            )
        } catch (error) {
            console.log(error.message)
        }
    }
}

export const cancelqual: Command = {
    name: "cancel-qual",
    description: "This will cancel a qual.\n" +
        "You can either do this command\n" +
        "in the channel, or in a mod\n" +
        "channel by mentioning the channel.",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {

        if (message.mentions.channels.array().length === 1) {
            if (!await getQual(message.mentions.channels.array()[0].id)) return message.reply("There is no active match here");
            await deleteQual(message.mentions.channels.array()[0].id)

            return message.channel.send(
                new MessageEmbed()
                    .setColor("RED")
                    .setTitle(`${message.mentions.channels.array()[0].name}`)
                    .setDescription("Match has been canceled")
            )
        }

        else {
            if (!await getQual(message.channel.id)) return message.reply("There is no active match here");
            await deleteQual(message.channel.id)

            return message.channel.send(
                new MessageEmbed()
                    .setColor("RED")
                    .setDescription("Match has been canceled")
            )
        }
    }
}

export const endqual: Command = {
    name: "end-qual",
    description: "This will end a qual.",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let m = await getQual(message.channel.id)
        m.votetime = Math.floor(Date.now()/1000) - 7200
        await updateQual(m)

        return message.reply("Qualifier has ended").then(async m =>{
            m.delete({timeout:1500})
        })
    }
}