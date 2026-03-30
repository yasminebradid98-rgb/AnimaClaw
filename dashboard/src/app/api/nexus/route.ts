/**
 * NEXUS API — Point d'entrée REST pour l'orchestrateur central
 * POST /api/nexus
 *
 * Body:
 *   {
 *     input:    string       — requête utilisateur (obligatoire)
 *     tenantId: string       — ID du tenant (optionnel, pour isolation données)
 *     context?: {
 *       model?:       string   — forcer un modèle spécifique
 *       sessionId?:   string   — ID de session pour le suivi
 *       history?:     Array    — historique de messages [{ role, content }]
 *       temperature?: number   — température LLM (0-1)
 *       maxTokens?:   number   — max tokens de réponse
 *     }
 *   }
 *
 * Response:
 *   {
 *     success:    boolean
 *     content:    string    — réponse de NEXUS
 *     model:      string    — modèle utilisé
 *     complexity: number    — score 0-1
 *     toolsUsed:  string[]
 *     iterations: number
 *     usage:      { promptTokens, completionTokens, totalTokens }
 *     costUsd:    number
 *     durationMs: number
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';

// NEXUS tourne dans le runtime Node.js (pas edge)
export const runtime = 'nodejs';
export const maxDuration = 120;

// Lazy-load pour éviter les imports au build time
let nexusInstance: any = null;

function getNexus() {
  if (!nexusInstance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Nexus } = require('../../../../runtime/nexus');
    nexusInstance = Nexus.fromEnv();
  }
  return nexusInstance;
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const { input, tenantId, context = {} } = body;

  if (!input || typeof input !== 'string' || !input.trim()) {
    return NextResponse.json({ error: '"input" est obligatoire.' }, { status: 400 });
  }

  try {
    const nexus = getNexus();
    const result = await nexus.process(input.trim(), tenantId || null, context);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: any) {
    console.error('[/api/nexus] Erreur:', err.message);
    return NextResponse.json(
      { success: false, error: err.message, content: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// GET — santé et info
export async function GET() {
  const { NEXUS_VERSION, MODELS, COMPLEXITY_THRESHOLD } = require('../../../../runtime/nexus');
  const { listTools } = require('../../../../runtime/tool_registry');

  return NextResponse.json({
    status:               'online',
    version:              NEXUS_VERSION,
    models:               MODELS,
    complexityThreshold:  COMPLEXITY_THRESHOLD,
    availableTools:       listTools(),
  });
}
