const TOKEN = '1z8poBmPrckA2J2YMBToxWzIxs2UBmt7XXuaFXWmCQWEwiLicLxeKWiOCzxdG1HgTy25bRQ9j4tBioKhUDTnxYdGN5HmTWWO75iJ1Uqzy42Ed2tZ18HW30s4WU6EK4ux843614451791260718';
const BASE_URL = 'https://apiv2.gdesk.io';

(async () => {
  const url = BASE_URL + '/api/routing/mantis/autopilot/jobs?agenda=agenda3Weeks&color_id=1&end=2026-10-24T23%3A59%3A59.999Z&inc=recurring&schedule_ids=31&start=2026-10-04T00%3A00%3A00.000Z';
  const res = await fetch(url, { headers: { token: TOKEN } });
  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim());
  let finalEvents = [];
  for (const l of lines) {
    try {
      const p = JSON.parse(l);
      if (p.type === 'events' && Array.isArray(p.items)) {
        finalEvents = p.items;
      }
    } catch(e) {}
  }
  console.log('Total events in autopilot:', finalEvents.length);
  const byDate = {};
  finalEvents.forEach(e => {
    const d = e.date_label || (e.event?.start || '').slice(0, 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push({
      id: e.job?.id,
      customer: e.customer?.name || e.map_tiles?.find(m => m.field === 'customer_name')?.value,
      service: e.job_tiles?.find(t => t.field === 'service_type' || t.field === 'service')?.value || e.job?.title,
      start: e.event?.start,
      time: e.tile?.header
    });
  });
  console.log('Events by date:');
  for (const [date, jobs] of Object.entries(byDate)) {
    console.log(`=== Date: ${date} (${jobs.length} jobs) ===`);
    jobs.forEach((j, i) => console.log(`  ${i+1}. [Job ${j.id}] Customer: "${j.customer}" | Service: "${j.service}" | Time: "${j.time || j.start}"`));
  }
})();
