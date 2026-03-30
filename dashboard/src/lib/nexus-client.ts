/**
 * nexus-client.ts — Pont entre le dashboard Next.js et le runtime NEXUS
 *
 * Permet d'appeler l'orchestrateur NEXUS directement depuis le process Node.js
 * sans passer par un round-trip HTTP. Le module runtime est chargé dynamiquement
 * pour éviter les erreurs de build (le runtime utilise des modules Node.js natifs).
 */

export interface NexusResult {
  success: boolean
  content: string
  model: string
  complexity: number
  toolsUsed: string[]
  iterations: number
  usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null
  costUsd?: number
  durationMs: number
  warning?: string
  error?: string
}

export interface NexusCallOptions {
  tenantId?: string | null
  model?: string
  sessionId?: string
  history?: Array<{ role: string; content: string }>
  temperature?: number
  maxTokens?: number
}

// Instance singleton (lazy-init pour éviter le chargement au build)
let _nexus: any = null

function getNexusInstance() {
  if (!_nexus) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Nexus } = require('../../runtime/nexus')
    _nexus = Nexus.fromEnv()
  }
  return _nexus
}

/**
 * Envoie une requête à NEXUS et retourne sa réponse.
 *
 * @param input    - Le message utilisateur
 * @param options  - Options de contexte (tenantId, model, historique...)
 */
export async function callNexus(input: string, options: NexusCallOptions = {}): Promise<NexusResult> {
  const { tenantId = null, ...context } = options
  const nexus = getNexusInstance()
  return nexus.process(input, tenantId, context) as Promise<NexusResult>
}

/**
 * Vérifie si un agent cible doit être routé vers NEXUS.
 * Noms reconnus (insensible à la casse) : nexus, nexus-ai, anima-nexus
 */
export function isNexusTarget(agentName: string | null | undefined): boolean {
  if (!agentName) return false
  const name = agentName.toLowerCase().trim()
  return name === 'nexus' || name === 'nexus-ai' || name === 'anima-nexus'
}
