# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import os
from subprocess import PIPE, STDOUT
from subprocess import run as stdlib_run
from typing import Any, Optional

__all__ = (
    "cd",
    "run",
)


def run(cmd: str, fake_cmd: Optional[str] = None, silent: bool = True, **kw: Any) -> str:

    if not silent:
        envstr = " ".join(f"{k}={v}" for k, v in kw.items())
        if envstr:
            envstr += " "
        if fake_cmd:
            print(f"+{envstr}{fake_cmd}")
        else:
            print(f"+{envstr}{cmd}")

    env = dict(os.environ)
    env.update(kw)

    result = stdlib_run(cmd, shell=True, stdout=PIPE, stderr=STDOUT, text=True, env=env)  # type: ignore

    result.check_returncode()

    return result.stdout or ""


def cd(dir: str, silent: bool = True) -> None:
    os.chdir(dir)
    if not silent:
        print("+cd %s    [now: %s]" % (dir, os.getcwd()))
