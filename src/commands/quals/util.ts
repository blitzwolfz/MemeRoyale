import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { getConfig, getDoc, getProfile, getQual, updateDoc, updateProfile, updateQual } from "../../db";
import type { Command, MatchList } from "../../types";


export const reload_qual: Command = {
    name: "reload-qual",
    description: "This reload the voting portion of a Qualifier.",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {

        let match = await getQual(message.channel.id);
        let channel = <TextChannel>await client.channels.cache.get(message.channel.id)!;
        for (let ms of match.messageID) {
            try {
                await (await channel.messages.fetch(ms)).delete();
            } catch {
                continue;
            }
        }

        for (let p of match.players) {
            p.votes = [];
        }

        match.votingperiod = false;
        match.messageID = []

        await updateQual(match);
        return message.reply("Reloading").then(async m => {
            await setTimeout(() => m.delete(), 1500);
        });
    }
};

export const qual_stats: Command = {
    name: "qual-stats",
    description: "View Qualifier Statistics except voting.\mJust mention the channel name" + `\`!qual-stats @Channel\``,
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        if (!message.mentions.channels.first()) {
            return message.reply("Please mention channel");
        }
        else {
            let q = await getQual(message.mentions.channels.first()!.id!);

            if (!q) return message.reply("No qualifier is in that channel.");

            let statsEmbed = new MessageEmbed()
            .setTitle(`Qual Stats`)
            .setColor("LUMINOUS_VIVID_PINK")
            .setFooter("blitzwolfz#9338", "https://cdn.discordapp.com/avatars/239516219445608449/12fa541557ca2635a34a5af5e8c65d26.webp?size=512");

            for (let p of q.players) {
                statsEmbed.addFields({
                    name: `${(await client.users.cache.get(p.userid)!).username} Meme Done:`,
                    value: `${p.memedone ? `Yes` : `No`}`,
                    inline: true
                }, {name: 'Match Portion Done:', value: `${p.split ? `Yes` : `No`}`, inline: true}, {
                    name: 'Meme Link:', value: `${p.memedone ? `${p.memelink}` : `No meme submitted yet`}`, inline: true
                }, {
                    name: 'Time left',
                    value: `${p.split ? `${p.memedone ? "Submitted meme" : `${30 - Math.floor(((Date.now() / 1000) - p.time) / 60)} mins left`}` : `${p.split ? `Hasn't started portion` : `Time up`}`}`,
                    inline: true
                }, {name: '\u200B', value: '\u200B'});
            }

            return await message.channel.send({
                embeds:[
                    statsEmbed
                ]
            });
        }
    }
};

export const qual_result_sum: Command = {
    name: "qra",
    description: "`!qra <msg id> <msg id>`",
    group: "qual",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {

        if (args.length <= 1 && args.length >= 2) return message.reply("Please supply two msg ids.");

        let channel = <TextChannel>await client.channels.cache.get(message.channel.id);

        let emm = await QualifierResults(channel, client, [
            args[0],
            args[1]
        ]);

        await message.channel.send({
            embeds:[
                emm
            ]
        }).then(async m => m.react('👌'));

        await (await (<TextChannel>client.channels.cache.get("722291182461386804")))
        .send({
            embeds:[
                emm
            ]
        });
    }
};

export const forcevote_qual: Command = {
    name: "forcevote-qual",
    description: "This will force the voting portion of a match to come.",
    group: "quals",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {

        // let match = await getQual(message.channel.id)

        // match.votingperiod = false


        // await updateQual(match)

        return message.reply("Unfinished. Contact <@239516219445608449>");

    }
};

export async function QualifierResults(channel: TextChannel, client: Client, ids: string[]) {
    let msgArr: Message[] = [];

    for (let i of ids) {
        msgArr.push(await channel.messages.fetch(i));
    }


    let finalResults: Array<{
        name: string, value: number
    }> = [];

    console.log(finalResults);

    for (let msg of msgArr) {
        let embed = msg.embeds[0]!;

        for (let f of embed.fields) {
            let key = `${f.value.match(/\d+/g)?.splice(1)[1]}`.toString();
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

    finalResults.sort(function (a, b) {
        return b.value - a.value;
    });

    for (let f of finalResults) {
        //@ts-ignore
        //Ik types are important, but sometimes you want to cheat 
        //and do this since it's much easier to work with lol
        f.value = `Got ${f.value} in total | UserID:${f.name}`;
        f.name = (await client.users.fetch(f.name)).username;
    }

    return new MessageEmbed()
        .setTitle(`Final Results for Group ${channel.name}`)
        .setDescription(`Players with highest move on`)
        .setFields(
            //@ts-ignore
            finalResults
        )
        .setColor(`#${(await getConfig()).colour}`)
        .setTimestamp(new Date())
        ;
}

export const qual_winner: Command = {
    name: "dqw",
    description: "!dqw <@mentions>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[], owner: "2", silentargs: string[]) {
        let ids: string[] = ([...message.mentions.users.values()].map(a => a.id).length >= 1 ? [...message.mentions.users.values()].map(a => a.id) : args);
        let list: MatchList = await getDoc('config', "matchlist");

        if (list) {
            for (let id of ids) {
                if (list.users.includes(id)) {
                    return message.channel.send("User has already been added.");
                }

                else {
                    list.users.push(id);
                    try{
                        let u = await getProfile(id);
                        u.wins += 1;
                        u.points += 25;
                        await updateProfile(u);
                    } catch {
                        console.log("No profile.")
                    }

                    try{
                        await client.users.cache.get(id)?.send("Congrats on winning your qualifer. Now get ready for the bracket portion");
                    } catch {
                        console.log("Not allowed to send it")
                    }
                    await message.channel.send(`Congrats on winning your qualifer <@${id}>!`);
                }
            }
            await updateDoc('config', list._id, list);
            if ([...message.mentions.users.values()].map(a => a.id).length >= 1) {
                return message.reply("Added users.");
            }

            else {
                message.channel.send(`<@${silentargs[0]}>, Added users.`);
                return;
            }
        }
    }
};

export const removeQualWinner: Command = {
    name: "rqw",
    description: "!rqw <@mentions>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[], owner: "2", silentargs: string[]) {
        let ids: string[] = ([...message.mentions.users.values()].map(a => a.id).length >= 1 ? [...message.mentions.users.values()].map(a => a.id) : args);
        let list: MatchList = await getDoc('config', "matchlist");

        if (list) {
            let index = list.users.indexOf(ids[0]);

            if (index === -1) return message.reply("User is not in list");

            list.users.splice(index, 1)
            await updateDoc('config', list._id, list);

            try{
                let u = await getProfile(ids[0]);
                u.wins -= 1;
                u.points -= 25;
                await updateProfile(u);
            } catch {
                console.log("No profile.")
            }

            message.channel.send(`<@${message.author.id}>, Removed <@${ids[0]}>.`);
            return;
        }
    }
};