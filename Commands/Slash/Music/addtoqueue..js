const { ContextMenuInteraction } = require("discord.js");
const thunder = require("../../../handlers/Client");

module.exports = {
    name: "addtoqueue",
    category: "Music",
    type: "MESSAGE",

    
    run: async (client, interaction) => {
        
        let msg = await interaction.channel.messages.fetch(interaction.targetId)
        let song = msg.cleanContent || msg.embeds[0].description || msg.embeds[0].title
        let voiceChannel = interaction.member.voice.channel
        let botChannel = interaction.guild.me.voice.channel
        if (!msg || !song) {
            return client.embed(
                interaction,
                `${client.config.emoji.ERROR} No Song found`
            );
        } else if (!voiceChannel) {
            return client.embed(
                interaction,
                `${client.config.emoji.ERROR} You Need to Join Voice Channel`
            );
        }
        else if (botChannel &&
            !botChannel?.equals(voiceChannel)) {
            return client.embed(
                interaction,
                `${client.config.emoji.ERROR} You Need to Join ${botChannel} Voice Channel`
            );

        } else {
            client.distube.play(voiceChannel, song, {
                member: interaction.member,
                textChannel: interaction.channel
            })
            return client.embed(
                interaction,
                `<a:6362idle:1049950746793222174> Searching \`${song}\` in Universe`
            );
        }
    },
};