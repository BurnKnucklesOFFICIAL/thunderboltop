"use strict";
const { MessageEmbed } = require("discord.js");
const thunder = require("./Client");
const { Song, SearchResult } = require("distube");
let voiceMap = new Map();


module.exports = async (client) => {
  client.distube.setMaxListeners(0);

  async function autoresume() {
    if (!client.autoresume) return;
    let guildIds = await client.autoresume.keys;
    if (!guildIds || !guildIds.length) return;
    for (const gId of guildIds) {
      let guild = client.guilds.cache.get(gId);
      if (!guild) await client.autoresume.delete(gId);
      let data = await client.autoresume.get(guild.id);
      if (!data) return;
      let voiceChannel = guild.channels.cache.get(data.voiceChannel);
      if (!voiceChannel && data.voiceChannel)
        voiceChannel =
          (await guild.channels.fetch(data.voiceChannel).catch(() => {})) ||
          false;
      if (
        !voiceChannel ||
        !voiceChannel.members ||
        voiceChannel.members.filter(
          (m) => !m.user.bot && !m.voice.deaf && !m.voice.selfDeaf
        ).size < 1
      ) {
        client.autoresume.delete(gId);
      }
      let textChannel = guild.channels.cache.get(data.textChannel);
      if (!textChannel)
        textChannel =
          (await guild.channels.fetch(data.textChannel).catch(() => {})) ||
          false;
      if (!textChannel) await client.autoresume.delete(gId);
      let tracks = data.songs;
      if (!tracks || !tracks[0]) continue;
      const makeTrack = async (track) => {
        return new Song(
          new SearchResult({
            duration: track.duration,
            formattedDuration: track.formattedDuration,
            id: track.id,
            name: track.name,
            thumbnail: track.thumbnail,
            type: "video",
            uploader: track.uploader,
            url: track.url,
          }),
          guild.members.cache.get(track.memberId) || guild.me,
          track.source
        );
      };

      await client.distube.play(voiceChannel, tracks[0].url, {
        member: guild.members.cache.get(tracks[0].memberId) || guild.me,
        textChannel: textChannel,
      });
      let newQueue = client.distube.getQueue(guild.id);
      for (const track of tracks.slice(1)) {
        newQueue.songs.push(await makeTrack(track));
      }
      await newQueue.setVolume(data.volume);
      if (data.repeatMode && data.repeatMode !== 0) {
        newQueue.setRepeatMode(data.repeatMode);
      }
      if (!data.playing) {
        newQueue.pause();
      }
      await newQueue.seek(data.currentTime);
      if (!data.playing) {
        newQueue.pause();
      }
      await client.autoresume.delete(newQueue.textChannel.guildId);
    }
  }

  client.on("ready", async () => {
    setTimeout(async () => await autoresume(), 2 * client.ws.ping);
  });

  // distube events
  try {
    // events
    client.distube.on("playSong", async (queue, song) => {
      let data = await client.music.get(`${queue.textChannel.guildId}.music`);
      if (!data) return;
      await client.updatequeue(queue);
      await client.updateplayer(queue);
      if (data.channel === queue.textChannel.id) return;
      queue.textChannel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor(client.config.embed.color)
              .setDescription(`** [\`${song.name}\`](${song.url}) **`)
              .addFields([
                {
                  name: `Duration`,
                  value: `\`${song.formattedDuration}\``,
                  inline: true,
                },
                {
                  name: `Artist`,
                  value: `\`${song.uploader.name}\``,
                  inline: true,
                },
                {
                  name: `Requested By`,
                  value: `\`${song.user.tag}\``,
                  inline: true,
                },
                
              ])
              .setFooter(client.getFooter(song.user)),
          ],
          components: [client.buttons(false)],
        })
        .then((msg) => {
          client.temp.set(queue.textChannel.guildId, msg.id);
        });
    });

    client.distube.on("addSong", async (queue, song) => {
      let data = await client.music.get(`${queue.textChannel.guildId}.music`);
      if (!data) return;
      await client.updatequeue(queue);
      if (data.channel === queue.textChannel.id) return;

      queue.textChannel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor(client.config.embed.color)
              .setAuthor({
                name: `Added to Playlist.`,
                iconURL: song.user.displayAvatarURL({ dynamic: true }),
                url: song.url,
              })
              .setThumbnail(song.thumbnail)
              .setDescription(`[\`${song.name}\`](${song.url})`)
              .addFields([
                {
                  name: `Duration`,
                  value: `\`${song.formattedDuration}\``,
                  inline: true,
                },
                {
                  name: `Artist`,
                  value: `\`${song.uploader.name}\``,
                  inline: true,
                },
                {
                  name: `Requested By`,
                  value: `\`${song.user.tag}\``,
                  inline: true,
                },
              ])
              .setFooter(client.getFooter(song.user)),
          ],
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch((e) => null);
          }, 5000);
        });
    });

    client.distube.on("addList", async (queue, playlist) => {
      let data = await client.music.get(`${queue.textChannel.guildId}.music`);
      if (!data) return;
      await client.updatequeue(queue);
      if (data.channel === queue.textChannel.id) return;
      queue.textChannel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor(client.config.embed.color)
              .setAuthor({
                name: `Playlist Added to Queue`,
                iconURL: playlist.user.displayAvatarURL({ dynamic: true }),
                url: playlist.url,
              })
              .setThumbnail(playlist.thumbnail)
              .setDescription(`** [\`${playlist.name}\`](${playlist.url}) **`)
              .addFields([
                {
                  name: `Requested By`,
                  value: `\`${playlist.user.tag}\``,
                  inline: true,
                },
                {
                  name: `Songs`,
                  value: `\`${playlist.songs.length}\``,
                  inline: true,
                },
                {
                  name: `Duration`,
                  value: `\`${playlist.formattedDuration}\``,
                  inline: true,
                },
              ])
              .setFooter(client.getFooter(playlist.user)),
          ],
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch((e) => null);
          }, 5000);
        });
    });

    client.distube.on("disconnect", async (queue) => {
      await client.autoresume.delete(queue.textChannel.guildId);
      await client.editPlayerMessage(queue.textChannel);
      await client.updateembed(client, queue.textChannel.guild);
      let db = await client.music?.get(`${queue.textChannel.guildId}.vc`);
      if (db && db?.enable) {
        await client.joinVoiceChannel(queue.textChannel.guild);
      }
      let data = await client.music.get(`${queue.textChannel.guildId}.music`);
      if (!data) return;
      if (data.channel === queue.textChannel.id) return;
      queue.textChannel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor(client.config.embed.color)
              .setDescription(
                `${client.config.emoji.ERROR} Successfully Disconnected From <#${voiceMap.get(
                  queue.textChannel.guildId
                )}> Voice Channel`
              ),
          ],
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch((e) => null);
          }, 5000);
        });
    });

    client.distube.on("error", async (channel, error) => {
      channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor(client.config.embed.color)
              .setTitle(`Uint8Array Error_Handling, Reported to staff team...`)
              .setDescription(String(error).substring(0, 3000)),
          ],
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch((e) => null);
          }, 5000);
        });
    });

    client.distube.on("noRelated", async (queue) => {
      queue.textChannel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor(client.config.embed.color)
              .setTitle(`No related song found in my database. \`${queue.songs[0].name}\``),
          ],
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch((e) => null);
          }, 5000);
        });
    });

    client.distube.on("finishSong", async (queue, song) => {
      await client.editPlayerMessage(queue.textChannel);
    });

    client.distube.on("finish", async (queue) => {
      await client.updateembed(client, queue.textChannel.guild);
      await client.editPlayerMessage(queue.textChannel);
      queue.textChannel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor(client.config.embed.color)
              .setDescription(` Playlist is now ended. Add more music in playlist to play`),
          ],
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch((e) => null);
          }, 5000);
        });
    });

    client.distube.on("initQueue", async (queue) => {
      voiceMap.set(queue.textChannel.guildId, queue.voiceChannel.id);

      queue.volume = 60;
      queue.setFilter("");

      /**
       * Autoresume Code
       */
      setInterval(async () => {
        let newQueue = client.distube.getQueue(queue.textChannel.guildId);
        let autoresume = await client.music.get(
          `${queue.textChannel.guildId}.autoresume`
        );
        if (newQueue && autoresume) {
          const buildTrack = (track) => {
            return {
              memberId: track.member.id,
              source: track.source,
              duration: track.duration,
              formattedDuration: track.formattedDuration,
              id: track.id,
              isLive: track.isLive,
              name: track.name,
              thumbnail: track.thumbnail,
              type: "video",
              uploader: track.uploader,
              url: track.url,
              views: track.views,
            };
          };
          await client.autoresume.ensure(queue.textChannel.guildId, {
            guild: newQueue.textChannel.guildId,
            voiceChannel: newQueue.voiceChannel
              ? newQueue.voiceChannel.id
              : null,
            textChannel: newQueue.textChannel ? newQueue.textChannel.id : null,
            songs:
              newQueue.songs && newQueue.songs.length > 0
                ? [...newQueue.songs].map((track) => buildTrack(track))
                : null,
            volume: newQueue.volume,
            repeatMode: newQueue.repeatMode,
            playing: newQueue.playing,
            currentTime: newQueue.currentTime,
            autoplay: newQueue.autoplay,
          });
          let data = await client.autoresume.get(newQueue.textChannel.guildId);
          if (!data) return;
          if (data?.guild != newQueue.textChannel.guildId) {
            await client.autoresume.set(
              `${newQueue.textChannel.guildId}.guild`,
              newQueue.textChannel.guildId
            );
          }
          if (
            data?.voiceChannel != newQueue.voiceChannel
              ? newQueue.voiceChannel.id
              : null
          ) {
            await client.autoresume.set(
              `${newQueue.textChannel.guildId}.voiceChannel`,
              newQueue.voiceChannel ? newQueue.voiceChannel.id : null
            );
          }
          if (
            data?.textChannel != newQueue.textChannel
              ? newQueue.textChannel.id
              : null
          ) {
            await client.autoresume.set(
              `${newQueue.textChannel.guildId}.textChannel`,
              newQueue.textChannel ? newQueue.textChannel.id : null
            );
          }

          if (data?.volume != newQueue.volume) {
            await client.autoresume.set(
              `${newQueue.textChannel.guildId}.volume`,
              newQueue.volume
            );
          }
          if (data?.repeatMode != newQueue.repeatMode) {
            await client.autoresume.set(
              `${newQueue.textChannel.guildId}.repeatMode`,
              newQueue.repeatMode
            );
          }
          if (data?.playing != newQueue.playing) {
            await client.autoresume.set(
              `${newQueue.textChannel.guildId}.playing`,
              newQueue.playing
            );
          }
          if (data?.currentTime != newQueue.currentTime) {
            await client.autoresume.set(
              `${newQueue.textChannel.guildId}.currentTime`,
              newQueue.currentTime
            );
          }
          if (data?.autoplay != newQueue.autoplay) {
            await client.autoresume.set(
              `${newQueue.textChannel.guildId}.autoplay`,
              newQueue.autoplay
            );
          }
          if (
            newQueue?.songs &&
            !arraysEqual(data?.songs, [...newQueue.songs])
          ) {
            await client.autoresume.set(
              `${newQueue.textChannel.guildId}.songs`,
              [...newQueue.songs].map((track) => buildTrack(track))
            );
          }

          function arraysEqual(a, b) {
            if (a === b) return true;
            if (a == null || b == null) return false;
            if (a.length !== b.length) return false;

            for (var i = 0; i < a.length; ++i) {
              if (a[i] !== b[i]) return false;
            }
            return true;
          }
        }
      }, 10000);
    });

    client.distube.on("searchCancel", async (message, quary) => {
      message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor(client.config.embed.color)
              .setDescription(`Unable to search \`${quary}\``),
          ],
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch((e) => null);
          }, 5000);
        });
    });

    client.distube.on("searchNoResult", async (message, quary) => {
      message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor(client.config.embed.color)
              .setDescription(
                `${client.config.emoji.ERROR} No result found for \`${quary}\`!`
              ),
          ],
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch((e) => null);
          }, 5000);
        });
    });

    client.distube.on("empty", async (queue) => {
      await client.editPlayerMessage(queue.textChannel);
      let db = await client.music?.get(`${queue.textChannel.guildId}.vc`);
      if (db.enable) {
        await client.joinVoiceChannel(queue.textChannel.guild);
      } else {
        queue.stop().catch((e) => null);
        await client.updateembed(client, queue.textChannel.guild);
        queue.textChannel
          .send({
            embeds: [
              new MessageEmbed()
                .setColor(client.config.embed.color)
                .setDescription("Empty Voice Channel. Leaving the Voice Channel"),
            ],
          })
          .then((msg) => {
            setTimeout(() => {
              msg.delete().catch((e) => null);
            }, 5000);
          });
      }
    });
  } catch (e) {}

  // interaction handling
  try {
    client.on("interactionCreate", async (interaction) => {
      if (!interaction.guild || interaction.user.bot) return;
      if (interaction.isButton()) {
        await interaction.deferUpdate().catch((e) => {});
        const { customId, member, guild } = interaction;
        let voiceMember = interaction.guild.members.cache.get(member.id);
        let channel = voiceMember.voice.channel;
        let queue = client.distube.getQueue(interaction.guildId);

        switch (customId) {
          case "autoplay":
            {
              if (!channel) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} Please Join Voice Channel First**`
                );
              } else if (
                interaction.guild.me.voice.channel &&
                !interaction.guild.me.voice.channel.equals(channel)
              ) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} Unable to connect, already in voice channel.**`
                );
              } else if (!queue) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} No active Playlist. **`
                );
              } else if (!queue.autoplay) {
                queue.toggleAutoplay();
                send(
                  interaction,
                  `** 🎈Autoplay is now Enabled ! **`
                );
              } else {
                queue.toggleAutoplay();
                send(
                  interaction,
                  `** 🔴Autoplay is now  Disabled ! **.`
                );
              }
            }
            break;
          case "skip":
            {
              if (!channel) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} Please Join Voice Channel First! **`
                );
              } else if (
                interaction.guild.me.voice.channel &&
                !interaction.guild.me.voice.channel.equals(channel)
              ) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} Unable to connect, already in voice channel.**`
                );
              } else if (!queue) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} No queue active**`
                );
              } else {
                await queue.skip().catch((e) => {});
                send(
                  interaction,
                  `**⏭️ Skip for Next Song**.`
                );
              }
            }
            break;
                      case "pre":
            {
              if (!channel) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} Please Join Voice Channel First! **`
                );
              } else if (
                interaction.guild.me.voice.channel &&
                !interaction.guild.me.voice.channel.equals(channel)
              ) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} Unable to connect, already in voice channel.**`
                );
              } else if (!queue) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} No queue active**`
                );
              } else {
                await queue.previous().then((m) => {});
                send(
                  interaction,
                  `**⏮️ Playing Previous Track!**.`
                );
              }
            }
            break;
          case "stop":
            {
              if (!channel) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} Please Join Voice Channel First! **`
                );
              } else if (
                interaction.guild.me.voice.channel &&
                !interaction.guild.me.voice.channel.equals(channel)
              ) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} Unable to connect, already in voice channel.**`
                );
              } else if (!queue) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} i am Not Playing Right Now **`
                );
              } else {
                await queue.stop().catch((e) => {});
                send(
                  interaction,
                  `**⏹️ Song Stoped and Left Channel!**.`
                );
              }
            }
            break;
          case "pause":
            {
              if (!channel) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} You Need to Join Voice Channel**`
                );
              } else if (
                interaction.guild.me.voice.channel &&
                !interaction.guild.me.voice.channel.equals(channel)
              ) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR}  Unable to connect, already in voice channel.**`
                );
              } else if (!queue) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} i am Not Playing Right Now **`
                );
              } else if (queue.paused) {
                await queue.resume();
                send(
                  interaction,
                  `**⏯️ Queue Resumed!**`
                );
              } else if (!queue.paused) {
                await queue.pause();
                send(
                  interaction,
                  `**⏯️ Queue Paused !! **`
                );
              }
            }
            break;
                      case "resume":
            {
              if (!channel) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} You Need to Join Voice Channel**`
                );
              } else if (
                interaction.guild.me.voice.channel &&
                !interaction.guild.me.voice.channel.equals(channel)
              ) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR}  Unable to connect, already in voice channel.**`
                );
              } else if (!queue) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} i am Not Playing Right Now **`
                );
              } else if (queue.paused) {
                await queue.resume();
                send(
                  interaction,
                  `** ${client.config.emoji.SUCCESS} Queue Resumed!! **`
                 );
              }
            }
            break;
          case "loop":
            {
              if (!channel) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} You Need to Join Voice Channel**`
                );
              } else if (
                interaction.guild.me.voice.channel &&
                !interaction.guild.me.voice.channel.equals(channel)
              ) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR}  Unable to connect, already in voice channel. **`
                );
              } else if (!queue) {
                send(
                  interaction,
                  `** ${client.config.emoji.ERROR} i am Not Playing Right Now **`
                );
              } else if (queue.repeatMode === 0) {
                await queue.setRepeatMode(1);
                send(
                  interaction,
                  `**🟢Loop On  **`
                );
              } else if (queue.repeatMode === 1) {
                await queue.setRepeatMode(2);
                send(
                  interaction,
                  `**🟢Queue Loop On **`
                );
              } else if (queue.repeatMode === 2) {
                await queue.setRepeatMode(0);
                send(
                  interaction,
                  `**🔴Loop Off **`
                );
              }
            }
            break;
          default:
            break;
        }
      }
    });
  } catch (e) {
    console.log(e);
  }

  // request channel
  try {
    client.on("messageCreate", async (message) => {
      if (!message.guild || !message.id) return;
      let data = await client.music.get(`${message.guild.id}.music`);
      if (!data) return;
      let musicchannel = message.guild.channels.cache.get(data.channel);
      if (!musicchannel) return;
      if (message.channelId === musicchannel.id) {
        // code
        if (message.author.bot) {
          if (message.id != data.qmsg || message.id != data.pmsg) {
            setTimeout(() => {
              message.delete().catch((e) => {});
            }, 3000);
          }
        } else {
          if (message.id != data.qmsg || message.id != data.pmsg) {
            setTimeout(() => {
              message.delete().catch((e) => {});
            }, 1000);
          }
          let voiceChannel = message.member.voice.channel;

          if (!message.guild.me.permissions.has("CONNECT")) {
            return client.embed(
              message,
              `** ${client.config.emoji.ERROR} Unable to connect, don't Have Permission to Join Voice Channel **`
            );
          } else if (!voiceChannel) {
            return client.embed(
              message,
              `** ${client.config.emoji.ERROR} You Need to Join Voice Channel **`
            );
          } else if (
            message.guild.me.voice.channel &&
            !message.guild.me.voice.channel.equals(voiceChannel)
          ) {
            return client.embed(
              message,
              `** ${client.config.emoji.ERROR}  Unable to connect, already in voice channel. **`
            );
          } else {
            let song = message.cleanContent;
            client.distube.play(voiceChannel, song, {
              member: message.member,
              message: message,
              textChannel: message.channel,
            });
          }
        }
      }
    });
  } catch (e) {}

  async function send(interaction, string) {
    interaction
      .followUp({
        embeds: [
          new MessageEmbed()
            .setColor(client.config.embed.color)
            .setTitle(`${string.substring(0, 3000)}`)
            .setFooter(client.getFooter(interaction.user)),
        ],
        // ephemeral: true,
      })
      .then((msg) => {
        setTimeout(() => {
          msg.delete().catch((e) => null);
        }, 1000);
      })
      .catch((e) => null);
  }
};
