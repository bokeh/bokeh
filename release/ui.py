# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""

# Standard library imports
import sys
from typing import Callable, Optional, Sequence

__all__ = (
    "banner",
    "failed",
    "passed",
    "shell",
    "skipped",
)

ColorFunction = Callable[[str], str]

try:
    import colorama  # isort:skip

    def bright(text: str) -> str:
        return f"{colorama.Style.BRIGHT}{text}{colorama.Style.RESET_ALL}"

    def dim(text: str) -> str:
        return f"{colorama.Style.DIM}{text}{colorama.Style.RESET_ALL}"

    def white(text: str) -> str:
        return f"{colorama.Fore.WHITE}{text}{colorama.Style.RESET_ALL}"

    def blue(text: str) -> str:
        return f"{colorama.Fore.BLUE}{text}{colorama.Style.RESET_ALL}"

    def red(text: str) -> str:
        return f"{colorama.Fore.RED}{text}{colorama.Style.RESET_ALL}"

    def green(text: str) -> str:
        return f"{colorama.Fore.GREEN}{text}{colorama.Style.RESET_ALL}"

    def yellow(text: str) -> str:
        return f"{colorama.Fore.YELLOW}{text}{colorama.Style.RESET_ALL}"

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


def banner(color: ColorFunction, msg: str) -> str:
    """

    """
    section = "=" * 80
    header = f"{msg:^80}"
    return f"\n{section}\n{header}\n{section}\n"


def _format_details(details: Optional[Sequence[str]] = None) -> str:
    if details:
        return "\n" + "\n".join(f"    {line}" for line in details)
    return ""


def failed(msg: str, details: Optional[Sequence[str]] = None) -> str:
    """

    """
    return f"{red('[FAIL]')} {msg}" + _format_details(details)


def passed(msg: str, details: Optional[Sequence[str]] = None) -> str:
    """

    """
    return f"{dim(green('[PASS]'))} {msg}" + _format_details(details)


def shell(cmd: str) -> str:
    return dim(white(f"+{cmd}"))


def skipped(msg: str, _details: Optional[Sequence[str]] = None) -> str:
    """

    """
    return f"{blue('[SKIP]')} {msg}"


def task(msg: str) -> str:
    """

    """
    return f"\n------ {msg}"
