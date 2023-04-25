const { CommandInteraction } = require("discord.js");
const thunder = require("../../../handlers/Client");
const { Queue } = require("distube");
const { swap_pages } = require("../../../handlers/functions");

module.exports = {
  name: "queue",
  description: `see current queue with pagination`,
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
    if (!queue.songs.length) {
      return client.embed(interaction, `${client.config.emoji.ERROR} Nothing in Queue`);
    } else {
      let embeds = await client.getQueueEmbeds(queue);
      await swap_pages(interaction, embeds);
    }
  },
};
