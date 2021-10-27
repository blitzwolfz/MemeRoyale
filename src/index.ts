import { Client, Message, MessageAttachment, MessageEmbed, MessageReaction, TextChannel, User } from "discord.js";
import express from "express";
import { closest } from "fastest-levenshtein";
import http from "http";
import * as path from "path";
import { app } from "./api/router";
import * as allCommands from "./commands/index";
import { draw, levelCalc } from "./commands/levelsystem";
import { fetchManyMessages } from "./commands/util";
import { getConfig, getDoc, insertDoc, updateDoc } from "./db";
import { client } from "./listeners/index";
import type { Command, levelProfile, Signups } from "./types";

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
    if (message.author.id !== process.env.owner && message.channel.type !== "DM" && await (await getConfig()).servers.includes(message.guild!.id!)) return;
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
        //Always
        return;
    }

    if (commandName === "bitch") {
    
        let channel = <TextChannel>client.channels.cache.get("722291182461386804");
    
        let msg = await fetchManyMessages(channel, parseInt(args[0]))
        
        console.log([...msg.values()].length)
    
        let finalResults: Array<{
            name: string, value: number
        }> = [];
    
        for(let m of [...msg.values()]) {
            let embed = m.embeds[0]!
            if (!embed) continue;
            if (!embed.title?.includes("Final Results")) continue
            // console.log(embed)
            
        
            for (let f of embed.fields) {
                console.log(f.value)
                console.log(f.value.match(/\d+/g)!)
                let u = (await client.users.fetch(`${f.value.match(/\d+/g)![1]}`))
                let key = u.tag;
                
                if (!finalResults.find(x => x.name === key)) {
                    finalResults.push({
                        name: key, value: parseInt(f.value.match(/\d+/g)?.splice(1)[0]!)
                    });
                }
            
                else {
                    finalResults[finalResults.findIndex(x => x.name === key)].value += parseInt(f.value.match(/\d+/g)?.splice(1)[0]!);
                }
            }
        
        }
    
        let signup: Signups = await getDoc("config", "signups");
        
        // @ts-ignore
        let arr = finalResults.filter(x => !signup.users.includes((y:string) => x.value === parseInt(y)))
        console.log(arr)
        for(let a of arr) {
            await message.channel.send(`<@${a.value}> | ${a.name} is a bitch`)
        }
    
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

        if (!command.serverOnlyCommand || (command.serverOnlyCommand && message.guild!.id === "719406444109103117")) {
            console.log("Running Command")
            await runCommand(command, message, client, args);
        }

        else return;
    }

    else if (!command && message.guild!.id === "719406444109103117") {
        //let imgurl = (client.users.cache.get("239516219445608449")!.displayAvatarURL({ format: "webp", size: 512 }))
        await message.channel.send({embeds:[<MessageEmbed> await commandError(message, client, commandName, false)]}).then(async mssg => {
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
            else if (command.mods && (message.author.id === process.env.owner
                || (message.member?.roles.cache.find(x => x.name.toLowerCase() === "commissioner")
                    || (message.member?.roles.cache.find(x => x.name.toLowerCase().includes("mod")))
                    || message.member?.roles.cache.find(x => x.name.toLowerCase() === "referee")))) {
                await command.execute(message, client, args, process.env.owner);
            }
            else if (command.owner && message.author.id === process.env.owner) {
                await command.execute(message, client, args, process.env.owner);
            }
            else {
                return message.reply("You are not allowed to use this command");
            }

        } catch (error) {
            message.channel.send(<string>await commandError(message, client, error, true, error));
        }
    }
    else {
        try {
            await command.execute(message, client, args);

        } catch (error) {
            message.channel.send(<string>await commandError(message, client, error, true, error));
        }
    }
}

async function commandError(message: Message, client: Client, name:string, exist?: boolean, err?: any): Promise<MessageEmbed | string> {
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
        let errorChannel = <TextChannel>client.channels.cache.get("889897949579063336");

        await errorChannel.send({
            embeds: [
                em
            ],
            content: `<@239516219445608449>, <@${message.author.id}> caused this error. Happened in Channel <#${message.channel.id}>`
        })


        return "A command error has happened. blitzwolfz has been notified.";
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

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});


// .setColor(`#${(await getConfig()).colour}`)
// [...message.attachments.values()]
// (reaction: MessageReaction, user:User)
// [...message.mentions.users.values()]
// setTimeout(() => m.delete(), 10000);
// [...message.mentions.channel.values()]