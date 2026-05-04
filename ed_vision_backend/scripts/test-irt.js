"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const irt_engine_1 = require("../src/placement/irt.engine");
const SEP = '═'.repeat(60);
const sep = '─'.repeat(60);
const G = (s) => `\x1b[32m${s}\x1b[0m`;
const R = (s) => `\x1b[31m${s}\x1b[0m`;
const Y = (s) => `\x1b[33m${s}\x1b[0m`;
const B = (s) => `\x1b[36m${s}\x1b[0m`;
const W = (s) => `\x1b[1m${s}\x1b[0m`;
function testBandMapping() {
    console.log(`\n${SEP}`);
    console.log(W('TEST 1: thetaToBand + bandToTheta mapping'));
    console.log(SEP);
    const cases = [
        { theta: -3.0, expectedBand: 3.0 },
        { theta: -2.0, expectedBand: 3.5 },
        { theta: -1.5, expectedBand: 4.0 },
        { theta: -1.0, expectedBand: 4.5 },
        { theta: -0.5, expectedBand: 5.0 },
        { theta: 0.0, expectedBand: 5.5 },
        { theta: 0.5, expectedBand: 6.0 },
        { theta: 1.0, expectedBand: 6.5 },
        { theta: 1.5, expectedBand: 7.0 },
        { theta: 2.0, expectedBand: 7.5 },
        { theta: 3.0, expectedBand: 9.0 },
    ];
    let pass = 0;
    for (const c of cases) {
        const band = (0, irt_engine_1.thetaToBand)(c.theta);
        const ok = Math.abs(band - c.expectedBand) < 0.01;
        const mark = ok ? G('✓') : R('✗');
        if (ok)
            pass++;
        console.log(`  ${mark} theta=${c.theta.toFixed(1).padStart(5)} → band=${band.toFixed(1)} ${ok ? '' : R(`(expected ${c.expectedBand})`)}`);
    }
    console.log(`\n  ${pass}/${cases.length} passed ${pass === cases.length ? G('✓') : R('FAIL')}`);
}
function testThetaDirection() {
    console.log(`\n${SEP}`);
    console.log(W('TEST 2: Theta thay đổi đúng hướng sau mỗi câu'));
    console.log(SEP);
    const item = { a: 1.2, b: 0.0, c: 0.25 };
    const initTheta = 0.0;
    const correct = [{ correct: true, params: item }];
    const wrong = [{ correct: false, params: item }];
    const thetaCorrect = (0, irt_engine_1.estimateThetaEAP)(correct, initTheta);
    const thetaWrong = (0, irt_engine_1.estimateThetaEAP)(wrong, initTheta);
    const ok1 = thetaCorrect > initTheta;
    const ok2 = thetaWrong < initTheta;
    console.log(`  ${ok1 ? G('✓') : R('✗')} Trả lời ĐÚNG:  theta ${initTheta.toFixed(3)} → ${thetaCorrect.toFixed(3)} (${ok1 ? G('tăng ✓') : R('KHÔNG tăng ✗')})`);
    console.log(`  ${ok2 ? G('✓') : R('✗')} Trả lời SAI:   theta ${initTheta.toFixed(3)} → ${thetaWrong.toFixed(3)}   (${ok2 ? G('giảm ✓') : R('KHÔNG giảm ✗')})`);
    console.log(`\n  ${Y('Simulation: 10 câu đúng liên tiếp')}`);
    let responses = [];
    let theta = initTheta;
    for (let i = 1; i <= 10; i++) {
        responses.push({ correct: true, params: item });
        const est = (0, irt_engine_1.getFullEstimateEAP)(responses, theta);
        theta = est.theta;
        console.log(`    Q${i.toString().padStart(2)}: theta=${theta.toFixed(3).padStart(7)}, band=${est.band.toFixed(1)}, sem=${est.sem.toFixed(4)}, conf=${est.confidence}`);
    }
    console.log(`\n  ${Y('Simulation: 10 câu sai liên tiếp')}`);
    responses = [];
    theta = initTheta;
    for (let i = 1; i <= 10; i++) {
        responses.push({ correct: false, params: item });
        const est = (0, irt_engine_1.getFullEstimateEAP)(responses, theta);
        theta = est.theta;
        console.log(`    Q${i.toString().padStart(2)}: theta=${theta.toFixed(3).padStart(7)}, band=${est.band.toFixed(1)}, sem=${est.sem.toFixed(4)}, conf=${est.confidence}`);
    }
}
function testSEMDecreasing() {
    console.log(`\n${SEP}`);
    console.log(W('TEST 3: SEM giảm dần theo số câu'));
    console.log(SEP);
    const item = { a: 1.2, b: 0.0, c: 0.25 };
    const responses = [];
    let prevSem = 999;
    let allDecreasing = true;
    console.log(`  ${'Q'.padEnd(4)} ${'theta'.padEnd(8)} ${'band'.padEnd(6)} ${'SEM'.padEnd(8)} ${'trend'.padEnd(8)} confidence`);
    console.log(`  ${sep}`);
    for (let i = 1; i <= 20; i++) {
        responses.push({ correct: i % 2 === 1, params: item });
        const est = (0, irt_engine_1.getFullEstimateEAP)(responses, 0);
        const decreasing = est.sem <= prevSem + 0.01;
        if (!decreasing)
            allDecreasing = false;
        const trend = decreasing ? G('↓') : R('↑ TĂNG!');
        console.log(`  Q${i.toString().padStart(2).padEnd(3)} ${est.theta.toFixed(3).padEnd(8)} ${est.band.toFixed(1).padEnd(6)} ${est.sem.toFixed(4).padEnd(8)} ${trend.padEnd(16)} ${est.confidence}`);
        prevSem = est.sem;
    }
    console.log(`\n  SEM overall: ${allDecreasing ? G('✓ giảm dần đúng') : Y('⚠ có dao động nhỏ (bình thường)')}`);
}
function testItemSelection() {
    console.log(`\n${SEP}`);
    console.log(W('TEST 4: Item selection — câu được chọn có b ≈ theta'));
    console.log(SEP);
    const pool = [-2.5, -2.0, -1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 2.0].map((b, i) => ({
        id: `q${i}`,
        params: { a: 1.2, b, c: 0.25 },
    }));
    const testThetas = [-2.0, -1.0, 0.0, 1.0, 2.0];
    let allCorrect = true;
    for (const theta of testThetas) {
        const bestId = (0, irt_engine_1.selectOptimalItem)(theta, pool);
        const best = pool.find(p => p.id === bestId);
        const diff = Math.abs(best.params.b - theta);
        const ok = diff <= 1.0;
        if (!ok)
            allCorrect = false;
        const mark = ok ? G('✓') : R('✗');
        console.log(`  ${mark} theta=${theta.toFixed(1).padStart(5)} → chọn b=${best.params.b.toFixed(1).padStart(5)} (|diff|=${diff.toFixed(1)}) ${ok ? '' : R('quá xa!')}`);
    }
    console.log(`\n  Item selection: ${allCorrect ? G('✓ hợp lý') : R('✗ có vấn đề')}`);
}
function testFullSimulation() {
    console.log(`\n${SEP}`);
    console.log(W('TEST 5: Simulate full test 20 câu — user band thật = 6.0'));
    console.log(SEP);
    console.log(`  Giả lập user có theta thật = 0.5 (band ~6.0)`);
    console.log(`  Câu đúng nếu: P(theta_thật | b, a, c) > random\n`);
    const trueTheta = 0.5;
    const pool = Array.from({ length: 30 }, (_, i) => ({
        id: `q${i}`,
        params: {
            a: 0.8 + Math.random() * 0.8,
            b: -2.5 + (i / 29) * 5,
            c: 0.20 + Math.random() * 0.10,
        },
    }));
    const responses = [];
    const usedIds = new Set();
    let theta = 0.0;
    let stoppedAt = null;
    console.log(`  ${'Q'.padEnd(4)} ${'b'.padEnd(6)} ${'P(θ)'.padEnd(7)} ${'Answer'.padEnd(8)} ${'θ est'.padEnd(8)} ${'Band'.padEnd(6)} ${'SEM'.padEnd(8)} Stop?`);
    console.log(`  ${sep}`);
    for (let i = 1; i <= 20; i++) {
        const available = pool.filter(p => !usedIds.has(p.id));
        const bestId = (0, irt_engine_1.selectOptimalItem)(theta, available);
        const item = available.find(p => p.id === bestId);
        usedIds.add(item.id);
        const pCorrect = item.params.c + (1 - item.params.c) / (1 + Math.exp(-item.params.a * (trueTheta - item.params.b)));
        const isCorrect = Math.random() < pCorrect;
        responses.push({ correct: isCorrect, params: item.params });
        const est = (0, irt_engine_1.getFullEstimateEAP)(responses, theta);
        theta = est.theta;
        const stop = (0, irt_engine_1.shouldStop)(responses, theta, 12, 0.30);
        if (stop && !stoppedAt)
            stoppedAt = i;
        const ans = isCorrect ? G('ĐÚNG') : R('SAI ');
        const stopMark = stop ? Y('← STOP') : '';
        console.log(`  Q${i.toString().padStart(2).padEnd(3)} ${item.params.b.toFixed(2).padEnd(6)} ${pCorrect.toFixed(3).padEnd(7)} ${ans.padEnd(16)} ${theta.toFixed(3).padEnd(8)} ${est.band.toFixed(1).padEnd(6)} ${est.sem.toFixed(4).padEnd(8)} ${stopMark}`);
    }
    const finalEst = (0, irt_engine_1.getFullEstimateEAP)(responses, 0);
    const error = Math.abs(finalEst.theta - trueTheta);
    const ok = error < 0.5;
    console.log(`\n  ${'─'.repeat(40)}`);
    console.log(`  True theta: ${trueTheta.toFixed(2)} (band ${(0, irt_engine_1.thetaToBand)(trueTheta).toFixed(1)})`);
    console.log(`  Estimated:  ${finalEst.theta.toFixed(2)} (band ${finalEst.band.toFixed(1)})`);
    console.log(`  Error:      ${error.toFixed(3)} ${ok ? G('✓ chính xác') : R('✗ sai lệch lớn')}`);
    console.log(`  Stop early: ${stoppedAt ? Y(`câu ${stoppedAt}`) : 'không'}`);
}
console.log(W(`\n${'█'.repeat(60)}`));
console.log(W('  IRT ENGINE TEST SUITE'));
console.log(W(`${'█'.repeat(60)}`));
testBandMapping();
testThetaDirection();
testSEMDecreasing();
testItemSelection();
testFullSimulation();
console.log(`\n${SEP}`);
console.log(W('  DONE'));
console.log(`${SEP}\n`);
//# sourceMappingURL=test-irt.js.map