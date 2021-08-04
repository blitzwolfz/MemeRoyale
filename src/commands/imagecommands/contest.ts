import type { Client, Message } from "discord.js";
import { MessageEmbed, TextChannel } from "discord.js";
import type { Command, Contest } from "../../types";
import { getConfig, getDoc, insertDoc, updateDoc } from "../../db";

//@ts-ignore
export const example: Command = {
    name: "EXAMPLE",
    description: "EXAMPLE",
    group: "EXAMPLE",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {

    }
};

export const contestSubmit: Command = {
    name: "contestsubmit",
    description: "contest submit. Similar to regular submit",
    group: "contest",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        if (message.channel.type !== "dm") {
            return message
            .reply("You didn't not submit this in the DM with the bot.\nIt has been deleted. Please try again in" + " again in bot dm.")
            .then(async m => {
                await message.delete();
                await m.delete({timeout: 30000, reason: "Sent Match submission in server not bot dm."});
            });
        }

        if (message.attachments.array()[0].url.includes("imgur")) {
            return message.reply("You can't submit imgur links");
        }

        else if (message.attachments.size > 1) {
            return message.reply("You can't submit more than one image");
        }

        else if (message.attachments.size <= 0) {
            return message.reply("Your image was not submitted properly. Contact a mod");
        }

        // let user: Contestant = await getDoc("contest", message.author.id);
        let doc: Contest = await getDoc("contest", "contest");
        let index = doc.users.findIndex(x => x._id === message.author.id)

        if (doc.open === false) return message.reply("Contest submission is closed.");

        if (index === -1) {
            doc.users.push({
                _id: message.author.id, url: message.attachments.array()[0].url
            });
        }

        else {
            doc.users[index].url = message.attachments.array()[0].url;
        }

        await updateDoc("contest", doc._id, doc);

        return message.reply("Image has been submitted. If you wish to resubmit something else, please use the same" +
            " command.");

    }
};

export const contestManager: Command = {
    name: "contest-manager",
    description: "close | insert | choose | reload",
    group: "contest",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let doc: Contest = await getDoc("contest", "contest");

        if(args[0] === "choose") {
            if(doc.open === true) return message.reply("Please close contest, and then activate vote.");

            else if(doc.vote === true) {
                doc.vote = false;
                await updateDoc("contest", doc._id, doc)
            }

            else{
                let channel = <TextChannel>client.channels.cache.get("863308712320303114");

                let winner = doc.users[Math.floor(Math.random() * doc.users.length)];
                let user = await client.users.fetch(winner._id);

                let em = new MessageEmbed()
                    .setTitle(`Winner is ${user.username}`)
                    .setDescription("Entered with this image submission")
                    .setURL(winner.url)
                    .setColor((await getConfig()).colour)
                    .setFooter("MemeRoyale#3101", `${(client.users.cache.get("722303830368190485")!.displayAvatarURL({
                        format: "webp",
                        size: 512
                    }))}`)
                ;

                await channel.send(em);

                await updateDoc("contest", doc._id, doc);
                return message.reply("Done.")
            }
        }

        if(args[0] === "close") {
            if(doc.vote === true) return message.reply("Please close voting, and then open or close submission.");
            doc.open = doc.open ? false : true;
            await updateDoc("contest", doc._id, doc);

            return  message.reply(`Contest submissions are now ${!doc.open ? "closed" : "open"}.`)
        }

        if(args[0] === "insert") {
            let doc:Contest = {
                _id:"contest",
                open:true,
                vote:false,
                users:[],
                msgIDS:[]
            }
            await insertDoc("contest", doc);

            return  message.reply("Inserted")
        }
    }
};

// export const contestVote: Command = {
//     name: "vote",
//     description: "`!vote #` to vote, `!vote clear` to clear your votes",
//     group: "contest",
//     owner: false,
//     admins: false,
//     mods: false,
//     async execute(message: Message, client: Client, args: string[]) {
//         if (message.channel.type !== "dm") {
//             return message
//             .reply("You didn't not vote in the DM with the bot.\nIt has been deleted. Please try again in again in" +
//                 " bot dm.")
//             .then(async m => {
//                 await message.delete();
//                 await m.delete({timeout: 30000, reason: "Sent Match submission in server not bot dm."});
//             });
//         }
//
//         // let user: Contestant = await getDoc("contest", message.author.id);
//         let doc: Contest = await getDoc("contest", "contest");
//
//         if(doc.vote === false) return message.reply("Voting has not started yet.")
//
//         if(args[0] === "clear" || args[0] === "reset"){
//             doc.users.forEach(function (v) {
//                 if(v.voters.includes(message.author.id)) {
//                     let pos = v.voters.indexOf(message.author.id)
//                     v.voters.splice(pos, 1)
//                 }
//             })
//             await updateDoc("contest", doc._id, doc);
//
//             return  message.reply("Cleared all votes.")
//         }
//
//         if(!isNaN(parseInt(args[0]))){
//             if(doc.users.filter(y => y.voters.includes(message.author.id)).length === 2) {
//                 return  message.reply("You have voted for 2 memes already. If you wish to reset your vote, do it by" +
//                     " using the command `!vote reset`.")
//             }
//
//             let index = parseInt(args[0]) - 1;
//
//             if(index + 1 > doc.users.length) return message.reply("Can't vote for a meme that doesn't exist.")
//
//             doc.users[index].voters.push(message.author.id)
//
//             await updateDoc("contest", doc._id, doc);
//
//             return message.reply("Vote has been entered for meme " + `${ + 1}`);
//         }
//     }
// };

export default [
    contestSubmit,
    contestManager,
    // contestVote
]