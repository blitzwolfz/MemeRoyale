import { User } from "discord.js";

export const backwardsFilter = (reaction: { emoji: { name: string; }; }, user: User) => reaction.emoji.name === '⬅' && !user.bot;
export const forwardsFilter = (reaction: { emoji: { name: string; }; }, user: User) => reaction.emoji.name === '➡' && !user.bot;