const { CommandInteraction } = require("discord.js");
const thunder = require("../../../handlers/Client");
const { Queue } = require("distube");

module.exports = {
  name: "reset",
  description: `reset bot to default settings`,
  userPermissions: ["MANAGE_GUILD"],
  botPermissions: ["EMBED_LINKS"],
  category: "Settings",
  cooldown: 5,
  type: "CHAT_INPUT",
  inVoiceChannel: true,
  inSameVoiceChannel: true,
  Player: false,
  djOnly: false,

  
  run: async (client, interaction, args, queue) => {
   
    await client.music.delete(interaction.guildId)
    client.embed(interaction,`${client.config.emoji.SUCCESS} Reseted Done !!`)
  },
};
