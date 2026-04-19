import argparse
import csv
import os
from collections import defaultdict
from datetime import UTC, datetime
from typing import Dict, List, Tuple

from dotenv import load_dotenv
from pymongo import MongoClient


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CSV_PATH = os.path.join(BASE_DIR, "data", "weights_used.csv")
DEFAULT_COLLECTION = "gradestructures"
SEED_SOURCE = "weights_used.csv"


def utc_now() -> datetime:
    return datetime.now(UTC)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed grade structures into MongoDB from weights_used.csv"
    )
    parser.add_argument("--csv", default=DEFAULT_CSV_PATH, help="Path to weights CSV file")
    parser.add_argument(
        "--mongodb-uri",
        default=os.getenv("MONGODB_URI", "mongodb://localhost:27017/ed_vision"),
        help="MongoDB URI",
    )
    parser.add_argument(
        "--db",
        default=os.getenv("MONGODB_DB_NAME", "ed_vision"),
        help="MongoDB database name",
    )
    parser.add_argument(
        "--collection",
        default=DEFAULT_COLLECTION,
        help="MongoDB collection name",
    )
    parser.add_argument(
        "--academic-year",
        default="2025-2026",
        help="academicYear field value",
    )
    parser.add_argument(
        "--semester",
        type=int,
        default=1,
        choices=[1, 2, 3],
        help="semester field value (1, 2, 3)",
    )
    parser.add_argument(
        "--credits",
        type=int,
        default=3,
        help="credits field value",
    )
    parser.add_argument(
        "--teacher-id",
        default=None,
        help="teacherId field value (optional)",
    )
    parser.add_argument(
        "--max-score",
        type=float,
        default=10.0,
        help="maxScore for each column",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview documents only, do not write to MongoDB",
    )
    parser.add_argument(
        "--deactivate-existing",
        action="store_true",
        help="Deactivate other active documents with the same courseCode",
    )
    parser.add_argument(
        "--max-total-weight",
        type=float,
        default=100.0,
        help="Maximum allowed total weight per course (default: 100)",
    )
    parser.add_argument(
        "--reject-overweight",
        action="store_true",
        help="Stop execution if any course totalWeight exceeds --max-total-weight",
    )
    parser.add_argument(
        "--normalize-overweight",
        action="store_true",
        help="Scale overweight courses proportionally so totalWeight equals --max-total-weight",
    )
    return parser.parse_args()


def normalize_weight_to_percent(raw_weight: str) -> float:
    weight = float(str(raw_weight).strip())
    if weight < 0:
        raise ValueError(f"Weight cannot be negative: {raw_weight}")

    # CSV thường lưu dạng decimal (0.55), MongoDB lưu dạng percent (55)
    if weight <= 1:
        return weight * 100.0
    return weight


def display_name_from_key(key: str) -> str:
    return key.replace("_", " ").strip().title()


def calc_total_weight(component_weights: Dict[str, float]) -> float:
    return round(sum(component_weights.values()), 4)


def find_overweight_courses(
    grouped: Dict[str, Dict[str, float]],
    max_total_weight: float,
) -> List[Tuple[str, float]]:
    overweight_courses: List[Tuple[str, float]] = []
    for course_code, comp_weights in sorted(grouped.items()):
        total_weight = calc_total_weight(comp_weights)
        if total_weight > max_total_weight:
            overweight_courses.append((course_code, total_weight))
    return overweight_courses


def scale_component_weights(
    component_weights: Dict[str, float],
    target_total: float,
) -> Dict[str, float]:
    current_total = calc_total_weight(component_weights)
    if current_total <= 0:
        return dict(component_weights)

    factor = target_total / current_total
    scaled = {k: round(v * factor, 4) for k, v in component_weights.items()}

    # Bù sai số do làm tròn để tổng khớp target_total
    diff = round(target_total - sum(scaled.values()), 4)
    if abs(diff) >= 0.0001 and scaled:
        adjust_key = max(scaled, key=scaled.get)
        scaled[adjust_key] = round(scaled[adjust_key] + diff, 4)

    return scaled


def normalize_overweight_courses(
    grouped: Dict[str, Dict[str, float]],
    max_total_weight: float,
) -> Tuple[Dict[str, Dict[str, float]], Dict[str, float]]:
    normalized_grouped: Dict[str, Dict[str, float]] = {}
    normalized_before_totals: Dict[str, float] = {}

    for course_code, comp_weights in grouped.items():
        total_weight = calc_total_weight(comp_weights)
        if total_weight > max_total_weight:
            normalized_grouped[course_code] = scale_component_weights(comp_weights, max_total_weight)
            normalized_before_totals[course_code] = total_weight
        else:
            normalized_grouped[course_code] = dict(comp_weights)

    return normalized_grouped, normalized_before_totals


def load_grouped_weights(csv_path: str) -> Dict[str, Dict[str, float]]:
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    grouped: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        required_columns = {"course_code", "component", "weight"}

        if not reader.fieldnames or not required_columns.issubset(set(reader.fieldnames)):
            raise ValueError(
                f"CSV must contain columns: {sorted(required_columns)}. Found: {reader.fieldnames}"
            )

        for line_no, row in enumerate(reader, start=2):
            course_code = (row.get("course_code") or "").strip()
            component = (row.get("component") or "").strip()
            raw_weight = row.get("weight")

            if not course_code or not component:
                continue

            try:
                weight_percent = normalize_weight_to_percent(str(raw_weight))
            except Exception as exc:
                raise ValueError(
                    f"Invalid weight at line {line_no} ({course_code}, {component}, {raw_weight}): {exc}"
                ) from exc

            grouped[course_code][component] += weight_percent

    return grouped


def build_document(
    course_code: str,
    component_weights: Dict[str, float],
    academic_year: str,
    semester: int,
    credits: int,
    teacher_id: str,
    max_score: float,
) -> dict:
    columns = []
    for key in sorted(component_weights.keys()):
        weight = round(component_weights[key], 4)
        columns.append(
            {
                "name": display_name_from_key(key),
                "key": key,
                "maxScore": max_score,
                "weight": weight,
            }
        )

    total_weight = round(sum(c["weight"] for c in columns), 4)
    now = utc_now()

    doc = {
        "academicYear": academic_year,
        "semester": semester,
        "courseCode": course_code,
        "courseName": course_code,
        "credits": credits,
        "columns": columns,
        "isActive": True,
        "totalWeight": total_weight,
        "seedSource": SEED_SOURCE,
        "updatedAt": now,
    }

    if teacher_id:
        doc["teacherId"] = teacher_id

    return doc


def main() -> None:
    load_dotenv()
    args = parse_args()

    grouped = load_grouped_weights(args.csv)
    print(f"[INFO] Loaded {len(grouped)} courses from CSV: {args.csv}")

    overweight_courses = find_overweight_courses(grouped, args.max_total_weight)
    normalized_before_totals: Dict[str, float] = {}

    if args.normalize_overweight and overweight_courses:
        grouped, normalized_before_totals = normalize_overweight_courses(
            grouped,
            args.max_total_weight,
        )
        print(
            f"[INFO] Normalized {len(normalized_before_totals)} overweight courses "
            f"to totalWeight={args.max_total_weight}."
        )
        for course_code, before_total in sorted(normalized_before_totals.items()):
            after_total = calc_total_weight(grouped[course_code])
            print(f"[INFO]   - {course_code}: {before_total} -> {after_total}")

        overweight_courses = find_overweight_courses(grouped, args.max_total_weight)

    if overweight_courses:
        print(
            f"[WARN] Found {len(overweight_courses)} courses with totalWeight > {args.max_total_weight}."
        )
        for course_code, total_weight in overweight_courses:
            print(f"[WARN]   - {course_code}: totalWeight={total_weight}")

        if args.reject_overweight:
            raise ValueError(
                "Found overweight courses. Please fix CSV or run without --reject-overweight."
            )

    if args.dry_run:
        for idx, (course_code, comp_weights) in enumerate(sorted(grouped.items()), start=1):
            doc = build_document(
                course_code=course_code,
                component_weights=comp_weights,
                academic_year=args.academic_year,
                semester=args.semester,
                credits=args.credits,
                teacher_id=args.teacher_id,
                max_score=args.max_score,
            )
            tags = []
            if course_code in normalized_before_totals:
                tags.append(f"NORMALIZED from {normalized_before_totals[course_code]}")
            if doc["totalWeight"] > args.max_total_weight:
                tags.append("OVERWEIGHT")

            suffix = f" [{' | '.join(tags)}]" if tags else ""
            print(
                f"{idx:03d}. {course_code}: columns={len(doc['columns'])}, totalWeight={doc['totalWeight']}{suffix}"
            )
        print("[DRY-RUN] No data was written to MongoDB.")
        return

    client = MongoClient(args.mongodb_uri)
    collection = client[args.db][args.collection]

    inserted = 0
    updated = 0
    deactivated = 0

    try:
        for course_code, comp_weights in sorted(grouped.items()):
            doc = build_document(
                course_code=course_code,
                component_weights=comp_weights,
                academic_year=args.academic_year,
                semester=args.semester,
                credits=args.credits,
                teacher_id=args.teacher_id,
                max_score=args.max_score,
            )

            upsert_filter = {
                "courseCode": course_code,
                "academicYear": args.academic_year,
                "semester": args.semester,
                "seedSource": SEED_SOURCE,
            }

            update_result = collection.update_one(
                upsert_filter,
                {
                    "$set": doc,
                    "$setOnInsert": {"createdAt": utc_now()},
                },
                upsert=True,
            )

            if update_result.upserted_id is not None:
                inserted += 1
            else:
                updated += 1

            if args.deactivate_existing:
                current_doc = collection.find_one(upsert_filter, {"_id": 1})
                if current_doc:
                    deactivate_result = collection.update_many(
                        {
                            "courseCode": course_code,
                            "isActive": True,
                            "_id": {"$ne": current_doc["_id"]},
                        },
                        {
                            "$set": {
                                "isActive": False,
                                "updatedAt": utc_now(),
                            }
                        },
                    )
                    deactivated += deactivate_result.modified_count

        print("[DONE] Seed completed.")
        print(f"[DONE] Inserted: {inserted}")
        print(f"[DONE] Updated: {updated}")
        if args.deactivate_existing:
            print(f"[DONE] Deactivated active duplicates: {deactivated}")

    finally:
        client.close()


if __name__ == "__main__":
    main()
