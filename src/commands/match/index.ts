import { Client, Message, MessageEmbed, TextChannel, User } from "discord.js"
import { deleteMatch, getConfig, getMatch, getTemplatedb, getThemes, insertMatch, insertReminder, updateMatch } from "../../db"
import { Command, Match } from "../../types"

export const startmatch: Command = {
    name: "start",
    description: "",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        if (message.mentions.users.array().length < 2) return message.reply("Please mention the users")

        if (await getMatch(message.channel.id)) return message.reply("On going match.")

        let m: Match = {
            _id: message.channel.id,
            messageID: [],
            split: false,
            exhibition: false,
            temp: {
                istheme: false,
                link: ""
            },
            p1: {
                userid: message.mentions.users.array()[0].id,
                memedone: false,
                donesplit: true,
                time: Math.floor(Date.now() / 1000),
                memelink: "",
                votes: 0,
                voters: []
            },
            p2: {
                userid: message.mentions.users.array()[1].id,
                memedone: false,
                donesplit: true,
                time: Math.floor(Date.now() / 1000),
                memelink: "",
                votes: 0,
                voters: []
            },
            votetime: 0,
            votingperiod: false
        }

        if (args[2] === "theme") {
            m.temp.istheme = true
        }

        let c: TextChannel = <TextChannel>await client.channels.fetch(await message.guild!.channels.cache.find(x => x.name.toLowerCase() === "mod-bot-spam")!.id)
        let em = new MessageEmbed()

        let temps: string[] = []

        if (m.temp.istheme) {
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

            if (m.temp.istheme) {
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
            message.channel.send(
                new MessageEmbed()
                    .setColor("RED")
                    .setTitle("FAILED")
                    .setDescription("Please try again")
            )
        });

        approve.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));

            if (m.temp.istheme) m.temp.link = msg.embeds[0].description!

            else m.temp.link = msg.embeds[0].image?.url!

            await insertMatch(m)

            if (m.temp.istheme) {
                await message.mentions.users.array()[0].send("Your theme is " + m.temp.link)
                await message.mentions.users.array()[1].send("Your theme is " + m.temp.link)
            }

            else {
                await message.mentions.users.array()[0].send("Your template is " + m.temp.link)
                await message.mentions.users.array()[1].send("Your template is " + m.temp.link)
            }

            await insertReminder(
                {
                    _id: message.mentions.users.array()[0].id,
                    mention: "",
                    channel: "",
                    type: "meme",
                    time: 1800,
                    timestamp: Math.floor(Date.now() / 1000)
                }
            )

            await insertReminder(
                {
                    _id: message.mentions.users.array()[1].id,
                    mention: "",
                    channel: "",
                    type: "meme",
                    time: 1800,
                    timestamp: Math.floor(Date.now() / 1000)
                }
            )
        });
    }
}

export const splitmatch: Command = {
    name: "split",
    description: "",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        if (message.mentions.users.array().length < 2) return message.reply("Please mention the users")

        if (await getMatch(message.channel.id)) return message.reply("On going match.")

        let m: Match = {
            _id: message.channel.id,
            messageID: [],
            split: true,
            exhibition: false,
            temp: {
                istheme: false,
                link: ""
            },
            p1: {
                userid: message.mentions.users.array()[0].id,
                memedone: false,
                donesplit: false,
                time: Math.floor(Date.now() / 1000),
                memelink: "",
                votes: 0,
                voters: []
            },
            p2: {
                userid: message.mentions.users.array()[1].id,
                memedone: false,
                donesplit: false,
                time: Math.floor(Date.now() / 1000),
                memelink: "",
                votes: 0,
                voters: []
            },
            votetime: 0,
            votingperiod: false
        }

        if (args[2] === "theme") {
            m.temp.istheme = true
        }

        let c: TextChannel = <TextChannel>await client.channels.fetch(await message.guild!.channels.cache.find(x => x.name.toLowerCase() === "mod-bot-spam")!.id)
        let em = new MessageEmbed()

        let temps: string[] = []

        if (m.temp.istheme) {
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

            if (m.temp.istheme) {
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
            message.channel.send(
                new MessageEmbed()
                    .setColor("RED")
                    .setTitle("FAILED")
                    .setDescription("Please try again")
            )
        });

        approve.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));

            if (m.temp.istheme) m.temp.link = msg.embeds[0].description!

            else m.temp.link = msg.embeds[0].image?.url!

            await insertMatch(m)

            return await message.channel.send(
                new MessageEmbed()
                    .setTitle(`Match between ${message.mentions.users.array()[0].username} & ${message.mentions.users.array()[1].username}`)
                    .setColor("#d7be26")
                    .setDescription(`<@${message.mentions.users.array()[0].id}> and <@${message.mentions.users.array()[1].id}>, your match has been split.\nYou must complete your portion with given round\n Contact admins if you have an issue.`)
                    .setTimestamp()
            ).then(async m => {
                await m.react('🅰️')
                await m.react('🅱️')
            });

        });
    }
}

export const startsplit: Command = {
    name: "start-split",
    description: "",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        try {
            if (message.mentions.users.array().length === 0 && args.length === 0 ) return message.reply("Please mention the user.")
            
            let m = await getMatch(message.channel.id)
            let id = "";

            if(message.mentions.users.first() === undefined) {
                id = args[0]
            }
            else {
                id = message.mentions.users.first()?.id!
            }

            let arr = [m.p1, m.p2]

            let e = arr.find(x => x.userid === (id))!

            e.donesplit = true
            e.time = Math.floor(Date.now() / 1000);

            (await client.users.cache.get(e.userid))!.send(
                `This is your ${m.temp.istheme ? "theme: " : "template: "}` +
                m.temp.link,
                new MessageEmbed()
                    .setColor(await (await getConfig()).colour)
                    .setDescription(
                        `<@${e.userid}> your match has been split.\n` +
                        `You have 1 hours to complete your meme\n` +
                        `Use \`!submit\` to submit to submit each image seperately`
                    )
            )

            await insertReminder(
                {
                    _id: e.userid,
                    mention: "",
                    channel: "",
                    type: "meme",
                    time: 1800,
                    timestamp: Math.floor(Date.now() / 1000)
                }
            )

            if (m.p1.userid === e.userid) m.p1 = e;
            else m.p2 = e;

            await updateMatch(m);

            return (<TextChannel>await client.channels.cache.get(m._id)!).send(
                new MessageEmbed()
                    .setColor(await (await getConfig()).colour)
                    .setDescription(
                        `<@${e.userid}> your match has been split.\n` +
                        `You have 1 hours to complete your meme\n` +
                        `Use \`!submit\` to submit to submit each image seperately`
                    )
            )
        } catch (error) {
            console.log(error.message)
        }
    }
}

export const cancelmatch: Command = {
    name: "cancel-match",
    description: "This will cancel a match.\n" +
        "You can either do this command\n" +
        "in the channel, or in a mod\n" +
        "channel by mentioning the channel.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {

        if (message.mentions.channels.array().length === 1) {
            if (!await getMatch(message.mentions.channels.array()[0].id)) return message.reply("There is no active match here");
            await deleteMatch(message.mentions.channels.array()[0].id)

            return message.channel.send(
                new MessageEmbed()
                    .setColor("RED")
                    .setTitle(`${message.mentions.channels.array()[0].name}`)
                    .setDescription("Match has been canceled")
            )
        }

        else {
            if (!await getMatch(message.channel.id)) return message.reply("There is no active match here");
            await deleteMatch(message.channel.id)

            return message.channel.send(
                new MessageEmbed()
                    .setColor("RED")
                    .setDescription("Match has been canceled")
            )
        }
    }
}

export const endmatch: Command = {
    name: "match-end",
    description: "This will end a match.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let m = await getMatch(message.channel.id)
        m.votetime = Math.floor(Date.now()/1000) - 7200
        await updateMatch(m)

        return message.reply("Match has ended").then(async m =>{
            m.delete({timeout:1500})
        })
    }
}
