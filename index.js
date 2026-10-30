
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require("discord.js");

const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURAÇÕES PRINCIPAIS
// ==========================================

const TOKEN =
  process.env.DISCORD_TOKEN ||
  process.env.DISCORD_BOT_TOKEN ||
  process.env.BOT_TOKEN ||
  process.env.TOKEN;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const OWNER_ID = "1533306874513068093";
const PREFIX = "z!";

if (!TOKEN) {
  console.error("ERRO: variável DISCORD_TOKEN não encontrada.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember
  ]
});

const groq = GROQ_API_KEY
  ? new Groq({ apiKey: GROQ_API_KEY })
  : null;

// ==========================================
// ARQUIVOS
// ==========================================

const DATA_PATH = path.join(__dirname, "data.json");

function defaultData() {
  return {
    version: 4,
    guilds: {},
    tickets: {},
    ticketCounters: {},
    feedbacks: {},
    warnings: {},
    products: {},
    purchases: {},
    aiHistory: {},
    publications: {},
    termsAcceptances: {},
    moderationLogs: {},
    ticketTranscripts: {},
    userSettings: {}
  };
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(
        DATA_PATH,
        JSON.stringify(defaultData(), null, 2)
      );
    }

    const saved = JSON.parse(
      fs.readFileSync(DATA_PATH, "utf8")
    );

    return {
      ...defaultData(),
      ...saved
    };
  } catch (error) {
    console.error("Erro lendo data.json:", error);
    process.exit(1);
  }
}

let data = loadData();

let saveTimer = null;

function saveData() {
  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    const temporary = DATA_PATH + ".tmp";

    try {
      fs.writeFileSync(
        temporary,
        JSON.stringify(data, null, 2)
      );

      fs.renameSync(temporary, DATA_PATH);
    } catch (error) {
      console.error("Erro salvando data.json:", error);
    }
  }, 300);
}

// ==========================================
// EMOJIS PERSONALIZADOS
// ==========================================

const EMOJI = {
  alert: "<:alerta:1552010624513482823>",
  warning: "<a:alerta:1552007804569653360>",
  ticket: "<:ticket_fallens:1552761934733119709>",
  support: "<:suporte_emoji:1552508765176074270>",
  config: "<:config:1552010601688080457>",
  yes: "<:positivo:1550347075089211432>",
  no: "<:negativo:1550347078893441114>",
  online: "<a:Online:1552007801017204736>",
  shield: "<:security:1552010618163167306>",
  lock: "<:fechadura:1552508769752317994>",
  close: "<:lixo:1552009637170253894>",
  document: "<:documento:1552009636251566130>",
  like: "<:like:1552007813709172766>",
  cart: "<:Carrinho:1552009619046531154>",
  clock: "<:horrio:1550347082634760202>",
  member: "<:servidor:1552763006214217879>",
  link: "<:link:1552009621999452160>"
};

// ==========================================
// CONFIGURAÇÃO PADRÃO DO SERVIDOR
// ==========================================

function defaultGuildConfig() {
  return {
    configManagerRoleId: null,
    supportRoleId: null,
    moderationRoleId: null,

    welcomeChannelId: null,
    leaveChannelId: null,
    logChannelId: null,

    ai: {
      enabled: false,
      channelId: null,
      model: "llama-3.3-70b-versatile",
      maxHistory: 12,
      systemPrompt:
        "Você é o assistente oficial do servidor. Responda em português brasileiro, com educação e clareza."
    },

    ticket: {
      enabled: true,
      panelChannelId: null,
      panelMessageId: null,
      panelTitle: "Central de atendimento",
      panelDescription: "Selecione uma categoria para abrir seu atendimento.",
      panelImage: null,
      categoryId: null,
      supportRoleId: null,
      mode: "channel",
      nameTemplate: "🎫・{categoria}-{usuario}-{id}",
      counter: 0,

      categories: [
        {
          id: "comprar",
          label: "Comprar",
          description: "Atendimento para compras",
          emoji: "🛒",
          categoryId: null,
          supportRoleId: null
        },
        {
          id: "suporte",
          label: "Suporte",
          description: "Precisa de ajuda?",
          emoji: "🎫",
          categoryId: null,
          supportRoleId: null
        }
      ]
    },

    security: {
      antiSpam: false,
      antiLinks: false,
      honeypotChannelId: null,
      honeypotAction: "timeout"
    },

    publications: {
      rules: {
        channelId: null,
        messageId: null,
        title: "Regras do servidor",
        content: "",
        image: null,
        version: 1
      },

      terms: {
        channelId: null,
        messageId: null,
        title: "Termos de uso",
        content: "",
        image: null,
        version: 1
      },

      announcements: {
        channelId: null,
        messageId: null,
        title: "Aviso",
        content: "",
        image: null
      },

      feedbacks: {
        channelId: null,
        messageId: null,
        title: "Avalie nosso atendimento",
        content: "",
        image: null
      }
    }
  };
}

function getGuild(guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = defaultGuildConfig();
    saveData();
  }

  return data.guilds[guildId];
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function isOwnerOrAdmin(interaction) {
  if (!interaction.guild || !interaction.member) {
    return false;
  }

  if (interaction.user.id === OWNER_ID) {
    return true;
  }

  const permissions = interaction.member.permissions;

  if (permissions?.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const cfg = getGuild(interaction.guild.id);

  return Boolean(
    cfg.configManagerRoleId &&
    interaction.member.roles?.cache?.has(
      cfg.configManagerRoleId
    )
  );
}

function isStaff(member, cfg) {
  if (!member) return false;

  if (member.id === OWNER_ID) return true;

  if (
    member.permissions?.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return true;
  }

  const roles = [
    cfg.supportRoleId,
    cfg.ticket?.supportRoleId
  ].filter(Boolean);

  for (const category of cfg.ticket?.categories || []) {
    if (category.supportRoleId) {
      roles.push(category.supportRoleId);
    }
  }

  return roles.some(roleId =>
    member.roles?.cache?.has(roleId)
  );
}

function getPublication(guildId, type) {
  const cfg = getGuild(guildId);

  if (!cfg.publications[type]) {
    cfg.publications[type] = {
      channelId: null,
      messageId: null,
      title: "",
      content: "",
      image: null,
      version: 1
    };
  }

  return cfg.publications[type];
}

function formatTicketName(template, values) {
  let result = template;

  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(
      `{${key}}`,
      String(value)
    );
  }

  return result
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\-_🎫・]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function safeMentionRole(roleId) {
  return roleId ? `<@&${roleId}>` : "";
}

function safeMentionUser(userId) {
  return userId ? `<@${userId}>` : "";
}

// ==========================================
// GROQ - INTELIGÊNCIA ARTIFICIAL
// ==========================================

async function askAI(message) {
  if (!groq) {
    throw new Error("GROQ_API_KEY não configurada.");
  }

  const cfg = getGuild(message.guild.id);

  const historyKey =
    `${message.guild.id}:${message.channel.id}:${message.author.id}`;

  if (!data.aiHistory[historyKey]) {
    data.aiHistory[historyKey] = [];
  }

  const history = data.aiHistory[historyKey];

  const userText = message.content
    .replace(/<@!?\d+>/g, "")
    .trim();

  history.push({
    role: "user",
    content: userText
  });

  const messages = [
    {
      role: "system",
      content: cfg.ai.systemPrompt
    },
    ...history.slice(-cfg.ai.maxHistory)
  ];

  try {
    const response = await groq.chat.completions.create({
      model: cfg.ai.model || "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 900
    });

    const answer =
      response.choices?.[0]?.message?.content ||
      "Não consegui gerar uma resposta.";

    history.push({
      role: "assistant",
      content: answer
    });

    data.aiHistory[historyKey] = history.slice(-24);

    saveData();

    return answer;
  } catch (error) {
    console.error("Erro na Groq:", {
      status: error.status,
      code: error.code,
      message: error.message
    });

    throw error;
  }
}

function aiErrorMessage(error) {
  if (error.status === 429) {
    return "A Groq atingiu o limite de utilização. Tente novamente mais tarde.";
  }

  if (error.status === 401) {
    return "A chave GROQ_API_KEY é inválida ou foi revogada.";
  }

  if (error.status === 403) {
    return "A API não autorizou esta solicitação.";
  }

  if (error.status === 404) {
    return "O modelo configurado não foi encontrado.";
  }

  return "Não foi possível conectar à IA. Confira o console da hospedagem.";
}

// ==========================================
// COMPONENTES V2
// ==========================================

function textDisplay(content) {
  return new TextDisplayBuilder().setContent(content);
}

function container(content, image = null) {
  const box = new ContainerBuilder();

  box.addTextDisplayComponents(
    textDisplay(content)
  );

  if (image) {
    box.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(image)
      )
    );
  }

  return box;
}

async function sendV2(channel, content, options = {}) {
  const components = [
    container(content, options.image || null)
  ];

  return channel.send({
    components,
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: options.allowedMentions || {
      parse: []
    }
  });
}

async function replyV2(interaction, content, options = {}) {
  const payload = {
    components: [
      container(content, options.image || null)
    ],
    flags:
      MessageFlags.IsComponentsV2 |
      (options.ephemeral ? MessageFlags.Ephemeral : 0),
    allowedMentions: options.allowedMentions || {
      parse: []
    }
  };

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp(payload);
  }

  return interaction.reply(payload);
}

// ==========================================
// CONTROLE DE TICKETS
// ==========================================

function getTicketByUser(guildId, userId) {
  return Object.entries(data.tickets).find(
    ([, ticket]) =>
      ticket.guildId === guildId &&
      ticket.userId === userId &&
      !ticket.closed
  );
}

function nextTicketNumber(guildId) {
  const cfg = getGuild(guildId);

  cfg.ticket.counter =
    Number(cfg.ticket.counter || 0) + 1;

  saveData();

  return String(cfg.ticket.counter).padStart(4, "0");
}

function getTicketCategory(cfg, categoryId) {
  return cfg.ticket.categories.find(
    category => category.id === categoryId
  );
}

function ticketRole(category, cfg) {
  return (
    category?.supportRoleId ||
    cfg.ticket.supportRoleId ||
    cfg.supportRoleId ||
    null
  );
}

function ticketParent(category, cfg) {
  return (
    category?.categoryId ||
    cfg.ticket.categoryId ||
    null
  );
}

// ==========================================
// FIM DA PARTE 1
// A PARTE 2 CONTINUA DEPOIS DESTA LINHA
// ==========================================
// ==========================================
// ZYPHOR BOT V4 - PARTE 2
// TICKETS, PAINEL BHL E PUBLICAÇÕES
// ==========================================

// ==========================================
// CRIAÇÃO DE TICKETS
// ==========================================

async function createTicket(interaction, categoryId) {
  const guild = interaction.guild;
  const cfg = getGuild(guild.id);
  const category = getTicketCategory(cfg, categoryId);

  if (!category) {
    return replyV2(interaction, "Categoria de ticket não encontrada.", {
      ephemeral: true
    });
  }

  const existing = getTicketByUser(guild.id, interaction.user.id);

  if (existing) {
    return replyV2(
      interaction,
      `${EMOJI.warning} Você já possui um ticket aberto: <#${existing[0]}>`,
      { ephemeral: true }
    );
  }

  const parentId = ticketParent(category, cfg);
  const supportRoleId = ticketRole(category, cfg);

  let parent = null;

  if (parentId) {
    parent = await guild.channels.fetch(parentId).catch(() => null);

    if (!parent || parent.type !== ChannelType.GuildCategory) {
      return replyV2(
        interaction,
        "A categoria configurada não existe ou não é uma categoria do Discord.",
        { ephemeral: true }
      );
    }
  }

  const number = nextTicketNumber(guild.id);

  const channelName = formatTicketName(
    cfg.ticket.nameTemplate,
    {
      categoria: category.id,
      usuario: interaction.user.username,
      id: number,
      user_id: interaction.user.id,
      username: interaction.user.username
    }
  );

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  try {
    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [
          PermissionFlagsBits.ViewChannel
        ]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      },
      {
        id: client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.AttachFiles
        ]
      }
    ];

    if (supportRoleId) {
      permissionOverwrites.push({
        id: supportRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      });
    }

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: parentId || null,
      permissionOverwrites,
      reason: `Ticket ${number} aberto por ${interaction.user.tag}`
    });

    data.tickets[channel.id] = {
      guildId: guild.id,
      channelId: channel.id,
      userId: interaction.user.id,
      username: interaction.user.username,
      categoryId: category.id,
      categoryName: category.label,
      number,
      supportRoleId,
      claimedBy: null,
      closed: false,
      createdAt: Date.now(),
      transcript: []
    };

    saveData();

    const mention = supportRoleId
      ? `<@&${supportRoleId}>`
      : "";

    const welcome =
      `# ${EMOJI.ticket} Atendimento aberto\n` +
      `Olá, <@${interaction.user.id}>!\n\n` +
      `**Categoria:** ${category.label}\n` +
      `**Ticket:** #${number}\n` +
      `**Responsável:** ${mention || "Equipe de suporte"}\n\n` +
      "Aguarde um membro da equipe para iniciar seu atendimento.";

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:claim")
        .setLabel("Atender")
        .setEmoji("🤝")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("ticket:add")
        .setLabel("Adicionar membro")
        .setEmoji("👤")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket:close")
        .setLabel("Fechar")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      components: [
        container(welcome)
      ],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: {
        parse: [],
        users: [interaction.user.id],
        roles: supportRoleId ? [supportRoleId] : []
      }
    });

    await channel.send({
      content: mention || "Equipe de suporte",
      allowedMentions: {
        parse: [],
        roles: supportRoleId ? [supportRoleId] : []
      },
      components: [buttons]
    });

    await interaction.editReply({
      content: `${EMOJI.yes} Seu ticket foi criado: ${channel}`
    });

  } catch (error) {
    console.error("Erro criando ticket:", error);

    await interaction.editReply({
      content: `${EMOJI.alert} Não consegui criar o ticket. Confira as permissões do bot.`
    });
  }
}

// ==========================================
// PAINEL BHL DE TICKETS
// ==========================================

function ticketPanelComponents(cfg) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket:create")
    .setPlaceholder("Selecione o tipo de atendimento")
    .setMinValues(1)
    .setMaxValues(1);

  for (const category of cfg.ticket.categories.slice(0, 25)) {
    menu.addOptions({
      label: category.label.slice(0, 100),
      description: (category.description || "Abrir atendimento").slice(0, 100),
      value: category.id,
      emoji: category.emoji || "🎫"
    });
  }

  return [
    new ActionRowBuilder().addComponents(menu)
  ];
}

async function publishTicketPanel(interaction) {
  const cfg = getGuild(interaction.guild.id);
  const channelId = cfg.ticket.panelChannelId;

  if (!channelId) {
    return replyV2(interaction, "Configure o canal do painel primeiro.", {
      ephemeral: true
    });
  }

  const channel = await interaction.guild.channels.fetch(channelId)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return replyV2(interaction, "Canal inválido.", {
      ephemeral: true
    });
  }

  const content =
    `# ${EMOJI.ticket} ${cfg.ticket.panelTitle}\n` +
    `${cfg.ticket.panelDescription}\n\n` +
    "Selecione abaixo a categoria desejada para abrir seu ticket.";

  const payload = {
    components: [
      container(content, cfg.ticket.panelImage)
    ],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] }
  };

  let message = null;

  if (cfg.ticket.panelMessageId) {
    message = await channel.messages.fetch(
      cfg.ticket.panelMessageId
    ).catch(() => null);
  }

  if (message) {
    await message.edit({
      ...payload,
      components: [
        container(content, cfg.ticket.panelImage),
        ...ticketPanelComponents(cfg)
      ]
    });
  } else {
    message = await channel.send({
      ...payload,
      components: [
        container(content, cfg.ticket.panelImage),
        ...ticketPanelComponents(cfg)
      ]
    });
  }

  cfg.ticket.panelMessageId = message.id;
  saveData();

  return replyV2(interaction, `${EMOJI.yes} Painel de tickets publicado ou atualizado.`);
}

// ==========================================
// TRANSCRIÇÃO
// ==========================================

async function createTranscript(channel) {
  const messages = await channel.messages.fetch({
    limit: 100
  });

  const ordered = [...messages.values()].reverse();

  const transcript = ordered.map(message => ({
    author: message.author?.tag || "Desconhecido",
    userId: message.author?.id || null,
    content: message.content || "[Mensagem sem texto]",
    timestamp: message.createdAt.toISOString(),
    attachments: [...message.attachments.values()].map(
      attachment => attachment.url
    )
  }));

  return transcript;
}

// ==========================================
// FECHAMENTO DE TICKET
// ==========================================

async function closeTicket(interaction) {
  const channel = interaction.channel;
  const ticket = data.tickets[channel.id];

  if (!ticket || ticket.closed) {
    return replyV2(interaction, "Este ticket não está aberto.", {
      ephemeral: true
    });
  }

  const cfg = getGuild(interaction.guild.id);

  if (!isStaff(interaction.member, cfg)) {
    return replyV2(
      interaction,
      `${EMOJI.no} Somente a equipe de suporte pode fechar tickets.`,
      { ephemeral: true }
    );
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  try {
    const transcript = await createTranscript(channel);

    ticket.closed = true;
    ticket.closedAt = Date.now();
    ticket.closedBy = interaction.user.id;
    ticket.transcript = transcript;

    data.ticketTranscripts[channel.id] = transcript;

    saveData();

    if (cfg.logChannelId) {
      const logChannel = await interaction.guild.channels.fetch(
        cfg.logChannelId
      ).catch(() => null);

      if (logChannel?.isTextBased()) {
        await sendV2(
          logChannel,
          `# ${EMOJI.document} Ticket fechado\n` +
          `**Número:** #${ticket.number}\n` +
          `**Usuário:** <@${ticket.userId}>\n` +
          `**Fechado por:** <@${interaction.user.id}>\n` +
          `**Categoria:** ${ticket.categoryName}\n` +
          `**Mensagens registradas:** ${transcript.length}`
        );
      }
    }

    await interaction.editReply({
      content: `${EMOJI.yes} Ticket registrado. O canal será excluído em alguns segundos.`
    });

    setTimeout(async () => {
      await channel.delete("Ticket encerrado e transcrito.")
        .catch(error => console.error("Erro excluindo ticket:", error));
    }, 5000);

  } catch (error) {
    console.error("Erro fechando ticket:", error);

    ticket.closed = false;
    saveData();

    await interaction.editReply({
      content: `${EMOJI.alert} Não consegui finalizar o ticket.`
    });
  }
}

// ==========================================
// ADICIONAR MEMBRO AO TICKET
// ==========================================

async function showAddMember(interaction) {
  const ticket = data.tickets[interaction.channel.id];

  if (!ticket || ticket.closed) {
    return replyV2(interaction, "Ticket inválido.", {
      ephemeral: true
    });
  }

  const cfg = getGuild(interaction.guild.id);

  if (!isStaff(interaction.member, cfg)) {
    return replyV2(interaction, "Somente a equipe pode adicionar membros.", {
      ephemeral: true
    });
  }

  const menu = new UserSelectMenuBuilder()
    .setCustomId("ticket:addmember")
    .setPlaceholder("Selecione quem terá acesso")
    .setMinValues(1)
    .setMaxValues(5);

  return interaction.reply({
    content: "Selecione os membros que terão acesso ao ticket.",
    components: [
      new ActionRowBuilder().addComponents(menu)
    ],
    flags: MessageFlags.Ephemeral
  });
}

async function addTicketMembers(interaction) {
  const ticket = data.tickets[interaction.channel.id];

  if (!ticket || ticket.closed) {
    return replyV2(interaction, "Ticket inválido.", {
      ephemeral: true
    });
  }

  const cfg = getGuild(interaction.guild.id);

  if (!isStaff(interaction.member, cfg)) {
    return replyV2(interaction, "Você não pode adicionar membros.", {
      ephemeral: true
    });
  }

  for (const userId of interaction.values) {
    if (userId === ticket.userId) continue;

    await interaction.channel.permissionOverwrites.edit(userId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });
  }

  return replyV2(interaction, `${EMOJI.yes} Membros adicionados ao ticket.`, {
    ephemeral: true
  });
}

// ==========================================
// ATENDER TICKET
// ==========================================

async function claimTicket(interaction) {
  const ticket = data.tickets[interaction.channel.id];

  if (!ticket || ticket.closed) {
    return replyV2(interaction, "Ticket inválido.", {
      ephemeral: true
    });
  }

  const cfg = getGuild(interaction.guild.id);

  if (!isStaff(interaction.member, cfg)) {
    return replyV2(interaction, "Somente o suporte pode atender.", {
      ephemeral: true
    });
  }

  if (ticket.claimedBy) {
    return replyV2(
      interaction,
      `Este ticket já está sendo atendido por <@${ticket.claimedBy}>.`,
      {
        ephemeral: true,
        allowedMentions: {
          parse: [],
          users: [ticket.claimedBy]
        }
      }
    );
  }

  ticket.claimedBy = interaction.user.id;
  saveData();

  await interaction.channel.send({
    content:
      `${EMOJI.support} <@${interaction.user.id}> assumiu este atendimento.`,
    allowedMentions: {
      parse: [],
      users: [interaction.user.id]
    }
  });

  return replyV2(interaction, `${EMOJI.yes} Você assumiu o ticket.`, {
    ephemeral: true
  });
}

// ==========================================
// FEEDBACKS
// ==========================================

function feedbackButtons(ticketId) {
  const row = new ActionRowBuilder();

  for (let rating = 1; rating <= 5; rating++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`feedback:${ticketId}:${rating}`)
        .setLabel(String(rating))
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return row;
}

async function askFeedback(ticket) {
  const user = await client.users.fetch(ticket.userId)
    .catch(() => null);

  if (!user) return;

  await user.send({
    content:
      `⭐ Como foi seu atendimento?\n` +
      `Ticket: #${ticket.number}\n` +
      "Escolha uma nota de 1 a 5.",
    components: [
      feedbackButtons(ticket.channelId)
    ]
  }).catch(() => null);
}

async function saveFeedback(interaction) {
  const [, ticketId, ratingText] = interaction.customId.split(":");
  const rating = Number(ratingText);

  const ticket = data.tickets[ticketId];

  if (!ticket) {
    return replyV2(interaction, "Ticket não encontrado.", {
      ephemeral: true
    });
  }

  if (ticket.userId !== interaction.user.id) {
    return replyV2(interaction, "Somente o autor pode avaliar.", {
      ephemeral: true
    });
  }

  if (!data.feedbacks[ticketId]) {
    data.feedbacks[ticketId] = [];
  }

  if (data.feedbacks[ticketId].some(
    item => item.userId === interaction.user.id
  )) {
    return replyV2(interaction, "Você já avaliou este atendimento.", {
      ephemeral: true
    });
  }

  data.feedbacks[ticketId].push({
    userId: interaction.user.id,
    rating,
    createdAt: Date.now()
  });

  saveData();

  return replyV2(
    interaction,
    `${EMOJI.yes} Obrigado pela avaliação de ${rating}/5!`,
    { ephemeral: true }
  );
}

// ==========================================
// BHL - PUBLICAÇÕES
// ==========================================

async function publishPublication(interaction, type) {
  const cfg = getGuild(interaction.guild.id);
  const publication = getPublication(interaction.guild.id, type);

  if (!publication.channelId) {
    return replyV2(interaction, "Configure o canal primeiro.", {
      ephemeral: true
    });
  }

  const channel = await interaction.guild.channels.fetch(
    publication.channelId
  ).catch(() => null);

  if (!channel?.isTextBased()) {
    return replyV2(interaction, "Canal de publicação inválido.", {
      ephemeral: true
    });
  }

  const content =
    `# ${publication.title || "Publicação"}\n` +
    `${publication.content || "Nenhum conteúdo configurado."}`;

  const components = [
    container(content, publication.image)
  ];

  if (type === "terms") {
    components.push(
      new ContainerBuilder()
        .addTextDisplayComponents(
          textDisplay("Ao aceitar, você confirma que leu os termos.")
        )
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("terms:accept")
              .setLabel("Li e aceito os termos")
              .setEmoji("✅")
              .setStyle(ButtonStyle.Success)
          )
        )
    );
  }

  const payload = {
    components,
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] }
  };

  let oldMessage = null;

  if (publication.messageId) {
    oldMessage = await channel.messages.fetch(
      publication.messageId
    ).catch(() => null);
  }

  let message;

  if (oldMessage) {
    message = await oldMessage.edit(payload);
  } else {
    message = await channel.send(payload);
  }

  publication.messageId = message.id;
  saveData();

  return replyV2(
    interaction,
    `${EMOJI.yes} Publicação ${type} publicada ou atualizada.`,
    { ephemeral: true }
  );
}

// ==========================================
// ACEITE DOS TERMOS
// ==========================================

async function acceptTerms(interaction) {
  const cfg = getGuild(interaction.guild.id);
  const terms = cfg.publications.terms;

  const key = `${interaction.guild.id}:${interaction.user.id}`;

  data.termsAcceptances[key] = {
    userId: interaction.user.id,
    guildId: interaction.guild.id,
    version: terms.version,
    acceptedAt: Date.now()
  };

  saveData();

  return replyV2(
    interaction,
    `${EMOJI.yes} Você aceitou os termos da versão ${terms.version}.`,
    { ephemeral: true }
  );
}

// ==========================================
// FIM DA PARTE 2
// A PARTE 3 CONTINUA DEPOIS DESTA LINHA
// ==========================================
// ============================================
// ZYPHOR BOT V4 - PARTE 3/3
// CONFIG, MENUS, MODAIS E EVENTOS
// ============================================

// ---------- PAINEL PRINCIPAL DE CONFIGURAÇÃO ----------

function configMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("config:menu")
    .setPlaceholder("Escolha o que deseja configurar")
    .addOptions(
      { label: "Sistema de tickets", value: "tickets", emoji: "🎫" },
      { label: "Cargos e permissões", value: "roles", emoji: "🛡️" },
      { label: "Publicações BHL", value: "publications", emoji: "📢" },
      { label: "Segurança e proteção", value: "security", emoji: "🔒" },
      { label: "Inteligência artificial", value: "ai", emoji: "🤖" },
      { label: "Boas-vindas e saídas", value: "welcome", emoji: "👋" },
      { label: "Logs do servidor", value: "logs", emoji: "📋" }
    );

  return [new ActionRowBuilder().addComponents(menu)];
}

async function openConfig(interaction) {
  if (!interaction.guild) {
    return interaction.reply({
      content: "Esse painel só pode ser usado dentro de um servidor.",
      ephemeral: true
    });
  }

  if (!isOwnerOrAdmin(interaction)) {
    return interaction.reply({
      content: "Você não tem permissão para configurar o ZYPhor Bot.",
      ephemeral: true
    });
  }

  return interaction.reply({
    content:
      "⚙️ **ZYPhor Bot — Configurações**\n" +
      "Selecione uma área abaixo para configurar o bot neste servidor.",
    components: configMenu(),
    ephemeral: true
  });
}

// ---------- MODAIS ----------

function makeModal(id, title, fields) {
  const modal = new ModalBuilder()
    .setCustomId(id)
    .setTitle(title);

  for (const field of fields) {
    const input = new TextInputBuilder()
      .setCustomId(field.id)
      .setLabel(field.label)
      .setStyle(field.style || TextInputStyle.Short)
      .setRequired(field.required ?? false);

    if (field.placeholder) input.setPlaceholder(field.placeholder);
    if (field.value) input.setValue(String(field.value));
    if (field.maxLength) input.setMaxLength(field.maxLength);

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );
  }

  return modal;
}

function configText(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

// ---------- CONFIGURAÇÃO DE TICKETS ----------

async function showTicketConfig(interaction) {
  const cfg = getGuild(interaction.guildId);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("config:ticket:action")
    .setPlaceholder("Escolha uma configuração")
    .addOptions(
      { label: "Canal do painel de tickets", value: "panel", emoji: "📨" },
      { label: "Categoria onde os tickets serão criados", value: "category", emoji: "📁" },
      { label: "Cargo da equipe de suporte", value: "role", emoji: "🛡️" },
      { label: "Editar modelo do nome do ticket", value: "name", emoji: "✏️" },
      { label: "Publicar ou atualizar painel", value: "publish", emoji: "📌" }
    );

  return interaction.update({
    content:
      "🎫 **Configuração de tickets**\n" +
      "Escolha o que deseja alterar.",
    components: [new ActionRowBuilder().addComponents(menu)]
  });
}

async function showTicketNameModal(interaction) {
  const cfg = getGuild(interaction.guildId);

  return interaction.showModal(makeModal(
    "config:ticket:name:save",
    "Modelo do nome do ticket",
    [{
      id: "template",
      label: "Modelo do canal",
      required: true,
      maxLength: 90,
      value: cfg.ticket.nameTemplate ||
        "ticket-{categoria}-{usuario}-{id}",
      placeholder: "ticket-{categoria}-{usuario}-{id}"
    }]
  ));
}

// ---------- CONFIGURAÇÃO DE PUBLICAÇÕES BHL ----------

async function showPublicationConfig(interaction) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("config:pub:type")
    .setPlaceholder("Escolha o tipo de publicação")
    .addOptions(
      { label: "Regras", value: "rules", emoji: "📜" },
      { label: "Termos de uso", value: "terms", emoji: "📄" },
      { label: "Avisos e anúncios", value: "announcements", emoji: "📢" },
      { label: "Painel de feedbacks", value: "feedbacks", emoji: "⭐" }
    );

  return interaction.update({
    content:
      "📢 **Publicações BHL**\n" +
      "Escolha o tipo de publicação que deseja editar.",
    components: [new ActionRowBuilder().addComponents(menu)]
  });
}

async function showPublicationModal(interaction, type) {
  const publication = getPublication(interaction.guildId, type) || {};

  return interaction.showModal(makeModal(
    `config:pub:save:${type}`,
    "Editar publicação BHL",
    [
      {
        id: "title",
        label: "Título",
        required: true,
        maxLength: 100,
        value: publication.title || ""
      },
      {
        id: "content",
        label: "Texto da publicação",
        style: TextInputStyle.Paragraph,
        required: true,
        maxLength: 4000,
        value: publication.content || ""
      },
      {
        id: "image",
        label: "URL da imagem (opcional)",
        required: false,
        maxLength: 500,
        value: publication.imageUrl || ""
      }
    ]
  ));
}

// ---------- CONFIGURAÇÃO DE SEGURANÇA ----------

async function showSecurityConfig(interaction) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("config:security:action")
    .setPlaceholder("Escolha uma configuração")
    .addOptions(
      { label: "Configurar canal Honeypot", value: "honeypot", emoji: "🍯" },
      { label: "Configurar proteção contra links", value: "links", emoji: "🔗" },
      { label: "Configurar proteção contra spam", value: "spam", emoji: "🚫" }
    );

  return interaction.update({
    content:
      "🔒 **Segurança do servidor**\n" +
      "Configure os sistemas de proteção.",
    components: [new ActionRowBuilder().addComponents(menu)]
  });
}

// ---------- CONFIGURAÇÃO DE CARGOS ----------

async function showRoleConfig(interaction) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("config:roles:action")
    .setPlaceholder("Escolha o cargo que deseja configurar")
    .addOptions(
      { label: "Cargo da equipe de suporte", value: "support", emoji: "🎫" },
      { label: "Cargo de gerenciamento da configuração", value: "manager", emoji: "⚙️" },
      { label: "Cargo de moderação", value: "moderation", emoji: "🛡️" }
    );

  return interaction.update({
    content:
      "🛡️ **Cargos e permissões**\n" +
      "Selecione qual cargo deseja definir.",
    components: [new ActionRowBuilder().addComponents(menu)]
  });
}

// ---------- CONFIGURAÇÃO DE IA ----------

async function showAIConfig(interaction) {
  const cfg = getGuild(interaction.guildId);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("config:ai:action")
    .setPlaceholder("Configurações da IA")
    .addOptions(
      { label: "Ativar IA", value: "on", emoji: "🟢" },
      { label: "Desativar IA", value: "off", emoji: "🔴" },
      { label: "Configurar personalidade", value: "personality", emoji: "🧠" }
    );

  return interaction.update({
    content:
      `🤖 **Inteligência artificial**\n` +
      `Status: **${cfg.ai?.enabled ? "Ativada" : "Desativada"}**\n` +
      `Provedor: **Groq**`,
    components: [new ActionRowBuilder().addComponents(menu)]
  });
}

// ---------- CONFIGURAÇÃO DE BOAS-VINDAS ----------

async function showWelcomeConfig(interaction) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("config:welcome:action")
    .setPlaceholder("Escolha uma configuração")
    .addOptions(
      { label: "Canal de boas-vindas", value: "welcome", emoji: "👋" },
      { label: "Canal de saída", value: "leave", emoji: "🚪" }
    );

  return interaction.update({
    content:
      "👋 **Boas-vindas e saídas**\n" +
      "Escolha onde o bot deve enviar as mensagens.",
    components: [new ActionRowBuilder().addComponents(menu)]
  });
}

// ---------- CONFIGURAÇÃO DE LOGS ----------

async function showLogsConfig(interaction) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("config:logs:action")
    .setPlaceholder("Escolha o canal de logs")
    .addOptions(
      { label: "Logs gerais", value: "general", emoji: "📋" },
      { label: "Logs de segurança", value: "security", emoji: "🔒" },
      { label: "Logs de tickets", value: "tickets", emoji: "🎫" }
    );

  return interaction.update({
    content:
      "📋 **Configuração de logs**\n" +
      "Selecione o tipo de log que deseja configurar.",
    components: [new ActionRowBuilder().addComponents(menu)]
  });
}

// ---------- SELETORES DE CANAIS E CARGOS ----------

function channelPicker(id, placeholder, channelTypes) {
  const picker = new ChannelSelectMenuBuilder()
    .setCustomId(id)
    .setPlaceholder(placeholder)
    .setMinValues(1)
    .setMaxValues(1);

  if (channelTypes) picker.setChannelTypes(...channelTypes);

  return [new ActionRowBuilder().addComponents(picker)];
}

function rolePicker(id, placeholder) {
  const picker = new RoleSelectMenuBuilder()
    .setCustomId(id)
    .setPlaceholder(placeholder)
    .setMinValues(1)
    .setMaxValues(1);

  return [new ActionRowBuilder().addComponents(picker)];
}

// ---------- TRATAMENTO DOS MENUS ----------

async function handleConfigSelect(interaction) {
  const cfg = getGuild(interaction.guildId);
  const value = interaction.values[0];

  if (!isOwnerOrAdmin(interaction)) {
    return interaction.reply({
      content: "Você não tem permissão para alterar essas configurações.",
      ephemeral: true
    });
  }

  if (interaction.customId === "config:menu") {
    if (value === "tickets") return showTicketConfig(interaction);
    if (value === "roles") return showRoleConfig(interaction);
    if (value === "publications") return showPublicationConfig(interaction);
    if (value === "security") return showSecurityConfig(interaction);
    if (value === "ai") return showAIConfig(interaction);
    if (value === "welcome") return showWelcomeConfig(interaction);
    if (value === "logs") return showLogsConfig(interaction);
  }

  if (interaction.customId === "config:ticket:action") {
    if (value === "panel") {
      return interaction.update({
        content: "📨 Selecione o canal onde o painel de tickets será publicado.",
        components: channelPicker(
          "config:ticket:panel:channel",
          "Selecionar canal",
          [ChannelType.GuildText]
        )
      });
    }

    if (value === "category") {
      return interaction.update({
        content: "📁 Selecione a categoria onde os tickets serão criados.",
        components: channelPicker(
          "config:ticket:parent:channel",
          "Selecionar categoria",
          [ChannelType.GuildCategory]
        )
      });
    }

    if (value === "role") {
      return interaction.update({
        content: "🛡️ Selecione o cargo da equipe de suporte.",
        components: rolePicker(
          "config:ticket:support:role",
          "Selecionar cargo"
        )
      });
    }

    if (value === "name") return showTicketNameModal(interaction);

    if (value === "publish") {
      if (!cfg.ticket.panelChannelId) {
        return interaction.update({
          content: "Configure primeiro o canal do painel de tickets.",
          components: configMenu()
        });
      }

      await publishTicketPanel(interaction);

      return;
    }
  }

  if (interaction.customId === "config:pub:type") {
    return showPublicationModal(interaction, value);
  }

  if (interaction.customId === "config:security:action") {
    if (value === "honeypot") {
      return interaction.update({
        content: "🍯 Selecione o canal que será usado como Honeypot.",
        components: channelPicker(
          "config:security:honeypot:channel",
          "Selecionar canal",
          [ChannelType.GuildText]
        )
      });
    }

    if (value === "links" || value === "spam") {
      return interaction.showModal(makeModal(
        `config:security:save:${value}`,
        value === "links" ? "Proteção contra links" : "Proteção contra spam",
        [{
          id: "enabled",
          label: "Ativado? Digite sim ou nao",
          required: true,
          maxLength: 3,
          placeholder: "sim"
        }]
      ));
    }
  }

  if (interaction.customId === "config:roles:action") {
    return interaction.update({
      content: "Selecione o cargo desejado.",
      components: rolePicker(
        `config:roles:pick:${value}`,
        "Selecionar cargo"
      )
    });
  }

  if (interaction.customId === "config:ai:action") {
    cfg.ai = cfg.ai || {};

    if (value === "on") {
      if (!groq) {
        return interaction.reply({
          content: "A IA não pode ser ativada: a chave GROQ_API_KEY não foi configurada na Fadehost.",
          ephemeral: true
        });
      }

      cfg.ai.enabled = true;
      saveData();

      return interaction.update({
        content: "🟢 IA ativada. O bot poderá responder nos canais configurados.",
        components: configMenu()
      });
    }

    if (value === "off") {
      cfg.ai.enabled = false;
      saveData();

      return interaction.update({
        content: "🔴 IA desativada.",
        components: configMenu()
      });
    }

    if (value === "personality") {
      return interaction.showModal(makeModal(
        "config:ai:personality:save",
        "Personalidade da IA",
        [{
          id: "personality",
          label: "Como a IA deve responder?",
          style: TextInputStyle.Paragraph,
          required: true,
          maxLength: 1500,
          value: cfg.ai.personality || "Seja educada, útil e objetiva."
        }]
      ));
    }
  }

  if (interaction.customId === "config:welcome:action") {
    return interaction.update({
      content: "Selecione o canal desejado.",
      components: channelPicker(
        `config:welcome:pick:${value}`,
        "Selecionar canal",
        [ChannelType.GuildText]
      )
    });
  }

  if (interaction.customId === "config:logs:action") {
    return interaction.update({
      content: "Selecione o canal de logs.",
      components: channelPicker(
        `config:logs:pick:${value}`,
        "Selecionar canal",
        [ChannelType.GuildText]
      )
    });
  }

  if (interaction.customId === "ticket:create") {
    return createTicket(interaction, value);
  }

  if (interaction.customId === "ticket:addmember") {
    return addTicketMembers(interaction);
  }
}

// ---------- TRATAMENTO DOS SELETORES DE CANAIS ----------

async function handleChannelSelect(interaction) {
  const cfg = getGuild(interaction.guildId);
  const channelId = interaction.values[0];
  const id = interaction.customId;

  if (!isOwnerOrAdmin(interaction)) {
    return interaction.reply({
      content: "Você não tem permissão para fazer isso.",
      ephemeral: true
    });
  }

  if (id === "config:ticket:panel:channel") {
    cfg.ticket.panelChannelId = channelId;
    saveData();

    return interaction.update({
      content: `✅ Canal do painel definido: <#${channelId}>`,
      components: configMenu()
    });
  }

  if (id === "config:ticket:parent:channel") {
    cfg.ticket.categoryId = channelId;
    saveData();

    return interaction.update({
      content: `✅ Categoria dos tickets definida: <#${channelId}>`,
      components: configMenu()
    });
  }

  if (id === "config:security:honeypot:channel") {
    cfg.security = cfg.security || {};
    cfg.security.honeypotChannelId = channelId;
    saveData();

    return interaction.update({
      content: `✅ Canal Honeypot definido: <#${channelId}>`,
      components: configMenu()
    });
  }

  if (id.startsWith("config:welcome:pick:")) {
    const type = id.split(":").pop();

    cfg.welcome = cfg.welcome || {};

    if (type === "welcome") cfg.welcome.channelId = channelId;
    if (type === "leave") cfg.welcome.leaveChannelId = channelId;

    saveData();

    return interaction.update({
      content: `✅ Canal configurado: <#${channelId}>`,
      components: configMenu()
    });
  }

  if (id.startsWith("config:logs:pick:")) {
    const type = id.split(":").pop();

    cfg.logs = cfg.logs || {};
    cfg.logs[type] = channelId;

    saveData();

    return interaction.update({
      content: `✅ Canal de logs configurado: <#${channelId}>`,
      components: configMenu()
    });
  }
}

// ---------- TRATAMENTO DOS SELETORES DE CARGOS ----------

async function handleRoleSelect(interaction) {
  const cfg = getGuild(interaction.guildId);
  const roleId = interaction.values[0];

  if (!isOwnerOrAdmin(interaction)) {
    return interaction.reply({
      content: "Você não tem permissão para fazer isso.",
      ephemeral: true
    });
  }

  if (interaction.customId === "config:ticket:support:role") {
    cfg.ticket.supportRoleId = roleId;
    saveData();

    return interaction.update({
      content: `✅ Cargo de suporte configurado: <@&${roleId}>`,
      components: configMenu()
    });
  }

  if (interaction.customId.startsWith("config:roles:pick:")) {
    const type = interaction.customId.split(":").pop();

    cfg.roles = cfg.roles || {};

    if (type === "support") cfg.roles.support = roleId;
    if (type === "manager") cfg.roles.configManager = roleId;
    if (type === "moderation") cfg.roles.moderation = roleId;

    saveData();

    return interaction.update({
      content: `✅ Cargo configurado: <@&${roleId}>`,
      components: configMenu()
    });
  }
}

// ---------- TRATAMENTO DOS MODAIS ----------

async function handleModal(interaction) {
  const cfg = getGuild(interaction.guildId);
  const id = interaction.customId;

  if (!isOwnerOrAdmin(interaction)) {
    return interaction.reply({
      content: "Você não tem permissão para alterar essas configurações.",
      ephemeral: true
    });
  }

  if (id === "config:ticket:name:save") {
    const template = interaction.fields.getTextInputValue("template");

    cfg.ticket.nameTemplate = template;
    saveData();

    return interaction.reply({
      content:
        "✅ Modelo do nome dos tickets atualizado.\n" +
        "Variáveis disponíveis: `{categoria}`, `{usuario}`, `{id}`, `{user_id}`, `{username}`.",
      ephemeral: true
    });
  }

  if (id.startsWith("config:pub:save:")) {
    const type = id.split(":").pop();
    const title = interaction.fields.getTextInputValue("title");
    const content = interaction.fields.getTextInputValue("content");
    const imageUrl = interaction.fields.getTextInputValue("image");

    const publication = getPublication(interaction.guildId, type);

    publication.title = title;
    publication.content = content;
    publication.imageUrl = imageUrl || null;
    publication.version = (publication.version || 0) + 1;

    saveData();

    return interaction.reply({
      content:
        `✅ Publicação **${type}** salva.\n` +
        "Agora escolha o canal de publicação na configuração de BHL.",
      ephemeral: true
    });
  }

  if (id === "config:ai:personality:save") {
    cfg.ai = cfg.ai || {};
    cfg.ai.personality = interaction.fields.getTextInputValue("personality");

    saveData();

    return interaction.reply({
      content: "✅ Personalidade da IA atualizada.",
      ephemeral: true
    });
  }

  if (id.startsWith("config:security:save:")) {
    const type = id.split(":").pop();
    const answer = interaction.fields.getTextInputValue("enabled").toLowerCase().trim();
    const enabled = ["sim", "s", "yes", "y"].includes(answer);

    cfg.security = cfg.security || {};

    if (type === "links") cfg.security.antiLinks = enabled;
    if (type === "spam") cfg.security.antiSpam = enabled;

    saveData();

    return interaction.reply({
      content: `✅ Proteção atualizada: **${enabled ? "ativada" : "desativada"}**.`,
      ephemeral: true
    });
  }
}

// ---------- FEEDBACKS POR PREFIXO ----------

async function showFeedbacks(message) {
  const guildId = message.guild.id;
  const all = data.feedbacks || {};
  const entries = Object.entries(all)
    .filter(([key, value]) => {
      if (value?.guildId) return value.guildId === guildId;
      return key.startsWith(guildId);
    })
    .slice(-10);

  if (!entries.length) {
    return message.reply("⭐ Ainda não existem feedbacks registrados.");
  }

  const lines = entries.map(([key, value]) => {
    const rating = value.rating || value.stars || "?";
    const text = value.text || value.comment || "Sem comentário";
    return `⭐ **${rating}/5** — ${String(text).slice(0, 250)}`;
  });

  return message.reply({
    content: `⭐ **Últimos feedbacks**\n\n${lines.join("\n\n")}`,
    allowedMentions: { parse: [] }
  });
}

// ---------- LOGS ----------

async function sendLog(guild, type, content) {
  try {
    const cfg = getGuild(guild.id);
    const channelId =
      cfg.logs?.[type] ||
      cfg.logs?.general;

    if (!channelId) return;

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    await channel.send({
      content,
      allowedMentions: { parse: [] }
    });
  } catch (error) {
    console.error("Erro ao enviar log:", error);
  }
}

// ---------- EVENTOS DE MEMBROS ----------

client.on("guildMemberAdd", async member => {
  try {
    const cfg = getGuild(member.guild.id);
    const channelId = cfg.welcome?.channelId;

    if (channelId) {
      const channel = await member.guild.channels.fetch(channelId).catch(() => null);

      if (channel?.isTextBased()) {
        await channel.send({
          content: `👋 Seja bem-vindo(a), ${member}!`,
          allowedMentions: { users: [member.id] }
        });
      }
    }

    await sendLog(
      member.guild,
      "general",
      `👋 ${member.user.tag} entrou no servidor.`
    );
  } catch (error) {
    console.error("Erro no evento de entrada:", error);
  }
});

client.on("guildMemberRemove", async member => {
  try {
    const cfg = getGuild(member.guild.id);
    const channelId = cfg.welcome?.leaveChannelId;

    if (channelId) {
      const channel = await member.guild.channels.fetch(channelId).catch(() => null);

      if (channel?.isTextBased()) {
        await channel.send({
          content: `🚪 **${member.user.tag}** saiu do servidor.`,
          allowedMentions: { parse: [] }
        });
      }
    }

    await sendLog(
      member.guild,
      "general",
      `🚪 ${member.user.tag} saiu do servidor.`
    );
  } catch (error) {
    console.error("Erro no evento de saída:", error);
  }
});

// ---------- MODERAÇÃO AUTOMÁTICA ----------

const recentMessages = new Map();

client.on("messageCreate", async message => {
  try {
    if (!message.guild || message.author.bot) return;

    const cfg = getGuild(message.guild.id);
    const content = message.content || "";

    // Prefixo de feedbacks
    if (content.trim().toLowerCase() === "z!feedbacks") {
      return showFeedbacks(message);
    }

    // Honeypot: qualquer mensagem enviada no canal configurado
    // gera timeout de 7 dias, exceto administradores.
    if (
      cfg.security?.honeypotChannelId &&
      message.channel.id === cfg.security.honeypotChannelId
    ) {
      const member = message.member;

      if (
        member &&
        !member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        await message.delete().catch(() => null);

        await member.timeout(
          7 * 24 * 60 * 60 * 1000,
          "Honeypot: mensagem enviada no canal protegido."
        ).catch(() => null);

        await sendLog(
          message.guild,
          "security",
          `🍯 Honeypot acionado por <@${member.id}>. Timeout aplicado por 7 dias.`
        );
      }

      return;
    }

    // Anti-links
    if (
      cfg.security?.antiLinks &&
      /(https?:\/\/|discord\.gg\/|www\.)/i.test(content) &&
      !message.member?.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      await message.delete().catch(() => null);

      await sendLog(
        message.guild,
        "security",
        `🔗 Link removido de ${message.author.tag} em <#${message.channel.id}>.`
      );

      return;
    }

    // Anti-spam simples
    if (cfg.security?.antiSpam) {
      const key = `${message.guild.id}:${message.author.id}`;
      const now = Date.now();
      const previous = recentMessages.get(key) || [];
      const filtered = previous.filter(time => now - time < 7000);

      filtered.push(now);
      recentMessages.set(key, filtered);

      if (filtered.length >= 6) {
        await message.delete().catch(() => null);

        if (
          message.member &&
          !message.member.permissions.has(PermissionFlagsBits.ManageMessages)
        ) {
          await message.member.timeout(
            10 * 60 * 1000,
            "Anti-spam: excesso de mensagens."
          ).catch(() => null);
        }

        recentMessages.delete(key);

        await sendLog(
          message.guild,
          "security",
          `🚫 Possível spam detectado de ${message.author.tag}.`
        );

        return;
      }
    }

    // IA Groq
    if (cfg.ai?.enabled && groq) {
      const allowedChannels = cfg.ai.channelIds || [];

      if (
        allowedChannels.length &&
        !allowedChannels.includes(message.channel.id)
      ) {
        return;
      }

      if (message.mentions.has(client.user)) {
        const prompt = content
          .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
          .trim();

        if (!prompt) return;

        await message.channel.sendTyping();

        const answer = await askAI(
          message.guild.id,
          message.author.id,
          prompt
        );

        if (answer) {
          await message.reply({
            content: answer.slice(0, 1900),
            allowedMentions: { repliedUser: false }
          });
        } else {
          await message.reply({
            content: aiErrorMessage(),
            allowedMentions: { repliedUser: false }
          });
        }
      }
    }
  } catch (error) {
    console.error("Erro no messageCreate:", error);
  }
});

// ---------- BOTÕES ----------

async function handleButton(interaction) {
  const id = interaction.customId;

  if (id === "ticket:claim") return claimTicket(interaction);
  if (id === "ticket:add") return showAddMember(interaction);
  if (id === "ticket:close") return closeTicket(interaction);

  if (id.startsWith("feedback:")) {
    return saveFeedback(interaction);
  }

  if (id === "terms:accept") {
    return acceptTerms(interaction);
  }
}

// ---------- LIGAÇÃO DO FEEDBACK AO FECHAMENTO ----------

// A função original salva a transcrição e agenda a exclusão.
// Esta camada também solicita o feedback ao usuário.
const closeTicketOriginal = closeTicket;

closeTicket = async function(interaction) {
  const ticket = data.tickets?.[interaction.channelId];

  await closeTicketOriginal(interaction);

  if (ticket?.userId) {
    await askFeedback(ticket).catch(error => {
      console.error("Erro ao solicitar feedback:", error);
    });
  }
};

// ---------- INTERAÇÕES DO DISCORD ----------

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "config") {
        return openConfig(interaction);
      }
    }

    if (interaction.isButton()) {
      return handleButton(interaction);
    }

    if (interaction.isStringSelectMenu()) {
      return handleConfigSelect(interaction);
    }

    if (interaction.isChannelSelectMenu()) {
      return handleChannelSelect(interaction);
    }

    if (interaction.isRoleSelectMenu()) {
      return handleRoleSelect(interaction);
    }

    if (interaction.isUserSelectMenu()) {
      if (interaction.customId === "ticket:addmember:users") {
        return addTicketMembers(interaction);
      }
    }

    if (interaction.isModalSubmit()) {
      return handleModal(interaction);
    }
  } catch (error) {
    console.error("Erro na interação:", error);

    const response = {
      content: "Ocorreu um erro ao executar essa ação. Confira as permissões e tente novamente.",
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(response).catch(() => null);
    } else {
      await interaction.reply(response).catch(() => null);
    }
  }
});

// ---------- REGISTRO DO ÚNICO COMANDO ----------

async function registerCommands() {
  const command = new SlashCommandBuilder()
    .setName("config")
    .setDescription("Abrir o painel de configuração do ZYPhor Bot");

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: [command.toJSON()] }
  );

  console.log("Comando /config registrado.");
}

// ---------- INICIALIZAÇÃO ----------

client.once("ready", async () => {
  console.log("--------------------------------");
  console.log(`ZYPhor Bot conectado como ${client.user.tag}`);
  console.log(`Servidores: ${client.guilds.cache.size}`);
  console.log(`Groq: ${groq ? "Configurada" : "Sem chave configurada"}`);
  console.log("--------------------------------");

  try {
    await registerCommands();
  } catch (error) {
    console.error("Erro ao registrar /config:", error);
  }
});

client.on("error", error => {
  console.error("Erro do Discord:", error);
});

process.on("unhandledRejection", error => {
  console.error("Promise rejeitada:", error);
});

process.on("uncaughtException", error => {
  console.error("Erro não tratado:", error);
});

if (!TOKEN) {
  console.error("ERRO: configure DISCORD_TOKEN na Fadehost.");
  process.exit(1);
}

client.login(TOKEN);
