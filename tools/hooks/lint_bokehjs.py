import sys
from pathlib import Path
from subprocess import run
from typing import NoReturn

BOKEHJS_DIR = Path(__file__).resolve().parents[2] / "bokehjs"


def lint_bokehjs() -> NoReturn:
    # Type-aware lint rules check tests, examples and frameworks against
    # the built *.d.ts files, so build BokehJS first.
    proc = run(["node", "make", "build", "lint"], cwd=BOKEHJS_DIR)
    sys.exit(proc.returncode)


if __name__ == "__main__":
    lint_bokehjs()
