#!/usr/bin/env python3
"""Find Mantis rule-sheet cases whose row text contains every search term.

Searches the CSV snapshots in references/cases/ (Sheet A tabs, Sheet B combos, and
Sheet C Routing Rules tabs). Matching is case-insensitive and every term must appear in
the same row.

Examples:
  find-sheet-case.py force_tech "Region Enforcement (Strict)"
  find-sheet-case.py "Keep Week" --tab sheet-c
  find-sheet-case.py "Edge Case" --tab custom-rules
  find-sheet-case.py "Max Jobs" "Drive Buffer" --tab sheet-b --limit 20
"""
import argparse
import csv
import pathlib

CASES_DIR = pathlib.Path(__file__).resolve().parent.parent / "references" / "cases"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("terms", nargs="+", help="text that must all appear in the row")
    parser.add_argument("--tab", default="", help="only CSV files whose name contains this text")
    parser.add_argument("--limit", type=int, default=50, help="maximum rows to print")
    parser.add_argument("--width", type=int, default=260, help="truncate printed rows")
    args = parser.parse_args()

    terms = [term.lower() for term in args.terms]
    hits = 0
    for path in sorted(CASES_DIR.glob("*.csv")):
        if args.tab.lower() not in path.stem.lower():
            continue
        with path.open(encoding="utf-8", newline="") as handle:
            for line_no, row in enumerate(csv.reader(handle), 1):
                text = " | ".join(cell for cell in row if cell.strip())
                if not text or not all(term in text.lower() for term in terms):
                    continue
                print(f"{path.stem}:{line_no}: {text[:args.width]}")
                hits += 1
                if hits >= args.limit:
                    print(f"... stopped at --limit {args.limit}")
                    return
    print(f"{hits} match(es)")


if __name__ == "__main__":
    main()
