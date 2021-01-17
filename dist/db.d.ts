import { config, Match, Qual } from "./types";
export declare function connectToDB(): Promise<void>;
export declare function updater(coll: string, filter: object, update: object): Promise<void>;
export declare function insertDoc(coll: string, upd: object): Promise<void>;
export declare function getDoc(coll: string, id: string | number): Promise<any>;
export declare function updateDoc(coll: string, id: string | number, upd: object): Promise<any>;
export declare function insertConfig(c: config): Promise<void>;
export declare function getConfig(): Promise<config>;
export declare function deleteConfig(): Promise<void>;
export declare function updateConfig(m: config): Promise<void>;
export declare function insertMatch(m: Match): Promise<void>;
export declare function getMatch(id: string): Promise<Match>;
export declare function getAllMatches(): Promise<Match[]>;
export declare function deleteMatch(id: string): Promise<void>;
export declare function updateMatch(m: Match): Promise<void>;
export declare function insertQual(m: Qual): Promise<void>;
export declare function getQual(id: string): Promise<Qual>;
export declare function getAllQuals(): Promise<Qual[]>;
export declare function deleteQual(id: string): Promise<void>;
export declare function updateQual(m: Qual): Promise<void>;
export declare function insertTemplate(lists: any[]): Promise<void>;
export declare function getTemplatedb(): Promise<{
    _id: "templatelist";
    list: string[];
}>;
export declare function updateTemplatedb(lists: string[]): Promise<void>;
export declare function getThemes(): Promise<{
    _id: "themelist";
    list: string[];
}>;
export declare function updateThemedb(st: {
    _id: "themelist";
    list: string[];
}): Promise<void>;
