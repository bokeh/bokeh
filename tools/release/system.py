# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""
from __future__ import annotations

import logging
import os
import sys
from subprocess import PIPE, STDOUT, run as stdlib_run
from typing import Any

from .ui import shell

__all__ = ("System",)

log = logging.getLogger(__name__)


class System:
    """"""

    def __init__(self, dry_run: bool = False) -> None:
        self.dry_run: bool = dry_run
        self._pushd_state: list[str] = []

    def run(self, cmd: str, *, capture_stdout_only: bool = False, **kw: Any) -> str:
        """"""
        envstr = " ".join(f"{k}={v}" for k, v in kw.items()) + min(len(kw), 1) * " "
        log.info("%s", shell(f"{envstr}{cmd}"))

        env = dict(os.environ)
        env.update(kw)

        if self.dry_run:
            return ""

        result = stdlib_run(cmd, shell=True, stdout=PIPE, stderr=PIPE if capture_stdout_only else STDOUT, text=True, env=env)

        if result.returncode != 0:
            output = result.stdout
            if capture_stdout_only and result.stderr:
                output += "\n" + result.stderr
            raise RuntimeError(*output.strip().split("\n"))

        if capture_stdout_only and result.stderr:
            log.warning("%s", result.stderr.rstrip())

        return result.stdout

    def abort(self) -> None:
        """"""
        sys.exit(1)

    def cd(self, new_dir: str) -> None:
        """"""
        os.chdir(new_dir)
        log.info("%s", shell(f"cd {new_dir} # [now: {os.getcwd()}]"))

    def pushd(self, new_dir: str) -> None:
        """"""
        self._pushd_state.append(os.getcwd())
        self.cd(new_dir)

    def popd(self) -> None:
        """"""
        self.cd(self._pushd_state.pop())
