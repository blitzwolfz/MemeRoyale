// import { client } from "./index";
// import { getMatch, getProfile, getQual, getTemplatedB, getThemes, updateMatch, updateProfile, updateQual, updateTemplatedB, updateThemedB } from "../db";
// import { cmd } from "../index";
// import { Collection, MessageAttachment, MessageReaction, TextChannel } from "discord.js";
// import { qual_winner } from "../commands/quals/util";
// import type { Profile } from "../types";
//
// client.on("messageReactionAdd", async (messageReaction, user) => {
//     console.log("AAA")
//     if (user.id === "722303830368190485") return;
//     if (user.bot) return;
//     if(!messageReaction.emoji.name) return;
//     console.log("AAA")
//
//     if (messageReaction.partial === true) messageReaction = await messageReaction.fetch();
//     if (messageReaction.message.partial === true) await messageReaction.message.fetch(true);
//     if (user.partial === true) user = await user.fetch(true);
//
//     if (messageReaction.emoji.name === "1️⃣" && await getMatch(messageReaction.message.channel.id)) {
//         let m = await getMatch(messageReaction.message.channel.id);
//         let p = await getProfile(user.id);
//         if (!m) return;
//
//         if (m.p1.userid === user.id || m.p2.userid === user.id) return user.send("Can't vote in your own match");
//         if (m.p1.voters.includes(user.id)) {
//             if (p && p.voteDM && !m.exhibition) await user.send("Voting for the same meme is not allowed.");
//             return;
//         }
//         m.p1.voters.push(user.id);
//         m.p1.votes += 1;
//
//         if (m.p2.voters.includes(user.id)) {
//             m.p2.voters.splice(m.p2.voters.indexOf(user.id), 1);
//             m.p2.votes -= 1;
//         }
//
//         await updateMatch(m);
//         await (await messageReaction.fetch()).users.remove(user.id)
//
//         if(p && p.voteDM && !m.exhibition) {
//             await user.send(`Vote counted for Player 1's memes in <#${m._id}>. You gained 2 points for voting`);
//         }
//
//         return;
//     }
//
//     if (messageReaction.emoji.name === "2️⃣" && await getMatch(messageReaction.message.channel.id)) {
//         let m = await getMatch(messageReaction.message.channel.id);
//         let p = await getProfile(user.id);
//         if (!m) return;
//
//         if (m.p1.userid === user.id || m.p2.userid === user.id) return user.send("Can't vote in your own match");
//         if (m.p2.voters.includes(user.id)) {
//             if (p && p.voteDM && !m.exhibition) await user.send("Voting for the same meme is not allowed.");
//             return;
//         }
//         m.p2.voters.push(user.id);
//         m.p2.votes += 1;
//
//         if (m.p1.voters.includes(user.id)) {
//             m.p1.voters.splice(m.p1.voters.indexOf(user.id), 1);
//             m.p1.votes -= 1;
//         }
//
//         await updateMatch(m);
//         console.log(user)
//         await messageReaction.users.remove(user.id);
//
//         if (p && p.voteDM && !m.exhibition) {
//             await user.send(`Vote counted for Player 1's memes in <#${m._id}>. You gained 2 points for voting`);
//         }
//
//         return;
//     }
//
//     if ([
//         "1️⃣",
//         "2️⃣",
//         "3️⃣",
//         "4️⃣",
//         "5️⃣",
//         "6️⃣"
//     ].includes(messageReaction.emoji.name!) && await getQual(messageReaction.message.channel.id)) {
//         await messageReaction.users.remove(user.id);
//         let q = await getQual(messageReaction.message.channel.id);
//         if (!q) return;
//
//         //if(q.players.some(x => x.userid === user.id)) return user.send("Can't vote in your own qualifer");
//
//         let pos = [
//             "1️⃣",
//             "2️⃣",
//             "3️⃣",
//             "4️⃣",
//             "5️⃣",
//             "6️⃣"
//         ].indexOf(messageReaction.emoji.name!);
//         if (q.players.map(a => a.userid).includes(user.id)) return user.send("Can't vote in your own match");
//         let p = await getProfile(user.id);
//
//         if (q.players[pos].votes.includes(user.id) === false) {
//             if (q.players.filter(y => y.votes.includes(user.id)).length === 2) {
//                 if (p && p.voteDM) await user.send("You can only vote for 2 memes. " +
//                     "Please hit recycle button to reset your votes");
//                 return;
//             }
//
//             if (q.players[pos].failed === true) {
//                 if (p && p.voteDM) await user.send("You can't vote for a user who failed");
//                 return;
//             }
//
//             q.players[pos].votes.push(user.id);
//
//             await updateQual(q);
//
//             if (p && p.voteDM) await user
//                 .send(`You have voted for Meme #${pos + 1} in <#${messageReaction.message.channel.id}>`);
//             return;
//         }
//         else {
//             if (p && p.voteDM) await user.send("You have already voted for this meme");
//             return;
//         }
//
//     }
//
//     if (messageReaction.emoji.name === "♻️") {
//         await messageReaction.users.remove(user.id);
//         let q = await getQual(messageReaction.message.channel.id);
//         if (!q) return;
//
//         q.players.forEach(function (v) {
//             if (v.votes.includes(user.id)) {
//                 let pos = q.players.indexOf(v);
//                 v.votes = v.votes.splice(pos, 1);
//             }
//         });
//
//         await updateQual(q);
//         let p = await getProfile(user.id);
//         if (p && p.voteDM) await user.send(`All votes in <#${messageReaction.message.channel.id}> reset`);
//         return;
//     }
//
//     if (messageReaction.emoji.name === "🅰️") {
//         await messageReaction.users.remove(user.id);
//         let m = await getMatch(messageReaction.message.channel.id);
//         if (!m) return;
//
//         if (!user.client.guilds.cache.get(messageReaction.message.guild!.id)!
//             .members.cache.get(user.id)!.roles.cache
//             .find(x => x.name.toLowerCase() === "referee") && m.p1.userid !== user.id) {
//             await messageReaction.users.remove(user.id);
//             return user.send("No.");
//         }
//
//         await messageReaction.users.remove(user.id);
//
//         if(m.p1.donesplit === true) return;
//
//         return cmd.find(c => c.name.toLowerCase() === "start-split")
//             ?.execute(await messageReaction.message.fetch(), client, [m.p1.userid]);
//     }
//
//     if (messageReaction.emoji.name === "🅱️") {
//         await messageReaction.users.remove(user.id);
//         let m = await getMatch(messageReaction.message.channel.id);
//         if (!m) return;
//
//         if (!user.client.guilds.cache.get(messageReaction.message.guild!.id)!
//             .members.cache.get(user.id)!.roles.cache
//             .find(x => x.name.toLowerCase() === "referee") && m.p2.userid !== user.id) {
//             await messageReaction.users.remove(user.id);
//             return user.send("No.");
//         }
//         await messageReaction.users.remove(user.id);
//
//         if(m.p2.donesplit === true) return;
//
//         return cmd.find(c => c.name.toLowerCase() === "start-split")
//             ?.execute(await messageReaction.message.fetch(), client, [m.p2.userid]);
//     }
//
//     if ([
//         "🇦",
//         "🇧",
//         "🇨",
//         "🇩",
//         "🇪",
//         "🇫"
//     ].includes(messageReaction.emoji.name!)) {
//         await messageReaction.users.remove(user.id);
//         let m = await getQual(messageReaction.message.channel.id);
//         if (!m) return;
//         let pos = [
//             "🇦",
//             "🇧",
//             "🇨",
//             "🇩",
//             "🇪",
//             "🇫"
//         ].indexOf(messageReaction.emoji.name!);
//         if ((m.players[pos].userid !== user.id) && !user.client.guilds.cache
//             .get(messageReaction.message.guild!.id)!
//             .members.cache.get(user.id)!.roles.cache
//             .find(x => x.name.toLowerCase() === "referee")) {
//             return user.send("No.");
//         }
//         if (m.players[pos].memedone || m.players[pos].failed) return;
//         cmd.find(c => c.name.toLowerCase() === "start-qual")
//             ?.execute(await messageReaction.message.fetch(), client, [m.players[pos].userid]);
//     }
//
//     if (messageReaction.emoji.name === "🗳️") {
//         await cmd.find(c => c.name.toLowerCase() === "signup")?.execute(await messageReaction.message.fetch(), client, [user.id]);
//         await messageReaction.users.remove(user.id);
//     }
//
//     if (messageReaction.emoji.name === "👌") {
//         if (!user.client.guilds.cache
//             .get(messageReaction.message.guild!.id)!
//             .members.cache.get(user.id)!
//             .roles.cache.has("719936221572235295")) {
//             return;
//         }
//
//         let channel = <TextChannel>await messageReaction.message.channel.fetch();
//         let em = (await channel.messages.fetch(messageReaction.message.id)).embeds[0]!;
//         let iter = 0;
//         let key = [];
//         for (let f of em.fields) {
//             key.push(`${f.value.match(/\d+/g)![1]}`);
//             iter += 1;
//             if (iter === 2) {
//                 await messageReaction.remove();
//                 break;
//             }
//         }
//         await qual_winner.execute(await messageReaction.message.fetch(), client, key, "2", [user.id]);
//     }
//
//     if (messageReaction.emoji.name === "🏁") {
//         // let voteCollection: Collection<string, MessageReaction>;
//
//         let voteCollection: Collection<string, MessageReaction> = await messageReaction.message.channel.messages.fetch(messageReaction.message.id)
//             .then(msg => msg.reactions.cache);
//
//         let totalVotes = voteCollection!.first()!.count!;
//
//         if (totalVotes >= 3) {
//             let id: Profile | undefined;
//             id = await getProfile(await messageReaction.message.embeds[0].description!);
//             //await tempccc.send(await messageReaction.message.embeds[0].image?.url)
//             if (await messageReaction.message.embeds[0].image?.url) {
//                 let e = await getTemplatedB();
//                 e.list.push(await messageReaction.message.embeds[0].image!.url);
//                 await updateTemplatedB(e.list);
//
//                 if (id) {
//                     id.points += 2;
//                     await updateProfile(id);
//                 }
//
//                 let attach = new MessageAttachment(messageReaction.message.embeds[0].image!.url);
//
//                 (<TextChannel>await client.channels.fetch("724827952390340648")).send({content: "New template:", files:[attach]});
//             }
//             else if (await messageReaction.message.embeds[0].fields) {
//                 let obj = await getThemes();
//
//                 obj.list.push(messageReaction.message.embeds[0].fields[1].value);
//
//                 await updateThemedB({
//                     _id: "themelist", list: obj.list
//                 });
//
//                 if (id) {
//                     id.points += 2;
//                     await updateProfile(id);
//                 }
//
//                 await (<TextChannel>await client.channels.fetch("724837977838059560")).send("New Theme: " + `${messageReaction.message.embeds[0].fields[1].value}`);
//             }
//             await messageReaction.message.delete();
//         }
//     }
//
//     if (messageReaction.emoji.name === "🗡️") {
//         let voteCollection: Collection<string, MessageReaction>;
//
//         await messageReaction.message.channel.messages.fetch(messageReaction.message.id)
//             .then(msg => voteCollection = msg.reactions.cache);
//
//         let totalVotes = voteCollection!.first()!.count!;
//
//         if (totalVotes === 3) {
//             //await tempccc.send(await messageReaction.message.embeds[0].image?.url)
//             await messageReaction.message.delete();
//         }
//     }
// });
//
// client.ws.on("MESSAGE_REACTION_ADD", console.log)
// client.ws.on("MESSAGE_REACTION_REMOVE", console.log)
// client.ws.on("MESSAGE_CREATE", console.log)