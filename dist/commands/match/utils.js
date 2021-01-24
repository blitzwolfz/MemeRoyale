"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.grandwinner = exports.winner = exports.matchcard = exports.matchlist = exports.forcevote = exports.reload = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
const util_1 = require("../util");
const canvas_1 = __importDefault(require("canvas"));
exports.reload = {
    name: "reload-match",
    description: "This reload the voting portion of a match.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let match = await db_1.getMatch(message.channel.id);
        let channel = await client.channels.cache.get(message.channel.id);
        for (let ms of match.messageID) {
            (await channel.messages.fetch(ms)).delete();
        }
        match.votingperiod = false;
        match.votetime = (Math.floor(Date.now() / 1000));
        match.p1.voters = [];
        match.p2.voters = [];
        match.p1.votes = 0;
        match.p2.votes = 0;
        await db_1.updateMatch(match);
        return message.reply("Reloading").then(m => {
            m.delete({ timeout: 1500 });
        });
    }
};
exports.forcevote = {
    name: "forcevote-match",
    description: "This will force the voting portion of a match to come.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let match = await db_1.getMatch(message.channel.id);
        match.votingperiod = false;
        match.split = false;
        match.p1.donesplit = false;
        match.p2.donesplit = false;
        await db_1.updateMatch(match);
    }
};
exports.matchlist = {
    name: "matchlist",
    description: "View all the players fighting in brackets",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let list = await db_1.getDoc('config', "matchlist");
        let page = parseInt(args[0]) || 1;
        const m = (await message.channel.send({ embed: await matchlistEmbed(page, client, list.users) }));
        await m.react("⬅");
        await m.react("➡");
        const backwards = m.createReactionCollector(util_1.backwardsFilter, { time: 100000 });
        const forwards = m.createReactionCollector(util_1.forwardsFilter, { time: 100000 });
        backwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({ embed: await matchlistEmbed(--page, client, list.users) });
        });
        forwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({ embed: await matchlistEmbed(++page, client, list.users) });
        });
    }
};
async function matchlistEmbed(page = 1, client, list, ...rest) {
    page = page < 1 ? 1 : page;
    if (page > list.length)
        page = list.length - 1;
    const fields = [];
    let index = (0 + page - 1) * 10;
    for (let i = index; i < index + 10; i++) {
        try {
            fields.push({
                name: `${i + 1}) ${await (await client.users.fetch(list[i])).username}`,
                value: `UserID is: ${list[i]}`
            });
        }
        catch {
            continue;
        }
    }
    return {
        title: `All the users in the bracket. You are on page ${page || 1} of ${Math.floor(list.length / 10) + 1}`,
        fields,
        color: "#d7be26",
        timestamp: new Date()
    };
}
async function matchcard(client, channelid, users) {
    let ch = await client.channels.fetch(channelid);
    const canvas = canvas_1.default.createCanvas(1917, 1168);
    const ctx = canvas.getContext('2d');
    let user1 = (await client.users.fetch(users[0]));
    let user2 = (await client.users.fetch(users[1]));
    const avatar = await canvas_1.default.loadImage(user1.displayAvatarURL({ format: 'png', size: 1024 }));
    const avatar2 = await canvas_1.default.loadImage(user2.displayAvatarURL({ format: 'png', size: 1024 }));
    await ctx.drawImage(avatar, ((canvas.height / 2) - 602.5), 300 - 26, 740, 636);
    await ctx.drawImage(avatar2, ((canvas.width / 2) + 270), 300 - 26, 740, 636);
    await ctx.drawImage(await canvas_1.default.loadImage("newbackground.png"), 0, 0, canvas.width, canvas.height);
    const attachment = new discord_js_1.MessageAttachment(canvas.toBuffer(), 'matchcard.jpg');
    await ch.send(attachment);
}
exports.matchcard = matchcard;
async function winner(client, userid) {
    let user = await client.users.fetch(userid);
    const avatar = await canvas_1.default.loadImage(user.displayAvatarURL({ format: 'png', size: 512 }));
    const canvas = canvas_1.default.createCanvas(1095, 597);
    const ctx = canvas.getContext('2d');
    await ctx.fill("#FF0000");
    await ctx.save();
    await ctx.beginPath();
    await ctx.arc(1095 / 2, 597 / 2 - 70, 225, 0, Math.PI * 2, true);
    await ctx.closePath();
    await ctx.clip();
    await ctx.drawImage(avatar, 300 + 20, 26, 455, 455);
    await ctx.restore();
    await ctx.drawImage(await canvas_1.default.loadImage("winnercardnobackgroundwithname.png"), 0, 0, canvas.width, canvas.height);
    const attachment = new discord_js_1.MessageAttachment(canvas.toBuffer(), 'welcome-image.jpg');
    return attachment;
}
exports.winner = winner;
async function grandwinner(client, userid) {
    let user = await client.users.fetch(userid);
    const avatar = await canvas_1.default.loadImage(user.displayAvatarURL({ format: 'png', size: 512 }));
    const canvas = canvas_1.default.createCanvas(1032, 648);
    const ctx = canvas.getContext('2d');
    ctx.fill("#FF0000");
    await ctx.save();
    await ctx.beginPath();
    await ctx.arc(1032 / 2, 648 / 2 - 70, 225, 0, Math.PI * 2, true);
    await ctx.closePath();
    await ctx.clip();
    await ctx.drawImage(avatar, 220, 15, 550, 550);
    await ctx.restore();
    await ctx.drawImage(await canvas_1.default.loadImage("Tourneywinner.png"), 0, 0, canvas.width, canvas.height);
    const attachment = new discord_js_1.MessageAttachment(canvas.toBuffer(), 'welcome-image.jpg');
    return attachment;
}
exports.grandwinner = grandwinner;
