# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""

# Standard library imports
import os
from subprocess import PIPE, STDOUT
from subprocess import run as stdlib_run
from typing import Any, List

# Bokeh imports
from .logger import LOG
from .ui import shell

__all__ = ("System",)


class System:
    """"""

    def __init__(self, dry_run: bool = False) -> None:
        self.dry_run: bool = dry_run
        self._pushd_state: List[str] = []

    def run(self, cmd: str, **kw: Any) -> str:
        """"""
        envstr = " ".join(f"{k}={v}" for k, v in kw.items()) + min(len(kw), 1) * " "
        LOG.record(shell(f"{envstr}{cmd}"))

        env = dict(os.environ)
        env.update(kw)

        if self.dry_run:
            return ""

        result = stdlib_run(cmd, shell=True, stdout=PIPE, stderr=STDOUT, text=True, env=env)

        if result.returncode != 0:
            raise RuntimeError(*result.stdout.strip().split("\n"))

        return result.stdout

    def abort(self) -> None:
        """"""
        raise RuntimeError()

    def cd(self, new_dir: str) -> None:
        """"""
        os.chdir(new_dir)
        LOG.record(shell(f"cd {new_dir} # [now: {os.getcwd()}]"))

    def pushd(self, new_dir: str) -> None:
        """"""
        self._pushd_state.append(os.getcwd())
        self.cd(new_dir)

    def popd(self) -> None:
        """"""
        self.cd(self._pushd_state.pop())
