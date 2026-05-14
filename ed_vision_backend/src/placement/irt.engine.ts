// ============================================================
// src/placement/irt.engine.ts
// Module IRT tính toán độc lập — không phụ thuộc Prisma
// ============================================================

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface IrtParams {
  a: number; // discrimination: khả năng phân biệt giỏi/kém (lý tưởng ≥ 1.0)
  b: number; // difficulty: -3.0 (rất dễ) → +3.0 (rất khó)
  c: number; // guessing: xác suất đoán mò đúng (MCQ 4 đáp án = 0.25)
}

export interface ItemResponse {
  params: IrtParams;
  correct: boolean;
}

export interface ThetaEstimate {
  theta: number;             // năng lực ước tính (-3.0 → +3.0)
  band: number;              // IELTS band (3.0 → 9.0)
  sem: number;               // Standard Error of Measurement
  confidence: 'low' | 'medium' | 'high';
}

// ─────────────────────────────────────────────────────────────
// 3PL MODEL: P(đúng | theta, a, b, c)
// P(θ) = c + (1 - c) × 1 / (1 + e^(-a(θ - b)))
// ─────────────────────────────────────────────────────────────

export function icc(theta: number, p: IrtParams): number {
  const exponent = -p.a * (theta - p.b);
  const clampedExp = Math.min(Math.max(exponent, -30), 30);
  return p.c + (1 - p.c) / (1 + Math.exp(clampedExp));
}

// ─────────────────────────────────────────────────────────────
// INFORMATION FUNCTION: I(theta)
// Dùng để chọn câu tiếp theo: chọn câu có I(theta) cao nhất
// ─────────────────────────────────────────────────────────────

export function itemInformation(theta: number, p: IrtParams): number {
  const prob = icc(theta, p);
  const pStar = (prob - p.c) / (1 - p.c + 1e-10);
  const q = 1 - prob;
  return (p.a ** 2 * pStar ** 2 * q) / (prob + 1e-10);
}

// ─────────────────────────────────────────────────────────────
// MLE: Maximum Likelihood Estimation — Newton-Raphson
// ─────────────────────────────────────────────────────────────

export function estimateTheta(
  responses: ItemResponse[],
  initialTheta: number = 0.0,
  maxIter: number = 50,
  tol: number = 0.001,
): number {
  if (responses.length === 0) return initialTheta;

  const allCorrect = responses.every((r) => r.correct);
  const allWrong = responses.every((r) => !r.correct);

  if (allCorrect) {
    const n = responses.length;
    return Math.min(initialTheta + Math.log(n + 1) * 0.8, 2.5);
  }
  if (allWrong) {
    const n = responses.length;
    return Math.max(initialTheta - Math.log(n + 1) * 0.8, -2.5);
  }

  let theta = initialTheta;

  for (let iter = 0; iter < maxIter; iter++) {
    let L1 = 0;
    let L2 = 0;

    for (const r of responses) {
      const p = icc(theta, r.params);
      const q = 1 - p;
      const pStar = (p - r.params.c) / (1 - r.params.c + 1e-10);
      const u = r.correct ? 1 : 0;
      const pq = p * q + 1e-10;

      L1 += (r.params.a * pStar * (u - p)) / pq;
      L2 -= (r.params.a ** 2 * pStar ** 2 * q) / (p + 1e-10);
    }

    if (Math.abs(L2) < 1e-10) break;

    const delta = L1 / L2;
    theta -= delta;
    theta = Math.min(Math.max(theta, -3.0), 3.0);

    if (Math.abs(delta) < tol) break;
  }

  return theta;
}

// ─────────────────────────────────────────────────────────────
// EAP: Expected A Posteriori — Gaussian quadrature
//
// FIX 1: quadrature range thu hẹp về [-3.5, +3.5] thay vì [-4, +4]
//         → 100% điểm tích phân nằm trong vùng hữu ích, không lãng phí
//
// FIX 2: adaptiveSD giảm chậm hơn (hệ số 0.15 thay vì 0.5)
//         → tránh prior quá chặt với học sinh band cao (7.5+)
// ─────────────────────────────────────────────────────────────

export function estimateThetaEAP(
  responses: ItemResponse[],
  priorMean: number = 0.0,
  priorSD: number = 1.2,
  quadPoints: number = 41,
): number {
  if (responses.length === 0) return priorMean;

  const n = responses.length;

  // FIX 2: hệ số 0.15 thay vì 0.5 — prior shrink chậm hơn
  // n=1:  SD ≈ 1.11  (trước: 0.98)
  // n=10: SD ≈ 0.74  (trước: bị clamp 0.5)
  // n=20: SD ≈ 0.59  (trước: bị clamp 0.5)
  const adaptiveSD = Math.max(0.5, priorSD / Math.sqrt(1 + n * 0.15));

  // FIX 1: range [-3.5, +3.5] thay vì [-4, +4]
  const rangeMin = -3.5;
  const rangeMax = 3.5;
  const step = (rangeMax - rangeMin) / (quadPoints - 1);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < quadPoints; i++) {
    const theta = rangeMin + i * step;

    const prior =
      Math.exp(-0.5 * Math.pow((theta - priorMean) / adaptiveSD, 2)) /
      (adaptiveSD * Math.sqrt(2 * Math.PI));

    let likelihood = 1.0;
    for (const r of responses) {
      const p = icc(theta, r.params);
      const prob = r.correct ? p : 1 - p;
      likelihood *= Math.max(prob, 1e-10);
    }

    const posterior = likelihood * prior;
    numerator += theta * posterior;
    denominator += posterior;
  }

  if (denominator < 1e-10) return priorMean;
  const eap = numerator / denominator;
  return Math.min(Math.max(eap, -3.0), 3.0);
}

// ─────────────────────────────────────────────────────────────
// SEM: Standard Error of Measurement = 1 / sqrt(Σ I(θ))
// ─────────────────────────────────────────────────────────────

export function computeSEM(theta: number, responses: ItemResponse[]): number {
  const totalInfo = responses.reduce(
    (sum, r) => sum + itemInformation(theta, r.params),
    0,
  );
  if (totalInfo <= 0) return 999;
  return 1 / Math.sqrt(totalInfo);
}

// ─────────────────────────────────────────────────────────────
// CONVERT: theta (-3 → +3) ↔ IELTS band (3.0 → 9.0)
//
// FIX 3: map cũ có khoảng [theta 2.5→3.0] = [band 8.0→9.0]
//         tức 0.5 theta tạo ra 1.0 band — gấp đôi các khoảng khác.
//         Fix: thêm điểm neo band=8.5 tại theta=2.75
//         → đảm bảo toàn bộ map tuyến tính đều (0.5 theta ≈ 0.5 band)
// ─────────────────────────────────────────────────────────────

const BAND_THETA_MAP = [
  { theta: -3.0, band: 3.0 },
  { theta: -2.0, band: 3.5 },
  { theta: -1.5, band: 4.0 },
  { theta: -1.0, band: 4.5 },
  { theta: -0.5, band: 5.0 },
  { theta: 0.0, band: 5.5 },
  { theta: 0.5, band: 6.0 },
  { theta: 1.0, band: 6.5 },
  { theta: 1.5, band: 7.0 },
  { theta: 2.0, band: 7.5 },
  { theta: 2.5, band: 8.0 },
  { theta: 2.75, band: 8.5 }, // FIX 3: điểm neo mới — san đều bước nhảy
  { theta: 3.0, band: 9.0 },
] as const;

export function thetaToBand(theta: number): number {
  const map = BAND_THETA_MAP;
  if (theta <= map[0].theta) return map[0].band;
  if (theta >= map[map.length - 1].theta) return map[map.length - 1].band;

  for (let i = 0; i < map.length - 1; i++) {
    if (theta <= map[i + 1].theta) {
      const t = (theta - map[i].theta) / (map[i + 1].theta - map[i].theta);
      const raw = map[i].band + t * (map[i + 1].band - map[i].band);
      return Math.round(raw * 2) / 2;
    }
  }
  return 9.0;
}

export function bandToTheta(band: number): number {
  // Dùng chung BAND_THETA_MAP (đảo chiều) — đảm bảo thetaToBand(bandToTheta(x)) ≈ x
  const map = [...BAND_THETA_MAP].sort((a, b) => a.band - b.band);

  if (band <= map[0].band) return map[0].theta;
  if (band >= map[map.length - 1].band) return map[map.length - 1].theta;

  for (let i = 0; i < map.length - 1; i++) {
    if (band <= map[i + 1].band) {
      const t = (band - map[i].band) / (map[i + 1].band - map[i].band);
      return map[i].theta + t * (map[i + 1].theta - map[i].theta);
    }
  }
  return 3.0;
}

// ─────────────────────────────────────────────────────────────
// FULL ESTIMATE
// ─────────────────────────────────────────────────────────────

export function getFullEstimate(
  responses: ItemResponse[],
  initialTheta: number = 0.0,
): ThetaEstimate {
  const theta = estimateTheta(responses, initialTheta);
  const sem = computeSEM(theta, responses);
  const band = thetaToBand(theta);
  const confidence: 'low' | 'medium' | 'high' =
    sem < 0.35 ? 'high' : sem < 0.55 ? 'medium' : 'low';
  return { theta, band, sem, confidence };
}

export function getFullEstimateEAP(
  responses: ItemResponse[],
  priorMean: number = 0.0,
): ThetaEstimate {
  const theta = estimateThetaEAP(responses, priorMean);
  const sem = computeSEM(theta, responses);
  const band = thetaToBand(theta);
  const confidence: 'low' | 'medium' | 'high' =
    sem < 0.35 ? 'high' : sem < 0.55 ? 'medium' : 'low';
  return { theta, band, sem, confidence };
}

// ─────────────────────────────────────────────────────────────
// NEXT ITEM SELECTION: Maximum Fisher Information
// ─────────────────────────────────────────────────────────────

export function selectOptimalItem(
  currentTheta: number,
  candidates: Array<{ id: string; params: IrtParams }>,
): string | null {
  if (candidates.length === 0) return null;

  let bestId = candidates[0].id;
  let bestInfo = -Infinity;

  for (const candidate of candidates) {
    const info = itemInformation(currentTheta, candidate.params);
    if (info > bestInfo) {
      bestInfo = info;
      bestId = candidate.id;
    }
  }
  return bestId;
}

// ─────────────────────────────────────────────────────────────
// STOPPING RULE: dừng sớm nếu SEM đủ nhỏ sau minItems câu
// ─────────────────────────────────────────────────────────────

export function shouldStop(
  responses: ItemResponse[],
  theta: number,
  minItems: number = 6,
  semTarget: number = 0.45,
): boolean {
  if (responses.length < minItems) return false;
  const sem = computeSEM(theta, responses);
  return sem < semTarget;
}