
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
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
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require("discord.js");

const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.DISCORD_TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OWNER_ID = "1533306874513068093";
const PREFIX = "z!";

if (!TOKEN) {
  console.error("ERRO: DISCORD_TOKEN não foi configurado.");
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
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const openai = OPENAI_KEY
  ? new OpenAI({ apiKey: OPENAI_KEY })
  : null;

const DATA_FILE = path.join(__dirname, "data.json");

let data = {
  version: 3,
  guilds: {},
  tickets: {},
  feedbacks: {},
  warnings: {},
  products: {},
  purchases: {},
  aiHistory: {},
  publications: {},
  termsAcceptances: {},
  moderationLogs: {}
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      data = { ...data, ...saved };
    }
  } catch (error) {
    console.error("Erro lendo data.json:", error);
  }
}

function saveData() {
  try {
    const temp = DATA_FILE + ".tmp";
    fs.writeFileSync(temp, JSON.stringify(data, null, 2));
    fs.renameSync(temp, DATA_FILE);
  } catch (error) {
    console.error("Erro salvando data.json:", error);
  }
}

loadData();

const EMOJI = {
  rules: "<:Eclipse_rules:1552508768259014656>",
  ticket: "<:ticket_fallens:1552761934733119709>",
  support: "<:suporte_emoji:1552508765176074270>",
  cart: "<:Carrinho:1552009619046531154>",
  config: "<:config:1552010601688080457>",
  document: "<:documento:1552009636251566130>",
  alert: "<:alerta:1552010624513482823>",
  warning: "<:notificacao_warn:1550347085444943892>",
  shield: "<:escudo:1552508771228450856>",
  lock: "<:fechadura:1552508769752317994>",
  yes: "<:positivo:1550347075089211432>",
  no: "<:negativo:1550347078893441114>",
  add: "<:mais:1550347104336220180>",
  delete: "<:lixo:1552009637170253894>",
  image: "<:texto:1550347093586223184>",
  online: "<a:Online:1552007801017204736>",
  like: "<:like:1552007813709172766>",
  dislike: "<:disslike:1552007819757092924>",
  play: "<:play:1552762285502627930>",
  eye: "<:vigiando:1552007809321926656>",
  clock: "<:horrio:1550347082634760202>"
};

function getGuild(guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      ticket: {
        categories: [
          {
            id: "suporte",
            name: "Suporte",
            description: "Preciso de ajuda",
            emoji: EMOJI.support
          },
          {
            id: "compra",
            name: "Compras",
            description: "Comprar um produto",
            emoji: EMOJI.cart
          }
        ],
        supportRoleId: null,
        panelChannelId: null,
        panelImage: null,
        panelMessageId: null
      },
      ai: {
        enabled: false,
        channelId: null,
        model: "gpt-4o-mini",
        system: "Você é o assistente oficial do servidor. Responda em português, com educação e clareza."
      },
      security: {
        honeypotChannelId: null,
        honeypotAction: "timeout",
        honeypotDuration: 7 * 24 * 60 * 60 * 1000,
        antiSpam: true,
        antiLinks: false
      },
      moderationRoleId: null,
      logChannelId: null,
      welcomeChannelId: null,
      leaveChannelId: null
    };
    saveData();
  }
  return data.guilds[guildId];
}

function isOwnerOrAdmin(interaction) {
  return (
    interaction.user.id === OWNER_ID ||
    interaction.guild?.ownerId === interaction.user.id ||
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
  );
}

function isStaff(member, config) {
  if (!member) return false;
  if (member.id === OWNER_ID) return true;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (config.ticket.supportRoleId &&
      member.roles?.cache?.has(config.ticket.supportRoleId)) return true;
  if (config.moderationRoleId &&
      member.roles?.cache?.has(config.moderationRoleId)) return true;
  return false;
}

function container(text, imageUrl = null, components = []) {
  const box = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(text)
    );

  if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
    box.addSeparatorComponents(new SeparatorBuilder());
    box.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(imageUrl)
      )
    );
  }

  if (components.length) {
    box.addSeparatorComponents(new SeparatorBuilder());
    for (const row of components) box.addActionRowComponents(row);
  }

  return box;
}

async function replyV2(interaction, text, options = {}) {
  const payload = {
    components: [container(text, options.image, options.rows || [])],
    flags: MessageFlags.IsComponentsV2 |
      (options.ephemeral === false ? 0 : MessageFlags.Ephemeral),
    allowedMentions: options.allowedMentions || { parse: [] }
  };

  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload);
  }
  return interaction.reply(payload);
}

async function sendV2(channel, text, options = {}) {
  return channel.send({
    components: [container(text, options.image, options.rows || [])],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: options.allowedMentions || { parse: [] }
  });
}

function button(id, label, style = ButtonStyle.Secondary, emoji) {
  const b = new ButtonBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setStyle(style);
  if (emoji) b.setEmoji(emoji);
  return b;
}

function row(...components) {
  return new ActionRowBuilder().addComponents(...components);
}

function modalText(id, label, style = TextInputStyle.Short, required = false, value = "") {
  return new TextInputBuilder()
    .setCustomId(id)
    .setLabel(label.slice(0, 45))
    .setStyle(style)
    .setRequired(required)
    .setValue(value.slice(0, style === TextInputStyle.Paragraph ? 4000 : 100));
}

function getPublication(guildId, type) {
  if (!data.publications[guildId]) data.publications[guildId] = {};
  if (!data.publications[guildId][type]) {
    data.publications[guildId][type] = {
      title: "",
      content: "",
      image: "",
      mention: "",
      channelId: null,
      messageId: null,
      version: 1
    };
  }
  return data.publications[guildId][type];
}

function mentionSettings(text) {
  const value = String(text || "");
  const parse = [];
  if (/@everyone|@here/.test(value)) parse.push("everyone");
  if (/<@&\d+>/.test(value)) parse.push("roles");
  if (/<@!?\d+>/.test(value)) parse.push("users");
  return {
    parse,
    repliedUser: false
  };
}

function cleanMention(text) {
  return String(text || "").slice(0, 200);
}

function makePublicationText(pub, type) {
  const names = {
    rules: `${EMOJI.rules} REGRAS DO SERVIDOR`,
    terms: `${EMOJI.document} TERMOS DE USO`,
    announcements: `${EMOJI.warning} AVISO`
  };

  return [
    `# ${pub.title || names[type]}`,
    pub.content || "Nenhum conteúdo foi configurado.",
    pub.mention || ""
  ].filter(Boolean).join("\n\n");
}

function publicationButtons(type) {
  return row(
    button(`pub:edit:${type}`, "Editar conteúdo", ButtonStyle.Primary),
    button(`pub:channel:${type}`, "Selecionar canal"),
    button(`pub:image:${type}`, "Imagem")
  );
}

function publicationActionButtons(type) {
  return row(
    button(`pub:publish:${type}`, "Publicar / Atualizar", ButtonStyle.Success),
    button(`pub:preview:${type}`, "Pré-visualizar")
  );
}

async function openPublicationEditor(interaction, type) {
  const pub = getPublication(interaction.guildId, type);
  const title = type === "rules" ? "Editar regras" :
    type === "terms" ? "Editar termos" : "Editar aviso";

  const modal = new ModalBuilder()
    .setCustomId(`pubmodal:${type}`)
    .setTitle(title);

  modal.addComponents(
    row(modalText("title", "Título", TextInputStyle.Short, true, pub.title)),
    row(modalText("content", "Texto da publicação", TextInputStyle.Paragraph, true, pub.content)),
    row(modalText("mention", "Menção: @here, @everyone ou vazio", TextInputStyle.Short, false, pub.mention))
  );

  await interaction.showModal(modal);
}

async function showPublicationConfig(interaction, type) {
  const pub = getPublication(interaction.guildId, type);
  const label = type === "rules" ? "Regras" :
    type === "terms" ? "Termos de Uso" : "Avisos";

  await replyV2(interaction,
    `## ${EMOJI.document} Editor de ${label}\n` +
    `**Título:** ${pub.title || "Não definido"}\n` +
    `**Canal:** ${pub.channelId ? `<#${pub.channelId}>` : "Não selecionado"}\n` +
    `**Imagem:** ${pub.image ? "Configurada" : "Nenhuma"}\n` +
    `**Menção:** ${pub.mention || "Nenhuma"}\n\n` +
    "Edite o conteúdo, escolha o canal e publique. O bot atualizará a mensagem anterior quando possível.",
    { rows: [publicationButtons(type), publicationActionButtons(type)] }
  );
}

async function publishPublication(interaction, type) {
  const pub = getPublication(interaction.guildId, type);

  if (!pub.channelId) {
    return replyV2(interaction, "Selecione o canal antes de publicar.");
  }

  const channel = await interaction.guild.channels.fetch(pub.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    return replyV2(interaction, "Não encontrei um canal de texto válido.");
  }

  const text = makePublicationText(pub, type);
  const options = {
    components: [container(text, pub.image)],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: mentionSettings(pub.mention)
  };

  if (type === "terms") {
    const acceptRow = row(
      button("terms:accept", "Li e aceito os termos", ButtonStyle.Success)
    );
    options.components = [container(text, pub.image, [acceptRow])];
  }

  let message = null;
  if (pub.messageId) {
    message = await channel.messages.fetch(pub.messageId).catch(() => null);
  }

  if (message) {
    await message.edit(options);
  } else {
    message = await channel.send(options);
    pub.messageId = message.id;
  }

  saveData();
  await replyV2(interaction, `${EMOJI.yes} ${type === "announcements" ? "Aviso" : type === "terms" ? "Termos" : "Regras"} publicado/atualizado em <#${channel.id}>.`);
}

function configPanel() {
  return container(
    `# ${EMOJI.config} ZYPhor Bot — Configurações\n` +
    "Selecione uma área para configurar. Todas as alterações são salvas no data.json.",
    null,
    [
      row(
        button("cfg:tickets", "Tickets", ButtonStyle.Primary, "🎫"),
        button("cfg:rules", "Regras", ButtonStyle.Secondary),
        button("cfg:terms", "Termos", ButtonStyle.Secondary)
      ),
      row(
        button("cfg:announcements", "Avisos", ButtonStyle.Secondary),
        button("cfg:ai", "Inteligência Artificial", ButtonStyle.Secondary),
        button("cfg:security", "Segurança", ButtonStyle.Secondary)
      ),
      row(
        button("cfg:roles", "Cargos", ButtonStyle.Secondary),
        button("cfg:logs", "Logs", ButtonStyle.Secondary),
        button("cfg:welcome", "Boas-vindas", ButtonStyle.Secondary)
      )
    ]
  );
}

async function showTicketConfig(interaction) {
  const cfg = getGuild(interaction.guildId).ticket;
  const categories = cfg.categories.map((c, i) =>
    `${i + 1}. ${c.emoji || "🎫"} **${c.name}** — ${c.description}`
  ).join("\n") || "Nenhuma categoria.";

  await replyV2(interaction,
    `## ${EMOJI.ticket} Configuração de tickets\n` +
    `**Cargo de suporte:** ${cfg.supportRoleId ? `<@&${cfg.supportRoleId}>` : "Não definido"}\n` +
    `**Canal do painel:** ${cfg.panelChannelId ? `<#${cfg.panelChannelId}>` : "Não definido"}\n` +
    `**Imagem do painel:** ${cfg.panelImage || "Nenhuma"}\n\n` +
    `**Categorias:**\n${categories}\n\n` +
    "Edite as categorias usando uma opção por linha no formato: `id|emoji|nome|descrição`.",
    {
      rows: [
        row(
          button("ticket:editcategories", "Editar opções", ButtonStyle.Primary),
          button("ticket:image", "Imagem do painel")
        ),
        row(
          button("ticket:channel", "Canal do painel"),
          button("ticket:role", "Cargo de suporte")
        ),
        row(button("ticket:publish", "Publicar painel", ButtonStyle.Success))
      ]
    }
  );
}

async function editCategories(interaction) {
  const cfg = getGuild(interaction.guildId).ticket;
  const current = cfg.categories.map(c =>
    `${c.id}|${c.emoji}|${c.name}|${c.description}`
  ).join("\n");

  const modal = new ModalBuilder()
    .setCustomId("ticket:categoriesmodal")
    .setTitle("Editar categorias de tickets");

  modal.addComponents(
    row(modalText("categories", "Uma opção por linha (máx. 25)", TextInputStyle.Paragraph, true, current))
  );
  await interaction.showModal(modal);
}

async function publishTicketPanel(interaction) {
  const cfg = getGuild(interaction.guildId).ticket;

  if (!cfg.panelChannelId) return replyV2(interaction, "Selecione o canal do painel primeiro.");
  if (!cfg.categories.length) return replyV2(interaction, "Cadastre pelo menos uma categoria.");

  const channel = await interaction.guild.channels.fetch(cfg.panelChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return replyV2(interaction, "Canal inválido.");

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket:create")
    .setPlaceholder("Selecione o motivo do atendimento")
    .addOptions(cfg.categories.slice(0, 25).map(c => ({
      label: c.name.slice(0, 100),
      description: c.description.slice(0, 100),
      value: c.id,
      emoji: c.emoji || "🎫"
    })));

  const panel = container(
    `# ${EMOJI.ticket} Central de Atendimento\n` +
    "Selecione abaixo o assunto do seu ticket. Nossa equipe irá atender assim que possível.",
    cfg.panelImage,
    [row(menu)]
  );

  const msg = await channel.send({
    components: [panel],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] }
  });

  cfg.panelMessageId = msg.id;
  saveData();
  await replyV2(interaction, `${EMOJI.yes} Painel de tickets publicado em <#${channel.id}>.`);
}

async function createTicket(interaction, categoryId) {
  const cfg = getGuild(interaction.guildId);
  const open = Object.values(data.tickets).find(t =>
    t.guildId === interaction.guildId &&
    t.userId === interaction.user.id &&
    !t.closed
  );

  if (open) {
    return replyV2(interaction, `Você já possui um ticket aberto: <#${open.channelId}>.`);
  }

  const category = cfg.ticket.categories.find(c => c.id === categoryId);
  if (!category) return replyV2(interaction, "Essa categoria não existe mais.");

  const permissionOverwrites = [
    {
      id: interaction.guild.roles.everyone.id,
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

  if (cfg.ticket.supportRoleId) {
    permissionOverwrites.push({
      id: cfg.ticket.supportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages
      ]
    });
  }

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 90),
    type: ChannelType.GuildText,
    permissionOverwrites,
    reason: `Ticket de ${interaction.user.tag}`
  });

  data.tickets[channel.id] = {
    guildId: interaction.guildId,
    channelId: channel.id,
    userId: interaction.user.id,
    category: category.name,
    createdAt: Date.now(),
    claimedBy: null,
    closed: false,
    transcript: []
  };
  saveData();

  const controls = row(
    button(`ticket:claim:${channel.id}`, "Atender", ButtonStyle.Success),
    button(`ticket:add:${channel.id}`, "Adicionar membro", ButtonStyle.Secondary),
    button(`ticket:close:${channel.id}`, "Fechar ticket", ButtonStyle.Danger)
  );

  await sendV2(channel,
    `# ${EMOJI.ticket} Atendimento aberto\n` +
    `**Criado por:** <@${interaction.user.id}>\n` +
    `**Categoria:** ${category.emoji || "🎫"} ${category.name}\n` +
    `**Status:** Aguardando equipe\n\n` +
    "Somente a equipe autorizada pode atender, adicionar membros ou fechar este ticket.",
    {
      rows: [controls],
      allowedMentions: { parse: [], users: [interaction.user.id] }
    }
  );

  await replyV2(interaction, `${EMOJI.yes} Seu ticket foi criado: <#${channel.id}>.`);
}

async function closeTicket(interaction, channelId) {
  const ticket = data.tickets[channelId];
  if (!ticket || ticket.closed) return replyV2(interaction, "Este ticket já foi fechado.");

  const cfg = getGuild(ticket.guildId);
  if (!isStaff(interaction.member, cfg)) {
    return replyV2(interaction, `${EMOJI.no} Somente a equipe autorizada pode fechar tickets.`);
  }

  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
  if (!channel) return replyV2(interaction, "Canal do ticket não encontrado.");

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
  if (messages) {
    ticket.transcript = messages
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .map(m => ({
        author: m.author?.tag || "Desconhecido",
        userId: m.author?.id || null,
        content: m.content || "",
        createdAt: m.createdAt?.toISOString() || null,
        attachments: [...m.attachments.values()].map(a => a.url)
      }));
  }

  ticket.closed = true;
  ticket.closedAt = Date.now();
  ticket.closedBy = interaction.user.id;
  saveData();

  await interaction.editReply({
    content: `${EMOJI.yes} Ticket registrado e será excluído.`,
    allowedMentions: { parse: [] }
  });

  const user = await client.users.fetch(ticket.userId).catch(() => null);
  if (user) {
    const feedbackRow = row(
      button(`feedback:1:${channelId}`, "1 ⭐", ButtonStyle.Secondary),
      button(`feedback:2:${channelId}`, "2 ⭐", ButtonStyle.Secondary),
      button(`feedback:3:${channelId}`, "3 ⭐", ButtonStyle.Secondary),
      button(`feedback:4:${channelId}`, "4 ⭐", ButtonStyle.Secondary),
      button(`feedback:5:${channelId}`, "5 ⭐", ButtonStyle.Success)
    );
    await sendV2(user,
      "Seu atendimento foi encerrado. Como foi sua experiência? Avalie de 1 a 5 estrelas.",
      { rows: [feedbackRow] }
    ).catch(() => null);
  }

  setTimeout(() => channel.delete("Ticket encerrado e transcrição registrada").catch(() => null), 3000);
}

async function showAIConfig(interaction) {
  const ai = getGuild(interaction.guildId).ai;
  await replyV2(interaction,
    `## Inteligência Artificial\n` +
    `**Status:** ${ai.enabled ? "Ativada" : "Desativada"}\n` +
    `**Canal:** ${ai.channelId ? `<#${ai.channelId}>` : "Responderá quando mencionarem o bot"}\n` +
    `**Modelo:** ${ai.model}\n\n` +
    `**API:** ${openai ? "Chave encontrada no ambiente" : "OPENAI_API_KEY não configurada"}\n\n` +
    "A chave é lida diretamente das variáveis da hospedagem.",
    {
      rows: [
        row(
          button("ai:toggle", ai.enabled ? "Desativar IA" : "Ativar IA", ButtonStyle.Success),
          button("ai:channel", "Selecionar canal")
        ),
        row(button("ai:model", "Configurar modelo"))
      ]
    }
  );
}

async function askAI(message) {
  if (!openai) throw new Error("OPENAI_API_KEY ausente na hospedagem.");

  const cfg = getGuild(message.guildId).ai;
  const key = `${message.guildId}:${message.author.id}`;

  if (!data.aiHistory[key]) data.aiHistory[key] = [];
  const history = data.aiHistory[key].slice(-12);

  const completion = await openai.chat.completions.create({
    model: cfg.model || "gpt-4o-mini",
    messages: [
      { role: "system", content: cfg.system },
      ...history,
      { role: "user", content: message.content.slice(0, 4000) }
    ],
    max_tokens: 700
  });

  const answer = completion.choices?.[0]?.message?.content;
  if (!answer) throw new Error("A OpenAI retornou uma resposta vazia.");

  history.push({ role: "user", content: message.content.slice(0, 4000) });
  history.push({ role: "assistant", content: answer });
  data.aiHistory[key] = history.slice(-20);
  saveData();

  return answer.slice(0, 1900);
}

function aiErrorMessage(error) {
  const status = error.status || error.statusCode || "sem código";
  const code = error.code || error.error?.code || "";
  const message = error.message || "Erro desconhecido";

  console.error("[OPENAI ERRO]", {
    status,
    code,
    message,
    type: error.type || error.error?.type
  });

  if (status === 401) return "A OpenAI recusou a chave (401). Confira a API Key cadastrada na Fadehost.";
  if (status === 429 || code === "insufficient_quota") return "A conta da API está sem cota disponível ou atingiu o limite de uso (429). Verifique o faturamento e os limites da OpenAI.";
  if (status === 404) return "O modelo configurado não foi encontrado ou não está disponível para esta conta (404).";
  if (status === 403) return "A conta não tem permissão para usar esse recurso (403).";
  return `Não consegui gerar uma resposta. Erro ${status}: ${message.slice(0, 300)}`;
}

async function handleModal(interaction) {
  const id = interaction.customId;

  if (id.startsWith("pubmodal:")) {
    const type = id.split(":")[1];
    const pub = getPublication(interaction.guildId, type);
    pub.title = interaction.fields.getTextInputValue("title");
    pub.content = interaction.fields.getTextInputValue("content");
    pub.mention = cleanMention(interaction.fields.getTextInputValue("mention"));
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Conteúdo salvo. Agora selecione o canal e publique.`);
  }

  if (id === "ticket:categoriesmodal") {
    const raw = interaction.fields.getTextInputValue("categories");
    const lines = raw.split("\n").map(x => x.trim()).filter(Boolean);

    if (lines.length > 25) return replyV2(interaction, "O Discord permite no máximo 25 opções por menu.");

    const categories = [];
    for (const line of lines) {
      const parts = line.split("|");
      if (parts.length < 4) continue;
      const [key, emoji, name, ...description] = parts;
      categories.push({
        id: key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 50),
        emoji: emoji.trim() || "🎫",
        name: name.trim().slice(0, 100),
        description: description.join("|").trim().slice(0, 100)
      });
    }

    if (!categories.length) return replyV2(interaction, "Nenhuma categoria válida foi informada.");

    getGuild(interaction.guildId).ticket.categories = categories;
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Categorias atualizadas.`);
  }

  if (id === "ticket:imagemodal") {
    getGuild(interaction.guildId).ticket.panelImage =
      interaction.fields.getTextInputValue("image").trim() || null;
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Imagem do painel de tickets salva.`);
  }

  if (id === "ai:modelmodal") {
    const model = interaction.fields.getTextInputValue("model").trim();
    getGuild(interaction.guildId).ai.model = model;
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Modelo atualizado para \`${model}\`.`);
  }
}

async function handleSelect(interaction) {
  const id = interaction.customId;

  if (id === "ticket:create") {
    return createTicket(interaction, interaction.values[0]);
  }

  if (id === "ticket:selectchannel") {
    getGuild(interaction.guildId).ticket.panelChannelId = interaction.values[0];
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Canal do painel selecionado.`);
  }

  if (id === "ticket:selectrole") {
    getGuild(interaction.guildId).ticket.supportRoleId = interaction.values[0];
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Cargo de suporte configurado.`);
  }

  if (id.startsWith("pub:selectchannel:")) {
    const type = id.split(":")[2];
    getPublication(interaction.guildId, type).channelId = interaction.values[0];
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Canal selecionado.`);
  }

  if (id === "ai:selectchannel") {
    getGuild(interaction.guildId).ai.channelId = interaction.values[0];
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Canal da IA configurado.`);
  }

  if (id === "roles:moderation") {
    getGuild(interaction.guildId).moderationRoleId = interaction.values[0];
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Cargo de moderação configurado.`);
  }

  if (id === "roles:logs") {
    getGuild(interaction.guildId).logChannelId = interaction.values[0];
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Canal de logs configurado.`);
  }

  if (id === "ticket:adduser") {
    const channelId = interaction.message.interactionMetadata?.customId?.split(":")[2];
    const ticket = data.tickets[channelId];
    if (!ticket) return replyV2(interaction, "Ticket não encontrado.");
    const cfg = getGuild(ticket.guildId);
    if (!isStaff(interaction.member, cfg)) return replyV2(interaction, "Somente a equipe pode adicionar membros.");

    const memberId = interaction.values[0];
    const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
    if (!channel) return replyV2(interaction, "Canal não encontrado.");

    await channel.permissionOverwrites.edit(memberId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
    return replyV2(interaction, `${EMOJI.yes} Membro adicionado ao ticket.`);
  }
}

async function handleButton(interaction) {
  const id = interaction.customId;

  if (id.startsWith("cfg:")) {
    if (!isOwnerOrAdmin(interaction)) return replyV2(interaction, "Somente o dono do servidor ou administrador pode configurar o bot.");

    const section = id.split(":")[1];
    if (section === "tickets") return showTicketConfig(interaction);
    if (section === "rules") return showPublicationConfig(interaction, "rules");
    if (section === "terms") return showPublicationConfig(interaction, "terms");
    if (section === "announcements") return showPublicationConfig(interaction, "announcements");
    if (section === "ai") return showAIConfig(interaction);

    if (section === "security") {
      const cfg = getGuild(interaction.guildId).security;
      return replyV2(interaction,
        `## ${EMOJI.shield} Segurança\n` +
        `**Anti-spam:** ${cfg.antiSpam ? "Ativado" : "Desativado"}\n` +
        `**Anti-links:** ${cfg.antiLinks ? "Ativado" : "Desativado"}\n` +
        `**Honeypot:** ${cfg.honeypotChannelId ? `<#${cfg.honeypotChannelId}>` : "Não configurado"}\n` +
        `**Punição padrão:** timeout de 7 dias`,
        {
          rows: [
            row(
              button("security:spam", "Alternar anti-spam"),
              button("security:links", "Alternar anti-links")
            ),
            row(button("security:honeypot", "Selecionar canal Honeypot"))
          ]
        }
      );
    }

    if (section === "roles") {
      const menu = new RoleSelectMenuBuilder()
        .setCustomId("roles:moderation")
        .setPlaceholder("Selecione o cargo de moderação")
        .setMinValues(1)
        .setMaxValues(1);
      return replyV2(interaction, "Selecione o cargo responsável pela moderação.", { rows: [row(menu)] });
    }

    if (section === "logs") {
      const menu = new ChannelSelectMenuBuilder()
        .setCustomId("roles:logs")
        .setPlaceholder("Selecione o canal de logs")
        .setChannelTypes(ChannelType.GuildText);
      return replyV2(interaction, "Selecione o canal de logs.", { rows: [row(menu)] });
    }

    if (section === "welcome") {
      const menu = new ChannelSelectMenuBuilder()
        .setCustomId("welcome:select")
        .setPlaceholder("Selecione o canal de boas-vindas")
        .setChannelTypes(ChannelType.GuildText);
      return replyV2(interaction, "Selecione o canal de boas-vindas.", { rows: [row(menu)] });
    }
  }

  if (id.startsWith("pub:")) {
    if (!isOwnerOrAdmin(interaction)) return replyV2(interaction, "Sem permissão.");

    const [, action, type] = id.split(":");
    const pub = getPublication(interaction.guildId, type);

    if (action === "edit") return openPublicationEditor(interaction, type);

    if (action === "image") {
      const modal = new ModalBuilder()
        .setCustomId(`pubimage:${type}`)
        .setTitle("Imagem da publicação");
      modal.addComponents(
        row(modalText("image", "URL da imagem (ou deixe vazio)", TextInputStyle.Short, false, pub.image || ""))
      );
      return interaction.showModal(modal);
    }

    if (action === "channel") {
      const menu = new ChannelSelectMenuBuilder()
        .setCustomId(`pub:selectchannel:${type}`)
        .setPlaceholder("Selecione o canal")
        .setChannelTypes(ChannelType.GuildText);
      return replyV2(interaction, "Escolha o canal da publicação.", { rows: [row(menu)] });
    }

    if (action === "publish") return publishPublication(interaction, type);

    if (action === "preview") {
      return replyV2(interaction, makePublicationText(pub, type), {
        image: pub.image,
        allowedMentions: mentionSettings(pub.mention)
      });
    }
  }

  if (id.startsWith("ticket:")) {
    const parts = id.split(":");
    const action = parts[1];
    const channelId = parts[2];
    const ticket = data.tickets[channelId];

    if (action === "image") {
      const modal = new ModalBuilder()
        .setCustomId("ticket:imagemodal")
        .setTitle("Imagem do painel de tickets");
      modal.addComponents(
        row(modalText("image", "URL da imagem", TextInputStyle.Short, false, getGuild(interaction.guildId).ticket.panelImage || ""))
      );
      return interaction.showModal(modal);
    }

    if (action === "editcategories") return editCategories(interaction);

    if (action === "channel") {
      const menu = new ChannelSelectMenuBuilder()
        .setCustomId("ticket:selectchannel")
        .setPlaceholder("Selecione o canal do painel")
        .setChannelTypes(ChannelType.GuildText);
      return replyV2(interaction, "Escolha o canal onde o painel será publicado.", { rows: [row(menu)] });
    }

    if (action === "role") {
      const menu = new RoleSelectMenuBuilder()
        .setCustomId("ticket:selectrole")
        .setPlaceholder("Selecione o cargo de suporte");
      return replyV2(interaction, "Escolha o cargo da equipe de suporte.", { rows: [row(menu)] });
    }

    if (action === "publish") return publishTicketPanel(interaction);

    if (!ticket || ticket.closed) return replyV2(interaction, "Ticket inexistente ou já encerrado.");

    const cfg = getGuild(ticket.guildId);
    if (action === "claim") {
      if (!isStaff(interaction.member, cfg)) return replyV2(interaction, "Somente a equipe pode atender.");
      if (ticket.claimedBy) return replyV2(interaction, `Este ticket já está sendo atendido por <@${ticket.claimedBy}>.`);
      ticket.claimedBy = interaction.user.id;
      saveData();
      return replyV2(interaction, `${EMOJI.yes} Ticket assumido por <@${interaction.user.id}>.`, {
        allowedMentions: { parse: [], users: [interaction.user.id] }
      });
    }

    if (action === "close") return closeTicket(interaction, channelId);

    if (action === "add") {
      if (!isStaff(interaction.member, cfg)) return replyV2(interaction, "Somente a equipe pode adicionar membros.");
      const menu = new UserSelectMenuBuilder()
        .setCustomId(`ticket:adduser:${channelId}`)
        .setPlaceholder("Selecione o membro")
        .setMinValues(1)
        .setMaxValues(1);
      return replyV2(interaction, "Escolha quem poderá acessar este ticket.", { rows: [row(menu)] });
    }
  }

  if (id === "ai:toggle") {
    if (!isOwnerOrAdmin(interaction)) return replyV2(interaction, "Sem permissão.");
    const ai = getGuild(interaction.guildId).ai;
    ai.enabled = !ai.enabled;
    saveData();
    return showAIConfig(interaction);
  }

  if (id === "ai:channel") {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId("ai:selectchannel")
      .setPlaceholder("Selecione o canal da IA")
      .setChannelTypes(ChannelType.GuildText);
    return replyV2(interaction, "Selecione o canal onde a IA responderá.", { rows: [row(menu)] });
  }

  if (id === "ai:model") {
    const ai = getGuild(interaction.guildId).ai;
    const modal = new ModalBuilder().setCustomId("ai:modelmodal").setTitle("Modelo OpenAI");
    modal.addComponents(row(modalText("model", "Nome do modelo", TextInputStyle.Short, true, ai.model)));
    return interaction.showModal(modal);
  }

  if (id === "security:spam" || id === "security:links") {
    const security = getGuild(interaction.guildId).security;
    if (id.endsWith("spam")) security.antiSpam = !security.antiSpam;
    else security.antiLinks = !security.antiLinks;
    saveData();
    return replyV2(interaction, "Configuração de segurança atualizada.");
  }

  if (id === "security:honeypot") {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId("security:selecthoneypot")
      .setPlaceholder("Selecione o canal Honeypot")
      .setChannelTypes(ChannelType.GuildText);
    return replyV2(interaction, "Selecione o canal Honeypot.", { rows: [row(menu)] });
  }

  if (id === "terms:accept") {
    const guildId = interaction.guildId;
    const pub = getPublication(guildId, "terms");
    if (!data.termsAcceptances[guildId]) data.termsAcceptances[guildId] = {};
    data.termsAcceptances[guildId][interaction.user.id] = {
      version: pub.version,
      acceptedAt: Date.now()
    };
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Sua aceitação dos termos foi registrada.`);
  }

  if (id.startsWith("feedback:")) {
    const [, rating, channelId] = id.split(":");
    if (!data.feedbacks[channelId]) data.feedbacks[channelId] = [];
    data.feedbacks[channelId].push({
      userId: interaction.user.id,
      rating: Number(rating),
      createdAt: Date.now()
    });
    saveData();
    return replyV2(interaction, `${EMOJI.yes} Obrigado por avaliar o atendimento!`);
  }
}
async function handleSelectExtra(interaction) {
  const id = interaction.customId;

  if (id.startsWith("ticket:adduser:")) {
    const channelId = id.split(":")[2];
    const ticket = data.tickets[channelId];

    if (!ticket || ticket.closed) {
      return replyV2(interaction, "Ticket não encontrado.");
    }

    const cfg = getGuild(ticket.guildId);

    if (!isStaff(interaction.member, cfg)) {
      return replyV2(interaction, "Somente a equipe pode adicionar membros.");
    }

    const memberId = interaction.values[0];
    const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);

    if (!channel) {
      return replyV2(interaction, "Canal não encontrado.");
    }

    await channel.permissionOverwrites.edit(memberId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });

    return replyV2(interaction, `${EMOJI.yes} <@${memberId}> recebeu acesso ao ticket.`, {
      allowedMentions: {
        parse: [],
        users: [memberId]
      }
    });
  }

  if (id === "security:selecthoneypot") {
    getGuild(interaction.guildId).security.honeypotChannelId =
      interaction.values[0];

    saveData();
    return replyV2(interaction, `${EMOJI.yes} Canal Honeypot configurado.`);
  }

  if (id === "welcome:select") {
    getGuild(interaction.guildId).welcomeChannelId =
      interaction.values[0];

    saveData();
    return replyV2(interaction, `${EMOJI.yes} Canal de boas-vindas configurado.`);
  }
}

async function handleModalExtra(interaction) {
  if (interaction.customId.startsWith("pubimage:")) {
    const type = interaction.customId.split(":")[1];
    const image = interaction.fields.getTextInputValue("image").trim();

    if (image && !/^https?:\/\/\S+$/i.test(image)) {
      return replyV2(
        interaction,
        "Coloque um link de imagem válido começando com https:// ou http://."
      );
    }

    getPublication(interaction.guildId, type).image = image || null;

    saveData();
    return replyV2(interaction, `${EMOJI.yes} Imagem salva.`);
  }
}

client.once("clientReady", async () => {
  console.log("------------------------------------");
  console.log(`ZYPhor Bot online: ${client.user.tag}`);
  console.log(`ChatGPT: ${openai ? "Chave encontrada" : "API não configurada"}`);
  console.log("------------------------------------");

  const command = new SlashCommandBuilder()
    .setName("config")
    .setDescription("Abrir o painel de configuração do ZYPhor Bot");

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [command.toJSON()] }
    );

    console.log("Comando /config registrado.");
  } catch (error) {
    console.error("Erro registrando /config:", error);
  }
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName !== "config") return;

      if (!interaction.guild) {
        return replyV2(interaction, "Use este comando dentro de um servidor.");
      }

      if (!isOwnerOrAdmin(interaction)) {
        return replyV2(interaction, `${EMOJI.no} Você não tem permissão para abrir a configuração.`);
      }

      return interaction.reply({
        components: [configPanel()],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      });
    }

    if (interaction.isButton()) {
      if (
        interaction.customId.startsWith("cfg:") ||
        interaction.customId.startsWith("pub:") ||
        interaction.customId.startsWith("ticket:edit") ||
        interaction.customId === "ticket:image" ||
        interaction.customId === "ticket:channel" ||
        interaction.customId === "ticket:role" ||
        interaction.customId === "ticket:publish" ||
        interaction.customId.startsWith("ai:") ||
        interaction.customId.startsWith("security:") ||
        interaction.customId.startsWith("roles:") ||
        interaction.customId.startsWith("welcome:")
      ) {
        if (!isOwnerOrAdmin(interaction)) {
          return replyV2(interaction, "Você não tem permissão para alterar as configurações.");
        }
      }

      return handleButton(interaction);
    }

    if (
      interaction.isStringSelectMenu() ||
      interaction.isChannelSelectMenu() ||
      interaction.isRoleSelectMenu() ||
      interaction.isUserSelectMenu()
    ) {
      if (
        interaction.customId !== "ticket:create" &&
        !interaction.customId.startsWith("ticket:adduser:") &&
        !isOwnerOrAdmin(interaction)
      ) {
        return replyV2(interaction, "Você não tem permissão para alterar as configurações.");
      }

      await handleSelect(interaction);
      return handleSelectExtra(interaction);
    }

    if (interaction.isModalSubmit()) {
      if (!isOwnerOrAdmin(interaction)) {
        return replyV2(interaction, "Você não tem permissão para alterar as configurações.");
      }

      await handleModal(interaction);
      return handleModalExtra(interaction);
    }
  } catch (error) {
    console.error("Erro em interação:", error);

    const message =
      "Ocorreu um erro ao executar essa ação. Confira o Console da hospedagem.";

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: message,
        flags: MessageFlags.Ephemeral
      }).catch(() => null);
    } else {
      await replyV2(interaction, message).catch(() => null);
    }
  }
});

const spamTracker = new Map();

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const cfg = getGuild(message.guild.id);

  if (message.content.trim().toLowerCase() === `${PREFIX}feedbacks`) {
    if (
      message.author.id !== OWNER_ID &&
      !message.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return message.reply({
        content: `${EMOJI.no} Você não tem permissão para consultar os feedbacks.`,
        allowedMentions: { repliedUser: false }
      });
    }

    const all = Object.entries(data.feedbacks)
      .flatMap(([ticketId, entries]) =>
        entries.map(entry => ({ ticketId, ...entry }))
      )
      .slice(-20);

    if (!all.length) {
      return sendV2(message.channel, "Ainda não existem avaliações registradas.");
    }

    const text = all.map(entry =>
      `⭐ **${entry.rating}/5** — <@${entry.userId}> — Ticket \`${entry.ticketId}\``
    ).join("\n");

    return sendV2(message.channel, `# ${EMOJI.like} Últimos feedbacks\n${text}`, {
      allowedMentions: {
        parse: [],
        users: all.map(x => x.userId)
      }
    });
  }

  if (cfg.security.honeypotChannelId === message.channel.id) {
    await message.delete().catch(() => null);

    const action = cfg.security.honeypotAction;
    const member = message.member;

    if (member && member.moderatable && action === "timeout") {
      await member.timeout(
        7 * 24 * 60 * 60 * 1000,
        "Mensagem enviada no canal Honeypot"
      ).catch(error => console.error("Erro no timeout Honeypot:", error));
    }

    if (member && member.kickable && action === "kick") {
      await member.kick("Mensagem enviada no canal Honeypot")
        .catch(error => console.error("Erro no kick Honeypot:", error));
    }

    if (member && member.bannable && action === "ban") {
      await member.ban({ reason: "Mensagem enviada no canal Honeypot" })
        .catch(error => console.error("Erro no ban Honeypot:", error));
    }

    return;
  }

  if (cfg.security.antiSpam) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const previous = spamTracker.get(key) || [];
    const recent = previous.filter(time => now - time < 5000);

    recent.push(now);
    spamTracker.set(key, recent);

    if (recent.length >= 6) {
      await message.delete().catch(() => null);

      if (message.member?.moderatable) {
        await message.member.timeout(60 * 1000, "Anti-spam automático")
          .catch(error => console.error("Erro no anti-spam:", error));
      }

      return;
    }
  }

  if (
    cfg.security.antiLinks &&
    /(https?:\/\/|discord\.gg\/|www\.)/i.test(message.content) &&
    !message.member.permissions.has(PermissionFlagsBits.ManageMessages)
  ) {
    await message.delete().catch(() => null);
    return;
  }

  if (!cfg.ai.enabled) return;

  const isAIChannel =
    cfg.ai.channelId && message.channel.id === cfg.ai.channelId;

  const mentioned = message.mentions.users.has(client.user.id);

  if (!isAIChannel && !mentioned) return;

  if (!openai) {
    return message.reply({
      content: `${EMOJI.alert} A IA está sem chave de API. Confira OPENAI_API_KEY na Fadehost.`,
      allowedMentions: { repliedUser: false }
    });
  }

  try {
    await message.channel.sendTyping();

    const answer = await askAI(message);

    await message.reply({
      content: answer,
      allowedMentions: { repliedUser: false }
    });
  } catch (error) {
    const explanation = aiErrorMessage(error);

    await message.reply({
      content: `${EMOJI.alert} ChatGPT indisponível\n${explanation}`,
      allowedMentions: { repliedUser: false }
    }).catch(() => null);
  }
});

client.on("guildMemberAdd", async member => {
  const cfg = getGuild(member.guild.id);
  if (!cfg.welcomeChannelId) return;

  const channel = await member.guild.channels.fetch(cfg.welcomeChannelId)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) return;

  await sendV2(
    channel,
    `# ${EMOJI.online} Boas-vindas!\n` +
    `Seja bem-vindo(a), <@${member.id}>!\n` +
    `Agora somos **${member.guild.memberCount} membros**.`,
    {
      allowedMentions: {
        parse: [],
        users: [member.id]
      }
    }
  ).catch(error => console.error("Erro na mensagem de boas-vindas:", error));
});

client.on("guildMemberRemove", async member => {
  const cfg = getGuild(member.guild.id);
  if (!cfg.leaveChannelId) return;

  const channel = await member.guild.channels.fetch(cfg.leaveChannelId)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) return;

  await sendV2(
    channel,
    `# ${EMOJI.warning} Membro saiu\n**${member.user.tag}** saiu do servidor.`,
    { allowedMentions: { parse: [] } }
  ).catch(error => console.error("Erro na mensagem de saída:", error));
});

client.on("messageDelete", async message => {
  if (!message.guild || message.author?.bot) return;

  const cfg = getGuild(message.guild.id);
  if (!cfg.logChannelId) return;

  const channel = await message.guild.channels.fetch(cfg.logChannelId)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) return;

  await sendV2(
    channel,
    `# ${EMOJI.delete} Mensagem apagada\n` +
    `**Autor:** ${message.author?.tag || "Desconhecido"}\n` +
    `**Canal:** <#${message.channel.id}>\n` +
    `**Conteúdo:** ${(message.content || "Sem texto").slice(0, 1500)}`,
    { allowedMentions: { parse: [] } }
  ).catch(() => null);
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const cfg = getGuild(newMember.guild.id);
  if (!cfg.logChannelId) return;

  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  const added = newRoles.filter(role => !oldRoles.has(role.id));
  const removed = oldRoles.filter(role => !newRoles.has(role.id));

  if (!added.size && !removed.size) return;

  const channel = await newMember.guild.channels.fetch(cfg.logChannelId)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) return;

  await sendV2(
    channel,
    `# ${EMOJI.shield} Alteração de cargos\n` +
    `**Membro:** <@${newMember.id}>\n` +
    `**Adicionados:** ${added.map(r => r.name).join(", ") || "Nenhum"}\n` +
    `**Removidos:** ${removed.map(r => r.name).join(", ") || "Nenhum"}`,
    {
      allowedMentions: {
        parse: [],
        users: [newMember.id]
      }
    }
  ).catch(() => null);
});

client.on("error", error => {
  console.error("Erro do cliente Discord:", error);
});

process.on("unhandledRejection", error => {
  console.error("Promise rejeitada:", error);
});

process.on("uncaughtException", error => {
  console.error("Erro não tratado:", error);
});

client.login(TOKEN);
