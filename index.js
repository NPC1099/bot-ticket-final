const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require('discord.js');

const transcripts = require('discord-html-transcripts');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== REGISTRAR SLASH =====
const commands = [
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Enviar painel de ticket')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
})();

// ===== BOT ONLINE =====
client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}`);
});

// ===== INTERAÇÕES =====
client.on('interactionCreate', async interaction => {

  // PAINEL
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'ticket') {

      const embed = new EmbedBuilder()
        .setTitle('🎫 Sistema de Tickets')
        .setDescription('Clique abaixo para abrir um ticket.')
        .setColor('#000000');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('abrir_ticket')
          .setLabel('Abrir Ticket')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  // ABRIR TICKET
  if (interaction.isButton()) {

    if (interaction.customId === 'abrir_ticket') {

      const canal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          }
        ]
      });

      const embedTicket = new EmbedBuilder()
        .setTitle('🎫 Ticket Aberto')
        .setDescription('Descreva seu problema.\nQuando finalizar clique em **Fechar Ticket**.')
        .setColor('#000000');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('fechar_ticket')
          .setLabel('Fechar Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await canal.send({
        content: `<@${interaction.user.id}>`,
        embeds: [embedTicket],
        components: [row]
      });

      await interaction.reply({
        content: `✅ Ticket criado: ${canal}`,
        ephemeral: true
      });
    }

    // FECHAR TICKET
    if (interaction.customId === 'fechar_ticket') {

      const attachment = await transcripts.createTranscript(interaction.channel);

      await interaction.user.send({
        content: '📂 Aqui está a transcript do seu ticket:',
        files: [attachment]
      });

      const embed = new EmbedBuilder()
        .setTitle('⭐ Avalie o Atendimento')
        .setDescription('Escolha uma nota abaixo:')
        .setColor('#000000');

      const estrelas = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('1').setLabel('⭐').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('2').setLabel('⭐⭐').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('3').setLabel('⭐⭐⭐').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('4').setLabel('⭐⭐⭐⭐').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('5').setLabel('⭐⭐⭐⭐⭐').setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        embeds: [embed],
        components: [estrelas]
      });
    }

    // AVALIAÇÃO
    if (['1','2','3','4','5'].includes(interaction.customId)) {

      await interaction.reply({
        content: `Obrigado pela avaliação de ${interaction.customId} estrela(s)! ⭐`,
        ephemeral: true
      });

      setTimeout(() => {
        interaction.channel.delete();
      }, 3000);
    }

  }

});

client.login(process.env.TOKEN);
