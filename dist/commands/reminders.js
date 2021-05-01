"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backgroundExhibitionLoop = void 0;
const db_1 = require("../db");
async function backgroundExhibitionLoop(client) {
    let reminders = await db_1.getAllReminders();
    for (let r of reminders) {
        if (r.type === "match") {
            if (Math.floor(Date.now() / 1000) - r.timestamp >= r.time) {
                (await client.channels.fetch(r.channel)).send(`${r.mention} you have ${(172800 - r.time) / 3600}h left to do your match`);
                if (r.time === 86400) {
                    r.time = 129600;
                    await db_1.updateReminder(r);
                }
                if (r.time === 129600) {
                    r.time = 165600;
                    await db_1.updateReminder(r);
                }
                if (r.time === 165600) {
                    await db_1.deleteReminder(r);
                }
            }
        }
        if (r.type === "meme") {
            if (Math.floor(Date.now() / 1000) - r.timestamp >= r.time) {
                try {
                    (await client.users.cache.get(r._id)).send(`You have ${Math.floor((3600 - r.time) / 60)}m left to do your match`);
                }
                catch (error) {
                    console.log("User will not let bot dm");
                }
                if (r.time === 1800) {
                    r.time = 2700;
                    await db_1.updateReminder(r);
                }
                if (r.time === 2700) {
                    r.time = 3300;
                    await db_1.updateReminder(r);
                }
                if (r.time === 3300) {
                    await db_1.deleteReminder(r);
                }
            }
        }
    }
}
exports.backgroundExhibitionLoop = backgroundExhibitionLoop;
