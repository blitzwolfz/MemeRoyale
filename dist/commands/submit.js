"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qualsubmit = exports.submit = void 0;
const db_1 = require("../db");
exports.submit = {
    name: "submit",
    description: "",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    async execute(message, client, args) {
        if (message.channel.type !== "dm") {
            return message.reply("You didn't not submit this in the DM with the bot.\nPlease delete and try again.");
        }
        if (message.attachments.array()[0].url.includes("imgur")) {
            return message.reply("You can't submit imgur links");
        }
        else if (message.attachments.size > 1) {
            return message.reply("You can't submit more than one image");
        }
        else if (message.attachments.size <= 0) {
            return message.reply("Your image was not submitted properly. Contact a mod");
        }
        ;
        let m = (await (await db_1.getAllMatches())).find(x => (x.p1.userid === message.author.id || x.p2.userid === message.author.id));
        let arr = [m.p1, m.p2];
        let e = arr.find(x => x.userid === message.author.id);
        if (e.donesplit === false)
            return message.reply("You can't submit until your portion starts");
        e.memelink = message.attachments.array()[0].url;
        e.memedone = true;
        e.donesplit = true;
        await client.channels.cache.get("793242781892083742").send({
            embed: {
                description: `<@${message.author.id}>/${message.author.tag} has submitted their meme\nChannel: <#${m._id}>`,
                color: "#d7be26",
                image: {
                    url: message.attachments.array()[0].url,
                },
                timestamp: new Date()
            }
        });
        if (m.p1.userid === e.userid)
            m.p1 = e;
        else
            m.p2 = e;
        if (m.p1.donesplit && m.p1.memedone && m.p2.donesplit && m.p2.memedone && m.split) {
            m.split = false;
            m.p1.time = Math.floor(Date.now() / 1000) - 3200;
            m.p2.time = Math.floor(Date.now() / 1000) - 3200;
        }
        await db_1.updateMatch(m);
        return await message.channel.send("Your meme has been attached!");
    }
};
exports.qualsubmit = {
    name: "qualsubmit",
    description: "",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    async execute(message, client, args) {
        if (message.content.includes("imgur")) {
            return message.reply("You can't submit imgur links");
        }
        if (message.attachments.size > 1) {
            return message.reply("You can't submit more than one image");
        }
        else if (message.attachments.size <= 0) {
            return message.reply("Your image was not submitted properly. Contact a mod");
        }
        else if (message.channel.type !== "dm") {
            return message.reply("You didn't not submit this in the DM with the bot.\nPlease delete and try again.");
        }
        else if (message.attachments.array()[0].url.toString().includes("mp4"))
            return message.reply("Video submissions aren't allowed");
        else {
            let match = await (await db_1.getAllQuals()).find(x => x.players.find(y => y.userid === message.author.id && y.memedone === false));
            let index = match.players.findIndex(x => x.userid === message.author.id);
            let u = match.players[index];
            if (u.split === false)
                return message.reply("Can't submit when you haven't started your portion");
            u.split = true;
            u.memedone = true;
            u.memelink = message.attachments.array()[0].url;
            await client.channels.cache.get("722616679280148504").send({
                embed: {
                    description: `<@${message.author.id}> has submitted their meme\nChannel: <#${match._id}>`,
                    color: "#d7be26",
                    timestamp: new Date()
                }
            });
            await client.channels.cache.get("793242781892083742").send({
                embed: {
                    description: `<@${message.author.id}>  ${message.author.tag} has submitted their meme\nChannel: <#${match._id}>`,
                    color: "#d7be26",
                    image: {
                        url: message.attachments.array()[0].url,
                    },
                    timestamp: new Date()
                }
            });
            match.players[index] = u;
            await db_1.updateQual(match);
            return message.reply("Your meme for your qualifier has been attached.");
        }
    }
};
