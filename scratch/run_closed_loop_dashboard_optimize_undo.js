const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BRANCH = 'GD1LK8RC5OH0';
const SCHEDULE_ID = '249'; // lam 1

const TEST_CASES = [
  {
    id: 'TC-DB-01',
    level: '1 Ngày (Đơn lẻ)',
    startDate: '2026-10-12',
    endDate: '2026-10-12',
    desc: 'Optimize 1 ngày 12/10/2026 -> Accept -> Check Dashboard 12/10 -> Activity Feed Undo'
  },
  {
    id: 'TC-DB-02',
    level: '1 Ngày (Rải giờ)',
    startDate: '2026-10-15',
    endDate: '2026-10-15',
    desc: 'Optimize 1 ngày rải giờ 15/10/2026 -> Accept -> Check Dashboard 15/10 -> Activity Feed Undo'
  },
  {
    id: 'TC-DB-03',
    level: '1 Ngày (Đơn lẻ 14/10)',
    startDate: '2026-10-14',
    endDate: '2026-10-14',
    desc: 'Optimize 1 ngày 14/10/2026 -> Accept -> Check Dashboard 14/10 -> Activity Feed Undo'
  },
  {
    id: 'TC-DB-04',
    level: '2 Ngày (Kết hợp)',
    startDate: '2026-10-12',
    endDate: '2026-10-13',
    desc: 'Optimize 2 ngày 12/10 - 13/10/2026 -> Accept -> Check Dashboard 12/10-13/10 -> Activity Feed Undo'
  },
  {
    id: 'TC-DB-05',
    level: '2 Ngày (Rải giờ)',
    startDate: '2026-10-15',
    endDate: '2026-10-16',
    desc: 'Optimize 2 ngày rải giờ 15/10 - 16/10/2026 -> Accept -> Check Dashboard 15/10-16/10 -> Activity Feed Undo'
  },
  {
    id: 'TC-DB-06',
    level: '3 Ngày (Nhiều ngày)',
    startDate: '2026-10-12',
    endDate: '2026-10-14',
    desc: 'Optimize 3 ngày 12/10 - 14/10/2026 -> Accept -> Check Dashboard 12/10-14/10 -> Activity Feed Undo'
  },
  {
    id: 'TC-DB-07',
    level: '4 Ngày (Nhiều ngày)',
    startDate: '2026-10-13',
    endDate: '2026-10-16',
    desc: 'Optimize 4 ngày 13/10 - 16/10/2026 -> Accept -> Check Dashboard 13/10-16/10 -> Activity Feed Undo'
  },
  {
    id: 'TC-DB-08',
    level: '6 Ngày (Toàn đợt)',
    startDate: '2026-10-11',
    endDate: '2026-10-16',
    desc: 'Optimize 6 ngày 11/10 - 16/10/2026 -> Accept -> Check Dashboard 11/10-16/10 -> Activity Feed Undo'
  }
];

async function fetchDashboardStats(page, token, branch, scheduleId, startDate, endDate) {
  return await page.evaluate(async ({ tok, bId, sId, start, end }) => {
    const headers = {
      token: tok,
      'gd-branch-id': bId,
      platform: 'web',
      'Content-Type': 'application/json'
    };
    const q = `start=${start}&end=${end}&schedule_ids=${sId}`;
    const [timeRatio, savedMileage, savedDriveTime, completedJobs, downtime, delays, totalSaved] = await Promise.all([
      fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/time-ratio?${q}`, { headers }).then(r => r.json()),
      fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/saved-mileage?${q}`, { headers }).then(r => r.json()),
      fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/saved-drive-time?${q}`, { headers }).then(r => r.json()),
      fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/completed-jobs-avg?${q}`, { headers }).then(r => r.json()),
      fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/downtime?${q}`, { headers }).then(r => r.json()),
      fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/delays?${q}`, { headers }).then(r => r.json()),
      fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/total-saved?${q}`, { headers }).then(r => r.json())
    ]);
    return {
      work_time_min: timeRatio.data?.work_time?.minutes ?? 0,
      drive_time_min: timeRatio.data?.drive_time?.minutes ?? 0,
      downtime_min: downtime.data?.total_minutes ?? (timeRatio.data?.downtime?.minutes ?? 0),
      saved_mileage: Number(savedMileage.data?.total_miles ?? 0),
      saved_drive_time: Number(savedDriveTime.data?.total_minutes ?? 0),
      total_saved_usd: Number(totalSaved.data?.total_saved ?? 0),
      total_saved_chart: totalSaved.data?.data || [],
      delays: Number(delays.data?.total_delays ?? 0),
      completed_jobs_avg: Number(completedJobs.data?.avg_jobs_per_day ?? 0)
    };
  }, { tok: token, bId: branch, sId: scheduleId, start: startDate, end: endDate });
}

(async () => {
  console.log('================================================================================');
  console.log('   BẮT ĐẦU CHUỖI TEST KHÉP KÍN: DASHBOARD VS SANDBOX (OPTIMIZE -> ACCEPT -> UNDO)');
  console.log('   Trình duyệt độc lập 3 Tabs kế bên phải: [1] Sandbox | [2] Dashboard | [3] Activity Feed');
  console.log('   Tài khoản: lam.pham@gmail.com | Kỹ thuật viên: lam 1 (ID: 249)');
  console.log('================================================================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const tabSandbox = await context.newPage();   // Tab 1: Sandbox
  const tabDashboard = await context.newPage(); // Tab 2 (kế bên phải): Dashboard
  const tabActivity = await context.newPage();  // Tab 3 (kế bên phải): Activity Feed

  let token = '';
  tabSandbox.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  console.log('1. Đang đăng nhập tài khoản lam.pham@gmail.com trên Tab 1...');
  await tabSandbox.bringToFront();
  await tabSandbox.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabSandbox.waitForSelector('input', { timeout: 30000 });
  const inputs = await tabSandbox.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await tabSandbox.waitForTimeout(6000);

  if (!token) {
    console.error('Không lấy được token đăng nhập!');
    await browser.close();
    process.exit(1);
  }
  console.log('Đăng nhập thành công! Token:', token.slice(0, 15) + '...\n');

  console.log('2. Đang mở song song 3 Tab kế bên phải nhau:');
  console.log('   - Tab 1: Mantis Sandbox');
  await tabSandbox.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('   - Tab 2 (Kế bên phải): Mantis Dashboard');
  await tabDashboard.goto(`https://r2.gdesk.io/${BRANCH}/mantis/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('   - Tab 3 (Kế bên phải): Mantis Activity Feed');
  await tabActivity.goto(`https://r2.gdesk.io/${BRANCH}/mantis/activity-feed`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabSandbox.waitForTimeout(3000);

  // Kiểm tra nếu có bản ghi History 1800 từ lần chạy bị ngắt trước đó thì Undo về baseline sạch
  const preClean = await tabActivity.evaluate(async ({ tok, bId }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    const hUrl = 'https://apiv2.gdesk.io/api/routing/mantis/feeds/history?start=2026-10-01T00:00:00%2B00:00&end=2026-10-31T23:59:59%2B00:00&limit=5';
    const hRes = await fetch(hUrl, { headers }).then(r => r.json());
    const top = (hRes.data || [])[0];
    if (top && String(top.id) === '1800' && top.status === 2) {
      await fetch(`https://apiv2.gdesk.io/api/routing/mantis/feeds/history/1800/undo`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({})
      });
      return { cleanedId: 1800 };
    }
    return { cleanedId: null, topId: top?.id, topStatus: top?.status };
  }, { tok: token, bId: BRANCH });
  if (preClean.cleanedId) {
    console.log(`   [Pre-Clean] Đã Undo History ID ${preClean.cleanedId} từ phiên gián đoạn trước để đảm bảo Baseline gốc.\n`);
  }

  const allResults = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log('--------------------------------------------------------------------------------');
    console.log(`▶ [${i + 1}/${TEST_CASES.length}] ${tc.id} (${tc.level}): ${tc.startDate} -> ${tc.endDate}`);
    console.log(`  Mô tả: ${tc.desc}`);

    // BƯỚC 1: Kiểm tra Dashboard ban đầu (D_Before) tại đúng khoảng ngày [startDate, endDate]
    await tabDashboard.bringToFront();
    const dBefore = await fetchDashboardStats(tabDashboard, token, BRANCH, SCHEDULE_ID, tc.startDate, tc.endDate);
    console.log(`  [Bước 1 - Dashboard Before (${tc.startDate}..${tc.endDate})]`);
    console.log(`    Saved Mileage: ${dBefore.saved_mileage} mi | Saved Drive Time: ${dBefore.saved_drive_time} min | Total Saved: $${dBefore.total_saved_usd}`);

    // BƯỚC 2 & BƯỚC 3: Qua Tab 1 (Sandbox) -> Route -> Chọn ngày -> Find Jobs -> Optimize
    await tabSandbox.bringToFront();

    const optResult = await tabSandbox.evaluate(async ({ tok, bId, sId, start, end }) => {
      const headers = {
        token: tok,
        'gd-branch-id': bId,
        platform: 'web',
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      };
      const body = {
        schedule_ids: sId,
        start: `${start}T00:00:00+00:00`,
        end: `${end}T23:59:59+00:00`,
        statuses: -1,
        inc: 'recurring',
        color_id: 1,
        exclude: []
      };
      const res = await fetch('https://apiv2.gdesk.io/api/routing/mantis/manual/optimize', {
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
      let statsDaily = [];
      let statsTotal = {};
      let optimizationId = null;

      for (const c of chunks) {
        if (c.type === 'jobs' && c.scope === 'before') beforeJobs = c.data || [];
        if (c.type === 'jobs' && c.scope === 'optimized') afterJobs = c.data || [];
        if (c.type === 'stats' && c.scope === 'daily') statsDaily = c.data || [];
        if (c.type === 'stats' && c.scope === 'total') statsTotal = c.data || {};
        if ((c.type === 'completed' || c.type === 'done') && c.optimization_id) {
          optimizationId = c.optimization_id;
        }
      }

      const jobIds = beforeJobs.map(j => String(j.job?.id)).filter(Boolean);
      const optJobIds = afterJobs.map(j => String(j.job?.id)).filter(Boolean);

      return {
        optimizationId,
        jobIds: optJobIds.length > 0 ? optJobIds : jobIds,
        beforeJobsCount: beforeJobs.length,
        afterJobsCount: afterJobs.length,
        statsTotal,
        statsDaily
      };
    }, { tok: token, bId: BRANCH, sId: SCHEDULE_ID, start: tc.startDate, end: tc.endDate });

    const st = optResult.statsTotal || {};
    const beforeMetrics = {
      jobs_assigned: st.jobs_assigned?.before?.value ?? optResult.beforeJobsCount,
      work_time_min: st.time_ratio?.work_time?.before?.value ?? 0,
      drive_time_min: st.drive_time?.before?.value ?? 0,
      downtime_min: st.time_ratio?.downtime?.before?.value ?? 0,
      distance_mi: st.distance?.before?.value ?? 0,
      fuel_gal: st.fuel?.before?.value ?? 0,
      delays: st.delays?.before?.value ?? 0,
      cost_usd: st.total_saved?.before?.value ?? 0
    };
    const afterMetrics = {
      jobs_assigned: st.jobs_assigned?.after?.value ?? optResult.afterJobsCount,
      work_time_min: st.time_ratio?.work_time?.after?.value ?? 0,
      drive_time_min: st.drive_time?.after?.value ?? 0,
      downtime_min: st.time_ratio?.downtime?.after?.value ?? 0,
      distance_mi: st.distance?.after?.value ?? 0,
      fuel_gal: st.fuel?.after?.value ?? 0,
      delays: st.delays?.after?.value ?? 0,
      cost_usd: st.total_saved?.after?.value ?? 0
    };
    const savedDelta = {
      drive_time_min: st.drive_time?.saved?.value ?? Number((beforeMetrics.drive_time_min - afterMetrics.drive_time_min).toFixed(2)),
      distance_mi: st.distance?.saved?.value ?? Number((beforeMetrics.distance_mi - afterMetrics.distance_mi).toFixed(2)),
      downtime_min: st.time_ratio?.downtime?.saved?.value ?? Number((beforeMetrics.downtime_min - afterMetrics.downtime_min).toFixed(2)),
      fuel_gal: st.fuel?.saved?.value ?? Number((beforeMetrics.fuel_gal - afterMetrics.fuel_gal).toFixed(2)),
      delays_reduced: st.delays?.saved?.value ?? (beforeMetrics.delays - afterMetrics.delays),
      stream_saved_usd: st.total_saved?.saved?.value ?? 0,
      formula_dashboard_usd: Number(((st.fuel?.saved?.value ?? 0) * 3.5 + (st.drive_time?.saved?.value ?? 0) * 0.5).toFixed(2))
    };

    console.log(`  [Bước 2 - Before-Optimize] Jobs: ${beforeMetrics.jobs_assigned} | Work: ${beforeMetrics.work_time_min}m | Drive: ${beforeMetrics.drive_time_min}m | Dist: ${beforeMetrics.distance_mi}mi | Fuel: ${beforeMetrics.fuel_gal}gal | Delays: ${beforeMetrics.delays}`);
    console.log(`  [Bước 3 - After-Optimize ] Jobs: ${afterMetrics.jobs_assigned} | Work: ${afterMetrics.work_time_min}m | Drive: ${afterMetrics.drive_time_min}m | Dist: ${afterMetrics.distance_mi}mi | Fuel: ${afterMetrics.fuel_gal}gal | Delays: ${afterMetrics.delays}`);
    console.log(`  [Số liệu đã trừ (Delta) ] ΔDrive: ${savedDelta.drive_time_min}m | ΔDist: ${savedDelta.distance_mi}mi | ΔFuel: ${savedDelta.fuel_gal}gal | ΔDelays: ${savedDelta.delays_reduced} | OptID: ${optResult.optimizationId}`);

    // BƯỚC 4: Nhấn Accept -> Qua Tab 2 (Dashboard kế bên phải) kiểm tra số liệu đã trừ có khớp không
    let acceptData = null;
    let historyIdCreated = null;
    if (optResult.optimizationId && optResult.jobIds.length > 0) {
      acceptData = await tabSandbox.evaluate(async ({ tok, bId, optId, sId, jIds }) => {
        const headers = {
          token: tok,
          'gd-branch-id': bId,
          platform: 'web',
          'Content-Type': 'application/json'
        };
        const res = await fetch('https://apiv2.gdesk.io/api/routing/mantis/manual/accept', {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            optimization_id: optId,
            schedule_ids: [Number(sId)],
            job_ids: jIds
          })
        });
        const text = await res.text();
        const lines = text.split('\n').filter(Boolean);
        let lastJson = null;
        for (const l of lines) {
          try { lastJson = JSON.parse(l); } catch (e) {}
        }
        return lastJson;
      }, { tok: token, bId: BRANCH, optId: optResult.optimizationId, sId: SCHEDULE_ID, jIds: optResult.jobIds });

      historyIdCreated = acceptData?.data?.history_id || null;
      console.log(`  [Bước 4 - Accept] Thành công: ${acceptData?.success} | Applied Jobs: ${acceptData?.data?.applied_jobs} | History ID: ${historyIdCreated}`);
    }

    // Chuyển sang Tab 2 (Dashboard kế bên phải) để kiểm tra đúng ngày vừa Optimize
    await tabDashboard.bringToFront();
    await tabDashboard.waitForTimeout(1000);
    const dAfterAccept = await fetchDashboardStats(tabDashboard, token, BRANCH, SCHEDULE_ID, tc.startDate, tc.endDate);

    const dashboardDiffOnAccept = {
      saved_mileage_diff: Number((dAfterAccept.saved_mileage - dBefore.saved_mileage).toFixed(2)),
      saved_drive_time_diff: Number((dAfterAccept.saved_drive_time - dBefore.saved_drive_time).toFixed(2)),
      total_saved_usd_diff: Number((dAfterAccept.total_saved_usd - dBefore.total_saved_usd).toFixed(2))
    };

    console.log(`  [Bước 4 - Dashboard After Accept (${tc.startDate}..${tc.endDate})]`);
    console.log(`    Saved Mileage: ${dAfterAccept.saved_mileage} mi (Δ = ${dashboardDiffOnAccept.saved_mileage_diff >= 0 ? '+' : ''}${dashboardDiffOnAccept.saved_mileage_diff} mi vs Optimize ΔDist = ${savedDelta.distance_mi} mi)`);
    console.log(`    Saved Drive Time: ${dAfterAccept.saved_drive_time} min (Δ = ${dashboardDiffOnAccept.saved_drive_time_diff >= 0 ? '+' : ''}${dashboardDiffOnAccept.saved_drive_time_diff} min vs Optimize ΔDrive = ${savedDelta.drive_time_min} min)`);
    console.log(`    Total Saved ($): $${dAfterAccept.total_saved_usd} (Δ = ${dashboardDiffOnAccept.total_saved_usd_diff >= 0 ? '+' : ''}$${dashboardDiffOnAccept.total_saved_usd_diff})`);

    if (i === 0 || i === TEST_CASES.length - 1) {
      await tabDashboard.screenshot({ path: path.join(__dirname, '..', 'reports', `${tc.id}_dashboard_after_accept.png`) });
    }

    // BƯỚC 5: Qua Tab 3 (Activity Feed kế bên phải) -> Chọn History đầu tiên -> Nhấn Undo để trả khôi phục lại
    await tabActivity.bringToFront();
    await tabActivity.waitForTimeout(800);

    const undoResult = await tabActivity.evaluate(async ({ tok, bId, expectedHistId }) => {
      const headers = {
        token: tok,
        'gd-branch-id': bId,
        platform: 'web',
        'Content-Type': 'application/json'
      };
      const hUrl = 'https://apiv2.gdesk.io/api/routing/mantis/feeds/history?start=2026-10-01T00:00:00%2B00:00&end=2026-10-31T23:59:59%2B00:00&limit=10';
      const hRes = await fetch(hUrl, { headers }).then(r => r.json());
      const firstHistory = (hRes.data || [])[0];
      const targetId = firstHistory?.id || expectedHistId;

      if (!targetId) return { error: 'No history ID found' };

      const uRes = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/feeds/history/${targetId}/undo`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({})
      }).then(r => r.json());

      const hResAfter = await fetch(hUrl, { headers }).then(r => r.json());
      const updatedRow = (hResAfter.data || []).find(r => String(r.id) === String(targetId));

      return {
        firstHistoryId: targetId,
        firstHistoryMode: firstHistory?.mode,
        firstHistoryStats: firstHistory?.stats,
        undoResponse: uRes,
        statusAfterUndo: updatedRow?.status
      };
    }, { tok: token, bId: BRANCH, expectedHistId: historyIdCreated });

    console.log(`  [Bước 5 - Activity Feed Undo] History đầu tiên ID: ${undoResult.firstHistoryId} | Undo Success: ${undoResult.undoResponse?.success} | Status sau Undo: ${undoResult.statusAfterUndo} (3 = Đã khôi phục)`);

    // Kiểm tra lại Dashboard sau khi Undo xem đã trả về đúng D_Before chưa
    await tabDashboard.bringToFront();
    await tabDashboard.waitForTimeout(800);
    const dAfterUndo = await fetchDashboardStats(tabDashboard, token, BRANCH, SCHEDULE_ID, tc.startDate, tc.endDate);
    const restoredExact =
      Math.abs(dAfterUndo.saved_mileage - dBefore.saved_mileage) < 0.05 &&
      Math.abs(dAfterUndo.saved_drive_time - dBefore.saved_drive_time) < 0.5 &&
      Math.abs(dAfterUndo.total_saved_usd - dBefore.total_saved_usd) < 0.05;

    console.log(`  [Xác nhận sau Undo] Dashboard (${tc.startDate}..${tc.endDate}): Mileage=${dAfterUndo.saved_mileage}mi, Drive=${dAfterUndo.saved_drive_time}m, Saved=$${dAfterUndo.total_saved_usd} -> Khôi phục 100%: ${restoredExact ? '✅ ĐẠT' : '⚠️ LỆCH'}\n`);

    allResults.push({
      caseId: tc.id,
      level: tc.level,
      startDate: tc.startDate,
      endDate: tc.endDate,
      description: tc.desc,
      step1_dashboardBefore: dBefore,
      step2_beforeOptimize: beforeMetrics,
      step3_afterOptimize: afterMetrics,
      step3_savedDelta: savedDelta,
      step3_dailyBreakdown: (optResult.statsDaily || []).map(d => ({
        day: d.day_label,
        jobsBefore: d.jobs_assigned?.before?.value,
        jobsAfter: d.jobs_assigned?.after?.value,
        driveBefore: d.drive_time?.before?.value,
        driveAfter: d.drive_time?.after?.value,
        driveSaved: d.drive_time?.saved?.value,
        distBefore: d.distance?.before?.value,
        distAfter: d.distance?.after?.value,
        distSaved: d.distance?.saved?.value
      })),
      step4_acceptInfo: {
        optimizationId: optResult.optimizationId,
        appliedJobs: acceptData?.data?.applied_jobs,
        historyId: historyIdCreated
      },
      step4_dashboardAfterAccept: dAfterAccept,
      step4_dashboardDeltaOnAccept: dashboardDiffOnAccept,
      step5_undoInfo: undoResult,
      step5_dashboardAfterUndo: dAfterUndo,
      verdict: {
        hasOptimizationDelta: savedDelta.drive_time_min !== 0 || savedDelta.distance_mi !== 0,
        historyRecordedMatch: String(undoResult.firstHistoryId) === String(historyIdCreated),
        historyStatsMatchOptimize:
          Math.abs((undoResult.firstHistoryStats?.saved_drive_time?.value ?? 0) - savedDelta.drive_time_min) <= 1 &&
          Math.abs((undoResult.firstHistoryStats?.saved_distance?.value ?? 0) - savedDelta.distance_mi) <= 0.1,
        dashboardUpdatedOnAccept:
          dashboardDiffOnAccept.saved_mileage_diff !== 0 ||
          dashboardDiffOnAccept.saved_drive_time_diff !== 0 ||
          dashboardDiffOnAccept.total_saved_usd_diff !== 0,
        dashboardDeltaMatchesOptimize:
          Math.abs(dashboardDiffOnAccept.saved_mileage_diff - savedDelta.distance_mi) <= 0.5 &&
          Math.abs(dashboardDiffOnAccept.saved_drive_time_diff - savedDelta.drive_time_min) <= 1,
        undoRestoredSuccessfully: undoResult.statusAfterUndo === 3 && restoredExact
      }
    });

    // Lưu kết quả tăng dần sau mỗi case
    fs.writeFileSync('reports/closed_loop_dashboard_optimize_undo_results.json', JSON.stringify(allResults, null, 2));
  }

  // Chụp màn hình 3 Tab cuối cùng làm bằng chứng
  await tabSandbox.bringToFront();
  await tabSandbox.screenshot({ path: path.join(__dirname, '..', 'reports', 'closed_loop_tab1_sandbox.png') });
  await tabDashboard.bringToFront();
  await tabDashboard.screenshot({ path: path.join(__dirname, '..', 'reports', 'closed_loop_tab2_dashboard.png') });
  await tabActivity.bringToFront();
  await tabActivity.screenshot({ path: path.join(__dirname, '..', 'reports', 'closed_loop_tab3_activity_feed.png') });

  console.log('================================================================================');
  console.log('   HOÀN TẤT 8 KỊCH BẢN (1 NGÀY -> 2 NGÀY -> NHIỀU NGÀY) & KHÔI PHỤC NGUYÊN TRẠNG!');
  console.log('   File kết quả: reports/closed_loop_dashboard_optimize_undo_results.json');
  console.log('================================================================================');

  await browser.close();
})();
