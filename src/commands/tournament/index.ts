import { Message, Client } from "discord.js";
import { getConfig, getDoc, updateConfig, updateDoc } from "../../db";
import { Command, config, Signups, QualList } from "../../types";
import { signup, signup_manager, unsignup } from "./signup";
import { backwardsFilter, forwardsFilter, shuffle } from "../util";
import * as s from "./challonge"

export const cycle_restart: Command = {
    name: "cyclereset",
    description: "Reset for a cycle",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let signup:Signups = await getDoc("config", "signups")
        signup.users = []
        await updateDoc("config", "signups", signup)
        await signup_manager.execute(message, client, ["open"])

        let c:config = await getConfig()
        c.status = "Signups are now open!"
        await updateConfig(c)
    }
}

export const create_groups: Command = {
    name: "creategroup",
    aliases: ["creategroups", "cg"],
    description: "!creategroup #Amount in each group",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        console.log((parseInt(args[0])))
        console.log(isNaN(parseInt(args[0])))
        if (isNaN(parseInt(args[0])) === true) {
            return message.reply("The amount entered is not a valid number. Check your input.")
        };

        let gNum = parseInt(args[0])
        let signup: Signups = await getDoc("config", "signups")
        if (signup.open === true) {
            return message.reply("Signups haven't closed")
        }

        else if(signup.users.length === 0) {
            return message.reply("No one signed up")
        }

        let makeGroup = async function(amount: number, list: string[]) {

            let chunks: any[][] = [], i = 0, n = 63;
        
            while (i <= n) {
                chunks.push(list.slice(i, i += amount));
            }
        
            n = Math.abs(list.length - i)
        
            if (n > 0) {
                for (let x = 0; x < n; x++) {
                    console.log(x)
                    chunks[x].push(list[i])
                    i += 1
                }
            }
        
            return chunks;
        
        }

        signup.users = await shuffle(signup.users)
        let groups = await makeGroup(gNum, signup.users)
        await shuffle(groups)

        let list:QualList = await getDoc("config", "quallist")

        list.users = groups
        await updateDoc("config", "quallist", list)

        return message.reply("Made Qualifier groups.")
    }
}

export const view_groups: Command = {
    name: "viewgroup",
    aliases: ["viewgroups", "vg"],
    description: "!viewgroup <Page Number>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let page: number = parseInt(args[0])-1 || 0
        let ratings:QualList = await getDoc("config", "quallist")

        if(ratings.users.length === 0){
            return message.reply("No Groups.")
        }

        const m = <Message>(await message.channel.send({ embed: await groupEmbed(page!, client, ratings) }));
        await m.react("⬅")
        await m.react("➡");
    
        const backwards = m.createReactionCollector(backwardsFilter, { time: 100000 });
        const forwards = m.createReactionCollector(forwardsFilter, { time: 100000 });
    
        backwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({ embed: await groupEmbed(--page, client, ratings)});
        });
        forwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({ embed: await groupEmbed(++page, client, ratings) });
        });
    }
}

async function groupEmbed(page: number = 0, client: Client, signup: QualList){

    page = page < 0 ? 0 : page;
    const fields = [];    
    for (let i = 0; i < signup.users[page].length; i++){
        try{
            fields.push({
                name: `${i + 1}) ${await (await client.users.fetch(signup.users[page][i])).username}`,
                value: `Userid is: ${signup.users[page][i]}`
            });
        }
        catch{
            continue;
        }

    }

    return {
        title: `Qualifier Groups ${page!+1 || 1} of ${Math.floor(signup.users.length)}`,
        description: fields.length === 0 ?
            `There are no groups` :
            `there are ${signup.users.length} groups`,
        fields,
        color: "#d7be26",
        timestamp: new Date()
    };
}


export default[
    signup,
    signup_manager,
    cycle_restart,
    view_groups,
    create_groups,
    unsignup
]
.concat(s.default)
.sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1;
    else if (k1.name > k2.name) return 1;
    else return 0;
})