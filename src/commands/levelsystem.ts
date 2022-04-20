import type { Command, levelProfile } from "../types";
//@ts-ignore
import { Client, Message, MessageAttachment } from "discord.js";
import { getDoc, insertDoc } from "../db";
import { createCanvas, loadImage } from "canvas";
import { getAverageColor } from "fast-average-color-node";

export async function levelCalc(i:number){
    return ((25 * (i ** 2)) + (50 * i)) + 100;
}

export const level: Command = {
    name: "level",
    aliases:["rank"],
    description: "Check your level",
    group: "level-system",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let imgurl = args[0] ?
            (
                [...message.mentions.users.values()].length === 1
                ? client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL({format:"png"})
                :client.users.cache.get(args[0])!.displayAvatarURL({format:"png"})
            )
            : message.author.displayAvatarURL({format:"png"});
        let tag = args[0] ?
            (
                [...message.mentions.users.values()].length === 1
                ? client.users.cache.get(message.mentions.users.first()!.id)!.tag
                : client.users.cache.get(args[0])!.tag
            )
            : message.author.tag;

        let id = args[0] ?
            (
                [...message.mentions.users.values()].length === 1
                ? message.mentions.users.first()!.id
                : args[0]
            )
            : message.author.id;

        let profile:levelProfile = await getDoc("levels", id)

        if(!profile){
            profile = {
                _id:message.author.id,
                xp: 0,
                level: 1,
                timeStamp:(Math.floor(Math.floor(Date.now()/1000)/60) * 60)
            }

            await insertDoc("levels", profile)
        }

        let image = await draw({
            backgroundSource: "https://cdn.discordapp.com/attachments/798975443058556968/861426186512760842/levelBackground.png",
            avatarSource: imgurl, // string
            username: tag, // string
            xpMax: await levelCalc(profile.level), // number
            xpCurrent: profile.xp, // number
            currentLevel: profile.level // number
        });

        await message.channel.send({files:[new MessageAttachment(image, "level.png")]})
    }
};

/**
 * @param {{backgroundSource?:string,avatarSource?:string,username?:string,xpMax?:Number,xpCurrent?:number,currentLevel?:number}} opts
 */
export async function draw(opts: { backgroundSource: string, avatarSource: string, username: string, xpMax: number, xpCurrent: number, currentLevel: number }) {

    const canvas = createCanvas(350, 132);
    const ctx = canvas.getContext("2d");

    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const avatarImage = await loadImage(opts.avatarSource);
    const bgImage = await loadImage(opts.backgroundSource);

    let avatarAVGColor = await getAverageColor(opts.avatarSource);

    ctx.drawImage(bgImage, 0, 0, bgImage.width > canvas.width ? bgImage.width : canvas.width, bgImage.height > canvas.height ? bgImage.height : canvas.height);

    ctx.globalAlpha = 0.3;

    // await chillout.repeat(8, () => {
    //     ctx.drawImage(canvas, 1, 0, canvas.width - 1, canvas.height, 0, 0, canvas.width - 1, canvas.height);
    //     ctx.drawImage(canvas, 0, 1, canvas.width, canvas.height - 1, 0, 0, canvas.width, canvas.height - 1);
    // });

    await ctx.drawImage(canvas, 1, 0, canvas.width - 1, canvas.height, 0, 0, canvas.width - 1, canvas.height);
    await ctx.drawImage(canvas, 0, 1, canvas.width, canvas.height - 1, 0, 0, canvas.width, canvas.height - 1);

    ctx.globalAlpha = 1;

    ctx.fillStyle = "#00000077";
    ctx.fillRect(8, 8, canvas.width - 16, canvas.height - 16);

    let generalPadding = 16;
    let avatarX = 16;
    let avatarY = 16;
    let avatarSize = 100;
    ctx.fillStyle = `${avatarAVGColor.hex}ee`;
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    let avatarPadding = 4;
    ctx.drawImage(avatarImage, avatarX + avatarPadding, avatarY + avatarPadding, avatarSize - avatarPadding * 2, avatarSize - avatarPadding * 2);

    ctx.fillStyle = "#fffffffe";
    ctx.font = "bold 20px 'Trebuchet MS'";
    //if(opts.username.length >= 17) ctx.font = "bold 16px 'Trebuchet MS'";
    ctx.fillText(threeDots(opts.username, 17), avatarX + avatarSize + generalPadding / 2, avatarY);

    ctx.fillStyle = "#ffffffee";
    ctx.font = "20px 'Trebuchet MS'";
    ctx.fillText(`${await toWordsconver(opts.xpCurrent)} / ${await toWordsconver(opts.xpMax)} | ${opts.currentLevel} LVL`, avatarX + avatarSize + generalPadding / 2, avatarY * 2 + generalPadding / 2);

    ctx.fillStyle = "#00000070";
    let barBorderX = avatarX + avatarSize + generalPadding / 2;
    let barBorderHeight = 24;
    let barBorderWidth = canvas.width - barBorderX - generalPadding;
    let barBorderY = canvas.height - avatarY - barBorderHeight;
    ctx.fillRect(barBorderX, barBorderY, barBorderWidth, barBorderHeight);

    ctx.fillStyle = `${avatarAVGColor.hex}ee`;
    let barPadding = 4;

    ctx.fillRect(barBorderX + barPadding, barBorderY + barPadding, percent(opts.xpCurrent, opts.xpMax, barBorderWidth - barPadding * 2), barBorderHeight - barPadding * 2);

    return canvas.toBuffer("image/png");
}

function threeDots(t: any, ml: any) {
    return t.length > ml ? t.slice(0, ml - 1) + "…" : t;
}

function percent(part = 1, total = 100, maxVal = 100, nanVal = 0) {
    let val = (part / total) * maxVal;
    return isNaN(val) ? nanVal : val;
}

async function toWordsconver(s: number) {
    if (s <= 999) {
        return s.toString();
    }

    else if (s <= 9999) {
        if (parseInt(s.toString()[1]) > 0) {
            return s.toString().slice(0, 1) + "." + s.toString().slice(1, 2) + "k";
        }
        return s.toString().slice(0, 1) + "k";
    }

    else if (s <= 99999) {
        if (parseInt(s.toString()[2]) > 0) {
            return s.toString().slice(0, 2) + "." + s.toString().slice(2, 3) + "k";
        }
        return s.toString().slice(0, 2) + "k";
    }

    else if (s <= 999999) {
        if (parseInt(s.toString()[3]) > 0) {
            return s.toString().slice(0, 3) + "." + s.toString().slice(3, 4) + "k";
        }
        return s.toString().slice(0, 3) + "k";
    }

}

export default [
    level
];