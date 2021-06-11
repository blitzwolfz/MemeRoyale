export interface Match{
    _id:string,
    messageID:Array<string>;
    split:boolean;
    exhibition:boolean;
    temp:{
        istheme:boolean;
    },
    tempfound?:boolean,
    p1:{
        userid: string;
        memedone: boolean;
        donesplit:boolean;
        time: number;
    },
    p2:{
        userid: string;
        memedone: boolean;
        donesplit:boolean;
        time: number;
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
}

export interface QualPlayer{
    userid: string;
    memedone: boolean;
    time:number;
    split:boolean;
    failed:boolean;
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