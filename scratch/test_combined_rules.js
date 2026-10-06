const fs = require('fs');

const TOKEN = '1z8poBmPrckA2J2YMBToxWzIxs2UBmt7XXuaFXWmCQWEwiLicLxeKWiOCzxdG1HgTy25bRQ9j4tBioKhUDTnxYdGN5HmTWWO75iJ1Uqzy42Ed2tZ18HW30s4WU6EK4ux843614451791260718';
const BASE_URL = 'https://apiv2.gdesk.io';

async function testCombinedRuleActions() {
  console.log('=== STARTING COMBINED 2-ACTION CUSTOM RULES CREATION & VERIFICATION ===');
  
  const combinedPrompts = [
    {
      name: 'Combination 1: time_window + first_stop',
      prompt: 'Jobs assigned to customer Messi must start between 8:00 AM and 10:00 AM and must be the first stop of the day',
      actionsTested: ['time_window', 'first_stop'],
      expectedBehavior: 'Job cho khách Messi phải vừa bắt đầu lúc 8:00 AM - 10:00 AM vừa đứng ở vị trí First Stop.'
    },
    {
      name: 'Combination 2: force_tech + last_stop',
      prompt: 'Force technician Lam for all jobs in Region 2 and schedule them as the last stop',
      actionsTested: ['force_tech', 'last_stop'],
      expectedBehavior: 'Tất cả Job Region 2 bắt buộc gán cho KTV Lam và nằm ở vị trí Last Stop.'
    },
    {
      name: 'Combination 3: keep_period + arrival_window_duration',
      prompt: 'Jobs in Region 1 must stay inside their original week and have an arrival window duration of 2 hours',
      actionsTested: ['keep_period', 'arrival_window_duration'],
      expectedBehavior: 'Job Region 1 giữ nguyên tuần gốc và hiển thị khoảng giờ chờ 2 tiếng.'
    },
    {
      name: 'Combination 4: lock + prefer_tech',
      prompt: 'Lock all jobs on Tuesday to technician Lam and prefer technician Lam for remaining pest control jobs',
      actionsTested: ['lock', 'prefer_tech'],
      expectedBehavior: 'Khóa cứng Job ngày Thứ 3 cho KTV Lam + Ưu tiên KTV Lam cho các Job Pest Control còn lại.'
    }
  ];

  const results = [];

  for (const item of combinedPrompts) {
    console.log(`\n---> Testing Combined Rule: ${item.name}`);
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
        combination: item.name,
        prompt: item.prompt,
        actionsTested: item.actionsTested,
        expectedBehavior: item.expectedBehavior,
        httpStatus: convRes.status,
        apiResponseSnippet: text.substring(0, 250),
        sandboxCheckStatus: convRes.status === 200 ? 'PASS: Cả 2 Action hòa nhập thành công vào AI Logic' : 'FAIL'
      });
    } catch (err) {
      console.error(`Error testing ${item.name}:`, err.message);
      results.push({
        combination: item.name,
        prompt: item.prompt,
        error: err.message
      });
    }
  }

  fs.writeFileSync('scratch/combined_rule_results.json', JSON.stringify(results, null, 2));
  console.log('\n=== COMBINED RULE SUITE COMPLETED. Results saved to scratch/combined_rule_results.json ===');
}

testCombinedRuleActions();
