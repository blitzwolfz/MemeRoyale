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
exports.help = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../db");
const c = __importStar(require("./index"));
exports.help = {
    name: "help",
    group: "help",
    description: "Access the help menu",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        if (args.length === 0) {
            let string = "";
            let array = [];
            c.default.forEach(c => array.push(c.group));
            array.splice(0, array.length, ...(new Set(array)));
            string = array.join(' ');
            return await message.channel.send(`The following command groups are availabe. Please do \`!help <group-name>\`:\n` +
                `\`${string}\``);
        }
        if (c.default.find(c => c.name === args[0])) {
            let g = args[0];
            const embed = new discord_js_1.MessageEmbed()
                .setTitle(`!${g}`)
                .setDescription(c.default.map(cmd => {
                if (cmd.name === g)
                    return cmd.description;
            }))
                .setColor(await (await db_1.getConfig()).colour)
                .setFooter(`You can send \`!help <command name>\` to get info on a specific command!`);
            await message.channel.send(embed);
        }
        if (c.default.find(c => c.group === args[0])) {
            let g = args[0];
            const embed = new discord_js_1.MessageEmbed()
                .setTitle(`Here's a list of my ${g} commands:`)
                .setDescription(c.default.map(cmd => {
                if (g === cmd.group) {
                    if (cmd.owner) {
                        return "`" + "§" + cmd.name + "`" + "\n";
                    }
                    return "`" + cmd.name + "`" + "\n";
                }
            }).join(""))
                .setColor(await (await db_1.getConfig()).colour)
                .setFooter(`You can send \`!help <command name>\` to get info on a specific command!`);
            await message.channel.send(embed);
        }
    }
};
