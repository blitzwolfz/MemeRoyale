import { Client, Message, MessageEmbed, MessageReaction, TextChannel, User } from "discord.js";
import { deleteMatch, getConfig, getMatch, getTemplatedB, getThemes, insertMatch, insertReminder, updateMatch } from "../../db";
import type { Command, Match } from "../../types";
import * as utils from "./utils";
import { createProfileatMatch } from "../user";


export const startmatch: Command = {
    name: "start",
    description: "To use the command: `!start @mention @mention`",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    execute: async function (message: Message, client: Client, args: string[]) {
        if ([...message.mentions.users.values()].length < 2) return message.reply("Please mention the users");

        if (await getMatch(message.channel.id)) return message.reply("On going match.");

        let m: Match = {
            _id: message.channel.id, messageID: [], pause:false, split: false, exhibition: false, temp: {
                istheme: false, link: ""
            }, p1: {
                userid: [...message.mentions.users.values()][0].id,
                memedone: false,
                donesplit: true,
                time: Math.floor(Date.now() / 1000),
                memelink: "",
                votes: 0,
                voters: []
            }, p2: {
                userid: [...message.mentions.users.values()][1].id,
                memedone: false,
                donesplit: true,
                time: Math.floor(Date.now() / 1000),
                memelink: "",
                votes: 0,
                voters: []
            }, votetime: 0, votingperiod: false
        };

        if (args[2] === "theme") {
            m.temp.istheme = true;
        }

        let c: TextChannel = <TextChannel>await client.channels.fetch(await message.guild!.channels.cache.find(x => x.name.toLowerCase() === "mod-bot-spam")!.id);
        let em = new MessageEmbed();

        let temps: string[] = [];
        let temp = "";

        if (m.temp.istheme) {
            temps = (await getThemes()).list;
            temp = temps[Math.floor(Math.random() * temps.length)];

            em.setTitle(`Theme for ${c.name}`)
            .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                format: "webp",
                size: 512
            }))}`)
            .setDescription(temp);
        }

        else {
            temps = (await getTemplatedB()).list;
            temp = temps[Math.floor(Math.random() * temps.length)];

            em.setTitle(`Template for ${c.name}`)
            .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                format: "webp",
                size: 512
            }))}`)
            .setImage(temp);
        }

        let msg = await c
            .send({
                content:`<@${message.author.id}>`,
                embeds:[
                    em
                ]
            });

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

            if (m.temp.istheme) {
                temps = (await getThemes()).list;

                temp = temps[Math.floor(Math.random() * temps.length)]

                let eem = new MessageEmbed()
                    .setTitle(`Theme for ${c.name}`)
                    .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                        format: "webp",
                        size: 512
                    }))}`)
                    .setDescription(temp)
                    .setColor("PURPLE");

                await msg.edit({
                    embeds: [
                        eem
                    ]
                });
            }

            else {
                temps = (await getTemplatedB()).list;

                temp = temps[Math.floor(Math.random() * temps.length)]

                let eem = new MessageEmbed()
                    .setTitle(`Template for ${c.name}`)
                    .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                        format: "webp",
                        size: 512
                    }))}`)
                    .setImage(temp)
                    .setColor("PURPLE");

                await msg.edit({
                    embeds: [
                        eem
                    ]
                });
            }

        });

        disapprove.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor("RED")
                        .setTitle("FAILED")
                        .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                            format: "webp",
                            size: 512
                        }))}`)
                        .setDescription("Please try again")
                ]
            });

            await msg.delete();
        });

        approve.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));

            if (m.temp.istheme) {
                m.temp.link = temp;
            }
            else {
                m.temp.link = temp;
            }

            await insertMatch(m).then(async a => {
                let c = await (<TextChannel>client.channels.cache.get("854930976974700554"));
                let cc = await (<TextChannel>client.channels.cache.get(m._id));
                c.send(`<#${m._id}>/${cc.name} template is ${m.temp.link}`);
            });
            await createProfileatMatch([...message.mentions.users.values()][0].id);
            await createProfileatMatch([...message.mentions.users.values()][1].id);

            for (let us of [...message.mentions.users.values()]) {
                if (m.temp.istheme) {
                    await us.send("Your theme is " + m.temp.link);
                }

                else {
                    await us.send("Your template is " + m.temp.link);
                }

                await us.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(`#${(await getConfig()).colour}`)
                            .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                                format: "webp",
                                size: 512
                            }))}`)
                            .setDescription(`You have 45 mins to complete your meme\n` + `Use \`!submit\` to submit to submit.`)
                    ]
                });



                await insertReminder({
                    _id: us.id, mention: "", channel: "", type: "meme", time: [
                        2400,
                        2100,
                        1500
                    ], timestamp: Math.floor(Math.floor(Date.now() / 1000) / 60) * 60, basetime: 2700
                });
            }

            try {
                msg = await msg.fetch(true)
                if(msg) await msg.delete()
            } catch {
                console.log("failed")
            }

            return await message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`Match between ${[...message.mentions.users.values()][0].username} & ${[...message.mentions.users.values()][1].username}`)
                        .setColor("#d7be26")
                        .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                            format: "webp",
                            size: 512
                        }))}`)
                        .setDescription(`<@${[...message.mentions.users.values()][0].id}> and <@${[...message.mentions.users.values()][1].id}>, you have 45 mins to submit your memes\n Contact admins if you have an issue.`)
                        .setTimestamp()
                ]
            })
        });
    }
};

export const splitmatch: Command = {
    name: "split",
    description: "",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        if ([...message.mentions.users.values()].length < 2) return message.reply("Please mention the users");

        if (await getMatch(message.channel.id)) return message.reply("On going match.");

        let m: Match = {
            _id: message.channel.id, messageID: [], pause:false, split: true, exhibition: false, temp: {
                istheme: false, link: ""
            }, p1: {
                userid: [...message.mentions.users.values()][0].id,
                memedone: false,
                donesplit: false,
                time: Math.floor(Date.now() / 1000),
                memelink: "",
                votes: 0,
                voters: []
            }, p2: {
                userid: [...message.mentions.users.values()][1].id,
                memedone: false,
                donesplit: false,
                time: Math.floor(Date.now() / 1000),
                memelink: "",
                votes: 0,
                voters: []
            }, votetime: 0, votingperiod: false
        };

        if (args[2] === "theme") {
            m.temp.istheme = true;
        }

        // let c: TextChannel = <TextChannel>await client.channels.fetch(await message.guild!.channels.cache.find(x => x.name.toLowerCase() === "mod-bot-spam")!.id);
        let c: TextChannel = <TextChannel>await client.channels.fetch("722616679280148504");
        let em = new MessageEmbed();

        let temps: string[] = [];
        let temp = "";

        if (m.temp.istheme) {
            temps = (await getThemes()).list;
            temp = temps[Math.floor(Math.random() * temps.length)]

            em.setTitle(`Theme for ${c.name}`)
            .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                format: "webp",
                size: 512
            }))}`)
            .setDescription(temp);
        }

        else {
            temps = (await getTemplatedB()).list;
            temp = temps[Math.floor(Math.random() * temps.length)]

            em.setTitle(`Template for ${c.name}`)
            .setFooter("MemeRoyale#3101", `${((await client.users.fetch("722303830368190485"))!.displayAvatarURL({
                format: "webp",
                size: 512
            }))}`)
            .setImage(temp);
        }

        let msg = await c
            .send({
            content:`<@${message.author.id}>`,
            embeds:[
                em
            ]
        });

        await msg.react("✅");
        await msg.react("❌");
        await msg.react('🌀');

        const approveFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === '✅' && !user.bot;
        const disapproveFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === '❌' && !user.bot;
        const randomizeFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === '🌀' && !user.bot;

        const approve = msg.createReactionCollector({filter:approveFilter, time: 120000, dispose:true});
        const disapprove = msg.createReactionCollector({filter:disapproveFilter, time: 120000, dispose:true});
        const randomize = msg.createReactionCollector({filter:randomizeFilter, time: 120000, dispose:true});

        randomize.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));

            if (m.temp.istheme) {
                temps = (await getThemes()).list;

                temp = temps[Math.floor(Math.random() * temps.length)];

                let eem = new MessageEmbed()
                    .setTitle(`Theme for ${c.name}`)
                    .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                        format: "webp",
                        size: 512
                    }))}`)
                    .setDescription(temp)
                    .setColor("PURPLE");

                try {
                    await msg.edit({
                        embeds:[
                            eem
                        ]
                    });
                } catch (e) {
                    await message.channel.send(e.stack)
                    await message.channel.send(e.message)
                }
            }

            else {
                temps = (await getTemplatedB()).list;
                temp = temps[Math.floor(Math.random() * temps.length)]

                let eem = new MessageEmbed()
                    .setTitle(`Template for ${c.name}`)
                    .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                        format: "webp",
                        size: 512
                    }))}`)
                    .setImage(temp)
                    .setColor("PURPLE");

                try {
                    await msg.edit({
                        embeds:[
                            eem
                        ]
                    });
                } catch (e) {
                    await message.channel.send(e.stack)
                    await message.channel.send(e.message)
                }
            }

        });

        disapprove.on('collect', async () => {
            approve.stop("User failed to choose")
            randomize.stop("User failed to choose")
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor("RED")
                        .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                            format: "webp",
                            size: 512
                        }))}`)
                        .setTitle("FAILED")
                        .setDescription("Please try again")
                ]
            });
        });

        approve.on('collect', async () => {
            disapprove.stop("User approved")
            randomize.stop("User approved")
            try {
                msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            } catch (e) {
                await message.channel.send(e.stack)
                await message.channel.send(e.message)
            }

            if (m.temp.istheme) {
                m.temp.link = temp;
            }
            else {
                m.temp.link = temp;
            }

            await insertMatch(m).then(async () => {
                let c = await (<TextChannel>client.channels.cache.get("854930976974700554"));
                let cc = await (<TextChannel>client.channels.cache.get(m._id));
                c.send(`<#${m._id}>/${cc.name} template is ${m.temp.link}`);
            });
            await createProfileatMatch([...message.mentions.users.values()][0].id);
            await createProfileatMatch([...message.mentions.users.values()][1].id);

            await message.channel.send({
                embeds:[
                    new MessageEmbed()
                        .setTitle(`Match between ${[...message.mentions.users.values()][0].username} & ${[...message.mentions.users.values()][1].username}`)
                        .setColor("#d7be26")
                    .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                format: "webp",
                size: 512
            }))}`)
                        .setDescription(`<@${[...message.mentions.users.values()][0].id}> and <@${[...message.mentions.users.values()][1].id}>, your match has been split.\nYou must complete your portion with given round\n Contact admins if you have an issue.`)
                        .setTimestamp()
                ]
            }).then(async m => {
                await m.react('🅰️');
                await m.react('🅱️');
            });

            try {
                await msg.delete();
            } catch (e) {
                console.log("error deleting fuck my asshole")
            }

            return;

        });
    }
};

export const startsplit: Command = {
    name: "start-split",
    description: "",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        try {
            if ([...message.mentions.users.values()].length === 0 && args.length === 0) return message.reply("Please mention the user.");

            let m = await getMatch(message.channel.id);
            let id = "";

            if (message.mentions.users.first() === undefined) {
                id = args[0];
            }
            else {
                id = message.mentions.users.first()?.id!;
            }

            let arr = [
                m.p1,
                m.p2
            ];

            let e = arr.find(x => x.userid === (id))!;

            e.donesplit = true;
            e.time = Math.floor(Date.now() / 1000);

            (await client.users.cache.get(e.userid)!).send(`This is your ${m.temp.istheme ? "theme: " : "template: "}` + m.temp.link);
            (await client.users.cache.get(e.userid))!.send({
                embeds:[
                    new MessageEmbed()
                        .setColor(`#${(await getConfig()).colour}`)
                    .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                format: "webp",
                size: 512
            }))}`)
                        .setDescription(`<@${e.userid}> your match has been split.\n` + `You have 45 mins to complete your meme\n` + `Use \`!submit\` to submit to submit each image seperately`)
                ]
            });

            try {
                await insertReminder({
                    _id: e.userid, mention: "", channel: "", type: "meme", time: [
                        2400,
                        2100,
                        1500
                    ], timestamp: Math.floor(Math.floor(Date.now() / 1000) / 60) * 60, basetime: 2700
                });
            } catch {
                console.log("No submission reminder possible.")
            }

            if (m.p1.userid === e.userid) m.p1 = e; else m.p2 = e;

            m.p1.userid === e.userid ? m.p1 = e : m.p2 = e;

            await updateMatch(m);

            return (<TextChannel>await client.channels.cache.get(m._id)!).send({
                embeds:[
                    new MessageEmbed()
                        .setColor(`#${(await getConfig()).colour}`)
                    .setFooter("MemeRoyale#3101", `${((await client.users.cache.get("722303830368190485"))!.displayAvatarURL({
                format: "webp",
                size: 512
            }))}`)
                        .setDescription(`<@${e.userid}> your match has been split.\n`
                            + `You have 45 mins to complete your meme\n`
                            + `Use \`!submit\` to submit to submit each image seperately`)
                ]
            });
        } catch (error) {
            console.log(error.message);
        }
    }
};

export const cancelmatch: Command = {
    name: "cancel-match",
    description: "This will cancel a match.\n" + "You can either do this command\n" + "in the channel, or in a mod\n" + "channel by mentioning the channel.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {

        if ([...message.mentions.channels.values()].length === 1) {
            if (!await getMatch([...message.mentions.channels.values()][0].id)) return message.reply("There is no active match there");
            await deleteMatch([...message.mentions.channels.values()][0].id);

            return message.channel.send({
                embeds:[
                    new MessageEmbed()
                        .setColor("RED")
                        .setDescription("Match has been canceled")
                ]
            });
        }

        else {
            if (!await getMatch(message.channel.id)) return message.reply("There is no active match here");
            await deleteMatch(message.channel.id);

            return message.channel.send({
                embeds:[
                    new MessageEmbed()
                        .setColor("RED")
                        .setDescription("Match has been canceled")
                ]
            });
        }
    }
};

// if (m.temp.istheme) {
//     await message.mentions.users.array()[0].send("Your theme is " + m.temp.link);
//     await message.mentions.users.array()[0].send(new MessageEmbed()
//     .setColor(`#${(await getConfig()).colour}`)
//     .setDescription(`You have 45 mins to complete your meme\n` + `Use \`!submit\` to submit to submit.`));
//
//     await message.mentions.users.array()[1].send("Your theme is " + m.temp.link);
//     await message.mentions.users.array()[1].send(new MessageEmbed()
//     .setColor(`#${(await getConfig()).colour}`)
//     .setDescription(`You have 45 mins to complete your meme\n` + `Use \`!submit\` to submit to submit.`));
// }
//
// else {
//     await message.mentions.users.array()[0].send("Your template is " + m.temp.link);
//     await message.mentions.users.array()[0].send(new MessageEmbed()
//     .setColor(`#${(await getConfig()).colour}`)
//     .setDescription(`You have 45 mins to complete your meme\n` + `Use \`!submit\` to submit to submit.`));
//
//     await message.mentions.users.array()[1].send("Your template is " + m.temp.link);
//     await message.mentions.users.array()[1].send(new MessageEmbed()
//     .setColor(`#${(await getConfig()).colour}`)
//     .setDescription(`You have 45 mins to complete your meme\n` + `Use \`!submit\` to submit to submit.`));
// }

export default [
    cancelmatch,
    splitmatch,
    startmatch,
    startsplit
]
.concat(utils.default)