seconst {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  Collection
} = require("discord.js");

const TOKEN = "SEU_TOKEN_AQUI";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Bot ligado como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  // Criar ticket
  if (interaction.customId === "criar_ticket") {

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
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }
      ]
    });

    const fecharBtn = new ButtonBuilder()
      .setCustomId("fechar_ticket")
      .setLabel("Fechar Ticket")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(fecharBtn);

    await canal.send({
      content: `${interaction.user}`,
      embeds: [
        new EmbedBuilder()
          .setTitle("🎫 Ticket Criado")
          .setDescription("Explique seu problema e aguarde a staff.")
          .setColor("Blue")
      ],
      components: [row]
    });

    await interaction.reply({ content: `Ticket criado: ${canal}`, ephemeral: true });
  }

  // Fechar ticket
  if (interaction.customId === "fechar_ticket") {

    const mensagens = await interaction.channel.messages.fetch({ limit: 100 });

    let transcript = "=== TRANSCRIPT DO TICKET ===\n\n";

    mensagens.reverse().forEach(msg => {
      transcript += `${msg.author.tag}: ${msg.content}\n`;
    });

    try {
      const user = interaction.channel.permissionOverwrites.cache
        .find(p => p.type === 1 && p.allow.has(PermissionsBitField.Flags.ViewChannel))
        ?.id;

      if (user) {
        const membro = await interaction.guild.members.fetch(user);
        await membro.send("📄 Aqui está o transcript do seu ticket:");
        await membro.send("```" + transcript.slice(0, 1900) + "```");
      }
    } catch (err) {
      console.log("Não consegui enviar DM");
    }

    // Sistema de avaliação
    const estrelas = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("1").setLabel("⭐").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("2").setLabel("⭐⭐").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("3").setLabel("⭐⭐⭐").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("4").setLabel("⭐⭐⭐⭐").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("5").setLabel("⭐⭐⭐⭐⭐").setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Avaliação")
          .setDescription("Avalie o atendimento antes do ticket ser deletado.")
          .setColor("Yellow")
      ],
      components: [estrelas]
    });
  }

  // Avaliação
  if (["1","2","3","4","5"].includes(interaction.customId)) {

    await interaction.reply({
      content: `Obrigado pela avaliação: ${interaction.customId} ⭐`,
      ephemeral: true
    });

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 3000);
  }
});

// Comando para enviar painel
client.on("messageCreate", async message => {
  if (message.content === "!painel") {

    const botao = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("criar_ticket")
        .setLabel("Abrir Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Suporte")
          .setDescription("Clique no botão abaixo para abrir um ticket.")
          .setColor("Green")
      ],
      components: [botao]
    });
  }
});

client.login(process.env.TOKEN);
