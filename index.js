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
  ChannelType
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
// FUNÇÕES AUXILIARES DOS PAINÉIS
// ==============================================
async function abrirSubPainel(interaction, valor) {
  switch(valor) {
    case 'modulo_tickets':
      await painelTickets(interaction);
      break;
    case 'modulo_seguranca':
      await painelSeguranca(interaction);
      break;
    case 'modulo_honeypot':
      await painelHoneypot(interaction);
      break;
    case 'modulo_ia':
      await painelIA(interaction);
      break;
    case 'modulo_boasvindas':
      await painelBoasVindas(interaction);
      break;
    case 'modulo_regras':
      await painelRegras(interaction);
      break;
    case 'modulo_anuncios':
      await painelAnuncios(interaction);
      break;
    case 'modulo_loja':
      await painelLoja(interaction);
      break;
    case 'modulo_feedbacks':
      await painelFeedbacks(interaction);
      break;
    case 'modulo_logs':
      await painelLogs(interaction);
      break;
    case 'modulo_cargos':
      await painelCargos(interaction);
      break;
    case 'modulo_moderacao':
      await painelModeracao(interaction);
      break;
    default:
      await interaction.update({ content: '❌ Módulo em desenvolvimento', components: [] });
  }
}

function botaoVoltar() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('voltar_inicio')
      .setLabel('← Voltar ao Menu')
      .setStyle(ButtonStyle.Secondary)
  );
}

async function painelTickets(interaction, atualizar = false) {
  const cfg = data.configuracoes.modulos.tickets;
  const embed = new EmbedBuilder()
    .setTitle('🎫 Configuração — Tickets')
    .setColor('#2f3136')
    .addFields(
      { name: 'Status', value: cfg.ativo ? '✅ Ativado' : '❌ Desativado', inline: true },
      { name: 'Modo', value: cfg.modo === 'canal' ? '📁 Por Canais' : '💬 Por Threads', inline: true },
      { name: 'Canal/Categoria', value: cfg.categoria ? `✅ Configurado` : '❌ Não definido', inline: true }
    )
    .setTimestamp();

  const botoes = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tickets_toggle').setLabel(cfg.ativo ? 'Desativar' : 'Ativar').setStyle(cfg.ativo ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder().setCustomId('voltar_inicio').setLabel('← Voltar').setStyle(ButtonStyle.Secondary)
  );

  if (atualizar) await interaction.update({ embeds: [embed], components: [botoes] });
  else await interaction.reply({ embeds: [embed], components: [botoes], ephemeral: true });
}

async function painelSeguranca(interaction) {
  const cfg = data.configuracoes.modulos.seguranca;
  const embed = new EmbedBuilder()
    .setTitle('🔒 Configuração — Segurança')
    .setColor('#2f3136')
    .addFields(
      { name: 'Anti-Flood', value: cfg.antiFlood.ativo ? '✅ Ativo' : '❌ Desativado', inline: true },
      { name: 'Anti-Spam', value: cfg.antiSpam.ativo ? '✅ Ativo' : '❌ Desativado', inline: true },
      { name: 'Anti-Link', value: cfg.antiLink.ativo ? '✅ Ativo' : '❌ Desativado', inline: true },
      { name: 'Anti-Raid', value: cfg.antiRaid.ativo ? '✅ Ativo' : '❌ Desativado', inline: true },
      { name: 'Anti-Phishing', value: cfg.antiPhishing.ativo ? '✅ Ativo' : '❌ Desativado', inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], components: [botaoVoltar()], ephemeral: true });
}

async function painelHoneypot(interaction, atualizar = false) {
  const cfg = data.configuracoes.modulos.honeypot;
  const embed = new EmbedBuilder()
    .setTitle('🕵️ Configuração — Honeypot')
    .setColor('#2f3136')
    .setDescription('Canal iscador: quem envia mensagem é punido automaticamente')
    .addFields(
      { name: 'Status', value: cfg.ativo ? '✅ ATIVADO' : '❌ DESATIVADO', inline: true },
      { name: 'Canal', value: cfg.canal ? `<#${cfg.canal}>` : 'Não selecionado', inline: true },
      { name: 'Punição', value: cfg.acao.toUpperCase(), inline: true }
    )
    .setTimestamp();

  const botoes = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('honeypot_toggle').setLabel(cfg.ativo ? 'Desativar' : 'Ativar').setStyle(cfg.ativo ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder().setCustomId('voltar_inicio').setLabel('← Voltar').setStyle(ButtonStyle.Secondary)
  );

  if (atualizar) await interaction.update({ embeds: [embed], components: [botoes] });
  else await interaction.reply({ embeds: [embed], components: [botoes], ephemeral: true });
}

async function painelIA(interaction, atualizar = false) {
  const cfg = data.configuracoes.modulos.ia;
  const embed = new EmbedBuilder()
    .setTitle('🤖 Configuração — Inteligência Artificial')
    .setColor('#2f3136')
    .addFields(
      { name: 'Status da IA', value: cfg.ativo ? '✅ ATIVADA' : '❌ DESATIVADA', inline: true },
      { name: 'Modo', value: cfg.modo, inline: true },
      { name: 'Resumir Tickets', value: cfg.resumirTickets ? '✅ Sim' : '❌ Não', inline: true }
    )
    .setTimestamp();

  const botoes = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ia_toggle').setLabel(cfg.ativo ? 'Desativar IA' : 'Ativar IA').setStyle(cfg.ativo ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder().setCustomId('voltar_inicio').setLabel('← Voltar').setStyle(ButtonStyle.Secondary)
  );

  if (atualizar) await interaction.update({ embeds: [embed], components: [botoes] });
  else await interaction.reply({ embeds: [embed], components: [botoes], ephemeral: true });
}

async function painelBoasVindas(interaction) {
  const cfg = data.configuracoes.modulos.boasVindas;
  const embed = new EmbedBuilder()
    .setTitle('👋 Configuração — Boas-Vindas')
    .setColor('#2f3136')
    .addFields(
      { name: 'Status', value: cfg.ativo ? '✅ Ativado' : '❌ Desativado', inline: true },
      { name: 'Canal', value: cfg.canal ? `<#${cfg.canal}>` : 'Não definido', inline: true }
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed], components: [botaoVoltar()], ephemeral: true });
}

async function painelRegras(interaction) {
  const cfg = data.configuracoes.modulos.regras;
  const embed = new EmbedBuilder()
    .setTitle('📜 Configuração — Regras')
    .setColor('#2f3136')
    .addFields(
      { name: 'Status', value: cfg.ativo ? '✅ Ativado' : '❌ Desativado', inline: true },
      { name: 'Canal', value: cfg.canal ? `<#${cfg.canal}>` : 'Não definido', inline: true }
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed], components: [botaoVoltar()], ephemeral: true });
}

async function painelAnuncios(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('📢 Configuração — Anúncios')
    .setColor('#2f3136')
    .setDescription(`Total de anúncios: ${data.configuracoes.modulos.anuncios.lista.length}`)
    .setTimestamp();
  await interaction.reply({ embeds: [embed], components: [botaoVoltar()], ephemeral: true });
}

async function painelLoja(interaction) {
  const produtos = data.configuracoes.modulos.loja.produtos;
  const embed = new EmbedBuilder()
    .setTitle('🛒 Configuração — Loja de Produtos')
    .setColor('#2f3136')
    .setDescription(`Produtos cadastrados: ${produtos.length}`)
    .setTimestamp();
  await interaction.reply({ embeds: [embed], components: [botaoVoltar()], ephemeral: true });
}

async function painelFeedbacks(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('⭐ Configuração — Feedbacks')
    .setColor('#2f3136')
    .setDescription(`Total de avaliações: ${data.feedbacks.length}\nComando da equipe: \`z!feedbacks\``)
    .addFields(
      { name: 'Canal de Publicação', value: data.configuracoes.modulos.feedbacks.canal ? `<#${data.configuracoes.modulos.feedbacks.canal}>` : 'Não configurado' }
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed], components: [botaoVoltar()], ephemeral: true });
}

async function painelLogs(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('📋 Configuração — Sistema de Logs')
    .setColor('#2f3136')
    .addFields(
      { name: 'Canal de Logs', value: data.configuracoes.canalLogs ? `<#${data.configuracoes.canalLogs}>` : '❌ Não configurado — recomendável configurar!' }
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed], components: [botaoVoltar()], ephemeral: true });
}

async function painelCargos(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('👤 Configuração — Cargos e Permissões')
    .setColor('#2f3136')
    .addFields(
      { name: 'Cargo Administrador', value: data.configuracoes.cargoAdmin ? `<@&${data.configuracoes.cargoAdmin}>` : 'Não definido', inline: true },
      { name: 'Cargo Moderação', value: data.configuracoes.cargoMod ? `<@&${data.configuracoes.cargoMod}>` : 'Não definido', inline: true },
      { name: 'Cargo Suporte', value: data.configuracoes.cargoSuporte ? `<@&${data.configuracoes.cargoSuporte}>` : 'Não definido', inline: true },
      { name: 'Proprietário Fixo', value: `<@${PROPRIETARIO_ID}>`, inline: false }
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed], components: [botaoVoltar()], ephemeral: true });
}

async function painelModeracao(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🛡️ Ferramentas de Moderação')
    .setColor('#2f3136')
    .setDescription('Comandos disponíveis: Advertir, Timeout, Expulsar, Banir, Limpar Mensagens\n*Configure os cargos em "Cargos e Acesso" primeiro*')
    .setTimestamp();
  await interaction.reply({ embeds: [embed], components: [botaoVoltar()], ephemeral: true });
}

// ==============================================
// TRATAR INTERAÇÕES
// ==============================================
async function tratarInteracao(interaction) {
  const customId = interaction.customId;

  if (customId.startsWith('menu_principal')) {
    const valor = interaction.values[0];
    await abrirSubPainel(interaction, valor);
    return;
  }

  if (customId === 'voltar_inicio') {
    await abrirPainelPrincipal(interaction);
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

  if (customId === 'honeypot_toggle') {
    data.configuracoes.modulos.honeypot.ativo = !data.configuracoes.modulos.honeypot.ativo;
    salvarDados();
    await registrarLog(interaction.guild, 'SEGURANÇA', 
      `Honeypot ${data.configuracoes.modulos.honeypot.ativo ? '**ATIVADO**' : '**DESATIVADO**'}`, interaction.user);
    await painelHoneypot(interaction, true);
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
}

// ==============================================
// TRATAR MODAIS
// ==============================================
async function tratarModal(interaction) {
  await interaction.deferUpdate();
}

// ==============================================
// PAINEL PRINCIPAL
// ==============================================
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
    .addOptions(
