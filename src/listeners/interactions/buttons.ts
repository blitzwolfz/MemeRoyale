import type { ButtonInteraction } from "discord.js";

export async function interactionButtonsCommand(interaction: ButtonInteraction) {
    // console.log(interaction);
    await interaction.reply({
        ephemeral:false,
        content:`Button ID: ${interaction.customId} User: <@${interaction.user.id}> Channel: <#${(await interaction.channel!.fetch()).id}>`
    })
}