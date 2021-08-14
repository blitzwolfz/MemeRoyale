import type { Client, Message, TextChannel } from "discord.js";
import { MessageEmbed } from "discord.js";
import type { Command, verificationDoc } from "../types";
import { getConfig, getDoc, updateDoc } from "../db";


export const manualverify: Command = {
    name: "manualverify",
    aliases: ["mv"],
    description: "`!manualverify name @mention`",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        if (!args[0]) {
            return message.reply("Please supply a name.");
        }

        if (!message.mentions.users.first()) {
            return message.reply("Please mention someone.");
        }

        let guild = message.guild!;
        let gm = await guild.members.fetch(message.mentions.users.first()!.id);
        try{
            await gm.setNickname(args[0]);
            await gm?.roles.remove("730650583413030953");
            await gm?.roles.add("719941380503371897");
        } catch (error) {
            console.log(error.stack)
        }

        let linkObj = [
            `https://discord.com/channels/719406444109103117/722284401920180234`,
            `https://discord.com/channels/719406444109103117/722284266108747880`,
            `https://discord.com/channels/719406444109103117/722284377609994281`,
            `https://discord.com/channels/719406444109103117/731568511138136094`
        ];


        await message.mentions.users.first()!
        .send({embeds:[
                new MessageEmbed()
                    .setDescription(`Remember to check\n` + `⇒ [#info](${linkObj[0]})\n` + `⇒ [#annoucements](${linkObj[1]})\n` + `⇒ [#rules](${linkObj[2]})\n` + `Also signup for both vote pings\nand signup pings in [#roles](${linkObj[3]})! Enjoy your stay!`)
                    .setColor(`#${(await getConfig()).colour}`)
                    .setTitle("Welcome to Meme Royale!")
                    .setFooter("MemeRoyale#3101", `${(client.users.cache.get("722303830368190485")!.displayAvatarURL({
                        format: "webp",
                        size: 512
                    }))}`)
            ]});
        await (<TextChannel>client.channels.cache.get(("722285800225505879"))!)
        .send(`A new contender entered the arena of Meme Royale. Welcome <@${message.mentions.users.first()!.id}>`);
    }
};

export const verify: Command = {
    name: "verify",
    description: "`!verify <reddit username | code \"your code\"`",
    group: "match",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        const snoowrap = require('snoowrap');

        let e = process.env.RTOKEN
        let f = process.env.SECRET
        let g = process.env.RPASSWORD
        let guild = (await client.guilds.fetch("719406444109103117")!);
        let gm = await guild.members.fetch(message.author.id);

        if(message.member?.roles.cache.find(x => x.name.toLowerCase() === "member")) return;

        const r = new snoowrap({
            userAgent: 'memeroyaleverification by u/meme_royale',
            clientId: e,
            clientSecret: f,
            username: 'meme_royale',
            password: g,
        });

        let verifyDoc = await getDoc<verificationDoc>("config", "verify")

        if (args[0] !== "code") {
            let user = await r.getUser(args[0])

            if(!user.verified) return message.reply("Please have a verified email adress linked with your reddit" +
                " account.");

            let id = await makeid(5)

            await r.composeMessage({
                to: args[0],
                subject: "your verification code",
                text: id
            });

            verifyDoc.users.push({
                _id:message.author.id,
                code: id,
                nickname: args[0]
            })

            await updateDoc("config", verifyDoc._id, verifyDoc);

            return  message.reply("Please check your reddit DM for a code. Use the command `!verify code \"your" +
                " code\"` to verify yourself.");
        }

        if (args[0] === "code") {

            let u = verifyDoc.users.find(x => x._id === message.author.id);

            if (!u) return message.reply("Verification did not work. Contact mods.");

            if (args[1] !== u.code) {
                verifyDoc.users.splice(verifyDoc.users.findIndex(x => x._id === message.author.id), 1);
                await updateDoc("config", verifyDoc._id, verifyDoc);
                return  message.reply("Wrong code. Please restart verification.")
            }

            let linkObj = [
                `https://discord.com/channels/719406444109103117/722284401920180234`,
                `https://discord.com/channels/719406444109103117/722284266108747880`,
                `https://discord.com/channels/719406444109103117/722284377609994281`,
                `https://discord.com/channels/719406444109103117/731568511138136094`
            ];

            let embed = new MessageEmbed()
                .setDescription(
                    `Remember to check\n` +
                    `⇒ [#info](${linkObj[0]})\n` +
                    `⇒ [#annoucements](${linkObj[1]})\n` +
                    `⇒ [#rules](${linkObj[2]})\n` +
                    `Also signup for both vote pings\nand signup pings in [#roles](${linkObj[3]})! Enjoy your stay!`
                )
                .setColor(`#${(await getConfig()).colour}`)
                .setTitle("Welcome to Meme Royale!")
                .setFooter("MemeRoyale#3101", `${(client.users.cache.get("722303830368190485")!.displayAvatarURL({
                    format: "webp",
                    size: 512
                }))}`)


            try{
                await gm.setNickname(u.nickname);
                await gm?.roles.remove("730650583413030953");
                await gm?.roles.add("719941380503371897");
            } catch (error) {
                console.log(error.stack)
            }

            await client.users.cache.get(u._id)!.send({embeds:[embed]})

            verifyDoc.users.splice(verifyDoc.users.findIndex(x => x._id === message.author.id), 1);

            await updateDoc("config", verifyDoc._id, verifyDoc);

            return await (<TextChannel>client.channels.cache.get("722285800225505879")!)
                .send(`A new contender entered the arena of Meme Royale. Welcome <@${u._id}>`);
        }

        else {
            return message.reply("Either pass your reddit username or code \'your code\'");
        }
    }
};

async function makeid(length: number) {
    let result = '';
    let characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export default [
    manualverify,
    verify
]