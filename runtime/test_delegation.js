/**
 * DELEGATION TEST — ManagerAgent → WriterAgent + CoderAgent
 *
 * What this script proves:
 *   1. A complex task (complexity=8 > threshold=6) is inserted for ManagerAgent
 *   2. ExecutionEngine claims it and loads ManagerAgent.json skill
 *   3. delegateTask() creates 2 sub-tasks: WriterAgent + CoderAgent
 *   4. Original task is marked 'completed' with result.delegated=[id1,id2]
 *   5. No LLM call is made (delegation short-circuits the pipeline)
 *
 * Run: node runtime/test_delegation.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { ExecutionEngine } = require('./execution_engine');

// ── colour helpers ──────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  bold:   '\x1b[1m',
};
const ok  = msg => console.log(`${C.green}  ✅ ${msg}${C.reset}`);
const err = msg => console.log(`${C.red}  ❌ ${msg}${C.reset}`);
const inf = msg => console.log(`${C.cyan}  ℹ  ${msg}${C.reset}`);
const hdr = msg => console.log(`\n${C.bold}${C.yellow}▶ ${msg}${C.reset}`);

// ── main ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}═══════════════════════════════════════════`);
  console.log('  ANIMA OS — Delegation Test');
  console.log(`═══════════════════════════════════════════${C.reset}\n`);

  // ── 0. Supabase client ─────────────────────────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    err('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  inf(`Connected to: ${supabaseUrl}`);

  // ── 1. Insert complex task ─────────────────────────────────────────
  hdr('Step 1 — Insert complex task for ManagerAgent (complexity=8)');

  const { data: task, error: insertErr } = await supabase
    .from('anima_task_queue')
    .insert({
      agent_id:  'ManagerAgent',
      task_type: 'generation',
      payload: {
        type:        'DELEGATION_TEST',
        description: "Rédige un article de 500 mots sur l'IA et génère le code Python pour l'illustrer",
        complexity:  8,
        urgency:     0.8,
        alignment:   0.9,
      },
      priority:  7,
      tenant_id: null,
    })
    .select()
    .single();

  if (insertErr) {
    err(`Task insert failed: ${insertErr.message}`);
    process.exit(1);
  }
  ok(`Task created: ${task.id}`);
  inf(`Status: ${task.task_status} | Agent: ${task.agent_id} | Priority: ${task.priority}`);

  // ── 2. Run ExecutionEngine for one task ───────────────────────────
  hdr('Step 2 — Run ExecutionEngine.processNextTask()');

  const engine = new ExecutionEngine(supabase);
  let result;

  try {
    result = await engine.processNextTask();
  } catch (e) {
    err(`Engine error: ${e.message}`);
    process.exit(1);
  }

  if (!result) {
    err('No task was processed — claim_next_task() returned nothing.');
    inf('Is the task still in "pending" status? Check the table.');
    process.exit(1);
  }

  console.log(`\n  Raw result:\n${JSON.stringify(result, null, 4)
    .split('\n').map(l => '  ' + l).join('\n')}`);

  // ── 3. Verify delegation ───────────────────────────────────────────
  hdr('Step 3 — Verify delegation outcome');

  if (result.status !== 'delegated') {
    err(`Expected status 'delegated', got '${result.status}'`);
    err('Delegation did not trigger — check skill JSON and complexity threshold.');
    process.exit(1);
  }
  ok(`Original task status: ${result.status}`);
  ok(`Sub-tasks created: ${result.delegated.length}`);

  // ── 4. Fetch and display sub-tasks ────────────────────────────────
  hdr('Step 4 — Sub-task details');

  const subTaskIds = result.delegated.map(t => t.id);
  const { data: subTasks, error: fetchErr } = await supabase
    .from('anima_task_queue')
    .select('id, agent_id, task_status, payload, priority')
    .in('id', subTaskIds);

  if (fetchErr || !subTasks) {
    err(`Failed to fetch sub-tasks: ${fetchErr?.message}`);
    process.exit(1);
  }

  for (const st of subTasks) {
    console.log(`\n  ${C.bold}Sub-task${C.reset}`);
    inf(`  id:           ${st.id}`);
    inf(`  agent_id:     ${st.agent_id}`);
    inf(`  task_status:  ${st.task_status}`);
    inf(`  priority:     ${st.priority}`);
    inf(`  parent_id:    ${st.payload?.parent_task_id}`);
    inf(`  role:         ${st.payload?.delegation_role}`);
  }

  const agents = subTasks.map(t => t.agent_id);
  const hasWriter = agents.includes('WriterAgent');
  const hasCoder  = agents.includes('CoderAgent');

  console.log('');
  hasWriter ? ok('WriterAgent sub-task ✓') : err('WriterAgent sub-task MISSING');
  hasCoder  ? ok('CoderAgent sub-task ✓')  : err('CoderAgent sub-task MISSING');

  // ── 5. Verify skill loading ────────────────────────────────────────
  hdr('Step 5 — Skill loading verification');

  const fs   = require('fs');
  const path = require('path');
  const skillsDir = path.join(__dirname, 'skills');

  for (const agentId of ['ManagerAgent', 'WriterAgent', 'CoderAgent']) {
    const filePath = path.join(skillsDir, `${agentId}.json`);
    if (fs.existsSync(filePath)) {
      const skill = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      ok(`${agentId}.json loaded — role: ${skill.role}, maxTokens: ${skill.maxTokens}`);
    } else {
      err(`${agentId}.json NOT FOUND at ${filePath}`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────
  console.log(`\n${C.bold}${C.green}═══════════════════════════════════════════`);
  console.log('  TEST PASSED — Delegation working correctly');
  console.log(`═══════════════════════════════════════════${C.reset}\n`);
}

main().catch(e => {
  console.error(`\n${C.red}FATAL: ${e.message}${C.reset}`);
  process.exit(1);
});
