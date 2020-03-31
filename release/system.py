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
from typing import Any, List, Optional, cast

__all__ = ("System",)


class System(object):
    def __init__(self, dry_run: bool = False) -> None:
        self.dry_run: bool = dry_run
        self.log: List[str] = []

    def record(self, *lines: str) -> None:
        self.log.extend(lines)

    def run(self, cmd: str, fake_cmd: Optional[str] = None, **kw: Any) -> str:

        envstr = " ".join(f"{k}={v}" for k, v in kw.items()) + min(len(kw), 1) * " "
        self.record(f"+{envstr}{fake_cmd or cmd}")

        env = dict(os.environ)
        env.update(kw)

        if self.dry_run:
            return ""

        result = stdlib_run(cmd, shell=True, stdout=PIPE, stderr=STDOUT, text=True, env=env)  # type: ignore

        self.record(*result.stdout.split("\n"))

        result.check_returncode()

        return cast(str, result.stdout)

    def cd(self, new_dir: str) -> None:
        os.chdir(new_dir)
        self.record(f"+cd {new_dir}  [now: {os.getcwd()}]")
