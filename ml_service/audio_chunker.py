# Install: pip install pydub openai-whisper
# System:  ffmpeg must be in PATH (https://ffmpeg.org)

"""
audio_chunker.py — TOEIC Listening Audio Splitter
==================================================
Splits a long TOEIC listening audio file into individual question/talk chunks.

Two splitting strategies are supported:
  1. Whisper-based  — uses word-level timestamps to locate "Number X" / "Part X"
                      announcements and cuts precisely at each marker.
                      BUG FIX: Each chunk now extends to the START of the NEXT
                      question marker (not just to the marker itself), ensuring
                      all answer options (A/B/C/D) are included in the chunk.
  2. Silence-based  — uses pydub to detect silence gaps and maps the resulting
                      chunks to the standard TOEIC structure.
                      BUG FIX: Silence segments are now MERGED when they are
                      too short (< MIN_CHUNK_DURATION_BY_PART) to prevent
                      4-second fragments that don't contain a full question.

Default mode is "both": try Whisper first, fall back to silence if Whisper
produces too few markers or is not installed.

Usage
-----
python audio_chunker.py <audio_path> <output_dir> <repository_slug>
    [--skill-area listening]
    [--method whisper|silence|both]
    [--min-silence-ms 800]
    [--silence-thresh-db -40]
    [--whisper-model tiny.en]
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import os
import re
import shutil
import sys
import traceback
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal
import warnings
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("audio_chunker")

# ---------------------------------------------------------------------------
# Ensure ffmpeg is discoverable by pydub on Windows
# ---------------------------------------------------------------------------
# pydub uses shutil.which() to find ffmpeg. On Windows, winget installs ffmpeg
# to a path that may not be in the PATH of a running server process.
# We probe common install locations and add them to PATH if needed.

def _ensure_ffmpeg_in_path() -> None:
    """Add common ffmpeg install locations to PATH if ffmpeg is not found."""
    if shutil.which("ffmpeg"):
        return  # already in PATH

    candidates = [
        # winget / Gyan.FFmpeg install location
        os.path.expandvars(
            r"%LOCALAPPDATA%\Microsoft\WinGet\Packages"
        ),
        # Chocolatey
        r"C:\ProgramData\chocolatey\bin",
        # Scoop
        os.path.expandvars(r"%USERPROFILE%\scoop\shims"),
        # Manual install common paths
        r"C:\ffmpeg\bin",
        r"C:\Program Files\ffmpeg\bin",
        r"C:\Program Files (x86)\ffmpeg\bin",
    ]

    # For winget, the actual binary is nested inside a versioned subfolder
    winget_base = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages")
    if os.path.isdir(winget_base):
        for entry in os.listdir(winget_base):
            if "ffmpeg" in entry.lower() or "gyan" in entry.lower():
                for root, dirs, files in os.walk(os.path.join(winget_base, entry)):
                    if "ffmpeg.exe" in files:
                        candidates.insert(0, root)
                        break

    for path in candidates:
        if os.path.isdir(path) and os.path.isfile(os.path.join(path, "ffmpeg.exe")):
            os.environ["PATH"] = path + os.pathsep + os.environ.get("PATH", "")
            log.info("Added ffmpeg to PATH from: %s", path)
            return

    log.warning(
        "ffmpeg not found in PATH or common install locations. "
        "Audio processing will likely fail. "
        "Install ffmpeg: https://ffmpeg.org/download.html"
    )


_ensure_ffmpeg_in_path()

# ---------------------------------------------------------------------------
# TOEIC Structure
# ---------------------------------------------------------------------------

TOEIC_STRUCTURE: dict[int, dict] = {
    1: {"range": (1, 6), "type": "question"},  # 6 photo descriptions
    2: {"range": (7, 31), "type": "question"},  # 25 question-response
    3: {
        "range": (32, 70),
        "type": "talk",
        "questions_per_talk": 3,
    },  # 13 conversations × 3
    4: {"range": (71, 100), "type": "talk", "questions_per_talk": 3},  # 10 talks × 3
}

TOTAL_QUESTIONS = 100
PART3_TALKS = 13  # conversations
PART4_TALKS = 10  # talks
TOTAL_TALKS_3_4 = PART3_TALKS + PART4_TALKS  # 23
PART1_QUESTIONS = 6
PART2_QUESTIONS = 25

# ---------------------------------------------------------------------------
# BUG FIX: Minimum chunk durations per TOEIC part (in seconds)
# ---------------------------------------------------------------------------
# These values prevent the silence-based splitter from producing fragments
# that are too short to contain a complete question + all answer options.
#
# TOEIC timing reference:
#   Part 1: ~15-25s  (photo description + 4 options read aloud)
#   Part 2: ~8-15s   (short question + 3 options)
#   Part 3: ~40-60s  (conversation + 3 questions × 4 options)
#   Part 4: ~40-60s  (monologue + 3 questions × 4 options)
#
# We use conservative lower bounds to avoid merging too aggressively.
MIN_CHUNK_DURATION_BY_PART: dict[int, float] = {
    1: 10.0,   # Part 1: at least 10s
    2: 6.0,    # Part 2: at least 6s
    3: 30.0,   # Part 3: at least 30s (talk-level)
    4: 30.0,   # Part 4: at least 30s (talk-level)
}

# BUG FIX: Answer-reading padding added AFTER the last answer option.
# When Whisper cuts at "Number X+1", the gap between the last answer of
# question X and the "Number X+1" announcement is typically 1-3 seconds.
# We add a small pre-marker buffer so the chunk includes the full last answer.
WHISPER_PRE_MARKER_BUFFER_MS = 200  # ms to subtract from next marker start

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------


@dataclass
class Chunk:
    """Represents a single audio segment that was cut from the source file."""

    filename: str
    path: str  # absolute path on disk
    url_path: str  # relative URL path for the front-end
    part: int
    question_number: int
    chunk_type: str  # "question" or "talk"
    duration_seconds: float
    transcript_hint: str = ""

    def to_dict(self) -> dict:
        return {
            "filename": self.filename,
            "path": self.path,
            "url_path": self.url_path,
            "part": self.part,
            "question_number": self.question_number,
            "type": self.chunk_type,
            "duration_seconds": round(self.duration_seconds, 3),
            "transcript_hint": self.transcript_hint,
        }


@dataclass
class SplitResult:
    """Aggregated result returned (and serialised) after splitting."""

    status: str  # "ok" | "error"
    method_used: str  # "whisper" | "silence" | "none"
    total_chunks: int = 0
    chunks: list[Chunk] = field(default_factory=list)
    mapping_suggestions: list[dict] = field(default_factory=list)
    error: str = ""

    def to_dict(self) -> dict:
        d: dict = {
            "status": self.status,
            "method_used": self.method_used,
            "total_chunks": self.total_chunks,
            "chunks": [c.to_dict() for c in self.chunks],
            "mapping_suggestions": self.mapping_suggestions,
        }
        if self.error:
            d["error"] = self.error
        return d


# ---------------------------------------------------------------------------
# Helpers — TOEIC mapping
# ---------------------------------------------------------------------------


def question_to_part(q: int) -> int:
    """Return the TOEIC part number for a given question number (1-100)."""
    for part, info in TOEIC_STRUCTURE.items():
        lo, hi = info["range"]
        if lo <= q <= hi:
            return part
    return 1 # Fallback



def build_filename(slug: str, part: int, number: int, chunk_type: str) -> str:
    """
    Build the output filename according to the naming convention:
      question-level:  {slug}_part{P}_q{NNN}.mp3
      talk-level:      {slug}_part{P}_t{NNN}.mp3
    """
    if chunk_type == "question":
        return f"{slug}_part{part}_q{number:03d}.mp3"
    return f"{slug}_part{part}_t{number:03d}.mp3"


def build_url_path(slug: str, filename: str, skill_area: str) -> str:
    """
    Build the relative URL path expected by the front-end.
    e.g. certificate/TOEIC/toeic-listening/my-slug/audio/my-slug_part1_q001.mp3
    """
    return f"certificate/TOEIC/toeic-{skill_area}/{slug}/audio/{filename}"


def map_chunks_to_toeic(
    segments: list[tuple[float, float]],  # (start_ms, end_ms)
    slug: str,
    output_dir: Path,
    skill_area: str,
) -> list[tuple[tuple[float, float], Chunk]]:
    """
    Given a flat list of (start_ms, end_ms) segments, map them to TOEIC
    question / talk slots.

    Strategy:
      1. First, merge segments that belong to the same talk (Part 3/4).
         A "same-talk" gap is identified as a gap < INTRA_TALK_GAP_MS between
         two consecutive segments. This merges [conversation + questions] pairs.
      2. Then map the resulting segments to TOEIC slots sequentially.

    TOEIC gap patterns (from real audio analysis):
      - Between questions (Part 1/2):  ~5s
      - Between talks (Part 3/4):      ~8-12s
      - Within a talk (conv→questions): ~2-3s  ← merge these
    """
    INTRA_TALK_GAP_MS = 4_000  # gaps < 4s within a talk → merge

    # Step 1: merge segments separated by short gaps (intra-talk)
    if len(segments) > 1:
        merged: list[tuple[float, float]] = []
        group_start, group_end = segments[0]
        for seg_start, seg_end in segments[1:]:
            gap_ms = seg_start - group_end
            if gap_ms < INTRA_TALK_GAP_MS:
                # Short gap → same talk, extend group
                group_end = seg_end
            else:
                merged.append((group_start, group_end))
                group_start, group_end = seg_start, seg_end
        merged.append((group_start, group_end))
        segments = merged

    n = len(segments)
    log.info("After intra-talk merge: %d segments to map.", n)

    # Step 2: build slot list based on segment count
    slots: list[tuple[int, int, str]] = []

    # Parts 1 & 2 — individual questions
    for q in range(1, PART1_QUESTIONS + PART2_QUESTIONS + 1):
        part = question_to_part(q)
        slots.append((part, q, "question"))

    if n >= 80:
        # One segment per question for Parts 3 & 4
        for q in range(32, TOTAL_QUESTIONS + 1):
            part = question_to_part(q)
            slots.append((part, q, "question"))
    else:
        # Talk-level for Parts 3 & 4
        for t in range(1, PART3_TALKS + 1):
            first_q = 32 + (t - 1) * 3
            slots.append((3, first_q, "talk"))
        for t in range(1, PART4_TALKS + 1):
            first_q = 71 + (t - 1) * 3
            slots.append((4, first_q, "talk"))

    if n != len(slots):
        log.warning(
            "Segment count (%d) does not match expected slot count (%d). "
            "Will assign as many as possible.",
            n,
            len(slots),
        )

    pairs: list[tuple[tuple[float, float], Chunk]] = []
    for i, seg in enumerate(segments):
        if i >= len(slots):
            log.warning("Extra segment %d has no TOEIC slot — skipped.", i + 1)
            break
        part, number, ctype = slots[i]
        filename = build_filename(slug, part, number, ctype)
        abs_path = str(output_dir / filename)
        url_path = build_url_path(slug, filename, skill_area)
        duration = (seg[1] - seg[0]) / 1000.0
        chunk = Chunk(
            filename=filename,
            path=abs_path,
            url_path=url_path,
            part=part,
            question_number=number,
            chunk_type=ctype,
            duration_seconds=duration,
        )
        pairs.append((seg, chunk))

    return pairs


# ---------------------------------------------------------------------------
# Whisper-based splitting
# ---------------------------------------------------------------------------

# Patterns that mark the start of a new question / part in the transcript
_NUMBER_PATTERNS: list[re.Pattern] = [
    # English  "Number 1"  or  "Number one"
    re.compile(r"\bnumber\s+(\d{1,3})\b", re.IGNORECASE),
    # Vietnamese  "Câu 1"
    re.compile(r"\bc[aâ]u\s+(\d{1,3})\b", re.IGNORECASE),
    # Part announcements  "Part 1" … "Part 4"
    re.compile(r"\bpart\s+([1-4])\b", re.IGNORECASE),
]


def _extract_word_timestamps(whisper_result: dict) -> list[tuple[float, str]]:
    """
    Walk the Whisper result dict and return a flat list of
    (start_seconds, word_text) for every word that has timing data.
    """
    words: list[tuple[float, str]] = []
    for segment in whisper_result.get("segments", []):
        for w in segment.get("words", []):
            start = w.get("start")
            text = w.get("word", "").strip()
            if start is not None and text:
                words.append((float(start), text))
    return words


def _find_markers_in_words(
    words: list[tuple[float, str]],
) -> list[tuple[float, int, str]]:
    """
    Look for "Number X", "Câu X", "Question X", or "Part X" patterns.
    Returns a list of (start_seconds, question_or_part_number, marker_type).
    """
    markers: dict[int, tuple[float, str]] = {}  # key -> (earliest timestamp, marker_type)
    extra_markers: list[tuple[float, int, str]] = []

    import string
    def clean(text: str) -> str:
        return text.strip(string.punctuation).lower()

    for i in range(len(words)):
        w1 = clean(words[i][1])
        t_start = words[i][0]

        if w1 in ("question", "questions"):
            extra_markers.append((t_start, 0, "questions_word"))
        elif w1 == "directions":
            extra_markers.append((t_start, 0, "directions_word"))

        # Sliding window of up to 4 words for robust regex matching
        window_words = [clean(w[1]) for w in words[i:i+4]]
        window = " ".join(window_words)

        # Match Number X
        m_num = re.search(r"^(number|c[aâ]u)\s+(\d{1,3})\b", window)
        if not m_num:
            m_num = re.search(r"^(number|c[aâ]u)(\d{1,3})\b", window)

        if m_num:
            num = int(m_num.group(2))
            if num not in markers or t_start < markers[num][0]:
                markers[num] = (t_start, "number")
            continue

        # Match Questions X (Group start)
        m_q = re.search(r"^questions?\s+(\d{1,3})\b", window)
        if m_q:
            num = int(m_q.group(1))
            if num not in markers or t_start < markers[num][0]:
                markers[num] = (t_start, "group_start")
            continue

        # Check for Part Announcements
        m_part = re.search(r"^parts?\s+([1-4]|one|two|three|four)\b", window)
        if not m_part:
            m_part = re.search(r"^parts?([1-4]|one|two|three|four)\b", window)

        if m_part:
            part_str = m_part.group(1)
            part_map = {"one": 1, "two": 2, "three": 3, "four": 4}
            num_val = part_map.get(part_str)
            if num_val is None:
                num_val = int(part_str)
            
            num = num_val + 1000
            if num not in markers or t_start < markers[num][0]:
                markers[num] = (t_start, "part")

    all_markers = [
        (t, n, m_type) for n, (t, m_type) in markers.items()
    ]
    all_markers.extend(extra_markers)
    all_markers.sort(key=lambda x: x[0])
    log.info("Whisper found %d markers total.", len(all_markers))
    return all_markers


def whisper_split(
    audio_path: Path,
    output_dir: Path,
    slug: str,
    skill_area: str,
    whisper_model: str = "base",
) -> SplitResult | None:
    """
    Run Whisper on the full audio, detect "Number X" / "Part X" markers,
    then export chunks according to TOEIC structure.

    Chunking logic (matches how TOEIC audio is actually recorded):
    ─────────────────────────────────────────────────────────────
    • Part 1 & 2 — one chunk per question:
        chunk(N) = audio from "Number N" up to (but not including) "Number N+1"
        The last question of a part ends when the next part announcement is heard.

    • Part 3 & 4 — one chunk per GROUP of 3 questions:
        chunk(71-73) = audio from "Number 71" up to (but not including) "Number 74"
        This captures the full conversation/monologue + all 3 questions + all answers.

    Boundary detection:
        end_of_chunk(N) = start_of_next_marker - small_buffer
        where "next marker" is the NEXT question number OR the next part announcement.
    """
    try:
        import whisper as _whisper  # type: ignore
    except ImportError:
        log.warning("openai-whisper not installed — skipping Whisper method.")
        return None

    try:
        from pydub import AudioSegment  # type: ignore
    except ImportError:
        log.error("pydub is required but not installed.")
        return SplitResult(
            status="error", method_used="none", error="pydub is not installed"
        )

    log.info("Loading Whisper model '%s' …", whisper_model)
    try:
        model = _whisper.load_model(whisper_model)
    except Exception as exc:
        log.error("Failed to load Whisper model: %s", exc)
        return None

    log.info("Transcribing '%s' with word timestamps …", audio_path.name)
    try:
        result = model.transcribe(
            str(audio_path),
            word_timestamps=True,
            verbose=None,
            fp16=False,
        )
    except Exception as exc:
        log.error("Whisper transcription failed: %s", exc)
        return None

    words = _extract_word_timestamps(result)
    all_markers = _find_markers_in_words(words)  # [(start_sec, num, type)]

    q_markers = [(t, n) for t, n, m_type in all_markers if n < 1000]
    if len(q_markers) < 5:
        log.warning(
            "Whisper only found %d question markers — not enough. "
            "Falling back to silence method.",
            len(q_markers),
        )
        return None

    log.info("Loading audio for slicing …")
    try:
        audio = AudioSegment.from_file(str(audio_path))
    except Exception as exc:
        log.error("Could not load audio with pydub: %s", exc)
        return SplitResult(
            status="error", method_used="whisper", error=f"pydub load failed: {exc}"
        )

    total_ms = len(audio)

    # ── Dynamically map questions to parts based on Part markers ──────────────
    current_part = 1
    part_q_list: dict[int, list[tuple[float, int, str]]] = {1: [], 2: [], 3: [], 4: []}
    part_marker_times: dict[int, float] = {}  # part_num -> timestamp of "Part X" announcement

    for t, n, m_type in all_markers:
        if m_type == "part":
            part_num = n - 1000
            if 1 <= part_num <= 4:
                current_part = part_num
                if part_num not in part_marker_times:
                    # Pull back 2 seconds to capture the full Part announcement start
                    # (Whisper timestamps the word "Part" mid-utterance, but audio leads in ~1-2s earlier)
                    part_marker_times[part_num] = max(0.0, t - 2.0)
        elif m_type in ("number", "group_start"):
            if 1 <= n <= 200:
                # Safe TOEIC fallback in case Whisper missed the "Part X" announcement.
                if n >= 71 and current_part < 4:
                    current_part = 4
                elif n >= 32 and current_part < 3:
                    current_part = 3
                elif n >= 7 and current_part < 2:
                    current_part = 2

                if current_part in part_q_list:
                    part_q_list[current_part].append((t, n, m_type))

    log.info("Part marker times: %s", part_marker_times)
    for p in range(1, 5):
        log.info("Part %d has %d question markers.", p, len(part_q_list[p]))

    # Estimate missing Part marker times from adjacent question data
    for part in [3, 4]:
        if part not in part_marker_times and part_q_list[part]:
            prev_part = part - 1
            if part_q_list[prev_part]:
                # Use the last question of the previous Part to estimate
                last_prev_t = part_q_list[prev_part][-1][0]
                # Measure avg answer duration from previous Part's questions
                prev_times = [t for t, q, m in part_q_list[prev_part]]
                if len(prev_times) >= 2:
                    gaps = [prev_times[j+1] - prev_times[j] for j in range(len(prev_times)-1)]
                    intra_gaps = [g for g in gaps if g < 15.0]  # only within-group gaps
                    avg_dur = sum(intra_gaps) / len(intra_gaps) if intra_gaps else 8.0
                else:
                    avg_dur = 8.0
                # Part marker ≈ last Q of prev Part + answer duration + 2s silence
                part_marker_times[part] = last_prev_t + avg_dur + 2.0
                log.info("Estimated Part %d marker at %.1fs (from Q at %.1fs + %.1fs + 2s)",
                         part, part_marker_times[part], last_prev_t, avg_dur)

    # ── Build chunk boundaries ────────────────────────────────────────────────
    chunk_starts: list[tuple[float, int, int]] = []  # (start_sec, q_num, part)

    for part, q_list in part_q_list.items():
        if not q_list:
            continue

        if part in (3, 4):
            # ── Number-based grouping ─────────────────────────────────────
            # TOEIC Part 3/4 always groups 3 questions together.
            # We define groups by question NUMBER (not by time gaps),
            # so even if Whisper misses a question, the groups stay correct.
            GROUP_SIZE = 3

            # Build {question_number: earliest_time} from detected markers
            detected_qs: dict[int, float] = {}
            for t, q, m_type in q_list:
                if q not in detected_qs or t < detected_qs[q]:
                    detected_qs[q] = t

            all_q_nums = sorted(detected_qs.keys())
            if not all_q_nums:
                continue

            first_q = all_q_nums[0]
            last_q = all_q_nums[-1]

            # Build groups: [first_q, first_q+3, first_q+6, ...]
            groups: list[tuple[int, list[tuple[float, int]]]] = []
            gq = first_q
            while gq <= last_q:
                members = []
                for offset in range(GROUP_SIZE):
                    qn = gq + offset
                    if qn in detected_qs:
                        members.append((detected_qs[qn], qn))
                if members:
                    groups.append((gq, members))
                gq += GROUP_SIZE

            # Calculate median intra-group gap (time between consecutive Qs
            # WITHIN the same group, typically ~7s for reading one answer set)
            # IMPORTANT: Only count gaps between truly consecutive question numbers
            # (e.g., Q32→Q33, Q33→Q34). If Q33 is missing and we have Q32→Q34,
            # that gap (~14s) would inflate the median and cause chunks to be too long.
            intra_gaps: list[float] = []
            for _gq, members in groups:
                ms = sorted(members, key=lambda x: x[1])  # sort by Q number
                for k in range(len(ms) - 1):
                    if ms[k + 1][1] - ms[k][1] == 1:  # only consecutive Q numbers
                        intra_gaps.append(ms[k + 1][0] - ms[k][0])
            median_gap = sorted(intra_gaps)[len(intra_gaps) // 2] if intra_gaps else 7.0
            median_gap = min(median_gap, 12.0)  # cap: TOEIC answer reading never exceeds 12s

            log.info("  Part%d: %d groups, %d detected Qs, median_gap=%.1fs, %d valid intra-gaps",
                     part, len(groups), len(all_q_nums), median_gap, len(intra_gaps))

            # Build chunk starts
            for gi, (gq, members) in enumerate(groups):
                ms = sorted(members)

                if gi == 0:
                    # First group of this Part → start at Part announcement
                    actual_t = part_marker_times.get(part, ms[0][0])
                else:
                    # Cut point = last detected Q of previous group
                    #            + undetected Qs remaining in that group
                    #            + one more answer duration
                    #            + 1.5s silence buffer (user wants 1-2s of silence at end)
                    prev_gq, prev_members = groups[gi - 1]
                    prev_ms = sorted(prev_members)
                    prev_last_t = prev_ms[-1][0]
                    prev_last_q_num = prev_ms[-1][1]

                    # How many questions in the previous group were NOT detected
                    # and come AFTER the last detected one?
                    missing_after = (prev_gq + GROUP_SIZE - 1) - prev_last_q_num

                    # Each missing Q adds ~median_gap to the timeline,
                    # plus one more median_gap for the last answer reading.
                    # Subtract 2s to cut BEFORE the silence ends (not after).
                    actual_t = prev_last_t + (missing_after + 1) * median_gap - 2.0

                log.info("    Group Q%d: start=%.1fs (first_marker=%.1fs)",
                         gq, actual_t, ms[0][0])
                chunk_starts.append((actual_t, gq, part))
        else:
            # Part 1 & 2: one question per chunk
            for t, q, m_type in q_list:
                actual_t = t
                if q == q_list[0][1] and part in part_marker_times:
                    actual_t = part_marker_times[part]
                chunk_starts.append((actual_t, q, part))

    chunk_starts.sort(key=lambda x: x[0])
    log.info("Identified %d chunk start points.", len(chunk_starts))

    # Boundary points = chunk starts + Part marker times (for clean Part transitions)
    boundaries: list[float] = []
    for t, q, p in chunk_starts:
        boundaries.append(t)
    for p, t in part_marker_times.items():
        boundaries.append(t)
    boundaries = sorted(set(boundaries))

    # ── Export chunks ─────────────────────────────────────────────────────────
    chunks: list[Chunk] = []

    for idx, (start_sec, q_num, part) in enumerate(chunk_starts):
        try:
            start_ms = int(start_sec * 1000)

            # Find the next boundary that is strictly after this chunk's start
            next_boundary_sec = total_ms / 1000.0
            for b_sec in boundaries:
                if b_sec > start_sec + 2.0: # give at least 2 seconds buffer
                    next_boundary_sec = b_sec
                    break
            
            next_start_ms = int(next_boundary_sec * 1000)
            # Use full boundary — no trim. The next chunk's start already accounts for spacing.
            end_ms = max(start_ms + 500, next_start_ms)

            start_ms = max(0, min(start_ms, total_ms))
            end_ms = max(start_ms + 500, min(end_ms, total_ms))
            duration_s = (end_ms - start_ms) / 1000.0

            if duration_s < 3.0:
                log.warning("Q%d chunk too short (%.1fs) — skipped.", q_num, duration_s)
                continue

            ctype = "talk" if part in (3, 4) else "question"
            filename = build_filename(slug, part, q_num, ctype)
            abs_path = str(output_dir / filename)
            url_path = build_url_path(slug, filename, skill_area)

            hint_words = [w for t, w in words if start_sec <= t < (end_ms / 1000.0)][:20]
            transcript_hint = " ".join(hint_words)

            clip = audio[start_ms:end_ms]
            clip.export(abs_path, format="mp3")
            log.info(
                "  Q%-3d Part%d  [%6.1fs – %6.1fs]  dur=%5.1fs  %s",
                q_num, part, start_sec, end_ms / 1000.0, duration_s, filename,
            )

            chunks.append(Chunk(
                filename=filename,
                path=abs_path,
                url_path=url_path,
                part=part,
                question_number=q_num,
                chunk_type=ctype,
                duration_seconds=duration_s,
                transcript_hint=transcript_hint,
            ))

        except Exception as exc:
            log.error("Error processing Q%d: %s\n%s", q_num, exc, traceback.format_exc())

    if not chunks:
        log.warning("Whisper split produced no usable chunks.")
        return None

    mapping = [
        {"question_number": c.question_number, "audio_url": f"/uploads/{c.url_path}"}
        for c in chunks
    ]

    return SplitResult(
        status="ok",
        method_used="whisper",
        total_chunks=len(chunks),
        chunks=chunks,
        mapping_suggestions=mapping,
    )


# ---------------------------------------------------------------------------
# Silence-based splitting
# ---------------------------------------------------------------------------


def _estimate_part_for_position(position_ratio: float) -> int:
    """
    Given a position in the audio as a ratio (0.0 – 1.0), estimate which
    TOEIC part it belongs to based on approximate time distribution.

    Approximate TOEIC timing distribution (out of ~45 min total):
      Part 1 (6 questions):   ~0 – 5%
      Part 2 (25 questions):  ~5 – 30%
      Part 3 (13 talks):      ~30 – 65%
      Part 4 (10 talks):      ~65 – 100%
    """
    if position_ratio < 0.05:
        return 1
    elif position_ratio < 0.30:
        return 2
    elif position_ratio < 0.65:
        return 3
    else:
        return 4


def _merge_short_segments(
    segments: list[tuple[int, int]],
    total_ms: int,
    min_question_duration_s: float = 8.0,
) -> list[tuple[int, int]]:
    """
    Merge consecutive silence-detected segments that are too short to
    represent a complete TOEIC question.

    Based on real TOEIC audio analysis:
    - Inter-question gaps: ~5s (beep + thinking time)
    - Intra-question content: continuous speech, no long gaps
    - Short segments (< 8s) are typically: part announcements, beep tones,
      or fragments split off from a real question

    Algorithm:
      - Walk segments in order.
      - If current accumulated duration < min_question_duration_s, merge
        the next segment into the current group (bridging the gap).
      - Emit when accumulated duration >= threshold.
      - Always emit the last group.
    """
    if not segments:
        return segments

    merged: list[tuple[int, int]] = []
    group_start, group_end = segments[0]

    for seg_start, seg_end in segments[1:]:
        current_duration_s = (group_end - group_start) / 1000.0

        if current_duration_s < min_question_duration_s:
            # Too short — absorb the next segment (bridge the silence gap)
            group_end = seg_end
        else:
            merged.append((group_start, group_end))
            group_start, group_end = seg_start, seg_end

    # Always emit the last group
    merged.append((group_start, group_end))
    return merged


def silence_split(
    audio_path: Path,
    output_dir: Path,
    slug: str,
    skill_area: str,
    min_silence_ms: int = 800,
    silence_thresh_db: float = -40.0,
) -> SplitResult:
    """
    Use pydub's silence detection to split the audio, then map the resulting
    segments onto the TOEIC structure.

    KEY FIX: TOEIC audio has two types of pauses:
      - Intra-question pauses: ~0.3-0.8s between question stem and answer options,
        or between individual answer options (A→B→C→D). These must NOT trigger a split.
      - Inter-question pauses: ~2-5s between the last answer of question N and the
        start of question N+1 (the "beep" + thinking time gap). These SHOULD split.

    The default min_silence_ms=800 was too short — it was splitting inside questions.
    We use a two-pass adaptive strategy:
      1. Try with a long silence threshold (1500ms) to catch only inter-question gaps.
      2. If that produces too few segments (< 30), fall back to a shorter threshold
         and apply the merge logic to fix up any intra-question splits.
    """
    try:
        from pydub import AudioSegment  # type: ignore
        from pydub.silence import detect_nonsilent  # type: ignore
    except ImportError:
        msg = "pydub is not installed.  Run: pip install pydub"
        log.error(msg)
        return SplitResult(status="error", method_used="none", error=msg)

    log.info("Loading audio for silence detection …")
    try:
        audio = AudioSegment.from_file(str(audio_path))
    except Exception as exc:
        msg = f"Could not load audio: {exc}"
        log.error(msg)
        return SplitResult(status="error", method_used="silence", error=msg)

    total_ms = len(audio)
    if total_ms < 5_000:
        msg = f"Audio is too short ({total_ms / 1000:.1f}s).  Minimum is 5 seconds."
        log.error(msg)
        return SplitResult(status="error", method_used="silence", error=msg)

    # ── Two-pass adaptive silence detection ──────────────────────────────────
    # TOEIC audio structure (confirmed from real audio analysis):
    #   - Between questions: ~5s gap (beep tone + thinking time)
    #   - Within a question: continuous speech, no long pauses
    #   - Short segments (1-5s) = part announcements or beep tones
    #
    # Strategy:
    #   Pass 1: 2000ms threshold — catches ~5s inter-question gaps cleanly.
    #           Then merge any short segments (< 8s) that are announcements.
    #   Pass 2: if Pass 1 gives too few segments (< 30), retry with shorter
    #           threshold and apply the same merge logic.

    PRIMARY_SILENCE_MS = 2000
    FALLBACK_SILENCE_MS = max(min_silence_ms, 1000)

    def _detect(silence_ms: int) -> list[tuple[int, int]]:
        log.info(
            "Detecting non-silent regions (min_silence=%dms, thresh=%.1fdBFS) …",
            silence_ms,
            silence_thresh_db,
        )
        return detect_nonsilent(
            audio,
            min_silence_len=silence_ms,
            silence_thresh=silence_thresh_db,
            seek_step=10,
        )

    nonsilent_ranges = _detect(PRIMARY_SILENCE_MS)
    log.info("Pass 1 (%dms): %d raw segments.", PRIMARY_SILENCE_MS, len(nonsilent_ranges))

    if len(nonsilent_ranges) < 30:
        log.info(
            "Too few segments (%d) — retrying with %dms …",
            len(nonsilent_ranges), FALLBACK_SILENCE_MS,
        )
        nonsilent_ranges = _detect(FALLBACK_SILENCE_MS)
        log.info("Pass 2 (%dms): %d raw segments.", FALLBACK_SILENCE_MS, len(nonsilent_ranges))

    if not nonsilent_ranges:
        msg = "No non-silent regions detected.  Check threshold or audio content."
        log.error(msg)
        return SplitResult(status="error", method_used="silence", error=msg)

    # Merge short segments (announcements, beep tones) into the following
    # question segment. Anything < 8s is not a complete TOEIC question.
    before_merge = len(nonsilent_ranges)
    nonsilent_ranges = _merge_short_segments(nonsilent_ranges, total_ms, min_question_duration_s=8.0)
    log.info(
        "After merging short segments: %d (was %d).",
        len(nonsilent_ranges), before_merge,
    )
    # ─────────────────────────────────────────────────────────────────────────

    # Map segments to TOEIC slots
    pairs = map_chunks_to_toeic(nonsilent_ranges, slug, output_dir, skill_area)

    chunks: list[Chunk] = []
    for (start_ms, end_ms), chunk in pairs:
        try:
            clip = audio[start_ms:end_ms]
            clip.export(chunk.path, format="mp3")
            log.info(
                "  Exported %-30s  [%6.1fs – %6.1fs]  dur=%.1fs",
                chunk.filename,
                start_ms / 1000.0,
                end_ms / 1000.0,
                chunk.duration_seconds,
            )
            chunks.append(chunk)
        except Exception as exc:
            log.error("Error exporting '%s': %s", chunk.filename, exc)

    if not chunks:
        msg = "Silence split produced no usable chunks."
        log.error(msg)
        return SplitResult(status="error", method_used="silence", error=msg)

    mapping = [
        {
            "question_number": c.question_number,
            "audio_url": f"/uploads/{c.url_path}",
        }
        for c in chunks
    ]

    return SplitResult(
        status="ok",
        method_used="silence",
        total_chunks=len(chunks),
        chunks=chunks,
        mapping_suggestions=mapping,
    )


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------


def run(
    audio_path: Path,
    output_dir: Path,
    slug: str,
    skill_area: str = "listening",
    method: str = "both",
    min_silence_ms: int = 800,
    silence_thresh_db: float = -40.0,
    whisper_model: str = "tiny.en",
) -> SplitResult:
    """
    Main entry point.  Orchestrates Whisper → silence fall-back logic and
    returns a SplitResult ready for JSON serialisation.
    """
    # Validate inputs --------------------------------------------------------
    if not audio_path.exists():
        return SplitResult(
            status="error",
            method_used="none",
            error=f"Audio file not found: {audio_path}",
        )

    output_dir.mkdir(parents=True, exist_ok=True)

    method = method.lower().strip()
    if method not in {"whisper", "silence", "both"}:
        return SplitResult(
            status="error",
            method_used="none",
            error=f"Unknown method '{method}'.  Choose: whisper | silence | both",
        )

    # Dispatch ---------------------------------------------------------------
    result: SplitResult | None = None

    if method in {"whisper", "both"}:
        log.info("=== Strategy: Whisper ===")
        result = whisper_split(
            audio_path=audio_path,
            output_dir=output_dir,
            slug=slug,
            skill_area=skill_area,
            whisper_model=whisper_model,
        )

    use_silence = method == "silence" or (
        method == "both" and (result is None or result.status != "ok")
    )

    if use_silence:
        log.info("=== Strategy: Silence ===")
        result = silence_split(
            audio_path=audio_path,
            output_dir=output_dir,
            slug=slug,
            skill_area=skill_area,
            min_silence_ms=min_silence_ms,
            silence_thresh_db=silence_thresh_db,
        )

    if result is None:
        return SplitResult(
            status="error",
            method_used="none",
            error="All splitting strategies failed or were skipped.",
        )

    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="audio_chunker.py",
        description="Split a TOEIC listening audio file into individual question chunks.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    p.add_argument("audio_path", type=Path, help="Path to the source audio file.")
    p.add_argument(
        "output_dir", type=Path, help="Directory where chunks will be saved."
    )
    p.add_argument(
        "repository_slug", type=str, help="Slug used in output filenames and URLs."
    )

    p.add_argument(
        "--skill-area",
        default="listening",
        metavar="AREA",
        help="Skill area label used in URL paths (e.g. listening).",
    )
    p.add_argument(
        "--method",
        default="both",
        choices=["whisper", "silence", "both"],
        help="Splitting strategy: whisper, silence, or both (whisper with silence fallback).",
    )
    p.add_argument(
        "--min-silence-ms",
        type=int,
        default=800,
        metavar="MS",
        help="Minimum silence gap in milliseconds to trigger a split (silence method).",
    )
    p.add_argument(
        "--silence-thresh-db",
        type=float,
        default=-40.0,
        metavar="DB",
        help="Silence threshold in dBFS (silence method).",
    )
    p.add_argument(
        "--whisper-model",
        default="base",
        metavar="MODEL",
        help="Whisper model name to use (e.g. base, small, medium). Default: base.",
    )
    return p


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    result = run(
        audio_path=args.audio_path,
        output_dir=args.output_dir,
        slug=args.repository_slug,
        skill_area=args.skill_area,
        method=args.method,
        min_silence_ms=args.min_silence_ms,
        silence_thresh_db=args.silence_thresh_db,
        whisper_model=args.whisper_model,
    )

    # Pretty-print the JSON result to stdout
    print(json.dumps(result.to_dict(), indent=2, ensure_ascii=False))

    # Exit with a non-zero code on error so callers can detect failure
    if result.status != "ok":
        sys.exit(1)


if __name__ == "__main__":
    main()
