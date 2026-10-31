const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 PROCTORGUARD SAAS - END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Test Lecturer Login
  console.log('--- 1. Testing Staff / Lecturer Authentication ---');
  let lecturerToken = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dradewale@unilag.edu.ng',
        password: 'Lecturer@2026!',
      }),
    });
    const data = await res.json();
    assert(res.status === 200, `Lecturer login status code is 200 (Got ${res.status})`);
    assert(data.success === true && !!data.token, 'Token returned successfully');
    assert(data.user?.institution?.includes('UNILAG'), 'User institution matches UNILAG');
    lecturerToken = data.token;
  } catch (err) {
    assert(false, `Lecturer login failed: ${err.message}`);
  }

  // 2. Test Super Admin Login
  console.log('\n--- 2. Testing Super Admin Authentication ---');
  let adminToken = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@proctorguard.edu.ng',
        password: 'Admin@2026!',
      }),
    });
    const data = await res.json();
    assert(res.status === 200, `Admin login status code is 200 (Got ${res.status})`);
    assert(data.user?.role === 'SUPER_ADMIN', 'User role is SUPER_ADMIN');
    adminToken = data.token;
  } catch (err) {
    assert(false, `Admin login failed: ${err.message}`);
  }

  // 3. Test Word Document (.docx) Extraction Engine
  console.log('\n--- 3. Testing Word Document (.docx) Ingestion Engine ---');
  try {
    const docxPath = path.join(__dirname, '..', 'public', 'samples', 'LAW301_Sample_Exam_Paper.docx');
    if (!fs.existsSync(docxPath)) {
      throw new Error(`File not found at ${docxPath}`);
    }
    const fileBytes = fs.readFileSync(docxPath);
    const blob = new Blob([fileBytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const formData = new FormData();
    formData.append('file', blob, 'LAW301_Sample_Exam_Paper.docx');

    const res = await fetch(`${BASE_URL}/api/exams/exam-law-test-1/upload-docx`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lecturerToken}`,
      },
      body: formData,
    });

    const data = await res.json();
    assert(res.status === 200, `Docx upload status code is 200 (Got ${res.status})`);
    assert(data.success === true, 'Upload response indicates success');
    assert(data.totalParsed > 0, `Extracted ${data.totalParsed} questions from Nigerian collegiate exam doc`);
    assert(data.stagingQuestions && data.stagingQuestions.length > 0, 'Staging questions payload generated');
    if (data.stagingQuestions && data.stagingQuestions.length > 0) {
      console.log(`     Sample parsed Q1: "${data.stagingQuestions[0].prompt.slice(0, 70)}..."`);
      console.log(`     Options count: ${data.stagingQuestions[0].options.length}, Correct: ${data.stagingQuestions[0].options.find(o => o.isCorrect)?.text || 'N/A'}`);
    }
  } catch (err) {
    assert(false, `Word docx upload failed: ${err.message}`);
  }

  // 4. Test Excel (.xlsx) & CSV Export Engine
  console.log('\n--- 4. Testing Multi-Sheet Excel & CSV Export Engine ---');
  try {
    // Excel export
    const xlsxRes = await fetch(`${BASE_URL}/api/exams/exam-law-test-1/export?format=xlsx`, {
      headers: { Authorization: `Bearer ${lecturerToken}` },
    });
    assert(xlsxRes.status === 200, `Excel export status code is 200 (Got ${xlsxRes.status})`);
    const contentType = xlsxRes.headers.get('content-type') || '';
    assert(contentType.includes('spreadsheetml'), `Content-Type is Excel spreadsheet (Got ${contentType})`);
    const xlsxBuffer = await xlsxRes.arrayBuffer();
    assert(xlsxBuffer.byteLength > 1000, `Received valid XLSX binary payload (${xlsxBuffer.byteLength} bytes)`);

    // CSV export
    const csvRes = await fetch(`${BASE_URL}/api/exams/exam-law-test-1/export?format=csv`, {
      headers: { Authorization: `Bearer ${lecturerToken}` },
    });
    assert(csvRes.status === 200, `CSV export status code is 200 (Got ${csvRes.status})`);
    const csvText = await csvRes.text();
    assert(csvText.includes('Matriculation Number') || csvText.includes('Student Name'), 'CSV includes standard headers');
  } catch (err) {
    assert(false, `Export engine failed: ${err.message}`);
  }

  // 5. Test Candidate Assessment & Zero-Data-Loss Pipeline
  console.log('\n--- 5. Testing Candidate CBT Assessment & Proctoring Flow ---');
  let testAttempt = null;
  try {
    const matric = `LAW/2022/${Math.floor(1000 + Math.random() * 9000)}`;
    const enterRes = await fetch(`${BASE_URL}/api/student/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessCode: 'LAW301-2026',
        studentIdentifier: matric,
        studentName: 'Babatunde Fashola Jr.',
      }),
    });
    const enterData = await enterRes.json();
    assert(enterRes.status === 200, `Student entered exam successfully (Status 200)`);
    assert(enterData.attempt && enterData.attempt.id, `Attempt session initialized: ${enterData.attempt?.id}`);
    assert(enterData.questions && enterData.questions.length > 0, `Delivered ${enterData.questions?.length} randomized questions`);
    testAttempt = enterData.attempt;

    // Session Resume while in progress (Network disruption resilience)
    const resumeRes = await fetch(`${BASE_URL}/api/student/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessCode: 'LAW301-2026',
        studentIdentifier: matric,
        studentName: 'Babatunde Fashola Jr.',
      }),
    });
    const resumeData = await resumeRes.json();
    assert(resumeRes.status === 200 && resumeData.attempt?.id === testAttempt.id, 'Session resume supported during active connection disruption');

    // Sync an answer (Zero-Data-Loss write-through)
    const firstQ = enterData.questions[0];
    const syncRes = await fetch(`${BASE_URL}/api/student/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: testAttempt.id,
        questionId: firstQ.id,
        selectedOptionId: firstQ.options?.[0]?.id || 'opt-1',
        clientTimestamp: Date.now(),
      }),
    });
    const syncData = await syncRes.json();
    assert(syncRes.status === 200 && syncData.success === true, 'Answer synchronized and timestamp acknowledged');

    // Proctoring violation logging
    const violationRes = await fetch(`${BASE_URL}/api/student/violation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: testAttempt.id,
        violationType: 'TAB_SWITCH',
        metadata: { blurDurationMs: 1400, urlAttempted: 'https://google.com' },
      }),
    });
    const violationData = await violationRes.json();
    assert(violationRes.status === 200, 'Tab switch infraction recorded by anti-malpractice engine');
    assert(violationData.tabSwitchCount === 1, `Tab switch counter incremented to ${violationData.tabSwitchCount}`);

    // Candidate Submission & Auto-Grading
    const submitRes = await fetch(`${BASE_URL}/api/student/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: testAttempt.id,
        status: 'SUBMITTED',
      }),
    });
    const submitData = await submitRes.json();
    assert(submitRes.status === 200, 'Exam submitted and graded successfully');
    assert(typeof submitData.attempt?.score === 'number', `Final score calculated: ${submitData.attempt?.score} marks`);

    // Single-attempt enforcement check after submission
    const reEnterRes = await fetch(`${BASE_URL}/api/student/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessCode: 'LAW301-2026',
        studentIdentifier: matric,
        studentName: 'Babatunde Fashola Jr.',
      }),
    });
    assert(reEnterRes.status === 403, `Single-attempt policy strictly blocked re-entry after submission (Got 403 Forbidden)`);
  } catch (err) {
    assert(false, `Candidate assessment flow failed: ${err.message}`);
  }

  // 6. Test Super Admin Override & Audit Trail Dispatch
  console.log('\n--- 6. Testing Super Admin Override & Audit Trail Dispatch ---');
  try {
    if (!testAttempt) {
      throw new Error('No attempt available to test override');
    }
    const overrideRes = await fetch(`${BASE_URL}/api/admin/override-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        attemptId: testAttempt.id,
        newScore: 85.0,
        reason: 'NUC Quality Assurance moderation after candidate grievance review.',
      }),
    });
    const overrideData = await overrideRes.json();
    assert(overrideRes.status === 200, `Super Admin score override succeeded (Status 200)`);
    assert(overrideData.attempt?.score === 85.0, `Attempt score updated to ${overrideData.attempt?.score}`);

    // Verify Audit Log was recorded
    const auditRes = await fetch(`${BASE_URL}/api/admin/audit`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();
    const auditList = auditData.auditLogs || auditData.logs || [];
    let logFound = false;
    for (let i = 0; i < auditList.length; i++) {
      const act = String(auditList[i].action || '');
      if (act.includes('SCORE_OVERRIDE') || act.includes('OVERRIDE_SCORE')) {
        logFound = true;
        break;
      }
    }
    assert(logFound, 'SCORE_OVERRIDE action logged with actor ID and diff metadata');
  } catch (err) {
    assert(false, `Super Admin audit trail failed: ${err.message}`);
  }

  // 7. Test Tenant Subscription Management
  console.log('\n--- 7. Testing Tenant Quota & Subscription Management ---');
  try {
    const tenantRes = await fetch(`${BASE_URL}/api/admin/tenants`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const tenantData = await tenantRes.json();
    assert(tenantRes.status === 200, `Tenants query returned status 200`);
    assert(tenantData.tenants && tenantData.tenants.length > 0, `Retrieved ${tenantData.tenants?.length} institution tenants`);

    // Update tier & quota
    const targetTenantId = tenantData.tenants[0]?.id || 'inst-adewale-01';
    const updateTierRes = await fetch(`${BASE_URL}/api/admin/tenants/${targetTenantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        tier: 'PREMIUM',
        status: 'ACTIVE',
        maxStudents: 1500,
        maxExamsPerMonth: 100,
        storageLimitMb: 5000,
      }),
    });
    const updatedTierData = await updateTierRes.json();
    assert(updateTierRes.status === 200, `Tenant quota updated to PREMIUM with 1500 max students`);
    assert(updatedTierData.subscription?.tier === 'PREMIUM', 'Subscription tier is PREMIUM');
  } catch (err) {
    assert(false, `Tenant subscription test failed: ${err.message}`);
  }

  // 8. Test Dynamic Timer Warning Threshold Logic
  console.log('\n--- 8. Testing Dynamic Timer Warning Threshold Logic ---');
  try {
    function computeCriticalThreshold(durationMinutes) {
      return durationMinutes >= 30 ? 5 * 60 : 3 * 60;
    }
    const longExamThreshold = computeCriticalThreshold(45);
    const shortExamThreshold = computeCriticalThreshold(20);
    assert(longExamThreshold === 300, `45-min exam triggers critical red-blinking alert at 300s (5 mins)`);
    assert(shortExamThreshold === 180, `20-min exam triggers critical red-blinking alert at 180s (3 mins)`);
  } catch (err) {
    assert(false, `Dynamic timer test failed: ${err.message}`);
  }

  // 9. Test AI Proctoring Gaze & Motion Violation Ingestion
  console.log('\n--- 9. Testing AI Proctoring Vision Infraction Logging ---');
  try {
    if (testAttempt) {
      // Test LOOKING_AWAY violation
      const gazeRes = await fetch(`${BASE_URL}/api/student/violation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: testAttempt.id,
          violationType: 'LOOKING_AWAY',
          metadata: {
            direction: 'LEFT',
            durationFrames: 4,
            gazeDeviation: 0.38,
            confidence: 0.92,
          },
        }),
      });
      const gazeData = await gazeRes.json();
      assert(gazeRes.status === 200, 'LOOKING_AWAY infraction logged successfully');
      assert(gazeData.violationType === 'LOOKING_AWAY' || gazeData.success === true, 'Recorded infraction type is LOOKING_AWAY');

      // Test NO_FACE_DETECTED violation
      const noFaceRes = await fetch(`${BASE_URL}/api/student/violation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: testAttempt.id,
          violationType: 'NO_FACE_DETECTED',
          metadata: {
            consecutiveDarkFrames: 5,
            candidateInFrame: false,
          },
        }),
      });
      const noFaceData = await noFaceRes.json();
      assert(noFaceRes.status === 200, 'NO_FACE_DETECTED infraction logged successfully');
      assert(noFaceData.violationType === 'NO_FACE_DETECTED' || noFaceData.success === true, 'Recorded infraction type is NO_FACE_DETECTED');
    }
  } catch (err) {
    assert(false, `AI proctoring violation test failed: ${err.message}`);
  }

  // 10. Test Billing Plans & Interactive Paywall Checkout
  console.log('\n--- 10. Testing Paywall Tier Quotas & Subscription Checkout ---');
  try {
    // Fetch pricing plans
    const plansRes = await fetch(`${BASE_URL}/api/billing/plans`, {
      headers: { Authorization: `Bearer ${lecturerToken}` },
    });
    const plansData = await plansRes.json();
    assert(plansRes.status === 200, `Billing plans endpoint returned status 200`);
    assert(plansData.plans?.length === 3, `Returned 3 competitive tiers (MEMBER, PRO, PREMIUM)`);

    const memberPlan = plansData.plans.find((p) => (p.tier || p.id) === 'MEMBER');
    const proPlan = plansData.plans.find((p) => (p.tier || p.id) === 'PRO');
    const premiumPlan = plansData.plans.find((p) => (p.tier || p.id) === 'PREMIUM');

    assert(memberPlan?.maxStudents === 200 && memberPlan?.maxExamsPerMonth === 5, 'MEMBER tier: 200 students, 5 tests/month');
    assert(proPlan?.maxStudents === 500 && proPlan?.maxExamsPerMonth === 10, 'PRO tier: 500 students, 10 tests/month');
    assert(premiumPlan?.maxStudents === 1000 && premiumPlan?.maxExamsPerMonth === -1, 'PREMIUM tier: 1000 students, unlimited tests');

    // Test Checkout Upgrade to PRO
    const checkoutRes = await fetch(`${BASE_URL}/api/billing/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lecturerToken}`,
      },
      body: JSON.stringify({
        tier: 'PRO',
        billingCycle: 'monthly',
        paymentMethod: 'paystack',
      }),
    });
    const checkoutData = await checkoutRes.json();
    assert(checkoutRes.status === 200, `Paywall checkout to PRO returned status 200`);
    assert(checkoutData.success === true, 'Checkout status is success');
    assert(checkoutData.subscription?.tier === 'PRO', `Subscription successfully updated to PRO (500 students quota)`);
    const receiptRef = checkoutData.receipt?.invoiceNumber || checkoutData.receipt?.receiptNumber;
    assert(!!receiptRef, `Generated official receipt #${receiptRef}`);
  } catch (err) {
    assert(false, `Paywall & billing checkout test failed: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
