import { Client, Message, MessageEmbed } from "discord.js";
import { getConfig } from "../db";
import type { Command } from "../types";
import * as c from "./index";

export const help: Command = {
    name: "help",
    aliases: [
        "menu"
    ],
    group: "helpmenu",
    description: "Access the help menu",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        if (args.length === 0) {

            let string: any = "";
            let array: Array<String> = [];
            c.default.forEach(c => array.push(c.group));

            array.splice(0, array.length, ...(new Set(array)));
            string = array.join(' ');

            if (!!message.member!.roles.cache.find(x => x.name.toLowerCase() === "referee") === false) {
                string = "tourny";
            }

            return await message.channel.send(`The following command groups are availabe. Please do \`!help <group-name>\`:\n` + `\`${string}\``);
        }

        if (c.default.find(c => c.name === args[0])) {
            let g = args[0];

            const embed = new MessageEmbed()
            .setTitle(`!${g}`)

            .setDescription(c.default.map(cmd => {
                if (cmd.name === g) return cmd.description;
            }))
            .setColor(await (await getConfig()).colour);

            if (c.default.find(c => c.name === args[0])?.aliases) {
                embed.addField("Also known as:", "\u200B");
                for (let g of c.default.find(c => c.name === args[0])!.aliases!) {
                    embed.addField(`!${g}`, `\u200B`, true);
                }
            }
            await message.channel.send(embed);
        }

        if (c.default.find(c => c.group === args[0])) {
            let g = args[0];

            const embed = new MessageEmbed()
            .setTitle(`Here's a list of my ${g} commands\n§ = mods, §§ = admin:`)

            .setDescription(c.default.map(cmd => {
                if (g === cmd.group) {
                    if (cmd.owner && message.author.id === "239516219445608449") {
                        return "`" + "§§§" + cmd.name + "`" + "\n";
                    }

                    else if (cmd.owner && message.author.id !== "239516219445608449") {
                        return "";
                    }

                    if (cmd.admins && !!message.member!.roles.cache.find(x => x.name.toLowerCase() === "comissioner") === true) {
                        return "`" + "§§" + cmd.name + "`" + "\n";
                    }

                    else if (cmd.admins && !!message.member!.roles.cache.find(x => x.name.toLowerCase() === "comissioner") === false) {
                        return "";
                    }

                    if (cmd.mods && !!message.member!.roles.cache.find(x => x.name.toLowerCase() === "referee") === true) {
                        return "`" + "§" + cmd.name + "`" + "\n";
                    }

                    else if (cmd.mods && !!message.member!.roles.cache.find(x => x.name.toLowerCase() === "referee") === false) {
                        return "";
                    }

                    return "`" + cmd.name + "`" + "\n";
                }
            }).join(""))
            .setColor(await (await getConfig()).colour)
            .setFooter(`You can send \`!help <command name>\` to get info on a specific command!`);

            await message.channel.send(embed);
        }
    }
};