"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualifierResults = exports.qual_stats = exports.reload_qual = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
exports.reload_qual = {
    name: "reload-qual",
    description: "This reload the voting portion of a Qualifier.",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let match = await db_1.getQual(message.channel.id);
        let channel = await client.channels.cache.get(message.channel.id);
        for (let ms of match.messageID) {
            (await channel.messages.fetch(ms)).delete();
        }
        for (let p of match.players) {
            p.votes = [];
        }
        match.votingperiod = false;
        await db_1.updateQual(match);
        return message.reply("Reloading").then(m => {
            m.delete({ timeout: 1500 });
        });
    }
};
exports.qual_stats = {
    name: "qual-stats",
    description: "View Qualifier Statistics except voting.\mJust mention the channel name" + `\`!qual-stats @Channel\``,
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        if (!message.mentions.channels.first())
            return message.reply("Please mention channel");
        else {
            let q = await db_1.getQual(message.mentions.channels.first().id);
            if (!q)
                return message.reply("No qualifier is in that channel.");
            let statsEmbed = new discord_js_1.MessageEmbed()
                .setTitle(`${message.mentions.channels.first().name}`)
                .setColor("LUMINOUS_VIVID_PINK")
                .setFooter("blitzwolfz#9338", "https://cdn.discordapp.com/avatars/239516219445608449/12fa541557ca2635a34a5af5e8c65d26.webp?size=512");
            for (let p of q.players) {
                statsEmbed.addFields({ name: `${(await client.users.cache.get(p.userid)).username} Meme Done:`, value: `${p.memedone ? `Yes` : `No`}`, inline: true }, { name: 'Match Portion Done:', value: `${p.split ? `Yes` : `No`}`, inline: true }, { name: 'Meme Link:', value: `${p.memedone ? `${p.memelink}` : `No meme submitted yet`}`, inline: true }, { name: 'Time left', value: `${p.split ? `${p.memedone ? "Submitted meme" : `${30 - Math.floor(((Date.now() / 1000) - p.time) / 60)} mins left`}` : `${p.split ? `Hasn't started portion` : `Time up`}`}`, inline: true }, { name: '\u200B', value: '\u200B' });
            }
            return await message.channel.send(statsEmbed);
        }
    }
};
async function QualifierResults(channel, client, ids) {
    var _a, _b, _c;
    let msgArr = [];
    for (let i of ids) {
        msgArr.push(await channel.messages.fetch(i));
    }
    let finalResults = [];
    console.log(finalResults);
    for (let msg of msgArr) {
        let embed = msg.embeds[0];
        for (let f of embed.fields) {
            let key = `${(_a = f.value.match(/\d+/g)) === null || _a === void 0 ? void 0 : _a.splice(1)[1]}`.toString();
            if (!finalResults.find(x => x.name === key)) {
                finalResults.push({
                    name: key,
                    value: parseInt((_b = f.value.match(/\d+/g)) === null || _b === void 0 ? void 0 : _b.splice(1)[0])
                });
            }
            else {
                finalResults[finalResults.findIndex(x => x.name === key)].value += parseInt((_c = f.value.match(/\d+/g)) === null || _c === void 0 ? void 0 : _c.splice(1)[0]);
            }
        }
    }
    finalResults.sort(function (a, b) {
        return b.value - a.value;
    });
    console.log(finalResults);
    for (let f of finalResults) {
        f.name = (await client.users.fetch(f.name)).username;
        f.value = `Got ${f.value} in total`;
    }
    console.log(finalResults);
    return {
        title: `Final Results for Group ${channel.name}`,
        description: `Players with highest move on`,
        fields: finalResults,
        color: "#d7be26",
        timestamp: new Date()
    };
}
exports.QualifierResults = QualifierResults;
