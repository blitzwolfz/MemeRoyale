import { Client, MessageEmbed, TextChannel } from "discord.js"
import { deleteMatch, getAllMatches, getConfig, updateMatch } from "../../db"
import { Match } from "../../types"
import { grandwinner, winner } from "./utils"

// export async function backgroundMatchLoop(client: Client) {
//     let matches = await getAllMatches()

//     for (let m of matches) {
//         try {
//             console.log(m)
//             console.log((Math.floor(Date.now())/1000 - m.p1.time))
//             console.log((Math.floor(Date.now())/1000 - m.p1.time > 3200))
//             console.log((Math.floor(Date.now())/1000 - m.votetime))
//             console.log((Math.floor(Date.now())/1000 - m.votetime > 7200))
//             if (m.p1.donesplit === true && m.p1.memedone === false && (Math.floor(Date.now())/1000 - m.p1.time > 3200) ||
//                 m.p2.donesplit === true && m.p2.memedone === false && (Math.floor(Date.now())/1000 - m.p2.time > 3200)){
//                     m.p1.donesplit = true
//                     m.p2.donesplit = true
//                     m.split = false
//                     m.votingperiod = false
//                     await updateMatch(m)
//             }

//             if (m.p1.donesplit && m.p2.donesplit && m.split === false && m.votingperiod === false) {
//                 console.log("HMM")
//                 await matchVotingLogic(client, m)
//             }

//             if (m.votingperiod === true && (Math.floor(Date.now() / 1000) - m.votetime > 7200)) {
//                 await matchResults(client, m)
//             }
//         } catch (error) {
//             console.log(error.message)
//         }
//     }
// }

export async function backgroundMatchLoop(client: Client) {
    let matches = await getAllMatches()

    for (let m of matches) {
        try {
            if (m.p1.donesplit === true && m.p1.memedone === false && (Math.floor(Date.now())/1000 - m.p1.time > 3200) ||
                m.p2.donesplit === true && m.p2.memedone === false && (Math.floor(Date.now())/1000 - m.p2.time > 3200)){
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
                await matchVotingLogic(client, m)
            }

            if (m.votingperiod === true && (Math.floor(Date.now() / 1000) - m.votetime > 7200)) {
                await matchResults(client, m)
            }
            
        } catch (error) {
            console.log(error.message)
        }
    }
}

async function matchVotingLogic(client: Client, m: Match) {

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
            .setDescription(`Vote for Meme 1 by reacting with 1️⃣\nVote for Meme 2 by reacting with 2️⃣\nYou have **2 hours** to vote`)
            .setColor(await (await getConfig()).colour)
    ).then(async (msg) => {
        msg.react('1️⃣')
        msg.react('2️⃣')
        m.messageID.push(msg.id)
    })


    //await channel.send(`<@&719936221572235295>`)

    m.votingperiod = true
    m.votetime = (Math.floor(Date.now() / 1000))

    await updateMatch(m)
}

async function matchResults(client: Client, m: Match) {
    let channel = <TextChannel>await client.channels.cache.get(m._id)

    if(m.p1.memedone === true && m.p2.memedone === false || m.p1.memedone === false && m.p2.memedone === true){
        console.log("M")
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

        (<TextChannel>await client.channels.cache.get("734565012378746950")).send(
            new MessageEmbed()
                .setTitle(`${client.users.cache.get(m.p1.userid)?.username}-vs-${client.users.cache.get(m.p1.userid)?.username}`)
                .setDescription(`${client.users.cache.get(m.p1.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}\n` +
                    `by a score of ${m.p1.votes} to ${m.p2.votes} with Meme 1`)
                .setColor(await (await getConfig()).colour)
        )
        
        if(await (await getConfig()).isfinale === false){
            channel.send(
                await winner(client, m.p1.userid)
            )
        }

        else{
            channel.send(
                await grandwinner(client, m.p1.userid)
            )
        }

    }

    else if (m.p1.votes < m.p2.votes) {

        channel.send(
            new MessageEmbed()
                .setTitle(`${client.users.cache.get(m.p2.userid)?.username} has won!`)
                .setDescription(`${client.users.cache.get(m.p2.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}\n` +
                    `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
                .setColor(await (await getConfig()).colour)
        );

        (<TextChannel>await client.channels.cache.get("734565012378746950")).send(
            new MessageEmbed()
                .setTitle(`${client.users.cache.get(m.p2.userid)?.username}-vs-${client.users.cache.get(m.p1.userid)?.username}`)
                .setDescription(`${client.users.cache.get(m.p2.userid)?.username} beat ${client.users.cache.get(m.p1.userid)?.username}\n` +
                    `by a score of ${m.p2.votes} to ${m.p1.votes} with Meme 2`)
                .setColor(await (await getConfig()).colour)
        )

        if(await (await getConfig()).isfinale === false){
            channel.send(
                await winner(client, m.p2.userid)
            )
        }

        else{
            channel.send(
                await grandwinner(client, m.p2.userid)
            )
        }
    }

    else if (m.p1.votes === m.p2.votes) {
        channel.send(
            new MessageEmbed()
                .setTitle(`Both users come to a draw`)
                .setDescription(`${client.users.cache.get(m.p2.userid)?.username} and ${client.users.cache.get(m.p1.userid)?.username}\n` +
                    `both got a score of ${m.p2.votes}`)
                .setColor(await (await getConfig()).colour)
        );

        channel.send(`<@${m.p1.userid}> <@${m.p2.userid}> You have 48h to complete this re-match. Contact a ref to begin, you may also split your match`);

    }

    return await deleteMatch(m._id)
}