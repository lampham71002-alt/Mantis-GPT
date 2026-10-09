const fs = require('fs');
const auth = JSON.parse(fs.readFileSync('reports/lam_pham_auth.json', 'utf8'));

async function testTurn2Compiler() {
  const prompt = 'For customer Specific test in this optimization run, schedule Initial Service jobs between 1:00 PM and 5:00 PM and make them the last stop of the day.';
  console.log('Sending prompt:', prompt);

  const res1 = await fetch('https://apiv2.gdesk.io/api/routing/mantis/specific-rules/conversations', {
    method: 'POST',
    headers: { 'token': auth.token, 'gd-branch-id': auth.branchId, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt, conversation_id: null, history_id: 1581 })
  });
  const text1 = await res1.text();
  let conversationId = null;
  let logic = null;
  for (const line of text1.split('\n')) {
    try {
      const p = JSON.parse(line);
      if (p.conversation_id) conversationId = p.conversation_id;
      if (p.type === 'executable_logic') logic = p.value;
    } catch(e) {}
  }
  console.log('Turn 1 - conversationId:', conversationId);
  console.log('Turn 1 - logic present:', !!logic);

  if (!logic && conversationId) {
    console.log('Turn 2 - Sending confirmation to finalize...');
    const res2 = await fetch('https://apiv2.gdesk.io/api/routing/mantis/specific-rules/conversations', {
      method: 'POST',
      headers: { 'token': auth.token, 'gd-branch-id': auth.branchId, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'confirm and apply', conversation_id: conversationId, history_id: 1581 })
    });
    const text2 = await res2.text();
    for (const line of text2.split('\n')) {
      try {
        const p = JSON.parse(line);
        if (p.type === 'executable_logic') logic = p.value;
      } catch(e) {}
    }
    console.log('Turn 2 - logic present:', !!logic);
    if (logic) console.log('Final logic:', JSON.stringify(logic, null, 2));
  }
}
testTurn2Compiler().catch(console.error);
