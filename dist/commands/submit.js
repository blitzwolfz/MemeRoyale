"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submit = void 0;
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
        if (m.p1.donesplit && m.p2.donesplit && m.split) {
            m.split = false;
            m.p1.time = Math.floor(Date.now() / 1000) - 3200;
            m.p2.time = Math.floor(Date.now() / 1000) - 3200;
        }
        await db_1.updateMatch(m);
        return await message.channel.send("Your meme has been attached!");
    }
};
