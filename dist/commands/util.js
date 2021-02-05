"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHHMMSS = exports.timeconsts = exports.emojis = exports.forwardsFilter = exports.backwardsFilter = void 0;
const backwardsFilter = (reaction, user) => reaction.emoji.name === '⬅' && !user.bot;
exports.backwardsFilter = backwardsFilter;
const forwardsFilter = (reaction, user) => reaction.emoji.name === '➡' && !user.bot;
exports.forwardsFilter = forwardsFilter;
exports.emojis = [
    "1️⃣",
    "2️⃣",
    "3️⃣",
    "4️⃣",
    "5️⃣",
    "6️⃣",
    "♻️",
    "✅",
    "❌",
    "🌀"
];
exports.timeconsts = {
    match: {
        votingtime: 7200,
        memetime: 3200
    },
    qual: {
        votingtime: 7200,
        memetime: 1800,
        results: 2
    },
};
async function toHHMMSS(timestamp, howlong) {
    return new Date((howlong - (Math.floor(Date.now() / 1000) - timestamp)) * 1000).toISOString().substr(11, 8);
}
exports.toHHMMSS = toHHMMSS;
