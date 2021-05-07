"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.backgroundReminderLoop = void 0;
const db_1 = require("../db");
const match_1 = require("./match");
async function backgroundReminderLoop(client) {
    var _a, _b;
    let reminders = await db_1.getAllReminders();
    for (let r of reminders) {
        if (Math.floor(Date.now() / 1000) - r.timestamp >= r.time[r.time.length - 1]) {
            if (r.type === "match") {
                (await client.channels.fetch(r.channel)).send(`${r.mention} you have ${(r.basetime - r.time[r.time.length - 1]) / 3600}h left to do your match`);
                if (r.basetime === r.time[r.time.length - 1]) {
                    let c = client.channels.cache.get(r.channel);
                    let m = (await c.messages.fetch({ limit: 100 })).last();
                    let arr = r.mention.match(/\d+/g);
                    for (let xx of arr) {
                        await match_1.startsplit.execute(m, client, [xx]);
                        await client.channels.cache.get("748760056333336627").send({
                            embed: {
                                description: `<@${(_a = client.user) === null || _a === void 0 ? void 0 : _a.id}>/${(_b = client.user) === null || _b === void 0 ? void 0 : _b.tag} has auto started <@${xx}> in <#${r.channel}>`,
                                color: "#d7be26",
                                timestamp: new Date()
                            }
                        });
                    }
                }
                r.time.pop();
                if (r.time.length === 0) {
                    await db_1.deleteReminder(r);
                }
                else
                    await db_1.updateReminder(r);
            }
            if (r.type === "meme") {
                (await client.users.cache.get(r._id)).send(`${r.mention} you have ${(r.basetime - r.time[r.time.length - 1]) / 60}m left to do your portion`);
                r.time.pop();
                if (r.time.length === 0) {
                    await db_1.deleteReminder(r);
                }
                else
                    await db_1.updateReminder(r);
            }
        }
    }
}
exports.backgroundReminderLoop = backgroundReminderLoop;
exports.delay = {
    name: "delay",
    description: "`!delay <hour min> or <hour> or <min>` to delay matches from auto starting",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let reminder = await db_1.getReminder(await message.mentions.channels.first().id);
        if (message.mentions.channels.array().length === 0) {
            return message.reply("Please mention a channel");
        }
        args.pop();
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
        await db_1.updateReminder(reminder);
        return message.channel.send(`Delayed <#${reminder._id}> by ${args.join(" ")}`);
    }
};
