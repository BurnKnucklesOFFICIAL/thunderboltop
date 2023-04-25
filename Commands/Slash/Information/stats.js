const { CommandInteraction , MessageEmbed , version} = require("discord.js");
const thunder = require("../../../handlers/Client");
const { Queue } = require("distube");
let os = require("os");
let cpuStat = require("cpu-stat");

module.exports = {
  name: "stats",
  description: `see stats of bot`,
  permissions: {
        channel: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
        member: ["814164273747853356"],
    },
  category: "Information",
  cooldown: 5,
  type: "CHAT_INPUT",
  inVoiceChannel: false,
  inSameVoiceChannel: false,
  Player: false,
  djOnly: false,

  /**
   *
   * @param {JUGNU} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   * @param {Queue} queue
   */
  run: async (client, interaction, args, queue) => {
    // Code
    cpuStat.usagePercent(function (err, percent, seconds) {
        interaction.editReply({
          embeds: [
            new MessageEmbed()
              .setColor(client.config.embed.color)
              .setAuthor({
                name: client.user.username,
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
              })
              .setTitle("__**Stats:**__")
              .addField(
                "Uptime ",
                `<t:${Math.floor(Date.now() / 1000 - client.uptime / 1000)}:R>`
              )
              .addField("Servers", `\`${client.guilds.cache.size}\``, true)
              .addField("🏓 Ping", `\`${client.ws.ping}ms\``, true)
              .setFooter(client.getFooter(interaction.user)),
          ],
        });
      });
  },
};
