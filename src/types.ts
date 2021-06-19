import { Client, Message } from "discord.js"

export interface Command {
    name: string
    aliases?:string[];
    description: string
    group:string;
    groupCommand?:boolean;
    owner:boolean;
    admins:boolean;
    mods:boolean;
    // Making `args` optional
    execute(message: Message, client:Client, args?: string[], ownerID?:string, silentargs?:string[]): Promise<any>;
}

export interface config{
    _id:1,
    disabledcommands:Array<string>
    status:string;
    colour:string;
    isfinale:boolean;
}

export interface Match{
    _id:string,
    messageID:Array<string>;
    split:boolean;
    exhibition:boolean;
    temp:{
        istheme:boolean;
        link:string
    },
    tempfound?:boolean,
    p1:{
        userid: string;
        memedone: boolean;
        donesplit:boolean;
        time: number;
        memelink: string;
        votes: number;
        voters: Array<string>;
    },
    p2:{
        userid: string;
        memedone: boolean;
        donesplit:boolean;
        time: number;
        memelink: string;
        votes: number;
        voters: Array<string>;
    },
    votetime: number;
    votingperiod: boolean;
}

export interface Qual{
    _id:string;
    messageID:Array<string>;
    players: Array<QualPlayer>;
    temp:{
        istheme:boolean;
        link:string
    },
    votingperiod:boolean
    votetime: number;
    // votemessage: null,
}

export interface QualPlayer{
    userid: string;
    memedone: boolean;
    memelink: string;
    time:number;
    split:boolean;
    failed:boolean;
    votes: Array<string>;
}

export interface Signups{
    _id:"signups";
    msgID:string;
    open: boolean;
    users: Array<string>;
}

export interface QualList{
    _id:"quallist";
    users: Array<Array<string>>;
}

export interface MatchList{
    _id:"matchlist";
    url: string;
    users: Array<string>;
}

export interface VerificationForm{
    _id:"verificationform";
    user:Array<{id:string,code:string}>
}

export interface exhibition{
    _id:"exhibition",
    cooldowns:Array<cooldown>,
    activematches:Array<string>,
    activeoffers:Array<cooldown>
}

export interface cooldown{
    user:string,
    time:number,
}

export interface Reminder {
    _id:string;
    mention:string;
    type: "meme" | "match";
    channel:string;
    time:number[];
    timestamp:number,
    basetime:number,
}

export interface Profile{
    _id:string;
    votetally:number;
    points:number;
    wins: number;
    loss: number;
}

export interface DuelProfile{
    _id:string;
    votetally:number;
    points:number;
    wins: number;
    loss: number;
}