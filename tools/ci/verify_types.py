# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

"""Check type completeness of Bokeh's public API with ``pyright --verifytypes``.

``pyright --verifytypes`` fails on any incomplete symbol, which Bokeh can't
satisfy yet, so instead this script gates on the reported numbers and fails
when they regress below the recorded baseline. Raise the baseline whenever
type completeness improves.

"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from argparse import ArgumentParser
from pathlib import Path

# Baseline. Fail when completeness drops below or unknown symbols rise above.
MIN_COMPLETENESS_SCORE = 0.872
MAX_UNKNOWN_SYMBOLS = 59


def verify_types(repo_root: Path, min_score: float, max_unknown: int) -> int:
    package_dir = repo_root / "src" / "bokeh"
    cmd = ["pyright", "--verifytypes", "bokeh", "--ignoreexternal", "--outputjson"]
    # --verifytypes resolves the package through the Python environment (it
    # ignores pyright's extraPaths), so point it at the source tree explicitly,
    # instead of whichever bokeh (if any) is installed in the environment.
    pythonpath = os.pathsep.join(filter(None, [str(package_dir.parent), os.environ.get("PYTHONPATH")]))
    env = {**os.environ, "PYTHONPATH": pythonpath}
    # pyright exits with 1 when any symbol is incomplete, so don't check the return code
    proc = subprocess.run(cmd, cwd=repo_root, env=env, capture_output=True, text=True, check=False)
    try:
        report = json.loads(proc.stdout)
    except json.JSONDecodeError:
        print(proc.stdout, proc.stderr, sep="\n", file=sys.stderr)
        print("error: failed to parse output of: " + " ".join(cmd), file=sys.stderr)
        return 2

    completeness = report["typeCompleteness"]
    counts = completeness["exportedSymbolCounts"]

    analyzed_dir = completeness.get("packageRootDirectory") or ""
    if not analyzed_dir or Path(analyzed_dir).resolve() != package_dir.resolve() or sum(counts.values()) == 0:
        print(f"error: expected pyright to analyze {package_dir}, but it analyzed {analyzed_dir!r} instead", file=sys.stderr)
        return 2
    score: float = completeness["completenessScore"]
    unknown: int = counts["withUnknownType"]

    print(f"pyright {report['version']}")
    print(f"exported symbols: {counts['withKnownType']} known, {counts['withAmbiguousType']} ambiguous, {unknown} unknown")
    print(f"type completeness score: {score:.2%} (baseline: {min_score:.2%})")

    failed = False
    if score < min_score:
        print(f"error: type completeness score dropped to {score:.2%}, below {min_score:.2%}", file=sys.stderr)
        failed = True
    if unknown > max_unknown:
        print(f"error: number of symbols with unknown type increased to {unknown}, above {max_unknown}", file=sys.stderr)
        failed = True
    if failed:
        print("Run `pyright --verifytypes bokeh --ignoreexternal` for details.", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    parser = ArgumentParser(description="Check type completeness of Bokeh's public API.")
    parser.add_argument("--min-score", type=float, default=MIN_COMPLETENESS_SCORE)
    parser.add_argument("--max-unknown", type=int, default=MAX_UNKNOWN_SYMBOLS)
    args = parser.parse_args()
    sys.exit(verify_types(Path(__file__).resolve().parents[2], args.min_score, args.max_unknown))
