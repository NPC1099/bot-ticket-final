require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const transcripts = require('discord-html-transcripts');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

const tickets = new Map();

const commands = [
  new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Enviar painel de tickets')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );
})();

client.once('clientReady', () => {
  console.log('Bot online.');
});

client.on('interactionCreate', async (interaction) => {

  // COMANDO PAINEL
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'painel') {

      const embed = new EmbedBuilder()
        .setTitle('🎫 Central de Atendimento')
        .setDescription('Selecione uma opção abaixo para abrir seu ticket.')
        .setColor('#000000');

      const menu = new StringSelectMenuBuilder()
        .setCustomId('menu_ticket')
        .setPlaceholder('Escolha uma categoria')
        .addOptions([
          { label: 'Suporte', value: 'suporte' },
          { label: 'Middleman', value: 'middleman' },
          { label: 'CrossTrade', value: 'crosstrade' },
          { label: 'MM', value: 'mm' },
          { label: 'Leilão', value: 'leilao' },
          { label: 'Denúncia', value: 'denuncia' }
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }

  // MENU SELECIONADO
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId === 'menu_ticket') {

  await interaction.deferReply({ ephemeral: true });

  if (tickets.has(interaction.user.id)) {
    return interaction.editReply({
      content: 'Você já possui um ticket aberto.'
    });
  }

  const tipo = interaction.values[0];

      if (tickets.has(interaction.user.id)) {
        return interaction.reply({
          content: 'Você já possui um ticket aberto.',
          ephemeral: true
        });
      }

      const tipo = interaction.values[0];

      const channel = await interaction.guild.channels.create({
        name: `${tipo}-${interaction.user.username}`,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          },
          {
            id: process.env.STAFF_ROLE_ID,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ]
      });

      tickets.set(interaction.user.id, channel.id);

      const fecharBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('fechar_ticket')
          .setLabel('Fechar Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [
          new EmbedBuilder()
            .setTitle(`Ticket - ${tipo}`)
            .setDescription('Descreva seu problema detalhadamente.')
            .setColor('#000000')
        ],
        components: [fecharBtn]
      });

      await interaction.reply({
        content: `Seu ticket foi criado: ${channel}`,
        ephemeral: true
      });
    }
  }

  // BOTÕES
  if (interaction.isButton()) {

    // FECHAR
    if (interaction.customId === 'fechar_ticket') {

      const donoId = [...tickets.entries()]
        .find(([_, channelId]) => channelId === interaction.channel.id)?.[0];

      if (!donoId) return;

      const dono = await client.users.fetch(donoId);

      const attachment = await transcripts.createTranscript(interaction.channel);

      try {
        await dono.send({
          content: '📂 Transcript do seu ticket:',
          files: [attachment]
        });

        const embedAval = new EmbedBuilder()
          .setTitle('⭐ Avalie o Atendimento')
          .setDescription('Escolha uma nota abaixo para finalizar.')
          .setColor('#000000');

        const estrelas = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`aval_1_${interaction.channel.id}`).setLabel('⭐').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`aval_2_${interaction.channel.id}`).setLabel('⭐⭐').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`aval_3_${interaction.channel.id}`).setLabel('⭐⭐⭐').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`aval_4_${interaction.channel.id}`).setLabel('⭐⭐⭐⭐').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`aval_5_${interaction.channel.id}`).setLabel('⭐⭐⭐⭐⭐').setStyle(ButtonStyle.Secondary)
        );

        await dono.send({
          embeds: [embedAval],
          components: [estrelas]
        });

      } catch {
        console.log('DM bloqueada.');
      }

      await interaction.reply({
        content: 'Avaliação enviada na DM do usuário.',
        ephemeral: true
      });
    }

    // AVALIAÇÃO
    if (interaction.customId.startsWith('aval_')) {

      const partes = interaction.customId.split('_');
      const nota = partes[1];
      const channelId = partes[2];

      await interaction.reply({
        content: `Obrigado pela avaliação de ${nota} estrela(s)!`,
        ephemeral: true
      });

      const canal = await client.channels.fetch(channelId).catch(() => null);
      if (canal) await canal.delete().catch(() => {});

      tickets.delete(interaction.user.id);
    }
  }
});

client.login(process.env.TOKEN);
