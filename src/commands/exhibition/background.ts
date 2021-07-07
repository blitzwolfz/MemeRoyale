import { Client, MessageEmbed, TextChannel } from "discord.js";
import { deleteMatch, getAllMatches, getConfig, getDuelProfile, getExhibition, updateDuelProfile, updateExhibition, updateMatch } from "../../db";
import type { Match } from "../../types";
import { winner } from "../match/utils";
import { dateBuilder } from "../util";

export async function backgroundExhibitionLoop(client: Client) {
    let matches = await getAllMatches();
    var ex = await getExhibition();
    //let guild = await client.guilds.cache.get("719406444109103117")

    for (let m of matches) {
        try {
            if (m.exhibition === false) continue;
            if (m.p1.donesplit === true && m.p1.memedone === false && (Math.floor(Date.now()) / 1000 - m.p1.time > 1800) || m.p2.donesplit === true && m.p2.memedone === false && (Math.floor(Date.now()) / 1000 - m.p2.time > 1800)) {
                let winner = (m.p1.memedone ? `${client.users.cache.get(m.p1.userid)?.username}` : `${client.users.cache.get(m.p2.userid)?.username}`);
                (<TextChannel>await client.channels.cache.get(m._id)).send(new MessageEmbed()
                .setTitle(`${client.users.cache.get(m.p1.userid)?.username}-vs-${client.users.cache.get(m.p1.userid)?.username}`)
                .setDescription(`${winner} has won!`)
                .setColor(await (await getConfig()).colour));
                await deleteMatch(m._id);
            }

            if (m.p1.donesplit && m.p1.memedone && m.p2.memedone && m.p2.donesplit && m.split === false && m.votingperiod === false) {
                await exhibitionVotingLogic(client, m);
            }

            if (m.votingperiod === true && (Math.floor(Date.now() / 1000) - m.votetime > 7200) || m.votingperiod === true && (m.p1.votes >= 5 || m.p2.votes >= 5)) {
                await exhibitionResults(client, m);
            }

        } catch (error) {
            console.log(error.message);
            console.log(error.stack);
        }
    }

    let i = ex.activematches.length;

    while (i--) {
        let ch = <TextChannel>await client.channels.cache.get(ex.activematches[i]);
        let guild = await client.guilds.cache.get((<TextChannel>await client.channels.cache.get(ch.id)).guild.id)!;

        if (!guild?.channels.cache.has(ex.activematches[i])) {
            ex.activematches.splice(i, 1);
        }

        if (Math.floor(Date.now() / 1000) - Math.floor(ch.createdTimestamp / 1000) > 4500) {
            await ch.delete();
            ex.activematches.splice(i, 1);
        }

        if (!ch || ch === undefined) {
            ex.activematches.splice(i, 1);
        }
    }

    for (let i = 0; i < ex.cooldowns.length; i++) {

        let us = await client.users.fetch(ex.cooldowns[i].user);

        if (!ex.cooldowns[i]) {
            continue;
        }

        if (Math.floor(Date.now() / 1000) - Math.floor(ex.cooldowns[i].time) >= 300) {
            try {
                await us.send("You can start another exhibition match!");
            } catch {
                console.log("Could not dm user that cooldown is over");
            }

            ex.cooldowns.splice(i, 1);
            i++;
        }
    }
    await updateExhibition(ex);
}

async function exhibitionVotingLogic(client: Client, m: Match) {

    let channel = <TextChannel>client.channels.cache.get(m._id)!;
    let guild = await client.guilds.cache.get((<TextChannel>await client.channels.cache.get(m._id)).guild.id)!;


    if (Math.floor(Math.random() * (5 - 1) + 1) % 2 === 1) {
        let temp = m.p1;

        m.p1 = m.p2;

        m.p2 = temp;
    }

    if (m.temp.istheme) {
        channel.send(new MessageEmbed()
        .setTitle("Theme")
        .setDescription(`The theme is ${m.temp.link}`)
        .setColor("GREEN")).then(async msg => {
            m.messageID.push(msg.id);
        });
    }

    else {
        channel.send(new MessageEmbed()
        .setTitle("Template")
        .setImage(m.temp.link)
        .setColor("GREEN")).then(async msg => {
            m.messageID.push(msg.id);
        });
    }

    channel.send(new MessageEmbed()
    .setTitle("Player 1's Meme")
    .setImage(m.p1.memelink)
    .setColor((await getConfig()).colour)).then(async msg => {
        m.messageID.push(msg.id);
    });

    channel.send(new MessageEmbed()
    .setTitle("Player 2's Meme")
    .setImage(m.p2.memelink)
    .setColor((await getConfig()).colour)).then(async msg => {
        m.messageID.push(msg.id);
    });

    await channel.send(new MessageEmbed()
    .setTitle("Voting time")
    .setDescription(`Vote for Meme 1 by reacting with 1️⃣\nVote for Meme 2 by reacting with 2️⃣\nYou have **15 mins or until a player gets 5 votes** to vote`)
    .setColor((await getConfig()).colour)).then(async (msg) => {
        msg.react('1️⃣');
        msg.react('2️⃣');
        m.messageID.push(msg.id);
    });

    let id = guild.roles.cache.find(x => x.name.toLowerCase().includes("duel"));
    require('dotenv').config();
    if (id && !process.env.dev) await channel.send(`${id}`);

    m.votingperiod = true;
    m.votetime = ((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - 6300);

    return await updateMatch(m);
}

async function exhibitionResults(client: Client, m: Match) {
    let channel = <TextChannel>await client.channels.cache.get(m._id);
    let guild = await client.guilds.cache.get((<TextChannel>await client.channels.cache.get(m._id)).guild.id)!;
    let d1 = await getDuelProfile(m.p1.userid, guild.id);
    let d2 = await getDuelProfile(m.p2.userid, guild.id);
    let u1 = await client.users.fetch(d1._id);
    let u2 = await client.users.fetch(d2._id);
    // let ex = await getExhibition()
    // ex.activematches.push(m._id)
    // await updateExhibition(ex)

    if (m.p1.memedone === true && m.p2.memedone === false || m.p1.memedone === false && m.p2.memedone === true) {
        if (m.p1.memedone) {
            channel.send(new MessageEmbed()
            .setTitle(`${client.users.cache.get(m.p1.userid)?.username} has won!`)
            .setDescription(`${client.users.cache.get(m.p1.userid)?.username} beat ${client.users.cache.get(m.p2.userid)?.username}`)
            .setColor((await getConfig()).colour));
        }

        if (m.p2.memedone) {
            channel.send(new MessageEmbed()
            .setTitle(`${client.users.cache.get(m.p2.userid)?.username} has won!`)
            .setDescription(`${client.users.cache.get(m.p2.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}`)
            .setColor((await getConfig()).colour));
        }
    }

    if (m.p1.votes > m.p2.votes) {
        d1.wins += 1;
        d1.votetally += m.p1.votes;
        d1.points += (25 + (m.p1.votes * 5));
        d2.loss += 1;
        d2.votetally += m.p2.votes;
        d2.points += (m.p2.votes * 5);


        channel.send(new MessageEmbed()
        .setTitle(`${client.users.cache.get(m.p1.userid)?.username} has won!`)
        .setDescription(`${client.users.cache.get(m.p1.userid)?.username} beat ${client.users.cache.get(m.p2.userid)?.username}\n` + `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
        .setColor(await (await getConfig()).colour));

        u1.send(new MessageEmbed()
        .setTitle(`${client.users.cache.get(m.p1.userid)?.username} has won!`)
        .setDescription(`${client.users.cache.get(m.p1.userid)?.username} beat ${client.users.cache.get(m.p2.userid)?.username}\n` + `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
        .setColor(await (await getConfig()).colour));

        u2.send(new MessageEmbed()
        .setTitle(`${client.users.cache.get(m.p1.userid)?.username} has won!`)
        .setDescription(`${client.users.cache.get(m.p1.userid)?.username} beat ${client.users.cache.get(m.p2.userid)?.username}\n` + `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
        .setColor(await (await getConfig()).colour));

        channel.send(await winner(client, m.p1.userid));

        u1.send(await winner(client, m.p1.userid));

        try {
            await (<TextChannel>client.channels.cache.get((await guild.channels.cache.find(x => x.name.toLowerCase() === "winning-duel-memes")!.id))).send(new MessageEmbed()
            .setColor(await (await getConfig()).colour)
            .setImage(m.p1.memelink)
            .setDescription(`${client.users.cache.get(m.p1.userid)?.username} beat ${client.users.cache.get(m.p2.userid)?.username}\n` + `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
            .setFooter(dateBuilder()));
        } catch (error) {
            console.log(error.message);
            console.log("No winning duel channel");
        }
    }

    else if (m.p1.votes < m.p2.votes) {
        d1.loss += 1;
        d1.votetally += m.p1.votes;
        d1.points += (m.p1.votes * 5);
        d2.wins += 1;
        d2.votetally += m.p2.votes;
        d2.points += (25 + (m.p2.votes * 5));

        channel.send(new MessageEmbed()
        .setTitle(`${client.users.cache.get(m.p2.userid)?.username} has won!`)
        .setDescription(`${client.users.cache.get(m.p2.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}\n` + `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
        .setColor(await (await getConfig()).colour));

        u1.send(new MessageEmbed()
        .setTitle(`${client.users.cache.get(m.p2.userid)?.username} has won!`)
        .setDescription(`${client.users.cache.get(m.p2.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}\n` + `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
        .setColor(await (await getConfig()).colour));

        u2.send(new MessageEmbed()
        .setTitle(`${client.users.cache.get(m.p2.userid)?.username} has won!`)
        .setDescription(`${client.users.cache.get(m.p2.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}\n` + `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
        .setColor(await (await getConfig()).colour));

        channel.send(await winner(client, m.p2.userid));

        u2.send(await winner(client, m.p2.userid));

        try {
            await (<TextChannel>client.channels.cache.get((await guild.channels.cache.find(x => x.name.toLowerCase() === "winning-duel-memes")!.id))).send(new MessageEmbed()
            .setColor(await (await getConfig()).colour)
            .setImage(m.p2.memelink)
            .setDescription(`${client.users.cache.get(m.p2.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}\n` + `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
            .setFooter(dateBuilder()));
        } catch (error) {
            console.log(error.message);
            console.log("No winning duel channel");
        }
    }

    else if (m.p1.votes === m.p2.votes) {
        d1.votetally += m.p1.votes;
        d2.votetally += m.p2.votes;
        d1.points += (m.p1.votes * 5);
        d2.points += (m.p2.votes * 5);
        channel.send(new MessageEmbed()
        .setTitle(`Both users come to a draw`)
        .setDescription(`${client.users.cache.get(m.p2.userid)?.username} and ${client.users.cache.get(m.p1.userid)?.username}\n` + `both got a score of ${m.p2.votes}`)
        .setColor(await (await getConfig()).colour));

        u1.send(new MessageEmbed()
        .setTitle(`Both users come to a draw`)
        .setDescription(`${client.users.cache.get(m.p2.userid)?.username} and ${client.users.cache.get(m.p1.userid)?.username}\n` + `both got a score of ${m.p2.votes}`)
        .setColor(await (await getConfig()).colour));

        u2.send(new MessageEmbed()
        .setTitle(`Both users come to a draw`)
        .setDescription(`${client.users.cache.get(m.p2.userid)?.username} and ${client.users.cache.get(m.p1.userid)?.username}\n` + `both got a score of ${m.p2.votes}`)
        .setColor(await (await getConfig()).colour));
    }

    if (guild.name.toLowerCase() !== "MemeRoyale".toLowerCase()) {
        let e = new MessageEmbed()
        .setTitle("Interested in more?")
        .setDescription("Come join us in the " + "in the Meme Royale Server.\n" + "You can play more duels, and participate in our tournament\n" + "with a chance of winning our Cash Prizes.\nClick on the link in the title to join.")
        .setURL("https://discord.gg/GK3R5Vt3tz")
        .setColor(await (await getConfig()).colour);


        await channel.send(e);
    }

    await updateDuelProfile(d1._id, d1, guild.id);
    await updateDuelProfile(d2._id, d2, guild.id);
    return await deleteMatch(m._id);
}