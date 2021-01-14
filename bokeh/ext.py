#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os import PathLike
from os.path import join
from subprocess import Popen
from typing import AnyStr, List, Optional

# Bokeh imports
from . import __version__
from .settings import settings
from .util.compiler import _nodejs_path

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ["init", "build"]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def init(base_dir: "PathLike[AnyStr]", *, interactive: bool = False,
         bokehjs_version: Optional[str] = None, debug: bool = False) -> bool:
    """
    Initialize a directory as a new bokeh extension.

    Arguments:
        base_dir (str) : The location of the extension.

        interactive (bool) : Guide the user step-by-step.

        bokehjs_version (str) : Use a specific version of bokehjs.

        debug (bool) : Allow for remote debugging.

    Returns:
        bool

    """
    args = []
    if interactive:
        args.append("--interactive")
    if bokehjs_version:
        args.extend(["--bokehjs-version", bokehjs_version])
    proc = _run_command("init", base_dir, args, debug)
    return proc.returncode == 0


def build(base_dir: "PathLike[AnyStr]", *, rebuild: bool = False, debug: bool = False) -> bool:
    """
    Build a bokeh extension in the given directory.

    Arguments:
        base_dir (str) : The location of the extension.

        rebuild (bool) : Ignore caches and rebuild from scratch.

        debug (bool) : Allow for remote debugging.

    Returns:
        bool

    """
    args = []
    if rebuild:
        args.append("--rebuild")
    proc = _run_command("build", base_dir, args, debug)
    return proc.returncode == 0

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _run_command(command: str, base_dir: "PathLike[AnyStr]", args: List[str], debug: bool = False) -> "Popen[bytes]":
    bokehjs_dir = settings.bokehjsdir()

    if debug:
        compiler_script = join(bokehjs_dir, "js", "compiler", "main.js")
    else:
        compiler_script = join(bokehjs_dir, "js", "compiler.js")

    cmd = [
        "--no-deprecation",
        compiler_script,
        command,
        "--base-dir", base_dir,
        "--bokehjs-dir", bokehjs_dir,
        "--bokeh-version", __version__,
    ]

    if debug:
        cmd.insert(0, "--inspect-brk")

    cmd.extend(args)

    proc = Popen([_nodejs_path()] + cmd)
    proc.communicate()
    return proc

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
