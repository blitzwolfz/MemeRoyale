import { Message, Client } from "discord.js";
import { getConfig, getDoc, updateConfig, updateDoc } from "../../db";
import { Command, config, Signups } from "../../types";
import { signup, signup_manager, unsignup } from "./signup";
import * as s from "./challonge"

export const cycle_restart: Command = {
    name: "cyclereset",
    description: "Reset for a cycle",
    group: "tournament-manager",
    owner: false,
    admins: false,
    mods: true,
    async execute(message: Message, client: Client, args: string[]) {
        let signup:Signups = await getDoc("config", "signups")
        signup.users = []
        await updateDoc("config", "signups", signup)
        await signup_manager.execute(message, client, ["open"])

        let c:config = await getConfig()
        c.status = "Signups are now open!"
        await updateConfig(c)
    }
}


export default[
    signup,
    signup_manager,
    cycle_restart, 
    unsignup
]
.concat(s.default)
.sort(function keyOrder(k1, k2) {
    if (k1.name < k2.name) return -1;
    else if (k1.name > k2.name) return 1;
    else return 0;
})