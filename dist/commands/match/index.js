"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endmatch = exports.cancelmatch = exports.startsplit = exports.splitmatch = exports.startmatch = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
exports.startmatch = {
    name: "start",
    description: "",
    group: "match",
    owner: true,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        if (message.mentions.users.array().length < 2)
            return message.reply("Please mention the users");
        if (await db_1.getMatch(message.channel.id))
            return message.reply("On going match.");
        let m = {
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
        };
        if (args[2] === "theme") {
            m.temp.istheme = true;
        }
        let c = await client.channels.fetch(await message.guild.channels.cache.find(x => x.name.toLowerCase() === "mod-bot-spam").id);
        let em = new discord_js_1.MessageEmbed();
        let temps = [];
        if (m.temp.istheme) {
            temps = await (await db_1.getThemes()).list;
            em.setTitle(`Theme for ${c.name}`)
                .setDescription(temps[Math.floor(Math.random() * temps.length)]);
        }
        else {
            temps = await (await db_1.getTemplatedb()).list;
            em.setTitle(`Template for ${c.name}`)
                .setImage(temps[Math.floor(Math.random() * temps.length)]);
        }
        let msg = await c.send(em);
        msg.react('✅');
        msg.react('❌');
        msg.react('🌀');
        const approveFilter = (reaction, user) => reaction.emoji.name === '✅' && !user.bot;
        const disapproveFilter = (reaction, user) => reaction.emoji.name === '❌' && !user.bot;
        const randomizeFilter = (reaction, user) => reaction.emoji.name === '🌀' && !user.bot;
        const approve = msg.createReactionCollector(approveFilter, { time: 120000 });
        const disapprove = msg.createReactionCollector(disapproveFilter, { time: 120000 });
        const randomize = msg.createReactionCollector(randomizeFilter, { time: 120000 });
        randomize.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            if (m.temp.istheme) {
                temps = await (await db_1.getThemes()).list;
                let eem = new discord_js_1.MessageEmbed()
                    .setTitle(`Theme for ${c.name}`)
                    .setDescription(temps[Math.floor(Math.random() * temps.length)])
                    .setColor("PURPLE");
                msg.edit(eem);
            }
            else {
                temps = await (await db_1.getTemplatedb()).list;
                let eem = new discord_js_1.MessageEmbed()
                    .setTitle(`Template for ${c.name}`)
                    .setImage(temps[Math.floor(Math.random() * temps.length)])
                    .setColor("PURPLE");
                msg.edit(eem);
            }
        });
        disapprove.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            msg.channel.send(new discord_js_1.MessageEmbed()
                .setColor("RED")
                .setTitle("FAILED")
                .setDescription("Please try again"));
            randomize.on("end", async () => { });
            approve.on("end", async () => { });
        });
        approve.on('collect', async () => {
            var _a;
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            if (m.temp.istheme)
                m.temp.link = msg.embeds[0].description;
            else
                m.temp.link = (_a = msg.embeds[0].image) === null || _a === void 0 ? void 0 : _a.url;
            await db_1.insertMatch(m);
            if (m.temp.istheme) {
                await message.mentions.users.array()[0].send("Your theme is " + m.temp.link);
                await message.mentions.users.array()[1].send("Your theme is " + m.temp.link);
            }
            else {
                await message.mentions.users.array()[0].send("Your template is " + m.temp.link);
                await message.mentions.users.array()[1].send("Your template is " + m.temp.link);
            }
        });
    }
};
exports.splitmatch = {
    name: "split",
    description: "",
    group: "match",
    owner: true,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        if (message.mentions.users.array().length < 2)
            return message.reply("Please mention the users");
        if (await db_1.getMatch(message.channel.id))
            return message.reply("On going match.");
        let m = {
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
        };
        if (args[2] === "theme") {
            m.temp.istheme = true;
        }
        let c = await client.channels.fetch(await message.guild.channels.cache.find(x => x.name.toLowerCase() === "mod-bot-spam").id);
        let em = new discord_js_1.MessageEmbed();
        let temps = [];
        if (m.temp.istheme) {
            temps = await (await db_1.getThemes()).list;
            em.setTitle(`Theme for ${c.name}`)
                .setDescription(temps[Math.floor(Math.random() * temps.length)]);
        }
        else {
            temps = await (await db_1.getTemplatedb()).list;
            em.setTitle(`Template for ${c.name}`)
                .setImage(temps[Math.floor(Math.random() * temps.length)]);
        }
        let msg = await c.send(em);
        msg.react('✅');
        msg.react('❌');
        msg.react('🌀');
        const approveFilter = (reaction, user) => reaction.emoji.name === '✅' && !user.bot;
        const disapproveFilter = (reaction, user) => reaction.emoji.name === '❌' && !user.bot;
        const randomizeFilter = (reaction, user) => reaction.emoji.name === '🌀' && !user.bot;
        const approve = msg.createReactionCollector(approveFilter, { time: 120000 });
        const disapprove = msg.createReactionCollector(disapproveFilter, { time: 120000 });
        const randomize = msg.createReactionCollector(randomizeFilter, { time: 120000 });
        randomize.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            if (m.temp.istheme) {
                temps = await (await db_1.getThemes()).list;
                let eem = new discord_js_1.MessageEmbed()
                    .setTitle(`Theme for ${c.name}`)
                    .setDescription(temps[Math.floor(Math.random() * temps.length)])
                    .setColor("PURPLE");
                msg.edit(eem);
            }
            else {
                temps = await (await db_1.getTemplatedb()).list;
                let eem = new discord_js_1.MessageEmbed()
                    .setTitle(`Template for ${c.name}`)
                    .setImage(temps[Math.floor(Math.random() * temps.length)])
                    .setColor("PURPLE");
                msg.edit(eem);
            }
        });
        disapprove.on('collect', async () => {
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            msg.channel.send(new discord_js_1.MessageEmbed()
                .setColor("RED")
                .setTitle("FAILED")
                .setDescription("Please try again"));
            randomize.on("end", async () => { });
            approve.on("end", async () => { });
        });
        approve.on('collect', async () => {
            var _a;
            msg.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            if (m.temp.istheme)
                m.temp.link = msg.embeds[0].description;
            else
                m.temp.link = (_a = msg.embeds[0].image) === null || _a === void 0 ? void 0 : _a.url;
            await db_1.insertMatch(m);
            return await message.channel.send(new discord_js_1.MessageEmbed()
                .setTitle(`Match between ${message.mentions.users.array()[0].username} & ${message.mentions.users.array()[1].username}`)
                .setColor("#d7be26")
                .setDescription(`<@${message.mentions.users.array()[0].id}> and <@${message.mentions.users.array()[1].id}>, your match has been split.\nYou must complete your portion with given round\n Contact admins if you have an issue.`)
                .setTimestamp()).then(async (m) => {
                await m.react('🅰️');
                await m.react('🅱️');
            });
        });
    }
};
exports.startsplit = {
    name: "start-split",
    description: "",
    group: "match",
    owner: true,
    admins: false,
    mods: true,
    async execute(message, client, args, ...rest) {
        var _a;
        try {
            console.log(args);
            if (message.mentions.users.array().length === 0 && args.length === 0)
                return message.reply("Please mention the user.");
            let m = await db_1.getMatch(message.channel.id);
            let id = "";
            if (message.mentions.users.first() === undefined) {
                id = args[0];
            }
            else {
                id = (_a = message.mentions.users.first()) === null || _a === void 0 ? void 0 : _a.id;
            }
            console.log(id);
            let arr = [m.p1, m.p2];
            let e = arr.find(x => x.userid === (id));
            e.donesplit = true;
            e.time = Math.floor(Date.now() / 1000);
            (await client.users.cache.get(e.userid)).send(`This is your ${m.temp.istheme ? "theme: " : "template: "}` +
                m.temp.link, new discord_js_1.MessageEmbed()
                .setColor(await (await db_1.getConfig()).colour)
                .setDescription(`<@${e.userid}> your match has been split.\n` +
                `You have 1 hours to complete your meme\n` +
                `Use \`!submit\` to submit to submit each image seperately`));
            if (m.p1.userid === e.userid)
                m.p1 = e;
            else
                m.p2 = e;
            await db_1.updateMatch(m);
            return (await client.channels.cache.get(m._id)).send(new discord_js_1.MessageEmbed()
                .setColor(await (await db_1.getConfig()).colour)
                .setDescription(`<@${e.userid}> your match has been split.\n` +
                `You have 1 hours to complete your meme\n` +
                `Use \`!submit\` to submit to submit each image seperately`));
        }
        catch (error) {
            console.log(error.message);
        }
    }
};
exports.cancelmatch = {
    name: "cancel-match",
    description: "This will cancel a match.\n" +
        "You can either do this command\n" +
        "in the channel, or in a mod\n" +
        "channel by mentioning the channel.",
    group: "match",
    owner: true,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        if (message.mentions.channels.array().length === 1) {
            if (!await db_1.getMatch(message.mentions.channels.array()[0].id))
                return message.reply("There is no active match here");
            await db_1.deleteMatch(message.mentions.channels.array()[0].id);
            return message.channel.send(new discord_js_1.MessageEmbed()
                .setColor("RED")
                .setTitle(`${message.mentions.channels.array()[0].name}`)
                .setDescription("Match has been canceled"));
        }
        else {
            if (!await db_1.getMatch(message.channel.id))
                return message.reply("There is no active match here");
            await db_1.deleteMatch(message.channel.id);
            return message.channel.send(new discord_js_1.MessageEmbed()
                .setColor("RED")
                .setDescription("Match has been canceled"));
        }
    }
};
exports.endmatch = {
    name: "match-end",
    description: "This will end a match.",
    group: "match",
    owner: true,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let m = await db_1.getMatch(message.channel.id);
        m.votetime = Math.floor(Date.now() / 1000) - 7200;
        await db_1.updateMatch(m);
        return message.reply("Match has ended");
    }
};
