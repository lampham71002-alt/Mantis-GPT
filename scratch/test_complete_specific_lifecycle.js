const fs = require('fs');
const auth = JSON.parse(fs.readFileSync('reports/lam_pham_auth.json', 'utf8'));

async function testCompleteFlow() {
  const convUrl = 'https://apiv2.gdesk.io/api/routing/mantis/specific-rules/conversations';
  const prompt = 'For customer Specific test in this optimization run, schedule all jobs as the first stop of the day.';
  const payload = {
    message: prompt,
    conversation_id: null,
    history_id: 1581
  };

  console.log('1. Calling conversation endpoint...');
  const res = await fetch(convUrl, {
    method: 'POST',
    headers: {
      'token': auth.token,
      'gd-branch-id': auth.branchId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  let conversationId = null;
  let executableLogic = null;

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.conversation_id) conversationId = parsed.conversation_id;
      if (parsed.type === 'executable_logic') executableLogic = parsed.value;
    } catch(e) {}
  }

  console.log('Captured conversationId:', conversationId);
  console.log('Captured executableLogic:', JSON.stringify(executableLogic, null, 2));

  if (!conversationId || !executableLogic) {
    console.error('Failed to parse conversation response');
    return;
  }

  // Ensure history_id is set
  executableLogic.history_id = 1581;

  console.log('2. Calling verify endpoint to save rule...');
  const verifyUrl = 'https://apiv2.gdesk.io/api/routing/mantis/specific-rules/verify';
  const verifyRes = await fetch(verifyUrl, {
    method: 'POST',
    headers: {
      'token': auth.token,
      'gd-branch-id': auth.branchId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      executable_logic: executableLogic,
      conversation_id: conversationId
    })
  }).then(r => r.json());

  console.log('Verify response:', JSON.stringify(verifyRes, null, 2));
  const ruleId = verifyRes.data?.id;

  if (ruleId) {
    console.log(`3. Toggling rule ${ruleId} ON (status: 1)...`);
    const statusUrl = `https://apiv2.gdesk.io/api/routing/mantis/specific-rules/${ruleId}/status`;
    const onRes = await fetch(statusUrl, {
      method: 'PUT',
      headers: {
        'token': auth.token,
        'gd-branch-id': auth.branchId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 1 })
    }).then(r => r.json());
    console.log('ON response:', JSON.stringify(onRes));

    console.log(`4. Toggling rule ${ruleId} OFF (status: 0)...`);
    const offRes = await fetch(statusUrl, {
      method: 'PUT',
      headers: {
        'token': auth.token,
        'gd-branch-id': auth.branchId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 0 })
    }).then(r => r.json());
    console.log('OFF response:', JSON.stringify(offRes));
  }
}

testCompleteFlow().catch(console.error);
