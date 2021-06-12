export interface APIMatch{
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

export interface APIQual{
    _id:string;
    messageID:Array<string>;
    players: Array<APIQualPlayer>;
    temp:{
        istheme:boolean;
        link:string
    },
    votingperiod:boolean
    votetime: number;
}

export interface APIQualPlayer{
    userid: string;
    memedone: boolean;
    time:number;
    split:boolean;
    failed:boolean;
}

export interface APIProfile{
    _id:string;
    votetally:number;
    points:number;
    wins: number;
    loss: number;
    profile?:string;
}

export interface APIDuelProfile{
    _id:string;
    votetally:number;
    points:number;
    wins: number;
    loss: number;
}