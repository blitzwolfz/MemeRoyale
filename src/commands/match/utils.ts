import { Command, MatchList } from "../../types"
import { Client, Message, MessageAttachment, TextChannel, } from "discord.js"
import { getDoc, getMatch, updateMatch } from "../../db"
import { backwardsFilter, forwardsFilter } from "../util"
import Canvas from 'canvas';

export const reload_match: Command = {
    name: "reload-match",
    description: "This reload the voting portion of a match.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {

        let match = await getMatch(message.channel.id)
        let channel = <TextChannel>await client.channels.cache.get(message.channel.id)!
        for (let ms of match.messageID) {
            (await channel.messages.fetch(ms)).delete()
        }

        match.votingperiod = false
        match.votetime = (Math.floor(Date.now() / 1000))
        match.p1.voters = []
        match.p2.voters = []
        match.p1.votes = 0
        match.p2.votes = 0

        await updateMatch(match)
        return message.reply("Reloading").then(m =>{
            m.delete({timeout:1500})
        })
    }
}

export const forcevote: Command = {
    name: "forcevote-match",
    description: "This will force the voting portion of a match to come.",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {

        let match = await getMatch(message.channel.id)

        match.votingperiod = false
        match.split = false
        match.p1.donesplit = false
        match.p2.donesplit = false

        await updateMatch(match)
    }
}

export const matchlist: Command = {
    name: "matchlist",
    description: "View all the players fighting in brackets",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let list: MatchList = await getDoc('config', "matchlist")
        let page: number = parseInt(args[0]) || 1

        const m = <Message>(await message.channel.send({ embed: await matchlistEmbed(page!, client, list.users) }));
        await m.react("⬅")
        await m.react("➡");

        const backwards = m.createReactionCollector(backwardsFilter, { time: 100000 });
        const forwards = m.createReactionCollector(forwardsFilter, { time: 100000 });

        backwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({ embed: await matchlistEmbed(--page, client, list.users) });
        });
        forwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({ embed: await matchlistEmbed(++page, client, list.users) });
        });
    }
}

async function matchlistEmbed(page: number = 1, client: Client, list: string[], ...rest: any[]) {

    page = page < 1 ? 1 : page;
    if (page > list.length) page = list.length - 1
    const fields = [];
    let index = (0 + page - 1) * 10
    for (let i = index; i < index + 10; i++) {

        try {
            fields.push({
                name: `${i + 1}) ${await (await client.users.fetch(list[i])).username}`,
                value: `UserID is: ${list[i]}`
            });
        }
        catch {
            continue;
        }

    }

    return {
        title: `All the users in the bracket. You are on page ${page! || 1} of ${Math.floor(list.length / 10) + 1}`,
        fields,
        color: "#d7be26",
        timestamp: new Date()
    };
}

export async function matchcard(client:Client, channelid:string, users:string[]) {
    let ch = <TextChannel> await client.channels.fetch(channelid)

    const canvas = Canvas.createCanvas(1917 , 1168);
	const ctx = canvas.getContext('2d');

    let user1 = (await client.users.fetch(users[0]))
	let user2 = (await client.users.fetch(users[1]))
	const avatar = await Canvas.loadImage(user1.displayAvatarURL({ format: 'png', size: 1024}));
    const avatar2 = await Canvas.loadImage(user2.displayAvatarURL({ format: 'png', size: 1024}));

	await ctx.drawImage(avatar, ((canvas.height/2)-602.5), 300-26, 740, 636);
	//await ctx.drawImage(avatar, (529), 300-26, 740, 636);

	//((canvas.width/2)+731)
	await ctx.drawImage(avatar2, ((canvas.width/2)+270), 300-26, 740, 636);
	//await ctx.drawImage(avatar2, (320), 300-26, 740, 636);

	await ctx.drawImage(await Canvas.loadImage("newbackground.png"), 0, 0, canvas.width, canvas.height);

	const attachment = new MessageAttachment(canvas.toBuffer(), 'matchcard.jpg');
	//await message.channel.send({ files: [attachment]})
	await ch.send(attachment)
}

export async function winner(client: Client, userid: string){
	let user = await client.users.fetch(userid)
	const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'png', size: 512}));
	//console.log(avatar.data)

    const canvas = Canvas.createCanvas(1095, 597);
	const ctx = canvas.getContext('2d');
	//await ctx.drawImage(await Canvas.loadImage("winnercardnobackgroundwithname.png"), 0, 0, canvas.width, canvas.height);

    //await ctx.drawImage(avatar, 547.5, 298.5, 200, 200);
    //@ts-ignore
	await ctx.fill( "#FF0000")
	await ctx.save();
	await ctx.beginPath();
	await ctx.arc(1095/2, 597/2 - 70, 225, 0, Math.PI * 2, true);
	// ctx.fillStyle = "blue";
	// await ctx.fill();
	await ctx.closePath();
	await ctx.clip()
	await ctx.drawImage(avatar, 300+20, 26, 455 , 455);

	//await ctx.drawImage(avatar, 25, 25, 200, 200);
	
	await ctx.restore();

	await ctx.drawImage(await Canvas.loadImage("winnercardnobackgroundwithname.png"), 0, 0, canvas.width, canvas.height);

	const attachment = new MessageAttachment(canvas.toBuffer(), 'welcome-image.jpg');
	//await message.channel.send({ files: [attachment]})
	return attachment


}

export async function grandwinner(client: Client, userid: string){
	let user = await client.users.fetch(userid)
	const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'png', size: 512}));
	//console.log(avatar.data)

    const canvas = Canvas.createCanvas(1032, 648);
	const ctx = canvas.getContext('2d');
	//await ctx.drawImage(await Canvas.loadImage("winnercardnobackgroundwithname.png"), 0, 0, canvas.width, canvas.height);

    //await ctx.drawImage(avatar, 547.5, 298.5, 200, 200);
    //@ts-ignore
	ctx.fill("#FF0000")
	await ctx.save();
	await ctx.beginPath();
	await ctx.arc(1032/2, 648/2 - 70, 225, 0, Math.PI * 2, true);
	// ctx.fillStyle = "blue";
	// await ctx.fill();
	await ctx.closePath();
	await ctx.clip()
	await ctx.drawImage(avatar, 220, 15, 550 , 550);

	//await ctx.drawImage(avatar, 25, 25, 200, 200);
	
	await ctx.restore();

	await ctx.drawImage(await Canvas.loadImage("Tourneywinner.png"), 0, 0, canvas.width, canvas.height);

	const attachment = new MessageAttachment(canvas.toBuffer(), 'welcome-image.jpg');
	//await message.channel.send({ files: [attachment]})
	return attachment


}
