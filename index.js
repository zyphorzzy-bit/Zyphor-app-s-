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
const DATA_PATH = path.join(__dirname, 'data.json');
let data = {};

function carregarDados() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      const estruturaInicial = {
        proprietarioId: "",
        configuracoes: {
          cargoAdmin: "",
          cargoMod: "",
          cargoSuporte: "",
          canalLogs: "",
          modulos: {
            tickets: { ativo: false, modo: 'canal', categoria: '' },
            seguranca: {
              antiFlood: { ativo: false },
              antiSpam: { ativo: false },
              antiLink: { ativo: false },
              antiRaid: { ativo: false },
              antiPhishing: { ativo: false }
            },
            honeypot: { ativo: false, canal: '', acao: 'ban' },
            ia: { ativo: false, modo: 'padrão', resumirTickets: false },
            boasVindas: { ativo: false, canal: '' },
            regras: { ativo: false, canal: '' },
            anuncios: { lista: [] },
            loja: { produtos: [] },
            feedbacks: { canal: '' }
          }
        },
        feedbacks: []
      };
      fs.writeFileSync(DATA_PATH, JSON.stringify(estruturaInicial, null, 2), 'utf8');
    }
    data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch (e) {
    console.error('[ERRO] Falha ao carregar data.json:', e);
  }
}

function salvarDados() {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[ERRO] Não foi possível salvar dados:', e);
    return false;
  }
}

carregarDados();

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

const token = process.env.DISCORD_BOT_TOKEN;

// ==============================================
// FUNÇÕES DE PERMISSÃO
// ==============================================
function temAcessoCompleto(usuario, servidor) {
  if (data.proprietarioId && usuario.id === data.proprietarioId) return true;
  const cargoAdmin = data.configuracoes?.cargoAdmin;
  if (servidor) {
    const membro = servidor.members.cache.get(usuario.id);
    if (cargoAdmin && membro?.roles.cache.has(cargoAdmin)) return true;
    if (membro?.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  }
  return false;
}

function eEquipe(usuario, servidor) {
  if (temAcessoCompleto(usuario, servidor)) return true;
  const cargoMod = data.configuracoes?.cargoMod;
  const cargoSup = data.configuracoes?.cargoSuporte;
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
  const canalId = data.configuracoes?.canalLogs;
  if (!canalId) return;
  const canal = servidor.channels.cache.get(canalId);
  if (!canal) return;

  const embed = new EmbedBuilder()
    .setTitle(`📋 LOG: ${tipo}`)
    .setDescription(mensagem)
    .setColor('#5865F2')
    .setTimestamp()
    .setFooter({ text: autor ? `Por: ${autor.tag}` : 'Sistema ZYPhor' });

  try {
    await canal.send({ embeds: [embed] });
  } catch (e) {
    console.error('[ERRO] Não foi possível enviar log:', e);
  }
}

// ==============================================
// NAUVEGAÇÃO DOS PAINÉIS
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
    .setDescription('Selecione um módulo abaixo para gerenciar a estrutura do seu servidor:')
    .setColor('#5865F2')
    .setTimestamp()
    .setFooter({ text: `ZYPhor Bot • Painel Principal • ${interaction.user.tag}` });

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_principal')
    .setPlaceholder('📂 Escolha um módulo...')
    .addOptions([
      { label: '🎫 Tickets', value: 'modulo_tickets', description: 'Sistema de suporte por canais/threads' },
      { label: '🛡️ Moderação', value: 'modulo_moderacao', description: 'Comandos e regras de moderação' },
      { label: '🔒 Segurança', value: 'modulo_seguranca', description: 'Proteções anti-raid, spam, phishing' },
      { label: '🕵️ Honeypot', value: 'modulo_honeypot', description: 'Canal iscador contra bots maliciosos' },
      { label: '🤖 Inteligência Artificial', value: 'modulo_ia', description: 'Integração com IA e resumos' },
      { label: '👋 Boas-Vindas', value: 'modulo_boasvindas', description: 'Boas-vindas e saídas de membros' },
      { label: '📜 Regras', value: 'modulo_regras', description: 'Exibição e aceite de regras' },
      { label: '📢 Anúncios', value: 'modulo_anuncios', description: 'Gerenciador de anúncios corporativos' },
      { label: '🛒 Loja & Produtos', value: 'modulo_loja', description: 'Catálogo de produtos e vendas' },
      { label: '⭐ Feedbacks', value: 'modulo_feedbacks', description: 'Sistema de avaliações e opiniões' },
      { label: '📋 Logs', value: 'modulo_logs', description: 'Canal centralizado de auditoria' },
      { label: '👤 Cargos e Acesso', value: 'modulo_cargos', description: 'Cargos administrativos e de equipe' }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await interaction.update({ embeds: [embed], components: [row] });
  } else {
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
}

async function abrirSubPainel(interaction, valor) {
  let embed = new EmbedBuilder().setColor('#5865F2').setTimestamp();
  let componentes = [botaoVoltar()];

  switch(valor) {
    case 'modulo_tickets': {
      const cfg = data.configuracoes.modulos.tickets;
      embed.setTitle('🎫 Configuração — Tickets')
        .addFields(
          { name: 'Status', value: cfg.ativo ? '✅ Ativado' : '❌ Desativado', inline: true },
          { name: 'Modo', value: cfg.modo === 'canal' ? '📁 Canais' : '💬 Threads', inline: true },
          { name: 'Categoria', value: cfg.categoria ? `<#${cfg.categoria}>` : 'Não definida', inline: true }
        );

      const rowAcoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('toggle_tickets')
          .setLabel(cfg.ativo ? 'Desativar Módulo' : 'Ativar Módulo')
          .setStyle(cfg.ativo ? ButtonStyle.Danger : ButtonStyle.Success)
      );
      componentes.unshift(rowAcoes);
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
        .setDescription('O canal iscador pune automaticamente qualquer conta de bot/spammer que enviar mensagens nele.')
        .addFields(
          { name: 'Status', value: cfg.ativo ? '✅ Ativado' : '❌ Desativado', inline: true },
          { name: 'Canal', value: cfg.canal ? `<#${cfg.canal}>` : 'Não definido', inline: true },
          { name: 'Punição', value: cfg.acao.toUpperCase(), inline: true }
        );
      break;
    }

    case 'modulo_ia': {
      const cfg = data.configuracoes.modulos.ia;
      embed.setTitle('🤖 Configuração — Inteligência Artificial')
        .addFields(
          { name: 'Status da IA', value: cfg.ativo ? '✅ Ativa' : '❌ Desativada', inline: true },
          { name: 'Modo de Operação', value: cfg.modo, inline: true },
          { name: 'Resumir Tickets', value: cfg.resumirTickets ? '✅ Sim' : '❌ Não', inline: true }
        );
      break;
    }

    case 'modulo_cargos': {
      embed.setTitle('👤 Configuração — Cargos e Permissões')
        .addFields(
          { name: 'Cargo Administrador', value: data.configuracoes.cargoAdmin ? `<@&${data.configuracoes.cargoAdmin}>` : 'Não configurado', inline: true },
          { name: 'Cargo Moderação', value: data.configuracoes.cargoMod ? `<@&${data.configuracoes.cargoMod}>` : 'Não configurado', inline: true },
          { name: 'Cargo Suporte', value: data.configuracoes.cargoSuporte ? `<@&${data.configuracoes.cargoSuporte}>` : 'Não configurado', inline: true },
          { name: 'Proprietário Fixo', value: data.proprietarioId ? `<@${data.proprietarioId}>` : 'Não configurado', inline: false }
        );

      const rowCargos = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('set_cargos_modal')
          .setLabel('⚙️ Alterar IDs dos Cargos')
          .setStyle(ButtonStyle.Primary)
      );
      componentes.unshift(rowCargos);
      break;
    }

    case 'modulo_logs': {
      embed.setTitle('📋 Configuração — Sistema de Logs')
        .addFields(
          { name: 'Canal de Logs', value: data.configuracoes.canalLogs ? `<#${data.configuracoes.canalLogs}>` : '❌ Não configurado' }
        );
      break;
    }

    default: {
      embed.setTitle('ℹ️ Módulo em Desenvolvimento')
        .setDescription('As configurações deste módulo podem ser gerenciadas diretamente pelos comandos do bot.');
    }
  }

  await interaction.update({ embeds: [embed], components: componentes });
}

// ==============================================
// TRATAMENTO DE INTERAÇÕES E EVENTOS
// ==============================================
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.guild) return;

  // Comando de barra /config
  if (interaction.isChatInputCommand() && interaction.commandName === 'config') {
    if (!temAcessoCompleto(interaction.user, interaction.guild)) {
      return interaction.reply({ content: '❌ Acesso restrito aos administradores.', ephemeral: true });
    }
    await abrirPainelPrincipal(interaction);
    return;
  }

  // Menus de Seleção
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
      return;
    }

    if (interaction.customId === 'toggle_tickets') {
      data.configuracoes.modulos.tickets.ativo = !data.configuracoes.modulos.tickets.ativo;
      salvarDados();
      await abrirSubPainel(interaction, 'modulo_tickets');
      return;
    }

    if (interaction.customId === 'set_cargos_modal') {
      const modal = new ModalBuilder()
        .setCustomId('modal_cargos_save')
        .setTitle('Configurar Cargos da Equipe');

      const adminInput = new TextInputBuilder()
        .setCustomId('input_admin')
        .setLabel('ID do Cargo Admin')
        .setStyle(TextInputStyle.Short)
        .setValue(data.configuracoes.cargoAdmin || '')
        .setRequired(false);

      const modInput = new TextInputBuilder()
        .setCustomId('input_mod')
        .setLabel('ID do Cargo Moderação')
        .setStyle(TextInputStyle.Short)
        .setValue(data.configuracoes.cargoMod || '')
        .setRequired(false);

      const supInput = new TextInputBuilder()
        .setCustomId('input_sup')
        .setLabel('ID do Cargo Suporte')
        .setStyle(TextInputStyle.Short)
        .setValue(data.configuracoes.cargoSuporte || '')
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(adminInput),
        new ActionRowBuilder().addComponents(modInput),
        new ActionRowBuilder().addComponents(supInput)
      );

      await interaction.showModal(modal);
      return;
    }
  }

  // Modais Submit
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_cargos_save') {
      data.configuracoes.cargoAdmin = interaction.fields.getTextInputValue('input_admin').trim();
      data.configuracoes.cargoMod = interaction.fields.getTextInputValue('input_mod').trim();
      data.configuracoes.cargoSuporte = interaction.fields.getTextInputValue('input_sup').trim();
      salvarDados();

      await interaction.reply({ content: '✅ Cargos atualizados com sucesso!', ephemeral: true });
    }
  }
});

// ==============================================
// COMANDOS DE TEXTO (PREFIXO z!)
// ==============================================
client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const comando = args.shift().toLowerCase();

  // z!feedbacks
  if (comando === 'z!feedbacks') {
    if (!eEquipe(message.author, message.guild)) {
      return message.reply('❌ Você não tem permissão de equipe para usar este comando.');
    }

    const fb = data.feedbacks.slice(-15).reverse();
    if (fb.length === 0) {
      return message.reply('📭 Nenhum feedback cadastrado ainda.');
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 Feedbacks Recebidos')
      .setColor('#5865F2')
      .setTimestamp();

    let texto = '';
    fb.forEach((f, i) => {
      texto += `**${i + 1}.** ⭐ ${'★'.repeat(f.nota)}${'☆'.repeat(5 - f.nota)}\n**Usuário:** <@${f.usuarioId}>\n**Comentário:** ${f.comentario || 'Sem texto'}\n—\n`;
    });
    embed.setDescription(texto.substring(0, 4096));

    await message.reply({ embeds: [embed] });
  }

  // z!clear [quantidade]
  if (comando === 'z!clear') {
    if (!eEquipe(message.author, message.guild)) return;
    const qtd = parseInt(args[0]);
    if (isNaN(qtd) || qtd < 1 || qtd > 100) {
      return message.reply('❌ Informe um número de mensagens para apagar entre 1 e 100.');
    }

    await message.channel.bulkDelete(qtd, true);
    const msg = await message.channel.send(`🧹 **${qtd}** mensagens foram limpas com sucesso.`);
    setTimeout(() => msg.delete().catch(() => {}), 5000);
    
    registrarLog(message.guild, 'Limpeza de Mensagens', `O usuário <@${message.author.id}> apagueou ${qtd} mensagens no canal <#${message.channel.id}>.`, message.author);
  }
});

// ==============================================
// INICIALIZAÇÃO
// ==============================================
client.on(Events.ClientReady, async () => {
  console.log('\n========================================');
  console.log(`✅ ZYPhor Bot ONLINE — ${client.user.tag}`);
  console.log(`🌐 Servidores conectados: ${client.guilds.cache.size}`);
  console.log('========================================\n');

  try {
    await client.application.commands.set([
      { name: 'config', description: 'Abre o painel de controle e configurações do ZYPhor Bot' }
    ]);
    console.log('✅ Comandos / (Slash Commands) salvos no Discord!');
  } catch (e) {
    console.error('⚠️ Erro ao registrar comandos:', e.message);
  }
});

if (!token) {
  console.error('❌ ERRO CRÍTICO: DISCORD_BOT_TOKEN não encontrado nas variáveis de ambiente!');
  process.exit(1);
}

client.login(token).catch(err => {
  console.error('❌ Falha ao realizar login:', err.message);
  process.exit(1);
});
