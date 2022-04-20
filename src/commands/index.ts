import { Client, CommandInteraction, Message, MessageEmbed, MessageReaction, User } from "discord.js";
import { getAllProfiles, getConfig, getDoc, insertDoc, updateConfig, updateDoc } from "../db";
import { cmd } from "../index";
import type { CockProfile, Command } from "../types";
import { transition } from "./convertMMtoMR";
import * as c from "./exhibition/index";
import { help, mrStats } from "./help";
import * as imageCommands from "./imagecommands/index";
import * as e from "./jointcommands";
import * as level from "./levelsystem";
import * as a from "./match";
import * as q from "./quals";
import { delay } from "./reminders";
import * as submit from "./submit";
import * as b from "./tournament/index";
import * as d from "./user";
import { backwardsFilter, cockRatingImage, defaultSlashPermissions, forwardsFilter } from "./util";
import * as f from "./verification";

//@ts-ignore
export const example: Command = {
	name: "EXAMPLE",
	description: "EXAMPLE",
	group: "EXAMPLE",
	owner: false,
	admins: false,
	mods: false,
	slashCommand: false,
	async execute(message: Message, client: Client, args: string[]) {
	
	},
	async slashCommandFunction(interaction: CommandInteraction, client: Client) {
		if (!interaction.isCommand()) return;
	},
	slashCommandData: [
		{
			name: "EXAMPLE",
			description: "An example!",
		},
	],
	slashCommandPermissions: defaultSlashPermissions,
};

export const ping: Command = {
	name: "ping",
	aliases: ["pong"],
	description: "You can ping, lmao",
	group: "ping",
	owner: false,
	admins: false,
	mods: false,
	slashCommand: true,
	serverOnlyCommand: false,
	async execute(message: Message, client: Client, args: string[]) {
		message.channel.send({
			embeds: [
				new MessageEmbed()
					.setAuthor(`Pinging`),
			],
		}).then(async m => {
			// The math thingy to calculate the user's ping
			let ping = m.createdTimestamp - message.createdTimestamp;
			
			// Basic embed
			
			let embed = new MessageEmbed()
				.setTitle(`Your ping is ${ping} ms`)
				// .setImage("https://cdn.discordapp.com/attachments/722306381893599242/855600330405838849/catping.gif")
				.setColor(m.embeds![0]!.hexColor!);
			// Then It Edits the message with the ping variable embed that you created
			await m.edit({embeds: [embed]}).then(async m => {
				let embed = new MessageEmbed()
					.setTitle(`Your ping is ${ping} ms`)
					.setImage(
						"https://cdn.discordapp.com/attachments/722306381893599242/855600330405838849/catping.gif")
					.setColor(m.embeds![0]!.hexColor!);
				await m.edit({embeds: [embed]});
			});
		});
	},
	async slashCommandFunction(interaction: CommandInteraction, client: Client) {
		if (!interaction.isCommand()) return;
		await interaction.editReply({
			content: "Pong",
		});
	},
	slashCommandData: [
		{
			name: "ping",
			description: "Replies with Pong!",
		},
		{
			name: "pong",
			description: "Replies with Ping!",
		},
	],
	slashCommandPermissions: defaultSlashPermissions,
};

export const snowflakeToTimestamp: Command = {
	name: "timestamp",
	aliases: ["ts"],
	description: "lmao",
	group: "help",
	owner: true,
	admins: false,
	mods: false,
	slashCommand: false,
	serverOnlyCommand: false,
	async execute(message: Message, client: Client, args: string[]) {
		message.channel.send({
			embeds: [
				new MessageEmbed()
					.setAuthor(`Pinging`),
			],
		}).then(async m => {
			// The math thingy to calculate the user's ping
			let ping = m.createdTimestamp - message.createdTimestamp;
			
			// Basic embed
			
			let embed = new MessageEmbed()
				.setTitle(`Your ping is ${ping} ms`)
				// .setImage("https://cdn.discordapp.com/attachments/722306381893599242/855600330405838849/catping.gif")
				.setColor(m.embeds![0]!.hexColor!);
			// Then It Edits the message with the ping variable embed that you created
			await m.edit({embeds: [embed]}).then(async m => {
				let embed = new MessageEmbed()
					.setTitle(`Your ping is ${ping} ms`)
					.setImage(
						"https://cdn.discordapp.com/attachments/722306381893599242/855600330405838849/catping.gif")
					.setColor(m.embeds![0]!.hexColor!);
				await m.edit({embeds: [embed]});
			});
		});
	}
};

export const disableCommands: Command = {
	name: "disable",
	description: "owner",
	group: "owner",
	owner: true,
	admins: false,
	mods: false,
	slashCommand: false,
	serverOnlyCommand: true,
	async execute(message: Message, client: Client, args: string[]) {
		let config = await getConfig();
		
		if (args[0] === "all") {
			config.disabledcommands = cmd.map(x => x.name);
			config.disabledcommands.splice(config.disabledcommands.indexOf("enable"), 1);
			config.disabledcommands.splice(config.disabledcommands.indexOf("disable"), 1);
			await updateConfig(config);
			return message.reply(`${cmd.map(x => x.name).length - 2} commands disabled.`);
		}
		
		else {
			if (args[0] === undefined) return message.reply(
				"Please pass the name of the command you want to enable. If you wish to disable all of them, do `!enable all`.");
			config.disabledcommands.splice(config.disabledcommands.indexOf("enable"), 1);
			config.disabledcommands.splice(config.disabledcommands.indexOf("disable"), 1);
			config.disabledcommands.push(args[0]);
			await updateConfig(config);
			return message.reply(`Disabled ${args[0]}.`);
		}
	},
};

export const enableCommands: Command = {
	name: "enable",
	description: "owner",
	group: "owner",
	owner: true,
	admins: false,
	mods: false,
	slashCommand: false,
	serverOnlyCommand: true,
	async execute(message: Message, client: Client, args: string[]) {
		let config = await getConfig();
		
		if (args[0] === "all") {
			config.disabledcommands = [];
			await updateConfig(config);
			return message.reply(`${cmd.map(x => x.name).length - 2} commands enabled.`);
		}
		
		else {
			if (args[0] === undefined) return message.reply(
				"Please pass the name of the command you want to enable. If you wish to enable all of them, do `!enable all`.");
			config.disabledcommands.splice(config.disabledcommands.indexOf(args[0]), 1);
			console.log(config);
			await updateConfig(config);
			return message.reply(`Enabled ${args[0]}.`);
		}
	},
};

export const deleteSlashCommands: Command = {
	name: "delete",
	description: "owner",
	group: "owner",
	owner: true,
	admins: false,
	mods: false,
	slashCommand: false,
	serverOnlyCommand: true,
	async execute(message: Message, client: Client, args: string[]) {
		let guild = await client.guilds.cache.get("719406444109103117")!;
		
		if (args[0] === "all") {
			for (let c of guild.commands.cache.values()) {
				c.delete();
			}
			
			return message.reply("Deleted all commands");
		}
		
		else {
			if (args[0] === undefined) return message.reply("Please pass the name of the slash command you want to" +
				" delete. If you wish to delete all of them, do `!delete all`.");
			
			let c = [...guild.commands.cache.values()].find(x => x.name === args[0].toLowerCase());
			if (!c) return message.reply("Command does not exist");
			c.delete();
			
			return message.reply(`Deleted ${c.name}.`);
		}
	},
};

export const editConfig: Command = {
	name: "edit",
	description: "owner",
	group: "owner",
	owner: true,
	admins: false,
	mods: false,
	slashCommand: false,
	serverOnlyCommand: true,
	async execute(message: Message, client: Client, args: string[]) {
		let config = await getConfig();
		
		if (args.length === 0) {
			let copy = config;
			
			if (copy.disabledcommands.length > 0) {
				copy.disabledcommands = [];
			}
			
			let s = JSON.stringify(copy, null, 4);
			console.log(s);
			let arr = s.match(/"\w+":/g)!;
			arr.splice(0, 2);
			console.log(arr.join(", ").replace(/:/gi, "").replace(/"/gi, ""));
			await message.channel.send(`The edit options are ${arr.join(", ")
																  .replace(/:/gi, "")
																  .replace(/"/gi, "")
																  .replace("servers", "disableserver, enableserver")}`);
			await message.channel.send(
				"For disabling and enabling commands, there are separate commands called `!disable` and `!enable`.");
		}
		
		else {
			let symbol: "colour" | "status" | "isfinale" | "disableserver" | "enableserver" = "isfinale";
			
			switch (args[0]?.[0]) {
				case "c":
					symbol = "colour";
					break;
				case "s":
					symbol = "status";
					break;
				case "d":
					symbol = "disableserver";
					break;
				case "e":
					symbol = "enableserver";
					break;
				default:
					symbol = "isfinale";
			}
			
			switch (symbol) {
				case "colour":
					if (typeof args[1] !== "string") {
						return message.reply("Colour requires the hex code as a string");
					}
					
					config.colour = args[1];
					await updateConfig(config);
					break;
				
				case "status":
					if (typeof args.slice(1).join(" ") !== "string") {
						return message.reply("Status requires a string");
					}
					
					config.status = args.slice(1).join(" ");
					await client.user!.setActivity(`${args.slice(1).join(" ")}`);
					await updateConfig(config);
					break;
				
				case "disableserver":
					if (args[1]) {
						config.servers.push(args[1]);
					}
					
					else {
						config.servers.push(message.guild!.id!);
					}
					
					await message.reply(`Server is now blocked.`);
					await updateConfig(config);
					break;
				
				case "enableserver":
					if (args[1]) {
						config.servers.push(args[1]);
					}
					
					else {
						config.servers.push(message.guild!.id!);
					}
					
					await message.reply(`Server is unblocked.`);
					await updateConfig(config);
					break;
				
				case "isfinale":
					if (!args[1]) return message.reply("isfinale must either be true or false");
					await message.channel.send("No type check. Click emote to continue").then(async msg => {
						
						await msg.react(`✔️`);
						let emoteFilter = (reaction: MessageReaction, user: User) => reaction.emoji.name === "✔️" && !user.bot;
						const approve = msg.createReactionCollector({filter: emoteFilter, time: 50000});
						
						approve.on("collect", async () => {
							if (args[1] === "true") {
								config.isfinale = true;
							}
							
							if (args[1] === "false") {
								config.isfinale = false;
							}
							
							await updateConfig(config);
							config.isfinale ? await message.reply("All matches are now evaluated as a" +
								" finale match.") : await message.reply("All matches are now evaluated as a non" +
								" finale" +
								" match.");
						});
						
					});
					break;
				
				default:
					await message.channel.send("Not available yet");
					break;
			}
		}
	},
};

export const cockRate: Command = {
	name: "cockrate",
	description: "owner",
	aliases: ["cr"],
	group: "level-system",
	owner: false,
	admins: false,
	mods: true,
	slashCommand: false,
	serverOnlyCommand: true,
	async execute(message: Message, client: Client, args: string[]) {
		let max = 100;
		let min = 0;
		let percent = Math.floor(Math.random() * (max - min + 1) + min);
		
		
		let id = (message.mentions?.users?.first()?.id || message.author.id);
		
		let doc: CockProfile = await getDoc("users", `${id}-cockrating`);
		
		
		if (!doc) {
			if (id === "239516219445608449") percent = 85;
			doc = {
				_id: `${id}-cockrating`,
				value: percent,
				timestamp: (Math.floor(Math.floor(Date.now() / 1000) / 60) * 60),
			};
			
			await insertDoc("users", doc);
		}
		
		
		if ((Math.floor(Math.floor(Date.now() / 1000) / 60) * 60) - doc.timestamp <= 259200) {
			let image = await cockRatingImage(doc.value / 100);
			return message.reply({
				content: `${id === message.author.id ? "H"
					: `<@${id}> it h`}as not been 3 days. Request a new rating on <t:${doc.timestamp + 259200}>`,
				files: [image],
			});
		}
		
		doc.value = percent;
		doc.timestamp = (Math.floor(Math.floor(Date.now() / 1000) / 60) * 60);
		
		await updateDoc("users", `${id}-cockrating`, doc);
		let image = await cockRatingImage(doc.value / 100);
		
		return await message.channel.send({
			content: `${id === message.author.id ? "R"
				: `<@${id}> r`}equest a new rating on <t:${doc.timestamp + 259200}>`,
			files: [image],
		});
	},
};

export const cockRateLB: Command = {
	name: "crlb",
	description: "View cock rating leaderboard",
	group: "level-system",
	owner: false,
	admins: false,
	mods: false,
	slashCommand: false,
	serverOnlyCommand: true,
	async execute(message: Message, client: Client, args: string[]) {
		let profiles: CockProfile[] = (await getAllProfiles());
		profiles = profiles.filter(x => x._id.includes("-cockrating"));
		//@ts-ignore
		let page: number = typeof args[1] == "undefined" ? isNaN(parseInt(args[0])) ? 1 : parseInt(args[0]) : args[1];
		
		const m = <Message>(await message.channel.send({
			embeds: [
				await makeProfileEmbed(page!, client, profiles, message.author.id),
			],
		}));
		
		await m.react("⬅");
		await m.react("➡");
		
		
		const backwards = m.createReactionCollector({filter: backwardsFilter, time: 100000});
		const forwards = m.createReactionCollector({filter: forwardsFilter, time: 100000});
		
		backwards.on("collect", async () => {
			m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
			m.edit({
				embeds: [
					await makeProfileEmbed(--page, client, profiles, message.author.id),
				],
			});
		});
		forwards.on("collect", async () => {
			m.reactions.cache.forEach(reaction => reaction.users.remove(message.author.id));
			m.edit({
				embeds: [
					await makeProfileEmbed(++page, client, profiles, message.author.id),
				],
			});
		});
		
	},
};

async function makeProfileEmbed(page: number = 1, client: Client, profiles: CockProfile[], userid: string) {
	
	page = page < 1 ? 1 : page;
	
	if (page > profiles.length) {
		page = 0;
	}
	
	const fields = [];
	let index = (0 + page - 1) * 10;
	
	profiles.sort(function (a, b) {
		return b.value - a.value;
	});
	
	for (let i = index; i < index + 10; i++) {
		let obj = profiles[i];
		try {
			fields.push({
				name: `${i + 1}) ${((await client.users.fetch(profiles[i]._id.split("-")![0])).username)}`,
				value: `${obj.value}`,
			});
		} catch {
		
		}
		
	}
	
	return new MessageEmbed()
		.setTitle(`Cock Rate Leaderboard. You are on page ${page! || 1} of ${Math.floor(profiles.length / 10) + 1}`)
		.setDescription(
			`Your rank is: ${profiles.findIndex(item => item._id == userid) + 1}. `
			+ `There ${profiles.length > 1 ? `are ${profiles.length} profiles that have`
			: `is ${profiles.length} profile that has`} been sorted.`,
		)
		.setFields(
			fields,
		)
		.setColor(`#${(await getConfig()).colour}`)
		.setTimestamp(new Date());
}

export default [
	editConfig,
	cockRate,
	cockRateLB,
	mrStats,
	deleteSlashCommands,
	transition,
	enableCommands,
	disableCommands,
	delay,
	ping,
	help,
]
	.concat(a.default)
	.concat(q.default)
	.concat(b.default)
	.concat(c.default)
	.concat(d.default)
	.concat(e.default)
	.concat(f.default)
	.concat(imageCommands.default)
	.concat(level.default)
	.concat(submit.default)
	.sort(function keyOrder(k1, k2) {
		if (k1.name < k2.name) return -1; else if (k1.name > k2.name) return 1; else return 0;
	});