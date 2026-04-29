// ============================================================
// STEP 3: src/placement/irt.engine.ts
// Module IRT tính toán độc lập — không phụ thuộc Prisma
// ============================================================

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface IrtParams {
  a: number   // discrimination: khả năng phân biệt giỏi/kém (lý tưởng ≥ 1.0)
  b: number   // difficulty: -3.0 (rất dễ) → +3.0 (rất khó)
  c: number   // guessing: xác suất đoán mò đúng (MCQ 4 đáp án = 0.25)
}

export interface ItemResponse {
  params:  IrtParams
  correct: boolean
}

export interface ThetaEstimate {
  theta:      number   // năng lực ước tính (-3.0 → +3.0)
  band:       number   // IELTS band (3.0 → 9.0)
  sem:        number   // Standard Error of Measurement — độ không chắc chắn
  confidence: 'low' | 'medium' | 'high'
}

// ─────────────────────────────────────────────────────────────
// 3PL MODEL: P(đúng | theta, a, b, c)
// ─────────────────────────────────────────────────────────────

export function icc(theta: number, p: IrtParams): number {
  // Item Characteristic Curve — xác suất trả lời đúng
  // P(θ) = c + (1 - c) × 1 / (1 + e^(-a(θ - b)))
  const exponent = -p.a * (theta - p.b)
  
  // Clamp exponent tránh overflow
  const clampedExp = Math.min(Math.max(exponent, -30), 30)
  
  return p.c + (1 - p.c) / (1 + Math.exp(clampedExp))
}

// ─────────────────────────────────────────────────────────────
// INFORMATION FUNCTION: I(theta) — lượng thông tin câu hỏi cung cấp
// Dùng để chọn câu tiếp theo: chọn câu có I(theta) cao nhất
// ─────────────────────────────────────────────────────────────

export function itemInformation(theta: number, p: IrtParams): number {
  const prob   = icc(theta, p)
  const pStar  = (prob - p.c) / (1 - p.c + 1e-10)  // loại bỏ guessing
  const q      = 1 - prob
  
  // I(θ) = a² × (P* )² × Q / P
  return (p.a ** 2) * (pStar ** 2) * q / (prob + 1e-10)
}

// ─────────────────────────────────────────────────────────────
// MLE: Maximum Likelihood Estimation cho theta
// Dùng Newton-Raphson iteration
// ─────────────────────────────────────────────────────────────

export function estimateTheta(
  responses:    ItemResponse[],
  initialTheta: number = 0.0,
  maxIter:      number = 50,
  tol:          number = 0.001,
): number {
  if (responses.length === 0) return initialTheta
  
  // Edge case: toàn đúng hoặc toàn sai → dùng EAP thay MLE (tránh diverge)
  const allCorrect = responses.every(r => r.correct)
  const allWrong   = responses.every(r => !r.correct)
  
  if (allCorrect) return Math.min(initialTheta + responses.length * 0.5, 3.0)
  if (allWrong)   return Math.max(initialTheta - responses.length * 0.5, -3.0)
  
  let theta = initialTheta
  
  for (let iter = 0; iter < maxIter; iter++) {
    let L1 = 0  // first derivative of log-likelihood
    let L2 = 0  // second derivative (negative of Fisher information)
    
    for (const r of responses) {
      const p    = icc(theta, r.params)
      const q    = 1 - p
      const pStar = (p - r.params.c) / (1 - r.params.c + 1e-10)
      const u    = r.correct ? 1 : 0
      
      // Tránh chia cho 0
      const pq = p * q + 1e-10
      
      L1 += r.params.a * pStar * (u - p) / pq
      L2 -= (r.params.a ** 2) * (pStar ** 2) * q / (p + 1e-10)
    }
    
    if (Math.abs(L2) < 1e-10) break
    
    const delta = L1 / L2
    theta -= delta
    
    // Clamp theta trong [-3, +3]
    theta = Math.min(Math.max(theta, -3.0), 3.0)
    
    if (Math.abs(delta) < tol) break
  }
  
  return theta
}

// ─────────────────────────────────────────────────────────────
// EAP: Expected A Posteriori estimation cho theta
// Dùng Gaussian quadrature với prior N(priorMean, priorSD)
// ─────────────────────────────────────────────────────────────

export function estimateThetaEAP(
  responses: ItemResponse[],
  priorMean: number = 0.0,
  priorSD:   number = 1.0,
  quadPoints: number = 41,
): number {
  if (responses.length === 0) return priorMean

  const step = 8 / (quadPoints - 1)
  let numerator = 0
  let denominator = 0

  for (let i = 0; i < quadPoints; i++) {
    const theta = -4 + i * step

    const prior = Math.exp(
      -0.5 * Math.pow((theta - priorMean) / priorSD, 2),
    ) / (priorSD * Math.sqrt(2 * Math.PI))

    let likelihood = 1.0
    for (const r of responses) {
      const p = icc(theta, r.params)
      const prob = r.correct ? p : 1 - p
      likelihood *= Math.max(prob, 1e-10)
    }

    const posterior = likelihood * prior
    numerator += theta * posterior
    denominator += posterior
  }

  if (denominator < 1e-10) return priorMean

  const eap = numerator / denominator
  return Math.min(Math.max(eap, -3.0), 3.0)
}

// ─────────────────────────────────────────────────────────────
// SEM: Standard Error of Measurement
// SEM = 1 / sqrt(Σ I(θ)) — càng nhỏ càng chính xác
// ─────────────────────────────────────────────────────────────

export function computeSEM(theta: number, responses: ItemResponse[]): number {
  const totalInfo = responses.reduce(
    (sum, r) => sum + itemInformation(theta, r.params),
    0,
  )
  
  if (totalInfo <= 0) return 999
  
  return 1 / Math.sqrt(totalInfo)
}

// ─────────────────────────────────────────────────────────────
// CONVERT: theta (-3 → +3) ↔ IELTS band (3.0 → 9.0)
// Linear map: theta=-3 → band=3.0, theta=0 → band=6.0, theta=+3 → band=9.0
// ─────────────────────────────────────────────────────────────

export function thetaToBand(theta: number): number {
  // band = theta × 1.0 + 6.0  (range 3.0–9.0 khi theta -3 → +3)
  const raw = theta + 6.0
  
  // Round về bội số 0.5 gần nhất, clamp [3.0, 9.0]
  const rounded = Math.round(raw * 2) / 2
  return Math.min(Math.max(rounded, 3.0), 9.0)
}

export function bandToTheta(band: number): number {
  return band - 6.0
}

// ─────────────────────────────────────────────────────────────
// FULL ESTIMATE: Trả về theta + band + SEM + confidence
// ─────────────────────────────────────────────────────────────

export function getFullEstimate(
  responses:    ItemResponse[],
  initialTheta: number = 0.0,
): ThetaEstimate {
  const theta = estimateTheta(responses, initialTheta)
  const sem   = computeSEM(theta, responses)
  const band  = thetaToBand(theta)
  
  // Confidence dựa trên SEM
  // SEM < 0.35 → high (band estimate ±0.5 band)
  // SEM < 0.55 → medium (±1.0 band)
  // SEM ≥ 0.55 → low (>±1.0 band)
  const confidence: 'low' | 'medium' | 'high' =
    sem < 0.35 ? 'high' :
    sem < 0.55 ? 'medium' : 'low'
  
  return { theta, band, sem, confidence }
}

export function getFullEstimateEAP(
  responses: ItemResponse[],
  priorMean: number = 0.0,
): ThetaEstimate {
  const theta = estimateThetaEAP(responses, priorMean)
  const sem   = computeSEM(theta, responses)
  const band  = thetaToBand(theta)

  const confidence: 'low' | 'medium' | 'high' =
    sem < 0.35 ? 'high' :
    sem < 0.55 ? 'medium' : 'low'

  return { theta, band, sem, confidence }
}

// ─────────────────────────────────────────────────────────────
// NEXT ITEM SELECTION: Chọn câu hỏi tối ưu tiếp theo
// Dựa trên Maximum Fisher Information tại theta hiện tại
// ─────────────────────────────────────────────────────────────

export function selectOptimalItem(
  currentTheta: number,
  candidates: Array<{ id: string; params: IrtParams }>,
): string | null {
  if (candidates.length === 0) return null
  
  let bestId   = candidates[0].id
  let bestInfo = -Infinity
  
  for (const candidate of candidates) {
    const info = itemInformation(currentTheta, candidate.params)
    if (info > bestInfo) {
      bestInfo = info
      bestId   = candidate.id
    }
  }
  
  return bestId
}

// ─────────────────────────────────────────────────────────────
// STOPPING RULE: Dừng sớm nếu đã đủ chính xác
// SEM < 0.30 sau ít nhất 6 câu → có thể dừng
// ─────────────────────────────────────────────────────────────

export function shouldStop(
  responses:   ItemResponse[],
  theta:       number,
  minItems:    number = 6,
  semTarget:   number = 0.30,
): boolean {
  if (responses.length < minItems) return false
  
  const sem = computeSEM(theta, responses)
  return sem < semTarget
}
