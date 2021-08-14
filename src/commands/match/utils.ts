import type { Command, MatchList } from "../../types";
import { Client, Message, MessageAttachment, MessageEmbed, TextChannel } from "discord.js";
import { getConfig, getDoc, getMatch, updateMatch } from "../../db";
import { backwardsFilter, forwardsFilter, timeconsts, toHHMMSS } from "../util";
import Canvas from 'canvas';

export const reload_match: Command = {
    name: "reload-match",
    description: "This reload the voting portion of a match.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    async execute(message: Message, client: Client, args: string[]) {

        let match = await getMatch(message.channel.id);
        let channel = <TextChannel>await client.channels.cache.get(message.channel.id)!;
        for (let ms of match.messageID) {
            try {
                (await channel.messages.fetch(ms)).delete();
            } catch (error) {
                console.log(error.message);
            }

        }

        match.votingperiod = false;
        match.votetime = (Math.floor(Date.now() / 1000));
        match.p1.voters = [];
        match.p2.voters = [];
        match.p1.votes = 0;
        match.p2.votes = 0;
        match.messageID = [];

        await updateMatch(match);
        return message.reply("Reloading").then(async m => {
            await setTimeout(() => m.delete(), 1500);
        });
    }
};

export const endmatch: Command = {
    name: "end-match",
    description: "This will end the match.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    async execute(message: Message, client: Client, args: string[]) {

        let match = await getMatch(message.channel.id);
        return message.reply("Ending").then(async m => {
            match.votetime -= 7200;
            setTimeout(() => m.delete(), 1500);
            await updateMatch(match);
        });
    }
};

export const forcevote: Command = {
    name: "forcevote-match",
    description: "This will force the voting portion of a match to come.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    async execute(message: Message, client: Client, args: string[]) {

        let match = await getMatch(message.channel.id);

        match.votingperiod = false;
        match.split = false;
        match.p1.donesplit = false;
        match.p2.donesplit = false;

        await updateMatch(match);
    }
};

export const matchList: Command = {
    name: "matchlist",
    description: "View all the players fighting in brackets",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        let list: MatchList = await getDoc('config', "matchlist");
        let page: number = parseInt(args[0]) || 1;

        const m = <Message>(await message.channel.send({
            embeds:[
                await matchlistEmbed(page!, client, list.users)
            ]
        }));
        await m.react("⬅");
        await m.react("➡");

        const backwards = m.createReactionCollector({filter:backwardsFilter, time: 100000});
        const forwards = m.createReactionCollector({filter:forwardsFilter, time: 100000});

        backwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({
                embeds:[
                    await matchlistEmbed(--page, client, list.users)
                ]
            });
        });
        forwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({
                embeds:[
                    await matchlistEmbed(++page, client, list.users)
                ]
            });
        });
    }
};

export const matchStats: Command = {
    name: "match-stats",
    description: "View Match Statistics except voting.\mJust mention the channel name" + `\`!match-stats @Channel\``,
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        if (!message.mentions.channels.first()) {
            return message.reply("Please mention channel");
        }
        else {
            let m = await getMatch(message.mentions.channels.first()!.id!);

            if (!m) return message.reply("No match is in that channel.");

            let statsEmbed = new MessageEmbed()
            .setTitle(`Match Stats`)
            .setColor("LUMINOUS_VIVID_PINK")
            .setFooter("blitzwolfz#9338", "https://cdn.discordapp.com/avatars/239516219445608449/12fa541557ca2635a34a5af5e8c65d26.webp?size=512")
            .addFields({name: `${m.temp.istheme ? `Match theme:` : `Match template`}`, value: `${m.temp.link}`},


                {
                    name: `${(await client.users.cache.get(m.p1.userid)!).username} Meme Done:`,
                    value: `${m.p1.memedone ? `Yes` : `No`}`,
                    inline: true
                }, {
                    name: 'Match Portion Done:',
                    value: `${m.p1.donesplit ? `${m.split ? `Yes` : `Not a split match`}` : `No`}`,
                    inline: true
                }, {
                    name: 'Meme Link:',
                    value: `${m.p1.memedone ? `${m.p1.memelink}` : `No meme submitted yet`}`,
                    inline: true
                }, {
                    name: 'Time left',
                    value: `${m.p1.donesplit ? `${m.p1.memedone ? "Submitted meme" : `${45 - Math.floor(((Date.now() / 1000) - m.p1.time) / 60)} mins left`}` : `${m.split ? `Hasn't started portion` : `Time up`}`}`,
                    inline: true
                }, {name: '\u200B', value: '\u200B'},

                {
                    name: `${(await client.users.cache.get(m.p2.userid)!).username} Meme Done:`,
                    value: `${m.p2.memedone ? `Yes` : `No`}`,
                    inline: true
                }, {
                    name: 'Match Portion Done:',
                    value: `${m.p2.donesplit ? `${m.split ? `Yes` : `Not a split match`}` : `No`}`,
                    inline: true
                }, {
                    name: 'Meme Link:',
                    value: `${m.p2.memedone ? `${m.p2.memelink}` : `No meme submitted yet`}`,
                    inline: true
                }, {
                    name: 'Time left',
                    value: `${m.p2.donesplit ? `${m.p2.memedone ? "Submitted meme" : `${45 - Math.floor(((Date.now() / 1000) - m.p2.time) / 60)} mins left`}` : `${m.split ? `Hasn't started portion` : `Time up`}`}`,
                    inline: true
                }, {name: '\u200B', value: '\u200B'},

                {
                    name: `Voting period:`, value: `${m.votingperiod ? `Yes` : `No`}`, inline: true
                }, {
                    name: `Voting time:`,
                    value: `${m.votingperiod ? `${await toHHMMSS(timeconsts.match.votingtime, m.votetime)}` : "Voting has not started"}`,
                    inline: true
                });

            return await message.channel.send({
                embeds:[
                    statsEmbed
                ]
            });
        }
    }
};

async function matchlistEmbed(page: number = 1, client: Client, list: string[], ...rest: any[]) {

    page = page < 1 ? 1 : page;
    if (page > list.length) page = list.length - 1;
    const fields = [];
    let index = (0 + page - 1) * 10;
    for (let i = index; i < index + 10; i++) {

        try {
            fields.push({
                name: `${i + 1}) ${((await client.users.fetch(list[i])).username)}`, value: `UserID is: ${list[i]}`
            });
        } catch {

        }

    }

    return new MessageEmbed()
        .setTitle(`All the users in the bracket. You are on page ${page! || 1} of ${Math.floor(list.length / 10) + 1}. ${list.length} users.`)
        .setFields(fields)
        .setColor(`#${(await getConfig()).colour}`)
        .setTimestamp(new Date())
    ;
}

export async function matchcard(client: Client, channelid: string, users: string[]) {
    //let ch = <TextChannel>await client.channels.fetch(channelid);

    const canvas = Canvas.createCanvas(1917, 1168);
    const ctx = canvas.getContext('2d');

    let user1 = (await client.users.fetch(users[0]));
    let user2 = (await client.users.fetch(users[1]));
    const avatar = await Canvas.loadImage(user1.displayAvatarURL({format: 'png', size: 1024}));
    const avatar2 = await Canvas.loadImage(user2.displayAvatarURL({format: 'png', size: 1024}));

    await ctx.drawImage(avatar, ((canvas.height / 2) - 602.5), 300 - 26, 740, 636);
    //await ctx.drawImage(avatar, (529), 300-26, 740, 636);

    //((canvas.width/2)+731)
    await ctx.drawImage(avatar2, ((canvas.width / 2) + 270), 300 - 26, 740, 636);
    //await ctx.drawImage(avatar2, (320), 300-26, 740, 636);

    await ctx.drawImage(await Canvas.loadImage("https://cdn.discordapp.com/attachments/722616679280148504/870102057858793502/newbackground.png"), 0, 0, canvas.width, canvas.height);
    return new MessageAttachment(canvas.toBuffer(), 'matchcard.jpg');
    //const attachment = new MessageAttachment(canvas.toBuffer(), 'matchcard.jpg');
    //await message.channel.send({ files: [attachment]})
    // await ch.send(attachment);
}

export async function winner(client: Client, userid: string) {
    let user = await client.users.fetch(userid);
    const avatar = await Canvas.loadImage(user.displayAvatarURL({format: 'png', size: 512}));
    //console.log(avatar.data)

    const canvas = Canvas.createCanvas(1095, 597);
    const ctx = canvas.getContext('2d');
    //await ctx.drawImage(await Canvas.loadImage("winnercardnobackgroundwithname.png"), 0, 0, canvas.width,
    // canvas.height);

    //await ctx.drawImage(avatar, 547.5, 298.5, 200, 200);
    //@ts-ignore
    await ctx.fill("#FF0000");
    await ctx.save();
    await ctx.beginPath();
    await ctx.arc(1095 / 2, 597 / 2 - 70, 225, 0, Math.PI * 2, true);
    // ctx.fillStyle = "blue";
    // await ctx.fill();
    await ctx.closePath();
    await ctx.clip();
    await ctx.drawImage(avatar, 300 + 20, 26, 455, 455);

    //await ctx.drawImage(avatar, 25, 25, 200, 200);

    await ctx.restore();

    await ctx.drawImage(await Canvas.loadImage("https://cdn.discordapp.com/attachments/722616679280148504/870102003211190312/winnercardnobackgroundwithname.png"), 0, 0, canvas.width, canvas.height);

    const attachment = new MessageAttachment(canvas.toBuffer(), 'welcome-image.jpg');
    //await message.channel.send({ files: [attachment]})
    return attachment;


}

export async function grandwinner(client: Client, userid: string) {
    let user = await client.users.fetch(userid);
    const avatar = await Canvas.loadImage(user.displayAvatarURL({format: 'png', size: 512}));
    //console.log(avatar.data)

    const canvas = Canvas.createCanvas(1032, 648);
    const ctx = canvas.getContext('2d');

    //@ts-ignore
    ctx.fill("#FF0000");
    await ctx.save();
    await ctx.beginPath();
    await ctx.arc(1032 / 2, 648 / 2 - 70, 225, 0, Math.PI * 2, true);
    // ctx.fillStyle = "blue";
    // await ctx.fill();
    await ctx.closePath();
    await ctx.clip();
    await ctx.drawImage(avatar, 220, 15, 550, 550);

    //await ctx.drawImage(avatar, 25, 25, 200, 200);

    await ctx.restore();

    await ctx.drawImage(await Canvas.loadImage("https://cdn.discordapp.com/attachments/722616679280148504/870102028062429284/Tourneywinner.png"), 0, 0, canvas.width, canvas.height);

    const attachment = new MessageAttachment(canvas.toBuffer(), 'welcome-image.jpg');
    //await message.channel.send({ files: [attachment]})
    return attachment;


}
