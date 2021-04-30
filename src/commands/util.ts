import { User } from "discord.js";

export const backwardsFilter = (reaction: { emoji: { name: string; }; }, user: User) => reaction.emoji.name === '⬅' && !user.bot;
export const forwardsFilter = (reaction: { emoji: { name: string; }; }, user: User) => reaction.emoji.name === '➡' && !user.bot;

export let emojis = [
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

export function dateBuilder() {
  let d = new Date();
  let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let day = days[d.getDay()];
  let date = d.getDate();
  console.log(d.getMonth())
  let month = months[d.getMonth()];
  let year = d.getFullYear();
  return `${day}, ${month} ${date} ${year}`;
}

export let timeconsts = {
  match:{
    votingtime: 7200,
    memetime: 3200
  },

  qual:{
    votingtime: 7200,
    memetime: 1800,
    results:2
  },
}

export async function toHHMMSS(timestamp: number, howlong: number) {

  return new Date((howlong - (Math.floor(Date.now() / 1000) - timestamp)) * 1000).toISOString().substr(11, 8)
}