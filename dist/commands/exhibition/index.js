"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.duel = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
const user_1 = require("../user");
const s = __importStar(require("./utils"));
exports.duel = {
    name: "duel",
    description: "",
    group: "duels",
    owner: false,
    admins: false,
    mods: false,
    async execute(message, client, args) {
        var _a, _b, _c;
        if (!message.mentions.users.array()) {
            return message.reply("Please mention someone");
        }
        else if (((_a = message.mentions.users.first()) === null || _a === void 0 ? void 0 : _a.id) === message.author.id) {
            return message.reply("You can't duel yourself.");
        }
        if (args.length < 2) {
            return message.reply("Please use theme flag or template flag");
        }
        else if (args.length >= 3) {
            return message.reply("No too many arguments. Use only the theme flag or template flag");
        }
        else if (!["template", "theme"].includes(args[1].toLowerCase())) {
            return message.reply("Please use theme flag or template flag");
        }
        let ex = await db_1.getExhibition();
        if (ex.cooldowns.some(x => x.user === message.author.id)) {
            return message.reply("It hasn't been 5 mins yet");
        }
        if (ex.cooldowns.some(x => x.user === message.mentions.users.first().id)) {
            return message.reply(`It hasn't been 5 mins for <@${message.mentions.users.first().id}`);
        }
        let m = message;
        const filter = (response) => {
            return (("accept").toLowerCase() === response.content.toLowerCase());
        };
        let id2 = message.mentions.users.first();
        ex.cooldowns.push({
            user: id2.id,
            time: Math.floor(Date.now() / 1000)
        });
        ex.cooldowns.push({
            user: m.author.id,
            time: Math.floor(Date.now() / 1000)
        });
        await db_1.updateExhibition(ex);
        ex = await db_1.getExhibition();
        var res;
        await ((_b = message.mentions.users.first()) === null || _b === void 0 ? void 0 : _b.send(`<@${m.author.id}> wants to duel you. Send Accept to continue, or don't reply to not`).then(async (userdm) => {
            await userdm.channel.awaitMessages(filter, { max: 1, time: 90000, errors: ['time'] })
                .then(async (collected) => {
                await m.channel.send(`${collected.first().author} accepted, <@${m.author.id}>!`);
                res = true;
            })
                .catch(async (collected) => {
                await m.author.send(`<@${m.author.id}> match has been declined`);
                res = false;
                ex.cooldowns.splice(ex.cooldowns.findIndex(x => x.user === id2.id), 1);
                ex.cooldowns.splice(ex.cooldowns.findIndex(x => x.user === m.author.id), 1);
                await db_1.updateExhibition(ex);
                return;
            });
        }));
        if (res === true) {
            await db_1.updateExhibition(ex);
            ex = await db_1.getExhibition();
            let guild = client.guilds.cache.get(message.guild.id);
            let category = await guild.channels.cache.find(c => c.name.toLowerCase() == "duels" && c.type == "category");
            await (guild === null || guild === void 0 ? void 0 : guild.channels.create(`${message.author.username}-vs-${(_c = message.mentions.users.first()) === null || _c === void 0 ? void 0 : _c.username}`, { type: 'text', topic: `Exhibition Match`, parent: category.id }).then(async (channel) => {
                try {
                    await channel.lockPermissions();
                }
                catch (error) {
                    console.log(error);
                    console.log("Can't lock channel");
                }
                let m = {
                    _id: channel.id,
                    split: false,
                    exhibition: true,
                    messageID: [],
                    temp: {
                        istheme: false,
                        link: ""
                    },
                    tempfound: false,
                    p1: {
                        userid: message.author.id,
                        memedone: false,
                        donesplit: true,
                        time: Math.floor(Date.now() / 1000),
                        memelink: "",
                        votes: 0,
                        voters: []
                    },
                    p2: {
                        userid: message.mentions.users.first().id,
                        memedone: false,
                        donesplit: true,
                        time: Math.floor(Date.now() / 1000),
                        memelink: "",
                        votes: 0,
                        voters: []
                    },
                    votetime: Math.floor(Date.now() / 1000),
                    votingperiod: false,
                };
                let user1 = message.author;
                let user2 = message.mentions.users.first();
                if (args[1] === "theme") {
                    m.temp.istheme = true;
                }
                let temps = [];
                if (m.temp.istheme) {
                    temps = await (await db_1.getThemes()).list;
                    m.temp.link = temps[Math.floor(Math.random() * temps.length)];
                }
                else {
                    temps = await (await db_1.getTemplatedb()).list;
                    m.temp.link = temps[Math.floor(Math.random() * temps.length)];
                }
                let embed = new discord_js_1.MessageEmbed()
                    .setTitle(`Match between ${user1.username ? user1.username : (await message.guild.members.fetch(user1.id)).nickname} and ${user2.username ? user2.username : (await message.guild.members.fetch(user2.id)).nickname}`)
                    .setColor("#d7be26")
                    .setDescription(`<@${user1.id}> and <@${user2.id}> both have 30 mins to complete your memes.\n Contact admins if you have an issue.`)
                    .setTimestamp();
                channel.send({ embed });
                if (m.temp.istheme) {
                    await user1.send(`Your theme is: ${m.temp.link}`);
                    await user2.send(`Your theme is: ${m.temp.link}`);
                }
                else {
                    await user1.send(new discord_js_1.MessageEmbed()
                        .setTitle("Your template")
                        .setImage(m.temp.link)
                        .setColor("#d7be26")
                        .setTimestamp());
                    await user2.send(new discord_js_1.MessageEmbed()
                        .setTitle("Your template")
                        .setImage(m.temp.link)
                        .setColor("#d7be26")
                        .setTimestamp());
                }
                await user1.send(`You have 30 mins to complete your meme\nUse \`!submit\` to submit each image. If you have an active match in MemeRoyale, you will have to submit based on channel`);
                await user2.send(`You have 30 mins to complete your meme\nUse \`!submit\` to submit each image. If you have an active match in MemeRoyale, you will have to submit based on channel`);
                if (m.temp.link) {
                    await user1.send(`Image link if embed doesn't show:\`${m.temp.link}\``);
                    await user2.send(`Image link if embed doesn't show:\`${m.temp.link}\``);
                }
                await db_1.insertMatch(m);
                ex.activematches.push(channel.id);
                await db_1.updateExhibition(ex);
                await user_1.createDuelProfileatMatch(user1.id, guild.id);
                return await user_1.createDuelProfileatMatch(user2.id, guild.id);
            }));
        }
    }
};
exports.default = [
    exports.duel
]
    .concat(s.default)
    .sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name)
        return -1;
    else if (k1.name > k2.name)
        return 1;
    else
        return 0;
});
