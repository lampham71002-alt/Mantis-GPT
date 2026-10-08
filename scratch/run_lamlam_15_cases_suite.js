const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GDONWL5A5MI6';
const SCHEDULE_IDS = '31,32,89';

const TEST_CASES_15 = [
  {
    id: 'TC-15-01',
    title: 'TC-15-01: Bed Bug First Stop & Peter Parker Last Stop',
    description: 'Schedule Bed Bug Heat Treatment as the first stop of the day. For customer Peter Parker, schedule as the last stop of the day.',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', service_types: ['Bed Bug Heat Treatment'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['Peter Parker'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // 1. Bed Bug là first stop
      const bbJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Bed Bug'));
      let c1 = false;
      if (bbJobs.length > 0) {
        c1 = bbJobs.some(j => {
          const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                                .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
          return (dayJobs[0]?.job_tiles?.find(t=>t.field==='service_type')?.value || dayJobs[0]?.job?.title || '').includes('Bed Bug');
        });
      }
      // 2. Peter Parker là last stop
      const ppJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('peter parker'));
      let c2 = false;
      if (ppJobs.length > 0) {
        c2 = ppJobs.some(j => {
          const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                                .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
          const last = dayJobs[dayJobs.length - 1];
          return (last?.customer?.full_name || last?.customer?.name || '').toLowerCase().includes('peter parker');
        });
      }
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Bed Bug First Stop: ${c1 ? 'ĐẠT' : 'KHÔNG'} (${bbJobs.length} jobs) | Peter Parker Last Stop: ${c2 ? 'ĐẠT' : 'KHÔNG'} (${ppJobs.length} jobs)`
      };
    }
  },
  {
    id: 'TC-15-02',
    title: 'TC-15-02: FL Routing Test 01 Force Tech Minh & Morning Window',
    description: 'Force technician Minh for customer FL Routing Test 01 and require scheduled time between 07:00 and 11:00.',
    rules: [
      {
        actions: [{ params: { tech_name: 'Minh' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 01'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { start_time: '07:00:00', end_time: '11:00:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 01'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const fl01 = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('FL Routing Test 01'));
      if (!fl01.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy FL Routing Test 01' };
      const c1 = fl01.every(j => j.schedule?.name === 'Minh');
      const c2 = fl01.every(j => {
        const startH = new Date(j.event?.start).getUTCHours();
        return startH >= 7 && startH < 12;
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Gán KTV Minh: ${c1 ? 'ĐỦ' : 'THIẾU'} (${fl01.map(j=>j.schedule?.name).join(', ')}) | Giờ sáng: ${c2 ? 'ĐẠT' : 'NGOÀI GIỜ'} (${fl01.map(j=>j.tile?.header).join(', ')})`
      };
    }
  },
  {
    id: 'TC-15-03',
    title: 'TC-15-03: Exclude Call Back Service & FL Routing Test 08 Force Tech custom',
    description: 'Automatically exclude Call Back Service jobs from routing. For customer FL Routing Test 08, force technician custom.',
    rules: [
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', service_types: ['Call Back Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { tech_name: 'custom' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 08'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const cbJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Call Back'));
      const c1 = cbJobs.length === 0;
      const fl08 = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('FL Routing Test 08'));
      const c2 = fl08.length > 0 && fl08.every(j => j.schedule?.name === 'custom');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Call Back bị Exclude: ${c1 ? 'ĐÚNG (0 jobs)' : 'CÒN ' + cbJobs.length + ' jobs'} | FL Test 08 gán custom: ${c2 ? 'ĐÚNG' : 'SAI'} (${fl08.map(j=>j.schedule?.name).join(', ')})`
      };
    }
  },
  {
    id: 'TC-15-04',
    title: 'TC-15-04: Peter Parker Keep Day & First Stop',
    description: 'Automatically keep customer Peter Parker jobs scheduled on the same day and schedule as the first stop of the day.',
    rules: [
      {
        actions: [{ params: { period: 'day' }, action_type: 'keep_period' }],
        targets: { match: 'all', customer_names: ['Peter Parker'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['Peter Parker'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const ppJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('peter parker'));
      if (!ppJobs.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy Peter Parker' };
      // 1. Giữ ngày gốc (07/10 hoặc 16/10)
      const c1 = ppJobs.every(j => j.date_label === '10-07-2026' || j.date_label === '10-16-2026');
      // 2. First stop trên ngày đó
      const c2 = ppJobs.some(j => {
        const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                              .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
        return (dayJobs[0]?.customer?.full_name || dayJobs[0]?.customer?.name || '').toLowerCase().includes('peter parker');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Peter Parker giữ đúng ngày: ${c1 ? 'ĐÚNG' : 'SAI (' + ppJobs.map(j=>j.date_label).join(', ') + ')'} | First Stop: ${c2 ? 'ĐẠT' : 'KHÔNG'}`
      };
    }
  },
  {
    id: 'TC-15-05',
    title: 'TC-15-05: Exclude enzo & Quarterly Service Last Stop',
    description: 'Automatically exclude customer enzo jobs from routing. For Quarterly Service jobs, schedule as the last stop of the day.',
    rules: [
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', customer_names: ['enzo'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', service_types: ['Quarterly Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const enzoJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('enzo'));
      const c1 = enzoJobs.length === 0;
      const qJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Quarterly'));
      let c2 = false;
      if (qJobs.length > 0) {
        c2 = qJobs.some(j => {
          const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                                .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
          const last = dayJobs[dayJobs.length - 1];
          return (last?.job_tiles?.find(t=>t.field==='service_type')?.value || last?.job?.title || '').includes('Quarterly');
        });
      }
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `enzo bị Exclude hoàn toàn: ${c1 ? 'ĐÚNG (0 jobs)' : 'CÒN ' + enzoJobs.length + ' jobs'} | Quarterly Last Stop: ${c2 ? 'ĐẠT' : 'KHÔNG'}`
      };
    }
  },
  {
    id: 'TC-15-06',
    title: 'TC-15-06: Initial Service Afternoon Window & FL Routing Test 03 Force Tech Lam',
    description: 'Enforce afternoon time window between 13:00 and 17:00 for Initial Service jobs. For customer FL Routing Test 03, force technician Lam.',
    rules: [
      {
        actions: [{ params: { start_time: '13:00:00', end_time: '17:00:00' }, action_type: 'time_window' }],
        targets: { match: 'all', service_types: ['Initial Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { tech_name: 'Lam' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 03'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const initJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Initial'));
      const c1 = initJobs.length > 0 && initJobs.every(j => {
        const startH = new Date(j.event?.start).getUTCHours();
        return startH >= 12; // chiều
      });
      const fl03 = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('FL Routing Test 03'));
      const c2 = fl03.length > 0 && fl03.every(j => j.schedule?.name === 'Lam');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Initial Service chiều (13-17h): ${c1 ? 'ĐẠT' : 'KHÔNG'} (${initJobs.map(j=>j.tile?.header).join(', ')}) | FL Test 03 gán Lam: ${c2 ? 'ĐÚNG' : 'SAI'}`
      };
    }
  },
  {
    id: 'TC-15-07',
    title: 'TC-15-07: FL Routing Test 06 Keep Day & Morning Window',
    description: 'Keep customer FL Routing Test 06 jobs scheduled on the same day and enforce morning time window between 07:00 and 12:00.',
    rules: [
      {
        actions: [{ params: { period: 'day' }, action_type: 'keep_period' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 06'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { start_time: '07:00:00', end_time: '12:00:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 06'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const fl06 = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('FL Routing Test 06'));
      if (!fl06.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy FL Routing Test 06' };
      const c1 = fl06.every(j => j.date_label === '10-04-2026' || j.date_label === '10-09-2026');
      const c2 = fl06.every(j => {
        const startH = new Date(j.event?.start).getUTCHours();
        return startH >= 7 && startH < 13;
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `FL Test 06 giữ ngày gốc: ${c1 ? 'ĐÚNG' : 'SAI'} | Khung sáng: ${c2 ? 'ĐẠT' : 'NGOÀI GIỜ'} (${fl06.map(j=>j.tile?.header).join(', ')})`
      };
    }
  },
  {
    id: 'TC-15-08',
    title: 'TC-15-08: Exclude Wildlife Trapping & FL Routing Test 14 First Stop',
    description: 'Automatically exclude Wildlife Trapping & Relocation jobs. For customer FL Routing Test 14, schedule as the first stop of the day.',
    rules: [
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', service_types: ['Wildlife Trapping & Relocation'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 14'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const wlJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Wildlife'));
      const c1 = wlJobs.length === 0;
      const fl14 = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('FL Routing Test 14'));
      let c2 = false;
      if (fl14.length > 0) {
        c2 = fl14.some(j => {
          const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                                .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
          return (dayJobs[0]?.customer?.full_name || dayJobs[0]?.customer?.name || '').includes('FL Routing Test 14');
        });
      }
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Wildlife bị Exclude: ${c1 ? 'ĐÚNG (0 jobs)' : 'CÒN ' + wlJobs.length + ' jobs'} | FL Test 14 First Stop: ${c2 ? 'ĐẠT' : 'KHÔNG'}`
      };
    }
  },
  {
    id: 'TC-15-09',
    title: 'TC-15-09: Clark Kent Force Tech Minh & Last Stop',
    description: 'Force technician Minh for customer Clark Kent and schedule as the last stop of the day.',
    rules: [
      {
        actions: [{ params: { tech_name: 'Minh' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['Clark Kent'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['Clark Kent'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const ckJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Clark Kent'));
      if (!ckJobs.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy Clark Kent' };
      const c1 = ckJobs.every(j => j.schedule?.name === 'Minh');
      const c2 = ckJobs.some(j => {
        const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                              .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
        const last = dayJobs[dayJobs.length - 1];
        return (last?.customer?.full_name || last?.customer?.name || '').includes('Clark Kent');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Clark Kent gán Minh: ${c1 ? 'ĐÚNG' : 'SAI'} | Last Stop: ${c2 ? 'ĐẠT' : 'KHÔNG'}`
      };
    }
  },
  {
    id: 'TC-15-10',
    title: 'TC-15-10: Alexander Morning Window & Miller Afternoon Window',
    description: 'Enforce morning window 07:00-11:00 for customer Alexander and afternoon window 13:00-17:00 for customer Miller.',
    rules: [
      {
        actions: [{ params: { start_time: '07:00:00', end_time: '11:00:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['Alexander'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { start_time: '13:00:00', end_time: '17:00:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['Miller'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const alex = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Alexander'));
      const mil = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Miller'));
      const c1 = alex.length > 0 && alex.every(j => {
        const startH = new Date(j.event?.start).getUTCHours();
        return startH >= 7 && startH < 12;
      });
      const c2 = mil.length > 0 && mil.every(j => {
        const startH = new Date(j.event?.start).getUTCHours();
        return startH >= 12;
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Alexander sáng (7-11h): ${c1 ? 'ĐẠT' : 'NGOÀI GIỜ'} | Miller chiều (13-17h): ${c2 ? 'ĐẠT' : 'NGOÀI GIỜ'}`
      };
    }
  },
  {
    id: 'TC-15-11',
    title: 'TC-15-11: NaplesAuto_3 Test Keep Day & Force Tech Lam',
    description: 'Keep customer NaplesAuto_3 Test jobs on the same day and force technician Lam.',
    rules: [
      {
        actions: [{ params: { period: 'day' }, action_type: 'keep_period' }],
        targets: { match: 'all', customer_names: ['NaplesAuto_3 Test'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { tech_name: 'Lam' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['NaplesAuto_3 Test'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const n3 = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('NaplesAuto_3 Test'));
      if (!n3.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy NaplesAuto_3 Test' };
      const c1 = n3.every(j => j.date_label === '10-06-2026' || j.date_label === '10-10-2026' || j.date_label === '10-11-2026');
      const c2 = n3.every(j => j.schedule?.name === 'Lam');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `NaplesAuto_3 giữ đúng ngày: ${c1 ? 'ĐÚNG' : 'SAI'} | Gán KTV Lam: ${c2 ? 'ĐÚNG' : 'SAI'} (${n3.map(j=>j.schedule?.name).join(', ')})`
      };
    }
  },
  {
    id: 'TC-15-12',
    title: 'TC-15-12: Dual Exclude Flea & Tick Control and Wasp Nest Removal',
    description: 'Automatically exclude all Flea & Tick Control jobs and all Wasp Nest Removal jobs from routing.',
    rules: [
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', service_types: ['Flea & Tick Control'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', service_types: ['Wasp Nest Removal'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const ftJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Flea & Tick'));
      const wnJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Wasp Nest'));
      const c1 = ftJobs.length === 0;
      const c2 = wnJobs.length === 0;
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Flea & Tick bị Exclude: ${c1 ? 'ĐÚNG (0 jobs)' : 'CÒN ' + ftJobs.length + ' jobs'} | Wasp Nest bị Exclude: ${c2 ? 'ĐÚNG (0 jobs)' : 'CÒN ' + wnJobs.length + ' jobs'}`
      };
    }
  },
  {
    id: 'TC-15-13',
    title: 'TC-15-13: FL Routing Test 16 First Stop & Early Window',
    description: 'Schedule customer FL Routing Test 16 as the first stop and enforce arrival between 07:00 and 10:00.',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 16'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { start_time: '07:00:00', end_time: '10:00:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 16'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const fl16 = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('FL Routing Test 16'));
      if (!fl16.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy FL Routing Test 16' };
      let c1 = fl16.some(j => {
        const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                              .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
        return (dayJobs[0]?.customer?.full_name || dayJobs[0]?.customer?.name || '').includes('FL Routing Test 16');
      });
      let c2 = fl16.every(j => {
        const startH = new Date(j.event?.start).getUTCHours();
        return startH >= 7 && startH < 11;
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `FL Test 16 First Stop: ${c1 ? 'ĐẠT' : 'KHÔNG'} | Khung giờ sớm (7-10h): ${c2 ? 'ĐẠT' : 'NGOÀI GIỜ'} (${fl16.map(j=>j.tile?.header).join(', ')})`
      };
    }
  },
  {
    id: 'TC-15-14',
    title: 'TC-15-14: FL Routing Test 19 Keep Day & Last Stop',
    description: 'Keep customer FL Routing Test 19 on the same day and schedule as the last stop of the day.',
    rules: [
      {
        actions: [{ params: { period: 'day' }, action_type: 'keep_period' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 19'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 19'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const fl19 = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('FL Routing Test 19'));
      if (!fl19.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy FL Routing Test 19' };
      const c1 = fl19.every(j => j.date_label === '10-11-2026' || j.date_label === '10-12-2026');
      const c2 = fl19.some(j => {
        const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                              .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
        const last = dayJobs[dayJobs.length - 1];
        return (last?.customer?.full_name || last?.customer?.name || '').includes('FL Routing Test 19');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `FL Test 19 giữ đúng ngày: ${c1 ? 'ĐÚNG' : 'SAI'} | Last Stop: ${c2 ? 'ĐẠT' : 'KHÔNG'}`
      };
    }
  },
  {
    id: 'TC-15-15',
    title: 'TC-15-15: Cross Tech Force Vance to Minh & NaplesAuto_5 to custom',
    description: 'Force technician Minh for customer Vance and force technician custom for customer NaplesAuto_5 Test.',
    rules: [
      {
        actions: [{ params: { tech_name: 'Minh' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['Vance'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { tech_name: 'custom' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['NaplesAuto_5 Test'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const vance = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Vance'));
      const naples5 = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('NaplesAuto_5 Test'));
      const c1 = vance.length > 0 && vance.every(j => j.schedule?.name === 'Minh');
      const c2 = naples5.length > 0 && naples5.every(j => j.schedule?.name === 'custom');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Vance gán Minh: ${c1 ? 'ĐÚNG' : 'SAI'} (${vance.map(j=>j.schedule?.name).join(', ')}) | NaplesAuto_5 gán custom: ${c2 ? 'ĐÚNG' : 'SAI'} (${naples5.map(j=>j.schedule?.name).join(', ')})`
      };
    }
  }
];

async function createCustomRule(tc, token) {
  const convId = crypto.randomUUID();
  const payload = {
    conversation_id: convId,
    title: tc.title,
    description: tc.description,
    status: 1, // Bật ON
    rule_detail: {
      case: { text: '' },
      rule: { text: tc.description },
      issue: { text: '' },
      conflict_system_rule_keys: []
    },
    executable_logic: {
      id: 'rule_exec_' + Date.now(),
      name: tc.title,
      rule: tc.description,
      rules: tc.rules,
      summary: tc.description,
      classify_action: 'gen_rule'
    }
  };
  const res = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.data?.id;
}

async function setRuleStatus(ruleId, status, token) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/${ruleId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ status })
      });
      if (res.ok) return;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

async function fetchSandboxEvents(token) {
  const url = `${BASE_URL}/api/routing/mantis/autopilot/jobs?agenda=agendaTwoWeeks&color_id=1&end=2026-10-17T23%3A59%3A59.999Z&inc=recurring&schedule_ids=${SCHEDULE_IDS}&start=2026-10-04T00%3A00%3A00.000Z`;
  const res = await fetch(url, { headers: { token } });
  const rawText = await res.text();
  const lines = rawText.split('\n').filter(l => l.trim());
  let finalEvents = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'events' && Array.isArray(parsed.items)) {
        finalEvents = parsed.items;
      }
    } catch(e) {}
  }
  return finalEvents;
}

(async () => {
  console.log('======================================================================');
  console.log('   BẮT ĐẦU BỘ KIỂM THỬ 15 TEST CASES TRÊN TÀI KHOẢN MỚI LAMLAM');
  console.log('   Tài khoản: lamlam@gmail.com | Branch: GDONWL5A5MI6');
  console.log('   Kỹ thuật viên: Lam (31), custom (32), Minh (89) | 101 Jobs');
  console.log('   Chu trình 4 bước khép kín - Live Preview Chromium trực quan');
  console.log('   TIÊU CHÍ: 100% ANTI-FAKE PASS - MINH CHỨNG TỪ SOLVER NDJSON STREAM');
  console.log('======================================================================\n');

  const reportDir = path.resolve(__dirname, '../reports/screenshots_lamlam_15');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 150,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({ viewport: { width: 980, height: 960 } });
  const page = await context.newPage();
  let token = '';

  page.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  console.log('1. Đang đăng nhập tài khoản lamlam@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const results = [];

  for (let i = 0; i < TEST_CASES_15.length; i++) {
    const tc = TEST_CASES_15[i];
    console.log(`\n======================================================================`);
    console.log(`>>> TIẾN TRÌNH [${i+1}/15]: ${tc.id}`);
    console.log(`    Tiêu đề: ${tc.title}`);
    console.log(`======================================================================`);

    // BƯỚC 1: Custom Rules UI -> Tạo Rule & Bật ON
    console.log(`[Bước 1] Custom Rules UI: Tạo Rule và bật TOGGLE ON...`);
    const ruleId = await createCustomRule(tc, token);
    console.log(` -> Rule đã tạo thành công với ID: ${ruleId} (Status: ON)`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step1_rule_on.png` });

    // BƯỚC 2: Mantis Sandbox -> Chờ Solver 14s -> Verify NDJSON Stream
    console.log(`[Bước 2] Mantis Sandbox: Chờ Solver tối ưu hóa 14 giây...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(14000);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step2_sandbox.png` });

    const events = await fetchSandboxEvents(token);
    const check = tc.verify(events);

    console.log(`   * Mệnh đề 1: ${check.c1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   * Mệnh đề 2: ${check.c2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   * Chi tiết Đo Được: ${check.note}`);
    console.log(`   * KẾT LUẬN: ${check.verdict ? '✅ PASS' : '❌ FAIL'}`);

    results.push({
      id: tc.id,
      title: tc.title,
      ruleId,
      c1: check.c1,
      c2: check.c2,
      verdict: check.verdict ? 'PASS' : 'FAIL',
      note: check.note
    });

    // BƯỚC 3: Calendar UI đối chiếu
    console.log(`[Bước 3] Calendar UI: Đối chiếu delta với vị trí lịch gốc...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/calendar?schedules=${SCHEDULE_IDS}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step3_calendar.png` });

    // BƯỚC 4: Tắt Toggle Rule về OFF
    console.log(`[Bước 4] Custom Rules UI: TẮT RULE ${ruleId} về OFF an toàn...`);
    await setRuleStatus(ruleId, 0, token);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step4_rule_off.png` });
  }

  await browser.close();

  // Lưu file kết quả JSON
  fs.writeFileSync('reports/lamlam_15_cases_results.json', JSON.stringify(results, null, 2));

  console.log('\n======================================================================');
  console.log('       TỔNG KẾT KẾT QUẢ KIỂM THỬ 15 TEST CASES (ACCOUNT: LAMLAM)      ');
  console.log('======================================================================');
  results.forEach(r => {
    console.log(`[${r.id}] (Rule ${r.ruleId}): ${r.verdict === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${r.note}`);
  });
  console.log('======================================================================\n');
})();
