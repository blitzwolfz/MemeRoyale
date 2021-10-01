import { Client, Message, MessageAttachment, MessageEmbed, MessageReaction, TextChannel, User } from "discord.js";
import { deleteReminder, getAllMatches, getAllQuals, getConfig, getMatch, getProfile, getQual, getReminder, getTemplatedB, updateMatch, updateProfile, updateQual, updateReminder, updateTemplatedB } from "../db";
import type { Command, Match } from "../types";

export const submit: Command = {
    name: "submit",
    description: " `!submit` with an image in the message. Works for both Qualifiers and Matches.",
    group: "tourny",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {

        if (message.channel.type !== "DM") {
            return message
                .reply("You didn't not submit this in the DM with the bot.\nIt has been deleted. Please try again in" +
                    " again in bot dm.")
                .then(async m => {
                    await message.delete()
                    await setTimeout(() => m.delete(), 30000);
                });
        }

        if (message.attachments.size <= 0) {
            return message.reply("Your image was not submitted properly. Contact a mod");
        }

        else if (message.attachments.size > 1) {
            return message.reply("You can't submit more than one image");
        }

        else if ([...message.attachments.values()][0].url.includes("imgur")) {
            return message.reply("You can't submit imgur links");
        }

        let q = function (x: Match) {
            return ((x.p1.userid === message.author.id && !x.p1.memedone) || (x.p2.userid === message.author.id && !x.p2.memedone) && !x.votingperiod);
        };

        let allPossibleQuals =                 (await getAllQuals())
            .filter(x => x.players.some(y => y.userid === message.author.id && !y.memedone)
            ).map(x => x._id)!

        console.log("E", allPossibleQuals)

        let allPossibleMatches = await (await getAllMatches())
            .filter(q)
            .map(x => x._id)
            .concat(
                allPossibleQuals
            )
        ;

        console.log(allPossibleMatches)

        if (allPossibleMatches.length === 0) {
            return await message.author.send("You are not in any match. If you think this is an error, please contact mods.");
        }

        if (allPossibleMatches.length > 1 && !args[0]) {
            message.channel.send("You are in multiple matches. Please mention the corresponding number to submit. For example `!submit 1`");
            for (let i = 0; i < allPossibleMatches.length; i++) {
                await message.channel.send(`${i + 1}) <#${allPossibleMatches[i]}>`);
            }
            return;
        }

        let mId = args[0] ? allPossibleMatches[parseInt(args[0]) - 1] : allPossibleMatches[0];

        let emote = `☑️`
        let msg = await message.channel.send(`Are you sure you want to submit this? If so, click on the the ${emote} to continue. You have 1.5 mins.`);

        await msg.react(`${emote}`);
        let emoteFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === `${emote}` && !user.bot;
        const approve = msg.createReactionCollector({filter:emoteFilter, time: 90000});

        approve.on('collect', async () => {
            let m = await getMatch(mId)

            if (m) {
                let arr = [
                    m.p1,
                    m.p2
                ];

                let player = arr.find(x => x.userid === message.author.id)!;

                if (player.donesplit === false) return message.reply("You can't submit until your portion starts");

                player.memelink = [...message.attachments.values()][0].url;
                player.memedone = true;
                player.donesplit = true;

                if (m.exhibition === false) {
                    await (<TextChannel>client.channels.cache.get("793242781892083742")).send({
                        embeds:[
                            new MessageEmbed()
                                .setDescription(`<@${message.author.id}>/${message.author.tag} has submitted their meme\nChannel: <#${m._id}>`)
                                .setColor(`#${(await getConfig()).colour}`)
                                .setImage([...message.attachments.values()][0].url)
                                .setTimestamp(new Date())
                        ]
                    });
                }

                try {
                    await deleteReminder(player.userid);
                    let r = await getReminder(m._id);

                    r.mention = r.mention.replace(`<@${player.userid}>`, "");

                    await updateReminder(r);
                } catch (error) {
                    console.log("");
                }

                m.p1 === player ? m.p1 = player : m.p2 = player;

                if (m.p1.donesplit && m.p1.memedone && m.p2.donesplit && m.p2.memedone && m.split) {
                    m.split = false;
                    m.p1.time = Math.floor(Date.now() / 1000) - 3200;
                    m.p2.time = Math.floor(Date.now() / 1000) - 3200;
                }

                if (!m.exhibition) {
                    let p = await getProfile(message.author.id)

                    if(p.totalMemes === 0){
                        p.totalMemes += 1;
                        p.totalTime += Math.floor(
                            (
                                Math.floor(
                                    Math.floor(
                                        Date.now() / 1000
                                    ) / 60
                                ) * 60
                            ) - m.p1.time
                        );
                    }

                    else{
                        let oldAverage = p.totalTime, sum = p.totalMemes+1, newTotal = Math.floor((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - m.p1.time);

                        oldAverage = (
                            (sum - 1) * oldAverage + newTotal
                        )/sum;

                        p.totalTime = oldAverage;
                        p.totalMemes += 1;
                    }
                    await updateProfile(p);
                }

                await updateMatch(m);
                return await message.channel.send(`Your meme has been attached for <#${m._id}>!`);
            }

            else {
                let match = await getQual(mId)

                let index = match.players.findIndex(x => x.userid === message.author.id);
                let u = match.players[index];

                if (u.split === false) return message.reply("Can't submit when you haven't started your portion");
                if(u.memedone) return message.reply("You have already submitted a meme.").then(async m => m.channel.send(u.memelink));

                u.split = true;
                u.memedone = true;
                u.memelink = [...message.attachments.values()][0].url;

                await (<TextChannel>client.channels.cache.get("722616679280148504")).send({
                    embeds:[
                        new MessageEmbed()
                            .setDescription(`<@${message.author.id}> has submitted their meme\nChannel: <#${match._id}>`)
                            .setColor(`#${(await getConfig()).colour}`)
                    ]
                }).catch();

                await (<TextChannel>client.channels.cache.get("793242781892083742")).send({
                    embeds: [
                        new MessageEmbed()
                            .setDescription(`<@${message.author.id}> has submitted their meme\nChannel: <#${match._id}>`)
                            .setColor(`#${(await getConfig()).colour}`)
                            .setImage([...message.attachments.values()][0].url)
                            .setTimestamp(new Date())
                    ]
                }).catch();

                match.players[index] = u;

                await updateQual(match);
                await message.reply(`Your meme for your qualifier in <#${match._id}> has been attached.`);

                try {
                    let r = await getReminder(match._id);

                    r.mention = r.mention.replace(`<@${message.author.id}>`, "");

                    await updateReminder(r);
                } catch (error) {
                    console.log("");
                }

                try {
                    await deleteReminder(message.author.id);
                } catch (error) {
                    console.log("");
                }

                let p = await getProfile(message.author.id)
                if(p){
                    if(p.totalMemes === 0){
                        p.totalMemes += 1;
                        p.totalTime += Math.floor((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - u.time)
                    }

                    else{
                        let oldAverage = p.totalTime,
                            sum = p.totalMemes+1,
                            newTotal = Math.floor((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - u.time);

                        oldAverage = ((sum - 1) * oldAverage + newTotal)/sum;

                        p.totalTime = oldAverage;
                        p.totalMemes += 1;
                    }
                }

                await updateProfile(p);

                return;
            }
        });
    }
};

export const qualsubmit: Command = {
    name: "qualsubmit",
    aliases:["qs"],
    description: "",
    group: "tourny",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        if (message.channel.type !== "DM") {
            return message
            .reply("You didn't not submit this in the DM with the bot.\nIt has been deleted. Please try again in" +
                " again in bot dm.")
            .then(async m => {
                await message.delete()
                await setTimeout(() => m.delete(), 30000);
            });
        }

        if (message.content.includes("imgur")) {
            return message.reply("You can't submit imgur links");
        }

        if (message.attachments.size > 1) {
            return message.reply("You can't submit more than one image");
        }

        else if (message.attachments.size <= 0) {
            return message.reply("Your image was not submitted properly. Contact a mod");
        }

        else if (message.channel.type !== "DM") {
            return message.reply("You didn't not submit this in the DM with the bot.\nPlease delete and try again.");
        }

        else if ([...message.attachments.values()][0].url.toString().includes("mp4")) {
            return message.reply("Video submissions aren't allowed");
        }
        else {
            let allQ = await getAllQuals();
            let match = allQ.find(x => x.players.some(y => y.userid === message.author.id))!;
            // let match = allQ.find(x => x.players.find(y => y.userid === message.author.id && y.memedone === false))!;
            if(!match) return message.reply("You don't seem to be in a qualifier. If this is wrong, please contact" +
                " mods.")
            let index = match.players.findIndex(x => x.userid === message.author.id);
            let u = match.players[index];

            if (u.split === false) return message.reply("Can't submit when you haven't started your portion");
            if(u.memedone) return message.reply("You have already submitted a meme.").then(async m => m.channel.send(u.memelink));

            u.split = true;
            u.memedone = true;
            u.memelink = [...message.attachments.values()][0].url;

            await (<TextChannel>client.channels.cache.get("722616679280148504")).send({
                embeds:[
                    new MessageEmbed()
                        .setDescription(`<@${message.author.id}> has submitted their meme\nChannel: <#${match._id}>`)
                        .setColor(`#${(await getConfig()).colour}`)
                ]
            }).catch();

            await (<TextChannel>client.channels.cache.get("793242781892083742")).send({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`<@${message.author.id}> has submitted their meme\nChannel: <#${match._id}>`)
                        .setColor(`#${(await getConfig()).colour}`)
                        .setImage([...message.attachments.values()][0].url)
                        .setTimestamp(new Date())
                ]
            }).catch();

            match.players[index] = u;

            await updateQual(match);
            await message.reply(`Your meme for your qualifier in <#${match._id}> has been attached.`);

            try {
                let r = await getReminder(match._id);

                r.mention = r.mention.replace(`<@${message.author.id}>`, "");

                await updateReminder(r);
            } catch (error) {
                console.log("");
            }

            try {
                await deleteReminder(message.author.id);
            } catch (error) {
                console.log("");
            }

            let p = await getProfile(message.author.id)
            if(p){
                if(p.totalMemes === 0){
                    p.totalMemes += 1;
                    p.totalTime += Math.floor((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - u.time)
                }

                else{
                    let oldAverage = p.totalTime,
                        sum = p.totalMemes+1,
                        newTotal = Math.floor((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - u.time);

                    oldAverage = ((sum - 1) * oldAverage + newTotal)/sum;

                    p.totalTime = oldAverage;
                    p.totalMemes += 1;
                }
            }

            await updateProfile(p);

            return;
        }
    }
};

export const modsubmit: Command = {
    name: "submit -mod",
    description: "`!submit -mod <1 | 2> #channel` with an image in the message.",
    group: "tourny",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {

        let m = await getMatch(message.mentions.channels.first()!.id);

        if (!m) {
            return await message.author.send("Match doesn't exist.");
        }

        let arr = [
            m.p1,
            m.p2
        ];

        let player = arr[parseInt(args[0]) - 1];

        //Mod submit assumes their portion started already, unless bug from other area
        //if(player.donesplit === false) return message.reply("You can't submit until your portion starts");

        player.memelink = [...message.attachments.values()][0].url;
        player.memedone = true;
        player.donesplit = true;

        if (m.exhibition === false) {
            await (<TextChannel>client.channels.cache.get("793242781892083742")).send({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`<@${player.userid}>/${(await client.users.cache.get(player.userid))!.tag} has submitted their meme\nChannel: <#${m._id}>`)
                        .setTimestamp(new Date())
                        .setImage([...message.attachments.values()][0].url)
                        .setColor(`#${(await getConfig()).colour}`)
                ]
            });
        }

        m.p1 === player ? m.p1 = player : m.p2 = player;

        try {
            await deleteReminder(player.userid);
            let r = await getReminder(m._id);

            r.mention = r.mention.replace(`<@${player.userid}>`, "");

            await updateReminder(r);
        } catch (error) {
            console.log("");
        }

        if (m.p1.donesplit && m.p1.memedone && m.p2.donesplit && m.p2.memedone && m.split) {
            m.split = false;
            m.p1.time = Math.floor(Date.now() / 1000) - 3200;
            m.p2.time = Math.floor(Date.now() / 1000) - 3200;
        }

        let p = await getProfile(player.userid)

        if(p.totalMemes === 0 && m.exhibition === false){
            p.totalMemes += 1;
            p.totalTime += Math.floor((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - m.p1.time)
        }

        else{
            if(m.exhibition === false){
                let oldAverage = p.totalTime, sum = p.totalMemes+1, newTotal = Math.floor((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - m.p1.time);

                oldAverage = ((sum - 1) * oldAverage + newTotal)/sum;

                p.totalTime = oldAverage;
                p.totalMemes += 1;
            }
        }

        await updateProfile(p)

        await updateMatch(m);
        return await message.channel.send(`Your meme has been attached for <@${player.userid}> in <#${m._id}>!`);
    }
};

export const modqualsubmit: Command = {
    name: "qualsubmit -mod",
    description: "`!qualsubmit -mod <player position> #channel` with an image in the message.",
    group: "tourny",
    groupCommand: true,
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    serverOnlyCommand:true,
    async execute(message: Message, client: Client, args: string[]) {
        if (message.content.includes("imgur")) {
            return message.reply("You can't submit imgur links");
        }

        if (message.attachments.size > 1) {
            return message.reply("You can't submit more than one image");
        }

        else if (message.attachments.size <= 0) {
            return message.reply("Your image was not submitted properly. Contact a mod");
        }

        else if ([...message.attachments.values()][0].url.toString().includes("mp4")) {
            return message.reply("Video submissions aren't allowed");
        }
        else {
            let match = await getQual(message.mentions.channels.first()!.id);
            console.log(args)
            console.log(args)
            let index = parseInt(args[0]) - 1;
            let u = match.players[index];

            //Modsubmit so their portion started already, unless bug from other area
            //if(u.split === false) return message.reply("Can't submit when you haven't started your portion");

            u.split = true;
            u.memedone = true;
            u.failed = false
            u.memelink = [...message.attachments.values()][0].url;

            await (<TextChannel>client.channels.cache.get("793242781892083742")).send({
                embeds:[
                    new MessageEmbed()
                        .setDescription(`<@${u.userid}>\\${client.users.cache.get(u.userid)?.tag} has submitted their meme\nChannel: <#${match._id}>`)
                        .setImage([...message.attachments.values()][0].url)
                        .setTimestamp(new Date())
                        .setColor(`#${(await getConfig()).colour}`)
                ]
            });

            match.players[index] = u;

            await updateQual(match);

            try {
                let r = await getReminder(match._id);

                r.mention = r.mention.replace(`<@${u.userid}>`, "");

                await updateReminder(r);
            } catch (error) {
                console.log("");
            }

            try {
                await deleteReminder(u.userid);
            } catch (error) {
                console.log("");
            }

            let p = await getProfile(u.userid)

            if(p.totalMemes === 0){
                p.totalMemes += 1;
                p.totalTime += Math.floor((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - u.time)
            }

            else{
                let oldAverage = p.totalTime, sum = p.totalMemes+1, newTotal = Math.floor((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - u.time);

                oldAverage = ((sum - 1) * oldAverage + newTotal)/sum;

                p.totalTime = oldAverage;
                p.totalMemes += 1;
            }

            await updateProfile(p);

            return message.reply(`The meme for <@${u.userid}> qualifier has been attached.`);
        }
    }
};

export const templateSubmission: Command = {
    name: "template",
    description: " `!template` with an image in the message. You gain 2 points for each template",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        let channel = <TextChannel>client.channels.cache.get("722291683030466621");

        if (message.attachments.size > 10) {//&& !args.includes("-mod")
            return message.reply("You can't submit more than ten images due to Discord limit.");
        }

        if (message.attachments.size > 1 && !args.includes("-mod")) {
            return message.reply("You can't submit more than ten images");
        }

        else if (message.attachments.size <= 0) {
            return message.reply("Your image was not submitted properly. Contact a mod");
        }

        else {

            if (args.includes("-mod")) {
                //let id = await getUser(await message.author.id)
                let e = await getTemplatedB();

                for (let i = 0; i < [...message.attachments.values()].length; i++) {
                    e.list.push([...message.attachments.values()][i].url);
                    // if(id){
                    //     await updateProfile(id, "points", 2)
                    // } 

                    let attach = new MessageAttachment([...message.attachments.values()][i].url);

                    await (<TextChannel>await client.channels.fetch("724827952390340648"))
                        .send({
                            content:"New template: ",
                            files:[attach]
                        });
                }

                await updateTemplatedB(e.list);

                await getProfile(message.author.id).then(async p => {
                    p.points += ([...message.attachments.values()].length * 2);
                    await updateProfile(p);
                });

                return message.reply(`You gained ${[...message.attachments.values()].length * 2} points for submitting ${[...message.attachments.values()].length} templates.`);
            }

            else {
                for (let i = 0; i < [...message.attachments.values()].length; i++) {
                    //await channel.send(`${message.attachments.array()[i].url}`)

                    await channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setTitle(`${message.author.username} has submitted a new template(s)`)
                                .setDescription(`<@${message.author.id}>`)
                                .setImage([...message.attachments.values()][i].url)
                        ]
                    }).then(async message => {
                        await message.react('🏁');
                        await message.react('🗡️');
                    });
                }

                await message
                    .reply({
                        content:`Thank you for submitting templates. You will gain a maximum of ${[...message.attachments.values()].length * 2} points if they are approved. You currently have ${(await getProfile(message.author.id)).points} points`,
                        allowedMentions: { repliedUser: false }
                    });
            }
        }
    }
};

export const themeSubmission: Command = {
    name: "themesubmit",
    description: " You gain 2 points for each theme",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    slashCommand:false,
    serverOnlyCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        let channel = <TextChannel>client.channels.cache.get("722291683030466621");

        if (message.channel.type !== "DM") {
            message.reply("Please dm bot theme");
            return message.delete();
        }

        //var args: Array<string> = message.content.slice(process.env.PREFIX!.length).trim().split(/ +/g);
        let targs = args.join(" ").split(",");
        console.log(targs);

        if (args.length === 0) return message.reply("Please enter a theme");

        if (targs.length > 1) return message.reply("Can only enter one theme at a time");

        let em = new MessageEmbed()
        .setTitle(`${message.author.username} has submitted a new Theme(s)`)
        .setDescription(`<@${message.author.id}>`);

        for (let i = 0; i < targs.length; i++) {
            em.addField(`Theme: ${i + 1}`, targs[i]);
        }

        await channel.send({
            embeds:[
                em
            ]
        }).then(async message => {
            await message.react('🏁');
            await message.react('🗡️');
        });

        await message.reply(`Thank you for submitting themes. You will gain a maximum of ${targs.length} points if they are approved. You currently have ${(await getProfile(message.author.id)).points} points`);
    }
};

// export const submit: Command = {
//     name: "submit",
//     description: " `!submit` with an image in the message. Do `!submit -duel` if you are in a duel.",
//     group: "tourny",
//     groupCommand: true,
//     owner: false,
//     admins: false,
//     mods: false,
//     slashCommand:false,
//     serverOnlyCommand:false,
//     async execute(message: Message, client: Client, args: string[]) {
//
//         if (message.channel.type !== "DM") {
//             return message
//                 .reply("You didn't not submit this in the DM with the bot.\nIt has been deleted. Please try again in" +
//                     " again in bot dm.")
//                 .then(async m => {
//                     await message.delete()
//                     await setTimeout(() => m.delete(), 30000);
//                 });
//         }
//
//         if (message.attachments.size <= 0) {
//             return message.reply("Your image was not submitted properly. Contact a mod");
//         }
//
//         else if (message.attachments.size > 1) {
//             return message.reply("You can't submit more than one image");
//         }
//
//         else if ([...message.attachments.values()][0].url.includes("imgur")) {
//             return message.reply("You can't submit imgur links");
//         }
//
//         let q = function (x: Match) {
//             return ((x.p1.userid === message.author.id && !x.p1.memedone) || (x.p2.userid === message.author.id && !x.p2.memedone) && !x.votingperiod);
//         };
//
//         let allPossibleMatches = await (await getAllMatches()).filter(q);
//
//         if (allPossibleMatches.length === 0) {
//             return await message.author.send("You are not in any match. If you think this is an error, please contact mods.");
//         }
//
//         if (allPossibleMatches.length > 1 && !args[0]) {
//             message.channel.send("You are in multiple matches. Please mention the corresponding number to submit. For example `!submit 1`");
//             for (let i = 0; i < allPossibleMatches.length; i++) {
//                 await message.channel.send(`${i + 1}) <#${allPossibleMatches[i]._id}>`);
//                 i += 1;
//             }
//             return;
//         }
//
//         let m = args[0] ? allPossibleMatches[parseInt(args[0]) - 1] : allPossibleMatches[0];
//
//         let arr = [
//             m.p1,
//             m.p2
//         ];
//
//         let player = arr.find(x => x.userid === message.author.id)!;
//
//         if (player.donesplit === false) return message.reply("You can't submit until your portion starts");
//
//         player.memelink = [...message.attachments.values()][0].url;
//         player.memedone = true;
//         player.donesplit = true;
//
//         if (m.exhibition === false) {
//             await (<TextChannel>client.channels.cache.get("793242781892083742")).send({
//                 embeds:[
//                     new MessageEmbed()
//                         .setDescription(`<@${message.author.id}>/${message.author.tag} has submitted their meme\nChannel: <#${m._id}>`)
//                         .setColor(`#${(await getConfig()).colour}`)
//                         .setImage([...message.attachments.values()][0].url)
//                         .setTimestamp(new Date())
//                 ]
//             });
//         }
//
//         try {
//             await deleteReminder(player.userid);
//             let r = await getReminder(m._id);
//
//             r.mention = r.mention.replace(`<@${player.userid}>`, "");
//
//             await updateReminder(r);
//         } catch (error) {
//             console.log("");
//         }
//
//         m.p1 === player ? m.p1 = player : m.p2 = player;
//
//         if (m.p1.donesplit && m.p1.memedone && m.p2.donesplit && m.p2.memedone && m.split) {
//             m.split = false;
//             m.p1.time = Math.floor(Date.now() / 1000) - 3200;
//             m.p2.time = Math.floor(Date.now() / 1000) - 3200;
//         }
//
//         if (!m.exhibition) {
//             let p = await getProfile(message.author.id)
//
//             if(p.totalMemes === 0){
//                 p.totalMemes += 1;
//                 p.totalTime += Math.floor(
//                     (
//                         Math.floor(
//                             Math.floor(
//                                 Date.now() / 1000
//                             ) / 60
//                         ) * 60
//                     ) - m.p1.time
//                 );
//             }
//
//             else{
//                 let oldAverage = p.totalTime, sum = p.totalMemes+1, newTotal = Math.floor((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - m.p1.time);
//
//                 oldAverage = (
//                     (sum - 1) * oldAverage + newTotal
//                 )/sum;
//
//                 p.totalTime = oldAverage;
//                 p.totalMemes += 1;
//             }
//             await updateProfile(p);
//         }
//
//         await updateMatch(m);
//         return await message.channel.send(`Your meme has been attached for <#${m._id}>!`);
//     }
// };