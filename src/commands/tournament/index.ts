import { Client, Message, MessageEmbed, User } from "discord.js";
import { deleteDoc, getConfig, getDoc, getTemplatedB, insertDoc, updateConfig, updateDoc, updateTemplatedB } from "../../db";
import type { Command, config, QualList, Signups } from "../../types";
import { signup, signup_manager, unsignup, view_signup } from "./signup";
import { backwardsFilter, forwardsFilter, shuffle } from "../util";
import * as s from "./challonge";

export const cycle_restart: Command = {
    name: "cyclereset",
    description: "Reset for a cycle",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let signup: Signups = await getDoc("config", "signups");
        signup.users = [];
        await updateDoc("config", "signups", signup);
        await signup_manager.execute(message, client, ["open"]);

        let c: config = await getConfig();
        c.status = "Signups are now open!";
        await updateConfig(c);
    }
};

export const create_groups: Command = {
    name: "creategroup",
    aliases: [
        "creategroups",
        "cg"
    ],
    description: "!creategroup #Amount in each group",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {

        if (isNaN(parseInt(args[0])) === true) {
            return message.reply("The amount entered is not a valid number. Check your input.");
        }

        let gNum = parseInt(args[0]);
        let signup: Signups = await getDoc("config", "signups");
        if (signup.open === true) {
            return message.reply("Signups haven't closed");
        }

        else if (signup.users.length === 0) {
            return message.reply("No one signed up");
        }

        let makeGroup = async function (amount: number, list: string[]) {

            let chunks: any[][] = [], i = 0, n = 63;

            while (i <= n) {
                chunks.push(list.slice(i, i += amount));
            }

            n = Math.abs(list.length - i);

            if (n > 0) {
                for (let x = 0; x < n; x++) {
                    console.log(x);
                    chunks[x].push(list[i]);
                    i += 1;
                }
            }

            return chunks;

        };

        signup.users = await shuffle(signup.users);
        let groups = await makeGroup(gNum, signup.users);
        await shuffle(groups);

        let list: QualList = await getDoc("config", "quallist");

        list.users = groups;
        await updateDoc("config", "quallist", list);

        return message.reply("Made Qualifier groups.");
    }
};

export const view_groups: Command = {
    name: "viewgroup",
    aliases: [
        "viewgroups",
        "vg"
    ],
    description: "!viewgroup <Page Number>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let page: number = parseInt(args[0]) - 1 || 0;
        let ratings: QualList = await getDoc("config", "quallist");

        if (ratings.users.length === 0) {
            return message.reply("No Groups.");
        }

        const m = <Message>(await message.channel.send({embed: await groupEmbed(page!, client, ratings)}));
        await m.react("⬅");
        await m.react("➡");

        const backwards = m.createReactionCollector(backwardsFilter, {time: 100000});
        const forwards = m.createReactionCollector(forwardsFilter, {time: 100000});

        backwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({embed: await groupEmbed(--page, client, ratings)});
        });
        forwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            m.edit({embed: await groupEmbed(++page, client, ratings)});
        });
    }
};

async function groupEmbed(page: number = 0, client: Client, signup: QualList) {

    page = page < 0 ? 0 : page;
    const fields = [];
    for (let i = 0; i < signup.users[page].length; i++) {
        try {
            fields.push({
                name: `${i + 1}) ${await (await client.users.fetch(signup.users[page][i])).username}`,
                value: `Userid is: ${signup.users[page][i]}`
            });
        } catch {

        }

    }

    return {
        title: `Qualifier Groups ${page! + 1 || 1} of ${Math.floor(signup.users.length)}`,
        description: fields.length === 0 ? `There are no groups` : `there are ${signup.users.length} groups`,
        fields,
        color: "#d7be26",
        timestamp: new Date()
    };
}

export const templatecheck: Command = {
    name: "templatecheck",
    aliases: ["tc"],
    description: "!templatecheck",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let list = await (await getTemplatedB()).list;
        let emotes = [
            "1️⃣",
            "2️⃣",
            "3️⃣",
            "4️⃣",
            "5️⃣",
            "6️⃣",
            "7️⃣",
            "8️⃣",
            "9️⃣",
            "🔟"
        ];
        const filter = (reaction: { emoji: { name: string; }; }, user: User) => {
            return emotes.includes(reaction.emoji.name) && !user.bot;
        };

        let struct: {
            msg: Message, tempstring: string, remove: boolean, position: number
        }[] = [];

        let removelinks: string[] = [];

        let doc: {
            _id: string, pos: number
        } = await getDoc("tempstruct", message.author.id);

        if (!doc) {
            await insertDoc("tempstruct", {
                _id: message.author.id, pos: 0
            });

            doc = {
                _id: message.author.id, pos: 0
            };
        }

        if (doc.pos > list.length) doc.pos = 0;

        for (let i = doc.pos; i < doc.pos + 10; i++) {
            await message.channel.send(list[i]).then(async m => {
                struct.push({
                    msg: m, tempstring: list[i], remove: false, position: i
                });
            });
        }

        const m = <Message>(await message.channel.send(new MessageEmbed()
        .setColor("RANDOM")
        .setDescription("Click on the emotes 1 to 10 to select a template to remove.\nClick next arrow to go to the next 10 templates.")));

        for (let l = 0; l < emotes.length; l++) {
            m.react(emotes[l]);
        }
        await m.react("➡");


        //const remove = m.createReactionCollector(((reaction: { emoji: { name: string; }; }, user: Discord.User) =>
        // reaction.emoji.name === '🗡️' && !user.bot), { time: 300000 });
        const forwards = m.createReactionCollector(forwardsFilter, {time: 300000});
        const remove = m.createReactionCollector(filter, {time: 300000});

        forwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));

            // for(let i = struct[struct.length-1].position; i < list.slice(i).length; i++){
            //     struct
            // }
            for (let s of struct) {
                s.msg.edit(list[s.position + 10]);
                s.tempstring = list[s.position + 10];
                s.position += 10;
            }

            doc.pos += 10;

            await updateDoc("tempstruct", doc._id, doc);

        });

        remove.on('collect', async () => {

            m.reactions.cache.forEach(async reaction => {
                reaction.users.remove(message.author.id);

                if (reaction.count! >= 2) {
                    let pos = [
                        "1️⃣",
                        "2️⃣",
                        "3️⃣",
                        "4️⃣",
                        "5️⃣",
                        "6️⃣",
                        "7️⃣",
                        "8️⃣",
                        "9️⃣",
                        "🔟"
                    ].indexOf(reaction.emoji.name);

                    if (pos >= 0) {
                        removelinks.push(struct[pos].tempstring);

                    }
                }
            });
        });

        remove.on("end", async () => {
            let tempdb: Array<string> = [];

            tempdb = await (await getTemplatedB()).list;


            for (let x = 0; x < removelinks.length; x++) {
                let e = tempdb.findIndex(i => i === list[x]);
                tempdb.splice(e, 1);
            }

            if (doc.pos > list.length) {
                await deleteDoc("tempstruct", doc._id);
            }
            await updateTemplatedB(tempdb);
            await message.reply(`Finished. Removed ${removelinks.length} templates`);
        });

    }
};

export default [
    signup,
    signup_manager,
    cycle_restart,
    view_groups,
    create_groups,
    unsignup,
    templatecheck,
    view_signup
]
.concat(s.default)
.sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1; else if (k1.name > k2.name) return 1; else return 0;
});