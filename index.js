
"use strict";

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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const OpenAI = require("openai");
const fs = require("node:fs");
const path = require("node:path");

// ======================================================
// 1. CONFIGURAÇÕES PRINCIPAIS
// ======================================================

const TOKEN = process.env.DISCORD_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const OWNER_ID = "1533306874513068093";
const PREFIX = "z!";
const AI_MODEL = "gpt-4o-mini";

if (!TOKEN) {
  console.error("Configure DISCORD_TOKEN nas Secrets da hospedagem.");
  process.exit(1);
}

const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

const FILE = path.join(__dirname, "data.json");

// ======================================================
// 2. EMOJIS PERSONALIZADOS
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
  vip: "<:vip:1559077642593108008>"
};

// ======================================================
// 3. BANCO JSON
// ======================================================

let data = {
  version: 2,
  guilds: {},
  tickets: {},
  feedbacks: {},
  warnings: {},
  products: {},
  purchases: {},
  aiHistory: {}
};

function loadData() {
  try {
    if (fs.existsSync(FILE)) {
      const saved = JSON.parse(fs.readFileSync(FILE, "utf8"));
      data = { ...data, ...saved };
    }
  } catch (error) {
    console.error("Erro ao ler data.json:", error);
  }
}

let saveQueue = Promise.resolve();

function saveData() {
  saveQueue = saveQueue.then(async () => {
    const temporaryFile = FILE + ".tmp";
    await fs.promises.writeFile(
      temporaryFile,
      JSON.stringify(data, null, 2),
      "utf8"
    );
    await fs.promises.rename(temporaryFile, FILE);
  }).catch(error => {
    console.error("Erro ao salvar os dados:", error);
  });

  return saveQueue;
}

function getGuild(guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {};
  }

  const defaults = {
    ticketChannel: null,
    ticketCategory: null,
    ticketStaffRole: null,
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
      "Você é o assistente oficial do servidor Zyphor. Responda em português brasileiro, com educação e clareza. Não invente regras ou informações.",
    rulesChannel: null,
    rulesText: "",
    ticketCounter: 0
  };

  data.guilds[guildId] = {
    ...defaults,
    ...data.guilds[guildId]
  };

  return data.guilds[guildId];
}

// ======================================================
// 4. PERMISSÕES
// ======================================================

function canConfigure(member) {
  if (!member) return false;

  if (member.id === OWNER_ID) return true;
  if (member.id === member.guild.ownerId) return true;

  const cfg = getGuild(member.guild.id);

  return Boolean(
    cfg.configRole &&
    member.roles.cache.has(cfg.configRole)
  );
}

function isStaff(member) {
  if (!member) return false;

  if (member.id === OWNER_ID) return true;
  if (member.id === member.guild.ownerId) return true;

  const cfg = getGuild(member.guild.id);

  return Boolean(
    (cfg.ticketStaffRole && member.roles.cache.has(cfg.ticketStaffRole)) ||
    (cfg.moderationRole && member.roles.cache.has(cfg.moderationRole))
  );
}

// ======================================================
// 5. COMPONENTS V2
// ======================================================

function v2(title, description, rows = []) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${title}\n${String(description).slice(0, 3800)}`
      )
    );

  for (const row of rows) {
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );
    container.addActionRowComponents(row);
  }

  return container;
}

function v2Options(title, description, rows = []) {
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [v2(title, description, rows)],
    allowedMentions: { parse: [] }
  };
}

async function replyV2(interaction, title, description, rows = [], ephemeral = true) {
  return interaction.reply({
    ...v2Options(title, description, rows),
    flags: MessageFlags.IsComponentsV2 |
      (ephemeral ? MessageFlags.Ephemeral : 0)
  });
}

async function sendV2(channel, title, description, rows = []) {
  return channel.send(v2Options(title, description, rows));
}

// ======================================================
// 6. CLIENT E COMANDO
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

const configCommand = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Abre o painel de configuração do ZYPhor Bot");

// ======================================================
// 7. PAINEL PRINCIPAL
// ======================================================

function homePanel(guild) {
  const cfg = getGuild(guild.id);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("zy_section")
    .setPlaceholder("Selecione um sistema")
    .addOptions(
      {
        label: "Tickets",
        value: "tickets",
        description: "Configurar atendimento",
        emoji: "🎫"
      },
      {
        label: "Inteligência Artificial",
        value: "ai",
        description: "Configurar o ChatGPT",
        emoji: "🤖"
      },
      {
        label: "Segurança",
        value: "security",
        description: "Proteção e anti-spam",
        emoji: "🛡️"
      },
      {
        label: "Honeypot",
        value: "honeypot",
        description: "Configurar canal-isca",
        emoji: "🍯"
      },
      {
        label: "Moderação",
        value: "moderation",
        description: "Configurar equipe",
        emoji: "🔨"
      },
      {
        label: "Boas-vindas e saída",
        value: "welcome",
        description: "Mensagens automáticas",
        emoji: "👋"
      },
      {
        label: "Logs",
        value: "logs",
        description: "Registros do servidor",
        emoji: "📋"
      },
      {
        label: "Regras",
        value: "rules",
        description: "Escrever e publicar regras",
        emoji: "📜"
      }
    );

  const row = new ActionRowBuilder().addComponents(menu);

  const description = [
    `${E.servidor} **Servidor:** ${guild.name}`,
    `${E.ticket} **Painel de tickets:** ${cfg.ticketChannel ? "Configurado" : "Não configurado"}`,
    `${E.security} **Segurança:** ${cfg.securityEnabled ? "Ativada" : "Desativada"}`,
    `🤖 **ChatGPT:** ${cfg.aiChatEnabled || cfg.aiTicketEnabled ? "Ativado" : "Desativado"}`,
    `${E.documento} **Regras:** ${cfg.rulesText ? "Texto salvo" : "Ainda não escritas"}`,
    `${E.vigiando} **Logs:** ${cfg.logChannel ? "Configurado" : "Não configurado"}`
  ].join("\n");

  return v2(
    `${E.config} ZYPhor Bot • Painel administrativo`,
    `${E.dashboard} **Central de configuração**\n\n${description}\n\nEscolha uma categoria no menu abaixo.`,
    [row]
  );
}

// ======================================================
// 8. PAINÉIS DE CATEGORIA
// ======================================================

function sectionPanel(section, guild) {
  const cfg = getGuild(guild.id);
  const buttons = [];

  const add = (id, label, style = ButtonStyle.Secondary) => {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(id)
        .setLabel(label)
        .setStyle(style)
    );
  };

  if (section === "tickets") {
    add("zy_ticket_channel", "Canal do painel", ButtonStyle.Primary);
    add("zy_ticket_category", "Categoria dos tickets");
    add("zy_ticket_role", "Cargo da equipe");
    add("zy_ticket_publish", "Publicar painel", ButtonStyle.Success);
  }

  if (section === "ai") {
    add(
      "zy_ai_chat",
      `IA no chat: ${cfg.aiChatEnabled ? "ON" : "OFF"}`,
      cfg.aiChatEnabled ? ButtonStyle.Success : ButtonStyle.Secondary
    );
    add(
      "zy_ai_ticket",
      `IA nos tickets: ${cfg.aiTicketEnabled ? "ON" : "OFF"}`,
      cfg.aiTicketEnabled ? ButtonStyle.Success : ButtonStyle.Secondary
    );
    add("zy_ai_channel", "Selecionar canal da IA", ButtonStyle.Primary);
    add("zy_ai_prompt", "Editar instruções da IA");
  }

  if (section === "security") {
    add(
      "zy_security",
      `Proteção: ${cfg.securityEnabled ? "ON" : "OFF"}`,
      cfg.securityEnabled ? ButtonStyle.Success : ButtonStyle.Danger
    );
    add(
      "zy_antispam",
      `Anti-spam: ${cfg.antiSpam ? "ON" : "OFF"}`
    );
    add(
      "zy_antilinks",
      `Anti-links: ${cfg.antiLinks ? "ON" : "OFF"}`
    );
  }

  if (section === "honeypot") {
    add("zy_honeypot_channel", "Selecionar canal", ButtonStyle.Primary);
    add(
      "zy_honeypot_action",
      `Ação: ${cfg.honeypotAction.toUpperCase()}`
    );
  }

  if (section === "moderation") {
    add("zy_moderation_role", "Cargo de moderação", ButtonStyle.Primary);
    add("zy_config_role", "Cargo de administrador do bot");
  }

  if (section === "welcome") {
    add("zy_welcome_channel", "Canal de boas-vindas", ButtonStyle.Primary);
    add("zy_leave_channel", "Canal de saída");
    add(
      "zy_welcome_toggle",
      `Boas-vindas: ${cfg.welcomeEnabled ? "ON" : "OFF"}`
    );
    add(
      "zy_leave_toggle",
      `Saída: ${cfg.leaveEnabled ? "ON" : "OFF"}`
    );
  }

  if (section === "logs") {
    add("zy_log_channel", "Selecionar canal de logs", ButtonStyle.Primary);
  }

  if (section === "rules") {
    add("zy_rules_channel", "Selecionar canal das regras", ButtonStyle.Primary);
    add("zy_rules_edit", "Digitar / editar regras", ButtonStyle.Success);
    add("zy_rules_publish", "Publicar regras", ButtonStyle.Primary);
  }

  const rows = [];

  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(
      new ActionRowBuilder().addComponents(buttons.slice(i, i + 5))
    );
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("zy_home")
        .setLabel("Voltar ao painel principal")
        .setStyle(ButtonStyle.Secondary)
    )
  );

  const descriptions = {
    tickets:
      `${E.ticket} Configure o canal, categoria e equipe. Depois publique o painel para os membros abrirem atendimento.`,
    ai:
      `🤖 **ChatGPT integrado**\n\nModelo: ${AI_MODEL}\nAPI: ${openai ? "Conectada" : "Chave não configurada"}\n\nAtive os modos separadamente e escolha o canal onde a IA poderá responder.`,
    security:
      `${E.escudo} Configure os filtros de mensagens. As ações automáticas são limitadas aos filtros ativados.`,
    honeypot:
      `${E.vigiando} Mensagens enviadas no canal selecionado serão removidas e poderão gerar a ação configurada. Apenas visualizar o canal não gera punição.`,
    moderation:
      `${E.ban} Escolha os cargos autorizados a administrar o bot e a equipe de moderação.`,
    welcome:
      `👋 Configure as mensagens automáticas de entrada e saída de membros.`,
    logs:
      `${E.documento} Escolha o canal que receberá os registros do bot.`,
    rules:
      `${E.regras} Escreva suas regras em uma caixa de texto, salve e publique no canal escolhido.`
  };

  return v2(
    `${E.config} Configuração • ${section.toUpperCase()}`,
    descriptions[section] || "Configurações do servidor.",
    rows
  );
}

// ======================================================
// 9. LOGS
// ======================================================

async function sendLog(guild, title, description) {
  const cfg = getGuild(guild.id);
  if (!cfg.logChannel) return;

  const channel = await guild.channels
    .fetch(cfg.logChannel)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) return;

  await sendV2(
    channel,
    `${E.documento} ${title}`,
    `${description}\n\n${E.horario} <t:${Math.floor(Date.now() / 1000)}:F>`
  ).catch(error => console.error("Erro ao enviar log:", error));
}

// ======================================================
// 10. CHATGPT
// ======================================================

async function askChatGPT(guildId, channelId, userName, content) {
  if (!openai) {
    throw new Error("OPENAI_API_KEY não configurada.");
  }

  const cfg = getGuild(guildId);
  const key = `${guildId}:${channelId}`;

  if (!data.aiHistory[key]) {
    data.aiHistory[key] = [];
  }

  const history = data.aiHistory[key];

  history.push({
    role: "user",
    content: `${userName}: ${content.slice(0, 2500)}`
  });

  const limitedHistory = history.slice(-12);

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: cfg.aiSystemPrompt
      },
      ...limitedHistory
    ],
    max_tokens: 800,
    temperature: 0.7
  });

  const answer =
    completion.choices[0]?.message?.content ||
    "Não consegui gerar uma resposta.";

  history.push({
    role: "assistant",
    content: answer
  });

  data.aiHistory[key] = history.slice(-20);
  await saveData();

  return answer;
}

// ======================================================
// 11. EDITOR DE REGRAS
// ======================================================

async function openRulesEditor(interaction) {
  const cfg = getGuild(interaction.guildId);

  const modal = new ModalBuilder()
    .setCustomId("zy_rules_modal")
    .setTitle("Editor de regras");

  const input = new TextInputBuilder()
    .setCustomId("rules_text")
    .setLabel("Digite as regras do servidor")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("1. Respeite os membros.\n2. Não envie spam.\n3. Siga as orientações da equipe.")
    .setRequired(true)
    .setMaxLength(4000);

  if (cfg.rulesText) {
    input.setValue(cfg.rulesText.slice(0, 4000));
  }

  modal.addComponents(
    new ActionRowBuilder().addComponents(input)
  );

  return interaction.showModal(modal);
}

async function publishRules(interaction) {
  const cfg = getGuild(interaction.guildId);

  if (!cfg.rulesText) {
    return replyV2(
      interaction,
      `${E.alerta} Regras vazias`,
      "Primeiro clique em Digitar / editar regras e escreva o texto."
    );
  }

  if (!cfg.rulesChannel) {
    return replyV2(
      interaction,
      `${E.alerta} Canal não configurado`,
      "Selecione o canal onde as regras serão publicadas."
    );
  }

  const channel = await interaction.guild.channels
    .fetch(cfg.rulesChannel)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return replyV2(
      interaction,
      `${E.alerta} Canal inválido`,
      "O canal configurado não foi encontrado."
    );
  }

  await sendV2(
    channel,
    `${E.regras} REGRAS DO SERVIDOR`,
    cfg.rulesText
  );

  return replyV2(
    interaction,
    `${E.aceito} Regras publicadas`,
    `As regras foram enviadas em ${channel}.`
  );
}

// ======================================================
// 12. SELETORES DE CANAIS E CARGOS
// ======================================================

async function askChannel(interaction, customId, placeholder, types) {
  const menu = new ChannelSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setChannelTypes(...types);

  return interaction.reply({
    content: "Selecione uma opção:",
    components: [new ActionRowBuilder().addComponents(menu)],
    ephemeral: true
  });
}

async function askRole(interaction, customId, placeholder) {
  const menu = new RoleSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder);

  return interaction.reply({
    content: "Selecione um cargo:",
    components: [new ActionRowBuilder().addComponents(menu)],
    ephemeral: true
  });
}

// ======================================================
// 13. CONFIGURAÇÃO DOS TICKETS
// ======================================================

async function publishTicketPanel(interaction) {
  const cfg = getGuild(interaction.guildId);

  if (!cfg.ticketChannel || !cfg.ticketCategory || !cfg.ticketStaffRole) {
    return replyV2(
      interaction,
      `${E.alerta} Configuração incompleta`,
      "Configure o canal do painel, a categoria e o cargo da equipe antes de publicar."
    );
  }

  const channel = await interaction.guild.channels
    .fetch(cfg.ticketChannel)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return replyV2(
      interaction,
      `${E.alerta} Canal inválido`,
      "O canal selecionado não existe ou não é de texto."
    );
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("zy_open_ticket")
      .setLabel("Abrir atendimento")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Success)
  );

  await sendV2(
    channel,
    `${E.ticket} CENTRAL DE ATENDIMENTO`,
    "Precisa de ajuda? Clique no botão abaixo para abrir um ticket privado com a equipe.",
    [row]
  );

  return replyV2(
    interaction,
    `${E.aceito} Painel publicado`,
    `O painel foi publicado em ${channel}.`
  );
}

async function createTicket(interaction) {
  const guild = interaction.guild;
  const cfg = getGuild(guild.id);
  const user = interaction.user;

  if (!cfg.ticketCategory || !cfg.ticketStaffRole) {
    return replyV2(
      interaction,
      `${E.alerta} Tickets não configurados`,
      "A equipe e a categoria ainda não foram selecionadas."
    );
  }

  const existing = Object.values(data.tickets).find(ticket =>
    ticket.guildId === guild.id &&
    ticket.userId === user.id &&
    ticket.status === "open"
  );

  if (existing) {
    return replyV2(
      interaction,
      `${E.ticket} Você já tem um ticket`,
      `Seu atendimento está em <#${existing.channelId}>.`
    );
  }

  const category = await guild.channels
    .fetch(cfg.ticketCategory)
    .catch(() => null);

  if (!category || category.type !== ChannelType.GuildCategory) {
    return replyV2(
      interaction,
      `${E.alerta} Categoria inválida`,
      "A categoria configurada não foi encontrada."
    );
  }

  const botMember = await guild.members.fetchMe();

  if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return replyV2(
      interaction,
      `${E.proibido} Permissão ausente`,
      "O bot precisa da permissão Gerenciar Canais."
    );
  }

  cfg.ticketCounter += 1;

  const channel = await guild.channels.create({
    name: `ticket-${String(cfg.ticketCounter).padStart(4, "0")}`,
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
        id: client.user.id,
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
      .setCustomId("zy_claim_ticket")
      .setLabel("Atender")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("zy_close_ticket")
      .setLabel("Fechar")
      .setStyle(ButtonStyle.Danger)
  );

  await sendV2(
    channel,
    `${E.ticket} Atendimento ZYPhor`,
    `Olá, <@${user.id}>!\n\nExplique o que você precisa. A equipe responderá assim que possível.\n\n${E.suporte} Somente a equipe autorizada pode adicionar outras pessoas ao ticket.`,
    [controls]
  );

  await interaction.reply({
    ...v2Options(
      `${E.aceito} Ticket criado`,
      `Seu atendimento está em ${channel}.`
    ),
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });

  await sendLog(
    guild,
    "Ticket aberto",
    `Usuário: <@${user.id}>\nCanal: ${channel}`
  );
}

// ======================================================
// 14. FECHAMENTO E TRANSCRIÇÃO
// ======================================================

async function closeTicket(interaction) {
  const ticket = data.tickets[interaction.channelId];

  if (!ticket || ticket.status !== "open") {
    return replyV2(
      interaction,
      `${E.alerta} Ticket inválido`,
      "Este canal não possui um ticket aberto."
    );
  }

  const opener = interaction.user.id === ticket.userId;

  if (!opener && !isStaff(interaction.member)) {
    return replyV2(
      interaction,
      `${E.proibido} Sem permissão`,
      "Somente quem abriu o ticket ou a equipe pode fechá-lo."
    );
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
  });

  const fetched = await interaction.channel.messages
    .fetch({ limit: 100 })
    .catch(() => null);

  const transcript = fetched
    ? fetched
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
        .map(message => ({
          author: message.author.tag,
          userId: message.author.id,
          content: message.content || "[Mensagem sem texto]",
          timestamp: message.createdAt.toISOString()
        }))
    : [];

  ticket.transcript = transcript;
  ticket.status = "closed";
  ticket.closedAt = Date.now();
  ticket.closedBy = interaction.user.id;

  await saveData();

  await sendLog(
    interaction.guild,
    "Ticket fechado",
    `Canal: ${interaction.channel.name}\nAutor: <@${ticket.userId}>\nFechado por: <@${interaction.user.id}>\nMensagens registradas: ${transcript.length}`
  );

  const owner = await client.users.fetch(ticket.userId).catch(() => null);

  if (owner) {
    const ratingRow = new ActionRowBuilder().addComponents(
      [1, 2, 3, 4, 5].map(stars =>
        new ButtonBuilder()
          .setCustomId(`zy_rate_${stars}_${ticket.channelId}`)
          .setLabel(`${stars} ★`)
          .setStyle(stars >= 4 ? ButtonStyle.Success : ButtonStyle.Secondary)
      )
    );

    await owner.send(
      v2Options(
        `${E.like} Avalie seu atendimento`,
        "Como foi sua experiência? Escolha uma nota de 1 a 5 estrelas.",
        [ratingRow]
      )
    ).catch(() => null);
  }

  await interaction.editReply(
    v2Options(
      `${E.aceito} Ticket encerrado`,
      "A transcrição foi salva em data.json. O canal será excluído em alguns segundos."
    )
  );

  setTimeout(() => {
    interaction.channel.delete("Ticket fechado e transcrito").catch(() => null);
  }, 8000);
}

// ======================================================
// 15. FEEDBACKS
// ======================================================

async function saveFeedback(interaction) {
  const parts = interaction.customId.split("_");
  const stars = Number(parts[2]);
  const channelId = parts.slice(3).join("_");
  const ticket = data.tickets[channelId];

  if (!ticket || ticket.userId !== interaction.user.id) {
    return replyV2(
      interaction,
      `${E.proibido} Avaliação inválida`,
      "Não foi possível identificar o atendimento."
    );
  }

  const key = `${channelId}_${interaction.user.id}`;

  data.feedbacks[key] = {
    guildId: ticket.guildId,
    userId: interaction.user.id,
    stars,
    comment: null,
    createdAt: Date.now()
  };

  await saveData();

  return interaction.update(
    v2Options(
      `${E.like} Obrigado pela avaliação!`,
      `Sua nota foi registrada: **${stars}/5 estrelas**.`
    )
  );
}

async function showFeedbacks(message) {
  if (!isStaff(message.member)) {
    return sendV2(
      message.channel,
      `${E.proibido} Acesso negado`,
      "Somente a equipe autorizada pode consultar os feedbacks."
    );
  }

  const items = Object.values(data.feedbacks)
    .filter(item => item.guildId === message.guild.id);

  if (!items.length) {
    return sendV2(
      message.channel,
      `${E.documento} Feedbacks`,
      "Ainda não existem avaliações."
    );
  }

  const average = items.reduce((sum, item) => sum + item.stars, 0) / items.length;

  const lines = items
    .slice(-20)
    .reverse()
    .map(item => `**${item.stars}/5 ★** — <@${item.userId}>`);

  return sendV2(
    message.channel,
    `${E.like} Feedbacks do servidor`,
    `**Total:** ${items.length}\n**Média:** ${average.toFixed(1)}/5\n\n${lines.join("\n")}`
  );
}

// ======================================================
// 16. HANDLER DE SELETORES
// ======================================================

async function handleSelect(interaction) {
  const cfg = getGuild(interaction.guildId);
  const id = interaction.customId;

  if (id === "zy_section") {
    return interaction.update({
      components: [sectionPanel(interaction.values[0], interaction.guild)]
    });
  }

  const value = interaction.values[0];

  const fields = {
    zy_select_ticket_channel: "ticketChannel",
    zy_select_ticket_category: "ticketCategory",
    zy_select_ticket_role: "ticketStaffRole",
    zy_select_honeypot: "honeypotChannel",
    zy_select_welcome: "welcomeChannel",
    zy_select_leave: "leaveChannel",
    zy_select_logs: "logChannel",
    zy_select_moderation_role: "moderationRole",
    zy_select_config_role: "configRole",
    zy_select_rules: "rulesChannel",
    zy_select_ai_channel: "aiChannel"
  };

  const field = fields[id];

  if (!field) return;

  cfg[field] = value;
  await saveData();

  return interaction.update({
    content: `${E.aceito} Configuração salva com sucesso.`,
    components: []
  });
}

// ======================================================
// 17. HANDLER DOS BOTÕES DE CONFIGURAÇÃO
// ======================================================

async function handleConfigButton(interaction) {
  const cfg = getGuild(interaction.guildId);
  const id = interaction.customId;

  if (id === "zy_home") {
    return interaction.update({
      components: [homePanel(interaction.guild)]
    });
  }

  if (id === "zy_ticket_channel") {
    return askChannel(
      interaction,
      "zy_select_ticket_channel",
      "Canal do painel",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_ticket_category") {
    return askChannel(
      interaction,
      "zy_select_ticket_category",
      "Categoria dos tickets",
      [ChannelType.GuildCategory]
    );
  }

  if (id === "zy_ticket_role") {
    return askRole(
      interaction,
      "zy_select_ticket_role",
      "Cargo da equipe de tickets"
    );
  }

  if (id === "zy_ticket_publish") {
    return publishTicketPanel(interaction);
  }

  if (id === "zy_ai_channel") {
    return askChannel(
      interaction,
      "zy_select_ai_channel",
      "Canal do ChatGPT",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_ai_prompt") {
    const modal = new ModalBuilder()
      .setCustomId("zy_ai_prompt_modal")
      .setTitle("Instruções do ChatGPT");

    const input = new TextInputBuilder()
      .setCustomId("ai_prompt")
      .setLabel("Instruções para a IA")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(3000)
      .setValue(cfg.aiSystemPrompt.slice(0, 3000));

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );

    return interaction.showModal(modal);
  }

  if (id === "zy_ai_chat") {
    if (!openai && !cfg.aiChatEnabled) {
      return replyV2(
        interaction,
        `${E.alerta} API não configurada`,
        "Adicione OPENAI_API_KEY nas Secrets antes de ativar o ChatGPT."
      );
    }

    cfg.aiChatEnabled = !cfg.aiChatEnabled;
  }

  if (id === "zy_ai_ticket") {
    if (!openai && !cfg.aiTicketEnabled) {
      return replyV2(
        interaction,
        `${E.alerta} API não configurada`,
        "Adicione OPENAI_API_KEY nas Secrets antes de ativar o ChatGPT."
      );
    }

    cfg.aiTicketEnabled = !cfg.aiTicketEnabled;
  }

  if (id === "zy_security") cfg.securityEnabled = !cfg.securityEnabled;
  if (id === "zy_antispam") cfg.antiSpam = !cfg.antiSpam;
  if (id === "zy_antilinks") cfg.antiLinks = !cfg.antiLinks;

  if (id === "zy_honeypot_channel") {
    return askChannel(
      interaction,
      "zy_select_honeypot",
      "Canal Honeypot",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_honeypot_action") {
    const actions = ["timeout", "kick", "ban"];
    const current = actions.indexOf(cfg.honeypotAction);
    cfg.honeypotAction = actions[(current + 1) % actions.length];
  }

  if (id === "zy_moderation_role") {
    return askRole(
      interaction,
      "zy_select_moderation_role",
      "Cargo de moderação"
    );
  }

  if (id === "zy_config_role") {
    return askRole(
      interaction,
      "zy_select_config_role",
      "Cargo autorizado a configurar o bot"
    );
  }

  if (id === "zy_welcome_channel") {
    return askChannel(
      interaction,
      "zy_select_welcome",
      "Canal de boas-vindas",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_leave_channel") {
    return askChannel(
      interaction,
      "zy_select_leave",
      "Canal de saída",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_log_channel") {
    return askChannel(
      interaction,
      "zy_select_logs",
      "Canal de logs",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_welcome_toggle") cfg.welcomeEnabled = !cfg.welcomeEnabled;
  if (id === "zy_leave_toggle") cfg.leaveEnabled = !cfg.leaveEnabled;

  if (id === "zy_rules_channel") {
    return askChannel(
      interaction,
      "zy_select_rules",
      "Canal das regras",
      [ChannelType.GuildText]
    );
  }

  if (id === "zy_rules_edit") {
    return openRulesEditor(interaction);
  }

  if (id === "zy_rules_publish") {
    return publishRules(interaction);
  }

  await saveData();

  const section =
    id.includes("ticket") ? "tickets" :
    id.includes("ai") ? "ai" :
    id.includes("security") || id.includes("anti") ? "security" :
    id.includes("honeypot") ? "honeypot" :
    id.includes("welcome") || id.includes("leave") ? "welcome" :
    id.includes("log") ? "logs" :
    id.includes("moderation") || id.includes("config_role") ? "moderation" :
    "rules";

  return interaction.update({
    components: [sectionPanel(section, interaction.guild)]
  });
}
// ======================================================
// 18. INTERAÇÕES DO DISCORD
// ======================================================

client.on("interactionCreate", async interaction => {
  try {
    // Comando /config
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "config") {
        if (!canConfigure(interaction.member)) {
          return replyV2(
            interaction,
            `${E.proibido} Acesso negado`,
            "Você não tem permissão para configurar o ZYPhor Bot."
          );
        }

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [homePanel(interaction.guild)]
        });
      }
    }

    // Editor de regras
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "zy_rules_modal"
    ) {
      if (!canConfigure(interaction.member)) {
        return replyV2(
          interaction,
          `${E.proibido} Acesso negado`,
          "Você não tem permissão para editar as regras."
        );
      }

      const cfg = getGuild(interaction.guildId);

      cfg.rulesText = interaction.fields.getTextInputValue("rules_text");

      await saveData();

      return replyV2(
        interaction,
        `${E.aceito} Regras salvas`,
        "O texto foi salvo. Agora você pode publicar as regras no canal escolhido."
      );
    }

    // Instruções do ChatGPT
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "zy_ai_prompt_modal"
    ) {
      if (!canConfigure(interaction.member)) {
        return replyV2(
          interaction,
          `${E.proibido} Acesso negado`,
          "Você não tem permissão para alterar as instruções da IA."
        );
      }

      const cfg = getGuild(interaction.guildId);

      cfg.aiSystemPrompt =
        interaction.fields.getTextInputValue("ai_prompt");

      await saveData();

      return replyV2(
        interaction,
        `${E.aceito} IA atualizada`,
        "As novas instruções do ChatGPT foram salvas."
      );
    }

    // Seletores
    if (
      interaction.isStringSelectMenu() ||
      interaction.isChannelSelectMenu() ||
      interaction.isRoleSelectMenu()
    ) {
      if (!canConfigure(interaction.member)) {
        return interaction.reply({
          content: `${E.proibido} Você não pode alterar essa configuração.`,
          ephemeral: true
        });
      }

      return handleSelect(interaction);
    }

    if (!interaction.isButton()) return;

    const id = interaction.customId;

    // Avaliação de atendimento
    if (id.startsWith("zy_rate_")) {
      return saveFeedback(interaction);
    }

    // Abrir ticket
    if (id === "zy_open_ticket") {
      return createTicket(interaction);
    }

    // Atender ticket
    if (id === "zy_claim_ticket") {
      const ticket = data.tickets[interaction.channelId];

      if (!ticket || ticket.status !== "open") {
        return replyV2(
          interaction,
          `${E.alerta} Ticket inválido`,
          "Este ticket não está aberto."
        );
      }

      if (!isStaff(interaction.member)) {
        return replyV2(
          interaction,
          `${E.proibido} Sem permissão`,
          "Somente a equipe pode assumir o atendimento."
        );
      }

      if (ticket.claimedBy) {
        return replyV2(
          interaction,
          `${E.alerta} Atendimento ocupado`,
          `Este ticket já está sendo atendido por <@${ticket.claimedBy}>.`
        );
      }

      ticket.claimedBy = interaction.user.id;
      await saveData();

      await interaction.reply(
        v2Options(
          `${E.aceito} Atendimento assumido`,
          `<@${interaction.user.id}> agora é responsável por este ticket.`
        )
      );

      return sendLog(
        interaction.guild,
        "Ticket assumido",
        `Canal: ${interaction.channel}\nResponsável: <@${interaction.user.id}>`
      );
    }

    // Fechar ticket
    if (id === "zy_close_ticket") {
      return closeTicket(interaction);
    }

    // Configurações
    if (id.startsWith("zy_")) {
      if (!interaction.guild || !canConfigure(interaction.member)) {
        return replyV2(
          interaction,
          `${E.proibido} Acesso negado`,
          "Você não tem permissão para alterar essa configuração."
        );
      }

      return handleConfigButton(interaction);
    }
  } catch (error) {
    console.error("Erro em interactionCreate:", error);

    const message = {
      content: `${E.alerta} Não foi possível concluir essa ação. Confira as permissões e tente novamente.`,
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(message).catch(() => null);
    } else {
      await interaction.reply(message).catch(() => null);
    }
  }
});

// ======================================================
// 19. MENSAGENS, CHATGPT E SEGURANÇA
// ======================================================

const spamTracker = new Map();

client.on("messageCreate", async message => {
  try {
    if (!message.guild || message.author.bot) return;

    const cfg = getGuild(message.guild.id);

    // Consulta de feedbacks
    if (message.content.trim().toLowerCase() === `${PREFIX}feedbacks`) {
      return showFeedbacks(message);
    }

    // Honeypot
    if (
      cfg.honeypotChannel &&
      message.channel.id === cfg.honeypotChannel
    ) {
      await message.delete().catch(() => null);

      const member = await message.guild.members
        .fetch(message.author.id)
        .catch(() => null);

      if (!member || !member.moderatable) return;

      const reason = "Mensagem enviada no canal Honeypot.";

      if (cfg.honeypotAction === "timeout") {
        await member.timeout(
          cfg.honeypotDuration || 604800000,
          reason
        ).catch(() => null);
      }

      if (cfg.honeypotAction === "kick") {
        await member.kick(reason).catch(() => null);
      }

      if (cfg.honeypotAction === "ban") {
        await member.ban({ reason }).catch(() => null);
      }

      await sendLog(
        message.guild,
        "Honeypot acionado",
        `Usuário: <@${message.author.id}>\nAção: ${cfg.honeypotAction}`
      );

      return;
    }

    // ChatGPT no canal configurado ou em tickets
    const ticket = data.tickets[message.channel.id];

    const aiInTicket =
      cfg.aiTicketEnabled &&
      ticket &&
      ticket.status === "open";

    const aiInChannel =
      cfg.aiChatEnabled &&
      cfg.aiChannel === message.channel.id;

    if ((aiInTicket || aiInChannel) && openai) {
      try {
        await message.channel.sendTyping();

        const answer = await askChatGPT(
          message.guild.id,
          message.channel.id,
          message.author.username,
          message.content
        );

        await message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            v2(
              `🤖 ChatGPT • ZYPhor`,
              answer
            )
          ],
          allowedMentions: {
            repliedUser: false,
            parse: []
          }
        });
      } catch (error) {
        console.error("Erro na IA:", error);

        await sendV2(
          message.channel,
          `${E.alerta} ChatGPT indisponível`,
          "Não consegui gerar uma resposta. Confira a chave da API e tente novamente."
        );
      }
    }

    // Proteção geral
    if (!cfg.securityEnabled) return;

    // Anti-spam: 6 mensagens em 5 segundos
    if (cfg.antiSpam) {
      const now = Date.now();
      const key = `${message.guild.id}:${message.author.id}`;

      const previous = spamTracker.get(key) || [];
      const recent = previous.filter(time => now - time < 5000);

      recent.push(now);
      spamTracker.set(key, recent);

      if (recent.length >= 6) {
        await message.delete().catch(() => null);

        const member = await message.guild.members
          .fetch(message.author.id)
          .catch(() => null);

        if (member?.moderatable) {
          await member.timeout(
            60000,
            "Anti-spam: excesso de mensagens em pouco tempo."
          ).catch(() => null);
        }

        await sendLog(
          message.guild,
          "Anti-spam acionado",
          `Usuário: <@${message.author.id}>\nMensagens detectadas: ${recent.length}`
        );

        spamTracker.delete(key);
        return;
      }
    }

    // Anti-links
    if (
      cfg.antiLinks &&
      /(https?:\/\/|www\.)/i.test(message.content) &&
      !isStaff(message.member) &&
      !message.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      await message.delete().catch(() => null);

      await sendLog(
        message.guild,
        "Link removido",
        `Usuário: <@${message.author.id}>\nCanal: <#${message.channel.id}>`
      );
    }
  } catch (error) {
    console.error("Erro em messageCreate:", error);
  }
});

// ======================================================
// 20. BOAS-VINDAS
// ======================================================

client.on("guildMemberAdd", async member => {
  try {
    const cfg = getGuild(member.guild.id);

    if (cfg.welcomeEnabled && cfg.welcomeChannel) {
      const channel = await member.guild.channels
        .fetch(cfg.welcomeChannel)
        .catch(() => null);

      if (channel?.isTextBased()) {
        await sendV2(
          channel,
          `${E.online} Boas-vindas!`,
          `Olá, ${member}!\n\nSeja bem-vindo(a) ao **${member.guild.name}**.\nEsperamos que aproveite sua estadia!\n\n${E.servidor} Você é o membro número **${member.guild.memberCount}**.`
        );
      }
    }

    await sendLog(
      member.guild,
      "Novo membro",
      `${member.user.tag} entrou no servidor.`
    );
  } catch (error) {
    console.error("Erro em guildMemberAdd:", error);
  }
});

// ======================================================
// 21. SAÍDA DE MEMBROS
// ======================================================

client.on("guildMemberRemove", async member => {
  try {
    const cfg = getGuild(member.guild.id);

    if (cfg.leaveEnabled && cfg.leaveChannel) {
      const channel = await member.guild.channels
        .fetch(cfg.leaveChannel)
        .catch(() => null);

      if (channel?.isTextBased()) {
        await sendV2(
          channel,
          `${E.pendente} Membro saiu`,
          `**${member.user.tag}** saiu do servidor.`
        );
      }
    }

    await sendLog(
      member.guild,
      "Membro saiu",
      `${member.user.tag} saiu do servidor.`
    );
  } catch (error) {
    console.error("Erro em guildMemberRemove:", error);
  }
});

// ======================================================
// 22. REGISTRO DE AUDITORIA
// ======================================================

client.on("guildAuditLogEntryCreate", async (entry, guild) => {
  try {
    const actionNames = {
      22: "Banimento",
      20: "Expulsão",
      24: "Timeout"
    };

    const name = actionNames[entry.action];
    if (!name) return;

    await sendLog(
      guild,
      `Moderação: ${name}`,
      `Responsável: ${entry.executor ? `<@${entry.executor.id}>` : "Desconhecido"}\nAlvo: ${entry.target ? String(entry.target) : "Não identificado"}\nMotivo: ${entry.reason || "Não informado"}`
    );
  } catch (error) {
    console.error("Erro no registro de auditoria:", error);
  }
});

// ======================================================
// 23. INICIALIZAÇÃO
// ======================================================

loadData();

client.once("ready", async () => {
  console.log("------------------------------------");
  console.log(`ZYPhor Bot online: ${client.user.tag}`);
  console.log(`ChatGPT: ${openai ? "API configurada" : "API não configurada"}`);
  console.log("------------------------------------");

  client.user.setPresence({
    activities: [
      {
        name: "ZYPhor • /config",
        type: 3
      }
    ],
    status: "online"
  });

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
      Routes.applicationCommands(client.user.id),
      {
        body: [configCommand.toJSON()]
      }
    );

    console.log("Comando /config registrado.");
  } catch (error) {
    console.error("Erro ao registrar comando:", error);
  }
});

// ======================================================
// 24. TRATAMENTO DE ERROS
// ======================================================

process.on("unhandledRejection", error => {
  console.error("Promise rejeitada:", error);
});

process.on("uncaughtException", error => {
  console.error("Erro não tratado:", error);
});

// ======================================================
// 25. LOGIN
// ======================================================

client.login(TOKEN);
