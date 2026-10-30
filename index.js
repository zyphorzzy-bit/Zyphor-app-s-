
"use strict";

// ======================================================
// ZYPHOR BOT — PARTE 1/5
// BASE, CONFIGURAÇÕES, EMOJIS E DADOS
// ======================================================

const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags,
  ActivityType,
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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const Groq = require("groq-sdk");
const fs = require("node:fs");
const path = require("node:path");

// ======================================================
// CONFIGURAÇÕES PRINCIPAIS
// ======================================================

const TOKEN = process.env.DISCORD_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY || null;

const OWNER_ID = "1533306874513068093";
const PREFIX = "z!";

// Modelo Groq
const AI_MODEL = "llama-3.3-70b-versatile";

// Inicialização da Groq
const groq = GROQ_API_KEY
  ? new Groq({ apiKey: GROQ_API_KEY })
  : null;

if (!TOKEN) {
  console.error("[ZYPhor] DISCORD_TOKEN não configurado.");
  process.exit(1);
}

if (!GROQ_API_KEY) {
  console.warn(
    "[ZYPhor] GROQ_API_KEY não configurada. A IA ficará indisponível."
  );
}

// ======================================================
// ARQUIVOS
// ======================================================

const DATA_FILE = path.join(__dirname, "data.json");

// ======================================================
// EMOJIS PERSONALIZADOS
// ======================================================

const E = {
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
  excla: "<:excla:1552508778887254026>",
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
  vip: "<:vip:1559077642593108008>",
  ativado: "<:ativado:1548843821503221791>",
  desligado: "<:desligado:1548843820295266486>"
};

// ======================================================
// DADOS PADRÃO
// ======================================================

const DEFAULT_DATA = {
  version: 3,
  guilds: {},
  tickets: {},
  feedbacks: {},
  warnings: {},
  products: {},
  purchases: {},
  aiHistory: {},
  status: {
    enabled: true,
    interval: 15000,
    activities: [
      "ZYPhor • /config",
      "ZYPhor • Apps",
      "ZYPhor • Tickets",
      "ZYPhor • Inteligência Artificial",
      "ZYPhor • Sistemas",
      "ZYPhor • Ao Vivo"
    ]
  }
};

let data = structuredClone(DEFAULT_DATA);

// ======================================================
// CARREGAR DADOS
// ======================================================

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(DEFAULT_DATA, null, 2),
        "utf8"
      );

      data = structuredClone(DEFAULT_DATA);

      console.log("[ZYPhor] data.json criado.");
      return;
    }

    const saved = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    data = {
      ...structuredClone(DEFAULT_DATA),
      ...saved,

      guilds: saved.guilds || {},
      tickets: saved.tickets || {},
      feedbacks: saved.feedbacks || {},
      warnings: saved.warnings || {},
      products: saved.products || {},
      purchases: saved.purchases || {},
      aiHistory: saved.aiHistory || {},

      status: {
        ...structuredClone(DEFAULT_DATA.status),
        ...(saved.status || {})
      }
    };

    console.log("[ZYPhor] Dados carregados.");
  } catch (error) {
    console.error(
      "[ZYPhor] Erro ao carregar data.json:",
      error
    );

    throw error;
  }
}

// ======================================================
// SALVAMENTO SEGURO
// ======================================================

let saveQueue = Promise.resolve();

function saveData() {
  saveQueue = saveQueue
    .then(async () => {
      const temporaryFile = `${DATA_FILE}.tmp`;

      await fs.promises.writeFile(
        temporaryFile,
        JSON.stringify(data, null, 2),
        "utf8"
      );

      await fs.promises.rename(
        temporaryFile,
        DATA_FILE
      );
    })
    .catch(error => {
      console.error(
        "[ZYPhor] Erro ao salvar dados:",
        error
      );
    });

  return saveQueue;
}

// ======================================================
// CONFIGURAÇÃO PADRÃO POR SERVIDOR
// ======================================================

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
      honeypotDuration: 604800000,

      moderationRole: null,
      configRole: null,

      securityEnabled: false,
      antiSpam: true,
      antiLinks: false,

      aiTicketEnabled: false,
      aiChatEnabled: false,
      aiChannel: null,

      aiSystemPrompt:
        "Você é a inteligência artificial do ZYPhor Bot. Responda em português brasileiro, com educação, clareza e objetividade. Ajude os usuários sem inventar informações.",

      rulesChannel: null,
      rulesText: null,

      ticketCounter: 0,
      feedbackChannel: null,
      autoRole: null
    };

    saveData();
  }

  return data.guilds[guildId];
}

// ======================================================
// CLIENT DISCORD
// ======================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ],

  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember
  ]
});

// ======================================================
// PERMISSÕES
// ======================================================

function canConfigure(member) {
  if (!member) return false;

  if (member.id === OWNER_ID) return true;

  if (member.guild?.ownerId === member.id) {
    return true;
  }

  const cfg = getGuild(member.guild.id);

  return Boolean(
    cfg.configRole &&
    member.roles?.cache?.has(cfg.configRole)
  );
}

function isStaff(member) {
  if (!member) return false;

  if (member.id === OWNER_ID) return true;

  if (member.guild?.ownerId === member.id) {
    return true;
  }

  const cfg = getGuild(member.guild.id);

  return Boolean(
    (cfg.ticketStaffRole &&
      member.roles?.cache?.has(cfg.ticketStaffRole)) ||

    (cfg.moderationRole &&
      member.roles?.cache?.has(cfg.moderationRole))
  );
}

// ======================================================
// CONTROLE DE ERROS
// ======================================================

process.on("unhandledRejection", error => {
  console.error(
    "[ZYPhor] Promise rejeitada:",
    error
  );
});

process.on("uncaughtException", error => {
  console.error(
    "[ZYPhor] Erro inesperado:",
    error
  );
});

// ======================================================
// FIM DA PARTE 1/5
// A PARTE 2 CONTINUA NO MESMO ARQUIVO.
// ======================================================
// ======================================================
// ZYPHOR BOT — PARTE 2/5
// COMPONENTS V2 E PAINEL FIXO DE CONFIGURAÇÃO
// ======================================================

// ======================================================
// CONVERTER EMOJI PERSONALIZADO
// ======================================================

function emojiData(key) {
  const value = E[key];

  if (!value) return undefined;

  const match = value.match(/^<a?:([^:]+):(\d+)>$/);

  if (!match) return undefined;

  return {
    name: match[1],
    id: match[2],
    animated: value.startsWith("<a:")
  };
}

// ======================================================
// CONTAINER COMPONENTS V2
// ======================================================

function v2(title, description, rows = []) {
  const container = new ContainerBuilder()
    .setAccentColor(0x242424)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${title}\n${description || ""}`
      )
    );

  if (rows.length > 0) {
    container.addSeparatorComponents(
      new SeparatorBuilder()
    );

    for (const row of rows) {
      container.addActionRowComponents(row);
    }
  }

  return container;
}

// ======================================================
// RESPOSTA COMPONENTS V2
// ======================================================

async function replyV2(
  interaction,
  title,
  description,
  rows = [],
  ephemeral = true
) {
  const container = v2(title, description, rows);

  const flags =
    MessageFlags.IsComponentsV2 |
    (ephemeral ? MessageFlags.Ephemeral : 0);

  const payload = {
    components: [container],
    flags
  };

  if (interaction.replied || interaction.deferred) {
    return interaction.editReply({
      components: [container]
    });
  }

  return interaction.reply(payload);
}

// ======================================================
// ENVIAR COMPONENTS V2 EM UM CANAL
// ======================================================

async function sendV2(
  channel,
  title,
  description,
  rows = []
) {
  if (!channel || !channel.isTextBased()) {
    throw new Error("Canal inválido para enviar Components V2.");
  }

  return channel.send({
    components: [
      v2(title, description, rows)
    ],
    flags: MessageFlags.IsComponentsV2
  });
}

// ======================================================
// BOTÃO COM EMOJI PERSONALIZADO
// ======================================================

function configButton(label, customId, emojiKey) {
  const button = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(ButtonStyle.Secondary);

  const emoji = emojiData(emojiKey);

  if (emoji) {
    button.setEmoji(emoji);
  }

  return button;
}

// ======================================================
// MENU PRINCIPAL DO /CONFIG
// ======================================================

function homePanel(guild) {
  const cfg = getGuild(guild.id);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("zy_section")
    .setPlaceholder("Selecione uma categoria")
    .addOptions(
      {
        label: "Tickets",
        value: "tickets",
        description: "Configurar o sistema de atendimento",
        emoji: emojiData("ticket")
      },
      {
        label: "Inteligência Artificial",
        value: "ai",
        description: "Configurar a IA Groq",
        emoji: emojiData("config")
      },
      {
        label: "Segurança",
        value: "security",
        description: "Configurar proteção do servidor",
        emoji: emojiData("security")
      },
      {
        label: "Honeypot",
        value: "honeypot",
        description: "Configurar proteção Honeypot",
        emoji: emojiData("protegido")
      },
      {
        label: "Moderação",
        value: "moderation",
        description: "Configurar equipe e moderação",
        emoji: emojiData("ban")
      },
      {
        label: "Boas-vindas e saídas",
        value: "welcome",
        description: "Configurar mensagens de entrada e saída",
        emoji: emojiData("servidor")
      },
      {
        label: "Registros",
        value: "logs",
        description: "Configurar canal de registros",
        emoji: emojiData("documento")
      },
      {
        label: "Regras",
        value: "rules",
        description: "Editar e publicar regras",
        emoji: emojiData("regras")
      }
    );

  const row = new ActionRowBuilder()
    .addComponents(menu);

  return v2(
    `${E.config} ZYPHOR — CENTRAL DE CONFIGURAÇÃO`,
    [
      `**Servidor:** ${guild.name}`,
      "",
      `${E.protegido} Painel de gerenciamento do servidor.`,
      "",
      "Selecione uma categoria no menu abaixo para configurar os sistemas.",
      "",
      `${E.online} **Painel ativo**`,
      `${E.fixo} As configurações são salvas automaticamente.`,
      "",
      `**Inteligência Artificial:** ${cfg.aiTicketEnabled || cfg.aiChatEnabled ? E.ativado : E.desligado}`,
      `**Segurança:** ${cfg.securityEnabled ? E.ativado : E.desligado}`
    ].join("\n"),
    [row]
  );
}

// ======================================================
// PAINÉIS DAS CATEGORIAS
// ======================================================

function sectionPanel(section, guild) {
  const cfg = getGuild(guild.id);

  const sections = {
    tickets: {
      title: "CONFIGURAÇÃO — TICKETS",
      description:
        "Configure o atendimento, o canal do painel, a categoria, o cargo da equipe e o formato dos tickets.",
      buttons: [
        ["Canal do painel", "zy_cfg_ticket_channel", "ticket"],
        ["Categoria", "zy_cfg_ticket_category", "servidor"],
        ["Cargo de suporte", "zy_cfg_ticket_role", "suporte"],
        ["Modo de atendimento", "zy_cfg_ticket_mode", "config"],
        ["Publicar painel", "zy_cfg_ticket_publish", "positivo"]
      ]
    },

    ai: {
      title: "CONFIGURAÇÃO — INTELIGÊNCIA ARTIFICIAL",
      description:
        "Configure a IA que utiliza a API da Groq. A chave é lida pela variável GROQ_API_KEY no ambiente de hospedagem.",
      buttons: [
        ["IA nos tickets", "zy_cfg_ai_ticket", "ticket"],
        ["IA no chat", "zy_cfg_ai_chat", "config"],
        ["Canal da IA", "zy_cfg_ai_channel", "texto"],
        ["Editar instruções", "zy_cfg_ai_prompt", "documento"],
        ["Testar conexão", "zy_cfg_ai_test", "positivo"]
      ]
    },

    security: {
      title: "CONFIGURAÇÃO — SEGURANÇA",
      description:
        "Gerencie os sistemas de proteção e prevenção contra abusos no servidor.",
      buttons: [
        ["Sistema de segurança", "zy_cfg_security_toggle", "security"],
        ["Anti-spam", "zy_cfg_antispam", "alerta"],
        ["Anti-links", "zy_cfg_antilinks", "link"]
      ]
    },

    honeypot: {
      title: "CONFIGURAÇÃO — HONEYPOT",
      description:
        "Configure o canal protegido e a ação aplicada quando alguém acionar o Honeypot.",
      buttons: [
        ["Canal Honeypot", "zy_cfg_honeypot_channel", "protegido"],
        ["Ação", "zy_cfg_honeypot_action", "ban"],
        ["Duração", "zy_cfg_honeypot_duration", "horario"]
      ]
    },

    moderation: {
      title: "CONFIGURAÇÃO — MODERAÇÃO",
      description:
        "Configure o cargo responsável pela moderação e as permissões de gerenciamento.",
      buttons: [
        ["Cargo de moderação", "zy_cfg_mod_role", "ban"],
        ["Cargo de configuração", "zy_cfg_config_role", "config"]
      ]
    },

    welcome: {
      title: "CONFIGURAÇÃO — BOAS-VINDAS",
      description:
        "Configure as mensagens de entrada e saída dos membros.",
      buttons: [
        ["Canal de boas-vindas", "zy_cfg_welcome_channel", "servidor"],
        ["Ativar boas-vindas", "zy_cfg_welcome_toggle", "ativado"],
        ["Canal de saída", "zy_cfg_leave_channel", "servidor"],
        ["Ativar saída", "zy_cfg_leave_toggle", "desligado"],
        ["Cargo automático", "zy_cfg_autorole", "suporte"]
      ]
    },

    logs: {
      title: "CONFIGURAÇÃO — REGISTROS",
      description:
        "Escolha o canal em que o bot enviará os registros dos sistemas.",
      buttons: [
        ["Canal de registros", "zy_cfg_log_channel", "documento"]
      ]
    },

    rules: {
      title: "CONFIGURAÇÃO — REGRAS",
      description:
        "Edite as regras do servidor e escolha onde elas serão publicadas.",
      buttons: [
        ["Canal das regras", "zy_cfg_rules_channel", "regras"],
        ["Editar regras", "zy_cfg_rules_edit", "documento"],
        ["Publicar regras", "zy_cfg_rules_publish", "positivo"]
      ]
    }
  };

  const selected = sections[section];

  if (!selected) {
    return v2(
      "CONFIGURAÇÃO",
      "Categoria não encontrada."
    );
  }

  const rows = [];

  for (let i = 0; i < selected.buttons.length; i += 5) {
    const group = selected.buttons.slice(i, i + 5);

    const row = new ActionRowBuilder();

    row.addComponents(
      ...group.map(item =>
        configButton(item[0], item[1], item[2])
      )
    );

    rows.push(row);
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      configButton(
        "Voltar ao início",
        "zy_cfg_home",
        "seta"
      )
    )
  );

  return v2(
    selected.title,
    [
      selected.description,
      "",
      `${E.fixo} **Configurações salvas automaticamente.**`
    ].join("\n"),
    rows
  );
}

// ======================================================
// PUBLICAR PAINEL FIXO NO CANAL ATUAL
// ======================================================

async function publishConfigPanel(interaction) {
  if (!interaction.guild || !interaction.channel) {
    return replyV2(
      interaction,
      "CONFIGURAÇÃO",
      "Este comando precisa ser usado dentro de um servidor."
    );
  }

  if (!canConfigure(interaction.member)) {
    return replyV2(
      interaction,
      "ACESSO NEGADO",
      `${E.proibido} Você não tem permissão para publicar o painel de configuração.`
    );
  }

  const botMember = interaction.guild.members.me;

  if (
    !botMember ||
    !interaction.channel
      .permissionsFor(botMember)
      ?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages
      ])
  ) {
    return replyV2(
      interaction,
      "SEM PERMISSÃO",
      "Não tenho permissão para enviar o painel neste canal."
    );
  }

  try {
    await interaction.channel.send({
      components: [
        homePanel(interaction.guild)
      ],
      flags: MessageFlags.IsComponentsV2
    });

    await replyV2(
      interaction,
      "PAINEL PUBLICADO",
      `${E.aceito} O painel fixo de configuração foi publicado neste canal.\n\nVocê pode sair desta mensagem que o painel continuará disponível.`
    );
  } catch (error) {
    console.error(
      "[ZYPhor] Erro ao publicar painel:",
      error
    );

    await replyV2(
      interaction,
      "ERRO AO PUBLICAR",
      "Não consegui publicar o painel. Confira minhas permissões e tente novamente."
    );
  }
}

// ======================================================
// REGISTROS EM COMPONENTS V2
// ======================================================

async function sendLog(guild, title, description) {
  try {
    const cfg = getGuild(guild.id);

    if (!cfg.logChannel) return;

    const channel = await guild.channels
      .fetch(cfg.logChannel)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) return;

    await sendV2(
      channel,
      `${E.documento} ${title}`,
      description
    );
  } catch (error) {
    console.error(
      "[ZYPhor] Erro ao enviar registro:",
      error
    );
  }
}

// ======================================================
// FIM DA PARTE 2/5
// CONTINUAR NO MESMO INDEX.JS.
// ======================================================
// ======================================================
// ZYPHOR BOT — PARTE 3/5
// SISTEMA DE TICKETS E FEEDBACKS
// ======================================================

// ======================================================
// PAINEL DE ABERTURA DE TICKETS
// ======================================================

function ticketPanel() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("zy_ticket_open")
    .setPlaceholder("Selecione o motivo do atendimento")
    .addOptions(
      {
        label: "Ajuda",
        value: "ajuda",
        description: "Preciso de ajuda com alguma coisa.",
        emoji: emojiData("suporte")
      },
      {
        label: "Compra",
        value: "compra",
        description: "Quero comprar um produto ou serviço.",
        emoji: emojiData("carrinho")
      },
      {
        label: "Suporte técnico",
        value: "tecnico",
        description: "Tenho um problema técnico.",
        emoji: emojiData("config")
      }
    );

  const row = new ActionRowBuilder()
    .addComponents(menu);

  return v2(
    `${E.ticket} CENTRAL DE ATENDIMENTO`,
    [
      "Precisa de ajuda? Abra um atendimento selecionando uma das opções abaixo.",
      "",
      `${E.protegido} Seu atendimento será privado.`,
      `${E.suporte} A equipe responsável poderá atender você.`,
      "",
      "**Selecione o assunto para continuar.**"
    ].join("\n"),
    [row]
  );
}

// ======================================================
// PUBLICAR PAINEL DE TICKETS
// ======================================================

async function publishTicketPanel(interaction) {
  const cfg = getGuild(interaction.guild.id);

  if (!cfg.ticketChannel) {
    return replyV2(
      interaction,
      "CANAL NÃO CONFIGURADO",
      `${E.alerta} Selecione primeiro o canal do painel de tickets no /config.`
    );
  }

  if (!cfg.ticketCategory) {
    return replyV2(
      interaction,
      "CATEGORIA NÃO CONFIGURADA",
      `${E.alerta} Selecione primeiro a categoria dos tickets no /config.`
    );
  }

  if (!cfg.ticketStaffRole) {
    return replyV2(
      interaction,
      "EQUIPE NÃO CONFIGURADA",
      `${E.alerta} Selecione primeiro o cargo de suporte no /config.`
    );
  }

  const channel = await interaction.guild.channels
    .fetch(cfg.ticketChannel)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return replyV2(
      interaction,
      "CANAL INVÁLIDO",
      "O canal configurado não está disponível."
    );
  }

  try {
    await channel.send({
      components: [ticketPanel()],
      flags: MessageFlags.IsComponentsV2
    });

    await replyV2(
      interaction,
      "PAINEL PUBLICADO",
      `${E.aceito} O painel de tickets foi publicado com sucesso.`
    );
  } catch (error) {
    console.error("[ZYPhor] Erro ao publicar tickets:", error);

    await replyV2(
      interaction,
      "ERRO",
      "Não consegui publicar o painel de tickets. Confira minhas permissões."
    );
  }
}

// ======================================================
// LOCALIZAR TICKET ATIVO DO USUÁRIO
// ======================================================

function findOpenTicket(guildId, userId) {
  return Object.entries(data.tickets).find(([id, ticket]) =>
    ticket.guildId === guildId &&
    ticket.userId === userId &&
    ticket.status === "open"
  );
}

// ======================================================
// CRIAR TICKET
// ======================================================

async function createTicket(interaction, topic = "ajuda") {
  const guild = interaction.guild;
  const user = interaction.user;
  const cfg = getGuild(guild.id);

  if (!cfg.ticketCategory || !cfg.ticketStaffRole) {
    return replyV2(
      interaction,
      "TICKETS NÃO CONFIGURADOS",
      `${E.alerta} A categoria e o cargo de suporte precisam ser configurados no /config.`
    );
  }

  const existing = findOpenTicket(guild.id, user.id);

  if (existing) {
    const [channelId] = existing;

    return replyV2(
      interaction,
      "ATENDIMENTO JÁ ABERTO",
      `${E.alerta} Você já possui um atendimento aberto: <#${channelId}>.`
    );
  }

  const category = await guild.channels
    .fetch(cfg.ticketCategory)
    .catch(() => null);

  if (!category || category.type !== ChannelType.GuildCategory) {
    return replyV2(
      interaction,
      "CATEGORIA INVÁLIDA",
      "A categoria de tickets não foi encontrada. Configure novamente no /config."
    );
  }

  const staffRole = await guild.roles
    .fetch(cfg.ticketStaffRole)
    .catch(() => null);

  if (!staffRole) {
    return replyV2(
      interaction,
      "CARGO INVÁLIDO",
      "O cargo de suporte não foi encontrado. Configure novamente no /config."
    );
  }

  const botMember = guild.members.me;

  if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return replyV2(
      interaction,
      "SEM PERMISSÃO",
      "Preciso da permissão Gerenciar Canais para criar tickets."
    );
  }

  const validTopics = {
    ajuda: "ajuda",
    compra: "compra",
    tecnico: "suporte-tecnico"
  };

  const topicName = validTopics[topic] || "ajuda";

  cfg.ticketCounter = Number(cfg.ticketCounter || 0) + 1;

  const number = String(cfg.ticketCounter).padStart(4, "0");

  const channelName = `🎫-${topicName}-${number}`;

  await saveData();

  try {
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `zyphor-ticket:${user.id}:${topic}:${number}`,

      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [
            PermissionFlagsBits.ViewChannel
          ]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        },
        {
          id: staffRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        },
        {
          id: botMember.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ]
    });

    data.tickets[channel.id] = {
      guildId: guild.id,
      channelId: channel.id,
      userId: user.id,
      topic: topicName,
      number,
      status: "open",
      claimedBy: null,
      openedAt: Date.now(),
      closedAt: null,
      transcript: null,
      feedback: null,
      feedbackRequested: false
    };

    await saveData();

    const ticketRows = [
      new ActionRowBuilder().addComponents(
        configButton(
          "Atender",
          "zy_ticket_claim",
          "suporte"
        ),
        configButton(
          "Fechar",
          "zy_ticket_close",
          "lixo"
        )
      )
    ];

    const ticketContainer = v2(
      `${E.ticket} ATENDIMENTO #${number}`,
      [
        `**Cliente:** <@${user.id}>`,
        `**Assunto:** ${topicName}`,
        `**Equipe:** <@&${staffRole.id}>`,
        "",
        `${E.online} Seu atendimento foi criado.`,
        "Explique seu problema para que a equipe possa ajudar.",
        "",
        `${E.protegido} Somente você e a equipe autorizada podem visualizar este canal.`,
        "",
        "**Controles da equipe:**",
        `${E.suporte} Atender — assumir o atendimento.`,
        `${E.lixo} Fechar — finalizar o atendimento.`
      ].join("\n"),
      ticketRows
    );

    await channel.send({
      components: [ticketContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: {
        users: [user.id],
        roles: [staffRole.id]
      }
    });

    await sendLog(
      guild,
      "NOVO TICKET",
      [
        `**Número:** ${number}`,
        `**Cliente:** <@${user.id}>`,
        `**Assunto:** ${topicName}`,
        `**Canal:** <#${channel.id}>`
      ].join("\n")
    );

    await replyV2(
      interaction,
      "ATENDIMENTO CRIADO",
      `${E.aceito} Seu atendimento está pronto: <#${channel.id}>.`
    );

  } catch (error) {
    console.error("[ZYPhor] Erro ao criar ticket:", error);

    delete data.tickets[
      Object.keys(data.tickets).find(id =>
        data.tickets[id]?.userId === user.id &&
        data.tickets[id]?.guildId === guild.id &&
        data.tickets[id]?.status === "open" &&
        !data.tickets[id]?.channelId
      )
    ];

    await saveData();

    return replyV2(
      interaction,
      "ERRO AO CRIAR TICKET",
      "Não consegui criar seu atendimento. Confira as permissões e tente novamente."
    );
  }
}

// ======================================================
// ASSUMIR ATENDIMENTO
// ======================================================

async function claimTicket(interaction) {
  const ticket = data.tickets[interaction.channelId];

  if (!ticket || ticket.status !== "open") {
    return replyV2(
      interaction,
      "TICKET INDISPONÍVEL",
      "Este atendimento não está mais aberto."
    );
  }

  if (!isStaff(interaction.member)) {
    return replyV2(
      interaction,
      "ACESSO NEGADO",
      `${E.proibido} Somente a equipe autorizada pode assumir atendimentos.`
    );
  }

  if (ticket.claimedBy) {
    return replyV2(
      interaction,
      "ATENDIMENTO JÁ ASSUMIDO",
      `Este atendimento já está sendo atendido por <@${ticket.claimedBy}>.`
    );
  }

  ticket.claimedBy = interaction.user.id;
  ticket.claimedAt = Date.now();

  await saveData();

  await sendV2(
    interaction.channel,
    `${E.suporte} ATENDIMENTO ASSUMIDO`,
    `O membro <@${interaction.user.id}> assumiu este atendimento.`
  );

  await sendLog(
    interaction.guild,
    "TICKET ASSUMIDO",
    `O ticket <#${interaction.channelId}> foi assumido por <@${interaction.user.id}>.`
  );

  return replyV2(
    interaction,
    "ATENDIMENTO ASSUMIDO",
    `${E.aceito} Você agora é responsável por este atendimento.`
  );
}

// ======================================================
// GERAR TRANSCRIÇÃO
// ======================================================

async function generateTranscript(channel) {
  const messages = await channel.messages.fetch({
    limit: 100
  });

  const ordered = [...messages.values()].reverse();

  const lines = ordered.map(message => {
    const date = new Date(message.createdTimestamp).toLocaleString("pt-BR");

    const attachments = [...message.attachments.values()]
      .map(file => file.url)
      .join(" ");

    const content = message.content || "[Mensagem sem texto]";

    return [
      `[${date}] ${message.author.tag}:`,
      content,
      attachments
    ].filter(Boolean).join("\n");
  });

  return lines.join("\n\n");
}

// ======================================================
// FEEDBACK PRIVADO APÓS FECHAMENTO
// ======================================================

async function requestTicketFeedback(userId, ticketId, number) {
  try {
    const user = await client.users.fetch(userId);

    const ratings = [
      ["1", "warn1", ButtonStyle.Secondary],
      ["2", "warn2", ButtonStyle.Secondary],
      ["3", "warn3", ButtonStyle.Secondary],
      ["4", "positivo", ButtonStyle.Secondary],
      ["5", "like", ButtonStyle.Success]
    ];

    const row = new ActionRowBuilder();

    row.addComponents(
      ...ratings.map(([rating, emojiKey, style]) => {
        const button = new ButtonBuilder()
          .setCustomId(`zy_feedback:${ticketId}:${rating}`)
          .setStyle(style)
          .setLabel(rating);

        const emoji = emojiData(emojiKey);

        if (emoji) button.setEmoji(emoji);

        return button;
      })
    );

    await user.send({
      components: [
        v2(
          `${E.comentario} AVALIE SEU ATENDIMENTO`,
          [
            `Seu ticket **#${number}** foi finalizado.`,
            "",
            "Como foi sua experiência com a equipe?",
            "",
            "Escolha uma avaliação de 1 a 5."
          ].join("\n"),
          [row]
        )
      ],
      flags: MessageFlags.IsComponentsV2
    });

    return true;
  } catch {
    return false;
  }
}

// ======================================================
// FECHAR TICKET
// ======================================================

async function closeTicket(interaction) {
  const ticket = data.tickets[interaction.channelId];

  if (!ticket || ticket.status !== "open") {
    return replyV2(
      interaction,
      "TICKET INDISPONÍVEL",
      "Este atendimento já foi fechado ou não existe."
    );
  }

  const isOpener = ticket.userId === interaction.user.id;
  const staff = isStaff(interaction.member);

  if (!isOpener && !staff) {
    return replyV2(
      interaction,
      "ACESSO NEGADO",
      `${E.proibido} Você não tem permissão para fechar este atendimento.`
    );
  }

  try {
    const transcript = await generateTranscript(
      interaction.channel
    );

    ticket.status = "closed";
    ticket.closedAt = Date.now();
    ticket.closedBy = interaction.user.id;
    ticket.transcript = transcript;

    await saveData();

    const feedbackSent = await requestTicketFeedback(
      ticket.userId,
      ticket.channelId,
      ticket.number
    );

    ticket.feedbackRequested = feedbackSent;

    await saveData();

    await sendLog(
      interaction.guild,
      "TICKET FECHADO",
      [
        `**Número:** ${ticket.number}`,
        `**Cliente:** <@${ticket.userId}>`,
        `**Fechado por:** <@${interaction.user.id}>`,
        `**Transcrição:** salva no data.json`,
        `**Feedback enviado:** ${feedbackSent ? E.ativado : E.desligado}`
      ].join("\n")
    );

    await replyV2(
      interaction,
      "ATENDIMENTO FINALIZADO",
      `${E.aceito} O ticket foi fechado. A transcrição foi salva e o canal será removido.`
    );

    setTimeout(async () => {
      await interaction.channel.delete(
        "ZYPhor Bot — Ticket finalizado"
      ).catch(error => {
        console.error(
          "[ZYPhor] Erro ao excluir ticket:",
          error
        );
      });
    }, 8000);

  } catch (error) {
    console.error("[ZYPhor] Erro ao fechar ticket:", error);

    return replyV2(
      interaction,
      "ERRO AO FECHAR",
      "Não consegui finalizar o atendimento. Tente novamente."
    );
  }
}

// ======================================================
// REGISTRAR AVALIAÇÃO
// ======================================================

async function handleTicketFeedback(interaction) {
  const [, ticketId, ratingText] =
    interaction.customId.split(":");

  const ticket = data.tickets[ticketId];

  if (!ticket || ticket.userId !== interaction.user.id) {
    return replyV2(
      interaction,
      "AVALIAÇÃO INVÁLIDA",
      "Esta avaliação não pertence à sua conta."
    );
  }

  if (ticket.feedback) {
    return replyV2(
      interaction,
      "AVALIAÇÃO JÁ ENVIADA",
      "Você já avaliou este atendimento."
    );
  }

  const rating = Number(ratingText);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return replyV2(
      interaction,
      "AVALIAÇÃO INVÁLIDA",
      "Selecione uma avaliação válida."
    );
  }

  const feedback = {
    ticketId,
    guildId: ticket.guildId,
    userId: interaction.user.id,
    rating,
    createdAt: Date.now(),
    comment: null
  };

  data.feedbacks[ticketId] = feedback;
  ticket.feedback = rating;

  await saveData();

  await replyV2(
    interaction,
    "AVALIAÇÃO REGISTRADA",
    `${E.aceito} Obrigado por avaliar o atendimento **#${ticket.number}**.`
  );

  const guild = await client.guilds
    .fetch(ticket.guildId)
    .catch(() => null);

  if (guild) {
    await sendLog(
      guild,
      "NOVO FEEDBACK",
      [
        `**Ticket:** #${ticket.number}`,
        `**Usuário:** <@${interaction.user.id}>`,
        `**Avaliação:** ${rating}/5`
      ].join("\n")
    );
  }
}

// ======================================================
// CONSULTAR FEEDBACKS
// ======================================================

async function showFeedbacks(interaction) {
  if (!isStaff(interaction.member)) {
    return replyV2(
      interaction,
      "ACESSO NEGADO",
      `${E.proibido} Somente a equipe autorizada pode consultar os feedbacks.`
    );
  }

  const feedbacks = Object.values(data.feedbacks)
    .filter(item =>
      item &&
      item.guildId === interaction.guild.id &&
      Number.isInteger(item.rating)
    )
    .sort((a, b) => b.createdAt - a.createdAt);

  if (!feedbacks.length) {
    return replyV2(
      interaction,
      "FEEDBACKS",
      "Ainda não existem avaliações registradas neste servidor."
    );
  }

  const average = feedbacks.reduce(
    (sum, item) => sum + item.rating,
    0
  ) / feedbacks.length;

  const recent = feedbacks.slice(0, 10);

  const description = [
    `**Total de avaliações:** ${feedbacks.length}`,
    `**Média:** ${average.toFixed(2)}/5`,
    "",
    "**AVALIAÇÕES RECENTES**",
    "",
    ...recent.map(item => {
      const date = new Date(item.createdAt)
        .toLocaleDateString("pt-BR");

      return [
        `**Ticket:** ${item.ticketId ? `#${data.tickets[item.ticketId]?.number || "?"}` : "Não identificado"}`,
        `**Usuário:** <@${item.userId}>`,
        `**Nota:** ${item.rating}/5`,
        `**Data:** ${date}`
      ].join("\n");
    })
  ].join("\n\n");

  return replyV2(
    interaction,
    `${E.comentario} CENTRAL DE FEEDBACKS`,
    description
  );
}

// ======================================================
// FIM DA PARTE 3/5
// CONTINUAR NO MESMO INDEX.JS.
// ======================================================
// ======================================================
// ZYPHOR BOT — PARTE 4/5
// GROQ, SEGURANÇA, HONEYPOT, REGRAS E TERMOS
// ======================================================

// ======================================================
// IA — IDENTIFICAR PEDIDO DE AJUDA
// ======================================================

function userRequestedAIHelp(content) {
  const text = content.toLowerCase();

  const phrases = [
    "preciso de ajuda",
    "preciso de um suporte",
    "preciso falar com suporte",
    "chama o suporte",
    "chamar o suporte",
    "quero falar com atendente",
    "quero um atendente",
    "quero falar com alguém",
    "pode chamar alguém",
    "me ajuda por favor",
    "não consigo resolver",
    "nao consigo resolver",
    "atendimento humano"
  ];

  return phrases.some(phrase => text.includes(phrase));
}

// ======================================================
// IA — IDENTIFICAR SE É UM TICKET
// ======================================================

function getTicketFromChannel(channelId) {
  const ticket = data.tickets[channelId];

  if (!ticket || ticket.status !== "open") {
    return null;
  }

  return ticket;
}

// ======================================================
// HISTÓRICO DA IA
// ======================================================

function getAIHistory(guildId, channelId) {
  const key = `${guildId}_${channelId}`;

  if (!Array.isArray(data.aiHistory[key])) {
    data.aiHistory[key] = [];
  }

  return data.aiHistory[key];
}

// ======================================================
// LIMPAR HISTÓRICO DA IA
// ======================================================

function clearAIHistory(guildId, channelId) {
  const key = `${guildId}_${channelId}`;

  data.aiHistory[key] = [];

  return saveData();
}

// ======================================================
// CONVERSAR COM A GROQ
// ======================================================

async function askGroq(
  guildId,
  channelId,
  userName,
  content
) {
  if (!groq) {
    return "A inteligência artificial está temporariamente indisponível. A equipe poderá ajudar você pelo atendimento.";
  }

  const cfg = getGuild(guildId);

  const history = getAIHistory(
    guildId,
    channelId
  );

  const messages = [
    {
      role: "system",
      content: cfg.aiSystemPrompt ||
        "Você é a IA do ZYPhor Bot. Responda em português brasileiro, com educação e objetividade. Não invente informações."
    },
    ...history.slice(-12),
    {
      role: "user",
      content: `Nome do usuário: ${userName}\nMensagem: ${content}`
    }
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 800
    });

    const answer =
      completion.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("A Groq retornou uma resposta vazia.");
    }

    history.push(
      {
        role: "user",
        content
      },
      {
        role: "assistant",
        content: answer
      }
    );

    if (history.length > 30) {
      history.splice(0, history.length - 30);
    }

    await saveData();

    return answer;

  } catch (error) {
    console.error("[ZYPhor] Erro na Groq:", error);

    return "Não consegui processar sua mensagem agora. Tente novamente ou solicite atendimento da equipe.";
  }
}

// ======================================================
// IA — RESPONDER EM TICKETS
// ======================================================

async function handleTicketAI(message, ticket, cfg) {
  if (!cfg.aiTicketEnabled) return;

  if (!groq) return;

  if (message.author.bot) return;

  const content = message.content.trim();

  if (!content) return;

  // Só ativa a chamada de suporte quando o usuário pedir.
  if (
    userRequestedAIHelp(content) &&
    !ticket.supportRequested
  ) {
    ticket.supportRequested = true;
    ticket.supportRequestedAt = Date.now();

    await saveData();

    const staffRole = cfg.ticketStaffRole;

    await message.channel.send({
      components: [
        v2(
          `${E.suporte} SUPORTE SOLICITADO`,
          [
            `O usuário <@${message.author.id}> solicitou atendimento humano.`,
            "",
            "A equipe foi avisada. A IA poderá continuar ajudando enquanto alguém assume o atendimento."
          ].join("\n")
        )
      ],
      allowedMentions: {
        roles: staffRole ? [staffRole] : [],
        users: []
      }
    });

    if (staffRole) {
      await message.channel.send({
        content: `<@&${staffRole}>`,
        allowedMentions: {
          roles: [staffRole]
        }
      });
    }
  }

  // Se a IA já estiver respondendo, não envia mensagens vazias.
  if (content.length < 2) return;

  try {
    await message.channel.sendTyping();

    const response = await askGroq(
      message.guild.id,
      message.channel.id,
      message.author.username,
      content
    );

    await message.reply({
      content: response.slice(0, 1900),
      allowedMentions: {
        repliedUser: false
      }
    });

  } catch (error) {
    console.error(
      "[ZYPhor] Erro na IA do ticket:",
      error
    );
  }
}

// ======================================================
// IA — CANAL DE CONVERSA
// ======================================================

async function handleAIChat(message, cfg) {
  if (!cfg.aiChatEnabled) return;

  if (!cfg.aiChannel) return;

  if (message.channel.id !== cfg.aiChannel) return;

  if (message.author.bot) return;

  if (!message.content.trim()) return;

  if (!groq) {
    return message.reply(
      "A inteligência artificial está indisponível no momento."
    );
  }

  try {
    await message.channel.sendTyping();

    const response = await askGroq(
      message.guild.id,
      message.channel.id,
      message.author.username,
      message.content
    );

    await message.reply({
      content: response.slice(0, 1900),
      allowedMentions: {
        repliedUser: false
      }
    });

  } catch (error) {
    console.error(
      "[ZYPhor] Erro no chat IA:",
      error
    );
  }
}

// ======================================================
// TESTAR CONEXÃO GROQ
// ======================================================

async function testGroq(interaction) {
  if (!groq) {
    return replyV2(
      interaction,
      "GROQ INDISPONÍVEL",
      `${E.alerta} A variável GROQ_API_KEY não foi encontrada no ambiente de hospedagem.`
    );
  }

  try {
    const result = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "user",
          content: "Responda somente: conexão funcionando."
        }
      ],
      max_tokens: 30
    });

    const response =
      result.choices?.[0]?.message?.content;

    return replyV2(
      interaction,
      `${E.aceito} GROQ CONECTADA`,
      `A conexão foi testada com sucesso.\n\n**Modelo:** ${AI_MODEL}\n**Resposta:** ${response || "Conexão recebida."}`
    );

  } catch (error) {
    console.error("[ZYPhor] Teste Groq:", error);

    return replyV2(
      interaction,
      "ERRO NA GROQ",
      "Não consegui testar a conexão. Confira a chave, o modelo e a disponibilidade da API."
    );
  }
}

// ======================================================
// EDITAR INSTRUÇÕES DA IA
// ======================================================

async function openAIPromptModal(interaction) {
  const cfg = getGuild(interaction.guild.id);

  const modal = new ModalBuilder()
    .setCustomId("zy_modal_ai_prompt")
    .setTitle("Instruções da IA");

  const input = new TextInputBuilder()
    .setCustomId("ai_prompt")
    .setLabel("Instruções para a inteligência artificial")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(3500)
    .setValue(
      (cfg.aiSystemPrompt || "").slice(0, 3500)
    );

  modal.addComponents(
    new ActionRowBuilder().addComponents(input)
  );

  return interaction.showModal(modal);
}

// ======================================================
// SALVAR INSTRUÇÕES DA IA
// ======================================================

async function saveAIPrompt(interaction) {
  const cfg = getGuild(interaction.guild.id);

  const prompt = interaction.fields
    .getTextInputValue("ai_prompt")
    .trim();

  if (!prompt) {
    return replyV2(
      interaction,
      "TEXTO INVÁLIDO",
      "As instruções não podem ficar vazias."
    );
  }

  cfg.aiSystemPrompt = prompt;

  await saveData();

  return replyV2(
    interaction,
    "IA ATUALIZADA",
    `${E.aceito} As instruções da IA foram salvas.`
  );
}

// ======================================================
// SISTEMA DE ANTI-SPAM
// ======================================================

const spamTracker = new Map();

function checkSpam(message) {
  const key = `${message.guild.id}_${message.author.id}`;

  const now = Date.now();

  const timestamps = spamTracker.get(key) || [];

  const recent = timestamps.filter(
    timestamp => now - timestamp < 5000
  );

  recent.push(now);

  spamTracker.set(key, recent);

  return recent.length >= 6;
}

// ======================================================
// ANTI-LINKS
// ======================================================

function containsBlockedLink(content) {
  const urlPattern =
    /https?:\/\/|www\.|discord\.gg\/|discord\.com\/invite\//i;

  return urlPattern.test(content);
}

// ======================================================
// HONEYPOT
// ======================================================

async function handleHoneypot(message, cfg) {
  if (!cfg.honeypotChannel) return;

  if (message.channel.id !== cfg.honeypotChannel) return;

  if (message.author.bot) return;

  const member = message.member;

  if (!member) return;

  if (
    message.author.id === OWNER_ID ||
    message.guild.ownerId === message.author.id ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return;
  }

  const botMember = message.guild.members.me;

  if (
    botMember.roles.highest.position <=
    member.roles.highest.position
  ) {
    return;
  }

  await message.delete().catch(() => null);

  let action = cfg.honeypotAction || "timeout";

  try {
    if (action === "timeout") {
      await member.timeout(
        Number(cfg.honeypotDuration) || 604800000,
        "ZYPhor Honeypot"
      );
    } else if (action === "kick") {
      await member.kick("ZYPhor Honeypot");
    } else if (action === "ban") {
      await member.ban({
        reason: "ZYPhor Honeypot"
      });
    }

    await sendLog(
      message.guild,
      "HONEYPOT ACIONADO",
      [
        `**Usuário:** <@${member.id}>`,
        `**ID:** ${member.id}`,
        `**Ação:** ${action}`,
        `**Canal:** ${message.channel}`
      ].join("\n")
    );

  } catch (error) {
    console.error(
      "[ZYPhor] Erro no Honeypot:",
      error
    );
  }
}

// ======================================================
// ANTI-SPAM E ANTI-LINKS
// ======================================================

async function handleBasicSecurity(message, cfg) {
  if (!cfg.securityEnabled) return;

  if (message.author.bot) return;

  const member = message.member;

  if (!member) return;

  if (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    isStaff(member)
  ) {
    return;
  }

  if (cfg.antiSpam && checkSpam(message)) {
    await message.delete().catch(() => null);

    await sendLog(
      message.guild,
      "ANTI-SPAM",
      `Uma mensagem de <@${message.author.id}> foi removida por excesso de mensagens.`
    );

    return;
  }

  if (
    cfg.antiLinks &&
    containsBlockedLink(message.content)
  ) {
    await message.delete().catch(() => null);

    await sendLog(
      message.guild,
      "ANTI-LINKS",
      `Uma mensagem com link de <@${message.author.id}> foi removida.`
    );
  }
}

// ======================================================
// DOCUMENTOS: REGRAS E TERMOS
// ======================================================

function getDocumentConfig(guildId) {
  const cfg = getGuild(guildId);

  if (!Object.prototype.hasOwnProperty.call(cfg, "termsChannel")) {
    cfg.termsChannel = null;
  }

  if (!Object.prototype.hasOwnProperty.call(cfg, "termsText")) {
    cfg.termsText = "";
  }

  return cfg;
}

// ======================================================
// MODAL DE EDIÇÃO DAS REGRAS
// ======================================================

async function openRulesModal(interaction) {
  const cfg = getDocumentConfig(interaction.guild.id);

  const modal = new ModalBuilder()
    .setCustomId("zy_modal_rules")
    .setTitle("Editar regras");

  const input = new TextInputBuilder()
    .setCustomId("rules_text")
    .setLabel("Texto das regras")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000)
    .setValue(
      (cfg.rulesText || "Escreva aqui as regras do servidor.").slice(0, 4000)
    );

  modal.addComponents(
    new ActionRowBuilder().addComponents(input)
  );

  return interaction.showModal(modal);
}

// ======================================================
// MODAL DE EDIÇÃO DOS TERMOS
// ======================================================

async function openTermsModal(interaction) {
  const cfg = getDocumentConfig(interaction.guild.id);

  const modal = new ModalBuilder()
    .setCustomId("zy_modal_terms")
    .setTitle("Editar termos de uso");

  const input = new TextInputBuilder()
    .setCustomId("terms_text")
    .setLabel("Texto dos termos de uso")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000)
    .setValue(
      (cfg.termsText || "Escreva aqui os termos de uso.").slice(0, 4000)
    );

  modal.addComponents(
    new ActionRowBuilder().addComponents(input)
  );

  return interaction.showModal(modal);
}

// ======================================================
// SALVAR REGRAS
// ======================================================

async function saveRules(interaction) {
  const cfg = getDocumentConfig(interaction.guild.id);

  const text = interaction.fields
    .getTextInputValue("rules_text")
    .trim();

  if (!text) {
    return replyV2(
      interaction,
      "REGRAS VAZIAS",
      "Escreva as regras antes de salvar."
    );
  }

  cfg.rulesText = text;

  await saveData();

  return replyV2(
    interaction,
    "REGRAS SALVAS",
    `${E.aceito} As regras foram salvas.`
  );
}

// ======================================================
// SALVAR TERMOS
// ======================================================

async function saveTerms(interaction) {
  const cfg = getDocumentConfig(interaction.guild.id);

  const text = interaction.fields
    .getTextInputValue("terms_text")
    .trim();

  if (!text) {
    return replyV2(
      interaction,
      "TERMOS VAZIOS",
      "Escreva os termos antes de salvar."
    );
  }

  cfg.termsText = text;

  await saveData();

  return replyV2(
    interaction,
    "TERMOS SALVOS",
    `${E.aceito} Os termos de uso foram salvos.`
  );
}

// ======================================================
// PUBLICAR DOCUMENTO
// ======================================================

async function publishDocument(
  interaction,
  type
) {
  const cfg = getDocumentConfig(interaction.guild.id);

  const isTerms = type === "terms";

  const content = isTerms
    ? cfg.termsText
    : cfg.rulesText;

  const channelId = isTerms
    ? cfg.termsChannel
    : cfg.rulesChannel;

  if (!content) {
    return replyV2(
      interaction,
      "DOCUMENTO NÃO CONFIGURADO",
      `Edite primeiro ${isTerms ? "os termos de uso" : "as regras"} pelo /config.`
    );
  }

  if (!channelId) {
    return replyV2(
      interaction,
      "CANAL NÃO CONFIGURADO",
      `Selecione primeiro o canal de publicação ${isTerms ? "dos termos" : "das regras"} no /config.`
    );
  }

  const channel = await interaction.guild.channels
    .fetch(channelId)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return replyV2(
      interaction,
      "CANAL INVÁLIDO",
      "O canal selecionado não está disponível."
    );
  }

  try {
    await sendV2(
      channel,
      isTerms
        ? `${E.documento} TERMOS DE USO`
        : `${E.regras} REGRAS DO SERVIDOR`,
      content
    );

    return replyV2(
      interaction,
      "PUBLICAÇÃO CONCLUÍDA",
      `${E.aceito} O documento foi publicado em <#${channel.id}>.`
    );

  } catch (error) {
    console.error(
      "[ZYPhor] Erro ao publicar documento:",
      error
    );

    return replyV2(
      interaction,
      "ERRO NA PUBLICAÇÃO",
      "Não consegui publicar o documento. Confira as permissões do bot."
    );
  }
}

// ======================================================
// FIM DA PARTE 4/5
// A PARTE 5 TERÁ OS EVENTOS E OS COMANDOS.
// ======================================================
// ======================================================
// ZYPHOR BOT — PARTE 5/5
// EVENTOS, CONFIGURAÇÕES, AVISOS E INICIALIZAÇÃO
// ======================================================

// ======================================================
// DOCUMENTOS E AVISOS — CONFIGURAÇÃO
// ======================================================

function homePanel(guild) {
  const cfg = getDocumentConfig(guild.id);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("zy_section")
    .setPlaceholder("Selecione uma categoria")
    .addOptions(
      { label: "Tickets", value: "tickets", emoji: emojiData("ticket") },
      { label: "Inteligência Artificial", value: "ai", emoji: emojiData("config") },
      { label: "Segurança", value: "security", emoji: emojiData("security") },
      { label: "Honeypot", value: "honeypot", emoji: emojiData("protegido") },
      { label: "Moderação", value: "moderation", emoji: emojiData("ban") },
      { label: "Boas-vindas e saídas", value: "welcome", emoji: emojiData("servidor") },
      { label: "Registros", value: "logs", emoji: emojiData("documento") },
      { label: "Regras e publicações", value: "publications", emoji: emojiData("regras") }
    );

  return v2(
    `${E.config} ZYPHOR — CENTRAL DE CONFIGURAÇÃO`,
    [
      `**Servidor:** ${guild.name}`,
      "",
      `${E.protegido} Painel de gerenciamento do servidor.`,
      "",
      "Selecione uma categoria no menu abaixo.",
      "",
      `${E.fixo} Painel permanente no canal.`,
      `${E.ativado} IA nos tickets: ${cfg.aiTicketEnabled ? "Ativada" : "Desativada"}`,
      `${E.ativado} Segurança: ${cfg.securityEnabled ? "Ativada" : "Desativada"}`
    ].join("\n"),
    [new ActionRowBuilder().addComponents(menu)]
  );
}

// ======================================================
// PAINEL DE REGRAS, TERMOS E AVISOS
// ======================================================

const previousSectionPanel = sectionPanel;

sectionPanel = function(section, guild) {
  if (section !== "publications") {
    return previousSectionPanel(section, guild);
  }

  const row1 = new ActionRowBuilder().addComponents(
    configButton("Canal das regras", "zy_cfg_rules_channel", "regras"),
    configButton("Editar regras", "zy_cfg_rules_edit", "documento"),
    configButton("Publicar regras", "zy_cfg_rules_publish", "positivo")
  );

  const row2 = new ActionRowBuilder().addComponents(
    configButton("Canal dos termos", "zy_cfg_terms_channel", "documento"),
    configButton("Editar termos", "zy_cfg_terms_edit", "documento"),
    configButton("Publicar termos", "zy_cfg_terms_publish", "positivo")
  );

  const row3 = new ActionRowBuilder().addComponents(
    configButton("Canal dos avisos", "zy_cfg_notice_channel", "alerta"),
    configButton("Criar aviso", "zy_cfg_notice_edit", "digitar"),
    configButton("Publicar aviso", "zy_cfg_notice_publish", "play")
  );

  const row4 = new ActionRowBuilder().addComponents(
    configButton("Voltar ao início", "zy_cfg_home", "seta")
  );

  return v2(
    `${E.documento} PUBLICAÇÕES ZYPHOR`,
    [
      "Gerencie os documentos e comunicados do servidor.",
      "",
      "**REGRAS**",
      "Edite e publique as regras do servidor.",
      "",
      "**TERMOS DE USO**",
      "Edite e publique os termos de utilização.",
      "",
      "**AVISOS**",
      "Crie comunicados e publique no canal escolhido.",
      "",
      `${E.fixo} As configurações ficam salvas no data.json.`
    ].join("\n"),
    [row1, row2, row3, row4]
  );
};

// ======================================================
// CONFIGURAÇÃO DOS AVISOS
// ======================================================

function getNoticeConfig(guildId) {
  const cfg = getDocumentConfig(guildId);

  if (!Object.prototype.hasOwnProperty.call(cfg, "noticeChannel")) {
    cfg.noticeChannel = null;
  }

  if (!Object.prototype.hasOwnProperty.call(cfg, "noticeText")) {
    cfg.noticeText = "";
  }

  return cfg;
}

async function openNoticeModal(interaction) {
  const cfg = getNoticeConfig(interaction.guild.id);

  const modal = new ModalBuilder()
    .setCustomId("zy_modal_notice")
    .setTitle("Criar aviso");

  const input = new TextInputBuilder()
    .setCustomId("notice_text")
    .setLabel("Texto do aviso")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Escreva seu comunicado. Pode usar @here ou @everyone.")
    .setRequired(true)
    .setMaxLength(4000);

  if (cfg.noticeText) {
    input.setValue(cfg.noticeText.slice(0, 4000));
  }

  modal.addComponents(
    new ActionRowBuilder().addComponents(input)
  );

  return interaction.showModal(modal);
}

async function saveNotice(interaction) {
  const cfg = getNoticeConfig(interaction.guild.id);

  cfg.noticeText = interaction.fields
    .getTextInputValue("notice_text")
    .trim();

  if (!cfg.noticeText) {
    return replyV2(interaction, "AVISO VAZIO", "Escreva o aviso antes de salvar.");
  }

  await saveData();

  return replyV2(
    interaction,
    "AVISO SALVO",
    `${E.aceito} O comunicado foi salvo. Agora você pode publicá-lo.`
  );
}

async function publishNotice(interaction) {
  const cfg = getNoticeConfig(interaction.guild.id);

  if (!cfg.noticeText) {
    return replyV2(interaction, "AVISO NÃO CONFIGURADO", "Crie e salve um aviso primeiro.");
  }

  if (!cfg.noticeChannel) {
    return replyV2(interaction, "CANAL NÃO CONFIGURADO", "Selecione o canal dos avisos no /config.");
  }

  const channel = await interaction.guild.channels
    .fetch(cfg.noticeChannel)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return replyV2(interaction, "CANAL INVÁLIDO", "O canal dos avisos não está disponível.");
  }

  try {
    await channel.send({
      components: [
        v2(
          `${E.alerta} COMUNICADO OFICIAL`,
          cfg.noticeText
        )
      ],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: {
        parse: ["everyone"]
      }
    });

    return replyV2(
      interaction,
      "AVISO PUBLICADO",
      `${E.aceito} Comunicado publicado em <#${channel.id}>.`
    );
  } catch (error) {
    console.error("[ZYPhor] Erro ao publicar aviso:", error);

    return replyV2(
      interaction,
      "ERRO",
      "Não consegui publicar o aviso. Confira minhas permissões."
    );
  }
}

// ======================================================
// SELETORES DE CANAIS E CARGOS
// ======================================================

async function showChannelSelector(interaction, property, title, channelTypes) {
  const selector = new ChannelSelectMenuBuilder()
    .setCustomId(`zy_select_channel:${property}`)
    .setPlaceholder("Selecione um canal")
    .setChannelTypes(...channelTypes)
    .setMinValues(1)
    .setMaxValues(1);

  return replyV2(
    interaction,
    title,
    "Escolha o canal no menu abaixo.",
    [new ActionRowBuilder().addComponents(selector)]
  );
}

async function showRoleSelector(interaction, property, title) {
  const selector = new RoleSelectMenuBuilder()
    .setCustomId(`zy_select_role:${property}`)
    .setPlaceholder("Selecione um cargo")
    .setMinValues(1)
    .setMaxValues(1);

  return replyV2(
    interaction,
    title,
    "Escolha o cargo no menu abaixo.",
    [new ActionRowBuilder().addComponents(selector)]
  );
}

// ======================================================
// EXECUTAR BOTÕES DE CONFIGURAÇÃO
// ======================================================

async function handleConfigButton(interaction) {
  const id = interaction.customId;
  const cfg = getDocumentConfig(interaction.guild.id);

  if (id === "zy_cfg_home") {
    return interaction.update({
      components: [homePanel(interaction.guild)]
    });
  }

  if (id === "zy_cfg_ticket_channel") {
    return showChannelSelector(
      interaction,
      "ticketChannel",
      "CANAL DO PAINEL DE TICKETS",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_cfg_ticket_category") {
    return showChannelSelector(
      interaction,
      "ticketCategory",
      "CATEGORIA DOS TICKETS",
      [ChannelType.GuildCategory]
    );
  }

  if (id === "zy_cfg_ticket_role") {
    return showRoleSelector(interaction, "ticketStaffRole", "CARGO DE SUPORTE");
  }

  if (id === "zy_cfg_ticket_mode") {
    return replyV2(
      interaction,
      "MODO DOS TICKETS",
      "Esta versão utiliza canais privados. O modo de threads ainda não está conectado."
    );
  }

  if (id === "zy_cfg_ticket_publish") {
    return publishTicketPanel(interaction);
  }

  if (id === "zy_cfg_ai_ticket") {
    cfg.aiTicketEnabled = !cfg.aiTicketEnabled;
    await saveData();

    return replyV2(
      interaction,
      "IA NOS TICKETS",
      `A IA nos tickets agora está ${cfg.aiTicketEnabled ? E.ativado : E.desligado}.`
    );
  }

  if (id === "zy_cfg_ai_chat") {
    cfg.aiChatEnabled = !cfg.aiChatEnabled;
    await saveData();

    return replyV2(
      interaction,
      "IA NO CHAT",
      `A IA no chat agora está ${cfg.aiChatEnabled ? E.ativado : E.desligado}.`
    );
  }

  if (id === "zy_cfg_ai_channel") {
    return showChannelSelector(
      interaction,
      "aiChannel",
      "CANAL DA INTELIGÊNCIA ARTIFICIAL",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_cfg_ai_prompt") {
    return openAIPromptModal(interaction);
  }

  if (id === "zy_cfg_ai_test") {
    return testGroq(interaction);
  }

  if (id === "zy_cfg_security_toggle") {
    cfg.securityEnabled = !cfg.securityEnabled;
    await saveData();

    return replyV2(
      interaction,
      "SEGURANÇA",
      `Sistema de segurança: ${cfg.securityEnabled ? E.ativado : E.desligado}.`
    );
  }

  if (id === "zy_cfg_antispam") {
    cfg.antiSpam = !cfg.antiSpam;
    await saveData();

    return replyV2(
      interaction,
      "ANTI-SPAM",
      `Anti-spam: ${cfg.antiSpam ? E.ativado : E.desligado}.`
    );
  }

  if (id === "zy_cfg_antilinks") {
    cfg.antiLinks = !cfg.antiLinks;
    await saveData();

    return replyV2(
      interaction,
      "ANTI-LINKS",
      `Anti-links: ${cfg.antiLinks ? E.ativado : E.desligado}.`
    );
  }

  if (id === "zy_cfg_honeypot_channel") {
    return showChannelSelector(
      interaction,
      "honeypotChannel",
      "CANAL HONEYPOT",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_cfg_honeypot_action") {
    const actions = ["timeout", "kick", "ban"];
    const current = actions.indexOf(cfg.honeypotAction);
    cfg.honeypotAction = actions[(current + 1) % actions.length];

    await saveData();

    return replyV2(
      interaction,
      "AÇÃO HONEYPOT",
      `Ação atual: **${cfg.honeypotAction}**.`
    );
  }

  if (id === "zy_cfg_honeypot_duration") {
    cfg.honeypotDuration =
      cfg.honeypotDuration === 3600000
        ? 86400000
        : cfg.honeypotDuration === 86400000
          ? 604800000
          : 3600000;

    await saveData();

    return replyV2(
      interaction,
      "DURAÇÃO HONEYPOT",
      `Duração atual: **${cfg.honeypotDuration / 3600000} hora(s)**.`
    );
  }

  if (id === "zy_cfg_mod_role") {
    return showRoleSelector(interaction, "moderationRole", "CARGO DE MODERAÇÃO");
  }

  if (id === "zy_cfg_config_role") {
    return showRoleSelector(interaction, "configRole", "CARGO DE CONFIGURAÇÃO");
  }

  if (id === "zy_cfg_welcome_channel") {
    return showChannelSelector(
      interaction,
      "welcomeChannel",
      "CANAL DE BOAS-VINDAS",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_cfg_welcome_toggle") {
    cfg.welcomeEnabled = !cfg.welcomeEnabled;
    await saveData();

    return replyV2(
      interaction,
      "BOAS-VINDAS",
      `Boas-vindas: ${cfg.welcomeEnabled ? E.ativado : E.desligado}.`
    );
  }

  if (id === "zy_cfg_leave_channel") {
    return showChannelSelector(
      interaction,
      "leaveChannel",
      "CANAL DE SAÍDA",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_cfg_leave_toggle") {
    cfg.leaveEnabled = !cfg.leaveEnabled;
    await saveData();

    return replyV2(
      interaction,
      "MENSAGENS DE SAÍDA",
      `Mensagens de saída: ${cfg.leaveEnabled ? E.ativado : E.desligado}.`
    );
  }

  if (id === "zy_cfg_autorole") {
    return showRoleSelector(interaction, "autoRole", "CARGO AUTOMÁTICO");
  }

  if (id === "zy_cfg_log_channel") {
    return showChannelSelector(
      interaction,
      "logChannel",
      "CANAL DE REGISTROS",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_cfg_rules_channel") {
    return showChannelSelector(
      interaction,
      "rulesChannel",
      "CANAL DAS REGRAS",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_cfg_rules_edit") {
    return openRulesModal(interaction);
  }

  if (id === "zy_cfg_rules_publish") {
    return publishDocument(interaction, "rules");
  }

  if (id === "zy_cfg_terms_channel") {
    return showChannelSelector(
      interaction,
      "termsChannel",
      "CANAL DOS TERMOS",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_cfg_terms_edit") {
    return openTermsModal(interaction);
  }

  if (id === "zy_cfg_terms_publish") {
    return publishDocument(interaction, "terms");
  }

  if (id === "zy_cfg_notice_channel") {
    return showChannelSelector(
      interaction,
      "noticeChannel",
      "CANAL DOS AVISOS",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_cfg_notice_edit") {
    return openNoticeModal(interaction);
  }

  if (id === "zy_cfg_notice_publish") {
    return publishNotice(interaction);
  }
}

// ======================================================
// SELEÇÃO DE CANAIS
// ======================================================

async function handleChannelSelection(interaction) {
  const property = interaction.customId.split(":")[1];

  const allowed = [
    "ticketChannel",
    "ticketCategory",
    "aiChannel",
    "honeypotChannel",
    "welcomeChannel",
    "leaveChannel",
    "logChannel",
    "rulesChannel",
    "termsChannel",
    "noticeChannel"
  ];

  if (!allowed.includes(property)) {
    return replyV2(interaction, "SELEÇÃO INVÁLIDA", "Este seletor não existe.");
  }

  const cfg = getDocumentConfig(interaction.guild.id);

  cfg[property] = interaction.values[0];

  await saveData();

  return replyV2(
    interaction,
    "CANAL CONFIGURADO",
    `${E.aceito} Canal atualizado para <#${interaction.values[0]}>.`
  );
}

// ======================================================
// SELEÇÃO DE CARGOS
// ======================================================

async function handleRoleSelection(interaction) {
  const property = interaction.customId.split(":")[1];

  const allowed = [
    "ticketStaffRole",
    "moderationRole",
    "configRole",
    "autoRole"
  ];

  if (!allowed.includes(property)) {
    return replyV2(interaction, "SELEÇÃO INVÁLIDA", "Este seletor não existe.");
  }

  const cfg = getGuild(interaction.guild.id);

  cfg[property] = interaction.values[0];

  await saveData();

  return replyV2(
    interaction,
    "CARGO CONFIGURADO",
    `${E.aceito} Cargo atualizado para <@&${interaction.values[0]}>.`
  );
}

// ======================================================
// EVENTO DE INTERAÇÕES
// ======================================================

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "config") {
        return publishConfigPanel(interaction);
      }

      if (interaction.commandName === "feedbacks") {
        return showFeedbacks(interaction);
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "zy_section") {
        if (!canConfigure(interaction.member)) {
          return replyV2(
            interaction,
            "ACESSO NEGADO",
            `${E.proibido} Você não pode alterar as configurações.`
          );
        }

        return interaction.update({
          components: [
            sectionPanel(
              interaction.values[0],
              interaction.guild
            )
          ]
        });
      }

      if (interaction.customId === "zy_ticket_open") {
        return createTicket(
          interaction,
          interaction.values[0]
        );
      }
    }

    if (interaction.isChannelSelectMenu()) {
      if (!canConfigure(interaction.member)) {
        return replyV2(interaction, "ACESSO NEGADO", "Você não pode configurar canais.");
      }

      return handleChannelSelection(interaction);
    }

    if (interaction.isRoleSelectMenu()) {
      if (!canConfigure(interaction.member)) {
        return replyV2(interaction, "ACESSO NEGADO", "Você não pode configurar cargos.");
      }

      return handleRoleSelection(interaction);
    }

    if (interaction.isButton()) {
      if (interaction.customId === "zy_ticket_claim") {
        return claimTicket(interaction);
      }

      if (interaction.customId === "zy_ticket_close") {
        return closeTicket(interaction);
      }

      if (interaction.customId.startsWith("zy_feedback:")) {
        return handleTicketFeedback(interaction);
      }

      if (interaction.customId.startsWith("zy_cfg_")) {
        if (!canConfigure(interaction.member)) {
          return replyV2(
            interaction,
            "ACESSO NEGADO",
            `${E.proibido} Você não pode alterar as configurações.`
          );
        }

        return handleConfigButton(interaction);
      }
    }

    if (interaction.isModalSubmit()) {
      if (!canConfigure(interaction.member)) {
        return replyV2(interaction, "ACESSO NEGADO", "Você não pode alterar as configurações.");
      }

      if (interaction.customId === "zy_modal_ai_prompt") {
        return saveAIPrompt(interaction);
      }

      if (interaction.customId === "zy_modal_rules") {
        return saveRules(interaction);
      }

      if (interaction.customId === "zy_modal_terms") {
        return saveTerms(interaction);
      }

      if (interaction.customId === "zy_modal_notice") {
        return saveNotice(interaction);
      }
    }

  } catch (error) {
    console.error("[ZYPhor] Erro em interação:", error);

    if (!interaction.replied && !interaction.deferred) {
      await replyV2(
        interaction,
        "ERRO",
        "Ocorreu um erro ao executar essa ação."
      ).catch(() => null);
    }
  }
});

// ======================================================
// EVENTO DE MENSAGENS
// ======================================================

client.on("messageCreate", async message => {
  try {
    if (!message.guild || message.author.bot) return;

    const cfg = getGuild(message.guild.id);

    // Honeypot
    await handleHoneypot(message, cfg);

    // Segurança
    await handleBasicSecurity(message, cfg);

    // Ticket e IA
    const ticket = getTicketFromChannel(message.channel.id);

    if (ticket && cfg.aiTicketEnabled) {
      await handleTicketAI(message, ticket, cfg);
      return;
    }

    // Chat IA
    if (cfg.aiChatEnabled && cfg.aiChannel === message.channel.id) {
      await handleAIChat(message, cfg);
      return;
    }

    // Comando de consulta de feedbacks
    if (message.content.trim() === `${PREFIX}feedbacks`) {
      if (isStaff(message.member)) {
        const fakeInteraction = {
          guild: message.guild,
          member: message.member,
          replied: false,
          deferred: false,
          reply: payload => message.reply(payload)
        };

        const feedbacks = Object.values(data.feedbacks)
          .filter(item => item?.guildId === message.guild.id);

        const average = feedbacks.length
          ? feedbacks.reduce((sum, item) => sum + item.rating, 0) / feedbacks.length
          : 0;

        return sendV2(
          message.channel,
          `${E.comentario} CENTRAL DE FEEDBACKS`,
          `**Total:** ${feedbacks.length}\n**Média:** ${average.toFixed(2)}/5`
        );
      }
    }

  } catch (error) {
    console.error("[ZYPhor] Erro em messageCreate:", error);
  }
});

// ======================================================
// CORREÇÃO: IA NO TICKET SÓ APÓS PEDIDO DE AJUDA
// ======================================================

handleTicketAI = async function(message, ticket, cfg) {
  if (!cfg.aiTicketEnabled || !groq || message.author.bot) return;

  const content = message.content.trim();

  if (!content) return;

  if (!ticket.supportRequested) {
    if (!userRequestedAIHelp(content)) return;

    ticket.supportRequested = true;
    ticket.supportRequestedAt = Date.now();

    await saveData();

    const staffRole = cfg.ticketStaffRole;

    await message.channel.send({
      components: [
        v2(
          `${E.suporte} SUPORTE SOLICITADO`,
          `O usuário <@${message.author.id}> solicitou atendimento humano.\n\nA equipe foi avisada. A IA poderá ajudar enquanto alguém assume o atendimento.`
        )
      ],
      flags: MessageFlags.IsComponentsV2
    });

    if (staffRole) {
      await message.channel.send({
        content: `<@&${staffRole}>`,
        allowedMentions: {
          roles: [staffRole]
        }
      });
    }
  }

  try {
    await message.channel.sendTyping();

    const response = await askGroq(
      message.guild.id,
      message.channel.id,
      message.author.username,
      content
    );

    await message.reply({
      content: response.slice(0, 1900),
      allowedMentions: {
        repliedUser: false
      }
    });
  } catch (error) {
    console.error("[ZYPhor] Erro na IA do ticket:", error);
  }
};

// ======================================================
// BOAS-VINDAS
// ======================================================

client.on("guildMemberAdd", async member => {
  try {
    const cfg = getGuild(member.guild.id);

    if (cfg.autoRole) {
      await member.roles.add(cfg.autoRole).catch(error => {
        console.error("[ZYPhor] Erro no cargo automático:", error);
      });
    }

    if (!cfg.welcomeEnabled || !cfg.welcomeChannel) return;

    const channel = await member.guild.channels
      .fetch(cfg.welcomeChannel)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) return;

    await sendV2(
      channel,
      `${E.online} BOAS-VINDAS`,
      `Seja bem-vindo(a), <@${member.id}>!\n\nAgora você faz parte de **${member.guild.name}**.\n\nEsperamos que tenha uma ótima experiência.`
    );

  } catch (error) {
    console.error("[ZYPhor] Erro nas boas-vindas:", error);
  }
});

// ======================================================
// SAÍDA DE MEMBROS
// ======================================================

client.on("guildMemberRemove", async member => {
  try {
    const cfg = getGuild(member.guild.id);

    if (!cfg.leaveEnabled || !cfg.leaveChannel) return;

    const channel = await member.guild.channels
      .fetch(cfg.leaveChannel)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) return;

    await sendV2(
      channel,
      `${E.servidor} MEMBRO SAIU`,
      `O membro **${member.user.tag}** saiu do servidor.`
    );

  } catch (error) {
    console.error("[ZYPhor] Erro na saída:", error);
  }
});

// ======================================================
// COMANDOS SLASH
// ======================================================

const commands = [
  new SlashCommandBuilder()
    .setName("config")
    .setDescription("Publica o painel fixo de configuração."),

  new SlashCommandBuilder()
    .setName("feedbacks")
    .setDescription("Consulta as avaliações dos tickets.")
];

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    {
      body: commands.map(command => command.toJSON())
    }
  );

  console.log("[ZYPhor] Comandos registrados.");
}

// ======================================================
// STATUS AUTOMÁTICO — ROXO
// ======================================================

let statusIndex = 0;
let statusTimer = null;

function startStatusRotation() {
  if (!client.user) return;

  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }

  const settings = data.status;

  if (!settings.enabled) return;

  const activities = Array.isArray(settings.activities)
    ? settings.activities.filter(
        item => typeof item === "string" && item.trim()
      )
    : [];

  if (!activities.length) return;

  const interval = Math.max(
    15000,
    Number(settings.interval) || 15000
  );

  function updateStatus() {
    const name = activities[statusIndex % activities.length];

    client.user.setPresence({
      activities: [
        {
          name,
          type: ActivityType.Streaming,
          url: "https://twitch.tv/discord"
        }
      ],
      status: "online"
    });

    statusIndex++;
  }

  updateStatus();

  statusTimer = setInterval(
    updateStatus,
    interval
  );
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

loadData();

client.once("ready", async () => {
  console.log("-----------------------------------");
  console.log(`[ZYPhor] Online como ${client.user.tag}`);
  console.log(`[ZYPhor] Servidores: ${client.guilds.cache.size}`);
  console.log(`[ZYPhor] Groq: ${groq ? "Configurada" : "Não configurada"}`);
  console.log("-----------------------------------");

  startStatusRotation();

  try {
    await registerCommands();
  } catch (error) {
    console.error(
      "[ZYPhor] Erro ao registrar comandos:",
      error
    );
  }
});

// ======================================================
// LOGIN
// ======================================================

client.login(TOKEN);

// ======================================================
// FIM DO INDEX.JS
// ======================================================
