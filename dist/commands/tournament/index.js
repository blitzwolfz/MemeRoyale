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
exports.cycle_restart = void 0;
const db_1 = require("../../db");
const signup_1 = require("./signup");
const s = __importStar(require("./challonge"));
exports.cycle_restart = {
    name: "cyclereset",
    description: "Reset for a cycle",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message, client, args) {
        let signup = await db_1.getDoc("config", "signups");
        signup.users = [];
        await db_1.updateDoc("config", "signups", signup);
        await signup_1.signup_manager.execute(message, client, ["open"]);
        let c = await db_1.getConfig();
        c.status = "Signups are now open!";
        await db_1.updateConfig(c);
    }
};
exports.default = [
    signup_1.signup,
    signup_1.signup_manager,
    exports.cycle_restart
]
    .concat(s.default)
    .sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name)
        return -1;
    else if (k1.name > k2.name)
        return 1;
    else
        return 0;
});
