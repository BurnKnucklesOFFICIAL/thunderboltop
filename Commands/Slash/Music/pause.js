const { CommandInteraction } = require("discord.js");
const thunder = require("../../../handlers/Client");
const { Queue } = require("distube");

module.exports = {
  name: "pause",
  description: `pause current song in queue`,
  userPermissions: ["CONNECT"],
  botPermissions: ["CONNECT"],
  category: "Music",
  cooldown: 5,
  type: "CHAT_INPUT",
  inVoiceChannel: true,
  inSameVoiceChannel: true,
  Player: true,
  djOnly: true,

 
  run: async (client, interaction, args, queue) => {
    
    if (!queue.paused) {
        queue.pause();
        client.embed(
          interaction,
          `⏸️ Queue Paused`
        );
      } else {
        client.embed(
          interaction,
          `${client.config.emoji.ERROR} Queue already Paused!`
        );
      }
  },
};
