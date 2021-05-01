import * as mongodb from "mongodb"
import { config, exhibition, Match, Qual, Reminder } from "./types";
//import { config } from "./types"
require("dotenv").config();
const url: string = process.env.dburl!;
const client = new mongodb.MongoClient(url, { useNewUrlParser: true, connectWithNoPrimary: false, useUnifiedTopology: true });
const dbn = process.env.dbname!;
let dB:any;
export async function connectToDB(): Promise<void> {
    return await new Promise(resolve => {
        client.connect(async (err: any) => {
            if (err) throw err;
            try {
                await client.db(dbn).createCollection("users");
                await client.db(dbn).createCollection("matches");
                await client.db(dbn).createCollection("quals");
                await client.db(dbn).createCollection("config");
            } catch (error) {
                
            }
            console.log("Successfully connected");
            await resolve();
            dB = client.db(dbn)
        });
    });
}

//General db commands
//db.test.updateMany({foo: "bar"}, {$set: {test: "success!"}})
//See this StackOverflow post https://stackoverflow.com/a/1740258
export async function updater(coll:string, filter:object, update:object){
    await dB.collection(coll).updateMany(filter, update)
}

export async function insertDoc(coll:string, upd:object){
    await dB.collection(coll).insertOne(upd)
}

export async function getDoc(coll:string, id:string | number) {
    return await dB.collection(coll).findOne({_id:id})
}

export async function updateDoc(coll:string, id:string | number, upd:object) {
    return await dB.collection(coll).updateOne({_id:id}, {$set:upd})
}

//Config db commands
export async function insertConfig(c:config){
    await dB.collection("config").insertOne(c)
}

export async function getConfig():Promise<config>{
    return await dB.collection("config").findOne({_id:1})
}

export async function deleteConfig(){
    await dB.collection("config").deleteOne({_id:1})
}

export async function updateConfig(m:config){
    await dB.collection("config").updateOne({_id:1}, {$set:m})
}

//Match db commands
export async function insertMatch(m:Match){
    await dB.collection("matches").insertOne(m)
}

export async function getMatch(id:string):Promise<Match>{
    return await dB.collection("matches").findOne({_id:id})
}

export async function getAllMatches():Promise<Match[]>{
    return await dB.collection("matches").find({}).toArray()!
}

export async function deleteMatch(id:string){
    await dB.collection("matches").deleteOne({_id:id})
}

export async function updateMatch(m:Match){
    await dB.collection("matches").updateOne({_id:m._id}, {$set:m})
}

//Qual db commands
export async function insertQual(m:Qual){
    await dB.collection("quals").insertOne(m)
}

export async function getQual(id:string):Promise<Qual>{
    return await dB.collection("quals").findOne({_id:id})
}

export async function getAllQuals():Promise<Qual[]>{
    return await dB.collection("quals").find({}).toArray()!
}

export async function deleteQual(id:string){
    await dB.collection("quals").deleteOne({_id:id})
}

export async function updateQual(m:Qual){
    await dB.collection("quals").updateOne({_id:m._id}, {$set:m})
}

//Theme and Template dB commands
export async function insertTemplate(lists:any[]) {
    let e = {
        _id:"templatelist",
        list:lists
    }

    console.log(e)
    await dB.collection("config").insertOne(e)    
}

export async function getTemplatedb(): Promise<{_id:"templatelist", list: string[]}> {
    return dB.collection("config").findOne({_id:"templatelist"})!;   
}

export async function updateTemplatedb(lists:string[]) {
    let e = {
        _id:"templatelist",
        list:lists
    }

    console.log(e)
    await dB.collection("config").updateOne({_id:"templatelist"}, {$set: e})    
}

export async function getThemes(): Promise<{
    _id:"themelist",
    list:string[]
}>{
    return dB.collection("config").findOne({_id:"themelist"})!;   
}

export async function updateThemedb(st:{_id:"themelist",list:string[]}) {
    await dB.collection("config").updateOne({_id:"themelist"}, {$set: st})!;
}

//Exhibition matches

export async function getExhibition(): Promise<exhibition>{
    return await dB.collection("config").findOne({ _id: "exhibition" })!;
}

export async function updateExhibition(ex: exhibition){
    await dB.collection("config").updateOne({_id: "exhibition"}, {$set: ex});        
}

export async function insertExhibition(){

    let e:exhibition ={
        _id: "exhibition",
        cooldowns: [],
        activematches: [],
        activeoffers: []
    }
    await dB.collection("config").insertOne(e);        
}

//Reminder dB commands
export async function insertReminder(r:Reminder) {
    await dB.collection("reminders").insertOne(r) 
}

export async function getReminder(id:string): Promise<Reminder> {
    return await dB.collection("reminders").findOne({_id:id})!
}

export async function getAllReminders(q?:object): Promise<Reminder[]> {
    if(q){
        return await dB.collection("reminders").find(q).toArray()
    }
    return await dB.collection("reminders").find({}).toArray()
}

export async function updateReminder(r:Reminder) {
    await dB.collection("reminders").updateOne({_id:r._id}, {$set: r})    
}

export async function deleteReminder(r:Reminder) {
    await dB.collection("reminders").deleteOne({_id:r._id})  
}