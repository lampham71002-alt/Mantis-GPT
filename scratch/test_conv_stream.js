const fs = require('fs');
const auth = JSON.parse(fs.readFileSync('reports/lam_pham_auth.json', 'utf8'));

async function testConversation() {
  const url = 'https://apiv2.gdesk.io/api/routing/mantis/specific-rules/conversations';
  const prompt = 'For customer Specific test in this optimization run, schedule all jobs as the first stop of the day.';
  const payload = {
    message: prompt,
    conversation_id: null,
    history_id: 1581
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'token': auth.token,
      'gd-branch-id': auth.branchId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log('Conversation raw text sample:\n', text.slice(0, 1500));
}
testConversation().catch(console.error);
