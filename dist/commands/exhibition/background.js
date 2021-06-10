"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backgroundExhibitionLoop = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
const utils_1 = require("../match/utils");
const util_1 = require("../util");
async function backgroundExhibitionLoop(client) {
    var _a, _b, _c, _d;
    let matches = await db_1.getAllMatches();
    var ex = await db_1.getExhibition();
    for (let m of matches) {
        try {
            if (m.exhibition === false)
                continue;
            if (m.p1.donesplit === true && m.p1.memedone === false && (Math.floor(Date.now()) / 1000 - m.p1.time > 1800) ||
                m.p2.donesplit === true && m.p2.memedone === false && (Math.floor(Date.now()) / 1000 - m.p2.time > 1800)) {
                let winner = (m.p1.memedone ? `${(_a = client.users.cache.get(m.p1.userid)) === null || _a === void 0 ? void 0 : _a.username}` : `${(_b = client.users.cache.get(m.p2.userid)) === null || _b === void 0 ? void 0 : _b.username}`);
                (await client.channels.cache.get(m._id)).send(new discord_js_1.MessageEmbed()
                    .setTitle(`${(_c = client.users.cache.get(m.p1.userid)) === null || _c === void 0 ? void 0 : _c.username}-vs-${(_d = client.users.cache.get(m.p1.userid)) === null || _d === void 0 ? void 0 : _d.username}`)
                    .setDescription(`${winner} has won!`)
                    .setColor(await (await db_1.getConfig()).colour));
                await db_1.deleteMatch(m._id);
            }
            if (m.p1.donesplit && m.p1.memedone
                && m.p2.memedone && m.p2.donesplit
                && m.split === false && m.votingperiod === false) {
                await exhibitionVotingLogic(client, m);
            }
            if (m.votingperiod === true && (Math.floor(Date.now() / 1000) - m.votetime > 7200)
                || m.votingperiod === true && (m.p1.votes >= 5 || m.p2.votes >= 5)) {
                await exhibitionResults(client, m);
            }
        }
        catch (error) {
            console.log(error.message);
            console.log(error.stack);
        }
    }
    let i = ex.activematches.length;
    while (i--) {
        let ch = await client.channels.cache.get(ex.activematches[i]);
        let guild = await client.guilds.cache.get((await client.channels.cache.get(ch.id)).guild.id);
        if (!(guild === null || guild === void 0 ? void 0 : guild.channels.cache.has(ex.activematches[i]))) {
            ex.activematches.splice(i, 1);
        }
        if (Math.floor(Date.now() / 1000) - Math.floor(ch.createdTimestamp / 1000) > 4500) {
            await ch.delete();
            ex.activematches.splice(i, 1);
        }
        if (!ch || ch === undefined) {
            ex.activematches.splice(i, 1);
        }
    }
    for (let i = 0; i < ex.cooldowns.length; i++) {
        let us = await client.users.fetch(ex.cooldowns[i].user);
        if (!ex.cooldowns[i]) {
            continue;
        }
        if (Math.floor(Date.now() / 1000) - Math.floor(ex.cooldowns[i].time) >= 300) {
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
    let channel = client.channels.cache.get(m._id);
    let guild = await client.guilds.cache.get((await client.channels.cache.get(m._id)).guild.id);
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
        .setDescription(`Vote for Meme 1 by reacting with 1️⃣\nVote for Meme 2 by reacting with 2️⃣\nYou have **15 mins or first person to 5 votes** to vote`)
        .setColor(await (await db_1.getConfig()).colour)).then(async (msg) => {
        msg.react('1️⃣');
        msg.react('2️⃣');
        m.messageID.push(msg.id);
    });
    let id = guild.roles.cache.find(x => x.name.toLowerCase().includes("duel"));
    if (id)
        await channel.send(`${id}`);
    m.votingperiod = true;
    m.votetime = ((Math.floor(Date.now() / 1000)) - 6300);
    return await db_1.updateMatch(m);
}
async function exhibitionResults(client, m) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9;
    let channel = await client.channels.cache.get(m._id);
    let guild = await client.guilds.cache.get((await client.channels.cache.get(m._id)).guild.id);
    let d1 = await db_1.getDuelProfile(m.p1.userid, guild.id);
    let d2 = await db_1.getDuelProfile(m.p2.userid, guild.id);
    let u1 = await client.users.fetch(d1._id);
    let u2 = await client.users.fetch(d2._id);
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
    }
    if (m.p1.votes > m.p2.votes) {
        d1.wins += 1;
        d1.votetally += m.p1.votes;
        d1.points += (25 + (m.p1.votes * 5));
        d2.loss += 1;
        d2.votetally += m.p2.votes;
        d2.points += (m.p2.votes * 5);
        channel.send(new discord_js_1.MessageEmbed()
            .setTitle(`${(_g = client.users.cache.get(m.p1.userid)) === null || _g === void 0 ? void 0 : _g.username} has won!`)
            .setDescription(`${(_h = client.users.cache.get(m.p1.userid)) === null || _h === void 0 ? void 0 : _h.username} beat ${(_j = client.users.cache.get(m.p2.userid)) === null || _j === void 0 ? void 0 : _j.username}\n` +
            `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
            .setColor(await (await db_1.getConfig()).colour));
        u1.send(new discord_js_1.MessageEmbed()
            .setTitle(`${(_k = client.users.cache.get(m.p1.userid)) === null || _k === void 0 ? void 0 : _k.username} has won!`)
            .setDescription(`${(_l = client.users.cache.get(m.p1.userid)) === null || _l === void 0 ? void 0 : _l.username} beat ${(_m = client.users.cache.get(m.p2.userid)) === null || _m === void 0 ? void 0 : _m.username}\n` +
            `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
            .setColor(await (await db_1.getConfig()).colour));
        u2.send(new discord_js_1.MessageEmbed()
            .setTitle(`${(_o = client.users.cache.get(m.p1.userid)) === null || _o === void 0 ? void 0 : _o.username} has won!`)
            .setDescription(`${(_p = client.users.cache.get(m.p1.userid)) === null || _p === void 0 ? void 0 : _p.username} beat ${(_q = client.users.cache.get(m.p2.userid)) === null || _q === void 0 ? void 0 : _q.username}\n` +
            `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
            .setColor(await (await db_1.getConfig()).colour));
        channel.send(await utils_1.winner(client, m.p1.userid));
        u1.send(await utils_1.winner(client, m.p1.userid));
        try {
            await client.channels.cache.get((await guild.channels.cache.find(x => x.name.toLowerCase() === "winning-duel-memes").id)).send(new discord_js_1.MessageEmbed()
                .setColor(await (await db_1.getConfig()).colour)
                .setImage(m.p1.memelink)
                .setDescription(`${(_r = client.users.cache.get(m.p1.userid)) === null || _r === void 0 ? void 0 : _r.username} beat ${(_s = client.users.cache.get(m.p2.userid)) === null || _s === void 0 ? void 0 : _s.username}\n` +
                `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
                .setFooter(util_1.dateBuilder()));
        }
        catch (error) {
            console.log(error.message);
            console.log("No winning duel channel");
        }
    }
    else if (m.p1.votes < m.p2.votes) {
        d1.loss += 1;
        d1.votetally += m.p1.votes;
        d1.points += (m.p1.votes * 5);
        d2.wins += 1;
        d2.votetally += m.p2.votes;
        d2.points += (25 + (m.p2.votes * 5));
        channel.send(new discord_js_1.MessageEmbed()
            .setTitle(`${(_t = client.users.cache.get(m.p2.userid)) === null || _t === void 0 ? void 0 : _t.username} has won!`)
            .setDescription(`${(_u = client.users.cache.get(m.p2.userid)) === null || _u === void 0 ? void 0 : _u.username} beat ${(_v = client.users.cache.get(m.p1.userid)) === null || _v === void 0 ? void 0 : _v.username}\n` +
            `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
            .setColor(await (await db_1.getConfig()).colour));
        u1.send(new discord_js_1.MessageEmbed()
            .setTitle(`${(_w = client.users.cache.get(m.p2.userid)) === null || _w === void 0 ? void 0 : _w.username} has won!`)
            .setDescription(`${(_x = client.users.cache.get(m.p2.userid)) === null || _x === void 0 ? void 0 : _x.username} beat ${(_y = client.users.cache.get(m.p1.userid)) === null || _y === void 0 ? void 0 : _y.username}\n` +
            `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
            .setColor(await (await db_1.getConfig()).colour));
        u2.send(new discord_js_1.MessageEmbed()
            .setTitle(`${(_z = client.users.cache.get(m.p2.userid)) === null || _z === void 0 ? void 0 : _z.username} has won!`)
            .setDescription(`${(_0 = client.users.cache.get(m.p2.userid)) === null || _0 === void 0 ? void 0 : _0.username} beat ${(_1 = client.users.cache.get(m.p1.userid)) === null || _1 === void 0 ? void 0 : _1.username}\n` +
            `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
            .setColor(await (await db_1.getConfig()).colour));
        channel.send(await utils_1.winner(client, m.p2.userid));
        u2.send(await utils_1.winner(client, m.p2.userid));
        try {
            await client.channels.cache.get((await guild.channels.cache.find(x => x.name.toLowerCase() === "winning-duel-memes").id)).send(new discord_js_1.MessageEmbed()
                .setColor(await (await db_1.getConfig()).colour)
                .setImage(m.p2.memelink)
                .setDescription(`${(_2 = client.users.cache.get(m.p2.userid)) === null || _2 === void 0 ? void 0 : _2.username} beat ${(_3 = client.users.cache.get(m.p1.userid)) === null || _3 === void 0 ? void 0 : _3.username}\n` +
                `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
                .setFooter(util_1.dateBuilder()));
        }
        catch (error) {
            console.log(error.message);
            console.log("No winning duel channel");
        }
    }
    else if (m.p1.votes === m.p2.votes) {
        d1.votetally += m.p1.votes;
        d2.votetally += m.p2.votes;
        d1.points += (m.p1.votes * 5);
        d2.points += (m.p2.votes * 5);
        channel.send(new discord_js_1.MessageEmbed()
            .setTitle(`Both users come to a draw`)
            .setDescription(`${(_4 = client.users.cache.get(m.p2.userid)) === null || _4 === void 0 ? void 0 : _4.username} and ${(_5 = client.users.cache.get(m.p1.userid)) === null || _5 === void 0 ? void 0 : _5.username}\n` +
            `both got a score of ${m.p2.votes}`)
            .setColor(await (await db_1.getConfig()).colour));
        u1.send(new discord_js_1.MessageEmbed()
            .setTitle(`Both users come to a draw`)
            .setDescription(`${(_6 = client.users.cache.get(m.p2.userid)) === null || _6 === void 0 ? void 0 : _6.username} and ${(_7 = client.users.cache.get(m.p1.userid)) === null || _7 === void 0 ? void 0 : _7.username}\n` +
            `both got a score of ${m.p2.votes}`)
            .setColor(await (await db_1.getConfig()).colour));
        u2.send(new discord_js_1.MessageEmbed()
            .setTitle(`Both users come to a draw`)
            .setDescription(`${(_8 = client.users.cache.get(m.p2.userid)) === null || _8 === void 0 ? void 0 : _8.username} and ${(_9 = client.users.cache.get(m.p1.userid)) === null || _9 === void 0 ? void 0 : _9.username}\n` +
            `both got a score of ${m.p2.votes}`)
            .setColor(await (await db_1.getConfig()).colour));
    }
    if (guild.name.toLowerCase() !== "MemeRoyale".toLowerCase()) {
        let e = new discord_js_1.MessageEmbed()
            .setTitle("Interested in more?")
            .setDescription("Come join us in the " +
            "in the Meme Royale Server.\n" +
            "You can play more duels, and participate in our tournament\n" +
            "with a chance of winning our Cash Prizes.\nClick on the link in the title to join.")
            .setURL("https://discord.gg/GK3R5Vt3tz")
            .setColor(await (await db_1.getConfig()).colour);
        await channel.send(e);
    }
    await db_1.updateDuelProfile(d1._id, d1, guild.id);
    await db_1.updateDuelProfile(d2._id, d2, guild.id);
    return await db_1.deleteMatch(m._id);
}
