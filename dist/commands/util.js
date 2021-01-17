"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forwardsFilter = exports.backwardsFilter = void 0;
const backwardsFilter = (reaction, user) => reaction.emoji.name === '⬅' && !user.bot;
exports.backwardsFilter = backwardsFilter;
const forwardsFilter = (reaction, user) => reaction.emoji.name === '➡' && !user.bot;
exports.forwardsFilter = forwardsFilter;
