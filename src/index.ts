import { Command } from "./types"
import { Client, Message, MessageEmbed, TextChannel, User } from "discord.js"
import * as allCommands from "./commands/index"
import { client } from "./listener"
import express from "express";
import http from "http";
import { closest } from "fastest-levenshtein";
import { app } from "./api/router";
import { getConfig } from "./db";
//@ts-ignore
import { readFileSync, writeFile } from "fs"

export const cmd = allCommands.default
export let prefix: string = process.env.prefix!
require('dotenv').config()

var commands: Command[] = cmd

//Express for hosting
app.use(express.static('public'));

//@ts-ignore
var _server = http.createServer(app);
let Port = process.env.PORT || 100

app.get('/', (request, response) => {
    response.sendFile(__dirname + "/index.html");
    response.sendStatus(200);
});

const listener = app.listen(Port, () => {
    //@ts-ignore
    console.log(`Your app is listening on port ${listener.address().port}`);
});

client.on("message", async message => {
    if (message.author.bot) return;

    if (!message.content.startsWith(process.env.prefix!)) return
    var args = message.content.slice((process.env.prefix!.length)).trim().split(/ +/g);

    const commandName: string | undefined = args?.shift()?.toLowerCase();

    if (!commandName) return;

    let command = commands.find(c => {
        if(typeof (c.aliases!) !== 'undefined' && c.aliases!.length > 0){
            return (c.aliases?.includes(commandName) || c.name.toLowerCase() === commandName)
        }

        else{
            return c.name.toLowerCase() === commandName;
        }
    });

    if(command?.groupCommand === true && args[0].includes("-")){
        command = commands.find(cmd => cmd.name.toLowerCase() === (commandName + " " + args[0].toLowerCase()))
        args.splice(0, 1)
    }

    if (commandName === "test2") {
        if (message.author.id !== process.env.owner) return await message.reply("nah b");

        const fileContents = readFileSync('oldIndex.ts', 'utf8')

        // writeFile('oldIndex.txt', fileContents, err => {
        //     if (err) {
        //       console.error(err)
        //       return
        //     }
        // })

        var str = fileContents
        let arr = str.match(/(command === "\w+"*)/g)!
        let arrr = str.match(/(command === "\w+" \|\| command === "\w+"*)/g)!
        // console.log(arr)
        // console.log(arrr)
        await message.channel.send(`I found ${arr?.length} commands in MR`)
        let strr = ""
        let strrr = ""
        let strrrr = ""
        for(let a of arr){
            strr += a.replace("command ===", "").replace('"', '').replace('"', '') + ", "
        }

        for(let a of arrr){
            strrr += a
            .replace("command ===", "")
            .replace(" || ", ", ")
            .replace("command ===", "")
            .replace('"', '')
            .replace('"', '')
            .replace('"', '')
            .replace('"', '') + ", "
        }

        await message.channel.send(`There are ${arrr?.length} repeats in MR`)
        await message.channel.send(`Therefore there are ${arr?.length - arrr?.length} commands in MR`)
        await message.channel.send(strr.split(", ").sort().join(", ")+"\n")
        await message.channel.send(strrr.split(", ").sort().join(", "))

        let all:string[] = [];
        cmd.map(x => {
            all.push(x.name)
            strrrr += x.name + ", "
        })
        await message.channel.send(`Therefore there are ${all.length} commands in MR v2`)
        await message.channel.send(strrrr)
    }

    else if(commandName === "test"){
        let time = Math.floor(((Math.floor(1624091312000/1000)+ 345600) - Math.floor(Date.now()/1000))/3600)


        console.log(time)
        message.channel.send(time)
    }

    else if (command) {
        await runCommand(command, message, client, args)
    }

    else if (!command) {
        let imgurl = (client.users.cache.get("239516219445608449")!.displayAvatarURL({ format: "webp", size: 512 }))
        await message.channel.send(new MessageEmbed()
            .setColor("RED")
            .setTitle("ERROR")
            .addFields(
                { name: 'Channel Name', value: `${(<TextChannel>await client.channels.fetch(message.channel.id)).name}`, inline: true },
                { name: 'Channel Id', value: `${message.channel.id}`, inline: true },
                { name: 'User', value: `${message.author.tag}`, inline: true },
                { name: 'User Id', value: `${message.author.id}`, inline: true },
            )
            .setDescription(`Command does not exist. If you think this is in error please contact <@239516219445608449>`)
            .setFooter("blitzwolfz#9338", `${imgurl}`)
        ).then(async mssg => {
            let probsName = closest(commandName, commands.map(cmd => cmd.name).sort());
            let msg = await message
            .channel
            .send(`Did you mean \`!${probsName}\`? If so, click on the the ✔️ to continue.`)

            await msg.react(`✔️`)
            let emoteFilter = (reaction: { emoji: { name: string; }; }, user: User) => reaction.emoji.name === '✔️' && !user.bot;
            const approve = msg.createReactionCollector(emoteFilter, { time: 50000 });

            approve.on('collect', async () => {
                let cmd = commands.find(c => c.name.toLowerCase() === probsName)!

                await runCommand(cmd, message, client, args)
            })

        });
    }
})

process.env.dev! ? client.login(process.env.devtoken!) : client.login(process.env.token!)

async function runCommand(command:Command, message: Message, client:Client, args: string[]) {
    if(await (await getConfig()).disabledcommands.includes(command.name)) return message.reply(`${command.name} is currently disabled`);


    if (command.owner || command.admins || command.mods) {
        try {
            if (command.admins && (message.author.id === process.env.owner || message.member?.roles.cache.find(x => x.name.toLowerCase() === "commissioner"))) {
                await command.execute(message, client, args, process.env.owner)
            }

            else if (command.mods && (message.author.id === process.env.owner || (message.member?.roles.cache.find(x => x.name.toLowerCase() === "commissioner") || message.member?.roles.cache.find(x => x.name.toLowerCase() === "referee")))) {
                await command.execute(message, client, args, process.env.owner)
            }

            else if(command.owner && message.author.id === process.env.owner){
                await command.execute(message, client, args, process.env.owner)
            }

            else {
                return message.reply("You are not allowed to use this command")
            }

        } catch (error) {
            await commandError(message, client, error)
        }
    }

    else {
        try {
            await command.execute(message, client, args)

        } catch (error) {
            await commandError(message, client, error)
        }
    }
}

async function commandError(message: Message, client: Client, err: any) {
    let imgurl = (client.users.cache.get("239516219445608449")!.displayAvatarURL({ format: "webp", size: 512 }))
    await message.channel.send(new MessageEmbed()
        .setColor("RED")
        .setTitle("ERROR")
        .addFields(
            { name: 'Channel Name', value: `${(<TextChannel>await client.channels.fetch(message.channel.id)).name}`, inline: true },
            { name: 'Channel Id', value: `${message.channel.id}`, inline: true },
            { name: 'User', value: `${message.author.tag}`, inline: true },
            { name: 'User Id', value: `${message.author.id}`, inline: true },
        )
        .setDescription(`\`\`\`${err.message}\n${err.stack}\`\`\``)
        .setFooter("blitzwolfz#9338", `${imgurl}`)
    )
}