import { Client, Message, MessageEmbed } from "discord.js";
import { getAllMatches, getAllProfiles, getAllQuals, getAllReminders, getConfig, getTemplatedB, getThemes } from "../db";
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
    slashCommand:false,
    serverOnlyCommand:false,
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
            let descriptionForEmbed = c.default!.find(cmd => cmd.name === g)!.description!

            const embed = new MessageEmbed()
            .setTitle(`!${g}`)
            .setDescription(descriptionForEmbed)
            .setColor(`#${(await getConfig()).colour}`);

            if (c.default.find(c => c.name === args[0])?.aliases) {
                embed.addField("Also known as:", "\u200B");
                for (let g of c.default.find(c => c.name === args[0])!.aliases!) {
                    embed.addField(`!${g}`, `\u200B`, true);
                }
            }
            await message.channel.send({embeds: [embed]});
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

                    if (cmd.admins && !!message.member!.roles.cache.find(x => x.name.toLowerCase() === "comissioner")) {
                        return "`" + "§§" + cmd.name + "`" + "\n";
                    }

                    else if (cmd.admins && !message.member!.roles.cache.find(x => x.name.toLowerCase() === "comissioner")) {
                        return "";
                    }

                    if (cmd.mods && !!message.member!.roles.cache.find(x => x.name.toLowerCase() === "referee")) {
                        return "`" + "§" + cmd.name + "`" + "\n";
                    }

                    else if (cmd.mods && !message.member!.roles.cache.find(x => x.name.toLowerCase() === "referee")) {
                        return "";
                    }

                    return "`" + cmd.name + "`" + "\n";
                }
            }).join(""))
            .setColor(`#${(await getConfig()).colour}`)
            .setFooter(`You can send \`!help <command name>\` to get info on a specific command!`);

            await message.channel.send({embeds: [embed]});
        }
    }
};

export const mrStats: Command = {
    name: "mr-stats",
    aliases: [
        "mrs"
    ],
    group: "stats",
    description: "Access the help menu",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let statsGif = [
            "https://cdn.discordapp.com/attachments/883032538019397712/890096681759162388/statsssss.gif",
            "https://cdn.discordapp.com/attachments/798975443058556968/895941628731228170/numbers-dont-lie-statistics.gif"
        ]

        let m = (await getAllMatches()).filter(x => !x.exhibition && !x.votingperiod)
        let q = (await getAllQuals()).filter(x => !x.votingperiod)

        let reminders = (await getAllReminders()).filter(x => x.type === "match")

        let mTime, qTime;

        mTime = qTime = 0

        for (let r of reminders) {
            if (m.find(x => x._id === r._id)) {
                if (r.timestamp >= mTime) mTime = r.timestamp + r.basetime
            }

            if (q.find(x => x._id === r._id)) {
                if (r.timestamp >= qTime) qTime = r.timestamp + r.basetime
            }
        }

        let guild = message.guild!
        let statsEmbed = new MessageEmbed()
            .setTitle("MR Basic Server Stats")
            .setColor("RANDOM")
            .setImage(statsGif[Math.floor(Math.random() * statsGif.length)])
            .addFields(
                {name: 'Total Channels', value: `${guild.channels.cache.size}`, inline:true},
                {name: 'Total Users', value: `${guild.memberCount}`, inline:true},
                {name: 'Owner', value: `${(await client.users.fetch(guild.ownerId)).username}`, inline:true},

                {name: 'Total Templates', value: `${(await getTemplatedB()).list.length}`, inline:true},
                {name: 'Total Themes', value: `${(await getThemes()).list.length}`, inline:true},
                {name: 'Total Profiles', value: `${(await getAllProfiles()).length}`, inline:true},

                {name: 'Qualifier Time Left', value: `${qTime !== 0 ? `<t:${qTime}>` : "N/A"}`, inline:true},
                {name: 'Match Time Left', value: `${mTime !== 0 ? `<t:${mTime}>` : "N/A"}`, inline:true},
                {name: 'Current Time', value: `<t:${Math.floor(Date.now()/1000)}>`, inline:true}
            );

        return  message.reply({embeds:[statsEmbed]})

    }
};

export const mute: Command = {
    name: "mute",
    aliases: [
        "timeout"
    ],
    group: "stats",
    description: "!mute <@user> <time| 5 mins> <reason>",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        if(!(await message.mentions.users.first())) {
            return message.reply("Please mention a user.")
        }
        
        let guildUser = await (await message.guild!.fetch()).members.fetch((await message.mentions.users.first()!.id))
        let time = 5 * 60 * 1000;
        
        if (args[1].toLowerCase().includes("mins")) {
            time = parseInt(args[1]) * 60 * 1000
    
            await guildUser.timeout(time, args.slice(2).join(" "))
            return  message.reply(`<@${await message.mentions.users.first()!.id}> muted for ${((time/60) / 1000)}`)
        }
        
        else {
            return  message.reply(`<@${await message.mentions.users.first()!.id}> muted for ${((time/60) / 1000)}`)
        }
    }
};