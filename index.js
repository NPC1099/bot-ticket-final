const {
  Client,
  GatewayIntentBits,
  Partials,
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


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.Channel]
});

// ===== REGISTRO DO SLASH COMMAND =====
const commands = [
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Envia o painel de tickets')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash command registrado.');
  } catch (error) {
    console.error(error);
  }
})();

// ===== BOT READY =====
client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

// ===== INTERAÇÕES =====
client.on('interactionCreate', async interaction => {

  // ===== COMANDO /ticket =====
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'ticket') {

      const embed = new EmbedBuilder()
        .setTitle('🎫 Painel de Tickets')
        .setDescription('Escolha o tipo de ticket que deseja abrir:')
        .setColor('#010101');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_suporte')
          .setLabel('Suporte')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId('ticket_denuncia')
          .setLabel('Denúncia')
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId('ticket_middle')
          .setLabel('Middle')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }

  // ===== BOTÕES =====
  if (interaction.isButton()) {

    if (interaction.customId === 'fechar_ticket') {
      await interaction.channel.delete();
      return;
    }

    const nomeCanal = `ticket-${interaction.user.username}`;

    const channel = await interaction.guild.channels.create({
      name: nomeCanal,
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
      .setTitle('🎫 Ticket aberto')
      .setDescription(`${interaction.user}, aguarde atendimento.`)
      .setColor('#010101');

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('🔒 Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      embeds: [embedTicket],
      components: [closeRow]
    });

    await interaction.reply({
      content: `✅ Ticket criado: ${channel}`,
      ephemeral: true
    });
  }
});

// ===== LOGIN =====
client.login(process.env.TOKEN);
