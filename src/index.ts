import type { Command, levelProfile } from "./types";
import { Client, Message, MessageActionRow, MessageAttachment, MessageButton, MessageEmbed, MessageReaction, TextChannel, User } from "discord.js";
import * as allCommands from "./commands/index";
import { client } from "./listeners/index";
import express from "express";
import http from "http";
import { closest } from "fastest-levenshtein";
import { app } from "./api/router";
import { getConfig, getDoc, insertDoc, updateDoc } from "./db";
import * as path from "path";
import { draw, levelCalc } from "./commands/levelsystem";

export const cmd = allCommands.default;
export let prefix: string = process.env.prefix!;
require('dotenv').config();

//Set global time to GMT -5
process.env.TZ = "America/Toronto";

let commands: Command[] = cmd;

//Express for hosting
app.use(express.static(path.join(__dirname, '../')));

//@ts-ignore
let _server = http.createServer(app);
let Port = process.env.PORT || 100;

app.get('/', (request, response) => {
    //response.sendFile(__dirname + "index.html");
    //response.sendFile(path.join(__dirname, '../', 'index.html'));
    response.sendStatus(200);
});

const httpListener = app.listen(Port, () => {
    //@ts-ignore
    console.log(`Your app is listening on port ${httpListener.address().port}`);
});

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    // if (message.author.id !== process.env.owner && message.channel.type !== "dm" && await (await getConfig()).servers.includes(message.guild!.id!)) return;
    let args: Array<string>;

    if (message.content.startsWith(process.env.prefix!) || message.content.startsWith(`<@!${client.user!.id}>`)) {
        args = message.content.startsWith(process.env.prefix!)
            ? message.content.replace(process.env.prefix!, "").trim().split(/ +/g)
            : message.content.replace((`<@!${client.user!.id}>`), "").trim().split(/ +/g);

        if(message.content.startsWith(`<@!${client.user!.id}>`)){
            message.mentions.users.delete(client.user!.id)
        }
    }

    else {
        if (message.channel.type !== "DM" && message.guild!.id === "719406444109103117" && message.author.id !== "722303830368190485"){
            await levelUp(message)
        }
        return;
    }

    let commandName: string | undefined = args?.shift()?.toLowerCase();

    if (commandName === undefined){
        return;
    }

    if (commandName === "test") {

        // await message.reply("Hello there. General")

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('Peen Been')
                    .setStyle('PRIMARY')
                    .setEmoji("😀"),
            );

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Some title')
            .setURL('https://discord.js.org')
            .setDescription('Some description here');

        await message.reply({ content: 'Pong!', embeds: [embed], components: [row] }).then(async m => {
            await m.react("😀")
        });

        //Always
        return;
    }

    let command = commands.find(c => {
        if (typeof (c.aliases!) !== 'undefined' && c.aliases!.length > 0) {
            return (c.aliases?.includes(commandName!) || c.name.toLowerCase() === commandName);
        }
        else {
            return c.name.toLowerCase() === commandName;
        }
    });

    commandName = command ? command.name : commandName

    if (command?.groupCommand === true) {
        if (typeof args[0] !== "undefined") {
            if (args[0]?.includes("-")) {
                command = commands.find(cmd => cmd.name.toLowerCase() === (commandName + " " + args[0].toLowerCase()));
                args.splice(0, 1);
            }
            else {
                command = commands.find(cmd => cmd.name.toLowerCase() === (commandName));
            }
        }
        else {
            command = commands.find(cmd => cmd.name.toLowerCase() === (commandName));
        }
    }

    if (command) {
        await runCommand(command, message, client, args);
    }

    else if (!command) {
        //let imgurl = (client.users.cache.get("239516219445608449")!.displayAvatarURL({ format: "webp", size: 512 }))
        await message.channel.send({embeds:[await commandError(message, client, commandName, false)]}).then(async mssg => {
            let probablyName = closest(commandName!, commands.map(cmd => cmd.name).sort());
            let emote = `☑️`
            let msg = await message
            .channel
            .send(`Did you mean \`!${probablyName}\`? If so, click on the the ${emote} to continue.`);

            await msg.react(`${emote}`);
            let emoteFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === `${emote}` && !user.bot;
            const approve = msg.createReactionCollector({filter:emoteFilter, time: 50000});

            approve.on('collect', async () => {
                let cmd = commands.find(c => c.name.toLowerCase() === probablyName)!;

                await runCommand(cmd, message, client, args);
            });

        });
    }
});

process.env.dev! ? client.login(process.env.devtoken!) : client.login(process.env.token!);

async function runCommand(command: Command, message: Message, client: Client, args: string[]) {
    if (await (await getConfig()).disabledcommands.includes(command.name)) return message.reply(`${command.name} is currently disabled`);
    if (command.owner || command.admins || command.mods) {
        try {
            if (command.admins && (message.author.id === process.env.owner || message.member?.roles.cache.find(x => x.name.toLowerCase() === "commissioner"))) {
                await command.execute(message, client, args, process.env.owner);
            }
            else if (command.mods && (message.author.id === process.env.owner || (message.member?.roles.cache.find(x => x.name.toLowerCase() === "commissioner") || message.member?.roles.cache.find(x => x.name.toLowerCase() === "referee")))) {
                await command.execute(message, client, args, process.env.owner);
            }
            else if (command.owner && message.author.id === process.env.owner) {
                await command.execute(message, client, args, process.env.owner);
            }
            else {
                return message.reply("You are not allowed to use this command");
            }

        } catch (error) {
            await commandError(message, client, error, false);
        }
    }
    else {
        try {
            await command.execute(message, client, args);

        } catch (error) {
            message.channel.send({embeds:[await commandError(message, client, command.name, true, error)]});
        }
    }
}

async function commandError(message: Message, client: Client, name:string, exist?: boolean, err?: any): Promise<MessageEmbed> {
    // noinspection SpellCheckingInspection
    console.log(err)
    let imgurl = (client.users.cache.get("239516219445608449")!.displayAvatarURL({format: "webp", size: 512}));
    let d = new Date();
    let em = new MessageEmbed()
    .setColor("RED")
    .setTitle("ERROR")
    .addFields({
        name: "Channel Name",
        value: `${(<TextChannel>await client.channels.fetch(message.channel.id)).name}`,
        inline: true
    }, {name: "Channel Id", value: `${message.channel.id}`, inline: true}, {
        name: "User", value: `${message.author.tag}`, inline: true
    }, {name: "User Id", value: `${message.author.id}`, inline: true}, {
        name: `Command`, value: `!${name}`, inline: true
    }, {name: "Time", value: `${d.toLocaleString('en-US', { timeZone: 'America/New_York' })}`, inline: true});
    if (!exist) {
        em
        .setDescription(`Command does not exist. If you think this is in error please contact <@239516219445608449>`)
        .setFooter("blitzwolfz#9338", `${imgurl}`);
        return em;

    }
    else {
        em
        .setDescription(`\`\`\`${err.message}\n${err.stack}\`\`\``)
        .setFooter("blitzwolfz#9338", `${imgurl}`);
        return em;
    }
}

async  function levelUp(message: Message){
    let name = message.guild!.channels.cache.find(x => x.id === message.channel.id)!.parent!.name!;

    if(["social", "other"].includes(name) === false) return;

    let profile:levelProfile = await getDoc("levels", message.author.id)

    if(!profile){
        profile = {
            _id:message.author.id,
            xp: 0,
            level: 1,
            timeStamp:(Math.floor(Math.floor(Date.now()/1000)/60) * 60)
        }

        await insertDoc("levels", profile)
    }


    if(((Math.floor(Math.floor(Date.now()/1000)/60) * 60) - profile.timeStamp) <= 90) return;

    profile.xp += Math.floor(Math.random() * (5 - 2 + 1)) + 2
    profile.timeStamp = (Math.floor(Math.floor(Date.now()/1000)/60) * 60);

    if(profile.xp > await levelCalc(profile.level)){
        profile.level += 1;
        profile.xp = 0;

        let levelImage = await draw(
            {
                backgroundSource: "https://cdn.discordapp.com/attachments/798975443058556968/861426186512760842/levelBackground.png",
                avatarSource: message.author.displayAvatarURL({format:"png"}), // string
                username: message.author.tag, // string
                xpMax: await levelCalc(profile.level), // number
                xpCurrent: profile.xp, // number
                currentLevel: profile.level // number
            }
        )
        await (<TextChannel>await client.channels.cache.get("724839353129369681"))
            .send({content:`Congrats <@${message.author.id}>, you have achieved Level ${profile.level}.`, files:[new MessageAttachment(levelImage, "level.png")]});
    }

    await updateDoc("levels", message.author.id, profile)
}

// .setColor(`#${(await getConfig()).colour}`)
// [...message.attachments.values()]
// (reaction: MessageReaction, user:User)
// [...message.mentions.users.values()]
// setTimeout(() => m.delete(), 10000);
// [...message.mentions.channel.values()]