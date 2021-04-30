"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backgroundExhibitionLoop = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
const utils_1 = require("../match/utils");
const util_1 = require("../util");
async function backgroundExhibitionLoop(client) {
    var _a, _b, _c, _d, _e;
    let matches = await db_1.getAllMatches();
    var ex = await db_1.getExhibition();
    let guild = await client.guilds.cache.get("719406444109103117");
    for (let m of matches) {
        try {
            if (m.exhibition === false)
                continue;
            if (m.p1.donesplit === true && m.p1.memedone === false && (Math.floor(Date.now()) / 1000 - m.p1.time > 1800) ||
                m.p2.donesplit === true && m.p2.memedone === false && (Math.floor(Date.now()) / 1000 - m.p2.time > 1800)) {
                (await client.channels.cache.get(m._id)).send(new discord_js_1.MessageEmbed()
                    .setTitle(`${(_a = client.users.cache.get(m.p1.userid)) === null || _a === void 0 ? void 0 : _a.username}-vs-${(_b = client.users.cache.get(m.p1.userid)) === null || _b === void 0 ? void 0 : _b.username}`)
                    .setDescription(`${m.p1.memedone ? `${(_c = client.users.cache.get(m.p1.userid)) === null || _c === void 0 ? void 0 : _c.username}` : `${(_d = client.users.cache.get(m.p2.userid)) === null || _d === void 0 ? void 0 : _d.username}`} has won!`)
                    .setColor(await (await db_1.getConfig()).colour));
                await db_1.deleteMatch(m._id);
            }
            if (m.p1.donesplit && m.p1.memedone
                && m.p2.memedone && m.p2.donesplit
                && m.split === false && m.votingperiod === false) {
                await exhibitionVotingLogic(client, m);
            }
            if (m.votingperiod === true && (Math.floor(Date.now() / 1000) - m.votetime > 7200)) {
                await exhibitionResults(client, m);
            }
        }
        catch (error) {
            console.log(error.message);
        }
    }
    for (let ii = 0; ii < ex.activematches.length; ii++) {
        if (!(guild === null || guild === void 0 ? void 0 : guild.channels.cache.has(ex.activematches[ii]))) {
            ex.activematches.splice(ii, 1);
            ii++;
            continue;
        }
        let ch = await ((_e = client.channels) === null || _e === void 0 ? void 0 : _e.fetch(ex.activematches[ii]));
        if (Math.floor(Date.now() / 1000) - Math.floor(ch.createdTimestamp / 1000) > 7200) {
            await ch.delete();
            ex.activematches.splice(ii, 1);
            ii++;
        }
        if (!ch || ch === undefined) {
            ex.activematches.splice(ii, 1);
            ii++;
        }
    }
    for (let i = 0; i < ex.cooldowns.length; i++) {
        let us = await client.users.fetch(ex.cooldowns[i].user);
        if (!ex.cooldowns[i]) {
            continue;
        }
        if (Math.floor(Date.now() / 1000) - Math.floor(ex.cooldowns[i].time) >= 3600) {
            try {
                await us.send("You can start another exhibition match!");
            }
            catch {
                console.log("Could not dm user that cooldown is over");
            }
            ex.cooldowns.splice(i, 1);
            i++;
        }
    }
    await db_1.updateExhibition(ex);
}
exports.backgroundExhibitionLoop = backgroundExhibitionLoop;
async function exhibitionVotingLogic(client, m) {
    let channel = await client.channels.cache.get(m._id);
    if (Math.floor(Math.random() * (5 - 1) + 1) % 2 === 1) {
        let temp = m.p1;
        m.p1 = m.p2;
        m.p2 = temp;
    }
    if (m.temp.istheme) {
        channel.send(new discord_js_1.MessageEmbed()
            .setTitle("Theme")
            .setDescription(`The theme is ${m.temp.link}`)
            .setColor("GREEN")).then(async (msg) => {
            m.messageID.push(msg.id);
        });
    }
    else {
        channel.send(new discord_js_1.MessageEmbed()
            .setTitle("Template")
            .setImage(m.temp.link)
            .setColor("GREEN")).then(async (msg) => {
            m.messageID.push(msg.id);
        });
    }
    channel.send(new discord_js_1.MessageEmbed()
        .setTitle("Player 1's Meme")
        .setImage(m.p1.memelink)
        .setColor(await (await db_1.getConfig()).colour)).then(async (msg) => {
        m.messageID.push(msg.id);
    });
    channel.send(new discord_js_1.MessageEmbed()
        .setTitle("Player 2's Meme")
        .setImage(m.p2.memelink)
        .setColor(await (await db_1.getConfig()).colour)).then(async (msg) => {
        m.messageID.push(msg.id);
    });
    await channel.send(new discord_js_1.MessageEmbed()
        .setTitle("Voting time")
        .setDescription(`Vote for Meme 1 by reacting with 1️⃣\nVote for Meme 2 by reacting with 2️⃣\nYou have **30 mins** to vote`)
        .setColor(await (await db_1.getConfig()).colour)).then(async (msg) => {
        msg.react('1️⃣');
        msg.react('2️⃣');
        m.messageID.push(msg.id);
    });
    m.votingperiod = true;
    m.votetime = ((Math.floor(Date.now() / 1000)) - 5400);
    await db_1.updateMatch(m);
}
async function exhibitionResults(client, m) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    let channel = await client.channels.cache.get(m._id);
    if (m.p1.memedone === true && m.p2.memedone === false || m.p1.memedone === false && m.p2.memedone === true) {
        if (m.p1.memedone) {
            channel.send(new discord_js_1.MessageEmbed()
                .setTitle(`${(_a = client.users.cache.get(m.p1.userid)) === null || _a === void 0 ? void 0 : _a.username} has won!`)
                .setDescription(`${(_b = client.users.cache.get(m.p1.userid)) === null || _b === void 0 ? void 0 : _b.username} beat ${(_c = client.users.cache.get(m.p2.userid)) === null || _c === void 0 ? void 0 : _c.username}`)
                .setColor(await (await db_1.getConfig()).colour));
        }
        if (m.p2.memedone) {
            channel.send(new discord_js_1.MessageEmbed()
                .setTitle(`${(_d = client.users.cache.get(m.p2.userid)) === null || _d === void 0 ? void 0 : _d.username} has won!`)
                .setDescription(`${(_e = client.users.cache.get(m.p2.userid)) === null || _e === void 0 ? void 0 : _e.username} beat ${(_f = client.users.cache.get(m.p1.userid)) === null || _f === void 0 ? void 0 : _f.username}`)
                .setColor(await (await db_1.getConfig()).colour));
        }
        return;
    }
    if (m.p1.votes > m.p2.votes) {
        channel.send(new discord_js_1.MessageEmbed()
            .setTitle(`${(_g = client.users.cache.get(m.p1.userid)) === null || _g === void 0 ? void 0 : _g.username} has won!`)
            .setDescription(`${(_h = client.users.cache.get(m.p1.userid)) === null || _h === void 0 ? void 0 : _h.username} beat ${(_j = client.users.cache.get(m.p1.userid)) === null || _j === void 0 ? void 0 : _j.username}\n` +
            `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
            .setColor(await (await db_1.getConfig()).colour));
        channel.send(await utils_1.winner(client, m.p1.userid));
        await client.channels.cache.get((await client.guilds.cache.find(x => x.name.toLowerCase() === "MemeRoyale".toLowerCase())
            .channels.cache.find(x => x.name === "winning-duel-memes").id)).send(new discord_js_1.MessageEmbed()
            .setColor("#d7be26")
            .setImage(m.p1.memelink)
            .setDescription(`${(_k = client.users.cache.get(m.p1.userid)) === null || _k === void 0 ? void 0 : _k.username} beat ${(_l = client.users.cache.get(m.p1.userid)) === null || _l === void 0 ? void 0 : _l.username}\n` +
            `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
            .setFooter(util_1.dateBuilder()));
    }
    else if (m.p1.votes < m.p2.votes) {
        channel.send(new discord_js_1.MessageEmbed()
            .setTitle(`${(_m = client.users.cache.get(m.p2.userid)) === null || _m === void 0 ? void 0 : _m.username} has won!`)
            .setDescription(`${(_o = client.users.cache.get(m.p2.userid)) === null || _o === void 0 ? void 0 : _o.username} beat ${(_p = client.users.cache.get(m.p1.userid)) === null || _p === void 0 ? void 0 : _p.username}\n` +
            `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
            .setColor(await (await db_1.getConfig()).colour));
        channel.send(await utils_1.winner(client, m.p2.userid));
        await client.channels.cache.get((await client.guilds.cache.find(x => x.name.toLowerCase() === "MemeRoyale".toLowerCase())
            .channels.cache.find(x => x.name === "winning-duel-memes").id)).send(new discord_js_1.MessageEmbed()
            .setColor("#d7be26")
            .setImage(m.p2.memelink)
            .setDescription(`${(_q = client.users.cache.get(m.p2.userid)) === null || _q === void 0 ? void 0 : _q.username} beat ${(_r = client.users.cache.get(m.p1.userid)) === null || _r === void 0 ? void 0 : _r.username}\n` +
            `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
            .setFooter(util_1.dateBuilder()));
    }
    else if (m.p1.votes === m.p2.votes) {
        channel.send(new discord_js_1.MessageEmbed()
            .setTitle(`Both users come to a draw`)
            .setDescription(`${(_s = client.users.cache.get(m.p2.userid)) === null || _s === void 0 ? void 0 : _s.username} and ${(_t = client.users.cache.get(m.p1.userid)) === null || _t === void 0 ? void 0 : _t.username}\n` +
            `both got a score of ${m.p2.votes}`)
            .setColor(await (await db_1.getConfig()).colour));
    }
    return await db_1.deleteMatch(m._id);
}
