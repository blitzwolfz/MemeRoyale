const glob = require("glob") // included by discord.js allow this import
import { promisify } from "util" // Included by default
import { Command } from "./types"
import * as Discord from "discord.js"
require('dotenv').config()

//@ts-ignore
const globPromise = promisify(glob)

export const client = new Discord.Client({partials: ["CHANNEL", "CHANNEL", "MESSAGE", "REACTION", "USER"]});

export let prefix: string = process.env.prefix!
import * as c from "./commands/index"
import { connectToDB, getMatch, getQual, updateMatch } from "./db"
import { backgroundMatchLoop } from "./commands/match/background"
import { backgroundQualLoop } from "./commands/quals/background"
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
    console.log(Date.now() + " Ping Received");
    response.sendStatus(200);
});

const listener = app.listen(process.env.PORT, () => {
    console.log('Your app is listening on port ' + listener.address().port);
});

client.once("ready", async () => {
    await connectToDB()

    // let obj:Signups = {
    //     _id:"signups",
    //     open:false,
    //     users:[]
    // }

    // let obj2:MatchList = {
    //     _id:"matchlist",
    //     url:"",
    //     users:[]
    // }

    // let obj3:QualList = {
    //     _id:"quallist",
    //     users:[]
    // }

    // let obj4:VerificationForm = {
    //     _id:"verificationform",
    //     user:[]
    // }

    // await insertDoc('config', obj)
    // await insertDoc('config', obj2)
    // await insertDoc('config', obj3)
    // await insertDoc('config', obj4)

    setInterval(async function () {
        await backgroundMatchLoop(client)
        await backgroundQualLoop(client)
    }, 15000)

    console.log("\n")
    console.log(`Logged in as ${client.user?.tag}\nPrefix is ${prefix}`)
    console.log(`In ${client.guilds.cache.size} servers\nTotal users is ${client.users.cache.size}`)

})

client.on("messageReactionAdd", async (messageReaction, user) => {
    if (user.id === "722303830368190485") return;
    if (user.bot) return;

    if (messageReaction.partial) await messageReaction.fetch();
    if (messageReaction.message.partial) await messageReaction.message.fetch();
    
    if (messageReaction.emoji.name === '1️⃣') {
        if (user.bot) return;
        let m = await getMatch(messageReaction.message.channel.id)
        if (!m) return;
        messageReaction.users.remove(user.id)
        if (m.p1.userid === user.id || m.p2.userid === user.id) return user.send("Can't vote in your own match");
        m.p1.voters.push(user.id)
        m.p1.votes += 1

        if (m.p2.voters.includes(user.id)) {
            m.p2.voters.splice(m.p2.voters.indexOf(user.id), 1)
            m.p2.votes -= 1
        }

        await updateMatch(m)
        await user.send(`Vote counted for Player 1's memes in <#${m._id}>. You gained 2 points for voting`)
    }

    if (messageReaction.emoji.name === '2️⃣') {
        if (user.bot) return;
        let m = await getMatch(messageReaction.message.channel.id)
        if (!m) return;
        messageReaction.users.remove(user.id)
        if (m.p1.userid === user.id || m.p2.userid === user.id) return user.send("Can't vote in your own match");
        m.p2.voters.push(user.id)
        m.p2.votes += 1

        if (m.p1.voters.includes(user.id)) {
            m.p1.voters.splice(m.p1.voters.indexOf(user.id), 1)
            m.p1.votes -= 1
        }
        
        await updateMatch(m)
        await user.send(`Vote counted for Player 2's memes in <#${m._id}>. You gained 2 points for voting`)
    }

    if (messageReaction.emoji.name === '🅰️'){
        await messageReaction.users.remove(user.id)
        let m = await getMatch(messageReaction.message.channel.id)

        if(!user.client.guilds.cache.get(messageReaction.message.guild!.id)!
        .members.cache.get(user.id)!.roles.cache
        .find(x => x.name.toLowerCase() === "referee") && m.p1.userid !== user.id){
            return user.send("No.")
        }
        return c.default.find(c => c.name.toLowerCase() === "start-split")?.execute(messageReaction.message, client, [m.p1.userid])
    }

    if (messageReaction.emoji.name === '🅱️'){
        await messageReaction.users.remove(user.id)
        let m = await getMatch(messageReaction.message.channel.id)

        if(!user.client.guilds.cache.get(messageReaction.message.guild!.id)!
        .members.cache.get(user.id)!.roles.cache
        .find(x => x.name.toLowerCase() === "referee") && m.p2.userid !== user.id){
            return user.send("No.")
        }
        return c.default.find(c => c.name.toLowerCase() === "start-split")?.execute(messageReaction.message, client, [m.p2.userid])
    }

    if(['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'].includes(messageReaction.emoji.name)){
        await messageReaction.users.remove(user.id)
        if (!await (await getQual(messageReaction.message.channel.id)).players.some(x => x.userid === user.id) || !!user.client.guilds.cache
            .get(messageReaction.message.guild!.id)!
            .members.cache.get(user.id)!.roles.cache
            .find(x => x.name.toLowerCase() === "referee") === false) {
                return;
        };
        let m = await getQual(messageReaction.message.channel.id)
        if (!m) return;
        let pos = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'].indexOf(messageReaction.emoji.name)
        c.default.find(c => c.name.toLowerCase() === "start-qual")?.execute(messageReaction.message, client, [m.players[pos].userid])
    }
})

client.on("message", async message => {
    // Prevent the bot from replying to itself or other bots
    if (message.author.bot) {
        return
    }

    var args: Array<string>;

    if (message.content.startsWith(process.env.prefix!)) {
        args = message.content.slice((process.env.prefix!.length)).trim().split(/ +/g);
    } else return;

    const commandName: string | undefined = args?.shift()?.toLowerCase();

    if (!commandName) return

    const command = commands.find(c => c.name.toLowerCase() === commandName)

    if (commandName === "test") {
        if (message.author.id !== process.env.owner && !process.env.mods?.split(",").includes(message.author.id)) {
            return await message.reply("nah b")
        }
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
                await message.channel.send(new Discord.MessageEmbed()
                    .setColor("RED")
                    .setTitle("ERROR")
                    .addFields(
                        { name: 'Channel Name', value: `${(<Discord.TextChannel>await client.channels.fetch(message.channel.id)).name}`, inline: true },
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
                await message.channel.send(new Discord.MessageEmbed()
                    .setFooter("blitzwolfz#9338", "https://cdn.discordapp.com/avatars/239516219445608449/12fa541557ca2635a34a5af5e8c65d26.webp?size=512")
                    .setColor("RED")
                    .setTitle("ERROR")
                    .addFields(
                        { name: 'Channel Name', value: `${(<Discord.TextChannel>await client.channels.fetch(message.channel.id)).name}`, inline: true },
                        { name: 'Channel Id', value: `${message.channel.id}`, inline: true },
                        { name: 'User', value: `${message.author.tag}`, inline: true },
                        { name: 'User Id', value: `${message.author.id}`, inline: true },
                    )
                    .setDescription(`\`\`\`${error.message}\n${error.stack}\`\`\``)
                )
            }
        }
    }
})
console.log(process.env.dev!)

if (process.env.dev!) client.login(process.env.devtoken!)
else client.login(process.env.token!)