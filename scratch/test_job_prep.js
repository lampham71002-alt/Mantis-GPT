async function testPrep() {
  const loginRes = await fetch('https://stage-api.mantishub.io/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'lam.pham@gmail.com', password: 'Ahihi123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  const branchId = 'GD1LK8RC5OH0';
  const headers = {
    Authorization: `Bearer ${token}`,
    'x-branch': branchId,
    'x-branch-id': branchId,
    'Content-Type': 'application/json'
  };

  // 1. Fetch location for customer 1567
  const locRes = await fetch('https://stage-api.mantishub.io/api/customers/1567/locations/simplify', { headers });
  const locData = await locRes.json();
  console.log('Location simplify for 1567:', JSON.stringify(locData.data));

  // 2. Fetch schedules/technicians
  const schedRes = await fetch('https://stage-api.mantishub.io/api/schedules', { headers });
  const schedData = await schedRes.json();
  console.log('Schedules count:', schedData.data ? schedData.data.length : 'none');
  if (schedData.data) {
    schedData.data.forEach(s => console.log(`Schedule ID: ${s.id}, Name: ${s.name}, Tech: ${s.user_id}`));
  }
}

testPrep().catch(err => console.error(err));
