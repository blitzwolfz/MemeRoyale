import { Command } from "./types"
import { MessageEmbed, TextChannel } from "discord.js"
import * as allCommands from "./commands/index"
import { client } from "./listener"
export const c = allCommands
export let prefix: string = process.env.prefix!
require('dotenv').config()
var commands: Command[] = c.default

//Express for hosting
const express = require('express');
const app = express();
app.use(express.static('public'));
const http = require('http');
//@ts-ignore
var _server = http.createServer(app);

app.get('/', (_request: any, response: any) => {
    response.sendFile(__dirname + "/index.html");
    //console.log(Date.now() + " Ping Received");
    response.sendStatus(200);
});

const listener = app.listen(process.env.PORT, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});

client.on("message", async message => {
    // Prevent the bot from replying to itself or other bots
    if (message.author.bot) {
        return;
    }

    var args: Array<string>;

    if (message.content.startsWith(process.env.prefix!)) {
        args = message.content.slice((process.env.prefix!.length)).trim().split(/ +/g);
    } else return;

    const commandName: string | undefined = args?.shift()?.toLowerCase();

    if (!commandName) return

    let command = commands.find(c => c.name.toLowerCase() === commandName)
    if(command?.groupCommand === true){
        command = commands.find(
            cmd => cmd.name.includes(args[0].toLowerCase())
        )

        args.slice(0, 2)
    }

    if (commandName === "test") {
        if (message.author.id !== process.env.owner) {
            return await message.reply("nah b")
        }

        message.channel.messages.fetch(args[0])
            .then(message => {
                console.log(message)
                console.log(`Message Content: ${message.content}`)
            })
            .catch(console.error);
    }

    else if (command) {
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
                await message.channel.send(new MessageEmbed()
                    .setColor("RED")
                    .setTitle("ERROR")
                    .addFields(
                        { name: 'Channel Name', value: `${(<TextChannel>await client.channels.fetch(message.channel.id)).name}`, inline: true },
                        { name: 'Channel Id', value: `${message.channel.id}`, inline: true },
                        { name: 'User', value: `${message.author.tag}`, inline: true },
                        { name: 'User Id', value: `${message.author.id}`, inline: true },
                    )
                    .setDescription(`\`\`\`${error.message}\n${error.stack}\`\`\``)
                    .setFooter("blitzwolfz#9338", "https://cdn.discordapp.com/avatars/239516219445608449/12fa541557ca2635a34a5af5e8c65d26.webp?size=512")
                )
            }
        }

        else {
            try {
                await command.execute(message, client, args)

            } catch (error) {
                console.log(error)
                let imgurl = (client.users.cache.get("239516219445608449")!.displayAvatarURL({ format: "webp", size: 512 }))
                await message.channel.send(new MessageEmbed()
                    .setFooter("blitzwolfz#9338", `${imgurl}`)
                    .setColor("RED")
                    .setTitle("ERROR")
                    .addFields(
                        { name: 'Channel Name', value: `${(<TextChannel>await client.channels.fetch(message.channel.id)).name}`, inline: true },
                        { name: 'Channel Id', value: `${message.channel.id}`, inline: true },
                        { name: 'User', value: `${message.author.tag}`, inline: true },
                        { name: 'User Id', value: `${message.author.id}`, inline: true },
                    )
                    .setDescription(`\`\`\`${error.message}\n${error.stack}\`\`\``)
                )
            }
        }
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
            .setDescription("Command does not exist. If you think this is in error please contact <@239516219445608449>")
            .setFooter("blitzwolfz#9338", `${imgurl}`)
        );
    }
})

process.env.dev! ? client.login(process.env.devtoken!) : client.login(process.env.token!)