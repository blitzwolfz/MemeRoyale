import { Client, MessageEmbed, TextChannel } from "discord.js"
import { deleteMatch, getAllMatches, getConfig, getExhibition, updateExhibition, updateMatch } from "../../db"
import { Match } from "../../types"
import { winner } from "../match/utils"
import { dateBuilder } from "../util"

export async function backgroundExhibitionLoop(client: Client) {
    let matches = await getAllMatches()
    var ex = await getExhibition()
    let guild = await client.guilds.cache.get("719406444109103117")

    for (let m of matches) {
        try {
            if(m.exhibition === false) continue;
            if (m.p1.donesplit === true && m.p1.memedone === false && (Math.floor(Date.now())/1000 - m.p1.time > 1800) ||
                m.p2.donesplit === true && m.p2.memedone === false && (Math.floor(Date.now())/1000 - m.p2.time > 1800)){
                    (<TextChannel>await client.channels.cache.get(m._id)).send(
                        new MessageEmbed()
                            .setTitle(`${client.users.cache.get(m.p1.userid)?.username}-vs-${client.users.cache.get(m.p1.userid)?.username}`)
                            .setDescription(`${m.p1.memedone ? `${client.users.cache.get(m.p1.userid)?.username}` : `${client.users.cache.get(m.p2.userid)?.username}`} has won!`)
                            .setColor(await (await getConfig()).colour)
                    )
                await deleteMatch(m._id)
            }

            if (m.p1.donesplit && m.p1.memedone 
                && m.p2.memedone && m.p2.donesplit 
                && m.split === false && m.votingperiod === false) {
                await exhibitionVotingLogic(client, m)
            }

            if (m.votingperiod === true && (Math.floor(Date.now() / 1000) - m.votetime > 7200)) {
                await exhibitionResults(client, m)
            }
            
        } catch (error) {
            console.log(error.message)
        }
    }

    for(let ii = 0; ii < ex.activematches.length; ii++){
        

        if(!guild?.channels.cache.has(ex.activematches[ii])){
            ex.activematches.splice(ii, 1)
            ii++
            continue;
        }
        
        let ch = await client.channels?.fetch(ex.activematches[ii])

        if(Math.floor(Date.now() / 1000) - Math.floor(ch.createdTimestamp/1000 ) > 7200){
            await ch.delete()
            ex.activematches.splice(ii, 1)
            ii++
        }
        
        if(!ch || ch === undefined){
            ex.activematches.splice(ii, 1)
            ii++
        }
    }

    for(let i = 0; i < ex.cooldowns.length; i++){

        let us = await client.users.fetch(ex.cooldowns[i].user)

        if(!ex.cooldowns[i]){
            continue
        }

        if(Math.floor(Date.now() / 1000) - Math.floor(ex.cooldowns[i].time) >= 3600){
            try{
                await us.send("You can start another exhibition match!")
            } catch {
                console.log("Could not dm user that cooldown is over")
            }
            
            ex.cooldowns.splice(i, 1)
            i++
        }
    }
    await updateExhibition(ex)
}

async function exhibitionVotingLogic(client: Client, m: Match) {

    let channel = <TextChannel>await client.channels.cache.get(m._id)

    if (Math.floor(Math.random() * (5 - 1) + 1) % 2 === 1) {
        let temp = m.p1

        m.p1 = m.p2

        m.p2 = temp

        //await updateActive(match)
    }

    if (m.temp.istheme) {
        channel.send(
            new MessageEmbed()
                .setTitle("Theme")
                .setDescription(`The theme is ${m.temp.link}`)
                .setColor("GREEN")
        ).then(async msg => {
            m.messageID.push(msg.id)
        })
    }

    else {
        channel.send(
            new MessageEmbed()
                .setTitle("Template")
                .setImage(m.temp.link)
                .setColor("GREEN")
        ).then(async msg => {
            m.messageID.push(msg.id)
        })
    }

    channel.send(
        new MessageEmbed()
            .setTitle("Player 1's Meme")
            .setImage(m.p1.memelink)
            .setColor(await (await getConfig()).colour)
    ).then(async msg => {
        m.messageID.push(msg.id)
    })

    channel.send(
        new MessageEmbed()
            .setTitle("Player 2's Meme")
            .setImage(m.p2.memelink)
            .setColor(await (await getConfig()).colour)
    ).then(async msg => {
        m.messageID.push(msg.id)
    })

    await channel.send(
        new MessageEmbed()
            .setTitle("Voting time")
            .setDescription(`Vote for Meme 1 by reacting with 1️⃣\nVote for Meme 2 by reacting with 2️⃣\nYou have **30 mins** to vote`)
            .setColor(await (await getConfig()).colour)
    ).then(async (msg) => {
        msg.react('1️⃣')
        msg.react('2️⃣')
        m.messageID.push(msg.id)
    })


    //await channel.send(`<@&719936221572235295>`)

    m.votingperiod = true
    m.votetime = ((Math.floor(Date.now() / 1000)) - 5400)

    await updateMatch(m)
}

async function exhibitionResults(client: Client, m: Match) {
    let channel = <TextChannel>await client.channels.cache.get(m._id)

    if(m.p1.memedone === true && m.p2.memedone === false || m.p1.memedone === false && m.p2.memedone === true){
        if(m.p1.memedone){
            channel.send(
                new MessageEmbed()
                    .setTitle(`${client.users.cache.get(m.p1.userid)?.username} has won!`)
                    .setDescription(`${client.users.cache.get(m.p1.userid)?.username} beat ${client.users.cache.get(m.p2.userid)?.username}`)
                    .setColor(await (await getConfig()).colour)
            );
        }

        if(m.p2.memedone){
            channel.send(
                new MessageEmbed()
                    .setTitle(`${client.users.cache.get(m.p2.userid)?.username} has won!`)
                    .setDescription(`${client.users.cache.get(m.p2.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}`)
                    .setColor(await (await getConfig()).colour)
            );
        }
        return;
    }

    if (m.p1.votes > m.p2.votes) {
        channel.send(
            new MessageEmbed()
                .setTitle(`${client.users.cache.get(m.p1.userid)?.username} has won!`)
                .setDescription(`${client.users.cache.get(m.p1.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}\n` +
                    `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
                .setColor(await (await getConfig()).colour)
        );
      
        channel.send(
            await winner(client, m.p1.userid)
        )

        await (<TextChannel>client.channels.cache.get((await client.guilds.cache.find(x => x.name.toLowerCase() === "MemeRoyale".toLowerCase())!
        .channels.cache.find(x => x.name === "winning-duel-memes")!.id))).send(
            new MessageEmbed()
            .setColor("#d7be26")
            .setImage(m.p1.memelink)
            .setDescription(`${client.users.cache.get(m.p1.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}\n` +
            `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
            .setFooter(dateBuilder())
        )
    }

    else if (m.p1.votes < m.p2.votes) {

        channel.send(
            new MessageEmbed()
                .setTitle(`${client.users.cache.get(m.p2.userid)?.username} has won!`)
                .setDescription(`${client.users.cache.get(m.p2.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}\n` +
                    `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
                .setColor(await (await getConfig()).colour)
        );

        channel.send(
            await winner(client, m.p2.userid)
        )

        await (<TextChannel>client.channels.cache.get((await client.guilds.cache.find(x => x.name.toLowerCase() === "MemeRoyale".toLowerCase())!
        .channels.cache.find(x => x.name === "winning-duel-memes")!.id))).send(
            new MessageEmbed()
            .setColor("#d7be26")
            .setImage(m.p2.memelink)
            .setDescription(`${client.users.cache.get(m.p2.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}\n` +
            `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
            .setFooter(dateBuilder())
        )
    }

    else if (m.p1.votes === m.p2.votes) {
        channel.send(
            new MessageEmbed()
                .setTitle(`Both users come to a draw`)
                .setDescription(`${client.users.cache.get(m.p2.userid)?.username} and ${client.users.cache.get(m.p1.userid)?.username}\n` +
                    `both got a score of ${m.p2.votes}`)
                .setColor(await (await getConfig()).colour)
        );
    }

    return await deleteMatch(m._id)
}