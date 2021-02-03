"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backgroundQualLoop = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
const util_1 = require("../util");
async function backgroundQualLoop(client) {
    let quals = await db_1.getAllQuals();
    for (let q of quals) {
        try {
            if (q.players.find(x => Math.floor(Date.now() / 1000) - x.time >= 1800 && x.split === true && x.failed === false && x.memedone === false)) {
                q.players.forEach(async (x) => {
                    if (Math.floor(Date.now() / 1000) - x.time >= 1800 && x.split === true && x.failed === false && x.memedone === false) {
                        await (await client.users.fetch(x.userid)).send("You failed to send your meme on time");
                        x.split = true;
                        x.failed = true;
                        q.players[q.players.findIndex(y => y.userid === x.userid)] = x;
                    }
                });
                await db_1.updateQual(q);
                console.log("Updated.");
            }
            if ((q.players.filter(p => p.split === true).length === q.players.length)
                && q.votingperiod === false) {
                await matchVotingLogic(client, q);
            }
        }
        catch (error) {
            console.log(error.message);
        }
    }
}
exports.backgroundQualLoop = backgroundQualLoop;
async function matchVotingLogic(client, m) {
    let channel = await client.channels.cache.get(m._id);
    for (var i = 0; i < m.players.length - 1; i++) {
        var j = i + Math.floor(Math.random() * (m.players.length - i));
        var temp = m.players[j];
        var temp2 = m.players[j];
        m.players[j] = m.players[i];
        m.players[i] = temp;
        m.players[j] = m.players[i];
        m.players[i] = temp2;
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
    for (let p of m.players) {
        if (p.failed === false) {
            channel.send(new discord_js_1.MessageEmbed()
                .setTitle(`Player ${m.players.findIndex(e => e.userid === p.userid) + 1}`)
                .setImage(p.memelink)
                .setColor(await (await db_1.getConfig()).colour)).then(async (msg) => {
                m.messageID.push(msg.id);
            });
        }
    }
    await channel.send(new discord_js_1.MessageEmbed()
        .setTitle("Voting time")
        .setDescription(`Vote for the best two memes\nVote by reacting with corresponding emote\nYou have **2 hours** to vote`)
        .setColor(await (await db_1.getConfig()).colour)).then(async (msg) => {
        m.messageID.push(msg.id);
        for (let p of m.players) {
            if (p.failed === false && p.memedone === true) {
                msg.react(util_1.emojis[m.players.findIndex(e => e.userid === p.userid)]);
            }
        }
        await msg.react(util_1.emojis[6]);
    });
    m.votingperiod = true;
    m.votetime = (Math.floor(Date.now() / 1000));
    await db_1.updateQual(m);
}
