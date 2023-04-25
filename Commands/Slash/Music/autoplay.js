const { CommandInteraction } = require("discord.js");
const thunder = require("../../../handlers/Client");
const { Queue } = require("distube");

module.exports = {
  name: "autoplay",
  description: `toggle autoplay on/off`,
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
  
    let autoplay = queue.toggleAutoplay();

    client.embed(
      interaction,
      `${client.config.emoji.SUCCESS} AutoPlay: \`${autoplay ? "On" : "Off"}\``
    );
  },
};
