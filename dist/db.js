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
exports.insertExhibition = exports.updateExhibition = exports.getExhibition = exports.updateThemedb = exports.getThemes = exports.updateTemplatedb = exports.getTemplatedb = exports.insertTemplate = exports.updateQual = exports.deleteQual = exports.getAllQuals = exports.getQual = exports.insertQual = exports.updateMatch = exports.deleteMatch = exports.getAllMatches = exports.getMatch = exports.insertMatch = exports.updateConfig = exports.deleteConfig = exports.getConfig = exports.insertConfig = exports.updateDoc = exports.getDoc = exports.insertDoc = exports.updater = exports.connectToDB = void 0;
const mongodb = __importStar(require("mongodb"));
require("dotenv").config();
const url = process.env.dburl;
const client = new mongodb.MongoClient(url, { useNewUrlParser: true, connectWithNoPrimary: false, useUnifiedTopology: true });
const dbn = process.env.dbname;
let dB;
async function connectToDB() {
    return await new Promise(resolve => {
        client.connect(async (err) => {
            if (err)
                throw err;
            try {
                await client.db(dbn).createCollection("users");
                await client.db(dbn).createCollection("matches");
                await client.db(dbn).createCollection("quals");
                await client.db(dbn).createCollection("config");
            }
            catch (error) {
            }
            console.log("Successfully connected");
            await resolve();
            dB = client.db(dbn);
        });
    });
}
exports.connectToDB = connectToDB;
async function updater(coll, filter, update) {
    await dB.collection(coll).updateMany(filter, update);
}
exports.updater = updater;
async function insertDoc(coll, upd) {
    await dB.collection(coll).insertOne(upd);
}
exports.insertDoc = insertDoc;
async function getDoc(coll, id) {
    return await dB.collection(coll).findOne({ _id: id });
}
exports.getDoc = getDoc;
async function updateDoc(coll, id, upd) {
    return await dB.collection(coll).updateOne({ _id: id }, { $set: upd });
}
exports.updateDoc = updateDoc;
async function insertConfig(c) {
    await dB.collection("config").insertOne(c);
}
exports.insertConfig = insertConfig;
async function getConfig() {
    return await dB.collection("config").findOne({ _id: 1 });
}
exports.getConfig = getConfig;
async function deleteConfig() {
    await dB.collection("config").deleteOne({ _id: 1 });
}
exports.deleteConfig = deleteConfig;
async function updateConfig(m) {
    await dB.collection("config").updateOne({ _id: 1 }, { $set: m });
}
exports.updateConfig = updateConfig;
async function insertMatch(m) {
    await dB.collection("matches").insertOne(m);
}
exports.insertMatch = insertMatch;
async function getMatch(id) {
    return await dB.collection("matches").findOne({ _id: id });
}
exports.getMatch = getMatch;
async function getAllMatches() {
    return await dB.collection("matches").find({}).toArray();
}
exports.getAllMatches = getAllMatches;
async function deleteMatch(id) {
    await dB.collection("matches").deleteOne({ _id: id });
}
exports.deleteMatch = deleteMatch;
async function updateMatch(m) {
    await dB.collection("matches").updateOne({ _id: m._id }, { $set: m });
}
exports.updateMatch = updateMatch;
async function insertQual(m) {
    await dB.collection("quals").insertOne(m);
}
exports.insertQual = insertQual;
async function getQual(id) {
    return await dB.collection("quals").findOne({ _id: id });
}
exports.getQual = getQual;
async function getAllQuals() {
    return await dB.collection("quals").find({}).toArray();
}
exports.getAllQuals = getAllQuals;
async function deleteQual(id) {
    await dB.collection("quals").deleteOne({ _id: id });
}
exports.deleteQual = deleteQual;
async function updateQual(m) {
    await dB.collection("quals").updateOne({ _id: m._id }, { $set: m });
}
exports.updateQual = updateQual;
async function insertTemplate(lists) {
    let e = {
        _id: "templatelist",
        list: lists
    };
    console.log(e);
    await dB.collection("config").insertOne(e);
}
exports.insertTemplate = insertTemplate;
async function getTemplatedb() {
    return dB.collection("config").findOne({ _id: "templatelist" });
}
exports.getTemplatedb = getTemplatedb;
async function updateTemplatedb(lists) {
    let e = {
        _id: "templatelist",
        list: lists
    };
    console.log(e);
    await dB.collection("config").updateOne({ _id: "templatelist" }, { $set: e });
}
exports.updateTemplatedb = updateTemplatedb;
async function getThemes() {
    return dB.collection("config").findOne({ _id: "themelist" });
}
exports.getThemes = getThemes;
async function updateThemedb(st) {
    await dB.collection("config").updateOne({ _id: "themelist" }, { $set: st });
}
exports.updateThemedb = updateThemedb;
async function getExhibition() {
    return await dB.collection("config").findOne({ _id: "exhibition" });
}
exports.getExhibition = getExhibition;
async function updateExhibition(ex) {
    await dB.collection("config").updateOne({ _id: "exhibition" }, { $set: ex });
}
exports.updateExhibition = updateExhibition;
async function insertExhibition() {
    let e = {
        _id: "exhibition",
        cooldowns: [],
        activematches: [],
        activeoffers: []
    };
    await dB.collection("config").insertOne(e);
}
exports.insertExhibition = insertExhibition;
