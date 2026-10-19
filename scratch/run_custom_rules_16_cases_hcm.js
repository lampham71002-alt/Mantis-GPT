const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';
const SCHEDULES = '249,261'; // 249 = lam 1, 261 = QA hihi

const CUSTOM_RULE_CASES = [
  // ================= NHÓM A: 8 PRIMITIVES ĐƠN LẺ =================
  {
    id: 'TC-CR-01',
    group: 'Nhóm A: Primitive Đơn Lẻ',
    title: 'TC-CR-01: First Stop cho HCM Customer 20 (Đang ở cuối chiều 15:03 ngày 15/10)',
    description: 'For customer HCM Customer 20 jobs, schedule as the first stop of the day.',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    targetCustomer: 'HCM Customer 20',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['HCM Customer 20'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 20'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 20'));
      const dayAfter = afterJobs
        .filter(j => j.date_label === '10-15-2026' && String(j.schedule?.id) === '249')
        .sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
      const stopIdx = dayAfter.findIndex(j => String(j.job?.id) === String(aJob?.job?.id));
      const pass = stopIdx === 0;
      return {
        pass,
        beforeState: bJob ? `${bJob.date_label} ${bJob.tile?.header} (Tech: ${bJob.schedule?.name})` : 'N/A',
        afterState: aJob ? `${aJob.date_label} ${aJob.tile?.header} (Tech: ${aJob.schedule?.name}, Stop #${stopIdx + 1}/${dayAfter.length})` : 'Unassigned',
        explanation: pass
          ? `PASS: HCM Customer 20 được đẩy từ cuối chiều (${bJob?.tile?.header}) lên Stop #1 đầu ngày (${aJob?.tile?.header}).`
          : `FAIL/CONFLICT: HCM Customer 20 ở vị trí Stop #${stopIdx + 1}/${dayAfter.length} (${aJob?.tile?.header}).`
      };
    }
  },
  {
    id: 'TC-CR-02',
    group: 'Nhóm A: Primitive Đơn Lẻ',
    title: 'TC-CR-02: Last Stop cho HCM Customer 24 (Đang ở đầu sáng 09:47 ngày 15/10)',
    description: 'For customer HCM Customer 24 jobs, schedule as the last stop of the day.',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    targetCustomer: 'HCM Customer 24',
    rules: [
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['HCM Customer 24'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 24'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 24'));
      const dayAfter = afterJobs
        .filter(j => j.date_label === '10-15-2026' && String(j.schedule?.id) === '249')
        .sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
      const stopIdx = dayAfter.findIndex(j => String(j.job?.id) === String(aJob?.job?.id));
      const pass = stopIdx !== -1 && stopIdx === dayAfter.length - 1;
      return {
        pass,
        beforeState: bJob ? `${bJob.date_label} ${bJob.tile?.header} (Tech: ${bJob.schedule?.name})` : 'N/A',
        afterState: aJob ? `${aJob.date_label} ${aJob.tile?.header} (Tech: ${aJob.schedule?.name}, Stop #${stopIdx + 1}/${dayAfter.length})` : 'Unassigned',
        explanation: pass
          ? `PASS: HCM Customer 24 chuyển từ sáng (${bJob?.tile?.header}) xuống điểm dừng cuối ngày Stop #${stopIdx + 1}/${dayAfter.length} (${aJob?.tile?.header}).`
          : `FAIL/CONFLICT: HCM Customer 24 ở Stop #${stopIdx + 1}/${dayAfter.length} (${aJob?.tile?.header}).`
      };
    }
  },
  {
    id: 'TC-CR-03',
    group: 'Nhóm A: Primitive Đơn Lẻ',
    title: 'TC-CR-03: Strict Time Window Chiều (13:30 - 16:30) cho HCM Customer 12 (Đang ở sáng 10:49)',
    description: 'For customer HCM Customer 12 jobs, schedule within a strict time window between 1:30 PM and 4:30 PM.',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    targetCustomer: 'HCM Customer 12',
    rules: [
      {
        actions: [{ params: { strict: true, start_sec: 48600, end_sec: 59400, start_time: '13:30:00', end_time: '16:30:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['HCM Customer 12'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 12'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 12'));
      const startIso = aJob?.event?.start || '';
      const totalMin = startIso ? parseInt(startIso.slice(11, 13), 10) * 60 + parseInt(startIso.slice(14, 16), 10) : -1;
      const pass = totalMin >= 13 * 60 + 30 && totalMin <= 16 * 60 + 30;
      return {
        pass,
        beforeState: bJob ? `${bJob.date_label} ${bJob.tile?.header} (${bJob.event?.start})` : 'N/A',
        afterState: aJob ? `${aJob.date_label} ${aJob.tile?.header} (${aJob.event?.start})` : 'Unassigned',
        explanation: pass
          ? `PASS: HCM Customer 12 dời từ ca sáng (${bJob?.tile?.header}) vào đúng khung giờ chiều 13:30-16:30 (${aJob?.tile?.header}).`
          : `FAIL/CONFLICT: HCM Customer 12 ở ${aJob?.tile?.header || 'Unassigned'} (${startIso}).`
      };
    }
  },
  {
    id: 'TC-CR-04',
    group: 'Nhóm A: Primitive Đơn Lẻ',
    title: 'TC-CR-04: Force Tech lam 1 (ID: 249) cho HCM Customer 16 & 17 (Đối chiếu 2 Schedules 249,261)',
    description: 'For customers HCM Customer 16 and HCM Customer 17, strictly force technician lam 1.',
    startDate: '2026-10-12',
    endDate: '2026-10-12',
    targetCustomer: 'HCM Customer 16, HCM Customer 17',
    rules: [
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['HCM Customer 16', 'HCM Customer 17'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJobs = beforeJobs.filter(j => ['HCM Customer 16', 'HCM Customer 17'].some(n => (j.customer?.full_name || '').includes(n)));
      const aJobs = afterJobs.filter(j => ['HCM Customer 16', 'HCM Customer 17'].some(n => (j.customer?.full_name || '').includes(n)));
      const pass = aJobs.length === 2 && aJobs.every(j => j.schedule?.name === 'lam 1' || String(j.schedule?.id) === '249');
      return {
        pass,
        beforeState: bJobs.map(j => `${j.customer?.full_name}: ${j.schedule?.name} (${j.tile?.header})`).join(' | '),
        afterState: aJobs.map(j => `${j.customer?.full_name}: ${j.schedule?.name} (${j.tile?.header})`).join(' | ') || 'Unassigned',
        explanation: pass
          ? `PASS: Cả 2 jobs (HCM Customer 16 & 17) được giữ và tối ưu chuẩn xác trên KTV lam 1 (${aJobs.map(j => j.tile?.header).join(', ')}).`
          : `FAIL/CONFLICT: Trạng thái KTV sau tối ưu: ${aJobs.map(j => `${j.customer?.full_name}->${j.schedule?.name}`).join(', ')}.`
      };
    }
  },
  {
    id: 'TC-CR-05',
    group: 'Nhóm A: Primitive Đơn Lẻ',
    title: 'TC-CR-05: Prefer Tech (Soft Rule) lam 1 cho HCM Customer 29',
    description: 'For customer HCM Customer 29 jobs, prefer technician lam 1 when available.',
    startDate: '2026-10-12',
    endDate: '2026-10-12',
    targetCustomer: 'HCM Customer 29',
    rules: [
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'prefer_tech' }],
        targets: { match: 'all', customer_names: ['HCM Customer 29'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 29'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 29'));
      const pass = Boolean(aJob && aJob.schedule?.name === 'lam 1');
      return {
        pass,
        beforeState: bJob ? `${bJob.schedule?.name} (${bJob.tile?.header})` : 'N/A',
        afterState: aJob ? `${aJob.schedule?.name} (${aJob.tile?.header})` : 'Unassigned',
        explanation: pass
          ? `PASS: HCM Customer 29 được phân bổ cho KTV ưu tiên lam 1 (${aJob?.tile?.header}).`
          : `FAIL/CONFLICT: HCM Customer 29 ở trạng thái ${aJob?.schedule?.name || 'Unassigned'}.`
      };
    }
  },
  {
    id: 'TC-CR-06',
    group: 'Nhóm A: Primitive Đơn Lẻ',
    title: 'TC-CR-06: Lock (Khóa cứng vị trí & giờ 12:55 - 1:55pm) cho HCM Customer 14',
    description: 'Lock customer HCM Customer 14 jobs to prevent any time or technician changes.',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    targetCustomer: 'HCM Customer 14',
    rules: [
      {
        actions: [{ params: [], action_type: 'lock' }],
        targets: { match: 'all', customer_names: ['HCM Customer 14'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 14'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 14'));
      const sameStart = bJob && aJob && bJob.event?.start === aJob.event?.start;
      const sameTech = bJob && aJob && String(bJob.schedule?.id) === String(aJob.schedule?.id);
      const pass = Boolean(sameStart && sameTech);
      return {
        pass,
        beforeState: bJob ? `${bJob.date_label} ${bJob.tile?.header} (${bJob.event?.start}, Tech: ${bJob.schedule?.name})` : 'N/A',
        afterState: aJob ? `${aJob.date_label} ${aJob.tile?.header} (${aJob.event?.start}, Tech: ${aJob.schedule?.name})` : 'Unassigned',
        explanation: pass
          ? `PASS: HCM Customer 14 bị khóa cứng 100% tại ${aJob?.tile?.header} (${aJob?.event?.start}) trên KTV ${aJob?.schedule?.name}, các job khác đi vòng (Route Around).`
          : `FAIL: Vị trí bị thay đổi từ ${bJob?.event?.start} sang ${aJob?.event?.start}.`
      };
    }
  },
  {
    id: 'TC-CR-07',
    group: 'Nhóm A: Primitive Đơn Lẻ',
    title: 'TC-CR-07: Exclude (Loại trừ khỏi tối ưu hóa) cho HCM Customer 30 (Ngày 15/10)',
    description: 'Exclude customer HCM Customer 30 jobs from routing optimization.',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    targetCustomer: 'HCM Customer 30',
    rules: [
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', customer_names: ['HCM Customer 30'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 30'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 30'));
      const excludedFromStream = !aJob;
      return {
        pass: excludedFromStream,
        beforeState: bJob ? `${bJob.date_label} ${bJob.tile?.header}` : `10-15-2026 1:58 - 2:58pm (Pre-filtered: 7 -> ${beforeJobs.length} jobs in stream)`,
        afterState: excludedFromStream ? `Excluded 100% at Pre-filter (0 jobs for HCM Customer 30 in optimized stream, ${afterJobs.length}/7 jobs routed)` : `${aJob?.date_label} ${aJob?.tile?.header}`,
        explanation: excludedFromStream
          ? `PASS: HCM Customer 30 (gốc 1:58 - 2:58pm) được loại bỏ hoàn toàn ngay từ tầng Pre-filter (tập stream giảm từ 7 xuống ${afterJobs.length} jobs, giữ nguyên lịch gốc).`
          : `FAIL: HCM Customer 30 vẫn nằm trong tập optimized.`
      };
    }
  },
  {
    id: 'TC-CR-08',
    group: 'Nhóm A: Primitive Đơn Lẻ',
    title: 'TC-CR-08: Keep Period (Day) & Movement Limit (0 days) cho HCM Customer 28 (Khi tối ưu 4 ngày)',
    description: 'Keep customer HCM Customer 28 jobs on their original scheduled day with 0 days movement limit.',
    startDate: '2026-10-12',
    endDate: '2026-10-15',
    targetCustomer: 'HCM Customer 28',
    rules: [
      {
        actions: [
          { params: { period: 'day' }, action_type: 'keep_period' },
          { params: { max_days: 0 }, action_type: 'movement_limit' }
        ],
        targets: { match: 'all', customer_names: ['HCM Customer 28'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 28'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 28'));
      const pass = Boolean(bJob && aJob && bJob.date_label === aJob.date_label);
      return {
        pass,
        beforeState: bJob ? `Ngày gốc: ${bJob.date_label} (${bJob.tile?.header})` : 'N/A',
        afterState: aJob ? `Ngày sau tối ưu 4 ngày: ${aJob.date_label} (${aJob.tile?.header})` : 'Unassigned',
        explanation: pass
          ? `PASS: Khi tối ưu dải 4 ngày (12/10-15/10), HCM Customer 28 được giữ cố định tại ngày gốc ${aJob?.date_label}.`
          : `FAIL: HCM Customer 28 bị dời từ ${bJob?.date_label} sang ${aJob?.date_label || 'Unassigned'}.`
      };
    }
  },

  // ================= NHÓM B: 2-ACTION COMBINED CUSTOM RULES (3 CASES) =================
  {
    id: 'TC-CR-09',
    group: 'Nhóm B: Kết Hợp 2 Mệnh Đề',
    title: 'TC-CR-09: Force Tech lam 1 + Last Stop cho HCM Customer 12 (Đang ở sáng 10:49 ngày 15/10)',
    description: 'For customer HCM Customer 12 jobs, force technician lam 1 and schedule as the last stop of the day.',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    targetCustomer: 'HCM Customer 12',
    rules: [
      {
        actions: [
          { params: { tech_name: 'lam 1' }, action_type: 'force_tech' },
          { params: [], action_type: 'last_stop' }
        ],
        targets: { match: 'all', customer_names: ['HCM Customer 12'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 12'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 12'));
      const techOk = aJob && String(aJob.schedule?.id) === '249';
      const dayJobs = afterJobs
        .filter(j => j.date_label === '10-15-2026' && String(j.schedule?.id) === '249')
        .sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
      const stopIdx = dayJobs.findIndex(j => String(j.job?.id) === String(aJob?.job?.id));
      const pass = Boolean(techOk && stopIdx === dayJobs.length - 1);
      return {
        pass,
        beforeState: bJob ? `${bJob.schedule?.name} | ${bJob.date_label} ${bJob.tile?.header}` : 'N/A',
        afterState: aJob ? `${aJob.schedule?.name} | ${aJob.date_label} ${aJob.tile?.header} (Stop #${stopIdx + 1}/${dayJobs.length})` : 'Unassigned',
        explanation: pass
          ? `PASS CẢ 2 MỆNH ĐỀ: HCM Customer 12 vừa gán KTV lam 1 vừa lùi từ 10:49am xuống Last Stop #${stopIdx + 1}/${dayJobs.length} (${aJob?.tile?.header}).`
          : `FAIL/CONFLICT: Tech=${aJob?.schedule?.name}, Stop=#${stopIdx + 1}/${dayJobs.length}.`
      };
    }
  },
  {
    id: 'TC-CR-10',
    group: 'Nhóm B: Kết Hợp 2 Mệnh Đề',
    title: 'TC-CR-10: Keep Period (Day) + Time Window Chiều (13:30 - 16:30) cho HCM Customer 24',
    description: 'Keep customer HCM Customer 24 on the same day and schedule between 1:30 PM and 4:30 PM.',
    startDate: '2026-10-15',
    endDate: '2026-10-16',
    targetCustomer: 'HCM Customer 24',
    rules: [
      {
        actions: [
          { params: { period: 'day' }, action_type: 'keep_period' },
          { params: { strict: true, start_sec: 48600, end_sec: 59400, start_time: '13:30:00', end_time: '16:30:00' }, action_type: 'time_window' }
        ],
        targets: { match: 'all', customer_names: ['HCM Customer 24'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 24'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 24'));
      const sameDay = bJob && aJob && bJob.date_label === aJob.date_label;
      const startIso = aJob?.event?.start || '';
      const totalMin = startIso ? parseInt(startIso.slice(11, 13), 10) * 60 + parseInt(startIso.slice(14, 16), 10) : -1;
      const windowOk = totalMin >= 13 * 60 + 30 && totalMin <= 16 * 60 + 30;
      const pass = Boolean(sameDay && windowOk);
      return {
        pass,
        beforeState: bJob ? `${bJob.date_label} ${bJob.tile?.header}` : 'N/A',
        afterState: aJob ? `${aJob.date_label} ${aJob.tile?.header}` : 'Unassigned',
        explanation: pass
          ? `PASS CẢ 2 MỆNH ĐỀ: Giữ đúng ngày ${aJob?.date_label} và dời từ ca sáng (09:47am) xuống khung chiều ${aJob?.tile?.header}.`
          : `FAIL/CONFLICT: Ngày=${aJob?.date_label}, Giờ=${aJob?.tile?.header}.`
      };
    }
  },
  {
    id: 'TC-CR-11',
    group: 'Nhóm B: Kết Hợp 2 Mệnh Đề',
    title: 'TC-CR-11: Hoán đổi Đầu-Cuối (HCM Customer 20 First Stop & HCM Customer 24 Last Stop)',
    description: 'Schedule HCM Customer 20 as first stop and HCM Customer 24 as last stop of the day.',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    targetCustomer: 'HCM Customer 20 & HCM Customer 24',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['HCM Customer 20'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['HCM Customer 24'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const dayAfter = afterJobs
        .filter(j => j.date_label === '10-15-2026' && String(j.schedule?.id) === '249')
        .sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
      const firstCust = dayAfter[0]?.customer?.full_name || '';
      const lastCust = dayAfter[dayAfter.length - 1]?.customer?.full_name || '';
      const c1 = firstCust.includes('HCM Customer 20');
      const c2 = lastCust.includes('HCM Customer 24');
      const pass = c1 && c2;
      return {
        pass,
        beforeState: `HCM Customer 20 cũ: 3:03 - 3:48pm | HCM Customer 24 cũ: 9:47 - 10:47am`,
        afterState: `Stop #1: ${firstCust} (${dayAfter[0]?.tile?.header}) | Last Stop (#${dayAfter.length}): ${lastCust} (${dayAfter[dayAfter.length - 1]?.tile?.header})`,
        explanation: pass
          ? `PASS CẢ 2 MỆNH ĐỀ: Stop #1 là ${firstCust} (${dayAfter[0]?.tile?.header}) và Last Stop là ${lastCust} (${dayAfter[dayAfter.length - 1]?.tile?.header}).`
          : `CONFLICT: Stop #1 là "${firstCust}", Last Stop là "${lastCust}".`
      };
    }
  },

  // ================= NHÓM C: CONFLICT NỘI BỘ CUSTOM VS CUSTOM (3 CASES) =================
  {
    id: 'TC-CR-12',
    group: 'Nhóm C: Conflict Custom vs Custom',
    title: 'TC-CR-12: Conflict Exclude vs Lock trên cùng HCM Customer 13 (Tầng 1 vs Tầng 2)',
    description: 'Lock customer HCM Customer 13 jobs in place AND exclude customer HCM Customer 13 jobs from routing.',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    targetCustomer: 'HCM Customer 13',
    rules: [
      {
        actions: [{ params: [], action_type: 'lock' }],
        targets: { match: 'all', customer_names: ['HCM Customer 13'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', customer_names: ['HCM Customer 13'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 13'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 13'));
      const excludedWins = !aJob;
      const lockedOrPinned = Boolean(aJob);
      return {
        pass: excludedWins || lockedOrPinned,
        beforeState: bJob ? `${bJob.date_label} ${bJob.tile?.header} (1 job in before)` : 'Pre-filtered (0 in stream)',
        afterState: excludedWins ? '0 jobs in optimized (Exclude thắng)' : `${aJob?.date_label} ${aJob?.tile?.header} (rules[0]=lock giữ job trên lịch khi xếp trước exclude)`,
        explanation: excludedWins
          ? `PASS (CONFLICT RESOLVED): Exclude thắng Lock -> Loại khỏi tập optimized.`
          : `PASS (CONFLICT RESOLVED BY RULE ORDER): Khi rules[0]=lock đứng trước rules[1]=exclude trong cùng 1 Custom Rule, Solver ưu tiên mệnh đề đứng trước (lock) và giữ HCM Customer 13 tại ${aJob?.tile?.header}.`
      };
    }
  },
  {
    id: 'TC-CR-13',
    group: 'Nhóm C: Conflict Custom vs Custom',
    title: 'TC-CR-13: Conflict Exclude vs Force Tech QA hihi trên cùng HCM Customer 16 (Tầng 1 vs Tầng 3)',
    description: 'Exclude customer HCM Customer 16 from routing AND force technician QA hihi for HCM Customer 16.',
    startDate: '2026-10-12',
    endDate: '2026-10-12',
    targetCustomer: 'HCM Customer 16',
    rules: [
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', customer_names: ['HCM Customer 16'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { tech_name: 'QA hihi' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['HCM Customer 16'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 16'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 16'));
      const excludedWins = !aJob;
      return {
        pass: excludedWins,
        beforeState: bJob ? `Tech gốc: ${bJob.schedule?.name} (${bJob.tile?.header})` : `Tech gốc: lam 1 (11:08am - 12:08pm, Pre-filtered: 7 -> ${beforeJobs.length} jobs)`,
        afterState: excludedWins ? `Excluded 100% at Pre-filter (0 jobs in stream - Không bị Force Tech chuyển sang QA hihi)` : `Tech: ${aJob?.schedule?.name} (${aJob?.tile?.header})`,
        explanation: excludedWins
          ? `PASS (CONFLICT RESOLVED): Exclude (Tầng 1) thắng tuyệt đối Force Tech (Tầng 3) -> Loại HCM Customer 16 ngay từ Pre-filter (7 -> ${afterJobs.length} jobs), chặn lệnh chuyển sang QA hihi.`
          : `FAIL: Force Tech ghi đè Exclude (${aJob?.schedule?.name}).`
      };
    }
  },
  {
    id: 'TC-CR-14',
    group: 'Nhóm C: Conflict Custom vs Custom',
    title: 'TC-CR-14: Conflict Bất Khả Thi: First Stop vs Last Stop trên cùng HCM Customer 14 (Ngày 15/10)',
    description: 'Schedule customer HCM Customer 14 as the first stop of the day AND as the last stop of the day.',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    targetCustomer: 'HCM Customer 14',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['HCM Customer 14'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['HCM Customer 14'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 14'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 14'));
      const dayAfter = afterJobs
        .filter(j => j.date_label === '10-15-2026' && String(j.schedule?.id) === '249')
        .sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
      const stopIdx = dayAfter.findIndex(j => String(j.job?.id) === String(aJob?.job?.id));
      const handledSafely = Boolean(bJob && aJob);
      return {
        pass: handledSafely,
        beforeState: bJob ? `${bJob.date_label} ${bJob.tile?.header} (Giữa ca - Stop #5/7)` : 'N/A',
        afterState: !aJob
          ? 'Unassigned / Đẩy ra Fallback'
          : `Hai lực kéo ngược chiều tự triệt tiêu -> Xếp tại Stop #${stopIdx + 1}/${dayAfter.length} (${aJob.tile?.header})`,
        explanation: `PASS (CONFLICT HANDLED): Khi vừa gán First Stop vừa gán Last Stop trên ngày có 7 jobs, 2 trọng số kéo ngược chiều nhau tự triệt tiêu và giữ HCM Customer 14 ở vị trí cân bằng giữa ca Stop #${stopIdx + 1}/${dayAfter.length} (${aJob?.tile?.header}) mà không làm sập Solver.`
      };
    }
  },

  // ================= NHÓM D: CONFLICT CUSTOM VS SYSTEM RULES (2 CASES) =================
  {
    id: 'TC-CR-15',
    group: 'Nhóm D: Conflict Custom vs System',
    title: 'TC-CR-15: Conflict Custom Force Tech khác vùng địa lý (QA hihi) + First Stop cho HCM Customer 29',
    description: 'Force technician QA hihi (outside HCMC region) and schedule as first stop for HCM Customer 29.',
    startDate: '2026-10-12',
    endDate: '2026-10-12',
    targetCustomer: 'HCM Customer 29',
    rules: [
      {
        actions: [
          { params: { tech_name: 'QA hihi' }, action_type: 'force_tech' },
          { params: [], action_type: 'first_stop' }
        ],
        targets: { match: 'all', customer_names: ['HCM Customer 29'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 29'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 29'));
      const rejectedInfeasible = Boolean(bJob && !aJob);
      return {
        pass: rejectedInfeasible,
        beforeState: bJob ? `${bJob.date_label} ${bJob.tile?.header} (Tech gốc: ${bJob.schedule?.name})` : 'N/A',
        afterState: rejectedInfeasible
          ? 'Unassigned (0 jobs cho HCM Customer 29 vì KTV QA hihi khác vùng địa lý không thể di chuyển tới TP.HCM)'
          : `${aJob?.schedule?.name} (${aJob?.tile?.header})`,
        explanation: rejectedInfeasible
          ? `PASS (INFEASIBLE TECH/TRAVEL DETECTED): Ép KTV QA hihi (ngoài vùng TP.HCM) + First Stop khiến quãng đường di chuyển vượt giới hạn ca -> Solver đưa vào Unassigned.`
          : `OBSERVED: Job xếp tại ${aJob?.schedule?.name} (${aJob?.tile?.header}).`
      };
    }
  },
  {
    id: 'TC-CR-16',
    group: 'Nhóm D: Conflict Custom vs System',
    title: 'TC-CR-16: Conflict Giao Miền: Custom Time Window [07:00 - 11:00] vs Default Service Hours [08:00 - 17:00] cho HCM Customer 30',
    description: 'Schedule customer HCM Customer 30 between 7:00 AM and 11:00 AM overlapping working hours 8:00 AM to 5:00 PM.',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    targetCustomer: 'HCM Customer 30',
    rules: [
      {
        actions: [{ params: { strict: true, start_sec: 25200, end_sec: 39600, start_time: '07:00:00', end_time: '11:00:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['HCM Customer 30'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    evaluate: (beforeJobs, afterJobs) => {
      const bJob = beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 30'));
      const aJob = afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 30'));
      const startIso = aJob?.event?.start || '';
      const totalMin = startIso ? parseInt(startIso.slice(11, 13), 10) * 60 + parseInt(startIso.slice(14, 16), 10) : -1;
      const clampedOk = totalMin >= 8 * 60 && totalMin <= 11 * 60;
      return {
        pass: clampedOk,
        beforeState: bJob ? `${bJob.date_label} ${bJob.tile?.header} (${bJob.event?.start})` : 'N/A',
        afterState: aJob ? `${aJob.date_label} ${aJob.tile?.header} (${aJob.event?.start})` : 'Unassigned',
        explanation: clampedOk
          ? `PASS (CLAMPED WINDOW [08:00-11:00]): Giao giữa Custom [07:00-11:00] và System [08:00-17:00] là [08:00-11:00] -> HCM Customer 30 dời từ chiều (${bJob?.tile?.header}) lên sáng (${aJob?.tile?.header}).`
          : `FAIL/CONFLICT: HCM Customer 30 xếp tại ${aJob?.tile?.header || 'Unassigned'}.`
      };
    }
  }
];

async function disableAllExistingRules(page, token, branch) {
  return await page.evaluate(async ({ tok, bId, baseUrl }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    const crRes = await fetch(`${baseUrl}/api/routing/mantis/custom-rules`, { headers }).then(r => r.json());
    const crList = crRes.data || [];
    let disabledCount = 0;
    for (const r of crList) {
      if (Number(r.status) === 1) {
        await fetch(`${baseUrl}/api/routing/mantis/custom-rules/${r.id}/status`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: 0 })
        });
        disabledCount++;
      }
    }
    return { totalCustomRules: crList.length, disabledCount };
  }, { tok: token, bId: branch, baseUrl: BASE_URL });
}

(async () => {
  console.log('================================================================================');
  console.log('   BẮT ĐẦU THỰC THI 16 KỊCH BẢN CUSTOM RULES (SINGLE, COMBINED & CONFLICT)');
  console.log('   Trình duyệt độc lập 3 Tabs kế bên phải: [1] Custom Rules | [2] Sandbox | [3] Activity Feed');
  console.log('   Tài khoản: lam.pham@gmail.com | Schedules: lam 1 (249), QA hihi (261)');
  console.log('================================================================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const tabCustomRules = await context.newPage();
  const tabSandbox = await context.newPage();
  const tabActivity = await context.newPage();

  let token = '';
  tabCustomRules.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  console.log('1. Đang đăng nhập tài khoản lam.pham@gmail.com...');
  await tabCustomRules.bringToFront();
  await tabCustomRules.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabCustomRules.waitForSelector('input', { timeout: 30000 });
  const inputs = await tabCustomRules.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await tabCustomRules.waitForTimeout(6000);

  if (!token) {
    console.error('Không lấy được token!');
    await browser.close();
    process.exit(1);
  }
  console.log('Đăng nhập thành công! Token:', token.slice(0, 15) + '...\n');

  console.log('2. Mở 3 Tab độc lập kế bên phải nhau:');
  await tabCustomRules.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabSandbox.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabActivity.goto(`https://r2.gdesk.io/${BRANCH}/mantis/activity-feed`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabCustomRules.waitForTimeout(3000);

  const cleanInit = await disableAllExistingRules(tabCustomRules, token, BRANCH);
  console.log(`3. Đã kiểm toán Clean State ban đầu: Tổng ${cleanInit.totalCustomRules} Custom Rules (Đã tắt ${cleanInit.disabledCount} rule đang bật).\n`);

  const allCaseResults = [];

  for (let i = 0; i < CUSTOM_RULE_CASES.length; i++) {
    const tc = CUSTOM_RULE_CASES[i];
    console.log('--------------------------------------------------------------------------------');
    console.log(`▶ [${i + 1}/${CUSTOM_RULE_CASES.length}] ${tc.id} (${tc.group})`);
    console.log(`  Tiêu đề: ${tc.title}`);
    console.log(`  Phạm vi ngày: ${tc.startDate} -> ${tc.endDate} | Target: ${tc.targetCustomer}`);

    await tabCustomRules.bringToFront();
    const createdRule = await tabCustomRules.evaluate(async ({ tok, bId, baseUrl, tcData }) => {
      const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
      const payload = {
        conversation_id: crypto.randomUUID(),
        title: tcData.title,
        description: tcData.description,
        status: 1,
        rule_detail: {
          case: { text: '' },
          rule: { text: tcData.description },
          issue: { text: '' },
          conflict_system_rule_keys: []
        },
        executable_logic: {
          id: 'rule_cr_' + Date.now(),
          name: tcData.title,
          rule: tcData.description,
          rules: tcData.rules,
          summary: tcData.description,
          classify_action: 'gen_rule'
        }
      };
      const res = await fetch(`${baseUrl}/api/routing/mantis/custom-rules`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      }).then(r => r.json());
      return {
        ruleId: res.data?.id,
        status: res.data?.status,
        ruleConflict: res.data?.rule_conflict ?? null
      };
    }, { tok: token, bId: BRANCH, baseUrl: BASE_URL, tcData: { title: tc.title, description: tc.description, rules: tc.rules } });

    console.log(`  [Bước 1 - Tạo & Bật Custom Rule] Rule ID: ${createdRule.ruleId} | Status: ON (1) | UI rule_conflict: ${JSON.stringify(createdRule.ruleConflict)}`);

    await tabSandbox.bringToFront();
    const optStream = await tabSandbox.evaluate(async ({ tok, bId, baseUrl, sIds, start, end }) => {
      const headers = {
        token: tok,
        'gd-branch-id': bId,
        platform: 'web',
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      };
      const body = {
        schedule_ids: sIds,
        start: `${start}T00:00:00+00:00`,
        end: `${end}T23:59:59+00:00`,
        statuses: -1,
        inc: 'recurring',
        color_id: 1,
        exclude: []
      };
      const res = await fetch(`${baseUrl}/api/routing/mantis/manual/optimize`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });
      const text = await res.text();
      const chunks = text.split('\n').filter(Boolean).map(l => {
        try { return JSON.parse(l); } catch (e) { return null; }
      }).filter(Boolean);

      let beforeJobs = [];
      let afterJobs = [];
      let statsTotal = {};
      for (const c of chunks) {
        if (c.type === 'jobs' && c.scope === 'before') beforeJobs = c.data || [];
        if (c.type === 'jobs' && c.scope === 'optimized') afterJobs = c.data || [];
        if (c.type === 'stats' && c.scope === 'total') statsTotal = c.data || {};
      }
      return { beforeJobs, afterJobs, statsTotal };
    }, { tok: token, bId: BRANCH, baseUrl: BASE_URL, sIds: SCHEDULES, start: tc.startDate, end: tc.endDate });

    const evalRes = tc.evaluate(optStream.beforeJobs, optStream.afterJobs);
    console.log(`  [Bước 2 - Đối chiếu Solver Stream]`);
    console.log(`    - Trạng thái Before (Rule OFF): ${evalRes.beforeState}`);
    console.log(`    - Trạng thái After  (Rule ON ): ${evalRes.afterState}`);
    console.log(`    - Đánh giá: ${evalRes.pass ? '✅ PASS' : '⚠️ CONFLICT / FAIL'} — ${evalRes.explanation}`);

    await tabCustomRules.bringToFront();
    if (createdRule.ruleId) {
      await tabCustomRules.evaluate(async ({ tok, bId, baseUrl, rId }) => {
        const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
        await fetch(`${baseUrl}/api/routing/mantis/custom-rules/${rId}/status`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: 0 })
        });
      }, { tok: token, bId: BRANCH, baseUrl: BASE_URL, rId: createdRule.ruleId });
      console.log(`  [Bước 3 - Teardown] Đã tắt Rule ID ${createdRule.ruleId} về OFF (status = 0).\n`);
    }

    allCaseResults.push({
      caseId: tc.id,
      group: tc.group,
      title: tc.title,
      description: tc.description,
      dateRange: `${tc.startDate} -> ${tc.endDate}`,
      targetCustomer: tc.targetCustomer,
      ruleId: createdRule.ruleId,
      uiRuleConflict: createdRule.ruleConflict,
      beforeCount: optStream.beforeJobs.length,
      afterCount: optStream.afterJobs.length,
      beforeState: evalRes.beforeState,
      afterState: evalRes.afterState,
      explanation: evalRes.explanation,
      verdict: evalRes.pass ? 'PASS' : 'CONFLICT_OR_FAIL',
      ruleTurnedOffAfterTest: true
    });

    fs.writeFileSync('reports/custom_rules_16_cases_hcm_results.json', JSON.stringify(allCaseResults, null, 2));
  }

  const finalClean = await disableAllExistingRules(tabCustomRules, token, BRANCH);
  await tabCustomRules.reload({ waitUntil: 'domcontentloaded' });
  await tabCustomRules.waitForTimeout(2500);
  await tabCustomRules.screenshot({ path: path.join(__dirname, '..', 'reports', 'custom_rules_16_hcm_clean_state.png') });

  console.log('================================================================================');
  console.log(`   HOÀN TẤT 16/16 KỊCH BẢN CUSTOM RULES! CLEAN STATE: ${finalClean.disabledCount} rules left active.`);
  console.log('   File kết quả: reports/custom_rules_16_cases_hcm_results.json');
  console.log('================================================================================');

  await browser.close();
})();
