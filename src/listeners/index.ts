import { ApplicationCommandData, Client, CommandInteraction, Intents } from "discord.js";
import { connectToDB, getConfig } from "../db";
import { autoRunCommandLoop } from "../commands/jointcommands";
import { cmd, prefix } from "../index";
import { backgroundMatchLoop } from "../commands/match/background";
import { backgroundQualLoop } from "../commands/quals/background";
import { backgroundExhibitionLoop } from "../commands/exhibition/background";
import { backgroundReminderLoop } from "../commands/reminders";
import { interactionButtonsCommand } from "./interactions/buttons";

export const client: Client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES],
    allowedMentions: {parse: ['users', 'roles', 'everyone'], repliedUser: true},
    partials: ["MESSAGE", "CHANNEL", "USER", "REACTION"],
    restRequestTimeout: 90000,
});

client.once("ready", async () => {
    await connectToDB();

    // let obj:Signups = {
    //     _id:"signups",
    //     open:false,
    //     users:[]
    // }

    // let obj2:MatchList = {
    //     _id:"matchlist",
    //     url:"",
    //     users:[]
    // }

    // let obj3:QualList = {
    //     _id:"quallist",
    //     users:[]
    // }

    // let obj4:VerificationForm = {
    //     _id:"verificationform",
    //     user:[]
    // }

    // await insertExhibition()

    // await insertDoc('config', obj)
    // await insertDoc('config', obj2)
    // await insertDoc('config', obj3)
    // await insertDoc('config', obj4)

    setInterval(async function () {
        await autoRunCommandLoop(cmd, client)
    }, 30000);
    console.log("Started Atuo Command loop")

    setInterval(async function () {
        await backgroundMatchLoop(client);
        await backgroundQualLoop(client);
        await backgroundExhibitionLoop(client);
    }, 15000);
    console.log("Started Match loop\nStarted Qual loop\nStarted Duel loop")

    setInterval(async function () {
        await backgroundReminderLoop(client);
    }, 15000);
    console.log("Started Reminder loop")

    // setInterval(async function () {
    //     await autoRunCommandLoop(cmd, client)
    // }, 5000);

    console.log("\n");
    console.log(`Logged in as ${client.user?.tag}\nPrefix is ${prefix}`);
    console.log(`In ${client.guilds.cache.size} servers\nTotal users is ${client.users.cache.size}\n\n`);

    let data:ApplicationCommandData[] = [];

    for(let c of cmd){
        if(c.slashCommand) {
            if(c.slashCommandData) {
                if(data.length !== 0) data = data.concat(c.slashCommandData)
                //@ts-ignore
                else data.push(c.slashCommandData)
            }
        }
    }

    // console.log(data.flat(1))

    let setSlashCommands = await client.guilds.cache.get('719406444109103117')!.commands.set(data.flat(1));

    for(let s of setSlashCommands.values()) {
        let command = cmd.find(c => {
            if (typeof (c.aliases!) !== 'undefined' && c.aliases!.length > 0) {
                return (c.aliases?.includes(s.name.toLowerCase()!)
                    || c.name.toLowerCase() === s.name.toLowerCase()!);
            }
            else {
                return c.name.toLowerCase() === s.name.toLowerCase()!;
            }
        });

        if(!command) continue;
        if(!command.slashCommand) continue;
        if(!command.slashCommandData) continue;
        if(!command.slashCommandPermissions) continue;

        await s.permissions.add({permissions: command.slashCommandPermissions})
    }

    await client.user!.setActivity(`${((await getConfig()).status)}`);
    await client.user!.setStatus('dnd');
});

client.on("guildMemberAdd", async function (member) {
    try {
        await member.roles.add("730650583413030953");

        await member.user?.send("Please start verification with `!verify <reddit username>` in the verification channel.");
    } catch {
        console.log("Not Meme Royale Server");
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) await interactionButtonsCommand(interaction);
    if(interaction.isCommand()) await interactionSlashCommand(interaction, client);
});

async function interactionSlashCommand(interaction: CommandInteraction, client: Client) {
    // let command = cmd.find(c => {
    //     return c.name.toLowerCase() === interaction.commandName.toLowerCase();
    // });

    let command = cmd.find(c => {
        if (typeof (c.aliases!) !== 'undefined' && c.aliases!.length > 0) {
            return (c.aliases?.includes(interaction.commandName.toLowerCase()!)
                || c.name.toLowerCase() === interaction.commandName.toLowerCase());
        }
        else {
            return c.name.toLowerCase() === interaction.commandName.toLowerCase();
        }
    });

    if(command && command.slashCommand){
        try {
            await interaction.deferReply({ ephemeral: true });
            // @ts-ignore
            await command.slashCommandFunction(interaction, client)
        } catch(err) {
            console.log(err.stack)
        }
    }
}