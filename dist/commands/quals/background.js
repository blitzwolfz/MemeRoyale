"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backgroundQualLoop = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
const util_1 = require("../util");
const util_2 = require("./util");
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
            if ((q.players.filter(p => p.split === true && (p.memedone === true || p.failed === true)).length === q.players.length)
                && q.votingperiod === false) {
                await matchVotingLogic(client, q);
            }
            if (q.votingperiod === true && Math.floor(Date.now() / 1000) - q.votetime >= util_1.timeconsts.qual.votingtime) {
                await matchResults(client, q);
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
        let temp = m.players[j];
        m.players[j] = m.players[i];
        m.players[i] = temp;
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
async function matchResults(client, q) {
    let channel = await client.channels.cache.get(q._id);
    let fields = [];
    if (q.players.filter(p => p.failed === true).length >= 2) {
        for (let x = 0; x < q.players.length; x++) {
            if (q.players[x].failed === false && q.players[x].memedone === true) {
                fields.push({
                    name: `${await (await client.users.fetch(q.players[x].userid)).username} | Meme #${q.players.indexOf(q.players[x]) + 1}`,
                    value: `${`Finished with ${100 / q.players.filter(p => p.memedone === true).length} | Earned: ${(Math.floor(100 / q.players.filter(p => p.memedone === true).length) * 100)}% of the votes\nUserID: ${q.players[x].userid}`}`,
                });
            }
            if (q.players[x].failed === true && q.players[x].memedone === false) {
                fields.push({
                    name: `${await (await client.users.fetch(q.players[x].userid)).username} | Meme #${q.players.indexOf(q.players[x]) + 1}${`-Failed`}`,
                    value: `${`Finished with 0 | Earned: 0% of the votes\nUserID: ${q.players[x].userid}`}`,
                });
            }
        }
        await (await client.channels.cache.get("722291182461386804"))
            .send({
            embed: {
                title: `Votes for ${channel.name} are in!`,
                description: `No votes for this qualifier`,
                fields,
                color: "#d7be26",
                timestamp: new Date()
            }
        });
        channel.send({
            embed: {
                title: `Votes for ${channel.name} are in!`,
                description: `No votes for this qualifier`,
                fields,
                color: "#d7be26",
                timestamp: new Date()
            }
        }).then(async (message) => {
            var _a;
            let t = (_a = channel.topic) === null || _a === void 0 ? void 0 : _a.split(" ");
            if (!t) {
                await channel.setTopic(message.id);
                t = [];
                let string = "";
                for (let p of q.players) {
                    string += `<@${p.userid}>\n`;
                }
                await channel.send(`Portion ${util_1.timeconsts.qual.results - t.concat([message.id]).length} has begun. You have 36h to complete your portion. ${string}`);
            }
            else if ((t.concat([message.id])).length === util_1.timeconsts.qual.results && t !== undefined) {
                t.push(message.id);
                let emm = await util_2.QualifierResults(channel, client, t);
                await channel.send({ embed: emm });
                await (await client.channels.cache.get("722291182461386804"))
                    .send({ embed: emm });
            }
            else if (t.concat([message.id]).length < util_1.timeconsts.qual.results) {
                if (t.includes(message.id) === false) {
                    await channel.setTopic(t.concat([message.id]).join(" "));
                }
                let string = "";
                for (let p of q.players) {
                    string += `<@${p.userid}>\n`;
                }
                await channel.send(`Portion ${util_1.timeconsts.qual.results - t.concat([message.id]).length} has begun. You have 36h to complete your portion. ${string}`);
            }
        });
    }
    else {
        q.players.sort(function (a, b) {
            return ((b.votes.length) - (a.votes.length));
        });
        let totalvotes = 0;
        q.players.forEach(function (v) {
            totalvotes += v.votes.length;
        });
        for (let x = 0; x < q.players.length; x++) {
            if (q.players[x].failed === false && q.players[x].memedone === true) {
                fields.push({
                    name: `${await (await client.users.fetch(q.players[x].userid)).username} | Meme #${q.players.indexOf(q.players[x]) + 1}`,
                    value: `${`Finished with ${q.players[x].votes.length} | Earned: ${Math.round(q.players[x].votes.length / totalvotes * 100)}% of the votes\nUserID: ${q.players[x].userid}`}`,
                });
            }
            if (q.players[x].failed === true && q.players[x].memedone === false) {
                fields.push({
                    name: `${await (await client.users.fetch(q.players[x].userid)).username} | Meme #${q.players.indexOf(q.players[x]) + 1}${`-Failed`}`,
                    value: `${`Finished with 0 | Earned: 0% of the votes\nUserID: ${q.players[x].userid}`}`,
                });
            }
        }
        await (await client.channels.cache.get("722291182461386804"))
            .send({
            embed: {
                title: `Votes for ${channel.name} are in!`,
                description: `${totalvotes} votes for this qualifier`,
                fields,
                color: "#d7be26",
                timestamp: new Date()
            }
        });
        channel.send({
            embed: {
                title: `Votes for ${channel.name} are in!`,
                description: `${totalvotes} votes for this qualifier`,
                fields,
                color: "#d7be26",
                timestamp: new Date()
            }
        }).then(async (message) => {
            var _a;
            let t = (_a = channel.topic) === null || _a === void 0 ? void 0 : _a.split(" ");
            if (!t) {
                await channel.setTopic(message.id);
                t = [];
                let string = "";
                for (let p of q.players) {
                    string += `<@${p.userid}>\n`;
                }
                await channel.send(`Portion ${util_1.timeconsts.qual.results - t.concat([message.id]).length} has begun. You have 36h to complete your portion. ${string}`);
            }
            else if ((t.concat([message.id])).length === util_1.timeconsts.qual.results && t !== undefined) {
                t.push(message.id);
                let emm = await util_2.QualifierResults(channel, client, t);
                await channel.send({ embed: emm });
                await (await client.channels.cache.get("722291182461386804"))
                    .send({ embed: emm });
            }
            else if (t.concat([message.id]).length < util_1.timeconsts.qual.results) {
                if (t.includes(message.id) === false) {
                    await channel.setTopic(t.concat([message.id]).join(" "));
                }
                let string = "";
                for (let p of q.players) {
                    string += `<@${p.userid}>\n`;
                }
                await channel.send(`Portion ${util_1.timeconsts.qual.results - t.concat([message.id]).length} has begun. You have 36h to complete your portion. ${string}`);
            }
        });
    }
    await db_1.deleteQual(q._id);
}
