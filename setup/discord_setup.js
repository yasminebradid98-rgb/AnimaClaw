#!/usr/bin/env node

/**
 * ANIMA OS — Discord Server Setup
 * Version: 1.0.0
 * Engine: SOLARIS
 *
 * Auto-creates all required agent channels in a Discord server
 * and assigns correct bot permissions to each channel.
 *
 * Usage: node discord_setup.js
 * Requires: DISCORD_BOT_TOKEN and DISCORD_GUILD_ID in .env
 */

const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require('discord.js');
const path = require('path');

// Load .env from project root
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!BOT_TOKEN) {
  console.error('ERROR: DISCORD_BOT_TOKEN not set in .env');
  process.exit(1);
}

if (!GUILD_ID) {
  console.error('ERROR: DISCORD_GUILD_ID not set in .env');
  process.exit(1);
}

// Channel definitions: name, topic, category
const CATEGORY_NAME = 'ANIMA OS';

const CHANNELS = [
  {
    name: 'anima-mission-control',
    topic: 'System announcements, critical alerts, and master directives. ROOT_ORCHESTRATOR broadcasts here.',
    permissions: { sendMessages: false } // Read-only for non-bot users
  },
  {
    name: 'root-orchestrator',
    topic: 'ROOT_ORCHESTRATOR activity — task routing decisions, system state changes, vitality reports.',
    permissions: {}
  },
  {
    name: 'primary-cell',
    topic: 'PRIMARY_CELL activity — core mission task execution, completion reports, alignment scores.',
    permissions: {}
  },
  {
    name: 'support-cell',
    topic: 'SUPPORT_CELL activity — monitoring coordination, memory management, evolution triggers.',
    permissions: {}
  },
  {
    name: 'memory-node',
    topic: 'MEMORY_NODE activity — Supabase operations, compaction reports, data health metrics.',
    permissions: {}
  },
  {
    name: 'evolution-node',
    topic: 'EVOLUTION_NODE activity — evolution cycles, mutations, alignment drift analysis, personal/global bests.',
    permissions: {}
  },
  {
    name: 'immune-system',
    topic: 'IMMUNE_AGENT activity — threat detection, quarantine events, scan results, security alerts.',
    permissions: {}
  },
  {
    name: 'genesis-heartbeat',
    topic: 'Live heartbeat — π-pulse logs every 3.14 seconds. System vitality, alignment, agent status.',
    permissions: { sendMessages: false } // Read-only for non-bot users
  },
  {
    name: 'cost-tracker',
    topic: 'API cost tracking — per agent, per model, daily summaries. Budget alerts.',
    permissions: {}
  },
  {
    name: 'master-profile',
    topic: 'Master identity and mission display. Profile updates, onboarding status.',
    permissions: {}
  }
];

async function setupDiscord() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages
    ]
  });

  try {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║     ANIMA OS — Discord Setup          ║');
    console.log('║     Engine: SOLARIS v1.0.0            ║');
    console.log('╚═══════════════════════════════════════╝\n');

    console.log('Connecting to Discord...');
    await client.login(BOT_TOKEN);
    console.log(`Logged in as ${client.user.tag}`);

    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
      throw new Error(`Guild ${GUILD_ID} not found. Check DISCORD_GUILD_ID.`);
    }
    console.log(`Connected to server: ${guild.name}\n`);

    // Check bot permissions
    const botMember = await guild.members.fetch(client.user.id);
    const botPermissions = botMember.permissions;

    if (!botPermissions.has(PermissionFlagsBits.ManageChannels)) {
      throw new Error('Bot lacks MANAGE_CHANNELS permission. Please grant it in server settings.');
    }
    if (!botPermissions.has(PermissionFlagsBits.ManageRoles)) {
      throw new Error('Bot lacks MANAGE_ROLES permission. Please grant it in server settings.');
    }

    // Create or find category
    console.log(`Creating category: ${CATEGORY_NAME}`);
    let category = guild.channels.cache.find(
      c => c.name === CATEGORY_NAME && c.type === ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: CATEGORY_NAME,
        type: ChannelType.GuildCategory,
        reason: 'ANIMA OS auto-setup'
      });
      console.log(`  Created category: ${CATEGORY_NAME}`);
    } else {
      console.log(`  Category already exists: ${CATEGORY_NAME}`);
    }

    // Create channels
    console.log('\nCreating channels:\n');
    const createdChannels = {};

    for (const channelDef of CHANNELS) {
      const existingChannel = guild.channels.cache.find(
        c => c.name === channelDef.name && c.parentId === category.id
      );

      if (existingChannel) {
        console.log(`  [EXISTS] #${channelDef.name}`);
        createdChannels[channelDef.name] = existingChannel.id;
        continue;
      }

      // Build permission overwrites
      const permissionOverwrites = [
        {
          id: guild.id, // @everyone role
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: channelDef.permissions.sendMessages === false
            ? [PermissionFlagsBits.SendMessages]
            : []
        },
        {
          id: client.user.id, // Bot user
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        }
      ];

      const newChannel = await guild.channels.create({
        name: channelDef.name,
        type: ChannelType.GuildText,
        parent: category.id,
        topic: channelDef.topic,
        permissionOverwrites: permissionOverwrites,
        reason: 'ANIMA OS auto-setup'
      });

      createdChannels[channelDef.name] = newChannel.id;
      console.log(`  [CREATED] #${channelDef.name}`);
    }

    // Post welcome message to mission control
    const missionControlId = createdChannels['anima-mission-control'];
    if (missionControlId) {
      const missionControl = await guild.channels.fetch(missionControlId);
      await missionControl.send({
        embeds: [{
          title: 'ANIMA OS — Online',
          description: [
            'The Living Agentic Operating System has connected to this server.',
            '',
            '**Engine:** SOLARIS v1.0.0',
            '**Channels:** ' + CHANNELS.length + ' created',
            '**Status:** Awaiting onboarding',
            '',
            'Run `SOLARIS.md` in your OpenClaw workspace to begin onboarding.'
          ].join('\n'),
          color: 0xc9a84c, // Gold
          footer: { text: 'ANIMA OS | By Riyad Ketami' },
          timestamp: new Date().toISOString()
        }]
      });
      console.log('\n  Posted welcome message to #anima-mission-control');
    }

    // Summary
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║     Discord Setup Complete            ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`\n  Server: ${guild.name}`);
    console.log(`  Category: ${CATEGORY_NAME}`);
    console.log(`  Channels: ${Object.keys(createdChannels).length}/${CHANNELS.length}`);
    console.log('\n  Channel IDs:');
    for (const [name, id] of Object.entries(createdChannels)) {
      console.log(`    #${name}: ${id}`);
    }
    console.log('');

    await client.destroy();
    process.exit(0);

  } catch (error) {
    console.error('\nERROR:', error.message);

    if (error.code === 'TokenInvalid') {
      console.error('Your DISCORD_BOT_TOKEN is invalid. Generate a new one at https://discord.com/developers');
    }
    if (error.code === 50013) {
      console.error('Bot lacks permissions. Ensure it has Manage Channels and Manage Roles.');
    }

    await client.destroy();
    process.exit(1);
  }
}

setupDiscord();
