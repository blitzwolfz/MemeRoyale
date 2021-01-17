import { Client, Message } from "discord.js";
export interface Command {
    name: string;
    description: string;
    group: string;
    owner: boolean;
    admins: boolean;
    mods: boolean;
    execute(message: Message, client: Client, args?: string[], ownerID?: string): Promise<any>;
}
export interface config {
    _id: 1;
    disabledcommands: Array<string>;
    colour: string;
}
export interface Match {
    _id: string;
    messageID: Array<string>;
    split: boolean;
    exhibition: boolean;
    temp: {
        istheme: boolean;
        link: string;
    };
    tempfound?: boolean;
    p1: {
        userid: string;
        memedone: boolean;
        donesplit: boolean;
        time: number;
        memelink: string;
        votes: number;
        voters: Array<string>;
    };
    p2: {
        userid: string;
        memedone: boolean;
        donesplit: boolean;
        time: number;
        memelink: string;
        votes: number;
        voters: Array<string>;
    };
    votetime: number;
    votingperiod: boolean;
}
export interface Qual {
    _id: string;
    players: Array<QualPlayer>;
    temp: {
        istheme: boolean;
        link: string;
    };
    votes: Array<Array<string>>;
    votingperiod: boolean;
    votetime: number;
}
export interface QualPlayer {
    userid: string;
    memedone: boolean;
    memelink: string;
    time: number;
    split: boolean;
    failed: boolean;
}
export interface Signups {
    _id: "signups";
    open: boolean;
    users: Array<string>;
}
export interface QualList {
    _id: "quallist";
    users: Array<Array<string>>;
}
export interface MatchList {
    _id: "matchlist";
    url: string;
    users: Array<string>;
}
export interface VerificationForm {
    _id: "verificationform";
    user: Array<{
        id: string;
        code: string;
    }>;
}
