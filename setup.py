#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Setup script for Bokeh.

Two separate components comprise Bokeh:

* A JavaScript runtime BokehJS that draws and handles events in browsers
* Python "bindings" and an optional server for interacting with BokehJS

The BokehJS library is written in TypeScript, which requires a compilation
step to build BokehJS. This makes the Bokeh setup and install process more
complicated than typical pure Python projects.

'''

# Standard library imports
import os
import re
import subprocess
import sys
import time
from glob import glob
from os.path import dirname, exists, join, realpath
from shutil import copy, copytree, rmtree

# External imports
from setuptools import setup

# -----------------------------------------------------------------------------
# UI helpers
# -----------------------------------------------------------------------------

try:
    import colorama

    if sys.platform == "win32":
        colorama.init()

    def bright(text: str) -> str: return f"{colorama.Style.BRIGHT}{text}{colorama.Style.RESET_ALL}"
    def dim(text: str) -> str: return f"{colorama.Style.DIM}{text}{colorama.Style.RESET_ALL}"
    def red(text: str) -> str: return f"{colorama.Fore.RED}{text}{colorama.Style.RESET_ALL}"
    def green(text: str) -> str: return f"{colorama.Fore.GREEN}{text}{colorama.Style.RESET_ALL}"
    def yellow(text: str) -> str: return f"{colorama.Fore.YELLOW}{text}{colorama.Style.RESET_ALL}"
except ModuleNotFoundError:
    def ident(text: str) -> str: return text
    bright = dim = red = green = yellow = ident

def show_bokehjs(bokehjs_action, develop=False):
    print("\nInstalled Bokeh for DEVELOPMENT:" if develop else "Installed Bokeh:")

    if bokehjs_action == "built":
        kind = bright(yellow("NEWLY BUILT"))
        loc = "bokehjs/build"
    elif bokehjs_action == "installed":
        kind = bright(yellow("PREVIOUSLY BUILT"))
        loc = "bokehjs/build"
    else:
        kind = bright(yellow("PACKAGED"))
        loc = "bokeh.server.static"
    print(f"  - using {kind} BokehJS, from {loc}\n\n")

# -----------------------------------------------------------------------------
# Helpers for operations in the bokehjs dir
# -----------------------------------------------------------------------------

def build_or_install_bokehjs() -> str:
    ROOT = dirname(realpath(__file__))
    if exists(join(ROOT, 'PKG-INFO')):
        return "packaged"

    action = os.environ.get("BOKEHJS_ACTION", "build")

    if action == "install":
        install_js()
        return "installed"

    if action == "build":
        build_js()
        install_js()
        return "built"

    raise RuntimeError(f"Unrecognized action {action!r}")

def build_js():
    ''' Build BokehJS files under the ``bokehjs`` source subdirectory.

    Also prints a table of statistics about the generated assets (file sizes,
    etc.) or any error messages if the build fails.

    Note this function only builds BokehJS assets, it does not install them
    into the python source tree.

    '''
    print("Building BokehJS... ", end="")
    sys.stdout.flush()
    os.chdir('bokehjs')

    cmd = ["node", "make", "build"]

    t0 = time.time()
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except OSError as e:
        print(BUILD_EXEC_FAIL_MSG % (cmd, e))
        sys.exit(1)
    finally:
        os.chdir('..')

    result = proc.wait()
    t1 = time.time()

    if result != 0:
        indented_msg = ""
        outmsg = proc.stdout.read().decode('ascii', errors='ignore')
        outmsg = "\n".join("    " + x for x in outmsg.split("\n"))
        errmsg = proc.stderr.read().decode('ascii', errors='ignore')
        errmsg = "\n".join("    " + x for x in errmsg.split("\n"))
        print(BUILD_FAIL_MSG % (red(outmsg), red(errmsg)))
        sys.exit(1)

    indented_msg = ""
    msg = proc.stdout.read().decode('ascii', errors='ignore')
    pat = re.compile(r"(\[.*\]) (.*)", re.DOTALL)
    for line in msg.strip().split("\n"):
        m = pat.match(line)
        if not m: continue # skip generate.py output lines
        stamp, txt = m.groups()
        indented_msg += "   " + dim(green(stamp)) + " " + dim(txt) + "\n"
    print(BUILD_SUCCESS_MSG % indented_msg)
    print("Build time: %s" % bright(yellow("%0.1f seconds" % (t1-t0))))
    print()
    print("Build artifact sizes:")
    try:
        def size(*path):
            return os.stat(join("bokehjs", "build", *path)).st_size / 2**10

        print("  - bokeh.js              : %6.1f KB" % size("js", "bokeh.js"))
        print("  - bokeh.min.js          : %6.1f KB" % size("js", "bokeh.min.js"))

        print("  - bokeh-widgets.js      : %6.1f KB" % size("js", "bokeh-widgets.js"))
        print("  - bokeh-widgets.min.js  : %6.1f KB" % size("js", "bokeh-widgets.min.js"))

        print("  - bokeh-tables.js       : %6.1f KB" % size("js", "bokeh-tables.js"))
        print("  - bokeh-tables.min.js   : %6.1f KB" % size("js", "bokeh-tables.min.js"))

        print("  - bokeh-api.js          : %6.1f KB" % size("js", "bokeh-api.js"))
        print("  - bokeh-api.min.js      : %6.1f KB" % size("js", "bokeh-api.min.js"))

        print("  - bokeh-gl.js           : %6.1f KB" % size("js", "bokeh-gl.js"))
        print("  - bokeh-gl.min.js       : %6.1f KB" % size("js", "bokeh-gl.min.js"))

        print("  - bokeh-mathjax.js      : %6.1f KB" % size("js", "bokeh-mathjax.js"))
        print("  - bokeh-mathjax.min.js  : %6.1f KB" % size("js", "bokeh-mathjax.min.js"))
    except Exception as e:
        print(BUILD_SIZE_FAIL_MSG % e)
        sys.exit(1)

def install_js():
    ''' Copy built BokehJS files into the Python source tree.

    Returns:
        None

    '''
    ROOT = dirname(realpath(__file__))
    BOKEHJSROOT = join(ROOT, 'bokehjs')
    BOKEHJSBUILD = join(BOKEHJSROOT, 'build')
    JS = join(BOKEHJSBUILD, 'js')
    SERVER = join(ROOT, 'bokeh/server')
    TSLIB = join(BOKEHJSROOT , 'node_modules/typescript/lib')

    target_jsdir = join(SERVER, 'static', 'js')
    target_tslibdir = join(SERVER, 'static', 'lib')

    STATIC_ASSETS = [
        join(JS,  'bokeh.js'),
        join(JS,  'bokeh.min.js'),
    ]
    if not all(exists(a) for a in STATIC_ASSETS):
        print(BOKEHJS_INSTALL_FAIL)
        sys.exit(1)

    if exists(target_jsdir):
        rmtree(target_jsdir)
    copytree(JS, target_jsdir)

    if exists(target_tslibdir):
        rmtree(target_tslibdir)
    if exists(TSLIB):
        os.mkdir(target_tslibdir)
        for lib_file in glob(join(TSLIB, "lib.*.d.ts")):
            copy(lib_file, target_tslibdir)

# -----------------------------------------------------------------------------
# Status and error message strings
# -----------------------------------------------------------------------------

BOKEHJS_INSTALL_FAIL = """

ERROR: Cannot install BokehJS: files missing in `./bokehjs/build`.

Please refer the Contributor Guide for building BokehJS:

    https://docs.bokeh.org/en/latest/docs/dev_guide/setup.html.
"""

BUILD_EXEC_FAIL_MSG = bright(red("Failed.")) + """

ERROR: subprocess.Popen(%r) failed to execute:

    %s

Please refer the Contributor Guide for building BokehJS:

    https://docs.bokeh.org/en/latest/docs/dev_guide/setup.html.
"""

BUILD_FAIL_MSG = bright(red("Failed.")) + """

ERROR: 'node make build' returned the following

---- on stdout:
%s

---- on stderr:
%s
"""

BUILD_SIZE_FAIL_MSG = """
ERROR: could not determine sizes:

    %s
"""

BUILD_SUCCESS_MSG = bright(green("Success!")) + """

Build output:

%s"""

# -----------------------------------------------------------------------------
# Setuptools
# -----------------------------------------------------------------------------

bokehjs_action = build_or_install_bokehjs()

setup()

show_bokehjs(bokehjs_action)
