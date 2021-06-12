import { Command } from "./types"
import { Client, Message, MessageEmbed, TextChannel, User } from "discord.js"
import * as allCommands from "./commands/index"
import { client } from "./listener"
import express from "express";
import http from "http";
import { closest } from "fastest-levenshtein";
import { app } from "./api/router";
export const c = allCommands
export let prefix: string = process.env.prefix!
require('dotenv').config()
var commands: Command[] = c.default

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

    let command = commands.find(c => c.name.toLowerCase() === commandName)
    if(command?.groupCommand === true){
        command = commands.find( cmd => cmd.name.includes(args[0].toLowerCase()) )
        args.slice(0, 2)
    }

    if (commandName === "test") {
        if (message.author.id !== process.env.owner) return await message.reply("nah b");
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
    if (command.owner || command.admins || command.mods) {
        try {
            if (command.admins || message.author.id === process.env.owner && message.member?.roles.cache.find(x => x.name.toLowerCase() === "commissioner")) {
                await command.execute(message, client, args, process.env.owner)
            }

            else if (command.admins || message.author.id === process.env.owner
                && (message.member?.roles.cache.find(x => x.name.toLowerCase() === "commissioner")
                    || message.member?.roles.cache.find(x => x.name.toLowerCase() === "referee"))) {
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