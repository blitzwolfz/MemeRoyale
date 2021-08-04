// @ts-ignore
// import { Client, Message, MessageAttachment } from "discord.js";
// const DIG = require("discord-image-generation");
import * as contest from "./contest";

// import type { Command } from "../../types";
//@ts-ignore
// export const example: Command = {
//     name: "EXAMPLE",
//     description: "EXAMPLE",
//     group: "EXAMPLE",
//     owner: false,
//     admins: false,
//     mods: false,
//     async execute(message: Message, client: Client, args: string[]) {
//
//     }
// };
//
// export const gay: Command = {
//     name: "gay",
//     description: "Make a person's pfp gay",
//     group: "image-fun",
//     owner: false,
//     admins: false,
//     mods: false,
//     async execute(message: Message, client: Client, args: string[]) {
//         if(!args[0]) return message.reply("Please pass a user mention or a user id.")
//         let url = message.mentions.users.array().length === 1
//             ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL({format: "png"})) :
//             client.users.cache.get(args[0])!.displayAvatarURL({format: "png"});
//
//         let img = await new DIG.Gay().getImage(url);
//
//         return await message.channel.send(new MessageAttachment(img, "gay.png"))
//     }
// }
//
// export const wont_affect_kid: Command = {
//     name: "autist",
//     aliases:["retard"],
//     description: "Hmm",
//     group: "image-fun",
//     owner: false,
//     admins: false,
//     mods: false,
//     async execute(message: Message, client: Client, args: string[]) {
//         if(!args[0]) return message.reply("Please pass a user mention or a user id.")
//         let url = message.mentions.users.array().length === 1
//             ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL({format: "png"})) :
//             client.users.cache.get(args[0])!.displayAvatarURL({format: "png"});
//
//         let img = await new DIG.Affect().getImage(url);
//
//         return await message.channel.send(new MessageAttachment(img, "autist.png"))
//     }
// }
//
// export const trash: Command = {
//     name: "trash",
//     description: "Delete this trash",
//     group: "image-fun",
//     owner: false,
//     admins: false,
//     mods: false,
//     async execute(message: Message, client: Client, args: string[]) {
//         if(!args[0]) return message.reply("Please pass a user mention or a user id.")
//         let url = message.mentions.users.array().length === 1
//             ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL({format: "png"})) :
//             client.users.cache.get(args[0])!.displayAvatarURL({format: "png"});
//
//         let img = await new DIG.Delete().getImage(url);
//
//         return await message.channel.send(new MessageAttachment(img, "trash.png"))
//     }
// }
//
// export const beautiful: Command = {
//     name: "beautiful",
//     description: "Ayy",
//     group: "image-fun",
//     owner: false,
//     admins: false,
//     mods: false,
//     async execute(message: Message, client: Client, args: string[]) {
//         if(!args[0]) return message.reply("Please pass a user mention or a user id.")
//         let url = message.mentions.users.array().length === 1
//             ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL({format: "png"})) :
//             client.users.cache.get(args[0])!.displayAvatarURL({format: "png"});
//
//         let img = await new DIG.Beautiful().getImage(url);
//
//         return await message.channel.send(new MessageAttachment(img, "trash.png"))
//     }
// }
//
// export const winners: Command = {
//     name: "winners",
//     description: "Delete this trash",
//     group: "image-fun",
//     owner: true,
//     admins: false,
//     mods: false,
//     async execute(message: Message, client: Client, args: string[]) {
//         // if(!args[0]) return message.reply("Please pass a user mention or a user id.")
//         // let url = message.mentions.users.array().length === 1
//         //     ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL({format: "png"})) :
//         //     client.users.cache.get(args[0])!.displayAvatarURL({format: "png"});
//
//         let urls:{name:string, img:string}[] = [];
//
//         for(let u of message.mentions.users.array()!){
//             urls.push({
//                 name:u.username,
//                 img:(client.users.cache.get(u.id)!.displayAvatarURL({format: "png"}))
//             })
//         }
//
//         let img = await new DIG.Podium().getImage(urls[0].img, urls[1].img, urls[2].img, urls[0].name, urls[1].name, urls[2].name);
//         console.log(img)
//
//         return await message.channel.send(new MessageAttachment(img, "trash.png"))
//     }
// }

// export default [
//     gay,
//     wont_affect_kid,
//     trash,
//     winners,
//     beautiful
// ]
// .concat(contest.default)

export default contest.default;