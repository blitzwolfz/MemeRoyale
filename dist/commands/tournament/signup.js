"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup_manager = exports.signup = void 0;
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
        let signup = await db_1.getDoc("config", "signups");
        if (message.channel.type !== "dm") {
            await message.reply("You have to signup in bot dm if they are open").then(async (m) => {
                message.delete();
                m.delete({ timeout: 1600 });
            });
        }
        ;
        if (signup.open === false)
            return message.reply("You can't signup as they are not open");
        if (signup.users.includes(message.author.id))
            return message.reply("You already signed up");
        else {
            signup.users.push(message.author.id);
            await db_1.updateDoc("config", "signup", signup);
            return message.reply("You have been signed up!");
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
            await db_1.updateDoc("config", "signups", signup);
            return await c.send(new discord_js_1.MessageEmbed()
                .setDescription("Match signups have started!"
                + "\nPlease use the command `!signup`"
                + "\nYou can also use 🗳️ to signup"
                + "\nIf you wish to remove your signup use `!unsignup`"
                + "\nOf course if you have problems contact mods!")
                .setColor("#d7be26")
                .setTimestamp()).then(async (msg) => {
                msg.react('🗳️');
            });
        }
        if (args[0] === "close") {
            signup.open = false;
            await db_1.updateDoc("config", "signups", signup);
            return await c.send(new discord_js_1.MessageEmbed()
                .setDescription("Match signups have started!"
                + "\nPlease use the command `!signup`"
                + "\nYou can also use 🗳️ to signup"
                + "\nIf you wish to remove your signup use `!unsignup`"
                + "\nOf course if you have problems contact mods!")
                .setColor("#d7be26")
                .setTimestamp()).then(async (msg) => {
                msg.react('🗳️');
            });
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
