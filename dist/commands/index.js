"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const help_1 = require("./help");
const match_1 = require("./match");
const utils_1 = require("./match/utils");
const quals_1 = require("./quals");
const util_1 = require("./quals/util");
const submit_1 = require("./submit");
exports.default = [
    match_1.startmatch,
    match_1.startsplit,
    match_1.endmatch,
    utils_1.reload_match,
    util_1.reload_qual,
    utils_1.forcevote,
    match_1.splitmatch,
    match_1.cancelmatch,
    submit_1.submit,
    submit_1.qualsubmit,
    quals_1.splitqual,
    help_1.help,
    quals_1.startsplitqual,
    quals_1.cancelqual,
    quals_1.endqual,
    util_1.qual_stats,
    utils_1.match_stats
].sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name)
        return -1;
    else if (k1.name > k2.name)
        return 1;
    else
        return 0;
});
