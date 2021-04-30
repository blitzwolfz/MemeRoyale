"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsignup = exports.signup_manager = exports.signup = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../db");
exports.signup = {
    name: "signup",
    description: "Command to signup for tournament",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    async execute(message, client, args) {
        var _a, _b, _c;
        let signup = await db_1.getDoc("config", "signups");
        if (message.channel.type !== "dm" && message.id !== signup.msgID) {
            return await message.reply("You have to signup in bot dm if they are open").then(async (m) => {
                message.delete();
                m.delete({ timeout: 1600 });
            });
        }
        ;
        if (signup.open === false) {
            if (message.id !== signup.msgID)
                return message.reply("You can't signup as they are not open");
            else {
                return await ((_a = client.users.cache.find(x => x.id === args[0])) === null || _a === void 0 ? void 0 : _a.send("You can't signup as they are not open"));
            }
        }
        if (signup.users.includes(message.author.id) || signup.users.includes(args[0])) {
            if (message.id !== signup.msgID)
                return message.reply("You already signed up");
            else {
                return await ((_b = client.users.cache.find(x => x.id === args[0])) === null || _b === void 0 ? void 0 : _b.send("You already signed up"));
            }
        }
        else {
            if (message.id !== signup.msgID) {
                await message.reply("You have been signed up!");
                signup.users.push(message.author.id);
            }
            else {
                await ((_c = client.users.cache.find(x => x.id === args[0])) === null || _c === void 0 ? void 0 : _c.send("You have been signed up!"));
                signup.users.push(args[0]);
            }
            return await db_1.updateDoc("config", "signup", signup);
        }
    }
};
exports.signup_manager = {
    name: "signup-manager",
    description: "Managing command for signups.",
    group: "tournament-manager",
    owner: false,
    admins: true,
    mods: false,
    async execute(message, client, args) {
        let signup = await db_1.getDoc("config", "signups");
        let c = await client.channels.fetch(await message.guild
            .channels.cache
            .find(x => x.name.toLowerCase() === "announcements").id);
        if (args[0] === "open") {
            signup.open = true;
            await c.send(new discord_js_1.MessageEmbed()
                .setDescription("Match signups have started!"
                + "\nPlease use the command `!signup`"
                + "\nYou can also use 🗳️ to signup"
                + "\nIf you wish to remove your signup use `!unsignup`"
                + "\nOf course if you have problems contact mods!")
                .setColor("#d7be26")
                .setTimestamp()).then(async (msg) => {
                msg.react('🗳️');
                signup.msgID = msg.id;
            });
            return await db_1.updateDoc("config", "signups", signup);
        }
        if (args[0] === "close") {
            signup.open = false;
            await db_1.updateDoc("config", "signups", signup);
            return await c.send(new discord_js_1.MessageEmbed()
                .setDescription("Match signups have closed!"
                + "\nIf there is an issue with your signup"
                + "\nyou will be contacted. If you wish to unsignup"
                + "\nuse `!unsignup` or contact mods. Of course "
                + "\nif you have problems contact mods!")
                .setColor("#d7be26")
                .setTimestamp());
        }
        if (args[0] === "reopen") {
            signup.open = true;
            await db_1.updateDoc("config", "signups", signup);
            return await c.send(new discord_js_1.MessageEmbed()
                .setDescription("Match signups have reopened!"
                + "\nIf you wish to signup use `!signup`"
                + "\nYou can also use 🗳️ to signup"
                + "\nIf you wish to remove your signup use `!removesignup`"
                + "\nOf course if you have problems contact mods!")
                .setColor("#d7be26")
                .setTimestamp());
        }
        if (args[0] === "remove") {
            if (!args[1])
                return message.reply("Please provide the User ID");
            signup.users.splice(signup.users.indexOf(message.author.id), 1);
            await db_1.updateDoc("config", "signups", signup);
            return message.reply(`Removed user <@${args[1]}>`);
        }
    }
};
exports.unsignup = {
    name: "unsignup",
    description: "Command to signup for tournament",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    async execute(message, client, args) {
        let signup = await db_1.getDoc("config", "signups");
        if (message.channel.type !== "dm") {
            return await message.reply("You have to signup in bot dm if they are open").then(async (m) => {
                message.delete();
                m.delete({ timeout: 3000 });
            });
        }
        ;
        if (signup.open === false)
            return message.reply("You can't signup as they are not open");
        if (signup.users.includes(message.author.id))
            return message.reply("You already signed up");
        else {
            signup.users = signup.users.splice(signup.users.findIndex(x => x === message.author.id), 1);
            await db_1.updateDoc("config", "signup", signup);
            return message.reply("You have been removed!");
        }
    }
};
