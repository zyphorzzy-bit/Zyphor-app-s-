const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  Events
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// ==============================================
// CARREGAMENTO DE DADOS
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

// ==============================================
// FUNÇÕES DE PERMISSÃO
// ==============================================
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
// SISTEMA DE LOGS
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
  } catch (e) {
    console.error('[ERRO] Não foi possível enviar log:', e);
  }
}

// ==============================================
// FUNÇÕES AUXILIARES DOS PAINÉIS
// ==============================================
function botaoVoltar() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('voltar_inicio')
      .setLabel('← Voltar ao Menu')
      .setStyle(ButtonStyle.Secondary)
  );
}

async function abrirPainelPrincipal(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Painel de Controle — ZYPhor Bot')
    .setDescription('Selecione um módulo abaixo para configurar:')
    .setColor('#2f3136')
    .setTimestamp()
    .setFooter({ text: `ZYPhor Bot • Administração • ${interaction.user.tag}` });

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_principal')
    .setPlaceholder('📂 Escolha um módulo...')
    .addOptions([
      { label: '🎫 Tickets', value: 'modulo_tickets', description: 'Sistema de suporte por tickets' },
      { label: '🛡️ Moderação', value: 'modulo_moderacao', description: 'Ferramentas de moderação' },
      { label: '🔒 Segurança', value: 'modulo_seguranca', description: 'Proteções anti-raid, spam, etc.' },
      { label: '🕵️ Honeypot', value: 'modulo_honeypot', description: 'Canal iscador de segurança' },
      { label: '🤖 Inteligência Artificial', value: 'modulo_ia', description: 'Integração com IA' },
      { label: '👋 Boas-Vindas', value: 'modulo_boasvindas', description: 'Mensagens de entrada e saída' },
      { label: '📜 Regras', value: 'modulo_regras', description: 'Publicação de regras' },
      { label: '📢 Anúncios', value: 'modulo_anuncios', description: 'Gerenciar anúncios' },
      { label: '🛒 Loja e Produtos', value: 'modulo_loja', description: 'Produtos e vendas' },
      { label: '⭐ Feedbacks', value: 'modulo_feedbacks', description: 'Avaliações e feedbacks' },
      { label: '📋 Logs', value: 'modulo_logs', description: 'Histórico de atividades' },
      { label: '👤 Cargos e Acesso', value: 'modulo_cargos', description: 'Permissões da equipe' }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function abrirSubPainel(interaction, valor) {
  let embed = new EmbedBuilder().setColor('#2f3136').setTimestamp();
  const botoes = botaoVoltar();

  switch(valor) {
    case 'modulo_tickets': {
      const cfg = data.configuracoes.modulos.tickets;
      embed.setTitle('🎫 Configuração — Tickets')
        .addFields(
          { name: 'Status', value: cfg.ativo ? '✅ Ativado' : '❌ Desativado', inline: true },
          { name: 'Modo', value: cfg.modo === 'canal' ? '📁 Por Canais' : '💬 Por Threads', inline: true },
          { name: 'Canal/Categoria', value: cfg.categoria ? '✅ Configurado' : '❌ Não definido', inline: true }
        );
      break;
    }
    case 'modulo_seguranca': {
      const cfg = data.configuracoes.modulos.seguranca;
      embed.setTitle('🔒 Configuração — Segurança')
        .addFields(
          { name: 'Anti-Flood', value: cfg.antiFlood.ativo ? '✅ Ativo' : '❌ Desativado', inline: true },
          { name: 'Anti-Spam', value: cfg.antiSpam.ativo ? '✅ Ativo' : '❌ Desativado', inline: true },
          { name: 'Anti-Link', value: cfg.antiLink.ativo ? '✅ Ativo' : '❌ Desativado', inline: true },
          { name: 'Anti-Raid', value: cfg.antiRaid.ativo ? '✅ Ativo' : '❌ Desativado', inline: true },
          { name: 'Anti-Phishing', value: cfg.antiPhishing.ativo ? '✅ Ativo' : '❌ Desativado', inline: true }
        );
      break;
    }
    case 'modulo_honeypot': {
      const cfg = data.configuracoes.modulos.honeypot;
      embed.setTitle('🕵️ Configuração — Honeypot')
        .setDescription('Canal iscador: quem envia mensagem é punido automaticamente')
        .addFields(
          { name: 'Status', value: cfg.ativo ? '✅ ATIVADO' : '❌ DESATIVADO', inline: true },
          { name: 'Canal', value: cfg.canal ? `<#${cfg.canal}>` : 'Não selecionado', inline: true },
          { name: 'Punição', value: cfg.acao.toUpperCase(), inline: true }
        );
      break;
    }
    case 'modulo_ia': {
      const cfg = data.configuracoes.modulos.ia;
      embed.setTitle('🤖 Configuração — Inteligência Artificial')
        .addFields(
          { name: 'Status da IA', value: cfg.ativo ? '✅ ATIVADA' : '❌ DESATIVADA', inline: true },
          { name: 'Modo', value: cfg.modo, inline: true },
          { name: 'Resumir Tickets', value: cfg.resumirTickets ? '✅ Sim' : '❌ Não', inline: true }
        );
      break;
    }
    case 'modulo_boasvindas': {
      const cfg = data.configuracoes.modulos.boasVindas;
      embed.setTitle('👋 Configuração — Boas-Vindas')
        .addFields(
          { name: 'Status', value: cfg.ativo ? '✅ Ativado' : '❌ Desativado', inline: true },
          { name: 'Canal', value: cfg.canal ? `<#${cfg.canal}>` : 'Não definido', inline: true }
        );
      break;
    }
    case 'modulo_regras': {
      const cfg = data.configuracoes.modulos.regras;
      embed.setTitle('📜 Configuração — Regras')
        .addFields(
          { name: 'Status', value: cfg.ativo ? '✅ Ativado' : '❌ Desativado', inline: true },
          { name: 'Canal', value: cfg.canal ? `<#${cfg.canal}>` : 'Não definido', inline: true }
        );
      break;
    }
    case 'modulo_anuncios': {
      embed.setTitle('📢 Configuração — Anúncios')
        .setDescription(`Total de anúncios: ${data.configuracoes.modulos.anuncios.lista.length}`);
      break;
    }
    case 'modulo_loja': {
      const produtos = data.configuracoes.modulos.loja.produtos;
      embed.setTitle('🛒 Configuração — Loja de Produtos')
        .setDescription(`Produtos cadastrados: ${produtos.length}`);
      break;
    }
    case 'modulo_feedbacks': {
      embed.setTitle('⭐ Configuração — Feedbacks')
        .setDescription(`Total de avaliações: ${data.feedbacks.length}\nComando da equipe: \`z!feedbacks\``)
        .addFields(
          { name: 'Canal de Publicação', value: data.configuracoes.modulos.feedbacks.canal ? `<#${data.configuracoes.modulos.feedbacks.canal}>` : 'Não configurado' }
        );
      break;
    }
    case 'modulo_logs': {
      embed.setTitle('📋 Configuração — Sistema de Logs')
        .addFields(
          { name: 'Canal de Logs', value: data.configuracoes.canalLogs ? `<#${data.configuracoes.canalLogs}>` : '❌ Não configurado — recomendável configurar!' }
        );
      break;
    }
    case 'modulo_cargos': {
      embed.setTitle('👤 Configuração — Cargos e Permissões')
        .addFields(
          { name: 'Cargo Administrador', value: data.configuracoes.cargoAdmin ? `<@&${data.configuracoes.cargoAdmin}>` : 'Não definido', inline: true },
          { name: 'Cargo Moderação', value: data.configuracoes.cargoMod ? `<@&${data.configuracoes.cargoMod}>` : 'Não definido', inline: true },
          { name: 'Cargo Suporte', value: data.configuracoes.cargoSuporte ? `<@&${data.configuracoes.cargoSuporte}>` : 'Não definido', inline: true },
          { name: 'Proprietário Fixo', value: `<@${PROPRIETARIO_ID}>`, inline: false }
        );
      break;
    }
    case 'modulo_moderacao': {
      embed.setTitle('🛡️ Ferramentas de Moderação')
        .setDescription('Comandos disponíveis: Advertir, Timeout, Expulsar, Banir, Limpar Mensagens\n*Configure os cargos primeiro*');
      break;
    }
    default: {
      embed.setTitle('❌ Módulo não encontrado')
        .setDescription('Selecione uma opção válida no menu principal.');
    }
  }

  await interaction.update({ embeds: [embed], components: [botoes] });
}

// ==============================================
// TRATAMENTO DE INTERAÇÕES
// ==============================================
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.guild) return;

  // Comando /config
  if (interaction.commandName === 'config') {
    if (!temAcessoCompleto(interaction.user, interaction.guild)) {
      return interaction.reply({
        content: '❌ Sem permissão! Acesso restrito à administração.',
        ephemeral: true
      });
    }
    await abrirPainelPrincipal(interaction);
    return;
  }

  // Menus suspensos
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'menu_principal') {
      await abrirSubPainel(interaction, interaction.values[0]);
    }
    return;
  }

  // Botões
  if (interaction.isButton()) {
    if (interaction.customId === 'voltar_inicio') {
      await abrirPainelPrincipal(interaction);
    }
    return;
  }

  // Modais
  if (interaction.isModalSubmit()) {
    await interaction.deferUpdate();
    return;
  }
});

// ==============================================
// COMANDO DE MENSAGEM: z!feedbacks
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
      texto += `**${i + 1}.** ⭐ ${'★'.repeat(f.nota)}${'☆'.repeat(5 - f.nota)}\nUsuário: <@${f.usuarioId}>\n${f.comentario || 'Sem comentário'}\n—\n`;
    });
    embed.setDescription(texto.substring(0, 4096));

    await message.reply({ embeds: [embed] });
  }
});

// ==============================================
// BOT PRONTO & REGISTRO DE COMANDOS
// ==============================================
client.on(Events.ClientReady, async () => {
  console.log('\n========================================');
  console.log(`✅ ZYPhor Bot ONLINE — ${client.user.tag}`);
  console.log(`🌐 Servidores conectados: ${client.guilds.cache.size}`);
  console.log(`🔧 Proprietário fixo: ${PROPRIETARIO_ID}`);
  console.log('========================================\n');

  try {
    await client.application.commands.set([
      { name: 'config', description: 'Abre o painel de configuração do ZYPhor Bot' }
    ]);
    console.log('✅ Comandos registrados com sucesso!');
  } catch (e) {
    console.error('⚠️ Erro ao registrar comandos:', e.message);
  }
});

// ==============================================
// LOGIN DO BOT
// ==============================================
if (!token) {
  console.error('❌ ERRO CRÍTICO: Variável de ambiente DISCORD_BOT_TOKEN não está configurada!');
  console.error('Configure-a nas variáveis de ambiente da sua hospedagem e reinicie.');
  process.exit(1);
}

client.login(token)
  .then(() => console.log('🔐 Login realizado com sucesso!'))
  .catch(err => {
    console.error('❌ Falha ao fazer login:', err.message);
    process.exit(1);
  });
