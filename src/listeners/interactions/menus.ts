import { client } from "../index";

client.on('interactionCreate', interaction => {
    if (!interaction.isSelectMenu()) return;
    console.log(interaction);
});