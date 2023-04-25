const { CommandInteraction } = require("discord.js");
const thunder = require("../../../handlers/Client");
const { Queue } = require("distube");

module.exports = {
  name: "jump",
  description: `jump to a song in queue`,
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
      name: "index",
      description: `Song index in Queue`,
      type: "NUMBER",
      required: true,
    },
  ],
 
  run: async (client, interaction, args, queue) => {
    
    let index = interaction.options.getNumber("index");
    let song = queue.songs[index]
    if (index > queue.songs.length - 1 || index < 0) {
      return client.embed(
        interaction,
        `${
          client.config.emoji.ERROR
        } **The Position must be between \`0\` and \`${
          queue.songs.length - 1
        }\`!**`
      );
    } else {
      queue.jump(index).then((q) => {
        client.embed(
          interaction,
          `** ⏩ Jumped to The Song [\`${song.name}\`](${song.url}) **`
        );
      });
    }
  },
};
