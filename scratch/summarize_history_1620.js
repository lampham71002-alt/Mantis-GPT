const fs = require('fs');

const data = JSON.parse(fs.readFileSync('reports/history_1643_logs.json', 'utf8')).data || [];
console.log(`Total jobs in History 1620: ${data.length}`);

const summary = data.map((item, idx) => ({
  index: idx + 1,
  jobId: item.item?.id,
  customerName: (item.customer?.full_name || item.customer?.name || '').trim(),
  customerId: item.customer?.id,
  serviceName: item.item?.name,
  currentSchedule: item.from?.schedules?.[0]?.name,
  scheduleId: item.from?.schedules?.[0]?.id,
  startTime: item.from?.start,
  address: item.location?.service_address
}));

fs.writeFileSync('reports/history_1620_jobs_list.json', JSON.stringify(summary, null, 2));

console.log('Unique customers in History 1620:');
const uniqueCustomers = [...new Set(summary.map(s => s.customerName))];
console.log(uniqueCustomers.join(', '));
console.log(`\nUnique services: ${[...new Set(summary.map(s => s.serviceName))].join(', ')}`);
console.log(`Unique dates: ${[...new Set(summary.map(s => s.startTime ? s.startTime.substring(0, 10) : 'unknown'))].join(', ')}`);
