const { CommandInteraction } = require("discord.js");
const thunder = require("../../../handlers/Client");
const { Queue } = require("distube");

module.exports = {
  name: "stop",
  description: `destroy current queue`,
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
    queue.stop()
    client.embed(
      interaction,
      `${client.config.emoji.SUCCESS} Queue Destroyed !`
    );
  },
};
