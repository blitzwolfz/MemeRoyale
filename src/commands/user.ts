import { Client, Message, MessageEmbed } from "discord.js";
import { getAllDuelProfiles, getAllProfiles, getConfig, getDuelProfile, getProfile, insertDuelProfile, insertProfile, updateProfile } from "../db";
import type { Command, DuelProfile, Profile } from "../types";
import { backwardsFilter, forwardsFilter } from "./util";

export const create_profile: Command = {
    name: "create",
    description: "Create a user profile",
    group: "profile",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let imgurl = args[1] ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL()) : message.author.displayAvatarURL();

        if (await getProfile(message.author.id)) {
            return message.reply("That user profile does exist! Please do `!stats` to check the user profile");
        }

        else {

            await insertProfile({
                _id: message.author.id, totalMemes: 0, totalTime: 0, votetally: 0, points: 0, wins: 0, loss: 0, voteDM:true,
            });


            await message.channel.send({
                embeds:[
                    new MessageEmbed()
                        .setTitle(`${message.author.username}`)
                        .setColor("RANDOM")
                        .setThumbnail(`${imgurl}`)
                        .addFields(
                                {name: 'Total points', value: `${0}`},
                                {name: 'Total wins', value: `${0}`},
                                {name: 'Total loss', value: `${0}`},
                                {name: 'Total matches', value: `${0}`},
                                {name: 'Win Rate', value: `${0}%`}
                        )
                ]
            });
        }
    }
};

export const profile_stats: Command = {
    name: "stats",
    description: "View profile stats of yourself or others",
    group: "profile",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let user: Profile = await getProfile(args[0] ? (message.mentions.users.first()!.id) : message.author.id);//message.mentions?.users?.first()?.id
        // ||
        // args[0]
        // ||
        let imgurl = args[0] ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL()) : message.author.displayAvatarURL();
        let name = args[0] ? (client.users.cache.get(message.mentions.users.first()!.id)!.username) : message.author.username;
        if (!user) {
            return message.reply("That user profile does not exist! Please do `!create` to create your own user profile");
        }

        else if (user) {

            let wr = Math.floor(user.wins / (user.wins + user.loss) * 100);

            if (user.loss + user.wins === 0) wr = 0;

            let UserEmbed = new MessageEmbed()
            .setTitle(`${name}`)
            .setThumbnail(imgurl)
            //.setColor("#d7be26")
            .setColor("RANDOM")
            .addFields({name: 'Total Points', value: `${user.points}`, inline:true},
                {name: 'Avg. time', value: `${(user.totalTime/60).toFixed(2)} mins`, inline:true}, {
                name: 'Total Wins', value: `${user.wins}`, inline:true
            }, {name: 'Total Loss', value: `${user.loss}`, inline:true}, {
                name: 'Total Matches', value: `${user.wins + user.loss}`, inline:true
            }, {name: 'Win Rate', value: `${wr}%`, inline:true});

            await message.channel.send({
                embeds:[
                    UserEmbed
                ]
            });
        }
    }
};

export const disableDM: Command = {
    name: "dm",
    description: "Disable or Enable dm for vote confirmation",
    group: "profile",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let user: Profile = await getProfile(message.author.id);
        if (!user) {
            return message.reply("That user profile does not exist! Please do `!create` to create your own user profile");
        }

        user.voteDM = user.voteDM === false ? true : false;

        await updateProfile(user);

        return message.reply(`Vote confirmation dms are now ${user.voteDM ? "enabled." : "disabled."}`);
    }
};

export async function createProfileatMatch(userId: string) {

    if (await getProfile(userId)) {
        return;
    }

    else {
        await insertProfile({
            _id: userId, totalMemes: 0, totalTime: 0, votetally: 0, points: 0, wins: 0, loss: 0, voteDM:true,
        });
    }
}

export const profile_lb: Command = {
    name: "lb",
    description: "View profile leaderboard for win ratio, wins, losses, votes",
    group: "profile",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let profiles:Profile[] = (await getAllProfiles());
        profiles = profiles.filter(x => !x._id.includes("-cockrating"))
        console.log(args)
        let symbol: "wins" | "points" | "loss" | "votetally" | "totalTime" | "ratio" = "wins";
        //@ts-ignore
        let page: number = typeof args[1] == "undefined" ? isNaN(parseInt(args[0])) ? 1 : parseInt(args[0]) : args[1];
        console.log(page)

        switch (args[0]?.[0].toLowerCase()) {
            case "p":
                symbol = "points";
                break;
            case "r":
                symbol = "ratio";
                break;
            case "l":
                symbol = "loss";
                break;
            case "t":
                symbol = "totalTime";
                break;
            case "v":
                symbol = "votetally";
                break;
            default:
                symbol = "wins";
        }

        const m = <Message>(await message.channel.send({
            embeds:[
                await makeProfileEmbed(page!, client, profiles, symbol, message.author.id)
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
                    await makeProfileEmbed(--page, client, profiles, symbol, message.author.id)
                ]
            });
        });
        forwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({
                embeds:[
                    await makeProfileEmbed(++page, client, profiles, symbol, message.author.id)
                ]
            });
        });

    }
};

async function makeProfileEmbed(page: number = 1, client: Client, profiles: Profile[],
                                symbol: "wins" | "points" | "loss" | "votetally" | "ratio" | "totalTime", userid: string) {

    page = page < 1 ? 1 : page;

    if (page > profiles.length) {
        page = 0;
    }

    const fields = [];
    let index = (0 + page - 1) * 10;

    if (symbol === "ratio") {

        function ratioCalc(x: Profile) {
            return Math.floor(x.wins / (x.wins + x.loss) * 100);
        }

        profiles.sort(function (a, b) {
            return ratioCalc(b) - ratioCalc(a);
        });
    }

    else if (symbol === "totalTime") {

        profiles.sort(function (a, b) {
            return a[symbol] - b[symbol];
        });

        // profiles.forEach(function (p) {
        //     console.log(p._id)
        //     if (p.totalTime === 0) {
        //         profiles.splice(profiles.findIndex(x => x._id === p._id));
        //     }
        // });

        profiles = profiles.filter(function (p) {
            if(p.totalTime !== 0) return p
        })
    }

    else {
        profiles.sort(function (a, b) {
            return b[symbol] - a[symbol];
        });
    }

    for (let i = index; i < index + 10; i++) {
        let obj = profiles[i];
        try {
            let strr = "";

            switch (symbol) {
                case "ratio":
                    let mat = Math.floor(obj.wins / (obj.wins + obj.loss) * 100);
                    if (obj.wins + obj.loss === 0) mat = 0;
                    strr += "Win Ratio: " + `${mat}`;
                    break;
                case "loss":
                    strr += `Losses: ${obj.loss}`;
                    break;
                case "points":
                    strr += `Points: ${obj.points}`;
                    break;
                case "totalTime":
                    strr += `avg. Time: ${(obj.totalTime/60).toFixed(2)} mins`;
                    break;
                case "votetally":
                    strr += `Total matches voted: ${obj.votetally}`;
                    break;
                default:
                    strr += `Wins: ${obj.wins}`;
            }

            fields.push({
                name: `${i + 1}) ${((await client.users.fetch(profiles[i]._id)).username)}`, value: strr
            });
        } catch {

        }

    }

    let strrr = "";

    switch (symbol) {
        case "ratio":
            strrr += `Win rate.`;
            break;
        case "loss":
            strrr += `Losses.`;
            break;
        case "votetally":
            strrr += `Total matches voted in.`;
            break;
        case "points":
            strrr += `Points.`;
            break;
        case "totalTime":
            strrr += `avg. Time.`;
            break;
        default:
            strrr += `Wins.`;
    }

    return new MessageEmbed()
        .setTitle(`Leaderboard sorted by ${strrr} You are on page ${page! || 1} of ${Math.floor(profiles.length / 10) + 1}`)
        .setDescription(
            `Your rank is: ${profiles.findIndex(item => item._id == userid) + 1}. `
            +`There ${profiles.length > 1 ? `are ${profiles.length} profiles that have` : `is ${profiles.length} profile that has`} been sorted.`
        )
        .setFields(
            fields
        )
        .setColor(`#${(await getConfig()).colour}`)
        .setTimestamp(new Date());
}

export const duel_stats: Command = {
    name: "duel -stats",
    description: "`!duel stats <@mention>`. Check out your duel statistics. Mention another user and you can see their stats.",
    group: "duels",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        let user: DuelProfile = await getDuelProfile((args[0] ? (message.mentions.users.first()!.id) : message.author.id), message.guild!.id);//message.mentions?.users?.first()?.id || args[0] ||
        let imgurl = args[0] ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL()) : message.author.displayAvatarURL();
        let name = args[0] ? (client.users.cache.get(message.mentions.users.first()!.id)!.username) : message.author.username;
        if (!user) {
            return message.reply("That user profile does not exist! Please do `!duel-create` to create your own user profile");
        }

        else if (user) {

            let wr = Math.floor(user.wins / (user.wins + user.loss) * 100);

            if (user.loss + user.wins === 0) wr = 0;

            let UserEmbed = new MessageEmbed()
            .setTitle(`Duelist: ${name}`)
            .setThumbnail(imgurl)
            .setColor("RANDOM")
            .addFields(
                {name: 'Win Rate', value: `${wr}%`, inline:true},
                {name: 'Total Wins', value: `${user.wins}`, inline:true},
                {name: 'Total Losses', value: `${user.loss}`, inline:true},
                {name: 'Total Matches', value: `${user.wins + user.loss}`, inline:true},
                {name: 'Total Points', value: `${user.points}`, inline:true},
                );
            
            if (message.author.id === process.env.owner) UserEmbed.setColor("DARK_RED")
            
            await message.channel.send({
                embeds:[
                    UserEmbed
                ]
            });
        }
    }
};

export const duel_stats_create: Command = {
    name: "duel -create",
    description: "`!duel -create`. Create your duel profile.",
    group: "duels",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        let imgurl = args[1] ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL()) : message.author.displayAvatarURL();

        if (await getDuelProfile(message.author.id, message.guild!.id)) {
            return message.reply("That user profile does exist! Please do `!duel -stats` to check the user profile");
        }

        else {

            await insertDuelProfile({
                _id: message.author.id, votetally: 0, points: 0, wins: 0, loss: 0
            }, message.guild!.id);


            await message.channel.send({
                embeds:[
                    new MessageEmbed()
                        .setTitle(`Duelist: ${message.author.username}`)
                        .setColor("RANDOM")
                        .setThumbnail(`${imgurl}`)
                        .addFields(
                            {name: 'Total points', value: `${0}`},
                            {name: 'Total wins', value: `${0}`},
                            {name: 'Total loss', value: `${0}`},
                            {name: 'Total matches', value: `${0}`},
                            {name: 'Win Rate', value: `${0}%`}
                        )
                ]
            });
        }
    }
};

export async function createDuelProfileAtMatch(userId: string, guildid: string) {

    if (await getDuelProfile(userId, guildid)) {
        return;
    }

    else {
        await insertDuelProfile({
            _id: userId, votetally: 0, points: 0, wins: 0, loss: 0
        }, guildid);
    }
}

export const duel_lb: Command = {
    name: "duel -lb",
    description: "`!duel -lb <points | ratio | loss | votes | all>`. See how you rank with other duelist in your" +
        " server. If no flag is passed, the lb sorts by wins.",
    group: "duels",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        console.log(args)
        let profiles = await getAllDuelProfiles(message.guild!.id);
        console.log(args)
        let symbol: "wins" | "points" | "loss" | "votetally" | "ratio" | "all" = "wins";
        //@ts-ignore
        let page: number = typeof args[1] == "undefined" ? isNaN(parseInt(args[0])) ? 1 : parseInt(args[0]) : parseInt(args[1]);
        console.log(page)
        switch (args[0]?.[0]) {
            case "p":
                symbol = "points";
                break;
            case "r":
                symbol = "ratio";
                break;
            case "l":
                symbol = "loss";
                break;
            case "v":
                symbol = "votetally";
                break;
            case "a":
                symbol = "all";
                break;
            default:
                symbol = "wins";
        }

        const m = <Message>(await message.channel.send({
            embeds:[
                await makeDuelProfileEmbed(page!, client, profiles, symbol, message.author.id)
            ]
        }));
        await m.react("⬅");
        await m.react("➡");


        const backwards = m.createReactionCollector({filter:backwardsFilter, time: 100000});
        const forwards = m.createReactionCollector({filter:forwardsFilter, time: 100000});

        backwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({
                embeds: [
                    await makeDuelProfileEmbed(--page, client, profiles, symbol, message.author.id)
                ]
            });
        });
        forwards.on('collect', async () => {
            console.log("A")
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            // [...m.reactions.cache.values()].forEach(reaction => reaction.users.remove(message.author.id));
            await m.edit({
                embeds:[
                    await makeDuelProfileEmbed(++page, client, profiles, symbol, message.author.id)
                ]
            });
        });
    }
};

async function makeDuelProfileEmbed(page: number = 1, client: Client, profiles: DuelProfile[], symbol: "wins" | "points" | "loss" | "votetally" | "ratio" | "all", userid: string) {

    page = page < 1 ? 1 : page;

    if (page > profiles.length) {
        page = 0;
    }

    const fields = [];
    let index = (0 + page - 1) * 10;

    if (symbol === "ratio") {

        let ratioCalc = (x: DuelProfile) => {
            return Math.floor(x.wins / (x.wins + x.loss) * 100);
        };

        profiles.sort(function (a, b) {
            return ratioCalc(b) - ratioCalc(a);
        });
    }

    if (symbol === "all") {

        profiles.sort(function (a, b) {
            return b.wins - a.wins;
        });
    }

    else {
        profiles.sort(function (a, b) {
            //Ez tricks yk yk
            //@ts-ignore
            return b[symbol] - a[symbol];
        });
    }

    for (let i = index; i < index + 10; i++) {

        let obj = profiles[i];
        try {
            let strr = "";
            // if (symbol === "ratio") {
            //     let mat = Math.floor(obj.wins / (obj.wins + obj.loss) * 100)

            //     if (obj.wins + obj.loss === 0) mat = 0;

            //     strr += "Win Ratio: " + `${mat}`
            // }

            // if (symbol === "all") {
            //     strr += `Wins: ${obj.wins}\nLosses: ${obj.loss}\nTotal votes recieved: ${obj.votetally}\nPoints
            // gained: ${obj.points}` }

            switch (symbol) {
                case "ratio":
                    let mat = Math.floor(obj.wins / (obj.wins + obj.loss) * 100);
                    if (obj.wins + obj.loss === 0) mat = 0;
                    strr += "Win Ratio: " + `${mat}`;
                    break;
                case "all":
                    strr += `Wins: ${obj.wins}\nLosses: ${obj.loss}\nTotal votes recieved: ${obj.votetally}\nPoints gained: ${obj.points}`;
                    break;
                case "loss":
                    strr += `Losses: ${obj.loss}`;
                    break;
                case "votetally":
                    strr += `Total votes recieved: ${obj.votetally}`;
                    break;
                case "points":
                    strr += `Points gained: ${obj.points}`;
                    break;
                default:
                    strr += `Wins: ${obj.wins}`;
            }

            fields.push({
                name: `${i + 1}) ${await (await client.users.fetch(profiles[i]._id)).username}`, value: strr
            });
        } catch {

        }

    }

    let strrr = "";

    switch (symbol) {
        case "ratio":
            strrr += `Win rate.`;
            break;
        case "points":
            strrr += `Points.`;
            break;
        case "loss":
            strrr += `Losses.`;
            break;
        case "votetally":
            strrr += `Total Votes Recieved.`;
            break;
        case "all":
            strrr += `Wins but displaying all stats.`;
            break;
        default:
            strrr += `Wins.`;
    }

    return new MessageEmbed()
        .setTitle(`Leaderboard sorted by ${strrr} You are on page ${page! || 1} of ${Math.floor(profiles.length / 10) + 1}`)
        .setDescription(`Your rank is: ${profiles.findIndex(item => item._id == userid) + 1}`)
        .setFields(
            fields
        )
        .setColor(`#${(await getConfig()).colour}`)
        .setTimestamp(new Date()
    );
}

export default [
    create_profile,
    profile_stats,
    profile_lb,
    duel_stats,
    duel_lb,
    duel_stats_create,
    disableDM
]
.sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1; else if (k1.name > k2.name) return 1; else return 0;
});