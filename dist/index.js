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
exports.prefix = exports.client = void 0;
const glob = require("glob");
const util_1 = require("util");
const Discord = __importStar(require("discord.js"));
const c = __importStar(require("./commands/index"));
const db_1 = require("./db");
const background_1 = require("./commands/match/background");
const background_2 = require("./commands/quals/background");
const background_3 = require("./commands/exhibition/background");
const reminders_1 = require("./commands/reminders");
exports.client = new Discord.Client({ partials: ["CHANNEL", "CHANNEL", "MESSAGE", "REACTION", "USER"] });
exports.prefix = process.env.prefix;
require('dotenv').config();
const globPromise = util_1.promisify(glob);
var commands = c.default;
const express = require('express');
const app = express();
app.use(express.static('public'));
const http = require('http');
var _server = http.createServer(app);
app.get('/', (_request, response) => {
    response.sendFile(__dirname + "/index.html");
    console.log(Date.now() + " Ping Received");
    response.sendStatus(200);
});
const listener = app.listen(process.env.PORT, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});
exports.client.once("ready", async () => {
    var _a;
    await db_1.connectToDB();
    setInterval(async function () {
        await background_1.backgroundMatchLoop(exports.client);
    }, 15000);
    setInterval(async function () {
        await background_2.backgroundQualLoop(exports.client);
    }, 15000);
    setInterval(async function () {
        await background_3.backgroundExhibitionLoop(exports.client);
    }, 15000);
    setInterval(async function () {
        await reminders_1.backgroundReminderLoop(exports.client);
    }, 5000);
    console.log("\n");
    console.log(`Logged in as ${(_a = exports.client.user) === null || _a === void 0 ? void 0 : _a.tag}\nPrefix is ${exports.prefix}`);
    console.log(`In ${exports.client.guilds.cache.size} servers\nTotal users is ${exports.client.users.cache.size}`);
});
exports.client.on("messageReactionAdd", async (messageReaction, user) => {
    var _a, _b, _c, _d;
    if (user.id === "722303830368190485")
        return;
    if (user.bot)
        return;
    if (messageReaction.partial)
        await messageReaction.fetch();
    if (messageReaction.message.partial)
        await messageReaction.message.fetch();
    if (messageReaction.emoji.name === '1️⃣' && await db_1.getMatch(messageReaction.message.channel.id)) {
        if (user.bot)
            return;
        let m = await db_1.getMatch(messageReaction.message.channel.id);
        if (!m)
            return;
        messageReaction.users.remove(user.id);
        if (m.p1.userid === user.id || m.p2.userid === user.id)
            return user.send("Can't vote in your own match");
        m.p1.voters.push(user.id);
        m.p1.votes += 1;
        if (m.p2.voters.includes(user.id)) {
            m.p2.voters.splice(m.p2.voters.indexOf(user.id), 1);
            m.p2.votes -= 1;
        }
        await db_1.updateMatch(m);
        await user.send(`Vote counted for Player 1's memes in <#${m._id}>. You gained 2 points for voting`);
    }
    if (messageReaction.emoji.name === '2️⃣' && await db_1.getMatch(messageReaction.message.channel.id)) {
        if (user.bot)
            return;
        let m = await db_1.getMatch(messageReaction.message.channel.id);
        if (!m)
            return;
        messageReaction.users.remove(user.id);
        if (m.p1.userid === user.id || m.p2.userid === user.id)
            return user.send("Can't vote in your own match");
        m.p2.voters.push(user.id);
        m.p2.votes += 1;
        if (m.p1.voters.includes(user.id)) {
            m.p1.voters.splice(m.p1.voters.indexOf(user.id), 1);
            m.p1.votes -= 1;
        }
        await db_1.updateMatch(m);
        await user.send(`Vote counted for Player 2's memes in <#${m._id}>. You gained 2 points for voting`);
    }
    if (["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"].includes(messageReaction.emoji.name) && await db_1.getQual(messageReaction.message.channel.id)) {
        await messageReaction.users.remove(user.id);
        let q = await db_1.getQual(messageReaction.message.channel.id);
        if (!q)
            return;
        let pos = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"].indexOf(messageReaction.emoji.name);
        if (q.players[pos].votes.includes(user.id) === false) {
            if (q.players.filter(y => y.votes.includes(user.id)).length === 2) {
                return await user.send("You can only vote for 2 memes. Please hit recycle button to reset your votes");
            }
            if (q.players[pos].failed === true) {
                return await user.send("You can't vote for a user who failed");
            }
            q.players[pos].votes.push(user.id);
            await db_1.updateQual(q);
            return user.send(`You have voted for Meme #${pos + 1} in <#${messageReaction.message.channel.id}>`);
        }
        else {
            return user.send("You have already voted for this meme");
        }
    }
    if (messageReaction.emoji.name === '♻️') {
        await messageReaction.users.remove(user.id);
        let q = await db_1.getQual(messageReaction.message.channel.id);
        if (!q)
            return;
        q.players.forEach(function (v) {
            if (v.votes.includes(user.id)) {
                let pos = q.players.indexOf(v);
                v.votes = v.votes.splice(pos, 1);
            }
        });
        await db_1.updateQual(q);
        return user.send(`All votes in <#${messageReaction.message.channel.id}> reset`);
    }
    if (messageReaction.emoji.name === '🅰️') {
        await messageReaction.users.remove(user.id);
        let m = await db_1.getMatch(messageReaction.message.channel.id);
        if (!user.client.guilds.cache.get(messageReaction.message.guild.id)
            .members.cache.get(user.id).roles.cache
            .find(x => x.name.toLowerCase() === "referee") && m.p1.userid !== user.id) {
            return user.send("No.");
        }
        return (_a = c.default.find(c => c.name.toLowerCase() === "start-split")) === null || _a === void 0 ? void 0 : _a.execute(messageReaction.message, exports.client, [m.p1.userid]);
    }
    if (messageReaction.emoji.name === '🅱️') {
        await messageReaction.users.remove(user.id);
        let m = await db_1.getMatch(messageReaction.message.channel.id);
        if (!user.client.guilds.cache.get(messageReaction.message.guild.id)
            .members.cache.get(user.id).roles.cache
            .find(x => x.name.toLowerCase() === "referee") && m.p2.userid !== user.id) {
            return user.send("No.");
        }
        return (_b = c.default.find(c => c.name.toLowerCase() === "start-split")) === null || _b === void 0 ? void 0 : _b.execute(messageReaction.message, exports.client, [m.p2.userid]);
    }
    if (['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'].includes(messageReaction.emoji.name)) {
        await messageReaction.users.remove(user.id);
        if (!await (await db_1.getQual(messageReaction.message.channel.id)).players.some(x => x.userid === user.id) || !!user.client.guilds.cache
            .get(messageReaction.message.guild.id)
            .members.cache.get(user.id).roles.cache
            .find(x => x.name.toLowerCase() === "referee") === false) {
            return;
        }
        ;
        let m = await db_1.getQual(messageReaction.message.channel.id);
        if (!m)
            return;
        let pos = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'].indexOf(messageReaction.emoji.name);
        (_c = c.default.find(c => c.name.toLowerCase() === "start-qual")) === null || _c === void 0 ? void 0 : _c.execute(messageReaction.message, exports.client, [m.players[pos].userid]);
    }
    if (messageReaction.emoji.name === '🗳️') {
        (_d = c.default.find(c => c.name.toLowerCase() === "signup")) === null || _d === void 0 ? void 0 : _d.execute(messageReaction.message, exports.client, [user.id]);
    }
});
exports.client.on("message", async (message) => {
    var _a, _b, _c, _d;
    if (message.author.bot) {
        return;
    }
    var args;
    if (message.content.startsWith(process.env.prefix)) {
        args = message.content.slice((process.env.prefix.length)).trim().split(/ +/g);
    }
    else
        return;
    const commandName = (_a = args === null || args === void 0 ? void 0 : args.shift()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (!commandName)
        return;
    const command = commands.find(c => c.name.toLowerCase() === commandName);
    if (commandName === "test") {
        if (message.author.id !== process.env.owner) {
            return await message.reply("nah b");
        }
        message.channel.messages.fetch(args[0])
            .then(message => {
            console.log(message);
            console.log(`Message Content: ${message.content}`);
        })
            .catch(console.error);
    }
    else if (command) {
        if (command.owner || command.admins || command.mods) {
            try {
                if (command.admins || message.author.id === process.env.owner && ((_b = message.member) === null || _b === void 0 ? void 0 : _b.roles.cache.find(x => x.name.toLowerCase() === "commissioner"))) {
                    await command.execute(message, exports.client, args, process.env.owner);
                }
                else if (command.admins || message.author.id === process.env.owner
                    && (((_c = message.member) === null || _c === void 0 ? void 0 : _c.roles.cache.find(x => x.name.toLowerCase() === "commissioner")) || ((_d = message.member) === null || _d === void 0 ? void 0 : _d.roles.cache.find(x => x.name.toLowerCase() === "referee")))) {
                    await command.execute(message, exports.client, args, process.env.owner);
                }
                else {
                    return message.reply("You are not allowed to use this command");
                }
            }
            catch (error) {
                await message.channel.send(new Discord.MessageEmbed()
                    .setColor("RED")
                    .setTitle("ERROR")
                    .addFields({ name: 'Channel Name', value: `${(await exports.client.channels.fetch(message.channel.id)).name}`, inline: true }, { name: 'Channel Id', value: `${message.channel.id}`, inline: true }, { name: 'User', value: `${message.author.tag}`, inline: true }, { name: 'User Id', value: `${message.author.id}`, inline: true })
                    .setDescription(`\`\`\`${error.message}\n${error.stack}\`\`\``)
                    .setFooter("blitzwolfz#9338", "https://cdn.discordapp.com/avatars/239516219445608449/12fa541557ca2635a34a5af5e8c65d26.webp?size=512"));
            }
        }
        else {
            try {
                await command.execute(message, exports.client, args);
            }
            catch (error) {
                console.log(error);
                await message.channel.send(new Discord.MessageEmbed()
                    .setFooter("blitzwolfz#9338", "https://cdn.discordapp.com/avatars/239516219445608449/12fa541557ca2635a34a5af5e8c65d26.webp?size=512")
                    .setColor("RED")
                    .setTitle("ERROR")
                    .addFields({ name: 'Channel Name', value: `${(await exports.client.channels.fetch(message.channel.id)).name}`, inline: true }, { name: 'Channel Id', value: `${message.channel.id}`, inline: true }, { name: 'User', value: `${message.author.tag}`, inline: true }, { name: 'User Id', value: `${message.author.id}`, inline: true })
                    .setDescription(`\`\`\`${error.message}\n${error.stack}\`\`\``));
            }
        }
    }
});
if (process.env.dev)
    exports.client.login(process.env.devtoken);
else
    exports.client.login(process.env.token);
