# MemeRoyale Bot

[![Maintenance](https://img.shields.io/maintenance/yes/2020?style=for-the-badge)](https://github.com/blitzwolfz/MemeRoyale/graphs/commit-activity) [![GitHub issues](https://img.shields.io/github/issues/blitzwolfz/MM?style=for-the-badge)](https://github.com/blitzwolfz/MemeRoyale/issues/)

  
  

Hi! If you are reading this, then you found my a discord bot that I am working on. It's called Meme Mania.


# Table of Contents
- [General](#general)
- [Files](#files)
  * [Firecard, .env file, and all non code files](#firecard--env-file--and-all-non-code-files)
  * [JSON Files](#json-files)
  * [Rename a file](#rename-a-file)
  * [Delete a file](#delete-a-file)
- [Synchronization](#synchronization)
- [Installation](#installation) <--- This is what you might be looking for
  * [Locally](#locally) 
  * [Cloud](#Cloud) 

  
# General
The bot is as of now actively maintained and well be done till all edge cases are worked out. Once we reach this point and no new features are being worked on, the bot will not see active maintenance on the codebase but more so on the server side. Of course you can always suggest new features and have your own implementation of how you think these features can be made. In terms of technology that's used, please look at the list below:

  

Requirements:

  

- Typescript @3.9.5

- NodeJS @ 13.6

- NodeJS MongoDB Driver @3.5.9

- Discord.JS v12.2

- Node Canvas @ 2.6

  

A more detailed version of this can be found in the package.json file. To get a list of all the dependencies and any sub-dependencies they may have please look at package-lock.json.

  
  

# Files

  

## Firecard, .env file, and all non code files

  

As of now, I don't have a public env example file but however, this is where all the sensitive data is being stored. This includes the [discord bot token](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token) and [MongoDB url](https://docs.mongodb.com/guides/server/drivers/) needed to access the server. An .env file is not required to make this bot work. .env file is secure for me as I can contain my production info on my Laptop and dist info on a server, as such I purposefully did not include the dependencies needed to run this bot with .env in the requirements tab. [This is a good read on what to do and not to do.](https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/other-guides/env-files.md)

  

- [ ] example env available

The firecard is used to show a Player vs Player card before their regular matches. You can use any other image just note that there are image requirements that need to be followed. I can provide the image requirements but they are also in the code. You can do trial and error if you use.

  

## JSON Files

There are three very important JSON Files. Of which you need to have 2 of them, the [package.json](https://github.com/blitzwolfz/MemeRoyale/blob/master/package.json) file and [tsconfig.json](https://github.com/blitzwolfz/MemeRoyale/blob/master/tsconfig.json) file. The former provides the program with the information on all the dependencies used, and the latter is needed to have the compiled typescript code out be structured needed to run said bot. The package-lock.json file is auto generated I believe, but in any case it is provided in the [repo](https://github.com/blitzwolfz/MemeRoyale/blob/master/package-lock.json)

  

## Rename a file

  

You can rename files as you see fit, just note that you will be responsible for changing all the equivalent references of the file's name you just changed.

  

## Delete a file

  

Don't delete any files unless I do it myself. Of course you are allowed to modify this program as you see fit just note, that if you do, I am not responsible for anything that happens.

  

# Synchronization

If you wish to run this bot with any features I make, then you should on the regular push all changes from [this branch](https://github.com/blitzwolfz/MemeRoyale/tree/master) to your code. This branch will hold all the stable features of the bot. Of course if you want to try out new branches and their code, you are free to do so at your own risk. I will not provide any installation instructions on these branches unless stated otherwise.

# Installation

For both local and hosted steps, you will need a copy of the bot. Do this by going [to this link](https://github.com/blitzwolfz/MemeRoyale/tree/master) and downloading a copy.

## Locally
You can run this bot in two ways, locally or on the web. To run this bot locally you have to have the NodeJS Runtime on your PC, and have some basic knowledge on using the command prompt/terminal. If you are using the bot as is then follow these instructions, if you are modifying the bot, then follow these instructions but I can't promise anything from working properly.

First make sure you downloaded either the latest version of [Node or the version](https://nodejs.org/en/download/) or the one specified by this document. As long as the version is equal to or greater than the one I stated, you shall be fine.

To check if you have Node running, open a command line or command prompt and run 
` 
$ node dist/index.js
`
The out should the version number that is either equal to or greater than this.
![](https://i.imgur.com/F7opU7f.png)

Next you are going to need a MongoDB server. Now I'll leave this up to you on how you acquire this as there are many ways to make one, however some links down below to help you.

 - [They give 500mb for free, more than enough to run this tournament](https://www.mongodb.com)
 - [How to make a local database](https://www.freecodecamp.org/news/learn-mongodb-a4ce205e7739/)
 - AWS, Google Cloud, I believe also provide MongoDB servers at a price

After this step, you are going to need to create a .env file. The .env file should contain these variables, which are important for running the bot.
Should look this
![](https://i.imgur.com/Ku33BVH.png)

 - Token is your discord token
 - dbname, is the name of your database. Now this can be anything you want as MongoDB will automatically create the db if it doesn't exist
 - dburl is the url connection for your db. 
 - Prefix is for the bot prefix, and status is for the bot status.
 - Challonge is your challonge API key. Now you don't need this, but it some features of the bot will break without it.

Now once you have all these files set up, it's a good idea to recompile the TS code but you don't have to as I provide a compiled folder of the code.
Now all you have to do to run the bot is open a terminal in the folder. For Windows users, right-click and it should say open command prompt. 

First command you need to run is `$ npm i`. What this command will do is install all the libraries needed to run this bot. Now this step may take some time, so be patient.

Once the previous command is done, in the terminal type in this command `
$ node dist/index.js
`

And you are done! The bot should be working perfectly, and will run as so long as you don't do Crtl+C in the terminal or close the terminal.


## Cloud
To host the bot on a server, you can use services such as Heroku. As there many forms of these services, find the best one for you and use their installation guide. The steps that are is the dB steps, which you will need regardless of how you host the bot.