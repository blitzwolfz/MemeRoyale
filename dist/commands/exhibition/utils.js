"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duelcooldownreset = exports.duelreload = exports.duelcheck = void 0;
const db_1 = require("../../db");
const util_1 = require("../util");
exports.duelcheck = {
    name: "duelcheck",
    description: "",
    group: "duels",
    owner: false,
    admins: false,
    mods: false,
    async execute(message, client, args) {
        let ex = await db_1.getExhibition();
        if (!ex.cooldowns.some(x => x.user === message.author.id)) {
            return message.reply("You can start another duel.");
        }
        else if (ex.cooldowns.some(x => x.user === message.author.id)) {
            let i = ex.cooldowns.findIndex(x => x.user === message.author.id);
            await message.reply(`Time till you can start another duel: ${await util_1.toHHMMSS(ex.cooldowns[i].time, 3600)}`);
        }
    }
};
exports.duelreload = {
    name: "duelreload",
    description: "",
    group: "duels",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let match = await db_1.getMatch(message.channel.id);
        let channel = await client.channels.cache.get(message.channel.id);
        message.reply("Reloading").then(async (m) => {
            for (let ms of match.messageID) {
                (await channel.messages.fetch(ms)).delete();
            }
            m.delete({ timeout: 1500 });
        });
        match.votingperiod = false;
        match.votetime = (Math.floor(Date.now() / 1000));
        await db_1.updateMatch(match);
    }
};
exports.duelcooldownreset = {
    name: "resetcd",
    description: "Resets cooldown for duels. `!resetcd @mentions`",
    group: "duels",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let ex = await db_1.getExhibition();
        for (let x of message.mentions.users.array()) {
            ex.cooldowns.splice(ex.cooldowns.findIndex(c => c.user === x.id));
            await db_1.updateExhibition(ex);
            await message.channel.send(`<@${x.id}> has been reset`);
        }
    }
};
exports.default = [
    exports.duelcooldownreset,
    exports.duelreload,
    exports.duelcheck
].sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name)
        return -1;
    else if (k1.name > k2.name)
        return 1;
    else
        return 0;
});
