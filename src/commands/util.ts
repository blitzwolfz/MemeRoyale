import { ApplicationCommandPermissionData, Collection, Message, MessageReaction, Snowflake, TextChannel, User } from "discord.js";

export const backwardsFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === '⬅' && !user.bot;
export const forwardsFilter = (reaction: MessageReaction, user:User) => reaction.emoji.name === '➡' && !user.bot;

export let emojis = [
    "1️⃣",
    "2️⃣",
    "3️⃣",
    "4️⃣",
    "5️⃣",
    "6️⃣",
    "♻️",
    "✅",
    "❌",
    "🌀"
];

export function dateBuilder() {
    let d = new Date();
    let months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    let days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];
    let day = days[d.getDay()];
    let date = d.getDate();
    console.log(d.getMonth());
    let month = months[d.getMonth()];
    let year = d.getFullYear();
    return `${day}, ${month} ${date} ${year}`;
}

export let timeconsts = {
    match: {
        votingtime: 7200, memetime: 2700
    },

    qual: {
        votingtime: 7200, memetime: 3600, results: 2
    }
};

export async function toHHMMSS(timestamp: number, howlong: number) {

    return new Date((howlong - (Math.floor(Date.now() / 1000) - timestamp)) * 1000).toISOString().substr(11, 8);
}

export async function sleep(s: number) {

    return new Promise((resolve) => {
        setTimeout(resolve, (s * 1000));
    });
}

export async function fetchManyMessages(channel: TextChannel, limit = 200) {
    if (!channel) {
        throw new Error(`Expected channel, got ${typeof channel}.`);
    }
    if (limit <= 100) {
        return await channel.messages.fetch({limit});
    }

    let collection: Collection<string, Message> = new Collection();
    let lastId = null;
    let options: {
        limit?: number; before?: Snowflake;
    } = {};
    let remaining = limit;

    while (remaining > 0) {
        options.limit = remaining > 100 ? 100 : remaining;
        remaining = remaining > 100 ? remaining - 100 : 0;

        if (lastId) {
            options.before = lastId;
        }

        let messages = await channel.messages.fetch(options);

        if (!messages.last()) {
            break;
        }

        collection = collection.concat(messages);
        lastId = messages.last()!.id;
        console.log(options.limit);
    }

    return collection;
}

export async function shuffle(a: any[]) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [
            a[i],
            a[j]
        ] = [
            a[j],
            a[i]
        ];
    }
    return a;
}

export const userDefaultSlashPermissions:ApplicationCommandPermissionData  = {
    id: '719941380503371897',
    permission:false,
    type:"ROLE"
}

export const refDefaultSlashPermissions:ApplicationCommandPermissionData  = {
    id: '724818272922501190',
    permission:true,
    type:"ROLE"
}

export const commissionerDefaultSlashPermissions:ApplicationCommandPermissionData  = {
    id: '719936221572235295',
    permission:true,
    type:"ROLE"
}

export const ownerDefaultSlashPermissions:ApplicationCommandPermissionData  = {
    id: '239516219445608449',
    permission:true,
    type:"USER"
}

export const defaultSlashPermissions = [
    ownerDefaultSlashPermissions,
    commissionerDefaultSlashPermissions,
    refDefaultSlashPermissions,
    userDefaultSlashPermissions
]