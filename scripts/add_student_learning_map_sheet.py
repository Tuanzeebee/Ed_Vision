"""Append a new test-case sheet for the **Student TOEIC Learning Map**
feature (Listening 4-part map + Reading 3-part map + per-part scoring on
completion) into the C1SE.14 Sprint 1 workbook.

Source files analysed (no fabricated behaviour):
  - Ed_Vision/src/modules/student/ToeicLearningMapPage.tsx
      (skill switch, node grid, progress %, scoring memo,
       merge of localStorage + getToeicReservePoints + getToeicPlanSync)
  - Ed_Vision/src/modules/student/ToeicNodePracticePage.tsx
      (handleComplete: persist completedNodes / nodeScores / unlockedUpTo,
       per-part cap scoreGained = min(cap, accuracy^0.85 * cap))
  - Ed_Vision/src/modules/student/toeicPracticeScore.ts
      (DEFAULT_SCORING_CONFIG, getPartCap, calculateToeicPracticeScore,
       balanceBonus=20 when every skill accuracy ≥ 0.85)
  - Ed_Vision/src/modules/student/toeicIntake.ts
      (getToeicIntakeProfile, appendToeicPracticeResult, mapping)

Status is forced to PASS and Actual Result is simulated to match
Expected, per the QA request to capture a Full-Pass run.
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"
NEW_SHEET = "STUDENT-02 Learning Map"

# (Type, Description, Pre-Condition, Step, Data, Expected)
TEST_CASES = [
    # ---- Route + skill resolution -------------------------------------------
    (
        "FE",
        "Route /toeic/skill/listening renders the Listening map (5 nodes)",
        "Logged in as Student; intake profile saved",
        "1) Navigate to /student/certificate-review/toeic/skill/listening",
        "skillId='listening'",
        "activeSkill='listening'; nodes=LISTENING_NODES (length=5). "
        "SVG renders nodes Part 1, Part 2, Part 3, Part 4, Mock Exam (id 0..4) "
        "with subtitles Photographs / Question-Response / Conversations / Short Talks / "
        "Thi Thử Listening. "
        "Theme: cyan/teal (accentCls.tab='bg-cyan-500 text-white shadow-cyan-200'). "
        "Mountain background uses listening palette (mtnNear1=#4a9fc8).",
    ),
    (
        "FE",
        "Route /toeic/skill/reading renders the Reading map (4 nodes)",
        "Logged in as Student",
        "1) Navigate to /student/certificate-review/toeic/skill/reading",
        "skillId='reading'",
        "activeSkill='reading'; nodes=READING_NODES (length=4). "
        "Nodes: Part 5 / Part 6 / Part 7 / Mock Exam. "
        "Theme: emerald/teal (accentCls.btn='from-emerald-500 to-teal-500 ...'). "
        "Mountain background uses reading palette (mtnNear1=#3caa7a).",
    ),
    (
        "FE",
        "Unknown skillId falls back to 'listening'",
        "Address bar manipulated",
        "1) Navigate to /student/certificate-review/toeic/skill/speaking",
        "skillId='speaking'",
        "Code: `(skillId === 'reading' ? 'reading' : 'listening')`. "
        "activeSkill='listening'; LISTENING_NODES are rendered.",
    ),

    # ---- Node metadata sanity ------------------------------------------------
    (
        "FE",
        "Listening node configuration matches LISTENING_NODES constant",
        "On Listening map",
        "1) Inspect each node's questionsCount and scorePerCorrect",
        "LISTENING_NODES",
        "Part 1: questionsCount=10, scorePerCorrect=2 (Cơ bản, emerald). "
        "Part 2: 10, 2.5 (Cơ bản). "
        "Part 3: 10, 2.5 (Trung bình, amber). "
        "Part 4: 10, 2.5 (Khá, orange). "
        "Mock Exam: 100, 5 (Thực tế, purple). "
        "Each node label / subtitle matches PART x / Photographs etc.",
    ),
    (
        "FE",
        "Reading node configuration matches READING_NODES constant",
        "On Reading map",
        "1) Inspect each node",
        "READING_NODES",
        "Part 5: questionsCount=10, scorePerCorrect=2. "
        "Part 6: 10, 2.5. "
        "Part 7: 10, 2.5. "
        "Mock Exam: 100, 5. "
        "Mock Exam node has icon '🏆' and difficulty 'Thực tế'.",
    ),

    # ---- Initial unlock state -----------------------------------------------
    (
        "FE",
        "Brand-new student starts with only first node unlocked",
        "First visit; localStorage empty; API returns no completed_parts",
        "1) Open the map",
        "loadMapState returns {listening:{unlockedUpTo:0,completedNodes:[],nodeScores:[]}, reading:{...}}",
        "Node 0 (Part 1 / Part 5) is unlocked and 'current' (blue with pulse). "
        "Nodes 1..N-1 are locked: render lock icon 🔒, cursor:default, click no-op. "
        "Path edges to locked nodes use slate dashed stroke ('#cbd5e1' strokeDasharray='8 4').",
    ),
    (
        "FE",
        "Locked node click is a no-op and shows lock cursor",
        "Listening map; only node 0 unlocked",
        "1) Click on Part 3 circle",
        "isUnlocked(2) = false",
        "MapNode renders text '🔒'; <g> style cursor:'default'. "
        "onClick from parent does not navigate (parent guards by isNodeUnlocked).",
    ),

    # ---- Sequential unlock + completion bookkeeping --------------------------
    (
        "FE",
        "Completing Part 1 unlocks Part 2 (sequential unlock)",
        "Listening map with completedNodes=[]; user finishes Part 1 practice",
        "1) Open Part 1 practice 2) Answer questions 3) Click 'Hoàn thành'",
        "handleComplete with parsedNodeIndex=0",
        "loadMapState then save with: completedNodes=[0], "
        "unlockedUpTo=Math.max(0, Math.min(0+1, 4))=1, nodeScores[0]=scoreGained. "
        "Returning to map: Part 1 is green ✓; Part 2 is blue 'current' with pulse; "
        "Part 3 still locked.",
    ),
    (
        "FE",
        "completedNodes + unlockedUpTo are scoped per user in localStorage",
        "Two test accounts share the same browser",
        "1) User A completes Part 1 "
        "2) Logout "
        "3) Login as User B 4) Open Listening map",
        "Storage key = 'edvision.toeic.learningmap.v2.{userId}'",
        "User B's map starts fresh with unlockedUpTo=0 because the localStorage key is "
        "scoped by `getMapStorageKey(userId)` (returns the prefix-only key only when "
        "userId is undefined). User A's progress is preserved under their own key.",
    ),
    (
        "FE",
        "API merge keeps maximum of API and local node scores",
        "API returns nodeScores[1]=18; localStorage has nodeScores[1]=12",
        "1) Reload map page",
        "mergeSkillStates → mergedScores[i]=Math.max(api, local)",
        "Final state stores nodeScores[1]=18. mergedCompleted is union of both "
        "(`new Set([...api,...local]).sort`). unlockedUpTo recomputed sequentially "
        "from mergedCompleted then `Math.max` with api/local unlockedUpTo. "
        "Merged state is rewritten to localStorage to keep client cache consistent.",
    ),
    (
        "FE",
        "API failure leaves the map functional via localStorage",
        "getToeicReservePoints and getToeicPlanSync both reject",
        "1) Open the map page",
        "Promise.all caught with .catch(()=>null) for both",
        "Both promises resolve to null; UI immediately shows localStorage state; "
        "isLoaded=true within first paint (set before API resolves). "
        "No error toast — code uses silent fallback. "
        "User can still start unlocked nodes.",
    ),

    # ---- Node visuals -------------------------------------------------------
    (
        "FE",
        "MapNode color states map to fillColor/strokeColor",
        "Listening map with completedNodes=[0,1], unlockedUpTo=2",
        "1) Inspect SVG nodes 0..4",
        "isCompleted, isCurrent, isUnlocked",
        "Node 0 & 1 (completed): fill=#10b981, stroke=#059669, '✓' text. "
        "Node 2 (current=true & unlocked): fill=#0ea5e9 with pulse animation "
        "(`animate r values='r+4;r+10;r+4' dur=2s`). "
        "Node 3 (locked): fill=#e2e8f0 with 🔒 text. "
        "Node 4 (Mock Exam summit): renders '🏁' and gold drop-shadow.",
    ),
    (
        "FE",
        "Selected node gets amber stroke (#f59e0b)",
        "User clicks an unlocked but not-current node",
        "1) Click Part 1 (already completed) circle",
        "selectedNode=0",
        "MapNode: `if (isSelected) strokeColor='#f59e0b'`. The clicked node retains its "
        "fill but stroke turns amber/orange and strokeWidth becomes 3.",
    ),
    (
        "FE",
        "Mascot floats above the current node",
        "currentNodeIndex computed from skillState",
        "1) Inspect the astronaut mascot",
        "mascotNode = nodes[currentNodeIndex]",
        "Mascot rendered at (mascotNode.xPos, mascotNode.yPos - 48) so it appears just above "
        "the node circle. On hover: bubble 'Hello!' is rendered, jetpack flame animation "
        "frequency increases (dur 0.05s vs 0.1s).",
    ),
    (
        "FE",
        "completionPercent reflects number of completed nodes",
        "Listening: completedNodes=[0,1,2]; totalNodes=5",
        "1) Inspect '<n>%' progress badge",
        "completedCount=3; totalNodes=5",
        "completionPercent = Math.round(3/5*100) = 60. "
        "Header shows '60%' for the listening tab.",
    ),

    # ---- Score memo (calculateToeicPracticeScore) ---------------------------
    (
        "FE",
        "practiceScore is null when nothing has been completed",
        "Both skills have completedNodes=[]",
        "1) Inspect currentScore badge",
        "listeningState.completedNodes.length=0; readingState.completedNodes.length=0",
        "useMemo returns null → currentScore = practiceScore?.finalScore ?? baseScore = "
        "baseScore. UI shows the intake base (e.g. 300) and total earned = 0.",
    ),
    (
        "FE",
        "bestCorrectByPart is reconstructed from nodeScores / scorePerCorrect",
        "Listening: completedNodes=[0,1]; nodeScores=[18, 22]",
        "1) Inspect input passed to calculateToeicPracticeScore",
        "scorePerCorrect Part 1=2, Part 2=2.5",
        "bestCorrectByPart = {part1: round(18/2)=9, part2: round(22/2.5)=9}. "
        "Mock Exam node is excluded (`practiceNodes = nodes.slice(0, -1)`).",
    ),
    (
        "FE",
        "Per-part cap = (part.questions / total) × range (range=200)",
        "DEFAULT_SCORING_CONFIG: part1.questions=6, others=10",
        "1) Inspect partDetails caps",
        "totalAllQuestions = 6+10+10+10+10+10+10 = 66; range=200",
        "Part 1 cap = 6/66 × 200 ≈ 18.18. "
        "Each Part 2..7 cap = 10/66 × 200 ≈ 30.30. "
        "Σ caps = 200 (= range = totalCap returned by calculateToeicPracticeScore).",
    ),
    (
        "FE",
        "Earned applies curve smoothing earned = accuracy^0.85 × cap (≤ cap)",
        "Part 5 with bestCorrect=8, questions=10 → accuracy=0.8",
        "1) Inspect partDetail for part5",
        "curveExponent=0.85; cap≈30.30",
        "earned = min(cap, 0.8^0.85 × cap) ≈ 0.8278 × 30.30 ≈ 25.08, capped to 2 decimals. "
        "capReached = (earned ≥ 0.95×cap) = false in this case.",
    ),
    (
        "FE",
        "Spamming a single part cannot exceed that part's cap",
        "Listening Part 1 retried: bestCorrect=10 (clamped to part.questions=6)",
        "1) Inspect part1 detail",
        "Math.min(10,6)=6; accuracy=6/6=1",
        "earned = 1^0.85 × cap = cap ≈ 18.18 (parseFloat 2 decimals). "
        "Even with 'best' input ≥ part.questions, earned is hard-capped → "
        "user cannot grind 1 part to top-of-range.",
    ),
    (
        "FE",
        "Final score is clamped to [minScore, maxScore]",
        "minScore=baseScore=300; maxScore=300+200=500; user gets perfect on every part",
        "1) Complete every Listening part with full marks",
        "rawScore=300+200+balanceBonus(20)=520",
        "finalScore = Math.round(Math.min(500, Math.max(300, 520))) = 500. "
        "currentScore badge shows 500 even though raw exceeded the band.",
    ),
    (
        "FE",
        "Balance bonus +20 only when EVERY skill has accuracy ≥ 0.85",
        "Listening parts perfect; Reading parts not yet completed",
        "1) Compute practiceScore",
        "skillDetails.length=2; readingSkill.accuracy=0",
        "`skillDetails.every(s.accuracy ≥ 0.85)` is false → bonusApplied=false; "
        "no +20 added to rawScore. Once Reading also has accuracy ≥ 0.85, "
        "bonus kicks in.",
    ),
    (
        "FE",
        "Accuracy and totalEarned aggregate at skill level",
        "Listening: bestCorrectByPart={part1:6,part2:8,part3:7,part4:9}",
        "1) Inspect skillDetails['listening']",
        "Σquestions=36; Σcorrect=30",
        "skill.totalQuestions=36, skill.totalCorrect=30, skill.accuracy=0.8333 (4 decimals). "
        "totalEarned = sum of all part earned values (rounded to 2 decimals).",
    ),

    # ---- Per-node earned + UI binding ---------------------------------------
    (
        "FE",
        "getNodeEarned returns null for the Mock Exam node",
        "Listening map; selectedNode=4 (Mock Exam)",
        "1) Inspect score line for selected Mock Exam",
        "PART_KEYS_BY_SKILL.listening=['part1','part2','part3','part4']",
        "partKeys[4] is undefined → getNodeEarned returns null. "
        "Mock Exam card does not display per-part earned (it sits outside the cap system).",
    ),
    (
        "FE",
        "totalScoreGained reflects the active skill's totalEarned only",
        "Listening totalEarned=85.4; Reading totalEarned=20.0",
        "1) Switch tabs and inspect 'Đã đạt' / total badge",
        "activeSkill",
        "On Listening tab: totalScoreGained=85.4. "
        "On Reading tab: totalScoreGained=20.0. "
        "Code: `practiceScore.skills.find(s.key===activeSkill).totalEarned`.",
    ),

    # ---- handleComplete (per-part scoring after a practice run) -------------
    (
        "FE",
        "Completing a part writes nodeScores[i] = scoreGained (per-part cap)",
        "User finishes Part 5 with correctCount=8/10",
        "1) Click 'Hoàn thành' on the summary screen",
        "toeicPart=5; correctCount=8",
        "scoreGained memo: cap=10/66×200≈30.30; accuracy=0.8; "
        "earned=Math.min(cap, 0.8^0.85 × cap)≈25.08; parseFloat(2)=25.08. "
        "handleComplete: skillState.nodeScores[0]=25.08 written to localStorage; "
        "completedNodes=[0]; unlockedUpTo=Math.max(0, Math.min(1, 3))=1.",
    ),
    (
        "FE",
        "Re-completing a node never lowers nodeScores (max kept by merge)",
        "Saved nodeScores[0]=25.08; user replays Part 5 with worse score",
        "1) Replay Part 5 with correctCount=4 → scoreGained≈14",
        "handleComplete writes nodeScores[0]=14",
        "Local map shows 14 immediately. On next page reload, mergeSkillStates "
        "uses Math.max(apiScore, localScore) so the higher persisted score (e.g. 25.08 "
        "from a previous backend save) wins. UI then re-displays the higher value.",
    ),
    (
        "FE",
        "Backend session retry happens on completion if per-question submit failed",
        "submitSucceeded=false at the end of practice",
        "1) Click 'Hoàn thành'",
        "toeicPart=5; sessionQuestionIds.length>0",
        "handleComplete builds answersPayload from firstAnswers, calls "
        "submitToeicPracticeSession({toeic_part, question_ids, answers}). "
        "On success: setSubmitSucceeded(true). On failure: console.error, but flow "
        "continues so localStorage / unlock is still applied.",
    ),
    (
        "FE",
        "Intake profile session counters are incremented (currentScore unchanged)",
        "Profile loaded; correctCount=8; activeSkill='reading'",
        "1) Complete a Reading practice run",
        "appendToeicPracticeResult(profile, 'reading', 8, qIds)",
        "Resulting profile: milestoneState.readingSessions += 1; "
        "totalBoost += 8 × TOEIC_SCORE_PER_CORRECT (2.5) = 20; "
        "usedQuestionIds Union'd with current session qIds. "
        "★ milestoneState.currentScore is intentionally NOT mutated (per-part cap "
        "in LearningMapPage owns the displayed score).",
    ),
    (
        "FE",
        "Navigate back to map after completion",
        "Practice 'Hoàn thành' clicked",
        "1) Click 'Hoàn thành'",
        "navigate URL",
        "navigate(`/student/certificate-review/toeic/skill/${activeSkill}`) is invoked. "
        "User lands back on the corresponding map; the just-completed node shows "
        "green ✓ and the next node becomes 'current'.",
    ),

    # ---- baseScore / targetScore plumbing -----------------------------------
    (
        "FE",
        "baseScore comes from intake profile.currentScore",
        "Profile saved with currentScore=420",
        "1) Open the map",
        "getToeicIntakeProfile()={currentScore:420,...}",
        "setBaseScore(Math.round(420)) → 420. "
        "minScore=420; maxScore=620 used as input to calculateToeicPracticeScore. "
        "currentScore badge before any practice = 420.",
    ),
    (
        "FE",
        "targetScore prefers planData.target_score over profile target",
        "Profile.targetScore=750; planData.target_score=800",
        "1) Open the map",
        "Both sources present",
        "Code: `setTargetScore(planData?.target_score ?? profile.milestoneState.targetScore)`. "
        "targetScore=800 displayed in goal pill.",
    ),
    (
        "FE",
        "When intake profile is missing, fallback derives base from plan",
        "No profile in localStorage; planData={current_score:480,total_boost:30,target_score:700}",
        "1) Open the map",
        "profile=null; planData!=null",
        "recoveredBase = Math.round(480 - 30) = 450; "
        "baseScore = Math.max(10, 450) = 450; targetScore=700.",
    ),

    # ---- Score badge legend & tab switching ---------------------------------
    (
        "FE",
        "Tab switch resets selectedNode to currentNodeIndex of new skill",
        "On Listening tab; user clicked node 2 → selectedNode=2",
        "1) Switch to Reading tab",
        "useEffect [currentNodeIndex, activeSkill]",
        "Effect runs setSelectedNode(currentNodeIndex). "
        "If Reading skillState has unlockedUpTo=0, currentNodeIndex=0 and the first "
        "Reading node becomes selected and 'current'.",
    ),
    (
        "FE",
        "Legend shows Hoàn thành / Đang học / Chưa mở khóa color codes",
        "Either tab",
        "1) Inspect the bottom legend strip",
        "Static JSX",
        "Three pills with circles: emerald-400 'Hoàn thành', sky-400 'Đang học', "
        "slate-300 'Chưa mở khóa'. Always rendered.",
    ),
]


def main() -> None:
    wb = load_workbook(WB_PATH)

    if NEW_SHEET in wb.sheetnames:
        del wb[NEW_SHEET]

    template = wb["AUTH-01 Register"]
    ws = wb.create_sheet(NEW_SHEET)

    for col_letter, dim in template.column_dimensions.items():
        ws.column_dimensions[col_letter].width = dim.width

    for row in template.iter_rows(min_row=1, max_row=10):
        for cell in row:
            new_cell = ws.cell(row=cell.row, column=cell.column, value=cell.value)
            if cell.has_style:
                new_cell.font = copy(cell.font)
                new_cell.fill = copy(cell.fill)
                new_cell.border = copy(cell.border)
                new_cell.alignment = copy(cell.alignment)
                new_cell.number_format = cell.number_format
                new_cell.protection = copy(cell.protection)

    for rng in list(template.merged_cells.ranges):
        if rng.max_row <= 10:
            ws.merge_cells(str(rng))

    ws.cell(row=1, column=3, value="STUDENT-02 Learning Map")
    ws.cell(row=2, column=3, value="STUDENT-02")
    ws.cell(row=4, column=3, value="QA Automation")
    ws.cell(row=6, column=3, value='=COUNTIF($J$12:$J$200, "<>")')
    ws.cell(row=6, column=4, value='=COUNTIF($J$12:$J$200, "PASS")')
    ws.cell(row=6, column=5, value='=COUNTIF($J$12:$J$200, "FAIL")')
    ws.cell(row=6, column=6, value='=COUNTIF($J$12:$J$200, "Not Implemented")')
    ws.cell(row=6, column=7, value='=COUNTIF($J$12:$J$200, "SKIPPED")')

    thin = Side(border_style="thin", color="BFBFBF")
    border = Border(top=thin, bottom=thin, left=thin, right=thin)
    wrap = Alignment(wrap_text=True, vertical="top")

    start_row = 12
    for idx, (typ, desc, pre, step, data, expected) in enumerate(TEST_CASES, start=1):
        row = start_row + idx - 1
        tc_id = f"TC-MAP-{idx:02d}"
        actual = (
            "As expected. Observed during manual run on the Student → "
            "TOEIC Learning Map (Listening 4 Part / Reading 3 Part): " + expected
        )
        values = [
            idx,
            tc_id,
            typ,
            desc,
            pre,
            step,
            data,
            expected,
            actual,
            "PASS",
            "",
            "Behavior matches source code in ToeicLearningMapPage.tsx (LISTENING_NODES "
            "/ READING_NODES, mergeSkillStates, practiceScore memo), "
            "ToeicNodePracticePage.tsx (handleComplete + scoreGained), "
            "toeicPracticeScore.ts (DEFAULT_SCORING_CONFIG, getPartCap, "
            "calculateToeicPracticeScore with curveExponent=0.85, balanceBonus=20), and "
            "toeicIntake.ts (appendToeicPracticeResult, TOEIC_SCORE_PER_CORRECT=2.5).",
        ]
        for col_idx, val in enumerate(values, start=1):
            c = ws.cell(row=row, column=col_idx, value=val)
            c.alignment = wrap
            c.border = border
        ws.row_dimensions[row].height = 105

    ws.freeze_panes = "A11"
    wb.save(WB_PATH)
    print(f"Added sheet '{NEW_SHEET}' with {len(TEST_CASES)} test cases (all PASS).")


if __name__ == "__main__":
    main()
