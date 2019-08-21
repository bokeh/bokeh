#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os.path import join
from subprocess import Popen, PIPE

# External imports

# Bokeh imports
from . import __version__
from .settings import settings
from .util.compiler import _nodejs_path

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ["build"]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def build(base_dir, debug=False, rebuild=False): # TODO: at 2.0, keyword only
    bokehjs_dir = settings.bokehjsdir()

    if debug:
        compiler_script = join(bokehjs_dir, "js", "compiler", "main.js")
    else:
        compiler_script = join(bokehjs_dir, "js", "compiler.js")

    cmd = [compiler_script, "build", "--base-dir", base_dir, "--bokehjs-dir", bokehjs_dir, "--bokeh-version", __version__]
    if debug:
        cmd.insert(0, "--inspect-brk")
    if rebuild:
        cmd.append("--rebuild")

    proc = Popen([_nodejs_path()] + cmd, stderr=PIPE)
    (_, stderr) = proc.communicate()
    if debug:
        print(stderr.encode("utf-8"))

    return proc.returncode == 0


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
