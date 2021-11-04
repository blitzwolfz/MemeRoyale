import type { Client, Message, TextChannel } from "discord.js";
import { getExhibition, getMatch, updateExhibition, updateMatch } from "../../db";
import type { Command } from "../../types";
import { toHHMMSS } from "../util";
import { MessageEmbed } from "discord.js";

export const duelcheck: Command = {
    name: "duel -check",
    description: "",
    group: "duels",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        let ex = await getExhibition();

        if (!ex.cooldowns.some(x => x.user === message.author.id)) {
            return message.reply("You can start another duel.");
        }

        else if (ex.cooldowns.some(x => x.user === message.author.id)) {
            let i = ex.cooldowns.findIndex(x => x.user === message.author.id);

            await message.reply(`Time till you can start another duel: ${await toHHMMSS(ex.cooldowns[i].time, 3600)}`);
        }
    }
};

export const duelreload: Command = {
    name: "duel -reload",
    description: "",
    group: "duels",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        let match = await getMatch(message.channel.id);
        let channel = <TextChannel>await client.channels.cache.get(message.channel.id)!;
        message.reply("Reloading").then(async m => {
            for (let ms of match.messageID) {
                try {
                    await (await channel.messages.fetch(ms)).delete();
                } catch {
                    continue;
                }
            }

            await setTimeout(() => m.delete, 1500);
        });

        match.votingperiod = false;
        match.votetime = (Math.floor(Date.now() / 1000));

        await updateMatch(match);

    }
};

export const duelcooldownreset: Command = {
    name: "resetcd",
    description: "Resets cooldown for duels. `!resetcd @mentions`",
    group: "duels",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        let ex = await getExhibition();

        for (let x of message.mentions.users.values()) {
            ex.cooldowns.splice(ex.cooldowns.findIndex(c => c.user === x.id));
            await updateExhibition(ex);
            await message.channel.send(`<@${x.id}> has been reset`);
        }
    }
};

export const duelHelp: Command = {
    name: "duel -help",
    description: "Duel's help menu",
    group: "duels",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        let helpEmbed = new MessageEmbed()
            .setColor("RANDOM")
            .setTitle("Duel help menu")
            .setDescription(
                "Duels are a way to play matches with other people in this server."+
                "\nAll you have to do is do the !duel command, and the bot will start a duel for you."+
                "\nTo the person who is being mentioned, the bot will ask you to react a checkmark"+
                "\nYou have a chance to duel others every 1h, with the bot dming you when you can."
            )
            .setFields(
                {
                    name: '`!duel @someone <theme | template>`',
                    value: `Pass an theme or template flag, and you will get a random theme or template from our inventory.`,
                },
                {
                    name: '`!duel -create`',
                    value: `Create your duelist profile. If you played in a duel, this profile has already been made for you.`,
                },
                {
                    name: '`!duel -stats <@mention>`',
                    value: `Check out your duel statistics. Mention another user and you can see their stats.`,
                },
                {
                    name: '`!duel -lb <points | ratio | loss | votes | all>`',
                    value: `See how you rank with other duelist in your server. If no flag is passed, the lb sorts by wins.`,
                },
                {
                    name:'`!resetcd`',
                    value:'0_o'
                }
            )
            .setTimestamp(new Date)
        ;
        return await message.reply({embeds:[helpEmbed]});
    }
};

export default [
    duelcooldownreset,
    duelreload,
    duelcheck,
    duelHelp
].sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1; else if (k1.name > k2.name) return 1; else return 0;
});