"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.grandwinner = exports.winner = exports.matchcard = exports.match_stats = exports.matchlist = exports.forcevote = exports.end_match = exports.reload_match = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
const util_1 = require("../util");
const canvas_1 = __importDefault(require("canvas"));
exports.reload_match = {
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
exports.end_match = {
    name: "end-match",
    description: "This will end the match.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let match = await db_1.getMatch(message.channel.id);
        return message.reply("Ending").then(async (m) => {
            match.votetime += 7200;
            m.delete({ timeout: 1500 });
            await db_1.updateMatch(match);
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
exports.match_stats = {
    name: "match-stats",
    description: "View Match Statistics except voting.\mJust mention the channel name" + `\`!match-stats @Channel\``,
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        if (!message.mentions.channels.first())
            return message.reply("Please mention channel");
        else {
            let m = await db_1.getMatch(message.mentions.channels.first().id);
            if (!m)
                return message.reply("No match is in that channel.");
            let statsEmbed = new discord_js_1.MessageEmbed()
                .setTitle(`${message.mentions.channels.first().name}`)
                .setColor("LUMINOUS_VIVID_PINK")
                .setFooter("blitzwolfz#9338", "https://cdn.discordapp.com/avatars/239516219445608449/12fa541557ca2635a34a5af5e8c65d26.webp?size=512")
                .addFields({ name: `${m.temp.istheme ? `Match theme:` : `Match template`}`, value: `${m.temp.link}` }, { name: `${(await client.users.cache.get(m.p1.userid)).username} Meme Done:`, value: `${m.p1.memedone ? `Yes` : `No`}`, inline: true }, { name: 'Match Portion Done:', value: `${m.p1.donesplit ? `${m.split ? `Yes` : `Not a split match`}` : `No`}`, inline: true }, { name: 'Meme Link:', value: `${m.p1.memedone ? `${m.p1.memelink}` : `No meme submitted yet`}`, inline: true }, { name: 'Time left', value: `${m.p1.donesplit ? `${m.p1.memedone ? "Submitted meme" : `${60 - Math.floor(((Date.now() / 1000) - m.p1.time) / 60)} mins left`}` : `${m.split ? `Hasn't started portion` : `Time up`}`}`, inline: true }, { name: '\u200B', value: '\u200B' }, { name: `${(await client.users.cache.get(m.p2.userid)).username} Meme Done:`, value: `${m.p2.memedone ? `Yes` : `No`}`, inline: true }, { name: 'Match Portion Done:', value: `${m.p2.donesplit ? `${m.split ? `Yes` : `Not a split match`}` : `No`}`, inline: true }, { name: 'Meme Link:', value: `${m.p2.memedone ? `${m.p2.memelink}` : `No meme submitted yet`}`, inline: true }, { name: 'Time left', value: `${m.p2.donesplit ? `${m.p2.memedone ? "Submitted meme" : `${60 - Math.floor(((Date.now() / 1000) - m.p2.time) / 60)} mins left`}` : `${m.split ? `Hasn't started portion` : `Time up`}`}`, inline: true }, { name: '\u200B', value: '\u200B' }, { name: `Voting period:`, value: `${m.votingperiod ? `Yes` : `No`}`, inline: true }, { name: `Voting time:`, value: `${m.votingperiod ? `${await util_1.toHHMMSS(util_1.timeconsts.match.votingtime, m.votetime)}` : "Voting has not started"}`, inline: true });
            return await message.channel.send(statsEmbed);
        }
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
