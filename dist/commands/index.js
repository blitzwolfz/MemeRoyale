"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = void 0;
const discord_js_1 = require("discord.js");
const help_1 = require("./help");
const match_1 = require("./match");
const utils_1 = require("./match/utils");
const quals_1 = require("./quals");
const util_1 = require("./quals/util");
const submit_1 = require("./submit");
const a = __importStar(require("./tournament/index"));
const b = __importStar(require("./exhibition/index"));
exports.ping = {
    name: "ping",
    description: "ping",
    group: "",
    owner: false,
    admins: false,
    mods: false,
    async execute(message, client, args) {
        message.channel.send("Pinging...").then(m => {
            let ping = m.createdTimestamp - message.createdTimestamp;
            let embed = new discord_js_1.MessageEmbed()
                .setAuthor(`Your ping is ${ping}`)
                .setColor("RANDOM");
            m.edit(embed);
        });
    }
};
exports.default = [
    match_1.startmatch,
    match_1.startsplit,
    match_1.endmatch,
    utils_1.reload_match,
    util_1.reload_qual,
    exports.ping,
    utils_1.forcevote,
    match_1.splitmatch,
    match_1.cancelmatch,
    submit_1.submit,
    submit_1.qualsubmit,
    submit_1.modsubmit,
    submit_1.modqualsubmit,
    quals_1.splitqual,
    help_1.help,
    quals_1.startsplitqual,
    quals_1.cancelqual,
    quals_1.endqual,
    util_1.qual_stats,
    utils_1.match_stats
]
    .concat(a.default)
    .concat(b.default)
    .sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name)
        return -1;
    else if (k1.name > k2.name)
        return 1;
    else
        return 0;
});
