
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
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
  PermissionFlagsBits,
  ChannelType,
  AttachmentBuilder,
  REST,
  Routes
} = require("discord.js");

const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");

// ======================================================
// ZYPHOR BOT — CONFIGURAÇÕES
// ======================================================

const OWNER_ID = "1533306874513068093";
const PREFIX = "z!";
const DATA_PATH = path.join(__dirname, "data.json");

const TOKEN = process.env.DISCORD_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groq = GROQ_API_KEY
  ? new Groq({ apiKey: GROQ_API_KEY })
  : null;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember
  ]
});

// ======================================================
// EMOJIS PERSONALIZADOS DA ZYPHOR
// ======================================================

const EMOJI = {
  bars: "<:4pauzinhos:1552010605060300972>",
  cart: "<:Carrinho:1552009619046531154>",
  rules: "<:Eclipse_rules:1552508768259014656>",
  pending: "<:Member_Pending:1550347089332932668>",
  online: "<a:Online:1552007801017204736>",
  republic: "<:Repblica:1552763007258333255>",
  secured: "<:Secured:1550347097318883360>",
  blank: "<:__:1552010603764256939>",
  accept: "<:aceito:1552508777943539843>",
  find: "<:achar:1550347098858332192>",
  alertAnim: "<a:alerta:1552007804569653360>",
  alert: "<:alerta:1552010624513482823>",
  ban: "<:ban:1552761935945277472>",
  comment: "<:cometrio:1552009642081788016>",
  config: "<:config:1552010601688080457>",
  heart: "<:corao:1552010611393700011>",
  dashboard: "<:dashboard:1552007805953900564>",
  type: "<:digitar:1550347102662434857>",
  dislike: "<:disslike:1552007819757092924>",
  document: "<:documento:1552009636251566130>",
  shield: "<:escudo:1552508771228450856>",
  exclamation: "<:excla:1552508778887254026>",
  lock: "<:fechadura:1552508769752317994>",
  fixed: "<:fixo:1550347448247914588>",
  clock: "<:horrio:1550347082634760202>",
  insta: "<:insta:1552009638487138427>",
  like: "<:like:1552007813709172766>",
  link: "<:link:1552009621999452160>",
  trash: "<:lixo:1552009637170253894>",
  load: "<a:load:1552508772432347189>",
  more: "<:mais:1550347104336220180>",
  negative: "<:negativo:1550347078893441114>",
  notifyWarn: "<:notificacao_warn:1550347085444943892>",
  play: "<:play:1552762285502627930>",
  dot: "<:ponto:1552010636190421133>",
  positive: "<:positivo:1550347075089211432>",
  owner: "<:posse:1552007807535153262>",
  prohibited: "<:proibido:1552010616280064092>",
  rejected: "<:recusado:1552508774462398484>",
  security: "<:security:1552010618163167306>",
  server: "<:servidor:1552763006214217879>",
  arrow: "<:seta:1552009643734343910>",
  support: "<:suporte_emoji:1552508765176074270>",
  text: "<:texto:1550347093586223184>",
  ticket: "<:ticket_fallens:1552761934733119709>",
  sold: "<:vendido:1552009611878469757>",
  watching: "<:vigiando:1552007809321926656>",
  voice: "<:voz:1552010607090204782>",
  warn1: "<:warn1:1550347449925894196>",
  warn2: "<:warn2:1550347452446408754>",
  warn3: "<:warn3:1550347451070943254>",
  vip: "<:vip:1559077642593108008>"
};

// ======================================================
// BANCO DE DADOS JSON
// ======================================================

function defaultData() {
  return {
    version: 5,
    guilds: {},
    tickets: {},
    ticketCounters: {},
    feedbacks: {},
    aiHistory: {},
    publications: {},
    termsAcceptances: {},
    ticketTranscripts: {},
    warnings: {},
    statusRotation: {
      enabled: true,
      intervalSeconds: 15,
      currentIndex: 0,
      activities: [
        { name: "ZYPhor • /config", type: 3 },
        { name: "ZYPhor • Apps", type: 3 },
        { name: "ZYPhor • Tickets", type: 3 },
        { name: "ZYPhor • Inteligência Artificial", type: 3 },
        { name: "ZYPhor • Sistemas", type: 3 },
        { name: "ZYPhor • Ao Vivo", type: 3 }
      ]
    }
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

    const parsed = JSON.parse(
      fs.readFileSync(DATA_PATH, "utf8")
    );

    const defaults = defaultData();

    return {
      ...defaults,
      ...parsed,
      guilds: parsed.guilds || {},
      tickets: parsed.tickets || {},
      ticketCounters: parsed.ticketCounters || {},
      feedbacks: parsed.feedbacks || {},
      aiHistory: parsed.aiHistory || {},
      publications: parsed.publications || {},
      termsAcceptances: parsed.termsAcceptances || {},
      ticketTranscripts: parsed.ticketTranscripts || {},
      warnings: parsed.warnings || {},
      statusRotation: {
        ...defaults.statusRotation,
        ...(parsed.statusRotation || {})
      }
    };
  } catch (error) {
    console.error("Erro ao carregar data.json:", error);
    return defaultData();
  }
}

let db = loadData();
let saveTimeout = null;

function saveData() {
  clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    try {
      const tempPath = DATA_PATH + ".tmp";

      fs.writeFileSync(
        tempPath,
        JSON.stringify(db, null, 2)
      );

      fs.renameSync(tempPath, DATA_PATH);
    } catch (error) {
      console.error("Erro ao salvar data.json:", error);
    }
  }, 300);
}

// ======================================================
// CONFIGURAÇÃO PADRÃO DOS SERVIDORES
// ======================================================

function defaultGuildConfig() {
  return {
    configManagerRole: null,

    ai: {
      chatEnabled: false,
      chatChannels: [],
      ticketsEnabled: false,
      model: "llama-3.3-70b-versatile",
      systemPrompt:
        "Você é a IA oficial da ZYPhor Bot. Responda em português brasileiro, com educação, clareza e objetividade."
    },

    tickets: {
      enabled: false,
      panelChannel: null,
      panelMessage: null,
      category: null,
      logChannel: null,
      feedbackChannel: null,
      supportRole: null,
      image: null,
      title: "Central de Atendimento",
      description: "Selecione abaixo o tipo de atendimento que deseja abrir.",
      maxOpenPerUser: 1,
      categories: []
    },

    publications: {
      rulesChannel: null,
      termsChannel: null,
      announcementsChannel: null,
      feedbackChannel: null
    },

    moderation: {
      enabled: false,
      logChannel: null,
      moderatorRole: null,
      muteRole: null
    },

    welcome: {
      enabled: false,
      channel: null,
      image: null,
      message: "Bem-vindo(a), {user}!"
    },

    security: {
      enabled: false,
      antiSpam: false,
      antiLinks: false,
      antiRaid: false,
      honeypot: false,
      honeypotAction: "timeout"
    },

    logs: {
      enabled: false,
      channel: null
    }
  };
}

function getGuildConfig(guildId) {
  if (!db.guilds[guildId]) {
    db.guilds[guildId] = defaultGuildConfig();
    saveData();
  }

  const defaults = defaultGuildConfig();
  const current = db.guilds[guildId];

  db.guilds[guildId] = {
    ...defaults,
    ...current,
    ai: { ...defaults.ai, ...(current.ai || {}) },
    tickets: { ...defaults.tickets, ...(current.tickets || {}) },
    publications: {
      ...defaults.publications,
      ...(current.publications || {})
    },
    moderation: {
      ...defaults.moderation,
      ...(current.moderation || {})
    },
    welcome: { ...defaults.welcome, ...(current.welcome || {}) },
    security: { ...defaults.security, ...(current.security || {}) },
    logs: { ...defaults.logs, ...(current.logs || {}) }
  };

  return db.guilds[guildId];
}

// ======================================================
// FUNÇÕES GERAIS
// ======================================================

function makeId(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

function truncate(value, max = 1000) {
  const text = String(value || "");
  return text.length > max
    ? text.slice(0, max - 3) + "..."
    : text;
}

function safeChannelName(value) {
  return String(value || "ticket")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90) || "ticket";
}

function isAdmin(interaction) {
  if (!interaction.guild) return false;

  if (interaction.user.id === OWNER_ID) return true;
  if (interaction.user.id === interaction.guild.ownerId) return true;

  if (
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  ) return true;

  const config = getGuildConfig(interaction.guild.id);
  const roleId = config.configManagerRole;

  return Boolean(
    roleId &&
    interaction.member?.roles?.cache?.has(roleId)
  );
}

async function replyError(interaction, message) {
  const payload = {
    content: `${EMOJI.alert} ${message}`,
    ephemeral: true
  };

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp(payload).catch(() => {});
  }

  return interaction.reply(payload).catch(() => {});
}

async function replySuccess(interaction, message) {
  const payload = {
    content: `${EMOJI.accept} ${message}`,
    ephemeral: true
  };

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp(payload).catch(() => {});
  }

  return interaction.reply(payload).catch(() => {});
}

// ======================================================
// SISTEMA VISUAL DOS EMBEDS
// ======================================================

const COLORS = {
  main: 0x171717,
  success: 0x2ecc71,
  warning: 0xf1c40f,
  danger: 0xe74c3c,
  purple: 0x8e44ad
};

function baseEmbed(title, description = "") {
  return new EmbedBuilder()
    .setColor(COLORS.main)
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: "ZYPhor Bot • Central de Administração"
    })
    .setTimestamp();
}

function mainConfigEmbed(guild) {
  const config = getGuildConfig(guild.id);

  const aiStatus = groq
    ? `${EMOJI.online} API Groq disponível`
    : `${EMOJI.alert} API Groq não configurada`;

  const ticketStatus = config.tickets.enabled
    ? `${EMOJI.online} Ativado`
    : `${EMOJI.negative} Desativado`;

  const aiStatusText =
    config.ai.chatEnabled || config.ai.ticketsEnabled
      ? `${EMOJI.online} Ativada`
      : `${EMOJI.negative} Desativada`;

  return baseEmbed(
    `${EMOJI.dashboard} ZYPhor • Central de Administração`,
    [
      `**Servidor:** ${guild.name}`,
      `**ID:** \`${guild.id}\``,
      "",
      `${EMOJI.server} **SISTEMAS**`,
      `${EMOJI.dot} Tickets: ${ticketStatus}`,
      `${EMOJI.dot} Inteligência artificial: ${aiStatusText}`,
      `${EMOJI.dot} Moderação: ${config.moderation.enabled ? "Ativada" : "Desativada"}`,
      `${EMOJI.dot} Segurança: ${config.security.enabled ? "Ativada" : "Desativada"}`,
      "",
      `${EMOJI.security} **CONEXÕES**`,
      `${EMOJI.dot} ${aiStatus}`,
      `${EMOJI.dot} Banco local: ${EMOJI.online} Funcionando`,
      "",
      `${EMOJI.arrow} Escolha uma seção no menu abaixo.`
    ].join("\n")
  );
}

function configMainComponents() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("config_navigation")
    .setPlaceholder("Escolha uma seção...")
    .addOptions([
      {
        label: "Início",
        description: "Visão geral do bot",
        value: "home",
        emoji: "🏠"
      },
      {
        label: "Tickets",
        description: "Painel e atendimento",
        value: "tickets",
        emoji: "🎫"
      },
      {
        label: "Inteligência artificial",
        description: "Groq e respostas automáticas",
        value: "ai",
        emoji: "🤖"
      },
      {
        label: "Publicações BHL",
        description: "Regras, termos e avisos",
        value: "publications",
        emoji: "📢"
      },
      {
        label: "Moderação",
        description: "Ferramentas de moderação",
        value: "moderation",
        emoji: "🛡️"
      },
      {
        label: "Segurança",
        description: "Proteção do servidor",
        value: "security",
        emoji: "🔐"
      },
      {
        label: "Boas-vindas",
        description: "Mensagens de entrada",
        value: "welcome",
        emoji: "👋"
      },
      {
        label: "Status / Ao Vivo",
        description: "Rotação automática da presença",
        value: "status",
        emoji: "💜"
      },
      {
        label: "Permissões",
        description: "Gerenciar acesso à configuração",
        value: "permissions",
        emoji: "⚙️"
      }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("config_refresh")
      .setLabel("Atualizar")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("config_close")
      .setLabel("Fechar painel")
      .setEmoji("✖️")
      .setStyle(ButtonStyle.Danger)
  );

  return [row, buttons];
}

// ======================================================
// REGISTRO DO COMANDO /CONFIG
// ======================================================

async function registerCommands() {
  if (!TOKEN || !client.user) return;

  const commands = [
    {
      name: "config",
      description: "Abrir a central de administração da ZYPhor Bot"
    }
  ];

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log("Comando /config registrado.");
  } catch (error) {
    console.error("Erro ao registrar comandos:", error);
  }
}

// ======================================================
// EVENTO READY E STATUS AUTOMÁTICO
// ======================================================

let statusInterval = null;

const DEFAULT_ACTIVITIES = [
  { name: "ZYPhor • /config", type: 3 },
  { name: "ZYPhor • Apps", type: 3 },
  { name: "ZYPhor • Tickets", type: 3 },
  { name: "ZYPhor • Inteligência Artificial", type: 3 },
  { name: "ZYPhor • Sistemas", type: 3 },
  { name: "ZYPhor • Ao Vivo", type: 3 }
];

function getStatusData() {
  if (!db.statusRotation) {
    db.statusRotation = {
      enabled: true,
      intervalSeconds: 15,
      currentIndex: 0,
      activities: DEFAULT_ACTIVITIES.map(a => ({ ...a }))
    };
  }

  if (!Array.isArray(db.statusRotation.activities)) {
    db.statusRotation.activities =
      DEFAULT_ACTIVITIES.map(a => ({ ...a }));
  }

  if (!db.statusRotation.activities.length) {
    db.statusRotation.activities =
      DEFAULT_ACTIVITIES.map(a => ({ ...a }));
  }

  return db.statusRotation;
}

function applyStatus() {
  const status = getStatusData();

  if (!client.user || !status.enabled) return;

  const activities = status.activities;

  if (!activities.length) return;

  if (status.currentIndex >= activities.length) {
    status.currentIndex = 0;
  }

  const activity = activities[status.currentIndex];

  client.user.setPresence({
    activities: [{
      name: activity.name,
      type: activity.type ?? 3
    }],
    status: "online"
  });

  status.currentIndex =
    (status.currentIndex + 1) % activities.length;

  saveData();
}

function startStatusRotation() {
  const status = getStatusData();

  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }

  if (!status.enabled) return;

  const seconds = Math.max(
    15,
    Math.min(3600, Number(status.intervalSeconds) || 15)
  );

  applyStatus();

  statusInterval = setInterval(
    applyStatus,
    seconds * 1000
  );
}

client.once("ready", async () => {
  console.log("------------------------------------");
  console.log(`ZYPhor Bot conectado como ${client.user.tag}`);
  console.log(`Servidores: ${client.guilds.cache.size}`);
  console.log(`Groq: ${groq ? "Disponível" : "Não configurada"}`);
  console.log("------------------------------------");

  await registerCommands();
  startStatusRotation();
});

// ======================================================
// ABERTURA DO PAINEL /CONFIG
// ======================================================

async function openConfigPanel(interaction) {
  if (!isAdmin(interaction)) {
    return replyError(
      interaction,
      "Você não tem permissão para acessar a central de administração."
    );
  }

  return interaction.reply({
    embeds: [mainConfigEmbed(interaction.guild)],
    components: configMainComponents(),
    ephemeral: true
  });
}

// ======================================================
// FIM DA PARTE 1
// ======================================================
// ======================================================
// PAINÉIS DAS SEÇÕES
// ======================================================

function sectionEmbed(guild, section) {
  const config = getGuildConfig(guild.id);

  if (section === "tickets") {
    return baseEmbed(
      `${EMOJI.ticket} Sistema de Tickets`,
      [
        "**CENTRAL DE ATENDIMENTO**",
        "",
        `Sistema: ${config.tickets.enabled ? "🟢 Ativado" : "🔴 Desativado"}`,
        `Canal do painel: ${config.tickets.panelChannel ? `<#${config.tickets.panelChannel}>` : "Não definido"}`,
        `Categoria: ${config.tickets.category ? `<#${config.tickets.category}>` : "Não definida"}`,
        `Cargo de suporte: ${config.tickets.supportRole ? `<@&${config.tickets.supportRole}>` : "Não definido"}`,
        `Canal de registros: ${config.tickets.logChannel ? `<#${config.tickets.logChannel}>` : "Não definido"}`,
        "",
        "Configure os canais e cargos pelos menus abaixo."
      ].join("\n")
    );
  }

  if (section === "ai") {
    return baseEmbed(
      "🤖 Inteligência Artificial",
      [
        `API Groq: ${groq ? "🟢 Disponível" : "🔴 Não configurada"}`,
        `IA nos canais: ${config.ai.chatEnabled ? "🟢 Ativada" : "🔴 Desativada"}`,
        `IA nos tickets: ${config.ai.ticketsEnabled ? "🟢 Ativada" : "🔴 Desativada"}`,
        `Canais autorizados: ${config.ai.chatChannels.length}`,
        "",
        `Modelo: \`${config.ai.model}\``,
        "",
        "A IA responde somente nos canais autorizados quando essa opção está ativada."
      ].join("\n")
    );
  }

  if (section === "status") {
    const status = getStatusData();

    return baseEmbed(
      "💜 ZYPhor • Status / Ao Vivo",
      [
        `Rotação automática: ${status.enabled ? "🟢 Ativada" : "⏸️ Pausada"}`,
        `Intervalo: ${status.intervalSeconds} segundos`,
        `Atividades cadastradas: ${status.activities.length}`,
        "",
        "**Atividades:**",
        ...status.activities.map((a, i) => `${i + 1}. ${a.name}`),
        "",
        "Gerencie a presença automática do bot."
      ].join("\n")
    );
  }

  if (section === "publications") {
    return baseEmbed(
      "📢 Publicações BHL",
      [
        `Regras: ${config.publications.rulesChannel ? `<#${config.publications.rulesChannel}>` : "Não configurado"}`,
        `Termos: ${config.publications.termsChannel ? `<#${config.publications.termsChannel}>` : "Não configurado"}`,
        `Avisos: ${config.publications.announcementsChannel ? `<#${config.publications.announcementsChannel}>` : "Não configurado"}`,
        `Feedbacks: ${config.publications.feedbackChannel ? `<#${config.publications.feedbackChannel}>` : "Não configurado"}`,
        "",
        "Configure os canais das publicações."
      ].join("\n")
    );
  }

  if (section === "moderation") {
    return baseEmbed(
      `${EMOJI.shield} Moderação`,
      [
        `Sistema: ${config.moderation.enabled ? "🟢 Ativado" : "🔴 Desativado"}`,
        `Cargo moderador: ${config.moderation.moderatorRole ? `<@&${config.moderation.moderatorRole}>` : "Não definido"}`,
        `Canal de registros: ${config.moderation.logChannel ? `<#${config.moderation.logChannel}>` : "Não definido"}`,
        "",
        "Configurações de moderação do servidor."
      ].join("\n")
    );
  }

  if (section === "security") {
    return baseEmbed(
      `${EMOJI.security} Segurança`,
      [
        `Sistema: ${config.security.enabled ? "🟢 Ativado" : "🔴 Desativado"}`,
        `Anti-spam: ${config.security.antiSpam ? "🟢" : "🔴"}`,
        `Anti-links: ${config.security.antiLinks ? "🟢" : "🔴"}`,
        `Anti-raid: ${config.security.antiRaid ? "🟢" : "🔴"}`,
        `Honeypot: ${config.security.honeypot ? "🟢" : "🔴"}`,
        `Ação Honeypot: ${config.security.honeypotAction}`,
        "",
        "Configurações de proteção do servidor."
      ].join("\n")
    );
  }

  if (section === "welcome") {
    return baseEmbed(
      "👋 Boas-vindas",
      [
        `Sistema: ${config.welcome.enabled ? "🟢 Ativado" : "🔴 Desativado"}`,
        `Canal: ${config.welcome.channel ? `<#${config.welcome.channel}>` : "Não definido"}`,
        `Mensagem: ${config.welcome.message}`,
        "",
        "Configure as mensagens de entrada."
      ].join("\n")
    );
  }

  if (section === "permissions") {
    return baseEmbed(
      "⚙️ Permissões",
      [
        `Cargo autorizado: ${config.configManagerRole ? `<@&${config.configManagerRole}>` : "Somente administradores e proprietário"}`,
        "",
        "Escolha um cargo para gerenciar a configuração do bot."
      ].join("\n")
    );
  }

  return mainConfigEmbed(guild);
}

// ======================================================
// COMPONENTES DOS PAINÉIS
// ======================================================

function sectionComponents(section) {
  const back = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("config_back")
      .setLabel("Voltar")
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`section_refresh_${section}`)
      .setLabel("Atualizar")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary)
  );

  if (section === "tickets") {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_toggle")
        .setLabel("Ativar / Desativar")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("ticket_panel_publish")
        .setLabel("Publicar painel")
        .setEmoji("📨")
        .setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("ticket_panel_channel")
        .setPlaceholder("Selecionar canal do painel")
        .setChannelTypes(ChannelType.GuildText),

      new ChannelSelectMenuBuilder()
        .setCustomId("ticket_parent_category")
        .setPlaceholder("Selecionar categoria dos tickets")
        .setChannelTypes(ChannelType.GuildCategory)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("ticket_support_role")
        .setPlaceholder("Selecionar cargo de suporte")
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("ticket_log_channel")
        .setPlaceholder("Selecionar canal de registros")
        .setChannelTypes(ChannelType.GuildText)
    );

    return [row1, row2, row3, row4, back];
  }

  if (section === "ai") {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ai_chat_toggle")
        .setLabel("IA nos canais")
        .setEmoji("💬")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("ai_ticket_toggle")
        .setLabel("IA nos tickets")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("ai_select_channels")
        .setPlaceholder("Selecionar canais para IA")
        .setChannelTypes(ChannelType.GuildText)
        .setMinValues(1)
        .setMaxValues(5)
    );

    return [row1, row2, back];
  }

  if (section === "status") {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("status_toggle")
        .setLabel("Ativar / Pausar")
        .setEmoji("💜")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("status_add")
        .setLabel("Adicionar atividade")
        .setEmoji("➕")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("status_interval")
        .setLabel("Intervalo")
        .setEmoji("⏱️")
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("status_live")
        .setLabel("Status ao vivo")
        .setEmoji("🔴")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("status_reset")
        .setLabel("Restaurar padrão")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Secondary)
    );

    return [row1, row2, back];
  }

  if (section === "permissions") {
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("config_manager_role")
        .setPlaceholder("Selecionar cargo autorizado")
    );

    return [row, back];
  }

  return [back];
}

// ======================================================
// MODAIS DO STATUS
// ======================================================

function statusActivityModal() {
  const modal = new ModalBuilder()
    .setCustomId("status_activity_modal")
    .setTitle("Adicionar atividade");

  const name = new TextInputBuilder()
    .setCustomId("activity_name")
    .setLabel("Texto do status")
    .setPlaceholder("ZYPhor • Novidades")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100)
    .setRequired(true);

  const type = new TextInputBuilder()
    .setCustomId("activity_type")
    .setLabel("Tipo: 0 Jogando, 2 Ouvindo, 3 Assistindo")
    .setPlaceholder("3")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(1)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(name),
    new ActionRowBuilder().addComponents(type)
  );

  return modal;
}

function statusIntervalModal() {
  const modal = new ModalBuilder()
    .setCustomId("status_interval_modal")
    .setTitle("Intervalo da rotação");

  const seconds = new TextInputBuilder()
    .setCustomId("interval_seconds")
    .setLabel("Segundos (mínimo 15)")
    .setPlaceholder("15")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(4)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(seconds)
  );

  return modal;
}

// ======================================================
// BHL DE STATUS / AO VIVO
// ======================================================

function liveStatusEmbed() {
  const status = getStatusData();

  return baseEmbed(
    "💜 ZYPhor • Status / Ao Vivo",
    [
      "**CONTROLE DA PRESENÇA AUTOMÁTICA**",
      "",
      `Estado: ${status.enabled ? "🟢 Funcionando" : "⏸️ Pausado"}`,
      `Intervalo: ${status.intervalSeconds} segundos`,
      `Atividades: ${status.activities.length}`,
      "",
      "**ROTAÇÃO:**",
      ...status.activities.map((a, i) => `${i + 1}. ${a.name}`),
      "",
      "Gerencie a rotação pelo painel abaixo."
    ].join("\n")
  );
}

function liveStatusComponents() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("status_toggle")
      .setLabel("Ativar / Pausar")
      .setEmoji("💜")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("status_add")
      .setLabel("Adicionar")
      .setEmoji("➕")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("status_interval")
      .setLabel("Intervalo")
      .setEmoji("⏱️")
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("status_reset")
      .setLabel("Restaurar padrão")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

// ======================================================
// SISTEMA DE IA GROQ
// ======================================================

async function askGroq(guildId, historyKey, userMessage) {
  if (!groq) {
    throw new Error("A API Groq não está configurada.");
  }

  const config = getGuildConfig(guildId);

  if (!db.aiHistory[guildId]) {
    db.aiHistory[guildId] = {};
  }

  if (!db.aiHistory[guildId][historyKey]) {
    db.aiHistory[guildId][historyKey] = [];
  }

  const history = db.aiHistory[guildId][historyKey];

  history.push({
    role: "user",
    content: truncate(userMessage, 3000)
  });

  const messages = [
    {
      role: "system",
      content: config.ai.systemPrompt
    },
    ...history.slice(-12)
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: config.ai.model || "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 700
    });

    const answer =
      completion.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("A IA não retornou uma resposta.");
    }

    history.push({
      role: "assistant",
      content: answer
    });

    if (history.length > 24) {
      history.splice(0, history.length - 24);
    }

    saveData();
    return answer;
  } catch (error) {
    if (error.status === 401) {
      throw new Error("A chave da API Groq é inválida.");
    }

    if (error.status === 429) {
      throw new Error("A Groq atingiu o limite de requisições. Tente novamente depois.");
    }

    throw error;
  }
}

// ======================================================
// SISTEMA DE TICKETS
// ======================================================

function getOpenTicket(guildId, userId) {
  return Object.values(db.tickets).find(ticket =>
    ticket.guildId === guildId &&
    ticket.userId === userId &&
    !ticket.closed
  );
}

async function createTicket(interaction, categoryData) {
  const config = getGuildConfig(interaction.guild.id);

  if (!config.tickets.enabled) {
    return replyError(interaction, "O sistema de tickets está desativado.");
  }

  if (getOpenTicket(interaction.guild.id, interaction.user.id)) {
    return replyError(interaction, "Você já possui um ticket aberto.");
  }

  if (!config.tickets.category) {
    return replyError(interaction, "A categoria dos tickets ainda não foi configurada.");
  }

  const parent = await interaction.guild.channels.fetch(
    config.tickets.category
  ).catch(() => null);

  if (!parent || parent.type !== ChannelType.GuildCategory) {
    return replyError(interaction, "A categoria configurada não existe.");
  }

  const ticketId = makeId(8);
  const counterKey = `${interaction.guild.id}:${categoryData.id}`;

  db.ticketCounters[counterKey] =
    (db.ticketCounters[counterKey] || 0) + 1;

  const number = String(
    db.ticketCounters[counterKey]
  ).padStart(4, "0");

  const channelName = safeChannelName(
    `${categoryData.name}-ticket-${number}`
  );

  const supportRole =
    categoryData.supportRole || config.tickets.supportRole;

  const permissionOverwrites = [
    {
      id: interaction.guild.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
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

  if (supportRole) {
    permissionOverwrites.push({
      id: supportRole,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: parent.id,
      permissionOverwrites,
      topic: `Ticket ${ticketId} • ${interaction.user.tag}`
    });

    db.tickets[ticketId] = {
      id: ticketId,
      guildId: interaction.guild.id,
      channelId: channel.id,
      userId: interaction.user.id,
      categoryId: categoryData.id,
      categoryName: categoryData.name,
      supportRole,
      number,
      claimedBy: null,
      closed: false,
      createdAt: Date.now()
    };

    saveData();

    const embed = baseEmbed(
      `${EMOJI.ticket} Atendimento • ${categoryData.name}`,
      [
        `Olá, ${interaction.user}!`,
        "",
        "Seu atendimento foi criado.",
        "Explique o que você precisa para a equipe poder ajudar.",
        "",
        `**Protocolo:** \`${number}\``,
        `**Categoria:** ${categoryData.name}`,
        `**Equipe:** ${supportRole ? `<@&${supportRole}>` : "Não definida"}`
      ].join("\n")
    );

    const controls = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_claim_${ticketId}`)
        .setLabel("Atender")
        .setEmoji("🙋")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`ticket_add_${ticketId}`)
        .setLabel("Adicionar membro")
        .setEmoji("👤")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`ticket_close_${ticketId}`)
        .setLabel("Fechar")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: supportRole ? `<@&${supportRole}>` : "",
      embeds: [embed],
      components: [controls],
      allowedMentions: {
        roles: supportRole ? [supportRole] : [],
        users: [interaction.user.id]
      }
    });

    await interaction.editReply({
      content: `${EMOJI.accept} Seu ticket foi criado: ${channel}`
    });
  } catch (error) {
    console.error("Erro ao criar ticket:", error);

    await interaction.editReply({
      content: `${EMOJI.alert} Não foi possível criar o ticket. Verifique as permissões do bot.`
    });
  }
}

// ======================================================
// FIM DA PARTE 2
// ======================================================
/* =========================================================
   ZYPHOR BOT — INDEX.JS
   PARTE 3/3 — INTERAÇÕES, TICKETS, IA E INICIALIZAÇÃO
========================================================= */

// Controle de respostas simultâneas da IA
const aiBusy = new Set();

// Verifica se o membro é da equipe de suporte do ticket
async function isTicketStaff(interaction, ticket) {
  if (!interaction.guild || !ticket) return false;

  if (interaction.guild.ownerId === interaction.user.id) return true;

  const member = await interaction.guild.members
    .fetch(interaction.user.id)
    .catch(() => null);

  if (!member) return false;

  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  if (ticket.supportRoleId && member.roles.cache.has(ticket.supportRoleId)) {
    return true;
  }

  return false;
}

// Cria menu de categorias do ticket
function ticketCategoryMenu(config) {
  const categories = config.tickets.categories?.length
    ? config.tickets.categories
    : [
        { id: "ajuda", name: "Ajuda", description: "Preciso de ajuda", emoji: "🎫" },
        { id: "compra", name: "Compra", description: "Quero comprar um produto", emoji: EMOJI.cart },
        { id: "suporte", name: "Suporte", description: "Suporte técnico", emoji: EMOJI.support }
      ];

  config.tickets.categories = categories;

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_open_category")
    .setPlaceholder("Selecione o assunto do ticket")
    .addOptions(
      categories.slice(0, 25).map(category => ({
        label: truncate(category.name || "Atendimento", 100),
        description: truncate(category.description || "Abrir atendimento", 100),
        value: String(category.id || makeId()),
        emoji: category.emoji && category.emoji.length <= 100
          ? category.emoji
          : "🎫"
      }))
    );

  return new ActionRowBuilder().addComponents(menu);
}

// Publica painel de tickets
async function publishTicketPanel(interaction) {
  const config = getGuildConfig(interaction.guild.id);

  const embed = new EmbedBuilder()
    .setColor(COLORS.purple)
    .setTitle(`${EMOJI.ticket} Central de Atendimento`)
    .setDescription(
      "Precisa de ajuda ou deseja realizar uma compra?\n\n" +
      `${EMOJI.arrow} Selecione uma categoria abaixo para abrir seu ticket.\n` +
      `${EMOJI.shield} Nossa equipe será notificada automaticamente.\n\n` +
      `${EMOJI.clock} Aguarde um membro da equipe atender você.`
    )
    .setFooter({ text: "ZYPhor • Atendimento" })
    .setTimestamp();

  const image = config.tickets.panelImage;
  if (image && /^https?:\/\//i.test(image)) embed.setImage(image);

  const channelId = config.tickets.panelChannelId;

  if (!channelId) {
    return interaction.reply({
      content: `${EMOJI.alert} Configure o canal do painel de tickets primeiro.`,
      ephemeral: true
    });
  }

  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return interaction.reply({
      content: `${EMOJI.negative} O canal configurado não foi encontrado.`,
      ephemeral: true
    });
  }

  await channel.send({
    embeds: [embed],
    components: [ticketCategoryMenu(config)]
  });

  saveData();

  return interaction.reply({
    content: `${EMOJI.accept} Painel de tickets publicado em ${channel}.`,
    ephemeral: true
  });
}

// Gera transcrição simples do ticket
async function createTicketTranscript(channel) {
  const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);

  if (!messages) return "Não foi possível recuperar as mensagens.";

  return messages
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map(message => {
      const date = new Date(message.createdTimestamp).toLocaleString("pt-BR");
      const content = message.content || "[Mensagem sem texto]";
      const attachments = [...message.attachments.values()]
        .map(file => file.url)
        .join(" ");

      return `[${date}] ${message.author.tag}: ${content} ${attachments}`;
    })
    .join("\n");
}

// Fecha ticket, envia transcrição e solicita feedback
async function closeTicket(interaction, ticketId) {
  const ticket = data.tickets[ticketId];

  if (!ticket || ticket.closed) {
    return interaction.reply({
      content: `${EMOJI.alert} Este ticket já foi encerrado.`,
      ephemeral: true
    });
  }

  if (!(await isTicketStaff(interaction, ticket))) {
    return interaction.reply({
      content: `${EMOJI.negative} Somente a equipe de suporte pode fechar este ticket.`,
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.channel;
  const transcript = await createTicketTranscript(channel);

  ticket.closed = true;
  ticket.closedAt = Date.now();
  ticket.closedBy = interaction.user.id;

  data.ticketTranscripts[ticketId] = {
    guildId: interaction.guild.id,
    channelName: channel.name,
    openerId: ticket.userId,
    closedBy: interaction.user.id,
    closedAt: Date.now(),
    content: transcript
  };

  saveData();

  // Envia transcrição para o canal de registros
  const config = getGuildConfig(interaction.guild.id);
  const logChannelId = config.tickets.logChannelId || config.logs.ticketChannelId;

  if (logChannelId) {
    const logChannel = await interaction.guild.channels
      .fetch(logChannelId)
      .catch(() => null);

    if (logChannel && logChannel.isTextBased()) {
      const attachment = new AttachmentBuilder(
        Buffer.from(transcript, "utf8"),
        { name: `transcricao-${ticketId}.txt` }
      );

      await logChannel.send({
        content:
          `${EMOJI.document} **Ticket encerrado**\n` +
          `Usuário: <@${ticket.userId}>\n` +
          `Responsável: ${interaction.user}\n` +
          `Canal: #${channel.name}`,
        files: [attachment]
      }).catch(() => null);
    }
  }

  // Mensagem privada para avaliação
  const opener = await client.users.fetch(ticket.userId).catch(() => null);

  if (opener) {
    const row = new ActionRowBuilder().addComponents(
      [1, 2, 3, 4, 5].map(score =>
        new ButtonBuilder()
          .setCustomId(`feedback_rate_${ticketId}_${score}`)
          .setLabel(String(score))
          .setStyle(score >= 4 ? ButtonStyle.Success : ButtonStyle.Secondary)
      )
    );

    await opener.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.purple)
          .setTitle(`${EMOJI.heart} Avalie seu atendimento`)
          .setDescription(
            "Seu ticket foi encerrado.\n\n" +
            "Como foi sua experiência com a equipe da ZYPhor?\n" +
            "Escolha uma nota de 1 a 5."
          )
      ],
      components: [row]
    }).catch(() => null);
  }

  await interaction.editReply({
    content: `${EMOJI.accept} Ticket encerrado. A transcrição foi processada.`
  });

  setTimeout(() => {
    channel.delete("Ticket encerrado").catch(() => null);
  }, 5000);
}

// Menu para adicionar membro ao ticket
async function showAddMemberMenu(interaction, ticketId) {
  const ticket = data.tickets[ticketId];

  if (!ticket || ticket.closed) {
    return interaction.reply({
      content: `${EMOJI.alert} Ticket indisponível.`,
      ephemeral: true
    });
  }

  if (!(await isTicketStaff(interaction, ticket))) {
    return interaction.reply({
      content: `${EMOJI.negative} Somente a equipe pode adicionar membros.`,
      ephemeral: true
    });
  }

  const menu = new UserSelectMenuBuilder()
    .setCustomId(`ticket_add_member_${ticketId}`)
    .setPlaceholder("Selecione quem terá acesso")
    .setMinValues(1)
    .setMaxValues(5);

  return interaction.reply({
    content: `${EMOJI.more} Selecione os membros que terão acesso ao ticket.`,
    components: [new ActionRowBuilder().addComponents(menu)],
    ephemeral: true
  });
}

// Publica o painel principal de configuração
async function handleConfigCommand(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: `${EMOJI.negative} Você não tem permissão para acessar a configuração.`,
      ephemeral: true
    });
  }

  return openConfigPanel(interaction);
}

// Interações
client.on("interactionCreate", async interaction => {
  try {
    // Comando /config
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "config") {
        return handleConfigCommand(interaction);
      }
      return;
    }

    // Menus de seleção
    if (interaction.isStringSelectMenu()) {
      const id = interaction.customId;

      if (id === "config_navigation") {
        if (!isAdmin(interaction)) {
          return interaction.reply({
            content: `${EMOJI.negative} Sem permissão.`,
            ephemeral: true
          });
        }

        const section = interaction.values[0];

        if (section === "home") {
          return interaction.update({
            embeds: [mainConfigEmbed(interaction.guild)],
            components: configMainComponents()
          });
        }

        return interaction.update({
          embeds: [sectionEmbed(interaction.guild, section)],
          components: sectionComponents(section)
        });
      }

      if (id === "ticket_open_category") {
        const config = getGuildConfig(interaction.guild.id);
        const selected = interaction.values[0];

        const categories = config.tickets.categories?.length
          ? config.tickets.categories
          : [
              { id: "ajuda", name: "Ajuda", description: "Preciso de ajuda", emoji: "🎫" },
              { id: "compra", name: "Compra", description: "Quero comprar", emoji: EMOJI.cart },
              { id: "suporte", name: "Suporte", description: "Suporte técnico", emoji: EMOJI.support }
            ];

        const category = categories.find(item => String(item.id) === selected);

        if (!category) {
          return interaction.reply({
            content: `${EMOJI.alert} Categoria não encontrada.`,
            ephemeral: true
          });
        }

        return createTicket(interaction, category);
      }

      if (id === "status_remove_select") {
        if (!isAdmin(interaction)) {
          return interaction.reply({ content: "Sem permissão.", ephemeral: true });
        }

        const config = getStatusData();

        const index = Number(interaction.values[0]);

        if (!Number.isInteger(index) || !config.activities[index]) {
          return interaction.reply({
            content: `${EMOJI.alert} Status inválido.`,
            ephemeral: true
          });
        }

        config.activities.splice(index, 1);
        config.currentIndex = 0;

        saveData();
        startStatusRotation();

        return interaction.update({
          content: `${EMOJI.accept} Status removido.`,
          embeds: [],
          components: []
        });
      }

      return;
    }

    // Menus de canal e cargo
    if (
      interaction.isChannelSelectMenu() ||
      interaction.isRoleSelectMenu()
    ) {
      if (!isAdmin(interaction)) {
        return interaction.reply({
          content: `${EMOJI.negative} Sem permissão.`,
          ephemeral: true
        });
      }

      const config = getGuildConfig(interaction.guild.id);
      const selected = interaction.values[0];

      switch (interaction.customId) {
        case "ticket_panel_channel":
          config.tickets.panelChannelId = selected;
          break;

        case "ticket_parent_category":
          config.tickets.parentCategoryId = selected;
          break;

        case "ticket_support_role":
          config.tickets.supportRoleId = selected;
          break;

        case "ticket_log_channel":
          config.tickets.logChannelId = selected;
          break;

        case "ai_select_channels":
          config.ai.chatChannels = interaction.values;
          break;

        case "config_manager_role":
          config.permissions = config.permissions || {};
          config.permissions.managerRoleId = selected;
          break;

        default:
          return;
      }

      saveData();

      return interaction.reply({
        content: `${EMOJI.accept} Configuração salva.`,
        ephemeral: true
      });
    }

    // Seleção de usuário para adicionar ao ticket
    if (interaction.isUserSelectMenu()) {
      if (!interaction.customId.startsWith("ticket_add_member_")) return;

      const ticketId = interaction.customId.replace("ticket_add_member_", "");
      const ticket = data.tickets[ticketId];

      if (!ticket || ticket.closed) {
        return interaction.reply({
          content: `${EMOJI.alert} Ticket indisponível.`,
          ephemeral: true
        });
      }

      if (!(await isTicketStaff(interaction, ticket))) {
        return interaction.reply({
          content: `${EMOJI.negative} Sem permissão.`,
          ephemeral: true
        });
      }

      const channel = interaction.channel;

      for (const userId of interaction.values) {
        if (userId === ticket.userId) continue;

        await channel.permissionOverwrites.edit(userId, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true
        }).catch(() => null);
      }

      return interaction.update({
        content: `${EMOJI.accept} Acesso atualizado para os membros selecionados.`,
        components: []
      });
    }

    // Envio de modais
    if (interaction.isModalSubmit()) {
      if (!isAdmin(interaction)) {
        return interaction.reply({
          content: `${EMOJI.negative} Sem permissão.`,
          ephemeral: true
        });
      }

      if (interaction.customId === "status_activity_modal") {
        const config = getStatusData();

        const name = interaction.fields.getTextInputValue("activity_name").trim();
        const type = Number(interaction.fields.getTextInputValue("activity_type"));

        if (!name || ![0, 2, 3].includes(type)) {
          return interaction.reply({
            content: `${EMOJI.alert} Nome ou tipo inválido. Tipos aceitos: 0, 2 e 3.`,
            ephemeral: true
          });
        }

        config.activities.push({ name: truncate(name, 128), type });
        config.currentIndex = 0;

        saveData();
        startStatusRotation();

        return interaction.reply({
          content: `${EMOJI.accept} Novo status adicionado à rotação.`,
          ephemeral: true
        });
      }

      if (interaction.customId === "status_interval_modal") {
        const config = getStatusData();
        const seconds = Number(interaction.fields.getTextInputValue("interval_seconds"));

        if (!Number.isInteger(seconds) || seconds < 15 || seconds > 3600) {
          return interaction.reply({
            content: `${EMOJI.alert} Use um intervalo entre 15 e 3600 segundos.`,
            ephemeral: true
          });
        }

        config.intervalSeconds = seconds;

        saveData();
        startStatusRotation();

        return interaction.reply({
          content: `${EMOJI.accept} Intervalo atualizado para ${seconds} segundos.`,
          ephemeral: true
        });
      }

      return;
    }

    // Botões
    if (interaction.isButton()) {
      const id = interaction.customId;

      // Avaliação do atendimento
      if (id.startsWith("feedback_rate_")) {
        const parts = id.split("_");
        const ticketId = parts[2];
        const score = Number(parts[3]);

        if (!Number.isInteger(score) || score < 1 || score > 5) return;

        const ticket = data.tickets[ticketId];

        if (!ticket) {
          return interaction.reply({
            content: "Este atendimento não está mais disponível.",
            ephemeral: true
          });
        }

        data.feedbacks[ticketId] = {
          guildId: ticket.guildId,
          userId: interaction.user.id,
          score,
          createdAt: Date.now()
        };

        saveData();

        return interaction.update({
          content: `${EMOJI.accept} Obrigado por avaliar o atendimento!`,
          embeds: [],
          components: []
        });
      }

      if (id === "config_close") {
        return interaction.update({ content: "Painel fechado.", embeds: [], components: [] });
      }

      if (id === "config_refresh") {
        return interaction.update({
          embeds: [mainConfigEmbed(interaction.guild)],
          components: configMainComponents()
        });
      }

      if (id === "config_back") {
        return interaction.update({
          embeds: [mainConfigEmbed(interaction.guild)],
          components: configMainComponents()
        });
      }

      if (id.startsWith("section_refresh_")) {
        const section = id.replace("section_refresh_", "");

        return interaction.update({
          embeds: [sectionEmbed(interaction.guild, section)],
          components: sectionComponents(section)
        });
      }

      // Tickets
      if (id === "ticket_toggle") {
        const config = getGuildConfig(interaction.guild.id);
        config.tickets.enabled = !config.tickets.enabled;
        saveData();

        return interaction.update({
          embeds: [sectionEmbed(interaction.guild, "tickets")],
          components: sectionComponents("tickets")
        });
      }

      if (id === "ticket_panel_publish") {
        if (!isAdmin(interaction)) {
          return interaction.reply({ content: "Sem permissão.", ephemeral: true });
        }

        return publishTicketPanel(interaction);
      }

      // IA
      if (id === "ai_chat_toggle" || id === "ai_ticket_toggle") {
        const config = getGuildConfig(interaction.guild.id);

        if (id === "ai_chat_toggle") {
          config.ai.chatEnabled = !config.ai.chatEnabled;
        } else {
          config.ai.ticketEnabled = !config.ai.ticketEnabled;
        }

        saveData();

        return interaction.update({
          embeds: [sectionEmbed(interaction.guild, "ai")],
          components: sectionComponents("ai")
        });
      }

      // Status
      if (id === "status_toggle") {
        const config = getStatusData();
        config.enabled = !config.enabled;

        saveData();
        startStatusRotation();

        return interaction.update({
          embeds: [sectionEmbed(interaction.guild, "status")],
          components: sectionComponents("status")
        });
      }

      if (id === "status_add") {
        return interaction.showModal(statusActivityModal());
      }

      if (id === "status_interval") {
        return interaction.showModal(statusIntervalModal());
      }

      if (id === "status_reset") {
        const config = getStatusData();

        config.activities = DEFAULT_ACTIVITIES.map(item => ({ ...item }));
        config.currentIndex = 0;
        config.enabled = true;
        config.intervalSeconds = 15;

        saveData();
        startStatusRotation();

        return interaction.update({
          embeds: [sectionEmbed(interaction.guild, "status")],
          components: sectionComponents("status")
        });
      }

      if (id === "status_live") {
        return interaction.reply({
          embeds: [liveStatusEmbed(interaction.guild)],
          components: liveStatusComponents(),
          ephemeral: true
        });
      }

      // Ticket: assumir
      if (id.startsWith("ticket_claim_")) {
        const ticketId = id.replace("ticket_claim_", "");
        const ticket = data.tickets[ticketId];

        if (!ticket || ticket.closed) {
          return interaction.reply({
            content: `${EMOJI.alert} Ticket indisponível.`,
            ephemeral: true
          });
        }

        if (!(await isTicketStaff(interaction, ticket))) {
          return interaction.reply({
            content: `${EMOJI.negative} Somente a equipe pode assumir.`,
            ephemeral: true
          });
        }

        if (ticket.claimedBy) {
          return interaction.reply({
            content: `${EMOJI.alert} Este ticket já foi assumido por <@${ticket.claimedBy}>.`,
            ephemeral: true
          });
        }

        ticket.claimedBy = interaction.user.id;
        saveData();

        return interaction.reply({
          content: `${EMOJI.accept} ${interaction.user} assumiu este atendimento.`,
          allowedMentions: { users: [interaction.user.id] }
        });
      }

      // Ticket: adicionar membro
      if (id.startsWith("ticket_add_")) {
        const ticketId = id.replace("ticket_add_", "");
        return showAddMemberMenu(interaction, ticketId);
      }

      // Ticket: fechar
      if (id.startsWith("ticket_close_")) {
        const ticketId = id.replace("ticket_close_", "");
        return closeTicket(interaction, ticketId);
      }

      return;
    }
  } catch (error) {
    console.error("[INTERACTION ERROR]", error);

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${EMOJI.alert} Ocorreu um erro ao processar essa ação.`,
        ephemeral: true
      }).catch(() => null);
    }
  }
});

// Respostas da IA em canais e tickets
client.on("messageCreate", async message => {
  try {
    if (!message.guild || message.author.bot) return;
    if (!message.channel || !message.channel.isTextBased()) return;

    const config = getGuildConfig(message.guild.id);

    let historyKey = null;

    // IA dentro de ticket
    const ticket = Object.values(data.tickets).find(item =>
      item.channelId === message.channel.id &&
      !item.closed
    );

    if (ticket && config.ai.ticketEnabled) {
      historyKey = `ticket:${ticket.id}`;
    }

    // IA em canais selecionados
    if (
      !historyKey &&
      config.ai.chatEnabled &&
      config.ai.chatChannels?.includes(message.channel.id)
    ) {
      historyKey = `channel:${message.channel.id}:${message.author.id}`;
    }

    if (!historyKey) return;

    const busyKey = `${message.guild.id}:${historyKey}`;

    if (aiBusy.has(busyKey)) return;

    aiBusy.add(busyKey);

    try {
      await message.channel.sendTyping().catch(() => null);

      const response = await askGroq(
        message.guild.id,
        historyKey,
        message.content
      );

      if (!response) return;

      const chunks = response.match(/[\s\S]{1,1900}/g) || [];

      for (const chunk of chunks) {
        await message.reply({
          content: chunk,
          allowedMentions: { repliedUser: false }
        }).catch(() => null);
      }
    } finally {
      aiBusy.delete(busyKey);
    }
  } catch (error) {
    console.error("[AI MESSAGE ERROR]", error);
  }
});

// Boas-vindas
client.on("guildMemberAdd", async member => {
  try {
    const config = getGuildConfig(member.guild.id);

    if (!config.welcome.enabled || !config.welcome.channelId) return;

    const channel = await member.guild.channels
      .fetch(config.welcome.channelId)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) return;

    const message = (config.welcome.message || "Bem-vindo(a), {user}!")
      .replaceAll("{user}", `<@${member.id}>`)
      .replaceAll("{username}", member.user.username)
      .replaceAll("{server}", member.guild.name);

    await channel.send({
      content: message,
      allowedMentions: { users: [member.id] }
    });
  } catch (error) {
    console.error("[WELCOME ERROR]", error);
  }
});

// Comando por prefixo: z!feedbacks
client.on("messageCreate", async message => {
  try {
    if (!message.guild || message.author.bot) return;
    if (!message.content.toLowerCase().startsWith("z!feedbacks")) return;

    const feedbacks = Object.entries(data.feedbacks)
      .filter(([_, feedback]) => feedback.guildId === message.guild.id)
      .sort((a, b) => b[1].createdAt - a[1].createdAt)
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setColor(COLORS.purple)
      .setTitle(`${EMOJI.heart} Feedbacks da ZYPhor`)
      .setDescription(
        feedbacks.length
          ? feedbacks.map(([ticketId, feedback]) =>
              `**Nota:** ${"⭐".repeat(feedback.score)}\n` +
              `**Usuário:** <@${feedback.userId}>\n` +
              `**Ticket:** \`${ticketId}\``
            ).join("\n\n")
          : "Ainda não existem avaliações registradas."
      )
      .setFooter({ text: "ZYPhor • Feedbacks" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error("[FEEDBACK COMMAND ERROR]", error);
  }
});

// Inicialização final
if (!TOKEN) {
  console.error("[ZYPhor] Configure a variável DISCORD_TOKEN na hospedagem.");
} else {
  client.login(TOKEN).catch(error => {
    console.error("[ZYPhor] Falha ao conectar o bot:", error);
  });
}

// FIM DO INDEX.JS
