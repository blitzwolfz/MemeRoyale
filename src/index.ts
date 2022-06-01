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
import { writeFileSync, readFileSync } from "fs";

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
    
        let channel = <TextChannel>client.channels.cache.get(args[0]);
        let b = <string | undefined> undefined;
        let a = <string | undefined> undefined;
        
        if(args[3]) b = args[3];
        if(args[2]) a = args[2];
    
        let msg = await fetchManyMessages(channel, parseInt(args[1]), b, a)

        for(let m of [...msg.values()]) {
                await message.channel.send(m.url)
        }
    
        return;
    }
    
    if (commandName === "signup-copy") {
        //@ts-ignore
        let oldSignup: Signups = await getDoc("config", "signups");
        
        for (let id of oldSignup.users) {
            let u = await client.users.cache.get(id);

            if (!u) continue;

            await message.channel.send(`ID: ${u.id} | Tag:${u.tag} | <@${u.id}>`)
        }

        let arr: {id:string, tag:string}[] = [];

        for (let id of oldSignup.users) {
            let u = await client.users.cache.get(id);

            if (!u) continue;

            arr.push({id:u.id, tag:u.tag});
        }

        let u2 = {
            "data":arr
        }
        
        let json = JSON.stringify(u2);

        //@ts-ignore
        await writeFileSync('./signup.json', json, 'utf8', function (err:Error) {
          if (err) return console.log(err);
        })

        const buffer = readFileSync("./signup.json");
        const attachment = new MessageAttachment(buffer, 'signup.json');

        await message.channel.send({attachments:[attachment]});


        return;
    }
    
    if (commandName === "qfs") {
        let channel = await <TextChannel>client.channels.cache.get(args[0]);
        
        let m = (await channel.messages.fetch(args[1]))!
        let fields = m.embeds[0]!.fields
        
        for(let f of fields) {
            //@ts-ignore
           f.value = f.value.split(" ").slice(0, 5).join(" ")
               + " "
               + Math.floor(parseInt(f.value.split(" ")[5].replace("%", ""))/100).toString()
               + "% "
               + f.value.split(" ").slice(6).join(" ")
        }
        
        channel.send({
            embeds:[
                new MessageEmbed()
                    .setTitle(`Votes for ${channel.name} are in!`)
                    .setDescription(`No votes for this qualifier`)
                    .setFields(fields)
                    .setColor(`#${(await getConfig()).colour}`)
                    .setTimestamp(new Date())
            ]
        }).then(async m => {
            await channel.setTopic(m.id)
        })
        
        return
    }
    
    if (commandName === "dmu") {
        console.log(args)
        
        let messageToSend = args.slice(args.findIndex(x => x.toLowerCase() === "message:")+1).join(" ");
        
        console.log(messageToSend)
        
        for(let u of [...message.mentions.users.values()]) {
            await u.send(messageToSend)
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
            console.log("Running Command: %s", command.name)
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
            let emoteFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === `${emote}` && !user.bot && user.id === message.author.id;
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
            if (command.admins && (message.author.id === process.env.owner 
                || message.member?.roles.cache.find(x => x.name.toLowerCase() === "commissioner"))) {
                await command.execute(message, client, args, process.env.owner);
            }
            else if (command.mods && (message.author.id === process.env.owner
                || (message.member?.roles
                    .cache.find(x => ["commissioner", "mod", "referee"].includes(x.name.toLowerCase()))))) {
                await command.execute(message, client, args, process.env.owner);
            }
            else if (command.owner && message.author.id === process.env.owner) {
                await command.execute(message, client, args, process.env.owner);
            }
            else {
                return message.reply("You are not allowed to use this command");
            }

        } catch (err) {
            message.channel.send(<string>await commandError(message, client, err, true, err));
        }
    }
    else {
        try {
            await command.execute(message, client, args);

        } catch (err) {
            message.channel.send(<string>await commandError(message, client, err, true, err));
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