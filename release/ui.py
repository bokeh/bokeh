# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import sys
from typing import Callable, Optional, Sequence

__all__ = (
    "banner",
    "failed",
    "passed",
    "skipped",
)

ColorFunction = Callable[[str], str]

try:
    import colorama  # isort:skip

    def bright(text: str) -> str:
        return "%s%s%s" % (colorama.Style.BRIGHT, text, colorama.Style.RESET_ALL)

    def dim(text: str) -> str:
        return "%s%s%s" % (colorama.Style.DIM, text, colorama.Style.RESET_ALL)

    def white(text: str) -> str:
        return "%s%s%s" % (colorama.Fore.WHITE, text, colorama.Style.RESET_ALL)

    def blue(text: str) -> str:
        return "%s%s%s" % (colorama.Fore.BLUE, text, colorama.Style.RESET_ALL)

    def red(text: str) -> str:
        return "%s%s%s" % (colorama.Fore.RED, text, colorama.Style.RESET_ALL)

    def green(text: str) -> str:
        return "%s%s%s" % (colorama.Fore.GREEN, text, colorama.Style.RESET_ALL)

    def yellow(text: str) -> str:
        return "%s%s%s" % (colorama.Fore.YELLOW, text, colorama.Style.RESET_ALL)

    sys.platform == "win32" and colorama.init()
except ImportError:

    def bright(text: str) -> str:
        return text

    def dim(text: str) -> str:
        return text

    def white(text: str) -> str:
        return text

    def blue(text: str) -> str:
        return text

    def red(text: str) -> str:
        return text

    def green(text: str) -> str:
        return text

    def yellow(text: str) -> str:
        return text


def banner(color: ColorFunction, msg: str) -> None:
    print()
    print(color("=" * 80))
    print(color("{:^80}".format(msg)))
    print(color("=" * 80 + "\n"))


def failed(msg: str, details: Optional[Sequence[str]] = None) -> None:
    print((red("[FAIL] ")) + msg)
    if details:
        print()
        for line in details:
            print("     " + line)
        print()


def passed(msg: str) -> None:
    print(dim(green("[PASS] ")) + msg)


def skipped(msg: str) -> None:
    print(blue("[SKIP] ") + msg)
