const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  ChannelType,
  AttachmentBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// ==============================================
// CARREGAR DADOS
// ==============================================
let data = require('./data.json');
const DATA_PATH = path.join(__dirname, 'data.json');

function salvarDados() {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[ERRO] Não foi possível salvar dados:', e);
    return false;
  }
}

// ==============================================
// INICIALIZAÇÃO DO BOT
// ==============================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ]
});

const PROPRIETARIO_ID = data.proprietarioId;
const token = process.env.DISCORD_BOT_TOKEN;

// Verificar permissões de acesso
function temAcessoCompleto(usuario, servidor) {
  if (usuario.id === PROPRIETARIO_ID) return true;
  const cargoAdmin = data.configuracoes.cargoAdmin;
  if (cargoAdmin && servidor) {
    const membro = servidor.members.cache.get(usuario.id);
    if (membro && membro.roles.cache.has(cargoAdmin)) return true;
    if (membro?.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  }
  return false;
}

function eEquipe(usuario, servidor) {
  if (temAcessoCompleto(usuario, servidor)) return true;
  const cargoMod = data.configuracoes.cargoMod;
  const cargoSup = data.configuracoes.cargoSuporte;
  const membro = servidor?.members.cache.get(usuario.id);
  if (!membro) return false;
  if (cargoMod && membro.roles.cache.has(cargoMod)) return true;
  if (cargoSup && membro.roles.cache.has(cargoSup)) return true;
  return false;
}

// ==============================================
// LOGS DO SISTEMA
// ==============================================
async function registrarLog(servidor, tipo, mensagem, autor = null) {
  const canalId = data.configuracoes.canalLogs;
  if (!canalId) return;
  const canal = servidor.channels.cache.get(canalId);
  if (!canal) return;

  const embed = new EmbedBuilder()
    .setTitle(`📋 LOG: ${tipo}`)
    .setDescription(mensagem)
    .setColor('#2f3136')
    .setTimestamp()
    .setFooter({ text: autor ? `Por: ${autor.tag}` : 'Sistema ZYPhor' });

  try {
    await canal.send({ embeds: [embed] });
  } catch (e) { /* ignorar */ }
}

// ==============================================
// EVENTO: BOT PRONTO
// ==============================================
client.on(Events.ClientReady, async () => {
  console.log(`\n✅ ZYPhor Bot ONLINE — ${client.user.tag}`);
  console.log(`🌐 Servidores: ${client.guilds.cache.size}`);
  console.log(`🔧 Proprietário: ${PROPRIETARIO_ID}\n`);

  // Registrar comando /config
  const comandos = [
    {
      name: 'config',
      description: 'Abrir painel de configuração do ZYPhor Bot',
      type: 1
    }
  ];

  try {
    await client.application.commands.set(comandos);
    console.log('✅ Comandos registrados!');
  } catch (e) {
    console.error('⚠️ Erro ao registrar comandos:', e.message);
  }
});

// ==============================================
// COMANDO SLASH: /config
// ==============================================
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.guild) return;

  // COMANDO /config
  if (interaction.commandName === 'config') {
    if (!temAcessoCompleto(interaction.user, interaction.guild)) {
      return interaction.reply({
        content: '❌ **Sem permissão!** Acesso restrito à administração.',
        ephemeral: true
      });
    }
    await abrirPainelPrincipal(interaction);
    return;
  }

  // BOTÕES E MENUS
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await tratarInteracao(interaction);
    return;
  }

  // MODAIS
  if (interaction.isModalSubmit()) {
    await tratarModal(interaction);
    return;
  }
});

// ==============================================
// COMANDO DE PREFIXO: z!feedbacks
// ==============================================
client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;
  
  if (message.content.trim() === 'z!feedbacks') {
    if (!eEquipe(message.author, message.guild)) {
      return message.reply('❌ Sem permissão! Acesso apenas à equipe.');
    }
    
    const fb = data.feedbacks.slice(-20).reverse();
    if (fb.length === 0) {
      return message.reply('📭 Nenhum feedback registrado ainda.');
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 Feedbacks Recentes')
      .setColor('#2f3136')
      .setTimestamp();

    let texto = '';
    fb.forEach((f, i) => {
      texto += `**${i+1}.** ⭐ ${'★'.repeat(f.nota)}${'☆'.repeat(5-f.nota)}\nUsuário: <@${f.usuarioId}>\n${f.comentario || 'Sem comentário'}\n—\n`;
    });
    embed.setDescription(texto.substring(0, 4096));
    
    await message.reply({ embeds: [embed] });
  }
});

// ==============================================
// PAINEL PRINCIPAL DE CONFIGURAÇÃO
// ==============================================
async function abrirPainelPrincipal(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Painel de Controle — ZYPhor Bot')
    .setDescription('Selecione um módulo abaixo para configurar:')
    .setColor('#2f3136')
    .setThumbnail(client.user.displayAvatarURL())
    .setTimestamp()
    .setFooter({ text: `ZYPhor Bot • Administração • ${interaction.user.tag}` });

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_principal')
    .setPlaceholder('📂 Escolha um módulo...')
    .addOptions([
      { label: '🎫 Tickets', value: 'modulo_tickets', description: 'Sistema de suporte por tickets' },
      { label: '🛡️ Moderação', value: 'modulo_moderacao', description: 'Ferramentas de moderação' },
      { label: '🔒 Segurança', value: 'modulo_seguranca', description: 'Proteções anti-raid, spam, etc.' },
      { label: '🕵️ Honeypot', value: 'modulo_honeypot', description: 'Canal de segurança automática' },
      { label: '🤖 Inteligência Artificial', value: 'modulo_ia', description: 'Integração com IA' },
      { label: '👋 Boas-Vindas', value: 'modulo_boasvindas', description: 'Mensagens de entrada e saída' },
      { label: '📜 Regras', value: 'modulo_regras', description: 'Publicação de regras' },
      { label: '📢 Anúncios', value: 'modulo_anuncios', description: 'Gerenciar anúncios' },
      { label: '🛒 Loja e Produtos', value: 'modulo_loja', description: 'Produtos e entregas' },
      { label: '⭐ Feedbacks', value: 'modulo_feedbacks', description: 'Avaliações de atendimento' },
      { label: '📋 Logs', value: 'modulo_logs', description: 'Canais de registro' },
      { label: '👤 Cargos e Acesso', value: 'modulo_cargos', description: 'Definir cargos da equipe' }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// ==============================================
// TRATAR INTERAÇÕES
// ==============================================
async function tratarInteracao(interaction) {
  const customId = interaction.customId;

  // Menu principal
  if (customId.startsWith('menu_principal')) {
    const valor = interaction.values[0];
    await abrirSubPainel(interaction, valor);
    return;
  }

  // Voltar ao principal
  if (customId === 'voltar_inicio') {
    await abrirPainelPrincipal(interaction);
    return;
  }

  // ------------------------------
  // MÓDULO: CARGOS E ACESSO
  // ------------------------------
  if (customId === 'config_cargos') {
    await painelCargos(interaction);
    return;
  }
  if (customId.startsWith('setcargo_')) {
    const tipo = customId.replace('setcargo_', '');
    const modal = new ModalBuilder()
      .setCustomId(`modal_cargo_${tipo}`)
      .setTitle(`Definir Cargo de ${tipo}`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('cargo_id')
            .setLabel('ID do Cargo')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    await interaction.showModal(modal);
    return;
  }

  // ------------------------------
  // MÓDULO: TICKETS
  // ------------------------------
  if (customId === 'config_tickets') {
    await painelTickets(interaction);
    return;
  }
  if (customId === 'tickets_toggle') {
    data.configuracoes.modulos.tickets.ativo = !data.configuracoes.modulos.tickets.ativo;
    salvarDados();
    await registrarLog(interaction.guild, 'CONFIGURAÇÃO', 
      `Tickets ${data.configuracoes.modulos.tickets.ativo ? '**ATIVADO**' : '**DESATIVADO**'}`, interaction.user);
    await painelTickets(interaction, true);
    return;
  }

  // ------------------------------
  // MÓDULO: SEGURANÇA
  // ------------------------------
  if (customId === 'config_seguranca') {
    await painelSeguranca(interaction);
    return;
  }

  // ------------------------------
  // MÓDULO: HONEYPOT
  // ------------------------------
  if (customId === 'config_honeypot') {
    await painelHoneypot(interaction);
    return;
  }
  if (customId === 'honeypot_toggle') {
    data.configuracoes.modulos.honeypot.ativo = !data.configuracoes.modulos.honeypot.ativo;
    salvarDados();
    await registrarLog(interaction.guild, 'SEGURANÇA', 
      `Honeypot ${data.configuracoes.modulos.honeypot.ativo ? '**ATIVADO**' : '**DESATIVADO**'}`, interaction.user);
    await painelHoneypot(interaction, true);
    return;
  }

  // ------------------------------
  // MÓDULO: BOAS-VINDAS
  // ------------------------------
  if (customId === 'config_boasvindas') {
    await painelBoasVindas(interaction);
    return;
  }

  // ------------------------------
  // MÓDULO: LOJA
  // ------------------------------
  if (customId === 'config_loja') {
    await painelLoja(interaction);
    return;
  }

  // ------------------------------
  // MÓDULO: FEEDBACKS
  // ------------------------------
  if (customId === 'config_feedbacks') {
    await painelFeedbacks(interaction);
    return;
  }

  // ------------------------------
  // MÓDULO: IA
  // ------------------------------
  if (customId === 'config_ia') {
    await painelIA(interaction);
    return;
  }
  if (customId === 'ia_toggle') {
    data.configuracoes.modulos.ia.ativo = !data.configuracoes.modulos.ia.ativo;
    salvarDados();
    await registrarLog(interaction.guild, 'IA', 
      `Inteligência Artificial ${data.configuracoes.modulos.ia.ativo ? '**ATIVADA**' : '**DESATIVADA**'}`, interaction.user);
    await painelIA(interaction, true);
    return;
  }

  // ------------------------------
  // MÓDULO: LOGS
  // ------------------------------
  if (customId === 'config_logs') {
    await painelLogs(interaction);
    return;
  }

  // ------------------------------
  // MÓDULO: MODERAÇÃO
  // ------------------------------
  if (customId === 'config_moderacao') {
    await painelModeracao
