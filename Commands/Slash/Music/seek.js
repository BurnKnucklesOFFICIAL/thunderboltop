const { CommandInteraction } = require("discord.js");
const thunder = require("../../../handlers/Client");
const { Queue } = require("distube");

module.exports = {
  name: "seek",
  description: `seek then current song`,
  userPermissions: ["CONNECT"],
  botPermissions: ["CONNECT"],
  category: "Music",
  cooldown: 5,
  type: "CHAT_INPUT",
  inVoiceChannel: true,
  inSameVoiceChannel: true,
  Player: true,
  djOnly: true,
  options: [
    {
      name: "amount",
      description: `Give seek amount in number`,
      type: "NUMBER",
      required: true,
    },
  ],


  run: async (client, interaction, args, queue) => {
    
    let seek = interaction.options.getNumber("amount")
    await queue.seek(seek);
    client.embed(
      interaction,
      `🥏 Seeked \`${seek}\` Seconds !!`
    );
  },
};
