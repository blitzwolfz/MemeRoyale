import type { Command, config, MatchList, Profile, QualList, Signups, VerificationForm } from "../types";
import type { Client, Message } from "discord.js";
import { insertDuelProfile, insertProfile, getAllColl, getOneColl, insertDoc, insertExhibition } from "../db";


interface MMuser {
    _id: string;
    name: string;
    memesvoted: number;
    points: number;
    wins: number;
    loss: number;
    img: string;
}

interface DuelProfile {
    _id: string;
    votetally: number;
    points: number;
    wins: number;
    loss: number;
}

export const transition: Command = {
    name: "transition",
    description: "EXAMPLE",
    group: "owner",
    owner: true,
    admins: false,
    mods: false,
    execute: async function (message: Message, client: Client, args: string[]) {
        let mmU: MMuser[] = await getAllColl("users");
        let temp = await getOneColl("tempstruct", "templatelist");
        let theme = await getOneColl("tempstruct", "themelist");
        let duelServers = [
            "589585409684668426",
            "719406444109103117",
            "819167358828281876"
        ];
        let mmD: { _id: string, users: DuelProfile[] }[] = [];

        for (let a of duelServers) {
            let u: DuelProfile[] = await getAllColl(a);
            mmD.push({
                _id: a, users: u
            });
        }

        let obj: Signups = {
             _id: "signups", msgID: "", autoClose: 0, open: false, users: []
        };

        let obj2: MatchList = {
            _id: "matchlist", url: "", users: []
        };

        let obj3: QualList = {
            _id: "quallist", users: []
        };

        let obj4: VerificationForm = {
            _id: "verificationform", user: []
        };

        let obj5: {
            _id: "templatelist", list: string[]
        } = {
            _id: "templatelist", list: temp.list
        };

        let obj6: {
            _id: "themelist", list: string[]
        } = {
            _id: "themelist", list: theme.list
        };

        let obj7:config = {
            _id:1,
            disabledcommands:[],
            colour:"#d7be26",
            status:"",
            servers:["621044091056029696"],
            isfinale:false
        }

        await insertExhibition();

        await insertDoc('config', obj);
        await insertDoc('config', obj2);
        await insertDoc('config', obj3);
        await insertDoc('config', obj4);
        await insertDoc('config', obj5);
        await insertDoc('config', obj6);
        await insertDoc('config', obj7);

        for (let u of mmU) {
            //@ts-ignore
            let a: Profile = u;
            a.votetally = u.memesvoted;
            await insertProfile(a);
        }

        for (let d of mmD) {
            for (let u of d.users) {
                await insertDuelProfile(u, d._id);
            }
        }
    }
};