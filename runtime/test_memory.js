// Chemin : c:/Users/dell/Documents/AI/anima/AnimaClaw/runtime/test_memory.js
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// 1. 🕵️ DIAGNOSTIC ET CHARGEMENT DU .ENV
const envPath = path.resolve(__dirname, '../.env');
console.log("--- 🕵️ DIAGNOSTIC SYSTÈME ---");

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log("✅ Fichier .env chargé avec succès.");
} else {
    console.error("❌ ERREUR : Le fichier .env est INTROUVABLE à la racine.");
    process.exit(1);
}

// 2. 🔑 RÉCUPÉRATION DES CLÉS (Noms confirmés par ton terminal)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERREUR : Les clés SUPABASE_URL ou SUPABASE_SERVICE_KEY sont vides.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 3. 🧠 FONCTION : GÉNÉRATION DU PROMPT (L'intelligence de l'agent)
function generateAIPrompt(knowledge, userQuestion) {
    const context = knowledge.map(k => k.content).join('\n');
    
    return `
### SYSTEM INSTRUCTIONS
Tu es l'assistant de vente de Studio Argile. 
Utilise EXCLUSIVEMENT les informations suivantes pour répondre :
------------------
${context}
------------------

### CLIENT QUESTION
"${userQuestion}"

### TA RÉPONSE (Format court et chaleureux) :
`;
}

// 4. 🚀 FONCTION PRINCIPALE : TEST DE MÉMOIRE
async function testAgentMemory(tenantId) {
    console.log(`\n--- 🔍 RÉCUPÉRATION MÉMOIRE POUR [${tenantId}] ---`);

    // Lecture dans la base de données
    const { data: knowledge, error } = await supabase
        .from('anima_agent_logs')
        .select('content, metadata')
        .eq('tenant_id', tenantId)
        .eq('type', 'KNOWLEDGE');

    if (error) {
        console.error("❌ Erreur Supabase :", error.message);
        return;
    }

    if (!knowledge || knowledge.length === 0) {
        console.log("⚠️ Aucune donnée trouvée en base pour ce client.");
        return;
    }

    console.log(`✅ ${knowledge.length} briques de savoir extraites de la DB.`);

    // Simulation d'une question client
    const userQuestion = "Salam ! Je suis à Oran, je veux le mug noir, ça me coûte combien en tout ?";
    
    // Génération du prompt final
    const finalPrompt = generateAIPrompt(knowledge, userQuestion);
    
    console.log("\n--- 🧠 PROMPT FINAL PRÊT POUR L'IA ---");
    console.log(finalPrompt);
    
    console.log("\n--- ✨ TEST DE STRUCTURE TERMINÉ AVEC SUCCÈS ---");
}

// Lancement du test
testAgentMemory('studio_argile');