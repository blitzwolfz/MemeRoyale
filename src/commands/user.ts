import { Message, Client, MessageEmbed } from "discord.js";
import { addProfile, getAllDuelProfiles, getAllProfiles, getDuelProfile, getProfile } from "../db";
import { Command, DuelProfile, Profile } from "../types";
import { backwardsFilter, forwardsFilter } from "./util";

export const create_profile: Command = {
    name: "create",
    description: "Create a user profile",
    group: "profile",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let imgurl = args[1] ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL()): message.author.displayAvatarURL()
        
        if(await getProfile(message.author.id)){
            return message.reply("That user profile does exist! Please do `!stats` to check the user profile")
        }
    
        else{
   
            await addProfile({
                _id: message.author.id,
                votetally:0,
                points:0,
                wins: 0,
                loss: 0,
            })
    
           
            await message.channel.send(
                new MessageEmbed()
                    .setTitle(`${message.author.username}`)
                    .setColor("RANDOM")
                    .setThumbnail(`${imgurl}`)
                    .addFields(
                    { name: 'Total points', value: `${0}` },
                    { name: 'Total wins', value: `${0}` },
                    { name: 'Total loss', value: `${0}`  },
                    { name: 'Total matches', value: `${0}` },
                    { name: 'Win Rate', value: `${0}%` },
                )
            )
        }
    }
}

export const profile_stats: Command = {
    name: "stats",
    description: "View profile stats of yourself or others",
    group: "profile",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let user:Profile = await getProfile(args[1] ? (message.mentions.users.first()!.id): message.author.id)//message.mentions?.users?.first()?.id || args[0] || 
        let imgurl = args[1] ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL()): message.author.displayAvatarURL()
        let name = args[1] ? (client.users.cache.get(message.mentions.users.first()!.id)!.username): message.author.username
        if (!user){
            return message.reply("That user profile does not exist! Please do `!create` to create your own user profile")
        }
    
        else if(user){
       
            let wr = Math.floor(user.wins/(user.wins+user.loss) * 100);
            
            if(user.loss + user.wins === 0) wr = 0;
    
            let UserEmbed = new MessageEmbed()
                .setTitle(`${name}`)
                .setThumbnail(imgurl)
                //.setColor("#d7be26")
                .setColor("RANDOM")
                .addFields(
                    { name: 'Total Points', value: `${user.points}` },
                    { name: 'Total Wins', value: `${user.wins}` },
                    { name: 'Total Loss', value: `${user.loss}`  },
                    { name: 'Total Matches', value: `${user.wins+user.loss}` },
                    { name: 'Win Rate', value: `${wr}%` },
                )
            
            await message.channel.send(UserEmbed)
        }
    }
}

export async function createProfileatMatch(userId:string) {
   
    if(await getProfile(userId)){
        return;
    }

    else {
        await addProfile({
            _id: userId,
            votetally:0,
            points:0,
            wins: 0,
            loss: 0,
        })
    }
}

export const profile_lb: Command = {
    name: "lb",
    description: "View profile leaderboard for win ratio, wins, losses, votes",
    group: "profile",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let profiles = await getAllProfiles()

        let symbol: "wins" | "points" | "loss" | "votetally" | "ratio" = "wins"
        //@ts-ignore
        let page: number = typeof args[1] == "undefined" ? isNaN(parseInt(args[0])) ? 1 : parseInt(args[0]) : args[1];;

        switch (args[0]?.[0]) {
            case "p": symbol = "points"; break;
            case "r": symbol = "ratio"; break;
            case "l": symbol = "loss"; break;
            case "v": symbol = "votetally"; break;
            default: symbol = "wins";
        }

        const m = <Message>(await message.channel.send({ embed: await makeProfileEmbed(page!, client, profiles, symbol, message.author.id) }));
        await m.react("⬅")
        await m.react("➡");


        const backwards = m.createReactionCollector(backwardsFilter, { time: 100000 });
        const forwards = m.createReactionCollector(forwardsFilter, { time: 100000 });

        backwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({ embed: await makeProfileEmbed(--page, client, profiles, symbol, message.author.id) });
        });
        forwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({ embed: await makeProfileEmbed(++page, client, profiles, symbol, message.author.id) });
        });

    }
}

async function makeProfileEmbed(page: number = 1, client: Client, profiles: Profile[],
    symbol: "wins" | "points" | "loss" | "votetally" | "ratio", userid: string) {

    page = page < 1 ? 1 : page;

    if (page > profiles.length) {
        page = 0
    }

    const fields = [];
    let index = (0 + page - 1) * 10

    if (symbol === "ratio") {

        function ratioCalc(x: Profile) {
            return Math.floor(x.wins / (x.wins + x.loss) * 100);
        }

        profiles.sort(function (a, b) {
            return ratioCalc(b) - ratioCalc(a)
        });
    }

    else {
        profiles.sort(function (a, b) {
            return b[symbol] - a[symbol]
        });
    }

    for (let i = index; i < index + 10; i++) {

        let obj = profiles[i]
        try {
            let strr = "";
            // if (symbol === "ratio") {
            //     let mat = Math.floor(obj.wins / (obj.wins + obj.loss) * 100)

            //     if (obj.wins + obj.loss === 0) mat = 0;

            //     strr += "Win Ratio: " + `${mat}`
            // }

            // else {
            //     switch (symbol) {
            //         case "loss":
            //             strr += `Losses: ${obj.loss}`;
            //             break;
            //         case "votetally":
            //             strr += `Total matches voted: ${obj.votetally}`;
            //             break;
            //         default:
            //             strr += `Wins: ${obj.wins}`;
            //     }
            // }

            switch (symbol) {
                case "ratio":
                    let mat = Math.floor(obj.wins / (obj.wins + obj.loss) * 100)
                    if (obj.wins + obj.loss === 0) mat = 0;
                    strr += "Win Ratio: " + `${mat}`
                    break;
                case "loss":
                    strr += `Losses: ${obj.loss}`;
                    break;
                case "votetally":
                    strr += `Total matches voted: ${obj.votetally}`;
                    break;
                default:
                    strr += `Wins: ${obj.wins}`;
            }

            fields.push({
                name: `${i + 1}) ${await (await client.users.fetch(profiles[i]._id)).username}`,
                value: strr,
            });
        }
        catch {
            continue;
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
        default:
            strrr += `Wins.`;
    }

    return {
        title: `Leaderboard sorted by ${strrr}. You are on page ${page! || 1} of ${Math.floor(profiles.length / 10) + 1}`,
        description: `Your rank is: ${profiles.findIndex(item => item._id == userid) + 1}`,
        fields,
        color: "#d7be26",
        timestamp: new Date()
    };
}

export const duel_stats: Command = {
    name: "duel-stats",
    description: "`!duel stats <@mention>`. Check out your duel statistics. Mention another user and you can see their stats.",
    group: "duels",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let user:DuelProfile = await getDuelProfile((args[1] ? (message.mentions.users.first()!.id): message.author.id), message.guild!.id)//message.mentions?.users?.first()?.id || args[0] || 
        let imgurl = args[1] ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL()): message.author.displayAvatarURL()
        let name = args[1] ? (client.users.cache.get(message.mentions.users.first()!.id)!.username): message.author.username
        if (!user){
            return message.reply("That user profile does not exist! Please do `!duel create` to create your own user profile")
        }
    
        else if(user){
       
            let wr = Math.floor(user.wins/(user.wins+user.loss) * 100);
            
            if(user.loss + user.wins === 0) wr = 0;
    
            let UserEmbed = new MessageEmbed()
                .setTitle(`Duelist: ${name}`)
                .setThumbnail(imgurl)
                .setColor("RANDOM")
                .addFields(
                    { name: 'Total Points', value: `${user.points}` },
                    { name: 'Total Wins', value: `${user.wins}` },
                    { name: 'Total Loss', value: `${user.loss}`  },
                    { name: 'Total Matches', value: `${user.wins+user.loss}` },
                    { name: 'Win Rate', value: `${wr}%` },
                )
            
            await message.channel.send(UserEmbed)
        }
    }
}

export const duel_lb: Command = {
    name: "duel-lb",
    description: "`!duel lb <points | ratio | loss | votes | all>`. See how you rank with other duelist in your server. If no flag is passed, the lb sorts by wins.",
    group: "duels",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let profiles = await getAllDuelProfiles(message.guild!.id)

        let symbol: "wins" | "points" | "loss" | "votetally" | "ratio"| "all" = "wins"
        //@ts-ignore
        let page: number = typeof args[2] == "undefined" ? isNaN(parseInt(args[1])) ? 1 : parseInt(args[1]) : args[2];;
    
        switch (args[1]?.[0]) {
            case "p": symbol = "points"; break;
            case "r": symbol = "ratio"; break;
            case "l": symbol = "loss"; break;
            case "v": symbol = "votetally"; break;
            case "a": symbol = "all"; break;
            default: symbol = "wins";
        }
    
        const m = <Message>(await message.channel.send({ embed: await makeDuelProfileEmbed(page!, client, profiles, symbol, message.author.id) }));
        await m.react("⬅")
        await m.react("➡");
    
    
        const backwards = m.createReactionCollector(backwardsFilter, { time: 100000 });
        const forwards = m.createReactionCollector(forwardsFilter, { time: 100000 });
    
        backwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({ embed: await makeDuelProfileEmbed(--page, client, profiles, symbol, message.author.id) });
        });
        forwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({ embed: await makeDuelProfileEmbed(++page, client, profiles, symbol, message.author.id) });
        });
    }
}

async function makeDuelProfileEmbed(page: number = 1, client: Client, profiles: DuelProfile[],
    symbol: "wins" | "points" | "loss" | "votetally" | "ratio" | "all", userid: string) {

    page = page < 1 ? 1 : page;

    if (page > profiles.length) {
        page = 0
    }

    const fields = [];
    let index = (0 + page - 1) * 10

    if (symbol === "ratio") {

        function ratioCalc(x: DuelProfile) {
            return Math.floor(x.wins / (x.wins + x.loss) * 100);
        }

        profiles.sort(function (a, b) {
            return ratioCalc(b) - ratioCalc(a)
        });
    }

    if (symbol === "all") {

        profiles.sort(function (a, b) {
            return b.wins - a.wins
        });
    }

    else {
        profiles.sort(function (a, b) {
            //Ez tricks yk yk
            //@ts-ignore
            return b[symbol] - a[symbol]
        });
    }

    for (let i = index; i < index + 10; i++) {

        let obj = profiles[i]
        try {
            let strr = "";
            // if (symbol === "ratio") {
            //     let mat = Math.floor(obj.wins / (obj.wins + obj.loss) * 100)

            //     if (obj.wins + obj.loss === 0) mat = 0;

            //     strr += "Win Ratio: " + `${mat}`
            // }

            // if (symbol === "all") {
            //     strr += `Wins: ${obj.wins}\nLosses: ${obj.loss}\nTotal votes recieved: ${obj.votetally}\nPoints gained: ${obj.points}`
            // }

            switch (symbol) {
                case "ratio":
                    let mat = Math.floor(obj.wins / (obj.wins + obj.loss) * 100)
                    if (obj.wins + obj.loss === 0) mat = 0;
                    strr += "Win Ratio: " + `${mat}`;
                    break;
                case "all":
                    strr += `Wins: ${obj.wins}\nLosses: ${obj.loss}\nTotal votes recieved: ${obj.votetally}\nPoints gained: ${obj.points}`
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
                name: `${i + 1}) ${await (await client.users.fetch(profiles[i]._id)).username}`,
                value: strr,
            });
        }
        catch {
            continue;
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

    return {
        title: `Leaderboard sorted by ${strrr} You are on page ${page! || 1} of ${Math.floor(profiles.length / 10) + 1}`,
        description: `Your rank is: ${profiles.findIndex(item => item._id == userid) + 1}`,
        fields,
        color: "#d7be26",
        timestamp: new Date()
    };
}

export default[
    create_profile,
    profile_stats,
    profile_lb,
    duel_stats,
    duel_lb
]
.sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1;
    else if (k1.name > k2.name) return 1;
    else return 0;
})