import * as Discord from "discord.js";
require("dotenv").config();

import {
  activematch,
  cockratingInterface,
  configDB,
  qualmatch,
  randomtempstruct
} from "./misc/struct";
import { submit, qualsubmit, modsubmit, modqualsubmit } from "./commands/submit";
import {
  start,
  running,
  qualrunning,
  startqual,
  startmodqual,
  splitqual,
  startregularsplit,
  splitregular,
  reload,
  matchstats,
  qualstats,
  duelrunning,
} from "./commands/start";
import { cooldownremove, duelcheck, exhibition } from "./commands/exhibitions"
import { qualend, end, cancelmatch } from "./commands/winner";
import { vs } from "./commands/card";
import { getUser, hasthreevotes, emojis, removethreevotes, reminders, deletechannels, createrole, clearstats, qualifierresultadd, SeasonRestart, toHHMMSS, aaautoreminders, CycleRestart, resultadd, delay, sleep } from "./misc/utils";
import { ModHelp, UserHelp, ModSignupHelp, ModChallongeHelp, DuelHelp } from "./commands/help";

import {
  connectToDB,
  getActive,
  updateActive,
  updateQuals,
  deleteSignup,
  getMatch,
  getQual,
  getCockrating,
  insertCockrating,
  updateCockrating,
  updateModProfile,
  getalltempStructs,
  updatetempStruct,
  gettemplatedb,
  updatetemplatedb,
  getQuals,
  getConfig,
  updateConfig,
  getQuallist,
  updateProfile,
  updateThemedb,
  getthemes,
  getProfile,
  getReminders,
  getMatchlist,
  updateMatchlist,
  getReminder,
  insertReminder,
  updateReminder,
} from "./misc/db";

import { template, approvetemplate, addTheme, removeTheme, themelistLb, templatecheck } from "./commands/template";
import { createrUser, stats } from "./commands/user";
import {
  signup,
  startsignup,
  closesignup,
  removesignup,
  reopensignup,
  activeOffers,
  matchlistEmbed,
} from "./commands/signups";
import {
  CreateChallongeQualBracket,
  ChannelCreation,
  CreateChallongeMatchBracket,
  matchlistmaker,
  CreateQualGroups,
  declarequalwinner,
  GroupSearch,
  removequalwinner,
  QualChannelCreation,
  CreateCustomQualGroups,
  dirtyChannelcreate,
  matchwinner,
} from "./commands/challonge";
import { manuallyverify, verify } from "./misc/verify";
import { cockratingLB, winningLB, quallistGroups } from "./misc/lbs";
import { createmodprofile, viewmodprofile, modLB, clearmodstats } from "./misc/modprofiles";
import { getRandomThemeList } from "./misc/randomtemp";
import { duelLB, duelprofilecreate, duelstats } from "./misc/duellb";


console.log("Hello World, bot has begun life");




const express = require('express');
const app = express();
app.use(express.static('public'));
const http = require('http');
//@ts-ignore
var _server = http.createServer(app);
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], ws: { intents: new Discord.Intents(Discord.Intents.ALL) }});

app.get('/', (_request: any, response: any) => {
  response.sendFile(__dirname + "/index.html");
  //console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});


const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

client.on('ready', async () => {
  await connectToDB()
  console.log(`Logged in as ${client.user?.tag}`);
  // for(let i = 0; i < 2; i++) console.log(i)



  let matches: activematch[] = await getActive();

  if (matches) {
    for (const match of matches) {
      if (match.votingperiod) {
        let channel = <Discord.TextChannel>client.channels.cache.get(match.channelid)

        channel.messages.fetch(match.messageID[match.messageID.length-1]).then(async msg => {
          if (msg.partial) {
            await msg.fetch();
          }
        })
      }
    }
  }

  setInterval(async function () {
    // await running(client).catch((error) => {
    //   
    // });


    
    try {
      await running(client)
      
    } catch (err) {
      console.log("It's in running")
      console.log(err.name + ": " + err.message)
    }


    
  }, 15000);

  setInterval(async function () {
    // 

    await qualrunning(client).catch((error) => {
      console.log("it's in qualrunning");
      console.log(error.message)
      console.log(error.stack)
    });
    
  }, 15000);

  setInterval(async function () {
    
    await duelrunning(client).catch((error) => {
      console.log("it's in duel running");
      //console.log(error.message)
      console.log(error.stack)
    });
    
  }, 15000);


  setInterval(async function () {
    
    
    await aaautoreminders(client).catch((error) => {
      console.log("it's in reminders");
      console.log(error.message)
      console.log(error.stack)
    });
    
  }, 1000);

  //await autoreminders(client)

  //await running(client)
  //await qualrunning(client)
  if(process.env.DBNAME === "mememania" && process.env.update)
  await (<Discord.TextChannel>client.channels.cache.get("722616679280148504")).send("<@239516219445608449>", {
    embed: {
      description: `Updates/Restart has worked`,
      color: "#d7be26",
      timestamp: new Date()
    }
  });

  await client.user!.setActivity(`Building`); 
  await sleep(2)
  await client.user!.setActivity(`Warming up`);
  await sleep(2)
  await client.user!.setActivity(`${process.env.STATUS}`);
});

client.on("guildMemberAdd", async function (member) {

  await member.roles.add("730650583413030953")

  await member.user?.send("Please start verification with `!verify <reddit username>` in the verification channel.")

  
});

client.on("error", (e) => console.error(e));

client.on("messageReactionAdd", async function (messageReaction, user) {
  
  if (user.bot) return;

  // if(messageReaction.emoji.name === '🤏' && user.id !== "722303830368190485") {
  //   await messageReaction.users.remove(user.id)
  //   await messageReaction.message.react('🌀')
  //   let m = await messageReaction.message
  //   await m.edit("yes")
  // }

  let temps: randomtempstruct[] = await getalltempStructs()

  if (temps) {

    for (const temp of temps) {

      if (messageReaction.emoji.name === '🌀' && user.id !== "722303830368190485") {

        if (temp.istheme === false) {
          let templatelist = await (await gettemplatedb()).list
          let random: string = templatelist[Math.floor(Math.random() * templatelist.length)];

          let embed = new Discord.MessageEmbed()
            .setDescription("Random template")
            .setImage(random)
            .setColor("#d7be26")
            .setTimestamp()
          

          temp.url = random
          //temp.time = temp.time - (110 * 1000) 

          //await messageReaction.message.edit({embed})
          await (await (<Discord.TextChannel>client.channels.cache.get("722616679280148504"))
            .messages.fetch(temp.messageid))
            .edit({ embed })
          await updatetempStruct(temp._id, temp)
          await messageReaction.users.remove(user.id)
        }

        if (temp.istheme === true) {

          let themelist = await getRandomThemeList(client)
          let random: string = themelist[Math.floor(Math.random() * (((themelist.length - 1) - 1) - 1) + 1)];

          let embed = new Discord.MessageEmbed()
            .setTitle("Random Theme")
            .setDescription(`Theme is: ${random}`)
            .setColor("#d7be26")
            .setTimestamp()
          

          temp.url = random
          //temp.time = temp.time - (110 * 1000) 

          await (await (<Discord.TextChannel>client.channels.cache.get("722616679280148504"))
            .messages.fetch(temp.messageid))
            .edit({ embed })
          await updatetempStruct(temp._id, temp)
          await messageReaction.users.remove(user.id)
        }


      }

      if (messageReaction.emoji.name === '✅' && user.id !== "722303830368190485") {
        temp.found = true
        await updatetempStruct(temp._id, temp).then(async () => {
          await messageReaction.message.delete()
        })
      }

      else if (messageReaction.emoji.name === '❌' && user.id !== "722303830368190485") {
        temp.time = 121
        await updatetempStruct(temp._id, temp).then(async () => {
          await messageReaction.message.delete()
        })

      }
    }
  }

  if (messageReaction.emoji.name === '🅰️' || messageReaction.emoji.name === '🅱️' && user.id !== "722303830368190485") {
    //messageReaction.message.channel.send(user.client.guilds.cache.get(messageReaction.message.guild!.id)!.roles.cache.has("719936221572235295"))

    if (messageReaction.partial) await messageReaction.fetch();
    if (messageReaction.message.partial) await messageReaction.message.fetch();

    if (user.client.guilds.cache
      .get(messageReaction.message.guild!.id)!
      .members.cache.get(user.id)!
      .roles.cache.has("719936221572235295")
      === true || await (await getMatch(messageReaction.message.channel.id)).p1.userid === user.id 
      || await (await getMatch(messageReaction.message.channel.id)).p2.userid === user.id) {

      if (messageReaction.emoji.name === '🅰️') {
        if(await (await getMatch(messageReaction.message.channel.id)).p2.userid === user.id &&user.client.guilds.cache
        .get(messageReaction.message.guild!.id)!
        .members.cache.get(user.id)!
        .roles.cache.has("719936221572235295")
        === false){
          await messageReaction.users.remove(user.id)
          return user.send("No.");
        }
        let id = await (await getMatch(messageReaction.message.channel.id)).p1.userid
        await splitregular(messageReaction.message, client, id)
        await updateModProfile(messageReaction.message.author.id, "modactions", 1)
        await updateModProfile(messageReaction.message.author.id, "matchportionsstarted", 1)
        await messageReaction.users.remove(user.id)

        await (<Discord.TextChannel>client.channels.cache.get("748760056333336627")).send({

          embed: {
            description: `<@${user.id}>/${user.tag} has started <@${id}> in ${messageReaction.message.channel}`,
            color: "#d7be26",
            timestamp: new Date()
          }
        });

      }

      else if (messageReaction.emoji.name === '🅱️') {
        
        if(await (await getMatch(messageReaction.message.channel.id)).p1.userid === user.id && user.client.guilds.cache
        .get(messageReaction.message.guild!.id)!
        .members.cache.get(user.id)!
        .roles.cache.has("719936221572235295")
        === false){
          await messageReaction.users.remove(user.id)
          return user.send("No.");
        }
        let id = await (await getMatch(messageReaction.message.channel.id)).p2.userid
        await splitregular(messageReaction.message, client, id)
        await updateModProfile(messageReaction.message.author.id, "modactions", 1)
        await updateModProfile(messageReaction.message.author.id, "matchportionsstarted", 1)
        await messageReaction.users.remove(user.id)

        await (<Discord.TextChannel>client.channels.cache.get("748760056333336627")).send({

          embed: {
            description: `<@${user.id}>/${user.tag} has started <@${id}> in ${messageReaction.message.channel}`,
            color: "#d7be26",
            timestamp: new Date()
          }
        });

      }
    }

    else {
      await messageReaction.users.remove(user.id)
      await user.send("No.")
    }


  }

  if (messageReaction.emoji.name === '🏁' || messageReaction.emoji.name === '🗡️' && user.id !== "722303830368190485") {
    //messageReaction.message.channel.send(user.client.guilds.cache.get(messageReaction.message.guild!.id)!.roles.cache.has("719936221572235295"))
    if (messageReaction.message.channel.id !== "722291683030466621") return;
    if (messageReaction.partial) await messageReaction.fetch();
    if (messageReaction.message.partial) await messageReaction.message.fetch();

    if (user.client.guilds.cache
      .get(messageReaction.message.guild!.id)!
      .members.cache.get(user.id)!
      .roles.cache.has("719936221572235295")
      === true) {

      //let tempccc = <Discord.TextChannel>client.channels.cache.get("724827952390340648")
      if (messageReaction.emoji.name === '🏁') {
        let voteCollection: Discord.Collection<string, Discord.MessageReaction>;

        await messageReaction.message.channel.messages.fetch(messageReaction.message.id).then(msg => voteCollection = msg.reactions.cache);

        let l = voteCollection!.first()!.count!
        
        

        if (l >= 3) {
          let id:string | undefined;          
          try{
            id = await getUser(await messageReaction.message.embeds[0].description!).catch()
          }catch {

          }
          //await tempccc.send(await messageReaction.message.embeds[0].image?.url)
          if (await messageReaction.message.embeds[0].image?.url) {
            let e = await gettemplatedb()
            e.list.push(await messageReaction.message.embeds[0].image!.url)
            await updatetemplatedb(e.list)
            if(id){
              await updateProfile(id, "points", 2)
            } 

            let attach = new Discord.MessageAttachment(messageReaction.message.embeds[0].image!.url);
            
            (<Discord.TextChannel>await client.channels.fetch("724827952390340648")).send("New template:", attach)
          }

          else if (await messageReaction.message.embeds[0].fields) {
            "pepe"
            let obj = await getthemes()

            let st = ""
            for (let i = 0; i < messageReaction.message.embeds[0].fields.length; i++) {
              obj.list.push(messageReaction.message.embeds[0].fields[i].value)
              st = messageReaction.message.embeds[0].fields[i].value
            }

            await updateThemedb({
              _id: "themelist",
              list: obj.list
            })

            if(id) {await updateProfile(id, "points", 2)}

            (<Discord.TextChannel>await client.channels.fetch("724837977838059560")).send("New Theme:" + `${st}`)

          }

          await messageReaction.message.delete()
        }

      }

      else if (messageReaction.emoji.name === '🗡️') {
        let voteCollection: Discord.Collection<string, Discord.MessageReaction>;

        await messageReaction.message.channel.messages.fetch(messageReaction.message.id).then(msg => voteCollection = msg.reactions.cache);

        let l = voteCollection!.array()[1]!.count!
        
        

        if (l === 3) {
          //await tempccc.send(await messageReaction.message.embeds[0].image?.url)
          await messageReaction.message.delete()
        }

      }
    }

    else {
      await messageReaction.users.remove(user.id)
      await user.send("No.")
    }


  }

  if (['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'].includes(messageReaction.emoji.name) && user.id !== "722303830368190485" && await getQual(messageReaction.message.channel.id)) {
    //messageReaction.message.channel.send(user.client.guilds.cache.get(messageReaction.message.guild!.id)!.roles.cache.has("719936221572235295"))

    if (messageReaction.partial) await messageReaction.fetch();
    if (messageReaction.message.partial) await messageReaction.message.fetch();

    if (user.client.guilds.cache
      .get(messageReaction.message.guild!.id)!
      .members.cache.get(user.id)!
      .roles.cache.has("719936221572235295")
      === true || await (await getQual(messageReaction.message.channel.id)).playerids.includes(user.id) === true) {


      let pos = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'].indexOf(messageReaction.emoji.name)
      let id = await (await getQual(messageReaction.message.channel.id)).playerids[pos]
      
      if(id !== user.id && user.client.guilds.cache
        .get(messageReaction.message.guild!.id)!
        .members.cache.get(user.id)!
        .roles.cache.has("719936221572235295")
        === false){
        return user.send("No.")
      }

      await updateModProfile(messageReaction.message.author.id, "modactions", 1)
      await updateModProfile(messageReaction.message.author.id, "matchportionsstarted", 1)
      await splitqual(client, messageReaction.message, id)
      

      await (<Discord.TextChannel>client.channels.cache.get("748760056333336627")).send({

        embed: {
          description: `<@${user.id}>/${user.tag} has started <@${id}> in <#${messageReaction.message.channel}>`,
          color: "#d7be26",
          timestamp: new Date()
        }
      });

      await messageReaction.users.remove(user.id)
      await messageReaction.remove()


    }

    else {
      await messageReaction.users.remove(user.id)
      await user.send("No.")
    }
  }

  if (messageReaction.emoji.name === '🗳️') {
    await signup(messageReaction.message, client, user.id, false)

    await messageReaction.users.remove(user.id)
    await messageReaction.message.react('🗳️')
  }

  if (messageReaction.emoji.name === '👌') {
    if (user.client.guilds.cache
      .get(messageReaction.message.guild!.id)!
      .members.cache.get(user.id)!
      .roles.cache.has("719936221572235295")
      === false) {
      return;
    }

    //if(messageReaction.message.author.id !== "722303830368190485") return;

    let c = <Discord.TextChannel>await messageReaction.message.channel.fetch()
    let em = (await c.messages.fetch(messageReaction.message.id)).embeds[0]!
    let iter = 0
    for (let f of em.fields) {
      let key = `${f.value.match(/\d+/g)![1]}`
      await declarequalwinner(messageReaction.message, client, [key])
      iter += 1

      if (iter === 2) {
        await messageReaction.remove()
        return;
      }
    }
  }

  // if (messageReaction.emoji.name === '🖖'){
  //   if (user.client.guilds.cache
  //     .get(messageReaction.message.guild!.id)!
  //     .members.cache.get(user.id)!
  //     .roles.cache.has("719936221572235295")
  //     === false) {
  //     return;
  //   }
  //   let category = await messageReaction.message.guild!.channels.cache.find(c => c.id === messageReaction.message.channel.id)?.parent?.name;
  //   if(category?.toLowerCase() === "test"){
  //     await startregularsplit(messageReaction.message, client, ["", "", ""])
  //     await updateModProfile(user.id, "modactions", 1)
  //     await updateModProfile(user.id, "matchesstarted", 1)
  //     messageReaction.remove()
  //   }

  // }

  if (!emojis.includes(messageReaction.emoji.name)) return;

  
  // let quals: qualmatch[] = await getQuals()

  if ((messageReaction.emoji.name === emojis[1] || messageReaction.emoji.name === emojis[0])
    && await getMatch(messageReaction.message.channel.id)) {
    let match = await getMatch(messageReaction.message.channel.id)

    if (messageReaction.partial) await messageReaction.fetch();
    if (messageReaction.message.partial) await messageReaction.message.fetch();
    if (!match) return;

    if (user.id !== match.p1.userid && user.id !== match.p2.userid) { // != match.p1.userid || user.id != match.p2.userid
      
      if (messageReaction.emoji.name === emojis[0]) {
        
        if (match.p1.voters.includes(user.id)) {
          await user.send("You can't vote on the same meme twice")
          await messageReaction.users.remove(user.id)
          await messageReaction.message.react(emojis[0])
        }

        else {
          match.p1.votes += 1
          match.p1.voters.push(user.id)

          if (match.p2.voters.includes(user.id)) {
            match.p2.votes -= 1
            match.p2.voters.splice(match.p2.voters.indexOf(user.id), 1)
          }
          await messageReaction.users.remove(user.id)
          await messageReaction.message.react(emojis[0])
          if (!match.exhibition) {
            await user.send(`Vote counted for Player 1's memes in <#${match.channelid}>. You gained 2 points for voting`)
          }

          else {
            await user.send(`Vote counted for Player 1's memes in <#${match.channelid}>.`)
          }
          

        }
      }

      else if (messageReaction.emoji.name === emojis[1]) {
        

        if (match.p2.voters.includes(user.id)) {
          await user.send("You can't vote on the same meme twice")
          await messageReaction.users.remove(user.id)
          await messageReaction.message.react(emojis[1])
        }

        else {
          match.p2.votes += 1
          match.p2.voters.push(user.id)


          if (match.p1.voters.includes(user.id)) {
            match.p1.votes -= 1
            match.p1.voters.splice(match.p1.voters.indexOf(user.id), 1)
          }
          await messageReaction.users.remove(user.id)
          await messageReaction.message.react(emojis[1])
          if (!match.exhibition) {
            await user.send(`Vote counted for Player 2's memes in <#${match.channelid}>. You gained 2 points for voting`)
          }

          else {
            await user.send(`Vote counted for Player 2's memes in <#${match.channelid}>.`)
          }
          
        }
      }

      await updateActive(match)
    }

    else {
      await messageReaction.users.remove(user.id)
      await user.send("Can't vote on your own match")
    }
  }

  //removethreevotes() now only checks if it's 2 votes or less
  if (emojis.includes(messageReaction.emoji.name) && await getQual(messageReaction.message.channel.id)) {
    let match = await getQual(messageReaction.message.channel.id)

    if (!match) return;

    if (messageReaction.partial) await messageReaction.fetch();
    if (messageReaction.message.partial) await messageReaction.message.fetch();

    if (match.votingperiod === false) return;

    if (match.playerids.includes(user.id)) {
      await messageReaction.users.remove(user.id)
      return user.send("You can't vote in your own qualifers")
    }

    if (messageReaction.emoji.name === emojis[6]) {
      match.votes = removethreevotes(match.votes, user.id)
      await updateQuals(match)
      messageReaction.users.remove(user.id)
      return user.send("Your votes have been reset")
    }

    else {
      let i = emojis.indexOf(messageReaction.emoji.name)

      if (hasthreevotes(match.votes, user.id)) {
        await messageReaction.users.remove(user.id)
        return user.send("You used up all your votes. Please hit the recycle emote to reset your votes")
      }

      if (!match.playersdone.includes(match.playerids[i])) {
        await messageReaction.users.remove(user.id)
        return user.send("You can't vote for a user who failed to submit a meme.")
      }

      else if (match.votes[i].includes(user.id)) {
        await messageReaction.users.remove(user.id)
        return user.send("You can't vote for a meme twice. Hit the recycle emote to reset your votes")
      }

      else {
        match.votes[i].push(user.id)
        await messageReaction.users.remove(user.id)
        await updateQuals(match)
        return user.send(`Your vote for meme ${i + 1} in <#${match.channelid}> been counted. You gained 2 points for voting`);
      }
    }
  }
});

client.on("message", async message => {
  //const gamemaster = message.guild.roles.get("719936221572235295");

  if(["building", "warming up"].includes(client.user?.presence.activities[0].name.toLowerCase()!)) return;
  // if(message.content.includes("!speedrun")){
  //   await qualrunning(client);
  //   await running(client);
  //   
  // }

  if (message.content.indexOf(process.env.PREFIX!) !== 0 || message.author.bot) {
    if (message.author.id !== "688558229646475344") return;
  }

  var args: Array<string> = message.content.slice(process.env.PREFIX!.length).trim().split(/ +/g);

  if (!args || args.length === 0) {
    return
  };

  

  const command: string | undefined = args?.shift()?.toLowerCase();

  if (!command) {
    if(message.mentions.roles.first()!.id === "719936221572235295"){
      let q = function (x: activematch) {
        return ((x.p1.userid === message.author.id || x.p2.userid === message.author.id) && x.exhibition === false)
      }
  
      let qqq = function (x: qualmatch) {
        return ((x.players.find(y => y.userid === message.author.id)))
      }
  
      let m = await (await getActive()).find(q)
      let qu = await (await getQuals()).find(qqq)
  
      if(!m && !q){
        return;
      }
  
      else if(m){
        if(m.p1.userid === message.author.id){
          return await message.reply("Hey your match has already started. Click on 🅰️ to begin your match.")
        }
    
        if(m.p2.userid === message.author.id){
          return await message.reply("Hey your match has already started. Click on 🅱️ to begin your match.")
        }
      }
  
      else if(!qu){
        return;
      }
  
      else if(qu){
        let emmojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫']
  
        return await message.reply(`Hey your match has already started. Click on ${emmojis[qu.players.findIndex(x => x.userid === message.author.id)]} to begin your match.`)
      }
  
      else{
        return;
      }
  
    }
    return
  };

  if (command === "!speedrun") {
    await qualrunning(client);
    await running(client);
    
  }

  if (command === "forcepoll") {

    let match = await getMatch(message.channel.id)

    if (Math.floor(Math.random() * (5 - 1) + 1) % 2 === 1) {
      let temp = match.p1

      match.p1 = match.p2

      match.p2 = temp
    }
    match.p1.time = (Math.floor(Date.now() / 1000)) - 2800
    match.p2.time = (Math.floor(Date.now() / 1000)) - 2800
    match.votingperiod = true
    match.votetime = (Math.floor(Date.now() / 1000))

    await updateActive(match)

    await reload(message, client)

  }

  else if (command === "ping") {
    const m: Discord.Message = await message.channel.send("Ping?") as Discord.Message;
    await m.edit(`Latency is ${m.createdTimestamp - message.createdTimestamp}ms. Discord API Latency is ${Math.round(client.ws.ping)}ms`);
  }

  else if (command === "templatecheck") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("only selected users can use this command. If any problem occured, DM <@239516219445608449>.");
    await templatecheck(message, client, args)
  }

  else if (command === "updatemessage" || command === "upmsg") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("only selected users can use this command. If any problem occured, DM <@239516219445608449>.");

    let c = await getConfig()

    c.upmsg = args.join(" ")
    await updateConfig(c)

    message.reply(`Added update message of ${args.join(" ")}`);
  }

  else if (command === "announce") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("only selected users can use this command. If any problem occured, DM <@393137628083388430>.");
    let c: configDB = await getConfig(), output = c.upmsg
    let channel = <Discord.TextChannel>client.channels.cache.get("722284266108747880"); //Change this to the announcement channel id

    if (["everyone", "e", "Everyone", "E"].includes(args[0])) channel.send(`@everyone ${output}`);

    else if (["help", "h", "Help", "H"].includes(args[0])) message.reply("Please either `.announce everyone` to ping everyone or `.announce` to not ping everyone");

    else channel.send(output);
  }

  else if (command === "say") {
    const sayMessage = args.join(" ");
    if (sayMessage.match(/@everyone/) && !message!.member!.permissions.has(['MANAGE_MESSAGES'])) {
      await message.channel.send(`-mute <@${message.author.id}>`)
      return message.reply("YOU DARE PING EVERYONE!");
    }

    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("Bitch.")

    message.delete().catch(console.log);
    message.channel.send(sayMessage);
  }

  else if (command === "reminder") {
    await reminders(client, args)
  }

  else if (command === "createrole") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await createrole(message, args)
  }

  else if (command === "deletechannels") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await deletechannels(message, args)
  }

  else if (command === "test") {
    let reminders = await getReminders();
    for (let r of reminders) {
      if (Math.floor(Date.now() / 1000) - r.timestamp >= r.time[r.time.length - 1]) {
        if (r.type === "match") {
          if (r.basetime !== r.time[r.time.length - 1]) {
            for (let xx of r.mention.match(/\d+/g)!) {
              await message.channel.send(`${(await client.users.fetch(xx)).tag} has ${(r.basetime - r.time[r.time.length - 1]) / 3600}h left to do their match in <#${r.channel}>`)
            }
          }
        }
      }
    }

  }

  else if (command === "createqualgroup") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    if (message.channel.id === "722285800225505879" || message.channel.id === "722285842705547305" || message.channel.id === "724839353129369681") return;

    await CreateQualGroups(message, args)
  }

  else if (command === "createcustomqualgroup") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    if (message.channel.id === "722285800225505879" || message.channel.id === "722285842705547305" || message.channel.id === "724839353129369681") return;

    await CreateCustomQualGroups(message, args)
  }

  else if (command === "viewgroups") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    if (message.channel.id === "722285800225505879" || message.channel.id === "722285842705547305" || message.channel.id === "724839353129369681") return;

    // if (!args) return await quallistEmbed(message, client, args)

    message.channel.send({ embed: await quallistGroups(message, client, args) })
  }

  else if (command === "search") {
    await GroupSearch(message, args)
  }

  else if (command === "qrd") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await qualifierresultadd(await (<Discord.TextChannel>client.channels.cache.get(message.channel.id)), client, args[0], args[1])
  }

  else if(command === "qra"){
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    let emm = await resultadd(await (<Discord.TextChannel>client.channels.cache.get(message.channel.id)), client, [args[0], args[1]])

    await message.channel.send({ embed:emm })
    
    await (await (<Discord.TextChannel>client.channels.cache.get("722291182461386804")))
        .send({ embed:emm });
  }

  else if(command === "paypal" || command === "donation"){
    return await message.channel.send("Wait I get paid? - blitz")
  }

  else if (command === "exhibition" || command === "duel") {
    //if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")

    if (args[0].toLowerCase() === "help") {
      await message.channel.send({ embed: DuelHelp })
    }

    else if (args[0].toLowerCase() === "check") {
      await duelcheck(message)
    }

    else if (args[0].toLowerCase() === "lb") {
      await duelLB(message, client, args)
    }

    else if (args[0].toLowerCase() === "stats") {
      //args = args.slice(0, 1)
      await duelstats(message, client, args)
    }

    else if (args[0].toLowerCase() === "create") {
      args = args.slice(0, 1)
      await duelprofilecreate(message, client, args)
    }

    else if(args[0].toLowerCase() === "resetcd"){
      if (!message.member!.roles.cache.has('719936221572235295') && !message!.member!.permissions.has(['MANAGE_MESSAGES'])) return message.reply("You don't have those premissions")
      await cooldownremove(message)
    }

    else {

      try {
        await exhibition(message, client, args)

      } catch (error) {
        console.log(error)
        await message.channel.send(new Discord.MessageEmbed()
          .setFooter("blitzwolfz#9338", "https://cdn.discordapp.com/avatars/239516219445608449/12fa541557ca2635a34a5af5e8c65d26.webp?size=512")
          .setColor("RED")
          .setTitle("ERROR")
          .addFields(
            { name: 'Channel Name', value: `${(<Discord.TextChannel>await client.channels.fetch(message.channel.id)).name}`, inline: true },
            { name: 'Channel Id', value: `${message.channel.id}`, inline: true },
            { name: 'User', value: `${message.author.tag}`, inline: true },
            { name: 'User Id', value: `${message.author.id}`, inline: true },
          )
          .setDescription(`\`\`\`${error.message}\n${error.stack}\`\`\``)
        )
      }
    }

  }

  else if (command === "mqw"){
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    let t = []
    t.push(args[0])
    t.push(args[1])
    t.push(args[2])
    t.push(args[3])
    await matchwinner(t)
  }

  else if (command === "dqw" || command === "declarequalwinner") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")

    await declarequalwinner(message, client, args)
  }

  else if (command === "mdqw"){
    let match = await getMatchlist()
    match.users = []

    for(let m of message.mentions.users.array()){
      match.users.push(m.id)
    }
    await updateMatchlist(match)
  }

  else if (command === "removequalwinner") {
    await removequalwinner(message, client)
  }

  if (command === "verify" || command === "code") {
    if (message.guild?.name.toLowerCase() !== "MemeRoyale".toLowerCase())
    await verify(message, client)
  }

  if (command === "manualverify" || command === "mv") {
    if (!message.member!.roles.cache.has('724818272922501190')) return message.reply("You don't have those premissions")
    await manuallyverify(message, client, args)
  }

  else if (command === "submit") {
    if (message.channel.id === "722285800225505879" || message.channel.id === "722285842705547305" || message.channel.id === "724839353129369681") return;
    if(args.includes("-mod")) await modsubmit(message, client, args);
    else await submit(message, client, args);
  }

  else if (command === "qualsubmit") {
    if (message.channel.id === "722285800225505879" || message.channel.id === "722285842705547305" || message.channel.id === "724839353129369681") return;
    if(args.includes("-mod")) await modqualsubmit(message, client, args);
    else await qualsubmit(message, client);
  }

  else if (command === "submittemplate" || command === "template") {
    await template(message, client, args)
  }

  else if (command === "themesubmit") {
    //if(message.channel.type !== "dm") return message.reply("Must be in bot dm")
    let channel = <Discord.TextChannel>client.channels.cache.get("722291683030466621")
    
    if(message.channel.type !== "dm"){
      message.reply("Please dm bot theme")
      return message.delete()
    }
    
    //var args: Array<string> = message.content.slice(process.env.PREFIX!.length).trim().split(/ +/g);
    let targs = args.join(" ").split(",")
    console.log(targs)

    if(args.length === 0) return message.reply("Please enter a theme")

    if(targs.length > 1) return message.reply("Can only enter one theme at a time")

    let em = new Discord.MessageEmbed()
      .setTitle(`${message.author.username} has submitted a new Theme(s)`)
      .setDescription(`<@${message.author.id}>`)

    for (let i = 0; i < targs.length; i++) {
      em.addField(`Theme: ${i + 1}`, targs[i])
    }

    await channel.send(em).then(async message => {
      await message.react('🏁')
      await message.react('🗡️')
    })

    // updateProfile(message.author.id, "points", (message.attachments.array().length * 2))
    await message.reply(`Thank you for submitting themes. You will gain a maximum of ${targs.length} points if they are approved. You currently have ${(await getProfile(message.author.id)).points} points`)
  }

  else if (command === "start") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await start(message, client)
    await updateModProfile(message.author.id, "modactions", 1)
    await updateModProfile(message.author.id, "matchesstarted", 1)
  }

  else if (command === "forefeit") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await message.reply("Not ready")
    //await forfeit(message, client)
  }

  else if (command === "checkmatch") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")

    if (await getMatch(message.channel.id)) {
      message.reply("There is an active match")
    }

    else if (await getQual(message.channel.id)) {
      message.reply("There is an active qualifier match")
    }

    else {
      message.reply("There are no matches")
    }
  }

  else if (command === "startqual") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await startqual(message, client)
    await updateModProfile(message.author.id, "modactions", 1)
    await updateModProfile(message.author.id, "matchesstarted", 1)
  }

  else if (command === "startmodqual" || command === "splitqual") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await startmodqual(message, client)
    await updateModProfile(message.author.id, "modactions", 1)
    await updateModProfile(message.author.id, "matchesstarted", 1)
  }

  else if (command === "startmodmatch" || command === "splitmatch" || command === "split") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await startregularsplit(message, client)
    await updateModProfile(message.author.id, "modactions", 1)
    await updateModProfile(message.author.id, "matchesstarted", 1)
  }

  else if (command === "settheme" || command === "themeset") {
    //let id = message.mentions.channels.first()!.id
    if (!message.mentions.channels.first()) return message.reply("Please, state the channel for the qualifier")

    if (!args[1]) return message.reply("please enter a theme")

    let match = await getQual(message.mentions.channels.first()!.id)

    match.template.push(args.slice(1).join(" "))

    await (<Discord.TextChannel>client.channels.cache.get("738047732312309870"))
      .send(`<#${match.channelid}> theme is ${args.slice(1).join(" ")}`);

    match.istheme = true

    await updateQuals(match)

    await message.reply("Theme has been set!")

  }

  else if (command === "addtheme") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await addTheme(message, client, args)
  }

  else if (command === "deletetheme" || command === "removetheme") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await removeTheme(message, client, args)
  }

  else if (command === "themelist") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await themelistLb(message, client, args)
  }

  else if (command === "approve") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    if (message.channel.id === "722285800225505879" || message.channel.id === "722285842705547305" || message.channel.id === "724839353129369681") return;

    await approvetemplate(message, client)
    await updateModProfile(message.author.id, "modactions", 1)
  }

  else if (command === "create") {
    await createrUser(message)
  }

  else if (command === "modcreate") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await createmodprofile(message)
  }

  else if (command === "modstats") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await viewmodprofile(message, client, args)
  }

  else if (command === "modlb") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await modLB(message, client, args)
  }

  else if (command === "resetmodprofiles") {
    if (message.author.id !== "239516219445608449") return message.reply("You don't have those premissions")
    await clearmodstats(message)
  }

  else if (command === "cr" || command === "cockrating") {

    if (!message.member!.roles.cache.has('719936221572235295') || !message!.member!.permissions.has(['MANAGE_MESSAGES'])) {
      return message.reply("You are not cock rating master.")
    }

    else {
      let id = (message.mentions?.users?.first()?.id || message.author.id)
      let form = await getCockrating(id)
      let max = 100
      let min = (id === "239516219445608449" ? Math.floor(Math.random() * ((max - 35) - 35) + 1) : Math.floor(Math.random() * ((max - 1) - 1) + 1))

      if (!form) {
        message.reply(`<@${id}> has ${max === min ? `100% good cock` : `${min}/${max} cock.`}`)



        let newform: cockratingInterface = {
          _id: id,
          num: min,
          time: Math.floor(Date.now() / 1000)
        }

        await insertCockrating(newform)
      }

      if (Math.floor(Date.now() / 1000) - form.time < 259200) {
        return message.reply("It has not been 3 days")
      }

      else {
        message.reply(`<@${id}> has ${max === min ? `100% good cock` : `${min}/${max} cock. The previous rating was ${form.num}/${max} cock`}`)

        form.num = min
        form.time = Math.floor(Date.now() / 1000)
        await updateCockrating(form)
      }
    }
  }

  else if (command === "mr" || command === "manualrating" || command === "powercock") {

    if (!message.member!.roles.cache.has('719936221572235295')) {
      return message.reply("You are not cock rating master.")
    }

    else {
      let id = (message.mentions?.users?.first()?.id || message.author.id)
      let form = await getCockrating(id)
      let max = 100
      let min = parseInt(args[1] || args[0])

      if (!form) {
        message.reply(`<@${id}> has ${max === min ? `100% good cock` : `${min}/${max} cock.`}`)



        let newform: cockratingInterface = {
          _id: id,
          num: min,
          time: Math.floor(Date.now() / 1000)
        }

        await insertCockrating(newform)
      }

      else {
        message.reply(`<@${id}> has ${max === min ? `100% good cock` : `${min}/${max} cock. The previous rating was ${form.num}/${max} cock`}`)

        form.num = min
        await updateCockrating(form)
      }
    }
  }

  else if (command === "crlb") {
    await cockratingLB(message, client, args)
  }

  else if (command === "lb") {
    await winningLB(message, client, args)
  }

  else if (command === "clearstats") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await clearstats(message)
  }

  else if (command === "stats") {
    await stats(message, client)
  }

  else if (command === "startsplitqual" || command === "ssq") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await splitqual(client, message)
    await updateModProfile(message.author.id, "modactions", 1)
    await updateModProfile(message.author.id, "matchportionsstarted", 1)
  }

  else if (command === "matchstats") {
    if (!message.member!.roles.cache.find(x => x.name.toLowerCase() === "referee")) return message.reply("You don't have those premissions")
    await matchstats(message, client)
  }

  else if (command === "qualstats") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await qualstats(message, client)
  }

  else if (command === "startsplit") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await splitregular(message, client)
    await updateModProfile(message.author.id, "modactions", 1)
    await updateModProfile(message.author.id, "matchportionsstarted", 1)
  }

  else if (command === "reload2") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await reload(message, client)
  }

  else if (command === "reload") {

    let match = await getMatch(message.channel.id)

    if (match) {
      let match = await getMatch(message.channel.id)
      let channel = <Discord.TextChannel>await client.channels.cache.get(message.channel.id)!
      for (let ms of match.messageID) {
        (await channel.messages.fetch(ms)).delete()
      }

      match.split = false
      match.votingperiod = false
      match.p1.time = Math.floor(Date.now() / 1000) - 3200
      match.p2.time = Math.floor(Date.now() / 1000) - 3200

      await updateActive(match)
      return message.reply("Reloading").then(m => {
        m.delete({ timeout: 1500 })
      })
    }

    else {
      let match = await getQual(message.channel.id)
      let channel = <Discord.TextChannel>await client.channels.cache.get(message.channel.id)!
      for (let ms of match.messageID) {
        (await channel.messages.fetch(ms)).delete()
      }

      match.split = false
      match.octime = ((Math.floor(Date.now())) / 1000) - 1800

      let temparr = []

      for (let player of match.players) {
        if (!player.failed) {
          temparr.push(player.userid)
        }
      }
      match.playersdone = temparr

      await updateQuals(match)
      return message.reply("Reloading").then(m => {
        m.delete({ timeout: 1500 })
      })
    }
  }

  else if (command === "qualend") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")

    await qualend(client, message.channel.id)
  }

  else if (command === "end") {
    if (!message.member!.roles.cache.find(x => x.name.toLowerCase() === "referee") && !message!.member!.permissions.has(['MANAGE_MESSAGES'])) return message.reply("You don't have those premissions")
    if(await (await getMatch((message.mentions.channels.first()!.id || message.channel.id))).exhibition){
      let m = await getMatch(message.mentions.channels.first()!.id || message.channel.id)
      m.votetime -= 7200
      await updateActive(m)
    }
    else{
      await end(client, message.channel.id)
    }
  }

  else if (command === "cancel") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await cancelmatch(message)
  }

  else if (command === "modhelp") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await message.channel.send({ embed: ModHelp })
  }

  else if (command === "help") {
    await message.channel.send({ embed: UserHelp })
  }

  else if (command === "signuphelp") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await message.channel.send({ embed: ModSignupHelp })
  }

  else if (command === "seasonrestart") {
    if (message.author.id !== "239516219445608449") return message.reply("You don't have those premissions")
    await SeasonRestart(message, client)
  }

  else if (command === "cyclerestart") {
    if (message.author.id !== "239516219445608449") return message.reply("You don't have those premissions")
    await CycleRestart(message, client)
  }

  else if (command === "votereset") {
    if (message.author.id !== "239516219445608449") return message.reply("You don't have those premissions")
    await clearstats(message)
  }

  else if (command === "challongehelp") {
    if (!message.member!.roles.cache.has('719936221572235295')) return message.reply("You don't have those premissions")
    await message.channel.send({ embed: ModChallongeHelp })
  }

  else if (command === "pullout" || command === "goingformilk" || command === "unsignup" || command === "withdraw" || command === "removesignup") {
    await removesignup(message)
  }

  else if (command === "viewsignup" || command === "viewlist") {
    //await viewsignup(message, client)
    await activeOffers(message, client, args)
    //matchlistEmbed
  }

  else if (command === "allmatches") {
    if (!message.member!.roles.cache.has('724818272922501190')) return message.reply("You don't have those premissions")
    let a = await getActive()

    if (a) {
      for (let i = 0; i < a.length; i++) {
        if (a[i].exhibition === false) await message.channel.send(`${a[i].channelid} ---> <#${a[i].channelid}>\nTime to finish: ${await toHHMMSS(7200, a[i].votetime)}`)
      }

    }

    let aa = await getQuals()

    if (aa) {
      for (let i = 0; i < aa.length; i++) {
        await message.channel.send(`${aa[i].channelid} ---> <#${aa[i].channelid}>\nTime to finish: ${await toHHMMSS(7200, aa[i].votetime)}`)
      }
    }


  }

  else if(command === "allreminders"){
    let reminders = await getReminders(
      { type: "match" }
    )

    if(reminders.length === 0) return message.reply("No reminders");

    for(let r of reminders){
      await message.channel.send(`Channel: <#${r._id}>\nTime Left: ${Math.floor(Date.now() / 1000) - r.timestamp}\nOther thing: ${r.time}`)
      //await message.channel.send("_ _")

      // r.timestamp = 1620008978
      // r.time = 165600

      // await updateReminder(r)
    }

    await message.channel.send("Done.")
  }

  else if (command === "viewmatchlist" || command === "matchlist") {
    //await viewsignup(message, client)
    await matchlistEmbed(message, client)

  }

  else if (command === "startsignup") {
    await startsignup(message, client)
  }

  else if (command === "matchlistmaker") {
    if (message.channel.id === "722285800225505879" || message.channel.id === "722285842705547305" || message.channel.id === "724839353129369681") return;
    await matchlistmaker()
  }

  else if (command === "createqualiferbracket" || command === "createqualbracket") {
    if (message.member!.roles.cache.has('724818272922501190')
      || message.member!.roles.cache.has('724832462286356590'))
      await matchlistmaker()
    await CreateChallongeQualBracket(message, client, args)
  }

  else if (command === "createbracket") {
    if (message.member!.roles.cache.has('724818272922501190')
      || message.member!.roles.cache.has('724832462286356590'))
      await CreateChallongeMatchBracket(message, client, args, (await client.guilds.cache.get("719406444109103117")!))
  }

  else if (command === "channelcreate") {
    if (message.member!.roles.cache.has('724818272922501190')
      || message.member!.roles.cache.has('724832462286356590'))
      await ChannelCreation(message, client, args)
  }

  else if (command === "dirtychannelcreate") {
    if (message.member!.roles.cache.has('724818272922501190')
      || message.member!.roles.cache.has('724832462286356590'))
      await dirtyChannelcreate(message, client, args)
  }

  else if (command === "qualchannelcreate") {
    if (message.member!.roles.cache.has('724818272922501190')
      || message.member!.roles.cache.has('724832462286356590'))
      await QualChannelCreation(message, args)
  }

  else if (command === "secondqual") {
    if (message.member!.roles.cache.has('724818272922501190')
      || message.member!.roles.cache.has('724832462286356590')) {
      let channels = await message.guild!.channels.cache.array()
      let groups = await getQuallist()


      for (let c of channels) {

        if (c.parent && c.parent!.name === "qualifiers") {
          let q = await getReminder(c.id)

          if (q) {
            let time2 = 36

            let timeArr: Array<number> = []

            timeArr.push(36*3600)

            if ((time2 - 2) * 3600 > 0 && (Math.floor(Date.now() / 1000) - parseInt(args[0]) < ((time2 - 2) * 3600))) {
              timeArr.push((time2 - 2) * 3600)
            }

            if ((time2 - 12) * 3600 > 0 && (Math.floor(Date.now() / 1000) - parseInt(args[0]) < ((time2 - 12) * 3600))) {
              timeArr.push((time2 - 12) * 3600)
            }
            q.basetime = time2 * 3600
            q.timestamp = parseInt(args[0])
            q.time = timeArr

            await updateReminder(q)
          }

          else {
            let time2 = 36

            let timeArr: Array<number> = []

            timeArr.push(36*3600)

            if ((time2 - 2) * 3600 > 0 && (Math.floor(Date.now() / 1000) - parseInt(args[0]) < ((time2 - 2) * 3600))) {
              timeArr.push((time2 - 2) * 3600)
            }

            if ((time2 - 12) * 3600 > 0 && ((Math.floor(Date.now() / 1000) - parseInt(args[0])) < ((time2 - 12) * 3600))) {
              timeArr.push((time2 - 12) * 3600)
            }

            let mentikon = ""
            let n = parseInt(c.name.toLowerCase().replace("group-", "")) - 1
            for (let u of groups.users[n]) {
              mentikon += `<@${u}> `
            }

            await insertReminder(
              {
                _id: c.id,
                mention: mentikon,
                channel: c.id,
                type: "match",
                time: timeArr,
                timestamp: parseInt(args[0]),
                basetime: time2 * 3600
              }
            )
          }

        }
      }
    }

  }

  else if (command === "timetester") {
    return await message.reply(`It is ${(parseInt(args[0])*3600) + parseInt(args[1])}`)
  }

  else if (command === "reopensignup") {
    if (message.member!.roles.cache.has('724818272922501190')
      || message.member!.roles.cache.has('724832462286356590'))
      await reopensignup(message, client)
  }

  else if (command === "closesignup") {
    if (message.member!.roles.cache.has('724818272922501190')
      || message.member!.roles.cache.has('724832462286356590'))
      await closesignup(message, client)
  }

  else if (command === "signup") {
    await signup(message, client, message.author.id)
  }

  else if (command === "removesignup") {
    await removesignup(message)
  }

  else if (command === "delay"){
    await delay(message, client, args)
  }

  else if (command === "pause"){
    let id = message.mentions.channels.first()!.id || message.channel.id
    let channel = <Discord.TextChannel>client.channels.cache.get(id)

    let match = await getMatch(id)

    if (match && channel.parent?.name.toLowerCase() === "matches") {

      if(match.pause){
        match.pause = true
        await updateActive(match)

        return message.reply("Unpaused match")
      }

      else{
        match.pause = true
        await updateActive(match)

        return message.reply("Paused match")
      }
    }

    else{
      return message.reply("No match found")
    }
  }

  else if (command === "deletesignup") {

    if (message.member!.roles.cache.has('724818272922501190')
      || message.member!.roles.cache.has('724832462286356590')) {
      message.reply(await deleteSignup())
    }

    else {
      message.reply("No.")
    }
  }

  else if (command === "vs") {
    let users: Array<string> = []

    for (let i = 0; i < args.length; i++) {
      let userid = await getUser(args[i])
      if (userid) {
        users.push(userid)
      }
    }
    await vs(<Discord.TextChannel>message.channel, client, await client.users.fetch(users[0]), await client.users.fetch(users[1]))
  }
});

client.login(process.env.TOKEN);