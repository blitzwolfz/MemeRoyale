"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const help_1 = require("./help");
const match_1 = require("./match");
const utils_1 = require("./match/utils");
const quals_1 = require("./quals");
const submit_1 = require("./submit");
exports.default = [
    match_1.startmatch,
    match_1.startsplit,
    utils_1.reload,
    utils_1.forcevote,
    match_1.splitmatch,
    match_1.cancelmatch,
    submit_1.submit,
    quals_1.splitqual,
    help_1.help
];
