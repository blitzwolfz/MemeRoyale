import type { Client, Message, TextChannel } from "discord.js";
import { deleteReminder, getAllReminders, getReminder, updateReminder } from "../db";
import type { Command } from "../types";
import { startsplit } from "./match";
import { startsplitqual } from "./quals";
import { MessageEmbed } from "discord.js";


export async function backgroundReminderLoop(client: Client) {
    let reminders = await getAllReminders();
    let imgArr = [
        "none",
        "https://imgur.com/wN3r8ZL",
        "https://imgur.com/XmKe0FX",
        "https://cdn.discordapp.com/emojis/770946656496910364.png?v=1"
    ];

    for (let r of reminders) {
        try {
            let check = await <TextChannel>client.channels.cache.get(r.channel);

            if(check === undefined && r.type === "match") {
                console.log("Channel undefined. Delete")
                await deleteReminder(r._id);
                continue;
            }

            if (Math.floor(Date.now() / 1000) - r.timestamp >= r.time[r.time.length - 1]) {
                if (r.type === "match") {

                    let randomLink = imgArr[Math.floor(Math.random() * imgArr.length)];
                    if(r.basetime !== r.time[r.time.length-1]){
                        console.log(r._id)
                        console.log(r.mention.match(/\d+/g)!)
                        console.log(r.mention)

                        for(let xx of r.mention.match(/\d+/g)!){
                            try {

                                await (await client.users.fetch(xx)).send(`You have ${(r.basetime - r.time[r.time.length - 1]) / 3600}h left to do your match`);
                                if(randomLink !== "none") await (await client.users.fetch(xx)).send(`${randomLink}`);

                            } catch (error) {

                                console.log(error.message);
                                await (<TextChannel>await client.channels.fetch(r.channel)).send(`<@${xx}> you have ${(r.basetime - r.time[r.time.length - 1]) / 3600}h left to do your match`)

                            }
                        }
                    }

                    if (r.basetime === r.time[r.time.length - 1]) {
                        let c = <TextChannel>client.channels.cache.get(r.channel);

                        let m = (await c.messages.fetch({limit: 100})).last()!;

                        let arr = r.mention.match(/\d+/g)!;

                        for (let xx of arr) {
                            if(c.parent?.name!.toLowerCase() === "matches"){
                                await startsplit.execute(m, client, [xx]);
                            }

                            if(c.parent?.name!.toLowerCase() === "qualifiers"){
                                await startsplitqual.execute(m, client, [xx])
                            }

                            let em = new MessageEmbed()
                                .setDescription(`<@${client.user?.id}>/${client.user?.tag} has auto started <@${xx}> in <#${r.channel}>`)
                                .setColor("#d7be26")
                                .setTimestamp(new Date())

                            await (<TextChannel>client.channels.cache.get("748760056333336627")).send({embeds:[
                                    em
                                ]});
                        }
                    }

                    r.time.pop();

                    if (r.time.length === 0) {
                        await deleteReminder(r._id);
                    }

                    else {
                        await updateReminder(r);
                    }
                }

                if (r.type === "meme") {
                    (await client.users.cache.get(r._id))!.send(`${r.mention} you have ${(r.basetime - r.time[r.time.length - 1]) / 60}m left to do your portion`);

                    r.time.pop();

                    if (r.time.length === 0) {
                        await deleteReminder(r._id);
                    }

                    else {
                        await updateReminder(r);
                    }
                }
            }
        } catch {
            console.log(`Reminder error: ID: ${r._id}, `);
            continue;
        }
    }
}

export const delay: Command = {
    name: "delay",
    description: "`!delay <hour min> or <hour> or <min>` to delay matches from auto starting",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    slashCommand:false,
    async execute(message: Message, client: Client, args: string[]) {
        let reminder = await getReminder(await message.mentions.channels.first()!.id);
        if ([message.mentions.channels.keys()].length === 0) {
            return message.reply("Please mention a channel");
        }
        args.splice(0, 1)
        let time = 0;

        for (let x of args) {
            if (x.includes("h")) {
                x.replace("h", "");
                time += (parseInt(x) * 3600);
            }

            if (x.includes("m")) {
                x.replace("m", "");
                time += (parseInt(x) * 60);
            }
        }

        if (time === 0) {
            return message.reply("Please enter a valid time in either ``xh xm``, ``xh``, or ``xm`` format.");
        }

        reminder.basetime += time;
        reminder.time[0] += time;

        await updateReminder(reminder);

        return message.channel.send(`Delayed <#${reminder._id}> by ${args.join(" ")}`);
    }
};