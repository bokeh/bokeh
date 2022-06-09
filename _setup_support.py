#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''
# Standard library imports
import os
import re
import shutil
import sys
import time
from pathlib import Path
from subprocess import PIPE, CompletedProcess, run

from setuptools import Command

# -----------------------------------------------------------------------------
# Module global variables
# -----------------------------------------------------------------------------

MIN_PYTHON_VERSION = (3, 8)

# state our runtime deps here, also used by meta.yaml (so KEEP the spaces)
INSTALL_REQUIRES = [
    'Jinja2 >=2.9',
    'numpy >=1.11.3',
    'packaging >=16.8',
    'pillow >=7.1.0',
    'PyYAML >=3.10',
    'tornado >=5.1',
    'typing_extensions >=3.10.0',
    'xyzservices >=2021.09.1',
]

BOKEHJS_FILES = (
    "bokeh.js",
    "bokeh.min.js",
    "bokeh-widgets.js",
    "bokeh-widgets.min.js",
    "bokeh-tables.js",
    "bokeh-tables.min.js",
    "bokeh-api.js",
    "bokeh-api.min.js",
    "bokeh-gl.js",
    "bokeh-gl.min.js",
    "bokeh-mathjax.js",
    "bokeh-mathjax.min.js",
)

ROOT = Path(__file__).resolve().parent
BOKEHJSROOT = ROOT / "bokehjs"
BOKEHJSBUILD = BOKEHJSROOT / "build"
JS = BOKEHJSBUILD / "js"
SERVER = ROOT / "bokeh" / "server"
TSLIB = BOKEHJSROOT / "node_modules" / "typescript" / "lib"

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def check_python() -> None:
    if sys.version_info[:2] < MIN_PYTHON_VERSION:
        raise RuntimeError("Bokeh requires Python >= " + ".".join(str(x) for x in MIN_PYTHON_VERSION))

class BuildJSCmd(Command):
    def initialize_options(self) -> None:
        self.action = os.environ.get("BOKEHJS_ACTION", "build")

    def finalize_options(self) -> None:
        pass

    def run(self) -> None:
        if self.action == "install":
            self.install_js()

        elif self.action == "build":
            self.build_js()
            self.install_js()

        else:
            raise ValueError(f"Unrecognized BOKEHJS_ACTION: {self.action!r}")

        self.summarize()

    def build_js(self) -> None:
        print("Building BokehJS... ", end="")

        t0 = time.time()
        proc = run("node make build".split(), stdout=PIPE, stderr=PIPE, cwd="bokehjs")
        t1 = time.time()

        if proc.returncode != 0:
            self.fail(proc)

        self.build_report(proc, t1-t0)

    def install_js(self) -> None:
        self.check_prior_build()

        jsdir = SERVER / "static" / "js"
        if jsdir.exists():
            shutil.rmtree(jsdir)
        shutil.copytree(JS, jsdir)

        tslibdir = SERVER / "static" / "lib"

        if tslibdir.exists():
            shutil.rmtree(tslibdir)

        if TSLIB.exists():
            os.mkdir(tslibdir)
            for lib_file in TSLIB.glob("lib.*.d.ts"):
                shutil.copy(lib_file, tslibdir)

    def check_prior_build(self) -> None:
        if not all((JS / filename).exists() for filename in BOKEHJS_FILES):
            print(BOKEHJS_INSTALL_FAIL)
            sys.exit(1)

    def fail(self, proc: CompletedProcess[bytes]) -> None:
        outmsg = proc.stdout.decode('ascii', errors='ignore')
        outmsg = "\n".join(f"    {x}" for x in outmsg.split("\n"))
        errmsg = proc.stderr.decode('ascii', errors='ignore')
        errmsg = "\n".join(f"    {x}" for x in errmsg.split("\n"))
        print(BUILD_FAIL_MSG.format(outmsg=outmsg, errmsg=errmsg))
        sys.exit(1)

    def build_report(self, proc: CompletedProcess[bytes], dt: float) -> None:
        indented_msg = ""
        msg = proc.stdout.decode('ascii', errors='ignore')
        pat = re.compile(r"(\[.*\]) (.*)", re.DOTALL)
        for line in msg.strip().split("\n"):
            if m := pat.match(line):
                stamp, txt = m.groups()
                indented_msg += f"   {stamp} {txt}\n"

        def size(name: str) -> float:
            return os.stat(JS / name).st_size / 2**10

        try:
            sizes = "\n".join(f"  - {fn:<20}: {size(fn):6.1f} KB" for fn in BOKEHJS_FILES)
        except Exception as e:
            print(BUILD_SIZE_FAIL_MSG.format(msg=str(e)))
            sys.exit(1)

        print(BUILD_SUCCESS_MSG.format(msg=indented_msg, time=dt, sizes=sizes))

    def summarize(self) -> None:
        kind = "NEWLY BUILT" if self.action == "build" else "PREVIOUSLY BUILT"
        print(SUMMARY_MSG.format(kind=kind))

# -----------------------------------------------------------------------------
# Status and error message strings
# -----------------------------------------------------------------------------

BOKEHJS_INSTALL_FAIL = """
ERROR: Cannot install BokehJS: files missing in `./bokehjs/build`.

Please see the Contributor Guide for setup/build instructions:

    https://docs.bokeh.org/en/latest/docs/dev_guide/setup.html.
"""

BUILD_FAIL_MSG = """Failed.

ERROR: 'node make build' returned the following

---- on stdout:
{outmsg}

---- on stderr:
{errmsg}
"""

BUILD_SIZE_FAIL_MSG = """
ERROR: could not determine sizes:

    {msg}
"""

BUILD_SUCCESS_MSG = """Success!

Build output:

{msg}

Build time: {time:0.1f} seconds

Build artifact sizes:

{sizes}
"""

SUMMARY_MSG = """
Installed {kind} BokehJS, from bokehjs/build
"""
