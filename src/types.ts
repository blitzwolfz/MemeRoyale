import type { ApplicationCommandPermissionData, Client, CommandInteraction, Message } from "discord.js";

export interface Command {
    name: string
    aliases?: string[];
    description: string
    group: string;
    groupCommand?: boolean;
    owner: boolean;
    admins: boolean;
    mods: boolean;
    slashCommand:boolean;
    serverOnlyCommand:boolean;

    // Making `args` optional
    execute(message: Message, client: Client, args?: string[], ownerID?: string, silentargs?: string[]): Promise<any>;

    // Slash Commands
    slashCommandFunction?(interaction: CommandInteraction, client: Client): Promise<any>;
    slashCommandData?: ApplicationCommandData[];
    slashCommandPermissions?: ApplicationCommandPermissionData[];
}

export interface config {
    _id: 1,
    disabledcommands: Array<string>
    status: string;
    colour: string;
    servers: Array<string>;
    isfinale: boolean;
}

export interface Match {
    _id: string;
    pause: boolean;
    messageID: Array<string>;
    split: boolean;
    exhibition: boolean;
    temp: {
        istheme: boolean; link: string
    },
    tempfound?: boolean,
    p1: {
        userid: string; memedone: boolean; donesplit: boolean; time: number; memelink: string; votes: number; voters: Array<string>;
    },
    p2: {
        userid: string; memedone: boolean; donesplit: boolean; time: number; memelink: string; votes: number; voters: Array<string>;
    },
    votetime: number;
    votingperiod: boolean;
}

export interface Qual {
    _id: string;
    pause: boolean;
    messageID: Array<string>;
    players: Array<QualPlayer>;
    temp: {
        istheme: boolean; link: string
    },
    votingperiod: boolean
    votetime: number;
    // votemessage: null,
}

export interface QualPlayer {
    userid: string;
    memedone: boolean;
    memelink: string;
    time: number;
    split: boolean;
    failed: boolean;
    votes: Array<string>;
}

export interface Signups {
    _id: "signups";
    msgID: string;
    open: boolean;
    autoClose: number;
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
    user: Array<{ id: string, code: string }>
}

export interface exhibition {
    _id: "exhibition",
    cooldowns: Array<cooldown>,
    activematches: Array<string>,
    activeoffers: Array<cooldown>
}

export interface cooldown {
    user: string,
    time: number,
}

export interface Reminder {
    _id: string;
    mention: string;
    type: "meme" | "match";
    channel: string;
    time: number[];
    timestamp: number,
    basetime: number,
}

export interface Profile {
    _id: string;
    img: string;
    votetally: number;
    points: number;
    wins: number;
    loss: number;
    totalMemes: number;
    totalTime: number;
    voteDM:boolean;
}

export interface levelProfile {
    _id: string;
    xp: number;
    level: number
    timeStamp: number;
}

export interface DuelProfile {
    _id: string;
    votetally: number;
    points: number;
    wins: number;
    loss: number;
}

export interface CockProfile {
    _id:string,
    value: number,
    timestamp: number,
}

export interface Contest {
    _id: "contest";
    open: boolean;
    vote: boolean;
    users: Contestant[];
    msgIDS: string[];
}

export interface Contestant {
    _id: string;
    url: string;
}

export interface AutoCommands {
    _id: "autocommands",
    todo: todoCommands[]
}

export interface todoCommands {
    _id: string,
    timestamp: number,
    message: {
        id:string,
        channelID:string,
    },
    args: string[];
}

export interface verificationDoc {
    _id:"verify",
    users: {
        _id: string,
        code: string,
        nickname: string,
    }[]
}