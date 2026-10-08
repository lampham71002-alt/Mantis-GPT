const TOKEN = '1z8poBmPrckA2J2YMBToxWzIxs2UBmt7XXuaFXWmCQWEwiLicLxeKWiOCzxdG1HgTy25bRQ9j4tBioKhUDTnxYdGN5HmTWWO75iJ1Uqzy42Ed2tZ18HW30s4WU6EK4ux843614451791260718';
const BASE_URL = 'https://apiv2.gdesk.io';

(async () => {
  const map = [];
  for (const s of ['31', '32', '89']) {
    const url = BASE_URL + '/api/jobs?schedule=' + s + '&start=2026-10-01T00:00:00.000Z&end=2026-10-31T23:59:59.000Z';
    const res = await fetch(url, { headers: { token: TOKEN } });
    const data = await res.json();
    (data.data || []).forEach(j => {
      const srv = j.job_tiles?.find(t => t.field === 'service_type' || t.field === 'service')?.value || j.job?.title || '';
      const cust = (j.customer?.name || j.map_tiles?.find(m => m.field === 'customer_name')?.value || '').trim();
      map.push({ id: j.job?.id, service: srv, customer: cust, schedule: s, date: j.date_label, time: j.event?.start });
    });
  }
  console.log('Total jobs:', map.length);
  map.forEach(m => console.log(`[Job ${m.id}] Service: "${m.service}" | Customer: "${m.customer}" | Date: ${m.date} | Schedule: ${m.schedule}`));
})();
