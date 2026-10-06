const fs = require('fs');

const TOKEN = '1z8poBmPrckA2J2YMBToxWzIxs2UBmt7XXuaFXWmCQWEwiLicLxeKWiOCzxdG1HgTy25bRQ9j4tBioKhUDTnxYdGN5HmTWWO75iJ1Uqzy42Ed2tZ18HW30s4WU6EK4ux843614451791260718';
const BASE_URL = 'https://apiv2.gdesk.io';

async function testAllCustomRuleActionsText() {
  console.log('=== STARTING LIVE CUSTOM RULE ACTIONS (TEXT PARSE SAFE) ===');
  
  const testPrompts = [
    { type: 'time_window', prompt: 'All jobs in Region 1 must start exactly at 8:00 AM' },
    { type: 'first_stop', prompt: 'Jobs assigned to customer Messi must be the first stop of the day' },
    { type: 'last_stop', prompt: 'All jobs located in Region 2 must be scheduled as the last stop' },
    { type: 'lock', prompt: 'Lock all jobs on 6 Tue to technician Lam' },
    { type: 'exclude', prompt: 'Exclude technician Lam from servicing jobs in Region 2' },
    { type: 'arrival_window_duration', prompt: 'Arrival window duration for all jobs in Region 1 must be 2 hours' },
    { type: 'prefer_tech', prompt: 'Prefer technician Lam for all pest control jobs' },
    { type: 'force_tech', prompt: 'Force technician Lam for all jobs in Region 1' },
    { type: 'keep_period', prompt: 'Jobs can move at most 2 days from their original date' }
  ];

  const results = [];

  for (const item of testPrompts) {
    console.log(`\n---> Testing Rule Action: ${item.type}`);
    try {
      const convRes = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': TOKEN
        },
        body: JSON.stringify({ message: item.prompt, conversation_id: null })
      });

      const text = await convRes.text();
      console.log(`Status: ${convRes.status} | Length: ${text.length}`);

      results.push({
        action: item.type,
        prompt: item.prompt,
        httpStatus: convRes.status,
        responseSnippet: text.substring(0, 200)
      });
    } catch (err) {
      console.error(`Error testing ${item.type}:`, err.message);
      results.push({
        action: item.type,
        prompt: item.prompt,
        error: err.message
      });
    }
  }

  fs.writeFileSync('scratch/live_rule_results_text.json', JSON.stringify(results, null, 2));
  console.log('\n=== COMPLETED SUCCESSFULLY ===');
}

testAllCustomRuleActionsText();
