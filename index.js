
const {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
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
  AttachmentBuilder,
  SlashCommandBuilder
} = require("discord.js");

const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.DISCORD_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const OWNER_ID = "1533306874513068093";
const PREFIX = "z!";

const DATA_FILE = path.join(__dirname, "data.json");

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

const groq = GROQ_API_KEY
  ? new Groq({ apiKey: GROQ_API_KEY })
  : null;

/* ==========================================
   EMOJIS PERSONALIZADOS ZYPHOR
========================================== */

const E = {
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
  vip: "<:vip:1559077642593108008>",
  activated: "<:ativado:1548843821503221791>",
  disabled: "<:desligado:1548843820295266486>"
};

/* ==========================================
   CORES
========================================== */

const COLOR = {
  main: 0x171717,
  purple: 0x8B5CF6,
  success: 0x22C55E,
  warning: 0xF59E0B,
  danger: 0xEF4444,
  white: 0xFFFFFF
};

/* ==========================================
   DADOS
========================================== */

function defaultData() {
  return {
    version: 6,
    guilds: {},
    tickets: {},
    ticketCounters: {},
    ticketTranscripts: {},
    feedbacks: {},
    aiHistory: {},
    publications: {},
    termsAcceptances: {},
    warnings: {},
    securityLogs: {},
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
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(defaultData(), null, 2)
      );
    }

    const saved = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    const base = defaultData();

    return {
      ...base,
      ...saved,
      guilds: saved.guilds || {},
      tickets: saved.tickets || {},
      ticketCounters: saved.ticketCounters || {},
      ticketTranscripts: saved.ticketTranscripts || {},
      feedbacks: saved.feedbacks || {},
      aiHistory: saved.aiHistory || {},
      publications: saved.publications || {},
      termsAcceptances: saved.termsAcceptances || {},
      warnings: saved.warnings || {},
      securityLogs: saved.securityLogs || {},
      statusRotation: {
        ...base.statusRotation,
        ...(saved.statusRotation || {})
      }
    };
  } catch (error) {
    console.error("[DATA] Erro ao carregar:", error);
    return defaultData();
  }
}

let data = loadData();

let saveTimer;

function saveData() {
  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.error("[DATA] Erro ao salvar:", error);
    }
  }, 300);
}

/* ==========================================
   CONFIGURAÇÃO PADRÃO DOS SERVIDORES
========================================== */

function defaultGuildConfig() {
  return {
    permissions: {
      managerRoleId: null,
      moderationRoleId: null
    },

    tickets: {
      enabled: true,
      panelChannelId: null,
      parentCategoryId: null,
      supportRoleId: null,
      logChannelId: null,
      panelImage: null,
      mode: "channel",
      categories: [
        {
          id: "ajuda",
          name: "Ajuda",
          description: "Preciso de ajuda",
          emoji: "🎫"
        },
        {
          id: "compra",
          name: "Compra",
          description: "Quero realizar uma compra",
          emoji: E.cart
        },
        {
          id: "suporte",
          name: "Suporte técnico",
          description: "Preciso de suporte técnico",
          emoji: E.support
        }
      ]
    },

    ai: {
      chatEnabled: false,
      ticketEnabled: false,
      chatChannels: [],
      model: "llama-3.3-70b-versatile",
      systemPrompt:
        "Você é a IA oficial da ZYPhor. Seja educada, objetiva e prestativa. Nunca finja ser um atendente humano."
    },

    security: {
      honeypotEnabled: false,
      honeypotChannelId: null,
      honeypotTimeoutDays: 7,
      antiLinkEnabled: false,
      antiLinkAction: "delete",
      antiSpamEnabled: false,
      antiSpamAction: "timeout",
      antiRaidEnabled: false,
      antiRaidAction: "timeout",
      antiBotEnabled: false,
      antiBotAction: "kick",
      antiMentionEnabled: false,
      antiMentionLimit: 5,
      prohibitedWords: [],
      ignoredChannels: []
    },

    moderation: {
      enabled: true,
      logChannelId: null,
      warnLimit: 3
    },

    welcome: {
      enabled: false,
      channelId: null,
      message: "Bem-vindo(a), {user}!"
    },

    publications: {
      rulesChannelId: null,
      termsChannelId: null,
      announcementsChannelId: null,
      feedbackChannelId: null
    },

    logs: {
      securityChannelId: null,
      moderationChannelId: null,
      ticketChannelId: null
    }
  };
}

function getGuildConfig(guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = defaultGuildConfig();
    saveData();
  }

  const base = defaultGuildConfig();

  data.guilds[guildId] = {
    ...base,
    ...data.guilds[guildId],
    permissions: {
      ...base.permissions,
      ...(data.guilds[guildId].permissions || {})
    },
    tickets: {
      ...base.tickets,
      ...(data.guilds[guildId].tickets || {})
    },
    ai: {
      ...base.ai,
      ...(data.guilds[guildId].ai || {})
    },
    security: {
      ...base.security,
      ...(data.guilds[guildId].security || {})
    },
    moderation: {
      ...base.moderation,
      ...(data.guilds[guildId].moderation || {})
    },
    welcome: {
      ...base.welcome,
      ...(data.guilds[guildId].welcome || {})
    },
    publications: {
      ...base.publications,
      ...(data.guilds[guildId].publications || {})
    },
    logs: {
      ...base.logs,
      ...(data.guilds[guildId].logs || {})
    }
  };

  return data.guilds[guildId];
}

/* ==========================================
   FUNÇÕES AUXILIARES
========================================== */

function truncate(value, max = 100) {
  return String(value || "").slice(0, max);
}

function makeId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)
  );
}

function isAdmin(interaction) {
  if (interaction.user.id === OWNER_ID) return true;

  if (
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  ) return true;

  const config = interaction.guild
    ? getGuildConfig(interaction.guild.id)
    : null;

  const roleId = config?.permissions?.managerRoleId;

  if (
    roleId &&
    interaction.member?.roles?.cache?.has(roleId)
  ) return true;

  return false;
}

function statusText(enabled) {
  return enabled ? E.activated : E.disabled;
}

/* ==========================================
   COMPONENTS V2 — CONSTRUTOR
========================================== */

function textDisplay(content) {
  return new TextDisplayBuilder().setContent(content);
}

function separator() {
  return new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(1);
}

function makeContainer(color = COLOR.main) {
  return new ContainerBuilder().setAccentColor(color);
}

function makePanel(title, description, color = COLOR.purple) {
  return makeContainer(color)
    .addTextDisplayComponents(
      textDisplay(`# ${E.config} ${title}`)
    )
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(
      textDisplay(description)
    );
}

function panelResponse(container, components = []) {
  return {
    components: [container, ...components],
    flags: MessageFlags.IsComponentsV2
  };
}

/* ==========================================
   PAINEL PRINCIPAL /CONFIG
========================================== */

function mainConfigPanel(guild) {
  const config = getGuildConfig(guild.id);

  const container = makeContainer(COLOR.purple);

  container.addTextDisplayComponents(
    textDisplay(
      `# ${E.config} ZYPHOR • CENTRAL DE CONTROLE\n` +
      `### ${E.server} ${guild.name}\n` +
      `Gerencie todos os sistemas do servidor em um único lugar.`
    )
  );

  container.addSeparatorComponents(separator());

  container.addTextDisplayComponents(
    textDisplay(
      `## ${E.bars} SISTEMAS\n\n` +
      `${E.ticket} **Tickets:** ${statusText(config.tickets.enabled)}\n` +
      `${E.heart} **IA nos tickets:** ${statusText(config.ai.ticketEnabled)}\n` +
      `${E.online} **IA nos canais:** ${statusText(config.ai.chatEnabled)}\n` +
      `${E.security} **Honeypot:** ${statusText(config.security.honeypotEnabled)}\n` +
      `${E.link} **Anti-link:** ${statusText(config.security.antiLinkEnabled)}\n` +
      `${E.alert} **Anti-spam:** ${statusText(config.security.antiSpamEnabled)}\n` +
      `${E.shield} **Anti-raid:** ${statusText(config.security.antiRaidEnabled)}`
    )
  );

  container.addSeparatorComponents(separator());

  container.addTextDisplayComponents(
    textDisplay(
      `## ${E.owner} ADMINISTRAÇÃO\n` +
      `Selecione abaixo o sistema que deseja configurar.`
    )
  );

  container.addTextDisplayComponents(
    textDisplay(
      `-# ZYPhor Bot • Sistema de gerenciamento`
    )
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId("config_navigation")
    .setPlaceholder("Selecione uma categoria")
    .addOptions(
      {
        label: "Tickets",
        value: "tickets",
        description: "Painéis, categorias e atendimento",
        emoji: "🎫"
      },
      {
        label: "Inteligência Artificial",
        value: "ai",
        description: "IA dos canais e tickets",
        emoji: "🤖"
      },
      {
        label: "Segurança",
        value: "security",
        description: "Honeypot, anti-link, anti-spam e raid",
        emoji: "🛡️"
      },
      {
        label: "Moderação",
        value: "moderation",
        description: "Punições e registros",
        emoji: "🔨"
      },
      {
        label: "Boas-vindas",
        value: "welcome",
        description: "Entrada e saída de membros",
        emoji: "👋"
      },
      {
        label: "Publicações",
        value: "publications",
        description: "Regras, termos e avisos",
        emoji: "📢"
      },
      {
        label: "Status",
        value: "status",
        description: "Status automático e Ao Vivo",
        emoji: "🟣"
      }
    );

  const row = new ActionRowBuilder().addComponents(menu);

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("config_refresh")
      .setLabel("Atualizar")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("config_close")
      .setLabel("Fechar")
      .setEmoji("✖️")
      .setStyle(ButtonStyle.Danger)
  );

  return panelResponse(container, [row, buttons]);
}

/* ==========================================
   COMANDO /CONFIG
========================================== */

const commands = [
  new SlashCommandBuilder()
    .setName("config")
    .setDescription("Abrir a central de configuração da ZYPhor")
    .setDMPermission(false)
];

async function registerCommands() {
  try {
    await client.application.commands.set(
      commands.map(command => command.toJSON())
    );

    console.log("[ZYPhor] Comandos registrados.");
  } catch (error) {
    console.error("[ZYPhor] Erro ao registrar comandos:", error);
  }
}

async function openConfigPanel(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: `${E.negative} Você não tem permissão para acessar o painel.`,
      ephemeral: true
    });
  }

  return interaction.reply({
    ...mainConfigPanel(interaction.guild),
    ephemeral: true
  });
}

// FIM DA PARTE 1/4
// ================================================
// ZYPHOR BOT — INDEX.JS
// PARTE 2/4 — PAINÉIS COMPONENTS V2
// ================================================

function actionButton(id, label, style = ButtonStyle.Secondary, emoji = null) {
  const button = new ButtonBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setStyle(style);

  if (emoji) button.setEmoji(emoji);
  return button;
}

function sectionHeader(title, description = "") {
  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## ${title}`)
  );

  if (description) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(description)
    );
  }

  return container;
}

function configFooter() {
  return new ActionRowBuilder().addComponents(
    actionButton("config_home", "Início", ButtonStyle.Secondary, "🏠"),
    actionButton("config_refresh", "Atualizar", ButtonStyle.Secondary, "🔄"),
    actionButton("config_close", "Fechar", ButtonStyle.Danger, "✖️")
  );
}

function statusLine(label, enabled) {
  return `${enabled ? E.activated : E.disabled} **${label}:** ${enabled ? "Ativado" : "Desativado"}`;
}

// ================================================
// PAINEL DE TICKETS
// ================================================

function ticketsPanel(guild) {
  const cfg = getGuildConfig(guild.id);

  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${E.ticket} Sistema de Tickets\n` +
        `Configure o atendimento, categorias, equipe e registros.\n\n` +
        `${statusLine("Sistema de tickets", cfg.tickets.enabled)}\n` +
        `${statusLine("IA nos tickets", cfg.ai.ticketEnabled)}\n` +
        `**Categoria:** ${cfg.tickets.categoryId ? `<#${cfg.tickets.categoryId}>` : "Não configurada"}\n` +
        `**Cargo de suporte:** ${cfg.tickets.supportRoleId ? `<@&${cfg.tickets.supportRoleId}>` : "Não configurado"}`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("### Canais e permissões")
    );

  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId("ticket_panel_channel")
    .setPlaceholder("Selecionar canal do painel")
    .setChannelTypes(ChannelType.GuildText)
    .setMinValues(0)
    .setMaxValues(1);

  const categoryMenu = new ChannelSelectMenuBuilder()
    .setCustomId("ticket_category")
    .setPlaceholder("Selecionar categoria dos tickets")
    .setChannelTypes(ChannelType.GuildCategory)
    .setMinValues(0)
    .setMaxValues(1);

  const roleMenu = new RoleSelectMenuBuilder()
    .setCustomId("ticket_support_role")
    .setPlaceholder("Selecionar cargo de suporte")
    .setMinValues(0)
    .setMaxValues(1);

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(channelMenu),
    new ActionRowBuilder().addComponents(categoryMenu),
    new ActionRowBuilder().addComponents(roleMenu),
    new ActionRowBuilder().addComponents(
      actionButton("ticket_toggle", "Ativar/Desativar", ButtonStyle.Secondary, "⚙️"),
      actionButton("ticket_panel_publish", "Publicar painel", ButtonStyle.Success, E.ticket),
      actionButton("ticket_panel_preview", "Pré-visualizar", ButtonStyle.Primary, "👁️")
    ),
    configFooter()
  );

  return container;
}

// ================================================
// PAINEL DE INTELIGÊNCIA ARTIFICIAL
// ================================================

function aiPanel(guild) {
  const cfg = getGuildConfig(guild.id);

  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# 🤖 Inteligência Artificial\n` +
        `Configure a IA do servidor e o atendimento inteligente dos tickets.\n\n` +
        `${statusLine("IA nos canais", cfg.ai.enabled)}\n` +
        `${statusLine("IA nos tickets", cfg.ai.ticketEnabled)}\n` +
        `**Modelo:** \`${cfg.ai.model || "llama-3.3-70b-versatile"}\`\n` +
        `**API:** ${GROQ_API_KEY ? `${E.activated} Configurada` : `${E.disabled} Não configurada`}`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("### Configurações")
    );

  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId("ai_channel_select")
    .setPlaceholder("Selecionar canais onde a IA pode responder")
    .setChannelTypes(ChannelType.GuildText)
    .setMinValues(0)
    .setMaxValues(10);

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(channelMenu),
    new ActionRowBuilder().addComponents(
      actionButton("ai_toggle", "IA nos canais", ButtonStyle.Secondary, "🤖"),
      actionButton("ai_ticket_toggle", "IA nos tickets", ButtonStyle.Secondary, E.ticket),
      actionButton("ai_test", "Testar API", ButtonStyle.Success, "🧪")
    ),
    new ActionRowBuilder().addComponents(
      actionButton("ai_prompt", "Personalidade", ButtonStyle.Primary, "✍️"),
      actionButton("ai_clear_history", "Limpar histórico", ButtonStyle.Danger, E.trash)
    ),
    configFooter()
  );

  return container;
}

// ================================================
// PAINEL DE SEGURANÇA
// ================================================

function securityPanel(guild) {
  const cfg = getGuildConfig(guild.id);

  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${E.security} Segurança do servidor\n` +
        `Gerencie os sistemas de proteção automática.\n\n` +
        `${statusLine("Honeypot", cfg.security.honeypot)}\n` +
        `${statusLine("Anti-link", cfg.security.antiLink)}\n` +
        `${statusLine("Anti-spam", cfg.security.antiSpam)}\n` +
        `${statusLine("Anti-raid", cfg.security.antiRaid)}\n` +
        `${statusLine("Anti-bot", cfg.security.antiBot)}\n` +
        `${statusLine("Anti-mention", cfg.security.antiMention)}`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("### Canais de proteção")
    );

  const honeypotChannel = new ChannelSelectMenuBuilder()
    .setCustomId("security_honeypot_channel")
    .setPlaceholder("Selecionar canal Honeypot")
    .setChannelTypes(ChannelType.GuildText)
    .setMinValues(0)
    .setMaxValues(1);

  const logChannel = ChannelSelectMenuBuilder
    ? new ChannelSelectMenuBuilder()
        .setCustomId("security_log_channel")
        .setPlaceholder("Selecionar canal de registros")
        .setChannelTypes(ChannelType.GuildText)
        .setMinValues(0)
        .setMaxValues(1)
    : null;

  const actionMenu = new StringSelectMenuBuilder()
    .setCustomId("security_action_select")
    .setPlaceholder("Ação automática")
    .addOptions(
      { label: "Apagar mensagem", value: "delete", emoji: "🗑️" },
      { label: "Timeout", value: "timeout", emoji: "⏳" },
      { label: "Expulsar", value: "kick", emoji: "👢" },
      { label: "Banir", value: "ban", emoji: "🔨" }
    );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(honeypotChannel),
    new ActionRowBuilder().addComponents(logChannel),
    new ActionRowBuilder().addComponents(
      actionButton("security_toggle_honeypot", "Honeypot", ButtonStyle.Secondary),
      actionButton("security_toggle_link", "Anti-link", ButtonStyle.Secondary),
      actionButton("security_toggle_spam", "Anti-spam", ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      actionButton("security_toggle_raid", "Anti-raid", ButtonStyle.Secondary),
      actionButton("security_toggle_bot", "Anti-bot", ButtonStyle.Secondary),
      actionButton("security_toggle_mention", "Anti-mention", ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(actionMenu),
    configFooter()
  );

  return container;
}

// ================================================
// PAINEL DE MODERAÇÃO
// ================================================

function moderationPanel(guild) {
  const cfg = getGuildConfig(guild.id);

  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${E.shield} Moderação\n` +
        `Configure os registros e ferramentas da equipe.\n\n` +
        `${statusLine("Moderação", cfg.moderation.enabled)}\n` +
        `**Limite de avisos:** ${cfg.moderation.warnLimit || 3}\n` +
        `**Canal de logs:** ${cfg.moderation.logChannelId ? `<#${cfg.moderation.logChannelId}>` : "Não configurado"}`
      )
    );

  const logMenu = new ChannelSelectMenuBuilder()
    .setCustomId("moderation_log_channel")
    .setPlaceholder("Selecionar canal de logs")
    .setChannelTypes(ChannelType.GuildText)
    .setMinValues(0)
    .setMaxValues(1);

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(logMenu),
    new ActionRowBuilder().addComponents(
      actionButton("moderation_toggle", "Ativar/Desativar", ButtonStyle.Secondary, "⚙️"),
      actionButton("moderation_warn_limit", "Limite de avisos", ButtonStyle.Primary, "⚠️")
    ),
    configFooter()
  );

  return container;
}

// ================================================
// PAINEL DE BOAS-VINDAS
// ================================================

function welcomePanel(guild) {
  const cfg = getGuildConfig(guild.id);

  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# 👋 Boas-vindas\n` +
        `Configure as mensagens de entrada e saída.\n\n` +
        `${statusLine("Boas-vindas", cfg.welcome.enabled)}\n` +
        `**Canal:** ${cfg.welcome.channelId ? `<#${cfg.welcome.channelId}>` : "Não configurado"}\n` +
        `**Cargo automático:** ${cfg.welcome.autoRoleId ? `<@&${cfg.welcome.autoRoleId}>` : "Não configurado"}`
      )
    );

  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId("welcome_channel")
    .setPlaceholder("Selecionar canal de boas-vindas")
    .setChannelTypes(ChannelType.GuildText)
    .setMinValues(0)
    .setMaxValues(1);

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(channelMenu),
    new ActionRowBuilder().addComponents(
      actionButton("welcome_toggle", "Ativar/Desativar", ButtonStyle.Secondary, "⚙️"),
      actionButton("welcome_message", "Editar mensagem", ButtonStyle.Primary, "✍️")
    ),
    configFooter()
  );

  return container;
}

// ================================================
// PAINEL DE PUBLICAÇÕES
// ================================================

function publicationsPanel(guild) {
  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${E.document} Publicações\n` +
        `Crie e envie mensagens organizadas para seu servidor.\n\n` +
        `Escolha o tipo de publicação que deseja configurar.`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      actionButton("publication_rules", "Regras", ButtonStyle.Secondary, E.rules),
      actionButton("publication_terms", "Termos", ButtonStyle.Secondary, E.document),
      actionButton("publication_announcement", "Aviso", ButtonStyle.Secondary, E.alert)
    ),
    new ActionRowBuilder().addComponents(
      actionButton("publication_feedback", "Feedbacks", ButtonStyle.Primary, E.comment),
      actionButton("publication_image", "Imagem opcional", ButtonStyle.Secondary, "🖼️")
    ),
    configFooter()
  );

  return container;
}

// ================================================
// PAINEL DE STATUS
// ================================================

function statusPanel(guild) {
  const rotation = data.statusRotation;
  const activities = rotation.activities || [];

  const list = activities.length
    ? activities.map((item, index) => `\`${index + 1}.\` ${item.name}`).join("\n")
    : "Nenhum status cadastrado.";

  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${E.online} Status automático\n` +
        `Configure a rotação de atividades do bot.\n\n` +
        `${statusLine("Rotação automática", rotation.enabled)}\n` +
        `**Intervalo:** ${rotation.intervalSeconds || 15} segundos\n` +
        `**Status cadastrados:** ${activities.length}\n\n` +
        `### Lista de status\n${list}`
      )
    );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      actionButton("status_toggle", "Ativar/Pausar", ButtonStyle.Secondary, "⚙️"),
      actionButton("status_add", "Adicionar", ButtonStyle.Success, "➕"),
      actionButton("status_remove", "Remover", ButtonStyle.Danger, E.trash)
    ),
    new ActionRowBuilder().addComponents(
      actionButton("status_interval", "Intervalo", ButtonStyle.Primary, E.clock),
      actionButton("status_reset", "Restaurar padrão", ButtonStyle.Secondary, "🔄")
    ),
    configFooter()
  );

  return container;
}

// ================================================
// FIM DA PARTE 2/4
// ================================================
// ================================================
// ZYPHOR BOT — INDEX.JS
// PARTE 3/4 — INTERAÇÕES E CONFIGURAÇÕES
// ================================================

// ================================================
// FUNÇÕES AUXILIARES
// ================================================

function getPanelBySection(guild, section) {
  const panels = {
    home: () => mainConfigPanel(guild),
    tickets: () => ticketsPanel(guild),
    ai: () => aiPanel(guild),
    security: () => securityPanel(guild),
    moderation: () => moderationPanel(guild),
    welcome: () => welcomePanel(guild),
    publications: () => publicationsPanel(guild),
    status: () => statusPanel(guild)
  };

  return panels[section]?.() || mainConfigPanel(guild);
}

async function updateConfigPanel(interaction, section = "home") {
  const container = getPanelBySection(interaction.guild, section);

  return interaction.update({
    components: [container],
    flags: MessageFlags.IsComponentsV2
  });
}

async function replyConfigPanel(interaction, section = "home") {
  const container = getPanelBySection(interaction.guild, section);

  return interaction.reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });
}

function makeModal(customId, title, fields) {
  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title);

  for (const field of fields) {
    const input = new TextInputBuilder()
      .setCustomId(field.id)
      .setLabel(field.label)
      .setStyle(field.style || TextInputStyle.Short)
      .setRequired(field.required ?? true);

    if (field.placeholder) input.setPlaceholder(field.placeholder);
    if (field.value) input.setValue(String(field.value));
    if (field.maxLength) input.setMaxLength(field.maxLength);
    if (field.minLength) input.setMinLength(field.minLength);

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );
  }

  return modal;
}

async function sendConfigNotice(interaction, message, ephemeral = true) {
  const payload = {
    content: message,
    ephemeral
  };

  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(payload);
  }

  return interaction.reply(payload);
}

function toggleValue(object, key) {
  object[key] = !object[key];
  saveData();
  return object[key];
}

function getSelectedValue(interaction) {
  return interaction.values?.[0] || null;
}

// ================================================
// AUTORIZAÇÃO DOS PAINÉIS
// ================================================

function canManageConfig(interaction) {
  if (!interaction.guild || !interaction.member) return false;

  return isAdmin(interaction.member, interaction.guild.id);
}

async function checkConfigPermission(interaction) {
  if (canManageConfig(interaction)) return true;

  await sendConfigNotice(
    interaction,
    `${E.prohibited} Você não tem permissão para configurar o Zyphor Bot.`
  );

  return false;
}

// ================================================
// CORREÇÃO DOS PAINÉIS: LIMITE DE LINHAS
// ================================================

// O Discord permite até 5 linhas de componentes por mensagem.
// Estes painéis usam seletores separados em respostas temporárias.

function ticketsPanelCompact(guild) {
  const cfg = getGuildConfig(guild.id);

  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${E.ticket} Sistema de Tickets\n` +
        `${statusLine("Sistema", cfg.tickets.enabled)}\n\n` +
        `**Canal do painel:** ${cfg.tickets.panelChannelId ? `<#${cfg.tickets.panelChannelId}>` : "Não configurado"}\n` +
        `**Categoria:** ${cfg.tickets.categoryId ? `<#${cfg.tickets.categoryId}>` : "Não configurada"}\n` +
        `**Suporte:** ${cfg.tickets.supportRoleId ? `<@&${cfg.tickets.supportRoleId}>` : "Não configurado"}`
      )
    );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      actionButton("ticket_select_panel_channel", "Canal do painel", ButtonStyle.Secondary),
      actionButton("ticket_select_category", "Categoria", ButtonStyle.Secondary),
      actionButton("ticket_select_support", "Cargo suporte", ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      actionButton("ticket_select_logs", "Canal de logs", ButtonStyle.Secondary),
      actionButton("ticket_toggle", "Ativar/Desativar", ButtonStyle.Secondary),
      actionButton("ticket_panel_publish", "Publicar", ButtonStyle.Success)
    ),
    configFooter()
  );

  return container;
}

function securityPanelCompact(guild) {
  const cfg = getGuildConfig(guild.id);

  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${E.security} Segurança\n` +
        `${statusLine("Honeypot", cfg.security.honeypot)}\n` +
        `${statusLine("Anti-link", cfg.security.antiLink)}\n` +
        `${statusLine("Anti-spam", cfg.security.antiSpam)}\n` +
        `${statusLine("Anti-raid", cfg.security.antiRaid)}\n` +
        `${statusLine("Anti-bot", cfg.security.antiBot)}\n` +
        `${statusLine("Anti-mention", cfg.security.antiMention)}\n\n` +
        `**Canal Honeypot:** ${cfg.security.honeypotChannelId ? `<#${cfg.security.honeypotChannelId}>` : "Não configurado"}\n` +
        `**Logs:** ${cfg.security.logChannelId ? `<#${cfg.security.logChannelId}>` : "Não configurado"}`
      )
    );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      actionButton("security_toggle_honeypot", "Honeypot", ButtonStyle.Secondary),
      actionButton("security_toggle_link", "Anti-link", ButtonStyle.Secondary),
      actionButton("security_toggle_spam", "Anti-spam", ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      actionButton("security_toggle_raid", "Anti-raid", ButtonStyle.Secondary),
      actionButton("security_toggle_bot", "Anti-bot", ButtonStyle.Secondary),
      actionButton("security_toggle_mention", "Anti-mention", ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      actionButton("security_select_honeypot", "Canal Honeypot", ButtonStyle.Primary),
      actionButton("security_select_logs", "Canal de logs", ButtonStyle.Primary),
      actionButton("security_action_button", "Ação automática", ButtonStyle.Secondary)
    ),
    configFooter()
  );

  return container;
}

// Substitui as versões anteriores pelos painéis compactos.
function ticketsPanel(guild) {
  return ticketsPanelCompact(guild);
}

function securityPanel(guild) {
  return securityPanelCompact(guild);
}

// ================================================
// SELETORES DE CANAIS E CARGOS
// ================================================

async function showChannelSelector(interaction, customId, placeholder, channelTypes = [ChannelType.GuildText]) {
  const menu = new ChannelSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(0)
    .setMaxValues(1)
    .setChannelTypes(...channelTypes);

  return interaction.reply({
    content: "Selecione a opção desejada:",
    components: [
      new ActionRowBuilder().addComponents(menu)
    ],
    ephemeral: true
  });
}

async function showRoleSelector(interaction, customId, placeholder) {
  const menu = new RoleSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(0)
    .setMaxValues(1);

  return interaction.reply({
    content: "Selecione o cargo desejado:",
    components: [
      new ActionRowBuilder().addComponents(menu)
    ],
    ephemeral: true
  });
}

// ================================================
// MENU DE AÇÕES DA CONFIGURAÇÃO
// ================================================

async function handleConfigSelect(interaction) {
  if (!await checkConfigPermission(interaction)) return;

  const cfg = getGuildConfig(interaction.guild.id);
  const value = getSelectedValue(interaction);
  const id = interaction.customId;

  if (id === "config_navigation") {
    return updateConfigPanel(interaction, value);
  }

  if (id === "ticket_panel_channel") {
    cfg.tickets.panelChannelId = value;
    saveData();
    return sendConfigNotice(interaction, `${E.activated} Canal do painel atualizado.`);
  }

  if (id === "ticket_category") {
    cfg.tickets.categoryId = value;
    saveData();
    return sendConfigNotice(interaction, `${E.activated} Categoria dos tickets atualizada.`);
  }

  if (id === "ticket_support_role") {
    cfg.tickets.supportRoleId = value;
    saveData();
    return sendConfigNotice(interaction, `${E.activated} Cargo de suporte atualizado.`);
  }

  if (id === "ai_channel_select") {
    cfg.ai.channels = interaction.values || [];
    saveData();
    return sendConfigNotice(interaction, `${E.activated} Canais da IA atualizados.`);
  }

  if (id === "security_honeypot_channel") {
    cfg.security.honeypotChannelId = value;
    saveData();
    return sendConfigNotice(interaction, `${E.activated} Canal Honeypot atualizado.`);
  }

  if (id === "security_log_channel") {
    cfg.security.logChannelId = value;
    saveData();
    return sendConfigNotice(interaction, `${E.activated} Canal de segurança atualizado.`);
  }

  if (id === "security_action_select") {
    cfg.security.action = value;
    saveData();
    return sendConfigNotice(interaction, `${E.activated} Ação automática definida: **${value}**.`);
  }

  if (id === "moderation_log_channel") {
    cfg.moderation.logChannelId = value;
    saveData();
    return sendConfigNotice(interaction, `${E.activated} Canal de moderação atualizado.`);
  }

  if (id === "welcome_channel") {
    cfg.welcome.channelId = value;
    saveData();
    return sendConfigNotice(interaction, `${E.activated} Canal de boas-vindas atualizado.`);
  }

  return sendConfigNotice(interaction, `${E.alert} Opção não reconhecida.`);
}

// ================================================
// MODAIS DE CONFIGURAÇÃO
// ================================================

async function showConfigModal(interaction, modalType) {
  const cfg = getGuildConfig(interaction.guild.id);

  if (modalType === "ai_prompt") {
    return interaction.showModal(
      makeModal("modal_ai_prompt", "Personalidade da IA", [
        {
          id: "prompt",
          label: "Como a IA deve se comportar?",
          style: TextInputStyle.Paragraph,
          placeholder: "Ex.: Seja educada, objetiva e ajude os membros...",
          value: cfg.ai.systemPrompt || "",
          maxLength: 2000
        }
      ])
    );
  }

  if (modalType === "welcome_message") {
    return interaction.showModal(
      makeModal("modal_welcome_message", "Mensagem de boas-vindas", [
        {
          id: "message",
          label: "Mensagem",
          style: TextInputStyle.Paragraph,
          placeholder: "Bem-vindo(a), {user}!",
          value: cfg.welcome.message || "",
          maxLength: 1800
        }
      ])
    );
  }

  if (modalType === "status_add") {
    return interaction.showModal(
      makeModal("modal_status_add", "Adicionar status", [
        {
          id: "name",
          label: "Texto do status",
          placeholder: "ZYPhor • Novidades",
          maxLength: 100
        }
      ])
    );
  }

  if (modalType === "status_interval") {
    return interaction.showModal(
      makeModal("modal_status_interval", "Intervalo dos status", [
        {
          id: "seconds",
          label: "Intervalo em segundos (mínimo 15)",
          placeholder: "15",
          maxLength: 3
        }
      ])
    );
  }

  if (modalType === "warn_limit") {
    return interaction.showModal(
      makeModal("modal_warn_limit", "Limite de avisos", [
        {
          id: "limit",
          label: "Quantidade de avisos",
          placeholder: "3",
          value: String(cfg.moderation.warnLimit || 3),
          maxLength: 2
        }
      ])
    );
  }

  if (modalType === "publication") {
    return interaction.showModal(
      makeModal("modal_publication", "Criar publicação", [
        {
          id: "title",
          label: "Título",
          placeholder: "Título da publicação",
          maxLength: 100
        },
        {
          id: "message",
          label: "Mensagem",
          style: TextInputStyle.Paragraph,
          placeholder: "Escreva o conteúdo...",
          maxLength: 3500
        }
      ])
    );
  }
}

// ================================================
// PROCESSAMENTO DOS MODAIS
// ================================================

async function handleConfigModal(interaction) {
  if (!await checkConfigPermission(interaction)) return;

  const cfg = getGuildConfig(interaction.guild.id);
  const id = interaction.customId;

  if (id === "modal_ai_prompt") {
    cfg.ai.systemPrompt = interaction.fields.getTextInputValue("prompt");
    saveData();

    return sendConfigNotice(
      interaction,
      `${E.activated} Personalidade da IA atualizada.`
    );
  }

  if (id === "modal_welcome_message") {
    cfg.welcome.message = interaction.fields.getTextInputValue("message");
    saveData();

    return sendConfigNotice(
      interaction,
      `${E.activated} Mensagem de boas-vindas atualizada.`
    );
  }

  if (id === "modal_status_add") {
    const name = interaction.fields.getTextInputValue("name").trim();

    if (!name) {
      return sendConfigNotice(interaction, `${E.alert} Digite um status válido.`);
    }

    if (!Array.isArray(data.statusRotation.activities)) {
      data.statusRotation.activities = [];
    }

    data.statusRotation.activities.push({
      name,
      type: 3
    });

    saveData();

    return sendConfigNotice(interaction, `${E.activated} Status adicionado.`);
  }

  if (id === "modal_status_interval") {
    const seconds = Number(
      interaction.fields.getTextInputValue("seconds")
    );

    if (!Number.isInteger(seconds) || seconds < 15 || seconds > 3600) {
      return sendConfigNotice(
        interaction,
        `${E.alert} Escolha um intervalo entre 15 e 3600 segundos.`
      );
    }

    data.statusRotation.intervalSeconds = seconds;
    saveData();

    return sendConfigNotice(interaction, `${E.activated} Intervalo atualizado.`);
  }

  if (id === "modal_warn_limit") {
    const limit = Number(
      interaction.fields.getTextInputValue("limit")
    );

    if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
      return sendConfigNotice(
        interaction,
        `${E.alert} O limite deve ser entre 1 e 20.`
      );
    }

    cfg.moderation.warnLimit = limit;
    saveData();

    return sendConfigNotice(interaction, `${E.activated} Limite de avisos atualizado.`);
  }

  if (id === "modal_publication") {
    const title = interaction.fields.getTextInputValue("title");
    const message = interaction.fields.getTextInputValue("message");

    data.publications[interaction.guild.id] ||= [];

    data.publications[interaction.guild.id].push({
      id: makeId(),
      title,
      message,
      authorId: interaction.user.id,
      createdAt: Date.now()
    });

    saveData();

    return sendConfigNotice(
      interaction,
      `${E.activated} Publicação salva. A próxima parte fará o envio ao canal escolhido.`
    );
  }
}

// ================================================
// BOTÕES DOS PAINÉIS
// ================================================

async function handleConfigButton(interaction) {
  if (!await checkConfigPermission(interaction)) return;

  const cfg = getGuildConfig(interaction.guild.id);
  const id = interaction.customId;

  if (id === "config_home") {
    return updateConfigPanel(interaction, "home");
  }

  if (id === "config_refresh") {
    return updateConfigPanel(interaction, "home");
  }

  if (id === "config_close") {
    return interaction.update({
      content: `${E.positive} Painel fechado.`,
      components: [],
      embeds: []
    });
  }

  if (id.startsWith("config_open_")) {
    const section = id.replace("config_open_", "");
    return updateConfigPanel(interaction, section);
  }

  if (id === "ticket_toggle") {
    toggleValue(cfg.tickets, "enabled");
    return updateConfigPanel(interaction, "tickets");
  }

  if (id === "ticket_panel_preview") {
    return interaction.reply({
      content: `${E.ticket} Pré-visualização do painel de tickets.`,
      ephemeral: true
    });
  }

  if (id === "ticket_panel_publish") {
    if (!cfg.tickets.panelChannelId) {
      return sendConfigNotice(interaction, `${E.alert} Configure o canal do painel primeiro.`);
    }

    const channel = await interaction.guild.channels.fetch(
      cfg.tickets.panelChannelId
    ).catch(() => null);

    if (!channel || !channel.isTextBased()) {
      return sendConfigNotice(interaction, `${E.alert} Canal do painel inválido.`);
    }

    return sendConfigNotice(
      interaction,
      `${E.alert} O envio do painel será conectado ao sistema de tickets na Parte 4.`
    );
  }

  if (id === "ticket_select_panel_channel") {
    return showChannelSelector(
      interaction,
      "ticket_panel_channel",
      "Canal do painel"
    );
  }

  if (id === "ticket_select_category") {
    return showChannelSelector(
      interaction,
      "ticket_category",
      "Categoria dos tickets",
      [ChannelType.GuildCategory]
    );
  }

  if (id === "ticket_select_support") {
    return showRoleSelector(
      interaction,
      "ticket_support_role",
      "Cargo de suporte"
    );
  }

  if (id === "ticket_select_logs") {
    return showChannelSelector(
      interaction,
      "ticket_log_channel",
      "Canal de logs"
    );
  }

  if (id === "ai_toggle") {
    toggleValue(cfg.ai, "enabled");
    return updateConfigPanel(interaction, "ai");
  }

  if (id === "ai_ticket_toggle") {
    toggleValue(cfg.ai, "ticketEnabled");
    return updateConfigPanel(interaction, "ai");
  }

  if (id === "ai_prompt") {
    return showConfigModal(interaction, "ai_prompt");
  }

  if (id === "ai_test") {
    if (!GROQ_API_KEY || !groq) {
      return sendConfigNotice(
        interaction,
        `${E.alert} Configure a variável GROQ_API_KEY na hospedagem.`
      );
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await groq.chat.completions.create({
        model: cfg.ai.model || "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: "Responda apenas: conexão funcionando." }
        ],
        max_tokens: 30
      });

      const response = result.choices?.[0]?.message?.content || "Sem resposta.";

      return interaction.editReply(
        `${E.activated} Teste concluído!\n${response}`
      );
    } catch (error) {
      console.error("[GROQ TEST]", error);
      return interaction.editReply(
        `${E.alert} Não foi possível testar a API. Verifique a chave e os limites da conta.`
      );
    }
  }

  if (id === "ai_clear_history") {
    data.aiHistory[interaction.guild.id] = {};
    saveData();

    return sendConfigNotice(interaction, `${E.activated} Histórico da IA limpo.`);
  }

  if (id === "security_toggle_honeypot") {
    toggleValue(cfg.security, "honeypot");
    return updateConfigPanel(interaction, "security");
  }

  if (id === "security_toggle_link") {
    toggleValue(cfg.security, "antiLink");
    return updateConfigPanel(interaction, "security");
  }

  if (id === "security_toggle_spam") {
    toggleValue(cfg.security, "antiSpam");
    return updateConfigPanel(interaction, "security");
  }

  if (id === "security_toggle_raid") {
    toggleValue(cfg.security, "antiRaid");
    return updateConfigPanel(interaction, "security");
  }

  if (id === "security_toggle_bot") {
    toggleValue(cfg.security, "antiBot");
    return updateConfigPanel(interaction, "security");
  }

  if (id === "security_toggle_mention") {
    toggleValue(cfg.security, "antiMention");
    return updateConfigPanel(interaction, "security");
  }

  if (id === "security_select_honeypot") {
    return showChannelSelector(
      interaction,
      "security_honeypot_channel",
      "Canal Honeypot"
    );
  }

  if (id === "security_select_logs") {
    return showChannelSelector(
      interaction,
      "security_log_channel",
      "Canal de registros"
    );
  }

  if (id === "security_action_button") {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("security_action_select")
      .setPlaceholder("Escolher ação automática")
      .addOptions(
        { label: "Apagar mensagem", value: "delete" },
        { label: "Timeout", value: "timeout" },
        { label: "Expulsar", value: "kick" },
        { label: "Banir", value: "ban" }
      );

    return interaction.reply({
      content: "Escolha a ação:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }

  if (id === "moderation_toggle") {
    toggleValue(cfg.moderation, "enabled");
    return updateConfigPanel(interaction, "moderation");
  }

  if (id === "moderation_log_channel") {
    return showChannelSelector(
      interaction,
      "moderation_log_channel",
      "Canal de moderação"
    );
  }

  if (id === "moderation_warn_limit") {
    return showConfigModal(interaction, "warn_limit");
  }

  if (id === "welcome_toggle") {
    toggleValue(cfg.welcome, "enabled");
    return updateConfigPanel(interaction, "welcome");
  }

  if (id === "welcome_message") {
    return showConfigModal(interaction, "welcome_message");
  }

  if (id === "status_toggle") {
    toggleValue(data.statusRotation, "enabled");
    saveData();
    return updateConfigPanel(interaction, "status");
  }

  if (id === "status_add") {
    return showConfigModal(interaction, "status_add");
  }

  if (id === "status_interval") {
    return showConfigModal(interaction, "status_interval");
  }

  if (id === "status_reset") {
    data.statusRotation.activities = [
      { name: "ZYPhor • /config", type: 3 },
      { name: "ZYPhor • Apps", type: 3 },
      { name: "ZYPhor • Tickets", type: 3 },
      { name: "ZYPhor • Inteligência Artificial", type: 3 },
      { name: "ZYPhor • Sistemas", type: 3 },
      { name: "ZYPhor • Ao Vivo", type: 3 }
    ];

    data.statusRotation.intervalSeconds = 15;
    data.statusRotation.currentIndex = 0;
    data.statusRotation.enabled = true;

    saveData();
    return updateConfigPanel(interaction, "status");
  }

  if (id === "status_remove") {
    const activities = data.statusRotation.activities || [];

    if (!activities.length) {
      return sendConfigNotice(interaction, `${E.alert} Não existem status para remover.`);
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId("status_remove_select")
      .setPlaceholder("Selecione o status que deseja remover")
      .addOptions(
        activities.slice(0, 25).map((activity, index) => ({
          label: activity.name.slice(0, 100),
          value: String(index)
        }))
      );

    return interaction.reply({
      content: "Qual status deseja remover?",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }

  if (id === "publication_rules") {
    return showConfigModal(interaction, "publication");
  }

  if (id === "publication_terms") {
    return showConfigModal(interaction, "publication");
  }

  if (id === "publication_announcement") {
    return showConfigModal(interaction, "publication");
  }

  if (id === "publication_feedback") {
    return sendConfigNotice(
      interaction,
      `${E.comment} Os feedbacks poderão ser consultados pelo comando z!feedbacks.`
    );
  }

  if (id === "publication_image") {
    return sendConfigNotice(
      interaction,
      "O envio de imagem será associado à publicação na próxima etapa."
    );
  }

  return sendConfigNotice(interaction, `${E.alert} Botão ainda não configurado.`);
}

// ================================================
// SELEÇÃO PARA REMOVER STATUS
// ================================================

async function handleStatusSelect(interaction) {
  if (!await checkConfigPermission(interaction)) return;

  if (interaction.customId !== "status_remove_select") return;

  const index = Number(interaction.values[0]);
  const activities = data.statusRotation.activities || [];

  if (!Number.isInteger(index) || !activities[index]) {
    return sendConfigNotice(interaction, `${E.alert} Status não encontrado.`);
  }

  const removed = activities.splice(index, 1)[0];

  data.statusRotation.currentIndex = 0;
  saveData();

  return sendConfigNotice(
    interaction,
    `${E.activated} Status removido: **${removed.name}**`
  );
}

// ================================================
// FIM DA PARTE 3/4
// ================================================
// ================================================
// ZYPHOR BOT — INDEX.JS
// PARTE 4/4 — EVENTOS, TICKETS, IA E INICIALIZAÇÃO
// ================================================

// ================================================
// CONTROLE INTERNO
// ================================================

const spamTracker = new Map();
const raidTracker = new Map();

function hasStaffPermission(member, guildId) {
  if (!member) return false;

  if (member.id === OWNER_ID) return true;

  const cfg = getGuildConfig(guildId);
  const supportRoleId = cfg.tickets?.supportRoleId;

  return (
    member.permissions?.has(PermissionFlagsBits.Administrator) ||
    member.permissions?.has(PermissionFlagsBits.ManageChannels) ||
    (supportRoleId && member.roles?.cache?.has(supportRoleId))
  );
}

function isTicketHelpRequest(content) {
  const text = content.toLowerCase();

  const phrases = [
    "preciso de ajuda",
    "preciso de um atendente",
    "quero falar com atendente",
    "chama o suporte",
    "chamar suporte",
    "quero suporte",
    "atendente por favor",
    "falar com suporte",
    "pode chamar alguém",
    "quero falar com alguém"
  ];

  return phrases.some(phrase => text.includes(phrase));
}

async function sendSecurityLog(guild, message) {
  const cfg = getGuildConfig(guild.id);
  const channelId = cfg.security.logChannelId || cfg.moderation.logChannelId;

  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);

  if (!channel || !channel.isTextBased()) return;

  await channel.send({
    content: message.slice(0, 1900)
  }).catch(() => {});
}

async function sendModerationLog(guild, message) {
  const cfg = getGuildConfig(guild.id);
  const channelId = cfg.moderation.logChannelId;

  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);

  if (!channel || !channel.isTextBased()) return;

  await channel.send({
    content: message.slice(0, 1900)
  }).catch(() => {});
}

// ================================================
// SISTEMA DE TICKETS
// ================================================

function buildTicketPanel() {
  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${E.ticket} Atendimento ZYPhor\n` +
        `Precisa de ajuda? Abra um ticket escolhendo o assunto abaixo.\n\n` +
        `${E.support} Nossa equipe poderá atender você assim que estiver disponível.\n` +
        `${E.lock} Seu atendimento será privado.`
      )
    );

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_open_select")
    .setPlaceholder("Selecione o assunto do atendimento")
    .addOptions(
      {
        label: "Ajuda",
        description: "Dúvidas e orientações gerais",
        value: "ajuda",
        emoji: "❓"
      },
      {
        label: "Compra",
        description: "Comprar ou consultar um produto",
        value: "comprar",
        emoji: "🛒"
      },
      {
        label: "Suporte técnico",
        description: "Problemas técnicos",
        value: "suporte-tecnico",
        emoji: "🛠️"
      },
      {
        label: "Outro assunto",
        description: "Outros tipos de atendimento",
        value: "outro",
        emoji: "📩"
      }
    );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(menu)
  );

  return container;
}

function buildTicketControls(ticketId) {
  return new ActionRowBuilder().addComponents(
    actionButton(`ticket_claim_${ticketId}`, "Atender", ButtonStyle.Success, "🤝"),
    actionButton(`ticket_add_${ticketId}`, "Adicionar membro", ButtonStyle.Secondary, "➕"),
    actionButton(`ticket_close_${ticketId}`, "Fechar", ButtonStyle.Danger, "🔒")
  );
}

async function publishTicketPanel(interaction) {
  const cfg = getGuildConfig(interaction.guild.id);
  const channelId = cfg.tickets.panelChannelId;

  if (!channelId) {
    return sendConfigNotice(
      interaction,
      `${E.alert} Configure o canal do painel primeiro.`
    );
  }

  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return sendConfigNotice(interaction, `${E.alert} Canal inválido.`);
  }

  await channel.send({
    components: [buildTicketPanel()],
    flags: MessageFlags.IsComponentsV2
  });

  return sendConfigNotice(
    interaction,
    `${E.activated} Painel de tickets publicado em ${channel}.`
  );
}

async function createTicket(interaction, category) {
  const guild = interaction.guild;
  const cfg = getGuildConfig(guild.id);

  if (!cfg.tickets.enabled) {
    return sendConfigNotice(interaction, `${E.disabled} Os tickets estão desativados.`);
  }

  if (!cfg.tickets.categoryId) {
    return sendConfigNotice(interaction, `${E.alert} A categoria dos tickets não foi configurada.`);
  }

  const existing = Object.values(data.tickets || {}).find(ticket =>
    ticket.guildId === guild.id &&
    ticket.userId === interaction.user.id &&
    ticket.status === "open"
  );

  if (existing) {
    const existingChannel = await guild.channels.fetch(existing.channelId).catch(() => null);

    if (existingChannel) {
      return sendConfigNotice(
        interaction,
        `${E.alert} Você já possui um ticket aberto: ${existingChannel}.`
      );
    }

    existing.status = "closed";
    saveData();
  }

  const categoryChannel = await guild.channels.fetch(cfg.tickets.categoryId).catch(() => null);

  if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
    return sendConfigNotice(interaction, `${E.alert} A categoria configurada não existe.`);
  }

  const ticketNumber = (data.ticketCounters[guild.id] || 0) + 1;
  data.ticketCounters[guild.id] = ticketNumber;

  const numberText = String(ticketNumber).padStart(4, "0");
  const categoryName = category.replace(/[^a-z0-9-]/gi, "").toLowerCase();

  const channelName = `${categoryName || "ticket"}-ticket-${numberText}`.slice(0, 90);

  const permissions = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
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
        PermissionFlagsBits.ManageMessages
      ]
    }
  ];

  if (cfg.tickets.supportRoleId) {
    permissions.push({
      id: cfg.tickets.supportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory
      ]
    });
  }

  await interaction.deferReply({ ephemeral: true });

  let channel;

  try {
    channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryChannel.id,
      permissionOverwrites: permissions,
      reason: `Ticket aberto por ${interaction.user.tag}`
    });
  } catch (error) {
    console.error("[TICKET CREATE]", error);

    return interaction.editReply(
      `${E.alert} Não consegui criar o canal. Verifique as permissões do bot.`
    );
  }

  const ticketId = `${guild.id}-${numberText}`;

  data.tickets[ticketId] = {
    id: ticketId,
    guildId: guild.id,
    channelId: channel.id,
    userId: interaction.user.id,
    category,
    number: numberText,
    status: "open",
    claimedBy: null,
    supportNotified: false,
    createdAt: Date.now()
  };

  saveData();

  const supportMention = cfg.tickets.supportRoleId
    ? `<@&${cfg.tickets.supportRoleId}>`
    : "";

  const container = new ContainerBuilder()
    .setAccentColor(COLOR.main)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${E.ticket} Ticket ${numberText}\n` +
        `Olá, <@${interaction.user.id}>! Seu atendimento foi criado.\n\n` +
        `**Assunto:** ${category}\n` +
        `**Responsável:** Aguardando atendimento\n` +
        `${E.clock} Aguarde a equipe responder.\n\n` +
        `${supportMention}`
      )
    );

  await channel.send({
    content: supportMention || undefined,
    components: [
      container,
      buildTicketControls(ticketId)
    ],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: {
      roles: cfg.tickets.supportRoleId ? [cfg.tickets.supportRoleId] : [],
      users: [interaction.user.id]
    }
  });

  await interaction.editReply(
    `${E.activated} Seu ticket foi criado: ${channel}`
  );

  await sendSecurityLog(
    guild,
    `${E.ticket} Ticket criado: ${channel} — usuário: <@${interaction.user.id}> — assunto: **${category}**`
  );
}

async function claimTicket(interaction, ticketId) {
  const ticket = data.tickets[ticketId];

  if (!ticket || ticket.status !== "open") {
    return sendConfigNotice(interaction, `${E.alert} Este ticket não está aberto.`);
  }

  if (!hasStaffPermission(interaction.member, interaction.guild.id)) {
    return sendConfigNotice(interaction, `${E.prohibited} Apenas a equipe pode atender tickets.`);
  }

  if (ticket.claimedBy) {
    return sendConfigNotice(
      interaction,
      `${E.alert} Este ticket já foi assumido por <@${ticket.claimedBy}>.`
    );
  }

  ticket.claimedBy = interaction.user.id;
  saveData();

  await interaction.channel.send({
    content: `${E.support} <@${interaction.user.id}> assumiu este atendimento.`
  });

  return interaction.reply({
    content: `${E.activated} Você assumiu o ticket.`,
    ephemeral: true
  });
}

async function addTicketMember(interaction, ticketId) {
  const ticket = data.tickets[ticketId];

  if (!ticket || ticket.status !== "open") {
    return sendConfigNotice(interaction, `${E.alert} Ticket inválido.`);
  }

  if (!hasStaffPermission(interaction.member, interaction.guild.id)) {
    return sendConfigNotice(interaction, `${E.prohibited} Apenas a equipe pode adicionar membros.`);
  }

  const menu = new UserSelectMenuBuilder()
    .setCustomId(`ticket_add_member_select_${ticketId}`)
    .setPlaceholder("Selecione quem poderá acessar o ticket")
    .setMinValues(1)
    .setMaxValues(5);

  return interaction.reply({
    content: "Selecione os membros que deseja adicionar:",
    components: [new ActionRowBuilder().addComponents(menu)],
    ephemeral: true
  });
}

async function closeTicket(interaction, ticketId) {
  const ticket = data.tickets[ticketId];

  if (!ticket || ticket.status !== "open") {
    return sendConfigNotice(interaction, `${E.alert} Este ticket já foi fechado.`);
  }

  if (!hasStaffPermission(interaction.member, interaction.guild.id)) {
    return sendConfigNotice(interaction, `${E.prohibited} Apenas a equipe pode fechar tickets.`);
  }

  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.channel;
  const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);

  const transcript = messages
    ? [...messages.values()]
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
        .map(message => {
          const content = message.content || "[Mensagem sem texto]";
          return `[${new Date(message.createdTimestamp).toISOString()}] ${message.author.tag}: ${content}`;
        })
        .join("\n")
    : "Não foi possível recuperar as mensagens.";

  ticket.status = "closed";
  ticket.closedAt = Date.now();
  ticket.closedBy = interaction.user.id;

  data.ticketTranscripts[ticketId] = {
    ticketId,
    guildId: interaction.guild.id,
    userId: ticket.userId,
    closedBy: interaction.user.id,
    createdAt: ticket.createdAt,
    closedAt: ticket.closedAt,
    transcript: transcript.slice(0, 50000)
  };

  saveData();

  const cfg = getGuildConfig(interaction.guild.id);
  const logChannelId = cfg.tickets.logChannelId || cfg.moderation.logChannelId;

  if (logChannelId) {
    const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);

    if (logChannel?.isTextBased()) {
      await logChannel.send({
        content:
          `${E.ticket} **Ticket encerrado**\n` +
          `**Número:** ${ticket.number}\n` +
          `**Usuário:** <@${ticket.userId}>\n` +
          `**Fechado por:** <@${interaction.user.id}>\n` +
          `**Transcrição:** ${transcript.slice(0, 1500)}`
      }).catch(() => {});
    }
  }

  const ticketOwner = await client.users.fetch(ticket.userId).catch(() => null);

  if (ticketOwner) {
    await ticketOwner.send(
      `${E.ticket} Seu ticket **${ticket.number}** foi encerrado.\nObrigado por entrar em contato com a ZYPhor!`
    ).catch(() => {});
  }

  await interaction.editReply(`${E.activated} Ticket encerrado. O canal será excluído.`);

  setTimeout(() => {
    channel.delete("Ticket encerrado").catch(() => {});
  }, 5000);
}

// ================================================
// INTELIGÊNCIA ARTIFICIAL
// ================================================

async function askGroq(guildId, userMessage, userName, ticketMode = false) {
  if (!groq || !GROQ_API_KEY) {
    return "A IA não está configurada no momento. Entre em contato com a equipe de suporte.";
  }

  const cfg = getGuildConfig(guildId);

  const historyKey = ticketMode ? `ticket-${guildId}` : guildId;

  data.aiHistory[historyKey] ||= {};
  data.aiHistory[historyKey][userName] ||= [];

  const history = data.aiHistory[historyKey][userName];

  const systemPrompt = cfg.ai.systemPrompt ||
    "Você é o assistente oficial da ZYPhor. Responda em português brasileiro, com educação, clareza e objetividade. Não invente informações.";

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8),
    { role: "user", content: userMessage.slice(0, 3000) }
  ];

  try {
    const result = await groq.chat.completions.create({
      model: cfg.ai.model || "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const answer = result.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return "Não consegui formular uma resposta agora.";
    }

    history.push(
      { role: "user", content: userMessage.slice(0, 3000) },
      { role: "assistant", content: answer }
    );

    data.aiHistory[historyKey][userName] = history.slice(-12);
    saveData();

    return answer;
  } catch (error) {
    console.error("[GROQ]", error);

    if (error.status === 401) {
      return "A chave da IA parece inválida. Avise a administração.";
    }

    if (error.status === 429) {
      return "A IA está recebendo muitas solicitações. Tente novamente daqui a pouco.";
    }

    return "Tive um problema ao responder. Tente novamente mais tarde.";
  }
}

async function handleTicketAI(message, ticket) {
  const cfg = getGuildConfig(message.guild.id);

  if (!cfg.ai.ticketEnabled || !groq) return;

  if (isTicketHelpRequest(message.content) && !ticket.supportNotified) {
    ticket.supportNotified = true;
    saveData();

    const roleMention = cfg.tickets.supportRoleId
      ? `<@&${cfg.tickets.supportRoleId}>`
      : "equipe de suporte";

    await message.channel.send({
      content:
        `${E.support} <@${message.author.id}>, vou chamar ${roleMention} para ajudar você.\n` +
        `Enquanto isso, posso tentar orientar você por aqui.`,
      allowedMentions: {
        users: [message.author.id],
        roles: cfg.tickets.supportRoleId ? [cfg.tickets.supportRoleId] : []
      }
    });
  }

  const answer = await askGroq(
    message.guild.id,
    message.content,
    `ticket-${ticket.id}`,
    true
  );

  await message.channel.send(answer.slice(0, 1900));
}

async function handleGeneralAI(message) {
  const cfg = getGuildConfig(message.guild.id);

  if (!cfg.ai.enabled || !groq) return;
  if (!Array.isArray(cfg.ai.channels)) return;
  if (!cfg.ai.channels.includes(message.channel.id)) return;

  const answer = await askGroq(
    message.guild.id,
    message.content,
    message.author.id
  );

  await message.reply({
    content: answer.slice(0, 1900),
    allowedMentions: { repliedUser: false }
  }).catch(() => {});
}

// ================================================
// SEGURANÇA AUTOMÁTICA
// ================================================

async function applySecurityAction(message, reason) {
  const cfg = getGuildConfig(message.guild.id);
  const action = cfg.security.action || "delete";
  const member = message.member;

  if (!member || member.permissions.has(PermissionFlagsBits.Administrator)) {
    return;
  }

  if (action === "delete") {
    await message.delete().catch(() => {});
  } else if (action === "timeout") {
    await member.timeout(10 * 60 * 1000, reason).catch(() => {});
  } else if (action === "kick") {
    await member.kick(reason).catch(() => {});
  } else if (action === "ban") {
    await member.ban({ reason }).catch(() => {});
  }

  await sendSecurityLog(
    message.guild,
    `${E.security} Ação automática: **${action}**\nUsuário: <@${member.id}>\nMotivo: ${reason}`
  );
}

async function handleSecurityMessage(message) {
  const cfg = getGuildConfig(message.guild.id);
  const member = message.member;

  if (!member || member.user.bot) return;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return;

  // Honeypot: atua somente no canal configurado.
  if (
    cfg.security.honeypot &&
    cfg.security.honeypotChannelId === message.channel.id
  ) {
    await message.delete().catch(() => {});
    await member.timeout(7 * 24 * 60 * 60 * 1000, "Honeypot acionado").catch(() => {});

    await sendSecurityLog(
      message.guild,
      `${E.security} Honeypot acionado por <@${member.id}>. Timeout aplicado por 7 dias.`
    );

    return;
  }

  if (cfg.security.antiLink && /(https?:\/\/|discord\.gg\/|www\.)/i.test(message.content)) {
    await applySecurityAction(message, "Link não permitido");
    return;
  }

  if (cfg.security.antiMention && message.mentions.users.size > 5) {
    await applySecurityAction(message, "Excesso de menções");
    return;
  }

  if (cfg.security.antiSpam) {
    const now = Date.now();
    const key = `${message.guild.id}-${member.id}`;
    const recent = (spamTracker.get(key) || []).filter(time => now - time < 7000);

    recent.push(now);
    spamTracker.set(key, recent);

    if (recent.length >= 6) {
      spamTracker.set(key, []);
      await applySecurityAction(message, "Spam de mensagens");
      return;
    }
  }
}

// ================================================
// MODERAÇÃO POR PREFIXO
// ================================================

async function handlePrefixCommand(message) {
  const cfg = getGuildConfig(message.guild.id);
  const prefix = cfg.prefix || "z!";

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = (args.shift() || "").toLowerCase();

  if (command === "feedbacks") {
    const feedbacks = data.feedbacks[message.guild.id] || [];

    if (!feedbacks.length) {
      return message.reply("Ainda não existem feedbacks registrados.");
    }

    const list = feedbacks.slice(-10).map((item, index) =>
      `**${index + 1}.** ${item.userTag || item.userId}: ${item.text}`
    ).join("\n");

    return message.reply({
      content: `## ${E.comment} Últimos feedbacks\n${list}`.slice(0, 1900)
    });
  }

  if (!["ban", "kick", "timeout", "warn"].includes(command)) return;

  if (!cfg.moderation.enabled) {
    return message.reply(`${E.disabled} A moderação está desativada.`);
  }

  if (!hasStaffPermission(message.member, message.guild.id)) {
    return message.reply(`${E.prohibited} Você não tem permissão para usar esse comando.`);
  }

  const target = message.mentions.members.first();
  const reason = args.slice(1).join(" ") || "Não informado";

  if (!target) {
    return message.reply(`Use: \`${prefix}${command} @usuário motivo\``);
  }

  if (target.id === message.author.id || target.id === OWNER_ID) {
    return message.reply(`${E.alert} Não é possível aplicar essa ação nesse usuário.`);
  }

  try {
    if (command === "ban") {
      await target.ban({ reason });
    } else if (command === "kick") {
      await target.kick(reason);
    } else if (command === "timeout") {
      await target.timeout(10 * 60 * 1000, reason);
    } else if (command === "warn") {
      data.warnings[target.id] ||= [];
      data.warnings[target.id].push({
        guildId: message.guild.id,
        moderatorId: message.author.id,
        reason,
        createdAt: Date.now()
      });
      saveData();

      const count = data.warnings[target.id].filter(
        warning => warning.guildId === message.guild.id
      ).length;

      await target.send(
        `${E.notifyWarn} Você recebeu um aviso em **${message.guild.name}**.\nMotivo: ${reason}`
      ).catch(() => {});

      if (count >= (cfg.moderation.warnLimit || 3)) {
        await target.timeout(10 * 60 * 1000, "Limite de avisos atingido").catch(() => {});
      }
    }

    await message.reply(`${E.positive} Ação **${command}** aplicada em ${target}.`);

    await sendModerationLog(
      message.guild,
      `${E.shield} **${command.toUpperCase()}**\nAlvo: <@${target.id}>\nModerador: <@${message.author.id}>\nMotivo: ${reason}`
    );
  } catch (error) {
    console.error("[MODERATION]", error);
    await message.reply(`${E.alert} Não consegui executar a ação. Verifique minhas permissões.`);
  }
}

// ================================================
// BOAS-VINDAS E SAÍDAS
// ================================================

client.on("guildMemberAdd", async member => {
  const cfg = getGuildConfig(member.guild.id);

  if (cfg.welcome.autoRoleId) {
    await member.roles.add(cfg.welcome.autoRoleId).catch(() => {});
  }

  if (!cfg.welcome.enabled || !cfg.welcome.channelId) return;

  const channel = await member.guild.channels.fetch(cfg.welcome.channelId).catch(() => null);

  if (!channel || !channel.isTextBased()) return;

  const welcomeText = (cfg.welcome.message || "Bem-vindo(a), {user}!")
    .replaceAll("{user}", `<@${member.id}>`)
    .replaceAll("{username}", member.user.username)
    .replaceAll("{server}", member.guild.name);

  await channel.send({
    content: welcomeText,
    allowedMentions: { users: [member.id] }
  }).catch(() => {});
});

client.on("guildMemberRemove", async member => {
  const cfg = getGuildConfig(member.guild.id);

  if (!cfg.welcome.leaveEnabled || !cfg.welcome.channelId) return;

  const channel = await member.guild.channels.fetch(cfg.welcome.channelId).catch(() => null);

  if (!channel || !channel.isTextBased()) return;

  await channel.send(
    `${E.negative} **${member.user.tag}** saiu do servidor.`
  ).catch(() => {});
});

// ================================================
// DETECÇÃO SIMPLES DE ENTRADA EM MASSA
// ================================================

client.on("guildMemberAdd", async member => {
  const cfg = getGuildConfig(member.guild.id);

  if (!cfg.security.antiRaid) return;

  const now = Date.now();
  const key = member.guild.id;
  const recent = (raidTracker.get(key) || []).filter(time => now - time < 10000);

  recent.push(now);
  raidTracker.set(key, recent);

  if (recent.length >= 10) {
    await sendSecurityLog(
      member.guild,
      `${E.alert} Possível raid detectada: ${recent.length} entradas em 10 segundos.`
    );
  }

  if (cfg.security.antiBot && member.user.bot) {
    const trustedBots = cfg.security.trustedBots || [];

    if (!trustedBots.includes(member.id)) {
      await member.kick("Bot não autorizado").catch(() => {});
      await sendSecurityLog(
        member.guild,
        `${E.security} Bot não autorizado removido: ${member.user.tag}`
      );
    }
  }
});

// ================================================
// EVENTO DE MENSAGENS
// ================================================

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  try {
    await handleSecurityMessage(message);

    const ticket = Object.values(data.tickets || {}).find(item =>
      item.guildId === message.guild.id &&
      item.channelId === message.channel.id &&
      item.status === "open"
    );

    if (ticket) {
      await handleTicketAI(message, ticket);
      return;
    }

    await handlePrefixCommand(message);
    await handleGeneralAI(message);
  } catch (error) {
    console.error("[MESSAGE CREATE]", error);
  }
});

// ================================================
// EVENTO DE INTERAÇÕES
// ================================================

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "config") {
        if (!await checkConfigPermission(interaction)) return;
        return openConfigPanel(interaction);
      }

      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("modal_")) {
        return handleConfigModal(interaction);
      }

      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "ticket_open_select") {
        return createTicket(interaction, interaction.values[0]);
      }

      if (interaction.customId === "status_remove_select") {
        return handleStatusSelect(interaction);
      }

      if (
        interaction.customId === "ticket_panel_channel" ||
        interaction.customId === "ticket_category" ||
        interaction.customId === "ticket_support_role" ||
        interaction.customId === "ai_channel_select" ||
        interaction.customId === "security_honeypot_channel" ||
        interaction.customId === "security_log_channel" ||
        interaction.customId === "security_action_select" ||
        interaction.customId === "moderation_log_channel" ||
        interaction.customId === "welcome_channel" ||
        interaction.customId === "config_navigation"
      ) {
        return handleConfigSelect(interaction);
      }

      return;
    }

    if (interaction.isChannelSelectMenu()) {
      if (interaction.customId === "ticket_log_channel") {
        if (!await checkConfigPermission(interaction)) return;

        const cfg = getGuildConfig(interaction.guild.id);
        cfg.tickets.logChannelId = interaction.values[0] || null;
        saveData();

        return sendConfigNotice(
          interaction,
          `${E.activated} Canal de logs dos tickets atualizado.`
        );
      }

      return handleConfigSelect(interaction);
    }

    if (interaction.isRoleSelectMenu()) {
      return handleConfigSelect(interaction);
    }

    if (interaction.isUserSelectMenu()) {
      if (!interaction.customId.startsWith("ticket_add_member_select_")) return;

      if (!await checkConfigPermission(interaction)) return;

      const ticketId = interaction.customId.replace("ticket_add_member_select_", "");
      const ticket = data.tickets[ticketId];

      if (!ticket || ticket.status !== "open") {
        return sendConfigNotice(interaction, `${E.alert} Ticket inválido.`);
      }

      const channel = await interaction.guild.channels.fetch(ticket.channelId).catch(() => null);

      if (!channel) {
        return sendConfigNotice(interaction, `${E.alert} Canal do ticket não encontrado.`);
      }

      for (const userId of interaction.values) {
        await channel.permissionOverwrites.edit(userId, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        }).catch(() => {});
      }

      return sendConfigNotice(
        interaction,
        `${E.activated} Membros adicionados ao ticket.`
      );
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith("ticket_claim_")) {
        return claimTicket(
          interaction,
          interaction.customId.replace("ticket_claim_", "")
        );
      }

      if (interaction.customId.startsWith("ticket_add_")) {
        return addTicketMember(
          interaction,
          interaction.customId.replace("ticket_add_", "")
        );
      }

      if (interaction.customId.startsWith("ticket_close_")) {
        return closeTicket(
          interaction,
          interaction.customId.replace("ticket_close_", "")
        );
      }

      if (
        interaction.customId.startsWith("config_") ||
        interaction.customId.startsWith("ticket_") ||
        interaction.customId.startsWith("ai_") ||
        interaction.customId.startsWith("security_") ||
        interaction.customId.startsWith("moderation_") ||
        interaction.customId.startsWith("welcome_") ||
        interaction.customId.startsWith("status_") ||
        interaction.customId.startsWith("publication_")
      ) {
        return handleConfigButton(interaction);
      }
    }
  } catch (error) {
    console.error("[INTERACTION]", error);

    const message = `${E.alert} Ocorreu um erro ao executar essa ação.`;

    if (interaction.deferred) {
      await interaction.editReply(message).catch(() => {});
    } else if (interaction.replied) {
      await interaction.followUp({
        content: message,
        ephemeral: true
      }).catch(() => {});
    } else if (interaction.isRepliable()) {
      await interaction.reply({
        content: message,
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// ================================================
// ROTAÇÃO AUTOMÁTICA DO STATUS
// ================================================

let statusInterval = null;

function startStatusRotation() {
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }

  const rotation = data.statusRotation;

  if (!rotation?.enabled || !rotation.activities?.length) {
    return;
  }

  const changeStatus = () => {
    if (!client.user || !data.statusRotation.enabled) return;

    const activities = data.statusRotation.activities || [];

    if (!activities.length) return;

    let index = data.statusRotation.currentIndex || 0;

    if (index >= activities.length) index = 0;

    const activity = activities[index];

    client.user.setPresence({
      status: "online",
      activities: [
        {
          name: activity.name,
          type: activity.type ?? 3
        }
      ]
    });

    data.statusRotation.currentIndex = (index + 1) % activities.length;
    saveData();
  };

  changeStatus();

  const interval = Math.max(
    15,
    Number(rotation.intervalSeconds) || 15
  );

  statusInterval = setInterval(changeStatus, interval * 1000);
}

// ================================================
// INICIALIZAÇÃO
// ================================================

client.once("ready", async () => {
  console.log("==================================");
  console.log("       ZYPHOR BOT ONLINE");
  console.log("==================================");
  console.log(`Bot: ${client.user.tag}`);
  console.log(`Servidores: ${client.guilds.cache.size}`);
  console.log(`Usuário: ${client.user.id}`);
  console.log("==================================");

  startStatusRotation();
});

client.on("error", error => {
  console.error("[CLIENT ERROR]", error);
});

process.on("unhandledRejection", error => {
  console.error("[UNHANDLED REJECTION]", error);
});

process.on("uncaughtException", error => {
  console.error("[UNCAUGHT EXCEPTION]", error);
});

// ================================================
// VERIFICAÇÃO E LOGIN
// ================================================

if (!TOKEN) {
  console.error(
    "ERRO: configure DISCORD_TOKEN nas variáveis da hospedagem."
  );
} else {
  client.login(TOKEN).catch(error => {
    console.error("[LOGIN ERROR]", error);
  });
}

// ================================================
// FIM DO INDEX.JS — PARTE 4/4
// ================================================
