
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const fs = require("node:fs");
const path = require("node:path");

const TOKEN = process.env.DISCORD_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const OWNER_ID = "1533306874513068093";
const PREFIX = "z!";

if (!TOKEN) {
  console.error("ERRO: configure DISCORD_TOKEN nas Secrets da hospedagem.");
  process.exit(1);
}

const EMOJI = {
  barras: "<:4pauzinhos:1552010605060300972>",
  carrinho: "<:Carrinho:1552009619046531154>",
  regras: "<:Eclipse_rules:1552508768259014656>",
  pendente: "<:Member_Pending:1550347089332932668>",
  online: "<a:Online:1552007801017204736>",
  republica: "<:Repblica:1552763007258333255>",
  protegido: "<:Secured:1550347097318883360>",
  vazio: "<:__:1552010603764256939>",
  aceito: "<:aceito:1552508777943539843>",
  procurar: "<:achar:1550347098858332192>",
  alertaAnimado: "<a:alerta:1552007804569653360>",
  alerta: "<:alerta:1552010624513482823>",
  ban: "<:ban:1552761935945277472>",
  comentario: "<:cometrio:1552009642081788016>",
  config: "<:config:1552010601688080457>",
  coracao: "<:corao:1552010611393700011>",
  dashboard: "<:dashboard:1552007805953900564>",
  digitar: "<:digitar:1550347102662434857>",
  dislike: "<:disslike:1552007819757092924>",
  documento: "<:documento:1552009636251566130>",
  escudo: "<:escudo:1552508771228450856>",
  exclamacao: "<:excla:1552508778887254026>",
  fechadura: "<:fechadura:1552508769752317994>",
  fixo: "<:fixo:1550347448247914588>",
  horario: "<:horrio:1550347082634760202>",
  insta: "<:insta:1552009638487138427>",
  like: "<:like:1552007813709172766>",
  link: "<:link:1552009621999452160>",
  lixo: "<:lixo:1552009637170253894>",
  load: "<a:load:1552508772432347189>",
  mais: "<:mais:1550347104336220180>",
  negativo: "<:negativo:1550347078893441114>",
  warn: "<:notificacao_warn:1550347085444943892>",
  play: "<:play:1552762285502627930>",
  ponto: "<:ponto:1552010636190421133>",
  positivo: "<:positivo:1550347075089211432>",
  posse: "<:posse:1552007807535153262>",
  proibido: "<:proibido:1552010616280064092>",
  recusado: "<:recusado:1552508774462398484>",
  security: "<:security:1552010618163167306>",
  servidor: "<:servidor:1552763006214217879>",
  seta: "<:seta:1552009643734343910>",
  suporte: "<:suporte_emoji:1552508765176074270>",
  texto: "<:texto:1550347093586223184>",
  ticket: "<:ticket_fallens:1552761934733119709>",
  vendido: "<:vendido:1552009611878469757>",
  vigiando: "<:vigiando:1552007809321926656>",
  voz: "<:voz:1552010607090204782>",
  warn1: "<:warn1:1550347449925894196>",
  warn2: "<:warn2:1550347452446408754>",
  warn3: "<:warn3:1550347451070943254>",
  vip: "<:vip:1559077642593108008>"
};

const DATA_PATH = path.join(__dirname, "data.json");

let data = {
  guilds: {},
  tickets: {},
  feedbacks: {},
  products: {},
  purchases: {},
  warnings: {},
  moderation: {},
  security: {},
  honeypot: {},
  announcements: {},
  logs: {},
  users: {},
  version: 1
};

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const saved = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
      data = { ...data, ...saved };
    }
  } catch (error) {
    console.error("Não foi possível ler data.json:", error);
  }
}

let saveQueue = Promise.resolve();

function saveData() {
  saveQueue = saveQueue.then(async () => {
    const temp = DATA_PATH + ".tmp";
    await fs.promises.writeFile(temp, JSON.stringify(data, null, 2));
    await fs.promises.rename(temp, DATA_PATH);
  }).catch(error => {
    console.error("Erro ao salvar data.json:", error);
  });

  return saveQueue;
}

function getGuild(guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      ticketChannel: null,
      ticketCategory: null,
      ticketStaffRole: null,
      ticketMode: "channel",
      logChannel: null,
      welcomeChannel: null,
      leaveChannel: null,
      welcomeEnabled: false,
      leaveEnabled: false,
      honeypotChannel: null,
      honeypotAction: "timeout",
      honeypotDuration: 7 * 24 * 60,
      moderationRole: null,
      configRole: null,
      securityEnabled: false,
      antiSpam: true,
      antiLinks: false,
      antiRaid: true,
      aiEnabled: false,
      rulesText: null
    };
  }

  return data.guilds[guildId];
}

function isOwner(userId) {
  return userId === OWNER_ID;
}

function canConfigure(member, guildId) {
  if (isOwner(member.id)) return true;
  if (member.id === member.guild.ownerId) return true;

  const cfg = getGuild(guildId);

  if (cfg.configRole && member.roles.cache.has(cfg.configRole)) {
    return true;
  }

  return false;
}

function isStaff(member, guildId) {
  if (isOwner(member.id) || member.id === member.guild.ownerId) {
    return true;
  }

  const cfg = getGuild(guildId);

  return Boolean(
    cfg.ticketStaffRole &&
    member.roles.cache.has(cfg.ticketStaffRole)
  );
}

function v2Container(title, description, components = []) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${title}\n${description}`
      )
    );

  if (components.length) {
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    for (const component of components) {
      container.addActionRowComponents(component);
    }
  }

  return container;
}

function configPanel(guild) {
  const cfg = getGuild(guild.id);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("zy_config_section")
    .setPlaceholder("Escolha uma categoria de configuração")
    .addOptions(
      {
        label: "Tickets",
        value: "tickets",
        emoji: "🎫",
        description: "Painel, equipe e funcionamento"
      },
      {
        label: "Moderação",
        value: "moderation",
        emoji: "🛡️",
        description: "Cargos e registros de punições"
      },
      {
        label: "Segurança",
        value: "security",
        emoji: "🔐",
        description: "Anti-spam, links e proteção"
      },
      {
        label: "Honeypot",
        value: "honeypot",
        emoji: "🍯",
        description: "Canal-isca e punições"
      },
      {
        label: "Boas-vindas",
        value: "welcome",
        emoji: "👋",
        description: "Entrada e saída de membros"
      },
      {
        label: "Logs",
        value: "logs",
        emoji: "📋",
        description: "Canal de registros"
      },
      {
        label: "Regras",
        value: "rules",
        emoji: "📜",
        description: "Texto e publicação das regras"
      }
    );

  const row = new ActionRowBuilder().addComponents(menu);

  const status = [
    `**Servidor:** ${guild.name}`,
    `**Tickets:** ${cfg.ticketChannel ? EMOJI.aceito + " Configurado" : EMOJI.pendente + " Não configurado"}`,
    `**Logs:** ${cfg.logChannel ? EMOJI.aceito + " Configurado" : EMOJI.pendente + " Não configurado"}`,
    `**Segurança:** ${cfg.securityEnabled ? EMOJI.online + " Ativada" : EMOJI.negativo + " Desativada"}`,
    `**IA:** ${cfg.aiEnabled && OPENAI_API_KEY ? EMOJI.online + " Ativada" : EMOJI.negativo + " Desativada"}`
  ].join("\n");

  return v2Container(
    `${EMOJI.config} ZYPhor Bot — Configuração`,
    `${EMOJI.servidor} **Painel administrativo**\n\n${status}\n\nSelecione abaixo o sistema que deseja configurar.`,
    [row]
  );
}

function sectionPanel(section, guild) {
  const cfg = getGuild(guild.id);

  const buttons = [];

  if (section === "tickets") {
    buttons.push(
      new ButtonBuilder()
        .setCustomId("zy_ticket_channel")
        .setLabel("Selecionar canal do painel")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("zy_ticket_category")
        .setLabel("Selecionar categoria")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("zy_ticket_role")
        .setLabel("Selecionar equipe")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("zy_ticket_mode")
        .setLabel(`Modo: ${cfg.ticketMode}`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("zy_ticket_publish")
        .setLabel("Publicar painel")
        .setStyle(ButtonStyle.Success)
    );
  }

  if (section === "security") {
    buttons.push(
      new ButtonBuilder()
        .setCustomId("zy_security_toggle")
        .setLabel(cfg.securityEnabled ? "Desativar proteção" : "Ativar proteção")
        .setStyle(cfg.securityEnabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("zy_antispam_toggle")
        .setLabel(`Anti-spam: ${cfg.antiSpam ? "ON" : "OFF"}`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("zy_antilinks_toggle")
        .setLabel(`Anti-links: ${cfg.antiLinks ? "ON" : "OFF"}`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("zy_antiraid_toggle")
        .setLabel(`Anti-raid: ${cfg.antiRaid ? "ON" : "OFF"}`)
        .setStyle(ButtonStyle.Secondary)
    );
  }

  if (section === "honeypot") {
    buttons.push(
      new ButtonBuilder()
        .setCustomId("zy_honeypot_channel")
        .setLabel("Selecionar canal")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("zy_honeypot_action")
        .setLabel(`Ação: ${cfg.honeypotAction}`)
        .setStyle(ButtonStyle.Secondary)
    );
  }

  if (section === "welcome") {
    buttons.push(
      new ButtonBuilder()
        .setCustomId("zy_welcome_channel")
        .setLabel("Canal de boas-vindas")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("zy_leave_channel")
        .setLabel("Canal de saída")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("zy_welcome_toggle")
        .setLabel(`Boas-vindas: ${cfg.welcomeEnabled ? "ON" : "OFF"}`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("zy_leave_toggle")
        .setLabel(`Saídas: ${cfg.leaveEnabled ? "ON" : "OFF"}`)
        .setStyle(ButtonStyle.Secondary)
    );
  }

  if (section === "logs") {
    buttons.push(
      new ButtonBuilder()
        .setCustomId("zy_log_channel")
        .setLabel("Selecionar canal de logs")
        .setStyle(ButtonStyle.Primary)
    );
  }

  if (section === "moderation") {
    buttons.push(
      new ButtonBuilder()
        .setCustomId("zy_moderation_role")
        .setLabel("Selecionar equipe de moderação")
        .setStyle(ButtonStyle.Primary)
    );
  }

  if (section === "rules") {
    buttons.push(
      new ButtonBuilder()
        .setCustomId("zy_rules_channel")
        .setLabel("Selecionar canal das regras")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("zy_rules_publish")
        .setLabel("Publicar regras")
        .setStyle(ButtonStyle.Success)
    );
  }

  const rows = [];

  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("zy_config_home")
        .setLabel("Voltar ao início")
        .setStyle(ButtonStyle.Secondary)
    )
  );

  return v2Container(
    `${EMOJI.dashboard} Configuração: ${section}`,
    `Altere as opções abaixo. As alterações são salvas no arquivo de dados.\n\n${EMOJI.fixo} **Modo de ticket atual:** ${cfg.ticketMode}`,
    rows
  );
}

async function sendLog(guild, title, description, color = 0x2b2d31) {
  const cfg = getGuild(guild.id);
  if (!cfg.logChannel) return;

  const channel = await guild.channels.fetch(cfg.logChannel).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => null);
}

async function createTicket(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;
  const cfg = getGuild(guild.id);

  if (!cfg.ticketCategory || !cfg.ticketStaffRole) {
    return interaction.reply({
      content: `${EMOJI.alerta} A equipe e a categoria dos tickets ainda não foram configuradas.`,
      ephemeral: true
    });
  }

  const existing = Object.values(data.tickets).find(
    ticket => ticket.guildId === guild.id &&
      ticket.userId === user.id &&
      ticket.status === "open"
  );

  if (existing) {
    return interaction.reply({
      content: `${EMOJI.ticket} Você já possui um ticket aberto: <#${existing.channelId}>`,
      ephemeral: true
    });
  }

  const category = await guild.channels.fetch(cfg.ticketCategory).catch(() => null);

  if (!category) {
    return interaction.reply({
      content: `${EMOJI.alerta} A categoria configurada não existe mais.`,
      ephemeral: true
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 90),
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      },
      {
        id: cfg.ticketStaffRole,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages
        ]
      },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages
        ]
      }
    ]
  });

  data.tickets[channel.id] = {
    guildId: guild.id,
    channelId: channel.id,
    userId: user.id,
    status: "open",
    claimedBy: null,
    createdAt: Date.now(),
    transcript: []
  };

  await saveData();

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("zy_ticket_claim")
      .setLabel("Atender")
      .setEmoji("🧑‍💻")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("zy_ticket_close")
      .setLabel("Fechar")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `<@${user.id}> <@&${cfg.ticketStaffRole}>`,
    components: [controls],
    embeds: [
      new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle(`${EMOJI.ticket} Atendimento Zyphor`)
        .setDescription(
          `Olá, <@${user.id}>!\n\nExplique o que você precisa. A equipe irá atender assim que possível.\n\n${EMOJI.suporte} Somente a equipe pode adicionar outros membros ao ticket.`
        )
        .setFooter({ text: "ZYPhor Bot • Sistema de atendimento" })
    ]
  });

  await interaction.reply({
    content: `${EMOJI.aceito} Seu ticket foi criado: ${channel}`,
    ephemeral: true
  });

  await sendLog(guild, "Ticket aberto", `Usuário: <@${user.id}>\nCanal: ${channel}`);
}

async function closeTicket(interaction) {
  const ticket = data.tickets[interaction.channelId];

  if (!ticket || ticket.status !== "open") {
    return interaction.reply({
      content: `${EMOJI.alerta} Este canal não é um ticket aberto.`,
      ephemeral: true
    });
  }

  const member = interaction.member;
  const isOpener = interaction.user.id === ticket.userId;

  if (!isOpener && !isStaff(member, interaction.guildId)) {
    return interaction.reply({
      content: `${EMOJI.proibido} Você não tem permissão para fechar este ticket.`,
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const messages = await interaction.channel.messages.fetch({ limit: 100 });
  const transcript = messages
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map(message => ({
      author: message.author.tag,
      userId: message.author.id,
      content: message.content,
      timestamp: message.createdAt.toISOString()
    }));

  ticket.transcript = transcript;
  ticket.status = "closed";
  ticket.closedAt = Date.now();
  ticket.closedBy = interaction.user.id;

  await saveData();

  await sendLog(
    interaction.guild,
    "Ticket fechado",
    `Ticket: ${interaction.channel.name}\nAutor: <@${ticket.userId}>\nFechado por: <@${interaction.user.id}>\nMensagens registradas: ${transcript.length}`
  );

  const owner = await interaction.client.users.fetch(ticket.userId).catch(() => null);

  if (owner) {
    const feedbackRow = new ActionRowBuilder().addComponents(
      [1, 2, 3, 4, 5].map(stars =>
        new ButtonBuilder()
          .setCustomId(`zy_feedback_${stars}_${ticket.channelId}`)
          .setLabel(`${stars} ★`)
          .setStyle(stars >= 4 ? ButtonStyle.Success : ButtonStyle.Secondary)
      )
    );

    await owner.send({
      content: `${EMOJI.like} Como foi seu atendimento? Avalie de 1 a 5 estrelas.`,
      components: [feedbackRow]
    }).catch(() => null);
  }

  await interaction.editReply(`${EMOJI.aceito} Ticket registrado e fechado. O canal será excluído em alguns segundos.`);

  setTimeout(async () => {
    await interaction.channel.delete("Ticket encerrado").catch(() => null);
  }, 5000);
}
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

loadData();

const configCommand = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Abre o painel administrativo do ZYPhor Bot");

async function publishTicketPanel(interaction) {
  const cfg = getGuild(interaction.guildId);

  if (!cfg.ticketChannel) {
    return interaction.reply({
      content: `${EMOJI.alerta} Selecione primeiro o canal do painel.`,
      ephemeral: true
    });
  }

  const channel = await interaction.guild.channels.fetch(cfg.ticketChannel).catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return interaction.reply({
      content: `${EMOJI.alerta} O canal configurado não foi encontrado.`,
      ephemeral: true
    });
  }

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("zy_ticket_open")
      .setLabel("Abrir atendimento")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Primary)
  );

  const panel = v2Container(
    `${EMOJI.ticket} Central de atendimento`,
    "Precisa de ajuda? Clique no botão abaixo para abrir um atendimento privado com nossa equipe.",
    [button]
  );

  await channel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [panel]
  });

  return interaction.reply({
    content: `${EMOJI.aceito} Painel de tickets publicado em ${channel}.`,
    ephemeral: true
  });
}

async function handleConfigButton(interaction) {
  const cfg = getGuild(interaction.guildId);
  const id = interaction.customId;

  if (id === "zy_config_home") {
    return interaction.update({
      flags: MessageFlags.IsComponentsV2,
      components: [configPanel(interaction.guild)]
    });
  }

  if (id === "zy_ticket_channel") {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId("zy_select_ticket_channel")
      .setPlaceholder("Selecione o canal do painel")
      .setChannelTypes(ChannelType.GuildText);

    return interaction.reply({
      content: "Selecione o canal onde ficará o painel de tickets:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }

  if (id === "zy_ticket_category") {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId("zy_select_ticket_category")
      .setPlaceholder("Selecione a categoria dos tickets")
      .setChannelTypes(ChannelType.GuildCategory);

    return interaction.reply({
      content: "Selecione a categoria onde os tickets serão criados:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }

  if (id === "zy_ticket_role") {
    const menu = new RoleSelectMenuBuilder()
      .setCustomId("zy_select_ticket_role")
      .setPlaceholder("Selecione o cargo da equipe");

    return interaction.reply({
      content: "Selecione o cargo autorizado a atender tickets:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }

  if (id === "zy_ticket_mode") {
    cfg.ticketMode = cfg.ticketMode === "channel" ? "thread" : "channel";
    await saveData();

    return interaction.update({
      flags: MessageFlags.IsComponentsV2,
      components: [sectionPanel("tickets", interaction.guild)]
    });
  }

  if (id === "zy_ticket_publish") {
    return publishTicketPanel(interaction);
  }

  if (id === "zy_security_toggle") {
    cfg.securityEnabled = !cfg.securityEnabled;
  } else if (id === "zy_antispam_toggle") {
    cfg.antiSpam = !cfg.antiSpam;
  } else if (id === "zy_antilinks_toggle") {
    cfg.antiLinks = !cfg.antiLinks;
  } else if (id === "zy_antiraid_toggle") {
    cfg.antiRaid = !cfg.antiRaid;
  } else if (id === "zy_welcome_toggle") {
    cfg.welcomeEnabled = !cfg.welcomeEnabled;
  } else if (id === "zy_leave_toggle") {
    cfg.leaveEnabled = !cfg.leaveEnabled;
  } else if (id === "zy_honeypot_action") {
    const actions = ["timeout", "kick", "ban"];
    const current = actions.indexOf(cfg.honeypotAction);
    cfg.honeypotAction = actions[(current + 1) % actions.length];
  } else if (id === "zy_honeypot_channel") {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId("zy_select_honeypot")
      .setPlaceholder("Selecione o canal honeypot")
      .setChannelTypes(ChannelType.GuildText);

    return interaction.reply({
      content: "Selecione o canal honeypot:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  } else if (id === "zy_welcome_channel") {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId("zy_select_welcome")
      .setPlaceholder("Canal de boas-vindas")
      .setChannelTypes(ChannelType.GuildText);

    return interaction.reply({
      content: "Selecione o canal de boas-vindas:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  } else if (id === "zy_leave_channel") {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId("zy_select_leave")
      .setPlaceholder("Canal de saída")
      .setChannelTypes(ChannelType.GuildText);

    return interaction.reply({
      content: "Selecione o canal de saída:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  } else if (id === "zy_log_channel") {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId("zy_select_logs")
      .setPlaceholder("Selecione o canal de logs")
      .setChannelTypes(ChannelType.GuildText);

    return interaction.reply({
      content: "Selecione o canal de logs:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  } else if (id === "zy_moderation_role") {
    const menu = new RoleSelectMenuBuilder()
      .setCustomId("zy_select_moderation_role")
      .setPlaceholder("Cargo da equipe de moderação");

    return interaction.reply({
      content: "Selecione o cargo de moderação:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  } else if (id === "zy_rules_channel") {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId("zy_select_rules")
      .setPlaceholder("Canal das regras")
      .setChannelTypes(ChannelType.GuildText);

    return interaction.reply({
      content: "Selecione o canal das regras:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  } else if (id === "zy_rules_publish") {
    if (!cfg.rulesChannel) {
      return interaction.reply({
        content: `${EMOJI.alerta} Primeiro selecione o canal das regras.`,
        ephemeral: true
      });
    }

    const rulesChannel = await interaction.guild.channels
      .fetch(cfg.rulesChannel)
      .catch(() => null);

    if (!rulesChannel) {
      return interaction.reply({
        content: `${EMOJI.alerta} Canal das regras não encontrado.`,
        ephemeral: true
      });
    }

    const rules = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${EMOJI.regras} **REGRAS DO SERVIDOR**\n\n${cfg.rulesText || "As regras ainda não foram personalizadas. Um administrador deve configurar o texto."}`
        )
      );

    await rulesChannel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [rules]
    });

    return interaction.reply({
      content: `${EMOJI.aceito} Regras publicadas.`,
      ephemeral: true
    });
  }

  await saveData();

  const section =
    id.includes("ticket") ? "tickets" :
    id.includes("security") || id.includes("anti") ? "security" :
    id.includes("honeypot") ? "honeypot" :
    id.includes("welcome") || id.includes("leave") ? "welcome" :
    id.includes("log") ? "logs" :
    id.includes("moderation") ? "moderation" :
    "rules";

  return interaction.update({
    flags: MessageFlags.IsComponentsV2,
    components: [sectionPanel(section, interaction.guild)]
  });
}

async function handleSelectMenu(interaction) {
  const cfg = getGuild(interaction.guildId);
  const id = interaction.customId;

  if (id === "zy_config_section") {
    return interaction.update({
      flags: MessageFlags.IsComponentsV2,
      components: [sectionPanel(interaction.values[0], interaction.guild)]
    });
  }

  if (id === "zy_select_ticket_channel") cfg.ticketChannel = interaction.values[0];
  else if (id === "zy_select_ticket_category") cfg.ticketCategory = interaction.values[0];
  else if (id === "zy_select_ticket_role") cfg.ticketStaffRole = interaction.values[0];
  else if (id === "zy_select_honeypot") cfg.honeypotChannel = interaction.values[0];
  else if (id === "zy_select_welcome") cfg.welcomeChannel = interaction.values[0];
  else if (id === "zy_select_leave") cfg.leaveChannel = interaction.values[0];
  else if (id === "zy_select_logs") cfg.logChannel = interaction.values[0];
  else if (id === "zy_select_moderation_role") cfg.moderationRole = interaction.values[0];
  else if (id === "zy_select_rules") cfg.rulesChannel = interaction.values[0];

  await saveData();

  return interaction.update({
    content: `${EMOJI.aceito} Configuração salva com sucesso.`,
    components: [],
    embeds: []
  });
}

async function handleTicketButton(interaction) {
  const id = interaction.customId;

  if (id === "zy_ticket_open") {
    return createTicket(interaction);
  }

  if (id === "zy_ticket_claim") {
    const ticket = data.tickets[interaction.channelId];

    if (!ticket || ticket.status !== "open") {
      return interaction.reply({
        content: `${EMOJI.alerta} Ticket não encontrado ou já fechado.`,
        ephemeral: true
      });
    }

    if (!isStaff(interaction.member, interaction.guildId)) {
      return interaction.reply({
        content: `${EMOJI.proibido} Somente a equipe pode atender.`,
        ephemeral: true
      });
    }

    if (ticket.claimedBy) {
      return interaction.reply({
        content: `Este ticket já está sendo atendido por <@${ticket.claimedBy}>.`,
        ephemeral: true
      });
    }

    ticket.claimedBy = interaction.user.id;
    await saveData();

    await interaction.reply({
      content: `${EMOJI.aceito} <@${interaction.user.id}> assumiu este atendimento.`
    });

    return sendLog(
      interaction.guild,
      "Ticket assumido",
      `Canal: ${interaction.channel}\nResponsável: <@${interaction.user.id}>`
    );
  }

  if (id === "zy_ticket_close") {
    return closeTicket(interaction);
  }

  if (id.startsWith("zy_feedback_")) {
    const [, , stars, channelId] = id.split("_");
    const ticket = data.tickets[channelId];

    if (!ticket || ticket.userId !== interaction.user.id) {
      return interaction.reply({
        content: `${EMOJI.proibido} Essa avaliação não pertence a você.`,
        ephemeral: true
      });
    }

    data.feedbacks[`${channelId}_${interaction.user.id}`] = {
      guildId: ticket.guildId,
      userId: interaction.user.id,
      stars: Number(stars),
      createdAt: Date.now(),
      comment: null
    };

    await saveData();

    return interaction.update({
      content: `${EMOJI.like} Obrigado pela avaliação de **${stars}/5 estrelas**!`,
      components: []
    });
  }
}

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "config") {
        if (!canConfigure(interaction.member, interaction.guildId)) {
          return interaction.reply({
            content: `${EMOJI.proibido} Você não tem permissão para abrir a configuração.`,
            ephemeral: true
          });
        }

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [configPanel(interaction.guild)]
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      return handleSelectMenu(interaction);
    }

    if (interaction.isChannelSelectMenu()) {
      return handleSelectMenu(interaction);
    }

    if (interaction.isRoleSelectMenu()) {
      return handleSelectMenu(interaction);
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith("zy_feedback_")) {
        return handleTicketButton(interaction);
      }

      if (interaction.customId.startsWith("zy_ticket_")) {
        return handleTicketButton(interaction);
      }

      if (interaction.customId.startsWith("zy_")) {
        if (!canConfigure(interaction.member, interaction.guildId)) {
          return interaction.reply({
            content: `${EMOJI.proibido} Você não tem permissão para alterar configurações.`,
            ephemeral: true
          });
        }

        return handleConfigButton(interaction);
      }
    }
  } catch (error) {
    console.error("Erro em interação:", error);

    const message = {
      content: `${EMOJI.alerta} Ocorreu um erro ao executar essa ação. Confira as permissões e tente novamente.`,
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(message).catch(() => null);
    } else {
      await interaction.reply(message).catch(() => null);
    }
  }
});
const spamTracker = new Map();

client.on("messageCreate", async message => {
  try {
    if (!message.guild || message.author.bot) return;

    const cfg = getGuild(message.guild.id);

    // Comando de consulta dos feedbacks
    if (message.content.trim().toLowerCase() === `${PREFIX}feedbacks`) {
      if (!isStaff(message.member, message.guild.id)) {
        return message.reply(`${EMOJI.proibido} Somente a equipe pode consultar os feedbacks.`);
      }

      const feedbacks = Object.values(data.feedbacks)
        .filter(item => item.guildId === message.guild.id);

      if (!feedbacks.length) {
        return message.reply(`${EMOJI.documento} Ainda não existem avaliações.`);
      }

      const average = feedbacks.reduce((sum, item) => sum + item.stars, 0) / feedbacks.length;

      const description = feedbacks
        .slice(-15)
        .reverse()
        .map(item =>
          `**${item.stars}/5 ★** — <@${item.userId}>`
        )
        .join("\n");

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle(`${EMOJI.like} Feedbacks Zyphor`)
            .setDescription(description)
            .addFields(
              { name: "Avaliações", value: String(feedbacks.length), inline: true },
              { name: "Média", value: `${average.toFixed(1)}/5`, inline: true }
            )
            .setTimestamp()
        ]
      });
    }

    // Honeypot: qualquer mensagem enviada no canal é removida.
    // Apenas enviar mensagem ativa a punição; visualizar o canal não.
    if (cfg.honeypotChannel && message.channel.id === cfg.honeypotChannel) {
      await message.delete().catch(() => null);

      const member = await message.guild.members
        .fetch(message.author.id)
        .catch(() => null);

      if (!member || !member.moderatable) return;

      const reason = "Mensagem enviada no canal Honeypot do servidor.";

      if (cfg.honeypotAction === "timeout") {
        await member.timeout(
          cfg.honeypotDuration || 7 * 24 * 60,
          reason
        ).catch(() => null);
      } else if (cfg.honeypotAction === "kick") {
        await member.kick(reason).catch(() => null);
      } else if (cfg.honeypotAction === "ban") {
        await member.ban({ reason }).catch(() => null);
      }

      await sendLog(
        message.guild,
        "Honeypot acionado",
        `Usuário: <@${message.author.id}>\nAção configurada: ${cfg.honeypotAction}`,
        0xff9900
      );

      return;
    }

    if (!cfg.securityEnabled) return;

    // Anti-spam simples: 6 mensagens em 5 segundos.
    if (cfg.antiSpam) {
      const now = Date.now();
      const key = `${message.guild.id}:${message.author.id}`;
      const previous = spamTracker.get(key) || [];

      const recent = previous.filter(timestamp => now - timestamp < 5000);
      recent.push(now);
      spamTracker.set(key, recent);

      if (recent.length >= 6) {
        await message.delete().catch(() => null);

        const member = await message.guild.members
          .fetch(message.author.id)
          .catch(() => null);

        if (member?.moderatable) {
          await member.timeout(
            60 * 1000,
            "Anti-spam: excesso de mensagens em pouco tempo."
          ).catch(() => null);
        }

        await sendLog(
          message.guild,
          "Anti-spam acionado",
          `Usuário: <@${message.author.id}>\nMensagens detectadas: ${recent.length}`,
          0xff9900
        );

        spamTracker.delete(key);
        return;
      }
    }

    // Anti-links: remove links de usuários comuns.
    if (cfg.antiLinks && /(https?:\/\/|www\.)/i.test(message.content)) {
      const member = message.member;
      const hasStaffPermission =
        member.permissions.has(PermissionFlagsBits.ManageMessages) ||
        isStaff(member, message.guild.id);

      if (!hasStaffPermission) {
        await message.delete().catch(() => null);

        await sendLog(
          message.guild,
          "Link removido",
          `Usuário: <@${message.author.id}>\nCanal: <#${message.channel.id}>`,
          0xff9900
        );
      }
    }
  } catch (error) {
    console.error("Erro no sistema de mensagens:", error);
  }
});

// Boas-vindas
client.on("guildMemberAdd", async member => {
  try {
    const cfg = getGuild(member.guild.id);

    if (!cfg.welcomeEnabled || !cfg.welcomeChannel) return;

    const channel = await member.guild.channels
      .fetch(cfg.welcomeChannel)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle(`${EMOJI.online} Boas-vindas!`)
          .setDescription(
            `Olá, ${member}!\n\nSeja bem-vindo(a) ao **${member.guild.name}**.\nEsperamos que aproveite sua estadia!`
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: `Membro número ${member.guild.memberCount}` })
          .setTimestamp()
      ]
    });

    await sendLog(
      member.guild,
      "Novo membro",
      `${member.user.tag} entrou no servidor.`
    );
  } catch (error) {
    console.error("Erro nas boas-vindas:", error);
  }
});

// Saída de membros
client.on("guildMemberRemove", async member => {
  try {
    const cfg = getGuild(member.guild.id);

    if (cfg.leaveEnabled && cfg.leaveChannel) {
      const channel = await member.guild.channels
        .fetch(cfg.leaveChannel)
        .catch(() => null);

      if (channel?.isTextBased()) {
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2b2d31)
              .setTitle(`${EMOJI.pendente} Membro saiu`)
              .setDescription(
                `**${member.user.tag}** saiu do servidor.`
              )
              .setThumbnail(member.user.displayAvatarURL())
              .setTimestamp()
          ]
        });
      }
    }

    await sendLog(
      member.guild,
      "Membro saiu",
      `${member.user.tag} saiu do servidor.`
    );
  } catch (error) {
    console.error("Erro no evento de saída:", error);
  }
});

// Registro de alterações de moderação
client.on("guildAuditLogEntryCreate", async (entry, guild) => {
  try {
    const cfg = getGuild(guild.id);
    if (!cfg.logChannel) return;

    const actions = {
      22: "Banimento",
      20: "Expulsão",
      24: "Timeout"
    };

    const name = actions[entry.action];
    if (!name) return;

    await sendLog(
      guild,
      `Registro de moderação: ${name}`,
      `Responsável: ${entry.executor ? `<@${entry.executor.id}>` : "Desconhecido"}\nAlvo: ${entry.target ? String(entry.target) : "Não identificado"}\nMotivo: ${entry.reason || "Não informado"}`,
      0xff9900
    );
  } catch (error) {
    console.error("Erro no registro de auditoria:", error);
  }
});

// Inicialização e registro do único comando slash
client.once("ready", async () => {
  console.log(`${client.user.tag} está online!`);

  client.user.setPresence({
    activities: [{ name: "ZYPhor • /config", type: 3 }],
    status: "online"
  });

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [configCommand.toJSON()] }
    );

    console.log("Comando /config registrado.");
  } catch (error) {
    console.error("Erro ao registrar /config:", error);
  }
});

process.on("unhandledRejection", error => {
  console.error("Promise rejeitada:", error);
});

process.on("uncaughtException", error => {
  console.error("Erro não tratado:", error);
});

client.login(TOKEN);
