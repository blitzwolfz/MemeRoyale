import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { getDoc, updateDoc } from "../../db";
import { Command, Signups } from "../../types";

export const signup: Command = {
    name: "signup",
    description: "Command to signup for tournament",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let signup:Signups = await getDoc("config", "signups")

        if(message.channel.type !== "dm" && message.id !== signup.msgID) {
            return await message.reply("You have to signup in bot dm if they are open").then(async m =>{
                message.delete()
                m.delete({timeout:1600})
            })
        };

        if(signup.open === false){
            if(message.id !== signup.msgID) return message.reply("You can't signup as they are not open");

            else{
                return await client.users.cache.find(x => x.id === args[0])?.send("You can't signup as they are not open");
            }
        }

        if(signup.users.includes(message.author.id) || signup.users.includes(args[0])){
            if(message.id !== signup.msgID) return message.reply("You already signed up");

            else{
                return await client.users.cache.find(x => x.id === args[0])?.send("You already signed up");
            }
        }

        else{
            if(message.id !== signup.msgID){
                await message.reply("You have been signed up!")
                signup.users.push(message.author.id);
            }

            else{
                await client.users.cache.find(x => x.id === args[0])?.send("You have been signed up!");
                signup.users.push(args[0]);
            }

            return await updateDoc("config", "signup", signup);
        }
    }
}

export const signup_manager: Command = {
    name: "signup-manager",
    description: "Managing command for signups.",
    group: "tournament-manager",
    owner: false,
    admins: true,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let signup:Signups = await getDoc("config", "signups")
        let c = <TextChannel> await client.channels.fetch(await message.guild!
            .channels.cache
            .find(x => x.name.toLowerCase() === "announcements")!.id!)

        if(args[0] === "open"){
            signup.open = true;

            await c.send(new MessageEmbed()
            .setDescription("Match signups have started!"
            +"\nPlease use the command `!signup`"
            +"\nYou can also use 🗳️ to signup"
            +"\nIf you wish to remove your signup use `!unsignup`"
            +"\nOf course if you have problems contact mods!")
            .setColor("#d7be26")
            .setTimestamp()).then(async msg =>{
                msg.react('🗳️')
                signup.msgID = msg.id
            })

            return await updateDoc("config", "signups", signup)

        }

        if(args[0] === "close"){
            signup.open = false;

            await updateDoc("config", "signups", signup)

            return await c.send(new MessageEmbed()
            .setDescription("Match signups have closed!"
            +"\nIf there is an issue with your signup"
            +"\nyou will be contacted. If you wish to unsignup"
            +"\nuse `!unsignup` or contact mods. Of course "
            +"\nif you have problems contact mods!")
            .setColor("#d7be26")
            .setTimestamp())
        }

        if(args[0] === "reopen"){
            signup.open = true;

            await c.send(new MessageEmbed()
            .setDescription("Match signups have reopened!"
            +"\nIf you wish to signup use `!signup`"
            +"\nYou can also use 🗳️ to signup"
            +"\nIf you wish to remove your signup use `!removesignup`"
            +"\nOf course if you have problems contact mods!")
            .setColor("#d7be26")
            .setTimestamp()).then(async msg =>{
                msg.react('🗳️')
                signup.msgID = msg.id
            })

            return await updateDoc("config", "signups", signup)
        }

        if(args[0] === "remove"){

            if(!args[1]) return message.reply("Please provide the User ID");

            signup.users.splice(signup.users.indexOf(message.author.id), 1)

            await updateDoc("config", "signups", signup)

            return message.reply(`Removed user <@${args[1]}>`)

        }
    }
}

export const unsignup: Command = {
    name: "unsignup",
    description: "Command to signup for tournament",
    group: "tourny",
    owner: false,
    admins: false,
    mods: false,
    async execute(message: Message, client: Client, args: string[]) {
        let signup:Signups = await getDoc("config", "signups")

        if(message.channel.type !== "dm") {
            return await message.reply("You have to signup in bot dm if they are open").then(async m =>{
                message.delete()
                m.delete({timeout:3000})
            })
        };

        if(signup.open === false) return message.reply("You can't signup as they are not open");

        if(signup.users.includes(message.author.id)) return message.reply("You already signed up");

        else{
            signup.users = signup.users.splice(signup.users.findIndex(x => x === message.author.id), 1);

            await updateDoc("config", "signup", signup)

            return message.reply("You have been removed!")
        }
    }
}