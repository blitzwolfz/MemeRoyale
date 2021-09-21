import { Client, MessageEmbed, TextChannel } from "discord.js";
import { deleteQual, deleteReminder, getAllQuals, getConfig, getProfile, insertReminder, updateProfile, updateQual } from "../../db";
import type { Qual } from "../../types";
import { emojis, timeconsts } from "../util";
import { QualifierResults } from "./util";

require('dotenv').config();

export async function backgroundQualLoop(client: Client) {
    let quals = await getAllQuals();

    for (let q of quals) {
        try {
            if(q.pause) continue;
            if (q.players.find(x => Math.floor(Date.now() / 1000) - x.time >= 3600 && x.split && !x.failed && !x.memedone)) {
                for (const x of q.players) {
                    if (Math.floor(Date.now() / 1000) - x.time >= 3600 && x.split && !x.failed && !x.memedone) {
                        await (await client.users.fetch(x.userid)).send("You failed to send your meme on time");
                        x.split = true;
                        x.failed = true;
                        q.players[q.players.findIndex(y => y.userid === x.userid)] = x;
                    }
                }
                await updateQual(q);
            }

            if ((q.players.filter(p => p.split && (p.memedone || p.failed)).length === q.players.length) && !q.votingperiod) {
                await matchVotingLogic(client, q);
            }

            if (q.votingperiod && Math.floor(Date.now() / 1000) - q.votetime >= timeconsts.qual.votingtime) {
                await matchResults(client, q);
            }

        } catch (error) {
            console.log(error.message);
        }
    }
}

async function matchVotingLogic(client: Client, m: Qual) {

    if(m.players.filter(p => p.memedone === true).length <= 2){
        m.votingperiod = true
        m.votetime = Math.floor(Date.now()/1000) - 7200
        return await updateQual(m)
    }

    let channel = <TextChannel>await client.channels.cache.get(m._id);
    try{
        await deleteReminder(m._id)
    } catch {

    }


    for (var i = 0; i < m.players.length - 1; i++) {
        var j = i + Math.floor(Math.random() * (m.players.length - i));

        let temp = m.players[j];

        m.players[j] = m.players[i];
        m.players[i] = temp;

    }

    // for (var i = 0; i < m.length - 1; i++) {
    //     var j = i + Math.floor(Math.random() * (m.length - i));

    //     let temp = m[j];

    //     m[j] = m[i];
    //     m[i] = temp;

    // }

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

    for (let p of m.players) {
        if (p.failed === false) {
            channel.send({
                embeds:[
                    new MessageEmbed()
                        .setTitle(`Player ${m.players.findIndex(e => e.userid === p.userid) + 1}`)
                        .setImage(p.memelink)
                        .setColor(`#${(await getConfig()).colour}`)
                ]
            }).then(async msg => {
                m.messageID.push(msg.id);
            });
        }
    }

    await channel.send({
        embeds:[
            new MessageEmbed()
                .setTitle("Voting time")
                .setDescription(`Vote for the best two memes\nVote by reacting with corresponding emote\nYou have **2 hours** to vote`)
                .setColor(await `#${(await getConfig()).colour}`)
        ]
    }).then(async (msg) => {
        m.messageID.push(msg.id);

        for (let p of m.players) {
            if (p.failed === false && p.memedone === true) {
                msg.react(emojis[m.players.findIndex(e => e.userid === p.userid)]);
            }
        }
        await msg.react(emojis[6]);
    });


    if(!process.env.dev){
        await channel.send(`<@&719936221572235295>`)
    }

    m.votingperiod = true;
    m.votetime = Math.floor(Math.floor(Date.now() / 1000) / 60) * 60;

    await updateQual(m);
}

async function matchResults(client: Client, q: Qual) {
    let channel = <TextChannel>await client.channels.cache.get(q._id);

    let fields = [];

    //If 50% or more players failed to submit
    // if (q.players.filter(p => p.memedone).length <= 2)
    // if (parseFloat((q.players.filter(p => p.memedone).length / q.players.length).toFixed(2)) >= 0.5)
    if (q.players.filter(p => p.failed).length >= Math.ceil((q.players.length * 0.5))) {
        for (let x = 0; x < q.players.length; x++) {

            if (!q.players[x].failed && q.players[x].memedone) {
                fields.push({
                    name: `${((await client.users.fetch(q.players[x].userid)).username)} | Meme #${q.players.indexOf(q.players[x]) + 1}`,
                    value: `${`Finished with ${100 / q.players.filter(p => p.memedone).length} | Earned: ${(Math.floor(100 / q.players.filter(p => p.memedone).length) * 100)}% of the votes\nUserID: ${q.players[x].userid}`}`
                });
            }

            if (q.players[x].failed && !q.players[x].memedone) {
                fields.push({
                    name: `${((await client.users.fetch(q.players[x].userid)).username)} | Meme #${q.players.indexOf(q.players[x]) + 1}${`-Failed`}`,
                    value: `${`Finished with 0 | Earned: 0% of the votes\nUserID: ${q.players[x].userid}`}`
                });
            }
        }

        await (await (<TextChannel>client.channels.cache.get("722291182461386804")))
        .send({
            embeds:[
                new MessageEmbed()
                    .setTitle(`Votes for ${channel.name} are in!`)
                    .setDescription(`No votes for this qualifier`)
                    .setFields(fields)
                    .setColor(`#${(await getConfig()).colour}`)
                    .setTimestamp(new Date())
            ]
        });

        channel.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`Votes for ${channel.name} are in!`)
                        .setDescription(`No votes for this qualifier`)
                        .setFields(fields)
                        .setColor(`#${(await getConfig()).colour}`)
                        .setTimestamp(new Date())
                ]
        }).then(async message => {
            let t = channel.topic?.split(" ");

            if (!t) {
                await channel.setTopic(message.id);
                t = [];
                let string = "";

                for (let p of q.players) {
                    string += `<@${p.userid}>\n`;
                }
                await channel.send(`Portion ${timeconsts.qual.results - t!.concat([message.id]).length} has begun. You have 48h to complete your portion. ${string}`);
            }

            else if ((t!.concat([message.id])).length === timeconsts.qual.results) {
                t.push(message.id);

                let emm = await QualifierResults(channel, client, t);

                await channel.send({embeds:[emm]}).then(async m => {
                    await m.react("👌")
                });

                await (await (<TextChannel>client.channels.cache.get("722291182461386804")))
                    .send({embeds:[emm]});
            }

            else if (t!.concat([message.id]).length < timeconsts.qual.results) {

                if (!t.includes(message.id)) {
                    await channel.setTopic(t!.concat([message.id]).join(" "));
                }

                let string = "";

                for (let p of q.players) {
                    string += `<@${p.userid}>\n`;
                }
                await channel.send(`Portion ${timeconsts.qual.results - t!.concat([message.id]).length} has begun. You have 48h to complete your portion. ${string}`);
            }

        });
    }

    else {

        // q.players.sort(function (a, b) {
        //     return ((b.votes.length) - (a.votes.length));
        //     //Sort could be modified to, for example, sort on the age
        //     // if the name is the same.
        // });

        //Stole from https://stackoverflow.com/a/27879955
        let totalvotes: number = 0;

        q.players.forEach(function (v) {
            totalvotes += v.votes.length;
        });



        for (let x = 0; x < q.players.length; x++) {
            if (!q.players[x].failed && q.players[x].memedone) {
                fields.push({
                    name: `${((await client.users.fetch(q.players[x].userid)).username)} | Meme #${q.players.indexOf(q.players[x]) + 1}`,
                    value: `${`Finished with ${q.players[x].votes.length} | Earned: ${Math.round(q.players[x].votes.length / totalvotes * 100)}% of the votes\nUserID: ${q.players[x].userid}`}`
                });
            }

            if (q.players[x].failed && !q.players[x].memedone) {
                fields.push({
                    name: `${((await client.users.fetch(q.players[x].userid)).username)} | Meme #${q.players.indexOf(q.players[x]) + 1}${`-Failed`}`,
                    value: `${`Finished with 0 | Earned: 0% of the votes\nUserID: ${q.players[x].userid}`}`
                });
            }

            for (const t of q.players[x].votes) {
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
        }

        fields.sort(function(a, b){
            return parseInt(b.value.match(/\d+/g)![1]) - parseInt(a.value.match(/\d+/g)![1])
        })

        await (await (<TextChannel>client.channels.cache.get("722291182461386804")))
        .send({
            embeds:[
                new MessageEmbed()
                    .setTitle(`Votes for ${channel.name} are in!`)
                    .setDescription(`${totalvotes} votes for this qualifier`)
                    .setFields(fields)
                    .setColor(`#${(await getConfig()).colour}`)
                    .setTimestamp(new Date())
            ]
        });

        channel.send({
            embeds:[
                new MessageEmbed()
                    .setTitle(`Votes for ${channel.name} are in!`)
                    .setDescription(`${totalvotes} votes for this qualifier`)
                    .setFields(fields)
                    .setColor(`#${(await getConfig()).colour}`)
                    .setTimestamp(new Date())
            ]
        }).then(async message => {
            let t = channel.topic?.split(" ");

            if (t?.join("").toLocaleLowerCase() === "round1" || t?.join("").toLocaleLowerCase() === "qualifierround" || !t) {
                await channel.setTopic(message.id);
                t = [];
                let string = "";

                for (let p of q.players) {
                    string += `<@${p.userid}>\n`;
                }
                let c = <TextChannel>client.channels.cache.get(channel.id);

                let m = (await c.messages.fetch({limit: 100})).last()!;

                let time = Math.floor(((Math.floor(m.createdTimestamp / 1000) + 345600) - Math.floor(Date.now() / 1000)) / 3600);

                if (time <= 96) {
                    await channel.send(`${string} you have ${time}h left to complete Portion 2`);

                    let timeArr: Array<number> = [];
                    timeArr.push(172800);

                    if ((time)* 3600 > 0 && time - 2 > 0) {
                        timeArr.push(165600);
                    }

                    if ((time) * 3600 > 0 && time - 12 > 0) {
                        timeArr.push(129600);
                    }

                    if ((time) * 3600 > 0 && time - 24 > 0) {
                        timeArr.push(86400);
                    }

                    await insertReminder({
                        _id: channel.id,
                        mention: `${string}`,
                        channel: channel.id,
                        type: "match",
                        time: timeArr,
                        timestamp: Math.floor(m.createdTimestamp / 1000) +172800,
                        basetime: 172800
                    });
                }
            }

            else if ((t!.concat([message.id])).length === timeconsts.qual.results) {
                t.push(message.id);

                let emm = await QualifierResults(channel, client, t);

                await channel.send({embeds:[emm]}).then(async m => {
                    await m.react("👌")
                });

                await (await (<TextChannel>client.channels.cache.get("722291182461386804")))
                .send({embeds:[emm]});
            }


        });

    }
    await deleteQual(q._id);
}