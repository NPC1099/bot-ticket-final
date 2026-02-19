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
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel]
});

// Slash command
const commands = [
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Envia o painel de tickets')
    .toJSON()
];

// Registro do comando
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

// Evento ready
client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

// Interações
client.on('interactionCreate', async interaction => {

  // Comando /ticket
  if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {

    const embed = new EmbedBuilder()
      .setTitle('🎫 Painel de Tickets')
      .setDescription('Escolha o tipo de ticket que deseja abrir:')
      .setColor('#5865F2')
      .setFooter({ text: 'Equipe de Suporte' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_middle')
        .setLabel('Solicite Middle')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_cross')
        .setLabel('Solicite Um Cross-trade Middle')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_denuncia')
        .setLabel('Denúncia')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket_suporte')
        .setLabel('Suporte')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('ticket_leilao')
        .setLabel('Leilão')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
  }

  // Botões
  if (interaction.isButton()) {

    let nomeTicket;
    let corTicket = '#2f3136';
    let tipo = '';

    switch(interaction.customId) {
      case 'ticket_middle':
        nomeTicket = `ticket-middle-${interaction.user.username.substring(0,15)}`;
        corTicket = '#5865F2';
        tipo = 'Solicite Middle';
        break;
      case 'ticket_cross':
        nomeTicket = `ticket-cross-${interaction.user.username.substring(0,15)}`;
        corTicket = '#43B581';
        tipo = 'Solicite Um Cross-trade Middle';
        break;
      case 'ticket_denuncia':
        nomeTicket = `ticket-denuncia-${interaction.user.username.substring(0,15)}`;
        corTicket = '#F04747';
        tipo = 'Denúncia';
        break;
      case 'ticket_suporte':
        nomeTicket = `ticket-suporte-${interaction.user.username.substring(0,15)}`;
        corTicket = '#43B581';
        tipo = 'Suporte';
        break;
      case 'ticket_leilao':
        nomeTicket = `ticket-leilao-${interaction.user.username.substring(0,15)}`;
        corTicket = '#FAA61A';
        tipo = 'Leilão';
        break;
      case 'fechar_ticket':
        await interaction.channel.delete();
        return;
    }

    if(interaction.customId !== 'fechar_ticket') {

      const closePerms = [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ];

      const suporteRole = interaction.guild.roles.cache.find(r => r.name === 'Suporte');
      if(suporteRole) {
        closePerms.push({
          id: suporteRole.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        });
      }

      await interaction.deferReply({ flags: 64 });

      const channel = await interaction.guild.channels.create({
        name: nomeTicket,
        type: ChannelType.GuildText,
        permissionOverwrites: closePerms
      });

      const ticketEmbed = new EmbedBuilder()
        .setTitle(`🎫 ${tipo}`)
        .setDescription(`${interaction.user}, nossa equipe irá te atender em breve!`)
        .setColor(corTicket);

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('fechar_ticket')
          .setLabel('🔒 Fechar Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ embeds: [ticketEmbed], components: [closeRow] });
      await interaction.editReply({ content: `✅ Seu ticket foi criado: ${channel}` });
    }
  }
});

client.login(process.env.TOKEN);
