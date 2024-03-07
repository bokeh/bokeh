#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os import fspath
from subprocess import Popen

# Bokeh imports
from . import __version__
from .core.types import PathLike
from .settings import settings
from .util.compiler import _nodejs_path

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ("init", "build")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def init(
    base_dir: PathLike,
    *,
    interactive: bool = False,
    verbose: bool = False,
    bokehjs_version: str | None = None,
    debug: bool = False,
) -> bool:
    """ Initialize a directory as a new bokeh extension.

    Arguments:
        base_dir (str) : The location of the extension.

        interactive (bool) : Guide the user step-by-step.

        verbose (bool) : Display detailed build information.

        bokehjs_version (str) : Use a specific version of bokehjs.

        debug (bool) : Allow for remote debugging.

    Returns:
        bool

    """
    args: list[str] = []
    if interactive:
        args.append("--interactive")
    if verbose:
        args.append("--verbose")
    if bokehjs_version:
        args.extend(["--bokehjs-version", bokehjs_version])
    proc = _run_command("init", base_dir, args, debug)
    return proc.returncode == 0


def build(base_dir: PathLike, *, rebuild: bool = False, verbose: bool = False, debug: bool = False) -> bool:
    """ Build a bokeh extension in the given directory.

    Arguments:
        base_dir (str) : The location of the extension.

        rebuild (bool) : Ignore caches and rebuild from scratch.

        verbose (bool) : Display detailed build information.

        debug (bool) : Allow for remote debugging.

    Returns:
        bool

    """
    args: list[str] = []
    if rebuild:
        args.append("--rebuild")
    if verbose:
        args.append("--verbose")
    proc = _run_command("build", base_dir, args, debug)
    return proc.returncode == 0

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _run_command(command: str, base_dir: PathLike, args: list[str], debug: bool = False) -> Popen[bytes]:
    bokehjs_dir = settings.bokehjs_path()

    if debug:
        compiler_script = bokehjs_dir / "js" / "compiler" / "main.js"
    else:
        compiler_script = bokehjs_dir / "js" / "compiler.js"

    cmd = [
        "--no-deprecation",
        fspath(compiler_script),
        command,
        "--base-dir", fspath(base_dir),
        "--bokehjs-dir", fspath(bokehjs_dir),
        "--bokeh-version", __version__,
    ]

    if debug:
        cmd.insert(0, "--inspect-brk")

    cmd.extend(args)

    proc = Popen([_nodejs_path(), *cmd])
    proc.communicate()
    return proc

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
