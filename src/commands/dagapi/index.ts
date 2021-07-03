// @ts-ignore
import { Client, Message, MessageAttachment } from "discord.js";
import { Client as dagci } from "dagpijs";
import type { Command } from "../../types";
export var dagcli = new dagci(process.env.dagToken!)
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

export const gay: Command = {
    name: "gay",
    description: "Make a person's pfp gay",
    group: "dagapi",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        if(!args[0]) return message.reply("Please pass a user mention or a user id.")
        let url = message.mentions.users.array().length === 1
            ? (client.users.cache.get(message.mentions.users.first()!.id)!.displayAvatarURL({format: "png"})) :
            client.users.cache.get(args[0])!.displayAvatarURL({format: "png"});

        let img = (await dagcli.image_process("gay", {url: url})).image;

        return await message.channel.send(new MessageAttachment(img))
    }
}

export default [
    gay
]