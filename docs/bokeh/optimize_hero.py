# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

"""Regenerate the homepage WebPs from the original collage using cwebp.

From the repository root, run ``python docs/bokeh/optimize_hero.py`` with
the WebP project's ``cwebp`` encoder installed on PATH.
"""

from pathlib import Path
from shutil import which
from subprocess import run


def main() -> None:
    encoder = which("cwebp")
    if encoder is None:
        raise SystemExit("Install cwebp and make it available on PATH.")

    images = Path(__file__).resolve().parent / "source" / "_images"
    source = images / "bokeh-hero.png"
    options = [encoder, "-q", "90", "-m", "6"]
    run([*options, str(source), "-o", str(images / "bokeh-hero.webp")], check=True)
    run([*options, "-resize", "600", "200", str(source), "-o", str(images / "bokeh-hero-600.webp")], check=True)


if __name__ == "__main__":
    main()
