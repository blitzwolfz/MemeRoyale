import { Client, TextChannel } from "discord.js";
import { deleteReminder, getAllReminders, updateReminder } from "../db";


export async function backgroundExhibitionLoop(client: Client){
    let reminders = await getAllReminders();

    for(let r of reminders){
        if(r.type === "match"){
            if (Math.floor(Date.now() / 1000) - r.timestamp >= r.time){
                (<TextChannel>await client.channels.fetch(r.channel)).send(
                    `${r.mention} you have ${(172800 - r.time)/3600}h left to do your match`
                )
                
                if(r.time === 86400){
                    r.time = 129600
                    await updateReminder(r)
                }
          
                if(r.time === 129600){
                    r.time = 165600
                    await updateReminder(r)
                }

                if(r.time === 165600){
                    await deleteReminder(r)
                }

            }
        }

        if(r.type === "meme"){
            if (Math.floor(Date.now() / 1000) - r.timestamp >= r.time){
                try {
                    (await client.users.cache.get(r._id))!.send(
                      `You have ${Math.floor((3600 - r.time)/60)}m left to do your match`
                    )
                } catch (error) {
                     console.log("User will not let bot dm")
                }

                if(r.time === 1800){
                    r.time = 2700
                    await updateReminder(r)
                }
          
                if(r.time === 2700){
                    r.time = 3300
                    await updateReminder(r)
                }

                if(r.time === 3300){
                    await deleteReminder(r)
                }
            }
        }
    }
}