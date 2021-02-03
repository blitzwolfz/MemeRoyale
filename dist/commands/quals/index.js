"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endqual = exports.cancelqual = exports.startsplitqual = exports.splitqual = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
exports.splitqual = {
    name: "split-qual",
    description: "",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        if (message.mentions.users.array().length < 3 || message.mentions.users.array().length > 6)
            return message.reply("Please mention the users");
        if (await db_1.getQual(message.channel.id))
            return message.reply("On going match.");
        let q = {
            _id: message.channel.id,
            messageID: [],
            players: [],
            temp: {
                istheme: true,
                link: ""
            },
            votes: [],
            votingperiod: false,
            votetime: 0
        };
        for (let u of message.mentions.users.array()) {
            q.players.push({
                userid: u.id,
                memedone: false,
                memelink: "",
                time: 0,
                split: false,
                failed: false
            });
            q.votes.push([]);
        }
        if (args.includes("template")) {
            q.temp.istheme = false;
        }
        let c = await client.channels.fetch(await message.guild.channels.cache.find(x => x.name.toLowerCase() === "mod-bot-spam").id);
        let em = new discord_js_1.MessageEmbed();
        let temps = [];
        if (q.temp.istheme) {
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
            if (q.temp.istheme) {
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
            if (q.temp.istheme)
                q.temp.link = msg.embeds[0].description;
            else
                q.temp.link = (_a = msg.embeds[0].image) === null || _a === void 0 ? void 0 : _a.url;
            await db_1.insertQual(q);
            return await message.channel.send(new discord_js_1.MessageEmbed()
                .setTitle(`Qualifier Match`)
                .setColor("#d7be26")
                .setDescription(`Your qualifier has been split.\nYou must complete your portion within given round\n Contact admins if you have an issue.`)
                .setTimestamp()).then(async (m) => {
                let emojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'];
                for (let i = 0; i < q.players.length; i++) {
                    m.react(emojis[i]);
                }
            });
        });
    }
};
exports.startsplitqual = {
    name: "start-qual",
    description: "",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        var _a;
        try {
            if (message.mentions.users.array().length === 0 && args.length === 0)
                return message.reply("Please mention the user.");
            let q = await db_1.getQual(message.channel.id);
            let id = "";
            if (message.mentions.users.first() === undefined) {
                id = args[0];
            }
            else {
                id = (_a = message.mentions.users.first()) === null || _a === void 0 ? void 0 : _a.id;
            }
            let arr = q.players;
            let e = arr.find(x => x.userid === id);
            (await client.users.cache.get(e.userid)).send(`This is your ${q.temp.istheme ? "theme: " : "template: "}` +
                q.temp.link, new discord_js_1.MessageEmbed()
                .setColor(await (await db_1.getConfig()).colour)
                .setDescription(`<@${e.userid}> your match has been split.\n` +
                `You have 30 mins to complete your meme\n` +
                `Use \`!qualsubmit\` to submit to submit each image seperately`));
            e.split = true;
            e.time = Math.floor(Date.now() / 1000);
            arr[arr.findIndex(x => x.userid === id)] = e;
            q.players = arr;
            await db_1.updateQual(q);
            return (await client.channels.cache.get(q._id)).send(new discord_js_1.MessageEmbed()
                .setColor(await (await db_1.getConfig()).colour)
                .setDescription(`<@${e.userid}> your match has been split.\n` +
                `You have 30 mins to complete your meme\n` +
                `Use \`!qualsubmit\` to submit to submit each image seperately`));
        }
        catch (error) {
            console.log(error.message);
        }
    }
};
exports.cancelqual = {
    name: "cancel-qual",
    description: "This will cancel a qual.\n" +
        "You can either do this command\n" +
        "in the channel, or in a mod\n" +
        "channel by mentioning the channel.",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        if (message.mentions.channels.array().length === 1) {
            if (!await db_1.getQual(message.mentions.channels.array()[0].id))
                return message.reply("There is no active match here");
            await db_1.deleteQual(message.mentions.channels.array()[0].id);
            return message.channel.send(new discord_js_1.MessageEmbed()
                .setColor("RED")
                .setTitle(`${message.mentions.channels.array()[0].name}`)
                .setDescription("Match has been canceled"));
        }
        else {
            if (!await db_1.getQual(message.channel.id))
                return message.reply("There is no active match here");
            await db_1.deleteQual(message.channel.id);
            return message.channel.send(new discord_js_1.MessageEmbed()
                .setColor("RED")
                .setDescription("Match has been canceled"));
        }
    }
};
exports.endqual = {
    name: "end-qual",
    description: "This will end a qual.",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let m = await db_1.getQual(message.channel.id);
        m.votetime = Math.floor(Date.now() / 1000) - 7200;
        await db_1.updateQual(m);
        return message.reply("Qualifier has ended").then(async (m) => {
            m.delete({ timeout: 1500 });
        });
    }
};
