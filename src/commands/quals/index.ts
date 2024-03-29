import { Client, Message, MessageEmbed, MessageReaction, TextChannel, User } from "discord.js";
import { deleteQual, getConfig, getQual, getTemplatedB, getThemes, insertQual, insertReminder, updateQual } from "../../db";
import type { Command, Qual } from "../../types";
import * as utils from "./utils";
import { createProfileatMatch } from "../user";

export const splitqual: Command = {
    name: "splitqual",
    description: "",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        if ([...message.mentions.users.values()].length > 6) return message.reply("Please mention no more than 6 users.");
        if ([...message.mentions.users.values()].length < 3) return message.reply("Please mention at least 3 users.");

        if (await getQual(message.channel.id)) return message.reply("On going match. Cancel that one to start a new one.");


        let q: Qual = {
            _id: message.channel.id, pause:false, messageID: [], players: [], temp: {
                istheme: true, link: ""
            }, votingperiod: false, votetime: 0
        };

        for (let u of [...message.mentions.users.values()]) {
            q.players.push({
                userid: u.id, memedone: false, memelink: "", time: 0, split: false, failed: false, votes: []
            });

            await createProfileatMatch(u.id)
        }

        if (args.includes("-template")) {
            q.temp.istheme = false;
        }

        let c: TextChannel = <TextChannel>await client.channels.fetch(await message.guild!.channels.cache.find(x => x.name.toLowerCase() === "mod-bot-spam")!.id);
        let em = new MessageEmbed();

        let temps: string[] = [];
        let temp = "";

        if (q.temp.istheme) {
            temps = (await getThemes()).list;
            temp = temps[Math.floor(Math.random() * temps.length)]

            em.setTitle(`Theme for ${c.name}`)
            .setDescription(temp);
        }

        else {
            temps = (await getTemplatedB()).list;
            temp = temps[Math.floor(Math.random() * temps.length)]

            em.setTitle(`Template for ${c.name}`)
            .setImage(temp);
        }

        let msg = await c
            .send({
                content:`<@${message.author.id}>`,
                embeds:[
                    em
                ]
            })
        ;

        await msg.react('✅');
        await msg.react('❌');
        await msg.react('🌀');

        const approveFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === '✅' && !user.bot;
        const disapproveFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === '❌' && !user.bot;
        const randomizeFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === '🌀' && !user.bot;

        const approve = msg.createReactionCollector({filter:approveFilter, time: 120000});
        const disapprove = msg.createReactionCollector({filter:disapproveFilter, time: 120000});
        const randomize = msg.createReactionCollector({filter:randomizeFilter, time: 120000});

        randomize.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));

            if (q.temp.istheme) {
                temps = (await getThemes()).list;
                temp = temps[Math.floor(Math.random() * temps.length)]

                let eem = new MessageEmbed()
                .setTitle(`Theme for ${c.name}`)
                .setDescription(temp)
                .setColor("PURPLE");

                await msg.edit({
                    embeds:[
                        eem
                    ]
                });
            }

            else {
                temps = (await getTemplatedB()).list;
                temp = temps[Math.floor(Math.random() * temps.length)]

                let eem = new MessageEmbed()
                .setTitle(`Template for ${c.name}`)
                .setImage(temp)
                .setColor("PURPLE");

                await msg.edit({
                    embeds:[
                        eem
                    ]
                });
            }

        });

        disapprove.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            msg.channel.send({
                embeds:[
                    new MessageEmbed()
                        .setColor("RED")
                        .setTitle("FAILED")
                        .setDescription("Please try again")
                ]
            });
            randomize.on("end", async () => {
            });
            approve.on("end", async () => {
            });
            return await msg.delete()
        });

        approve.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));

            if (q.temp.istheme) {
                q.temp.link = temp;
            }
            else {
                q.temp.link = temp;
            }

            await insertQual(q).then(async a => {
                let c = await (<TextChannel>client.channels.cache.get("738047732312309870"));
                let cc = await (<TextChannel>client.channels.cache.get(q._id));
                c.send(`<#${q._id}>/${cc.name} template is ${q.temp.link}`);
            });;

            await message.channel.send({
                embeds:[
                    new MessageEmbed()
                        .setTitle(`Qualifier Match`)
                        .setColor("#d7be26")
                        .setDescription(`${q.players.map(a => `<@${a.userid}>`).join(", ")} qualifier has been split.\nYou must complete your portion within given round\n Contact admins if you have an issue.`)
                        .setTimestamp()
                ]
            }).then(async m => {
                let emojis = [
                    '🇦',
                    '🇧',
                    '🇨',
                    '🇩',
                    '🇪',
                    '🇫'
                ];
                for (let i = 0; i < q.players.length; i++) {
                    await m.react(emojis[i]);
                }
            });

            return await msg.delete()

        });

    }
};

export const startsplitqual: Command = {
    name: "start-qual",
    description: "",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        try {
            if ([...message.mentions.users.values()].length === 0 && args.length === 0) return message.reply("Please mention the user.");

            let q = await getQual(message.channel.id);
            let id = "";

            if (message.mentions.users.first() === undefined) {
                id = args[0];
            }
            else {
                id = message.mentions.users.first()?.id!;
            }

            let arr = q.players;

            let e = arr.find(x => x.userid === id)!;

            if(e.split && (e.memedone || e.failed)) return message.reply("already done");

            (await client.users.cache.get(e.userid))!
                .send({
                    content:`This is your ${q.temp.istheme ? "theme: " : "template: "} ${q.temp.link}`,
                    embeds:[
                        new MessageEmbed()
                            .setColor(`#${(await getConfig()).colour}`)
                            .setDescription(`<@${e.userid}> your match has been split.\n` + `You have 60 mins to complete your meme\n` + `Use \`!submit\` to submit.`)
                    ]
                })
            ;

            e.split = true;
            e.time = Math.floor(Date.now() / 1000);

            arr[arr.findIndex(x => x.userid === id)] = e;

            q.players = arr;

            await updateQual(q);
            try{
                await insertReminder({
                    _id: e.userid, mention: "", channel: "", type: "meme", time: [
                        3300,
                        2700,
                        1800
                    ], timestamp: Math.floor(Math.floor(Date.now() / 1000) / 60) * 60, basetime: 3600
                });
            }  catch {
                console.log(`Could not insert a reminder for ${e.userid}`)
            }

            return (<TextChannel>await client.channels.cache.get(q._id)!).send({
                embeds:[
                    new MessageEmbed()
                        .setColor(`#${(await getConfig()).colour}`)
                        .setDescription(`<@${e.userid}> your match has been split.\n` + `You have 60 mins to complete your meme\n` + `Use \`!submit\` to submit.`)
                ]
            });
        } catch (error) {
            console.log(error.message);
        }
    }
};

export const cancelqual: Command = {
    name: "cancel-qual",
    description: "This will cancel a qual.\n" + "You can either do this command\n" + "in the channel, or in a mod\n" + "channel by mentioning the channel.",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {

        if ([...message.mentions.channels.values()].length === 1) {
            if (!await getQual([...message.mentions.channels.values()][0].id)) return message.reply("There is no Qualifier match there");
            await deleteQual([...message.mentions.channels.values()][0].id);

            return message.channel.send({
                embeds:[
                    new MessageEmbed()
                        .setColor("RED")
                        .setDescription("Match has been canceled")
                ]
            });
        }

        else {
            if (!await getQual(message.channel.id)) return message.reply("There is no Qualifier match here");
            await deleteQual(message.channel.id);

            return message.channel.send({
                embeds:[
                    new MessageEmbed()
                        .setColor("RED")
                        .setDescription("Qualifier has been canceled")
                ]
            });
        }
    }
};

export const endqual: Command = {
    name: "end-qual",
    description: "This will end a qual.",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let m = await getQual(message.channel.id);
        m.votetime = (Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - 7200;
        await updateQual(m);

        return message.reply("Qualifier has ended").then(async m => {
            await setTimeout(() => m.delete(), 1500);
        });
    }
};

export default [
    cancelqual,
    endqual,
    splitqual,
    startsplitqual
]
    .concat(utils.default)