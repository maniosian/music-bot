const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Bot ke saare commands dekho"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🎵 Music Bot Help")
      .setDescription("Ye mere available commands hain:")
      .addFields(
        {
          name: "🎵 Music",
          value:
            "`/play` - Song play karo\n" +
            "`/pause` - Music pause karo\n" +
            "`/resume` - Music resume karo\n" +
            "`/skip` - Current song skip karo\n" +
            "`/stop` - Music stop karo\n" +
            "`/queue` - Queue dekho\n" +
            "`/disconnect` - Voice channel se bot disconnect karo"
        },
        {
          name: "🤖 General",
          value:
            "`/ping` - Bot latency check karo\n" +
            "`/help` - Help menu dekho"
        }
      )
      .setFooter({
        text: "Music Bot"
      });

    await interaction.reply({ embeds: [embed] });
  }
};
