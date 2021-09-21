import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { getConfig, getDoc, updateDoc } from "../../db";
import type { Command, Signups } from "../../types";
import { backwardsFilter, forwardsFilter } from "../util";

export const signup: Command = {
    name: "signup",
    description: "Command to signup for tournament",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let signup: Signups = await getDoc("config", "signups");

        if (message.channel.type !== "DM" && message.id !== signup.msgID && message.author.id !== client.user?.id) {
            return await message.reply("You have to signup in bot dm if they are open").then(async m => {
                await message.delete();
                await setTimeout(() => m.delete(), 1600);
            });
        }


        if (signup.open === false) {
            if (message.id !== signup.msgID && message.author.id !== client.user?.id) {
                return message.reply("You can't signup as they are not open");
            }
            else {
                return client.users.cache.find(x => x.id === args[0])?.send("You can't signup as they are not open");
            }
        }

        if(message.channel.type !== "DM" && signup.open && message.author.id !== client.user?.id) return message.reply("You have to signup in bot dm.")

        if (signup.users.includes(message.author.id) || signup.users.includes(args[0])) {
            if (message.id !== signup.msgID) {
                return message.reply("You already signed up");
            }
            else {
                return client.users.cache.find(x => x.id === args[0])?.send("You already signed up");
            }
        }

        else {
            if (message.id !== signup.msgID && message.channel.type === "DM" ) {
                await message.reply("You have been signed up!");
                signup.users.push(message.author.id);
                if(signup.users.length === signup.autoClose){
                    signup.open = false;
                    let c = <TextChannel>await client.channels.fetch("722284266108747880");
                    await c.send({
                        embeds:[
                            new MessageEmbed()
                                .setDescription("Match signups have closed!" + "\nIf there is an issue with your signup" + "\nyou will be contacted. If you wish to unsignup" + "\nuse `!unsignup` or contact mods. Of course " + "\nif you have problems contact mods!")
                                .setColor("#d7be26")
                                .setTimestamp()
                        ]
                    });
                }
                return await updateDoc("config", "signups", signup);
            }

            else {
                await client.users.cache.find(x => x.id === args[0])?.send("You have been signed up!");
                signup.users.push(args[0]);
                if(signup.users.length === signup.autoClose){
                    signup.open = false;
                    let c = <TextChannel>await client.channels.fetch("722284266108747880");
                    await c.send({
                        embeds:[
                            new MessageEmbed()
                                .setDescription("Match signups have closed!" + "\nIf there is an issue with your signup" + "\nyou will be contacted. If you wish to unsignup" + "\nuse `!unsignup` or contact mods. Of course " + "\nif you have problems contact mods!")
                                .setColor("#d7be26")
                                .setTimestamp()
                        ]
                    });
                }
                return await updateDoc("config", "signups", signup);
            }
        }
    }
};

export const signup_manager: Command = {
    name: "signup-manager",
    description: "Managing command for signups.",
    group: "signups",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let signup: Signups = await getDoc("config", "signups");
        let c = <TextChannel>await client.channels.fetch(message.guild!
        .channels.cache
        .find(x => x.name.toLowerCase() === "announcements")!.id!);

        if (args[0] === "-open") {
            signup.open = true;

            await c.send({
                embeds:[
                    new MessageEmbed()
                        .setDescription("Match signups have started!" + "\nPlease use the command `!signup`" + "\nYou can also use 🗳️ to signup" + "\nIf you wish to remove your signup use `!unsignup`" + "\nOf course if you have problems contact mods!")
                        .setColor("#d7be26")
                        .setTimestamp()
                ]
            }).then(async msg => {
                await msg.react('🗳️');
                signup.msgID = msg.id;
            });

            await client.user!.setActivity("Signup now open!");

            await message.reply("Opened.")

            await updateDoc("config", "signups", signup);

            let signupRole = await message.guild!.roles.cache.get("731574671723462757")!.members.map(m => m.user.id);

            for (let u of signupRole) {
                await client.users.fetch(u).then(async x => {
                    try {
                        await x.send("Signups now open. Check announcements.");
                    } catch (e) {
                        console.log(e.message)
                    }
                })
            }

            return;
        }

        if (args[0] === "-delete") {
            signup.users = []
            await message.channel.send("Signups now deleted.")
            return await updateDoc("config", "signups", signup);

        }

        if (args[0] === "-auto") {
            if(!args[1]) return message.reply("Please state a number to auto close at.")
            signup.autoClose = parseInt(args[1])
            await message.channel.send(`Signups will now auto close at ${args[1]} total users.`)
            return await updateDoc("config", "signups", signup);
        }

        if (args[0] === "-close") {
            signup.open = false;

            await updateDoc("config", "signups", signup);

            await client.user!.setActivity("Signup now closed!");

            return await c.send({
                embeds:[
                    new MessageEmbed()
                        .setDescription("Match signups have closed!" + "\nIf there is an issue with your signup" + "\nyou will be contacted. If you wish to unsignup" + "\nuse `!unsignup` or contact mods. Of course " + "\nif you have problems contact mods!")
                        .setColor("#d7be26")
                        .setTimestamp()
                ]
            });
        }

        if (args[0] === "-reopen") {
            signup.open = true;

            await c.send({
                embeds:[
                    new MessageEmbed()
                        .setDescription("Match signups have reopened!" + "\nIf you wish to signup use `!signup`" + "\nYou can also use 🗳️ to signup" + "\nIf you wish to remove your signup use `!removesignup`" + "\nOf course if you have problems contact mods!")
                        .setColor("#d7be26")
                        .setTimestamp()
                ]
            }).then(async msg => {
                await msg.react('🗳️');
                signup.msgID = msg.id;
            });

            await client.user!.setActivity("Signup now open!");

            return await updateDoc("config", "signups", signup);
        }

        if (args[0] === "-remove") {

            if (!args[1]) return message.reply("Please provide the User ID");

            signup.users.splice(signup.users.indexOf(message.author.id), 1);

            await updateDoc("config", "signups", signup);

            return message.reply(`Removed user <@${args[1]}>`);

        }
    }
};

export const unsignup: Command = {
    name: "unsignup",
    description: "Command to un-signup for tournament",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let signup: Signups = await getDoc("config", "signups");

        if (message.channel.type !== "DM") {
            return await message.reply("You have to un-signup in bot dm if they are open.").then(async m => {
                await message.delete();
                await setTimeout(() => m.delete(), 3000);
            });
        }


        if (signup.open === false) return message.reply("You can't un-signup as they are not open");

        if (signup.users.includes(message.author.id) && message.channel.type === "DM") {
            signup.users.splice(signup.users.indexOf(message.author.id), 1);

            await updateDoc("config", "signups", signup);

            return message.reply("You have been removed!");

        }

        else {
            return message.reply("You already been removed");
        }
    }
};

export const view_signup: Command = {
    name: "viewsignup",
    aliases: [
        "viewsignups",
        "vs"
    ],
    description: "!viewsignup <Page Number>",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        let page: number = parseInt(args[0]) || 1;
        let signup: Signups = await getDoc("config", "signups");

        if (signup.users.length === 0) {
            return message.reply("No signups.");
        }

        const m = <Message>(await message.channel.send({
            embeds:[
                await groupEmbed(page!, client, signup)
            ]
        }));
        await m.react("⬅");
        await m.react("➡");

        const backwards = m.createReactionCollector({filter:backwardsFilter, time: 100000});
        const forwards = m.createReactionCollector({filter:forwardsFilter, time: 100000});

        backwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            await m.edit({
                embeds:[
                    await groupEmbed(--page, client, signup)
                ]
            });
        });
        forwards.on('collect', async () => {
            m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
            await m.edit({
                embeds:[
                    await groupEmbed(++page, client, signup)
                ]
            });
        });
    }
};

async function groupEmbed(page: number = 0, client: Client, signup: Signups) {

    page = page < 1 ? 1 : page;
    let index = (0 + page - 1) * 10
    const fields = [];
    for (let i = index; i < Math.min(index + 10, signup.users.length); ++i) {
        try {
            fields.push({
                name: `${i + 1}) ${((await client.users.fetch(signup.users[i])).username)}`,
                value: `Userid is: ${signup.users[i]}`
            });
        } catch {
            console.log("heh.")
        }
    }

    return new MessageEmbed()
        .setTitle(`Signup list. You are on page ${page! || 1} of ${Math.floor(signup.users.length / 10) + 1}`)
        .setDescription(`${fields.length === 0 ? `There are no signups` : `there are ${signup.users.length} signups`}`)
        .setFields(
            fields
        )
        .setColor(`#${(await getConfig()).colour}`)
        .setTimestamp(new Date())
    ;
}