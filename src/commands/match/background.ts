import { Client, MessageEmbed, TextChannel } from "discord.js";
import { deleteMatch, deleteReminder, getAllMatches, getConfig, getProfile, updateMatch, updateProfile } from "../../db";
import type { Match } from "../../types";
import { grandwinner, winner } from "./utils";


require('dotenv').config();
// export async function backgroundMatchLoop(client: Client) {
//     let matches = await getAllMatches()

//     for (let m of matches) {
//         try {
//             console.log(m)
//             console.log((Math.floor(Date.now())/1000 - m.p1.time))
//             console.log((Math.floor(Date.now())/1000 - m.p1.time > 3200))
//             console.log((Math.floor(Date.now())/1000 - m.votetime))
//             console.log((Math.floor(Date.now())/1000 - m.votetime > 7200))
//             if (m.p1.donesplit === true && m.p1.memedone === false && (Math.floor(Date.now())/1000 - m.p1.time >
// 3200) || m.p2.donesplit === true && m.p2.memedone === false && (Math.floor(Date.now())/1000 - m.p2.time > 3200)){
// m.p1.donesplit = true m.p2.donesplit = true m.split = false m.votingperiod = false await updateMatch(m) }

//             if (m.p1.donesplit && m.p2.donesplit && m.split === false && m.votingperiod === false) {
//                 console.log("HMM")
//                 await matchVotingLogic(client, m)
//             }

//             if (m.votingperiod === true && (Math.floor(Math.floor(Date.now() / 1000)/60) * 60 - m.votetime > 7200)) {
//                 await matchResults(client, m)
//             }
//         } catch (error) {
//             console.log(error.message)
//         }
//     }
// }

export async function backgroundMatchLoop(client: Client) {
    let matches = await getAllMatches();

    for (let m of matches) {
        try {
            if (m.exhibition === true || m.pause) continue;
            if(m.p1.donesplit && !m.p1.memedone && (Math.floor(Date.now()) / 1000 - m.p1.time > 2700) && m.p2.donesplit && !m.p2.memedone && (Math.floor(Date.now()) / 1000 - m.p2.time > 2700)){
                await (<TextChannel>await client.channels.cache.get(m._id)).send({
                    embeds:[
                        new MessageEmbed()
                            .setTitle(`${client.users.cache.get(m.p1.userid)?.username}-vs-${client.users.cache.get(m.p2.userid)?.username}`)
                            .setDescription(`Both users have have failed!`)
                            .setColor(`#${(await getConfig()).colour}`)
                    ]
                });
                for (const p of [
                    m.p1,
                    m.p2
                ]) {
                    (await (await client.users.fetch(p.userid)).send({
                        embeds:[
                            new MessageEmbed()
                                .setTitle(`${client.users.cache.get(m.p1.userid)?.username}-vs-${client.users.cache.get(m.p2.userid)?.username}`)
                                .setDescription(`Both users have have failed!`)
                                .setColor(`#${(await getConfig()).colour}`)
                        ]
                    }));
                }
                await deleteMatch(m._id);
                continue;
            }

            if (m.p1.donesplit && !m.p1.memedone && (Math.floor(Date.now()) / 1000 - m.p1.time > 2700) || m.p2.donesplit && !m.p2.memedone && (Math.floor(Date.now()) / 1000 - m.p2.time > 2700)) {
                await (<TextChannel>await client.channels.cache.get(m._id)).send({
                    embeds:[
                        new MessageEmbed()
                            .setTitle(`${client.users.cache.get(m.p1.userid)?.username}-vs-${client.users.cache.get(m.p2.userid)?.username}`)
                            .setDescription(`${m.p1.memedone ? `${client.users.cache.get(m.p1.userid)?.username}` : `${client.users.cache.get(m.p2.userid)?.username}`} has won!`)
                            .setColor(`#${(await getConfig()).colour}`)
                    ]
                });

                for (const p of [
                    m.p1,
                    m.p2
                ]) {
                    await (await client.users.fetch(p.userid)).send({
                        embeds:[
                            new MessageEmbed()
                                .setTitle(`${client.users.cache.get(m.p1.userid)?.username}-vs-${client.users.cache.get(m.p2.userid)?.username}`)
                                .setDescription(`${m.p1.memedone ? `${client.users.cache.get(m.p1.userid)?.username}` : `${client.users.cache.get(m.p2.userid)?.username}`} has won! ${!m.p1.memedone ? `${client.users.cache.get(m.p1.userid)?.username}` : `${client.users.cache.get(m.p2.userid)?.username}`} failed to submit on time.`)
                                .setColor(`#${(await getConfig()).colour}`)
                        ]
                    });
                }

                await deleteMatch(m._id);
                continue;
            }

            if (m.p1.donesplit && m.p1.memedone && m.p2.memedone && m.p2.donesplit && m.split === false && m.votingperiod === false) {
                await matchVotingLogic(client, m);
            }

            if (m.votingperiod === true && (Math.floor(Math.floor(Date.now() / 1000) / 60) * 60 - m.votetime > 7200)) {
                await matchResults(client, m);
            }

        } catch (error) {
            console.log(error.message);
        }
    }
}

async function matchVotingLogic(client: Client, m: Match) {

    let channel = <TextChannel>await client.channels.cache.get(m._id);

    if (Math.floor(Math.random() * (5 - 1) + 1) % 2 === 1) {
        let temp = m.p1;

        m.p1 = m.p2;

        m.p2 = temp;

        //await updateActive(match)
    }

    if (m.temp.istheme) {
        channel.send({
            embeds:[
                new MessageEmbed()
                    .setTitle("Theme")
                    .setDescription(`The theme is ${m.temp.link}`)
                    .setColor("GREEN")
            ]
        }).then(async msg => {
            m.messageID.push(msg.id);
        });
    }

    else {
        channel.send({
            embeds:[
                new MessageEmbed()
                    .setTitle("Template")
                    .setImage(m.temp.link)
                    .setColor("GREEN")
            ]
        }).then(async msg => {
            m.messageID.push(msg.id);
        });
    }

    channel.send({
        embeds:[
            new MessageEmbed()
                .setTitle("Player 1's Meme")
                .setImage(m.p1.memelink)
                .setColor(`#${(await getConfig()).colour}`)
        ]
    }).then(async msg => {
        m.messageID.push(msg.id);
    });

    channel.send({
        embeds:[
            new MessageEmbed()
                .setTitle("Player 2's Meme")
                .setImage(m.p2.memelink)
                .setColor(`#${(await getConfig()).colour}`)
        ]
    }).then(async msg => {
        m.messageID.push(msg.id);
    });

    await channel.send({
        embeds:[
            new MessageEmbed()
                .setTitle("Voting time")
                .setDescription(`Vote for Meme 1 by reacting with 1️⃣\nVote for Meme 2 by reacting with 2️⃣\nYou have **2 hours** to vote`)
                .setColor(`#${(await getConfig()).colour}`)
        ]
    }).then(async (msg) => {
        await msg.react('1️⃣');
        await msg.react('2️⃣');
        m.messageID.push(msg.id);
    });


    if(!process.env.dev){
        await channel.send(`<@&719936221572235295>`)
    }

    m.votingperiod = true;
    m.votetime = Math.floor(Math.floor(Date.now() / 1000) / 60) * 60;

    await updateMatch(m);
    await deleteReminder(m._id);
}

async function matchResults(client: Client, m: Match) {
    let channel = <TextChannel>await client.channels.cache.get(m._id);
    let u1 = await getProfile(m.p1.userid);
    let u2 = await getProfile(m.p2.userid);
    let winResultsEmbed = new MessageEmbed();

    for (const t of m.p1.voters.concat(m.p2.voters)) {
        try{
            let u = await getProfile(t)
            if(!u) continue;
            u.points += 2
            u.votetally += 1
            await updateProfile(u)
        } catch{
            console.log("fake")
        }
    }

    if(m.p1.votes === m.p2.votes) {
        winResultsEmbed
        .setTitle(`Both users come to a draw`)
        .setDescription
        (`${client.users.cache.get(m.p1.userid)?.username} and ${client.users.cache.get(m.p2.userid)?.username}\n`
            + `both got a score of ${m.p2.votes}`
        )
        .setColor(`#${(await getConfig()).colour}`)

        await client.users.cache.get(u1._id)!.send({
            embeds:[
                winResultsEmbed
            ]
        });
        await client.users.cache.get(u2._id)!.send({
            embeds:[
                winResultsEmbed
            ]
        })

        await channel.send({
            embeds:[
                winResultsEmbed
            ]
        });

        await channel
        .send(`<@${m.p1.userid}> <@${m.p2.userid}> complete this re-match **ASAP**. Contact a ref to begin, you may also ask for a split match`);
    }

    else {
        let winningPlayer = m.p1.votes > m.p2.votes ? m.p1 : m.p2;
        let loser = m.p1.votes < m.p2.votes ? m.p1 : m.p2
        let winningProfile = m.p1.votes > m.p2.votes ? u1 : u2
        let loserProfile = m.p1.votes < m.p2.votes ? u1 : u2

        winResultsEmbed
            .setTitle(`${client.users.cache.get(winningPlayer.userid)?.username} has won!`)
            .setDescription
            (`${client.users.cache.get(winningPlayer.userid)?.username} beat ${client.users.cache.get(loser.userid)?.username}\n`
                + `by a score of ${winningPlayer.votes} to ${loser.votes} with Meme ${winningPlayer === m.p1 ? 1 : 2}`
            )
        .setColor(`#${(await getConfig()).colour}`)

        await channel.send({
            embeds:[
                winResultsEmbed
            ]
        });

        if ((await getConfig()).isfinale && channel.name.toLowerCase().includes("finale")) {
            await channel.send({
                files:[
                    await grandwinner(client, winningPlayer.userid)
                ]
            });
            await channel.send(`Congratulations on winning this Cycle <@${winningPlayer.userid}>`);

        }

        else {
            await channel.send({
                files:[
                    await winner(client, winningPlayer.userid)
                ]
            });
        }

        await client.users.cache.get(u1._id)!.send({
            embeds:[
                winResultsEmbed
            ]
        });
        await client.users.cache.get(u2._id)!.send({
            embeds:[
                winResultsEmbed
            ]
        });

        await (<TextChannel>await client.channels.cache.get("734565012378746950")).send({
            embeds:[
                winResultsEmbed
                    .setImage(winningPlayer.memelink)
            ]
        });

        loserProfile.loss += 1;
        loserProfile.points += (loser.votes * 5);

        winningProfile.wins += 1;
        winningProfile.points += (winningPlayer.votes * 5) + 25;

        await updateProfile(winningProfile);
        await updateProfile(loserProfile);

    }

    return await deleteMatch(m._id);
}