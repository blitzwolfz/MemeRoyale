"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channeldelete = exports.matchbracket = exports.qualchannelcreate = exports.matchchannelcreate = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
const utils_1 = require("../match/utils");
const challonge = require("challonge-js");
exports.matchchannelcreate = {
    name: "channelcreate",
    description: "!channelcreate <round number> <time in hours to complete>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        if (!args)
            return message.reply("Please input round number and how long the round is!");
        else {
            let names = [];
            let match = await db_1.getDoc("config", "matchlist");
            for (let i = 0; i < match.users.length; i++) {
                try {
                    let name = (await (await client.users.fetch(match.users[i])).username);
                    names.push({
                        str: name,
                        id: (match.users[i])
                    });
                }
                catch {
                    message.channel.send(`<@${match.users[i]}>/${match.users[i]} is fucked`);
                }
            }
            const cclient = challonge.createClient({
                apiKey: process.env.CHALLONGE
            });
            let matchlist = await db_1.getDoc("config", "matchlist");
            await cclient.matches.index({
                id: matchlist.url,
                callback: async (err, data) => {
                    if (err)
                        console.log(err);
                    for (let d of data) {
                        if (d.match.round === parseInt(args[0])) {
                            if (d.match.player1Id === null || d.match.player2Id === null)
                                continue;
                            let channelstringname = "", name1 = "", name2 = "";
                            cclient.participants.index({
                                id: matchlist.url,
                                callback: async (err, data) => {
                                    if (err)
                                        console.log(err);
                                    while (channelstringname.length === 0 && name1.length === 0 && name2.length === 0) {
                                        for (let x = 0; x < data.length; x++) {
                                            if (data[x].participant.id === d.match.player1Id) {
                                                name1 = data[x].participant.name;
                                            }
                                            if (data[x].participant.id === d.match.player2Id) {
                                                name2 = data[x].participant.name;
                                            }
                                        }
                                        if (name2.length > 0 && name1.length > 0) {
                                            channelstringname += name1.substring(0, 10) + "-vs-" + name2.substring(0, 10);
                                        }
                                    }
                                    await message.guild.channels.create(channelstringname, { type: 'text', topic: `48h to complete` })
                                        .then(async (channel) => {
                                        var _a, _b;
                                        let category = await message.guild.channels.cache.find(c => c.name == "matches" && c.type == "category");
                                        await utils_1.matchcard(client, channel.id, [names.find(x => x.str === name1).id, names.find(x => x.str === name2).id]);
                                        await channel.send(`<@${(_a = names.find(x => x.str === name1)) === null || _a === void 0 ? void 0 : _a.id}> <@${(_b = names.find(x => x.str === name2)) === null || _b === void 0 ? void 0 : _b.id}> You have ${args[1]}h to complete this match. Contact a ref to begin, you may also split your match`);
                                        if (!category)
                                            throw new Error("Category channel does not exist");
                                        await channel.setParent(category.id);
                                        await channel.lockPermissions();
                                        await db_1.insertReminder({
                                            _id: channel.id,
                                            mention: `<@${names.find(x => x.str === name1).id}> <@${names.find(x => x.str === name2).id}>`,
                                            channel: channel.id,
                                            type: "match",
                                            time: 86400,
                                            timestamp: Math.round(message.createdTimestamp / 1000)
                                        });
                                    });
                                }
                            });
                        }
                    }
                }
            });
        }
        return message.reply("Made all channels");
    }
};
exports.qualchannelcreate = {
    name: "qualchannelcreate",
    description: "!qualchannelcreate <portion> <time in hours to complete>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let time = args[1];
        let qlist = await db_1.getDoc("config", "quallist");
        for (let i = 0; i < qlist.users.length; i++) {
            if (qlist.users[i].length > 0) {
                let category = await message.guild.channels.cache.find(c => c.name == "qualifiers" && c.type == "category");
                await message.guild.channels.create(`Group ${i + 1}`, { type: 'text', topic: `Round ${args[0]}`, parent: category.id })
                    .then(async (channel) => {
                    let string = "";
                    for (let u of qlist.users[i]) {
                        string += `<@${u}> `;
                    }
                    await db_1.insertReminder({
                        _id: channel.id,
                        mention: string,
                        channel: channel.id,
                        type: "match",
                        time: 129600,
                        timestamp: Math.round(message.createdTimestamp / 1000) - 43200
                    });
                    await channel.send(`${string}, Portion ${args[0]} has begun, and you have ${time}h to complete it. Contact a ref to begin your portion!`);
                });
            }
        }
        return message.reply("Made all channels");
    }
};
exports.matchbracket = {
    name: "create-bracket",
    description: "Will make bracket",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        const cclient = challonge.createClient({
            apiKey: process.env.CHALLONGE
        });
        let matchid = (args.join("")).replace("https://challonge.com/", "");
        let matchlist = await db_1.getDoc("config", "matchlist");
        let randrun = Math.floor(Math.random() * 10) + 1;
        while (randrun !== 0) {
            for (let i = matchlist.users.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [matchlist.users[i], matchlist.users[j]] = [matchlist.users[j], matchlist.users[i]];
            }
        }
        for (let i = 0; i < matchlist.users.length; i++) {
            let name = await (await client.users.fetch(matchlist.users[i])).username;
            cclient.participants.create({
                id: matchid,
                participant: {
                    name: name
                },
                callback: (err, data) => {
                    console.log(err, data);
                }
            });
        }
        matchlist.url = `${matchid}`;
        await db_1.updateDoc("config", "matchlist", matchlist);
        await message.reply(new discord_js_1.MessageEmbed()
            .setColor("#d7be26")
            .setTitle(`Meme Mania ${args[0]}`)
            .setDescription(`Here's the link to the brackets\nhttps://www.challonge.com/${matchid}`)
            .setTimestamp());
    }
};
exports.channeldelete = {
    name: "deletechannels",
    description: "!deletechannels <category>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let catchannels = message.guild.channels.cache.array();
        for (let channel of catchannels) {
            try {
                if (channel.parent && channel.parent.name === args[0]) {
                    await channel.delete();
                }
            }
            catch {
                continue;
            }
        }
    }
};
exports.default = [
    exports.matchchannelcreate,
    exports.qualchannelcreate,
    exports.matchbracket
].sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name)
        return -1;
    else if (k1.name > k2.name)
        return 1;
    else
        return 0;
});
