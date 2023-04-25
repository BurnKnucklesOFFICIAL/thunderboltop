const { CommandInteraction } = require("discord.js");
const thunder = require("../../../handlers/Client");
const { Queue } = require("distube");

module.exports = {
  name: "playprevious",
  description: `play previous song of queue`,
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
    if (!queue.previousSongs.length) {
      return client.embed(
        interaction,
        `${client.config.emoji.ERROR} Previous Song Not Found!`
      );
    } else {
      await queue.previous().then((m) => {
        client.embed(
          interaction,
          `⏮️ Playing Previous Track!`
        );
      });
    }
  },
};
