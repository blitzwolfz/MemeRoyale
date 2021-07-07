import type { Client, Message, TextChannel } from "discord.js";
import { MessageEmbed } from "discord.js";
import type { Command } from "../types";
import { getConfig } from "../db";


export const manualverify: Command = {
    name: "manualverify",
    aliases: ["mv"],
    description: "`!manualverify name @mention`",
    group: "match",
    owner: false,
    admins: false,
    mods: true,
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
        .send(new MessageEmbed()
            .setDescription(`Remember to check\n` + `⇒ [#info](${linkObj[0]})\n` + `⇒ [#annoucements](${linkObj[1]})\n` + `⇒ [#rules](${linkObj[2]})\n` + `Also signup for both vote pings\nand signup pings in [#roles](${linkObj[3]})! Enjoy your stay!`)
            .setColor((await getConfig()).colour)
            .setTitle("Welcome to Meme Royale!")
            .setFooter("MemeRoyale#3101", `${(client.users.cache.get("722303830368190485")!.displayAvatarURL({
                format: "webp",
                size: 512
            }))}`)
        );
        await (<TextChannel>client.channels.cache.get(("722285800225505879"))!)
        .send(`A new contender entered the arena of Meme Royale. Welcome <@${message.mentions.users.first()!.id}>`);
    }
};

export default [
    manualverify
]