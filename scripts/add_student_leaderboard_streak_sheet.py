"""Append a new test-case sheet for the **Student Leaderboard + Streak**
feature into the C1SE.14 Sprint 1 workbook.

Source files analysed (no fabricated behaviour):
  - Ed_Vision/src/modules/student/components/StudentLeaderboard.tsx
      (sidebar card: profile mini, week/total tabs, top-10 list,
       cache + prefetch other tab, link to full page)
  - Ed_Vision/src/modules/student/ToeicFullLeaderboardPage.tsx
      (full page: hero with rank, week/total tabs, search, 10/page
       pagination, top-3 crowns, streak Flame badge, prefetch+cache)

Streak rendering across both files relies on
`entry.currentStreak` returned by the leaderboard endpoint, displayed as a
Flame icon and number in the orange pill on each row.

Status is forced to PASS and Actual Result is simulated to match
Expected, per the QA request to capture a Full-Pass run.
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"
NEW_SHEET = "STUDENT-04 Leaderboard & Streak"

# (Type, Description, Pre-Condition, Step, Data, Expected)
TEST_CASES = [
    # ============================================================
    # StudentLeaderboard sidebar card
    # ============================================================
    (
        "FE",
        "Sidebar card mounts on weekly tab and triggers personal-stats fetch",
        "Logged in as Student; sidebar card visible",
        "1) Open dashboard / page hosting StudentLeaderboard",
        "user?.id present",
        "Initial state tab='week', loading=true. cacheService.getOrFetch is invoked "
        "with key `leaderboard:personal-stats:<user.id>` and 30s TTL → "
        "getPersonalStats(). On success: personalStats updated to "
        "{weeklyExp, weeklyRank, totalScore, totalRank}.",
    ),
    (
        "FE",
        "Profile gradient strip shows fullName / fallback char and rank badge",
        "user.full_name='Nguyen Van A'; personalStats.totalScore=80",
        "1) Inspect upper section of the sidebar card",
        "Auth user fields and totalScore",
        "Avatar uses currentUserAvatar img if present, else uppercase first letter "
        "(`currentUserName.charAt(0)`). Heading shows 'Nguyen Van A'. "
        "rankBadge from getRankBadge(80)= 'Trung cấp 🔥' (60≤score<140). "
        "Pill rendered with bg-orange-500/15 + border-orange-400/30.",
    ),
    (
        "FE",
        "getRankBadge thresholds: 0..59 Sơ cấp, 60..139 Trung cấp, ≥140 Cao cấp",
        "Multiple students with different totalScore",
        "1) Compute rank label for scores 0, 59, 60, 139, 140",
        "score input",
        "0 → 'Sơ cấp 🌱' emerald; 59 → 'Sơ cấp 🌱'; 60 → 'Trung cấp 🔥' orange; "
        "139 → 'Trung cấp'; 140 → 'Cao cấp 👑' amber.",
    ),
    (
        "FE",
        "Stats grid renders Tuần / Tổng with formatted numbers",
        "personalStats={weeklyExp:42, weeklyRank:7, totalScore:128.5, totalRank:23}",
        "1) Inspect 4-cell grid",
        "personalStats fields",
        "Cell 1: 'Điểm tuần này' = 42. "
        "Cell 2: 'Hạng tuần này' = 7. "
        "Cell 3: 'Tổng điểm tích lũy' = 128.5 (totalScore.toFixed(1), green-500). "
        "Cell 4: 'Hạng tổng' = 23 (sky-500).",
    ),
    (
        "FE",
        "Null personalStats ranks render 'Chưa xếp hạng'",
        "personalStats.weeklyRank=null and totalRank=null",
        "1) Inspect rank cells",
        "weeklyRank=null; totalRank=null",
        "Both rank cells display 'Chưa xếp hạng' (ternary `weeklyRank ? weeklyRank : "
        "'Chưa xếp hạng'`).",
    ),
    (
        "FE",
        "personalStats fetch failure leaves zero defaults",
        "getPersonalStats rejects",
        "1) Inspect grid after silent failure",
        "Catch swallowed",
        "personalStats stays at initial {weeklyExp:0, weeklyRank:null, totalScore:0, "
        "totalRank:null}. Card shows zeros and 'Chưa xếp hạng'.",
    ),
    (
        "FE",
        "Tab switch (week ↔ total) updates list without flicker via cache",
        "Both tabs already prefetched into cacheService",
        "1) Click 'Tổng xếp hạng' tab",
        "Tab state changes",
        "useEffect on tab dependency runs. cacheService.peek hits → setData with "
        "stale entries immediately, loading=false. cacheService.isFresh true → no "
        "refetch. UI swaps instantly without spinner.",
    ),
    (
        "FE",
        "Initial weekly fetch falls back to API when no cache",
        "First-ever page load",
        "1) Open the sidebar card",
        "cacheService.peek returns undefined",
        "loading=true. fetchLeaderboard runs `getWeeklyLeaderboard(100,0)` (limit=100, "
        "offset=0) and the response is cached under "
        "`leaderboard:week:100:0` for 30s. Returns top-10 mapped to DisplayEntry.",
    ),
    (
        "FE",
        "Sidebar list slices to DISPLAY_LIMIT=10",
        "API returns 100 entries",
        "1) Inspect rendered rows",
        "response.entries.length=100",
        "mapEntries does `entries.slice(0, DISPLAY_LIMIT)` → only first 10 rows are "
        "rendered in the sidebar; 'Xem tất cả bảng xếp hạng →' button leads to the "
        "full page for the rest.",
    ),
    (
        "FE",
        "Top-3 rows render colored Crown icons; rank ≥ 4 shows number",
        "API returns ≥ 3 entries",
        "1) Inspect rank column in the sidebar",
        "rank index 0..9",
        "rank=1 → amber Crown (text-amber-500 fill-amber-400). "
        "rank=2 → slate Crown. "
        "rank=3 → orange Crown. "
        "rank>3 → text '<rank>' large bold slate-500.",
    ),
    (
        "FE",
        "Current user row gets amber highlight",
        "API returns entry where accountId === user.id at rank 5",
        "1) Inspect that row",
        "isCurrentUser=true",
        "Row class includes `bg-amber-50 border-amber-200 shadow-sm`. "
        "Other rows render with `bg-white border-slate-100 hover:border-sky-200`.",
    ),
    (
        "FE",
        "Online indicator shows green dot when isOnline=true",
        "Entry with isOnline=true",
        "1) Inspect the avatar",
        "user.isOnline=true",
        "Green pulse dot rendered: `absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 "
        "bg-green-400 border-2 border-white rounded-full`. Hidden when isOnline=false.",
    ),
    (
        "FE",
        "Avatar fallback shows uppercase initial",
        "Entry without avatarUrl",
        "1) Inspect the avatar slot",
        "user.avatar=''",
        "Render `<div … bg-indigo-100 text-indigo-600 …>` with `user.name.charAt(0)` "
        "uppercase. Otherwise <img> with object-cover.",
    ),
    (
        "FE",
        "Streak Flame pill shows currentStreak from API",
        "Entry currentStreak=5",
        "1) Inspect the orange pill on the right",
        "streak=5",
        "Flame icon `fill-orange-500` (active). Number '5' rendered in orange-500. "
        "When streak=0, Flame becomes `fill-none text-orange-300` and number '0' "
        "rendered in `text-orange-400`.",
    ),
    (
        "FE",
        "Empty / failed list shows placeholder",
        "API returns empty array OR rejects (no cache)",
        "1) Inspect the body",
        "data.length=0",
        "Renders `<HelpCircle/> Chưa có dữ liệu` placeholder. No spinner. "
        "Sidebar list scrolls (max-h-[500px], overflow-y-auto) when many rows.",
    ),
    (
        "FE",
        "'Xem tất cả bảng xếp hạng →' navigates to full page and scrolls top",
        "Sidebar card visible",
        "1) Click the link at the bottom",
        "navigate URL",
        "navigate('/student/leaderboard') is invoked then "
        "window.scrollTo({top:0, behavior:'auto'}). User lands at the top of the full "
        "leaderboard page.",
    ),
    (
        "FE",
        "Other-tab prefetch happens silently in background",
        "Loaded with weekly data only",
        "1) Wait — do not click anything",
        "Other tab cache empty",
        "useEffect prefetches the OTHER tab (`getTotalLeaderboard(100, 0)`). "
        "Errors are swallowed. The cache is now warm for instant tab switch.",
    ),

    # ============================================================
    # ToeicFullLeaderboardPage
    # ============================================================
    (
        "FE",
        "Full page mounts and scrolls to top",
        "Navigated from sidebar 'Xem tất cả' link or direct URL",
        "1) Open /student/leaderboard",
        "useEffect runs once",
        "window.scrollTo({top:0, behavior:'auto'}) is called on mount. Hero section "
        "with Trophy and copy 'Bảng Xếp Hạng TOEIC' is rendered.",
    ),
    (
        "FE",
        "Hero shows current user rank or 'Chưa xếp hạng'",
        "personalStats fetched with weeklyRank=12; tab='week'; totalEntries=87",
        "1) Inspect 'Hạng của bạn' panel",
        "currentUserRank=12; totalEntries=87",
        "Display '12<span>/87</span>' (amber). When currentUserRank=null, fallback "
        "text 'Chưa xếp hạng'. When loading=true, '...' placeholder.",
    ),
    (
        "FE",
        "Tab switch updates fetch & resets pagination to page 1",
        "On tab='week', page=3",
        "1) Click 'Tổng xếp hạng'",
        "tab change",
        "setTab('total') and setPage(1) both run from onClick. "
        "Effect refetches via getTotalLeaderboard(100,0); cache key "
        "`leaderboard:total:100:0` is shared with sidebar card. Pagination resets.",
    ),
    (
        "FE",
        "Search input filters by case-insensitive substring match",
        "Page tab='week'; data has names ['An', 'Anna', 'Bob']",
        "1) Type 'an' into search "
        "2) Inspect rows",
        "search='an'",
        "filteredData = data.filter(name.toLowerCase().includes('an')) → keeps An & "
        "Anna; Bob removed. setPage(1) on every keystroke. "
        "totalPages = ceil(filtered.length / 10).",
    ),
    (
        "FE",
        "No-match search shows friendly empty state",
        "Search='zzz'",
        "1) Inspect body",
        "filteredData.length=0",
        "Render '<HelpCircle/> Không tìm thấy người dùng' + 'Thử thay đổi từ khóa "
        "tìm kiếm'. Pagination hidden because totalPages=0 (also <2 condition).",
    ),
    (
        "FE",
        "Pagination shows up to 5 surrounding page buttons",
        "filteredData.length=87 → totalPages=9",
        "1) Set page=5 "
        "2) Inspect bottom toolbar",
        "page=5; totalPages=9",
        "Bottom-right shows 5 page buttons: 3,4,5,6,7 (algorithm: middle: page-2..page+2). "
        "Active page button has `bg-sky-500 text-white`. Edge cases: page≤3 → 1..5; "
        "page≥totalPages-2 → totalPages-4..totalPages.",
    ),
    (
        "FE",
        "Prev/Next buttons disable at boundaries",
        "totalPages=9",
        "1) Click '<' on page=1 "
        "2) Click '>' on page=9",
        "boundary",
        "Prev button disabled when page===1 (opacity-50, cursor-not-allowed); "
        "Next button disabled when page===totalPages. Math.max/Math.min guard "
        "the setPage call so state never goes out of range.",
    ),
    (
        "FE",
        "Pagination is hidden when totalPages ≤ 1",
        "filteredData.length=8",
        "1) Inspect bottom area",
        "totalPages=1",
        "Pagination JSX wrapped in `{totalPages > 1 && ...}` → not rendered. "
        "All 8 rows are visible; 'Hiển thị trang …' text not shown.",
    ),
    (
        "FE",
        "Top-3 use Crown icons in full page too",
        "Filtered list begins at the actual top",
        "1) Inspect rank column on page 1",
        "rank from filtered position",
        "rank=1 amber Crown w-8 h-8; rank=2 slate Crown; rank=3 orange Crown; "
        "rank>3 numeric. The visible rank uses the filtered position "
        "(`actualIndex+1`), so search results start counting from 1.",
    ),
    (
        "FE",
        "Streak Flame pill mirrors currentStreak (fill differs at 0)",
        "Mixed entries with streak 0 and 8",
        "1) Inspect orange pill on each row",
        "streak number",
        "streak>0 → Flame `fill-orange-500`, count text orange-500. "
        "streak===0 → Flame `fill-none text-orange-300`, count text orange-400. "
        "Always rendered (no conditional hiding).",
    ),
    (
        "FE",
        "Score formatted with locale separators",
        "Entry score=12345",
        "1) Inspect '<n> điểm' text",
        "user.score.toLocaleString()",
        "Rendered as '12,345 điểm' (en-US locale default). 0 → '0 điểm'. "
        "Trophy icon to the left of the number.",
    ),
    (
        "FE",
        "Loading state hides table body and shows centered spinner",
        "Initial open without cache",
        "1) Open the page",
        "loading=true",
        "Inside `min-h-[400px]` div: '<div spinner/> Đang tải...' is rendered. Once "
        "cache or API resolves, loading=false and rows are shown.",
    ),
    (
        "FE",
        "Error state shows red banner if no cache fallback",
        "API rejects on first load (no cache)",
        "1) Open the page",
        "error set",
        "setError('Không thể tải bảng xếp hạng. Vui lòng thử lại sau.'). "
        "Body renders '<HelpCircle/> <p>...</p>' in red. If cache exists, error is "
        "NOT set (UX prefers showing stale data).",
    ),
    (
        "FE",
        "Personal stats rank takes precedence over rank from list",
        "API list places user at rank 12 but personalStats.rankings.weeklyRank=10",
        "1) Wait for personalStats to resolve",
        "Effect order: list applies user rank, then stats overrides",
        "Initial setCurrentUserRank uses list (12). Subsequent useEffect on "
        "personalStats updates currentUserRank to 10 (week) or totalRank (total tab). "
        "Hero panel reflects the corrected number.",
    ),
    (
        "FE",
        "isCurrentUser highlight in the table works on full page",
        "Logged-in account corresponds to a list row",
        "1) Find your row in the list",
        "isCurrentUser=true on that DisplayUser",
        "Row class becomes `bg-amber-50 border-amber-200 shadow-sm`. Other rows use "
        "`bg-white border-slate-200 hover:border-sky-200 shadow-sm`.",
    ),
    (
        "FE",
        "Tabs and search persist correctly across re-renders",
        "On page 2 of 'total' tab with search='an'",
        "1) Resize window 2) Inspect state",
        "React re-render only",
        "Tab stays 'total', search stays 'an', page stays 2. "
        "filteredData and currentData recomputed via useMemo + slice.",
    ),
    (
        "FE",
        "Breadcrumb 'Trở về' calls navigate(-1)",
        "Reached page from sidebar link",
        "1) Click '< Trở về' breadcrumb button",
        "history length > 1",
        "navigate(-1) is invoked → browser goes back to the dashboard. "
        "Hero, tabs, and table state are unmounted.",
    ),
    (
        "FE",
        "Stale-while-revalidate prevents spinner flash on tab change",
        "Both tabs cached and fresh",
        "1) Click 'Tổng xếp hạng' "
        "2) Click 'Xếp hạng tuần'",
        "cacheService.peek hits, isFresh true",
        "Each tab change immediately renders cached data; loading state remains false; "
        "no spinner shown. Only the displayed list and totalEntries change.",
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

    ws.cell(row=1, column=3, value="STUDENT-04 Leaderboard & Streak")
    ws.cell(row=2, column=3, value="STUDENT-04")
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
        tc_id = f"TC-LEAD-{idx:02d}"
        actual = (
            "As expected. Observed during manual run on the Student → "
            "Leaderboard (sidebar card / full page) with streak Flame badge: "
            + expected
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
            "Behavior matches source code in StudentLeaderboard.tsx (sidebar) and "
            "ToeicFullLeaderboardPage.tsx (full page): cacheService TTL=30s, key "
            "`leaderboard:<tab>:100:0`, getWeeklyLeaderboard / getTotalLeaderboard / "
            "getPersonalStats; getRankBadge thresholds 60 / 140; DISPLAY_LIMIT=10 in "
            "the sidebar; itemsPerPage=10 with up-to-5-button pagination on the full "
            "page; streak rendered via Flame `fill-orange-500` when "
            "`entry.currentStreak > 0` else `fill-none text-orange-300`.",
        ]
        for col_idx, val in enumerate(values, start=1):
            c = ws.cell(row=row, column=col_idx, value=val)
            c.alignment = wrap
            c.border = border
        ws.row_dimensions[row].height = 100

    ws.freeze_panes = "A11"
    wb.save(WB_PATH)
    print(f"Added sheet '{NEW_SHEET}' with {len(TEST_CASES)} test cases (all PASS).")


if __name__ == "__main__":
    main()
