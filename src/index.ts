import type { Command } from "./types";
import { Client, Message, MessageEmbed, TextChannel, User } from "discord.js";
import * as allCommands from "./commands/index";
import { client } from "./listener";
import express from "express";
import http from "http";
import { closest } from "fastest-levenshtein";
import { app } from "./api/router";
import { getAllProfiles, getConfig, getOneColl, updateProfile } from "./db";
import * as path from "path";
//@ts-ignore
import { readFileSync } from "fs";
import type { Signups } from "./types";


export const cmd = allCommands.default;
export let prefix: string = process.env.prefix!;
require('dotenv').config();

let commands: Command[] = cmd;

//Express for hosting
app.use(express.static(path.join(__dirname, '../')));
//app.use(express.static('public'));

//@ts-ignore
let _server = http.createServer(app);
let Port = process.env.PORT || 100;

app.get('/', (request, response) => {
    //response.sendFile(__dirname + "index.html");
    //response.sendFile(path.join(__dirname, '../', 'index.html'));
    response.sendStatus(200);
});

const listener = app.listen(Port, () => {
    //@ts-ignore
    console.log(`Your app is listening on port ${listener.address().port}`);
});

client.on("message", async message => {
    if (message.author.bot) return;
    if (message.author.id !== process.env.owner && message.channel.type !== "dm" && await (await getConfig()).servers.includes(message.guild!.id!)) return;

    var args: Array<string>;

    if (message.content.startsWith(process.env.prefix!) || message.content.startsWith(`<@!${client.user!.id}>`)) {
        // args = message.content.startsWith(process.env.prefix!)
        //     ? message.content.slice(process.env.prefix!.length).trim().split(/ +/g)
        //     : message.content.slice((`<@!${client.user!.id}>`.length)).trim().split(/ +/g);
        if(message.content.startsWith(`<@!${client.user!.id}>`)){
            message.mentions.users.delete(client.user!.id)
        }
        args = message.content.startsWith(process.env.prefix!)
            ? message.content.replace(process.env.prefix!, "").trim().split(/ +/g)
            : message.content.replace((`<@!${client.user!.id}>`), "").trim().split(/ +/g);
    }
    else {
        return;
    }

    const commandName: string | undefined = args?.shift()?.toLowerCase();
    if (!commandName) return;

    let command = commands.find(c => {
        if (typeof (c.aliases!) !== 'undefined' && c.aliases!.length > 0) {
            return (c.aliases?.includes(commandName) || c.name.toLowerCase() === commandName);
        }
        else {
            return c.name.toLowerCase() === commandName;
        }
    });

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


    if (commandName === "test2") {
        if (message.author.id !== process.env.owner) return await message.reply("nah b");

        const fileContents = readFileSync('oldIndex.ts', 'utf8');

        // writeFile('oldIndex.txt', fileContents, err => {
        //     if (err) {
        //       console.error(err)
        //       return
        //     }
        // })

        var str = fileContents;
        let arr = str.match(/(command === "\w+"*)/g)!;
        let arrr = str.match(/(command === "\w+" \|\| command === "\w+"*)/g)!;
        await message.channel.send(`I found ${arr?.length} commands in MR`);
        let strr = "";
        let strrr = "";
        let strrrr = "";
        for (let a of arr) {
            strr += a.replace("command ===", "").replace('"', '').replace('"', '') + ", ";
        }

        for (let a of arrr) {
            strrr += a
            .replace("command ===", "")
            .replace(" || ", ", ")
            .replace("command ===", "")
            .replace('"', '')
            .replace('"', '')
            .replace('"', '')
            .replace('"', '') + ", ";
        }

        await message.channel.send(`There are ${arrr?.length} repeats in MR`);
        await message.channel.send(`Therefore there are ${arr?.length - arrr?.length} commands in MR`);
        await message.channel.send(strr.split(", ").sort().join(", ") + "\n");
        await message.channel.send(strrr.split(", ").sort().join(", "));

        let all: string[] = [];
        cmd.map(x => {
            all.push(x.name);
            strrrr += x.name + ", ";
        });
        await message.channel.send(`Therefore there are ${all.length} commands in MR v2`);
        await message.channel.send(strrrr);
    }

    else if (commandName === "test") {
        let allProfiles = await getAllProfiles()

        for(let p of allProfiles){
            p.totalMemes = 0
            p.totalTime = 0
            await updateProfile(p)
        }
    }

    else if (commandName === "test3") {
        //await message.mentions.users.first()!.send("");
        let names: {name:string, number:number}[] = [];
        for(let com of cmd){
            if (!names.find(x => x.name === com.group)) {
                names.push({
                    name: com.group, number: 1
                });
            }

            else {
                names[names.findIndex(x => x.name === com.group)].number += 1;
            }
        }

        let emb = new MessageEmbed()
        .setColor((await getConfig()).colour)
        .setTitle("Total groups")
        .setFooter("MemeRoyale#3101", `${(client.users.cache.get("722303830368190485")!.displayAvatarURL({
            format: "webp",
            size: 512
        }))}`)

        for(let n of names){
            emb.addField(
                n.name, n.number,
            )
        }

        await message.channel.send(emb);


    }

    else if(commandName === "test4"){
        let doc = await getOneColl("signup", 1)
        let signup: Signups = await getOneColl("config", "signups", "memeroyale")

        let array3 = signup.users.filter(function(obj:any) { return doc.users.indexOf(obj) == -1; });
        for(let i = 0; i <  array3.length; i++){
            array3[i] = `<@${array3[i]}>`
        }

        message.channel.send(array3.join(", "))
    }

    else if(commandName === "trans"){
        if(message.author.id !== process.env.owner){
            return;
        }
        await commands.find(cmd => cmd.name.toLowerCase() === "transition")!.execute(message, client, args)
    }

    // else if(commandName === "search"){
    //     await commands.find(cmd => cmd.name.toLowerCase() === "search")!.execute(message, client, args)
    // }

    else if (command) {
        await runCommand(command, message, client, args);
    }
    else if (!command) {
        //let imgurl = (client.users.cache.get("239516219445608449")!.displayAvatarURL({ format: "webp", size: 512 }))
        await message.channel.send(await commandError(message, client, false)).then(async mssg => {
            let probablyName = closest(commandName, commands.map(cmd => cmd.name).sort());
            let emote = `☑️`
            let msg = await message
            .channel
            .send(`Did you mean \`!${probablyName}\`? If so, click on the the ${emote} to continue.`);

            await msg.react(`${emote}`);
            let emoteFilter = (reaction: { emoji: { name: string; }; }, user: User) => reaction.emoji.name === `${emote}` && !user.bot;
            const approve = msg.createReactionCollector(emoteFilter, {time: 50000});

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
            message.channel.send(await commandError(message, client, true, error));
        }
    }
}

async function commandError(message: Message, client: Client, exist?: boolean, err?: any): Promise<MessageEmbed> {
    // noinspection SpellCheckingInspection
    let imgurl = (client.users.cache.get("239516219445608449")!.displayAvatarURL({format: "webp", size: 512}));
    let em = new MessageEmbed()
    .setColor("RED")
    .setTitle("ERROR")
    .addFields({
        name: 'Channel Name',
        value: `${(<TextChannel>await client.channels.fetch(message.channel.id)).name}`,
        inline: true
    }, {name: 'Channel Id', value: `${message.channel.id}`, inline: true}, {
        name: 'User', value: `${message.author.tag}`, inline: true
    }, {name: 'User Id', value: `${message.author.id}`, inline: true});
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