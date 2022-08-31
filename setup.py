#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import os, re, subprocess, sys, time
from itertools import product
from pathlib import Path
from shutil import copy, copytree, rmtree
from textwrap import indent
from typing import NoReturn

# External imports
from setuptools import setup  # type: ignore[import]
from setuptools.command.build import build  # type: ignore[import]
from setuptools.command.editable_wheel import editable_wheel  # type: ignore[import]
from setuptools.command.sdist import sdist  # type: ignore[import]

# --- Helpers ----------------------------------------------------------------

try:
    import colorama
    if sys.platform == "win32": colorama.init()
    def bright(text: str) -> str: return f"{colorama.Style.BRIGHT}{text}{colorama.Style.RESET_ALL}"
    def dim(text: str) -> str: return f"{colorama.Style.DIM}{text}{colorama.Style.RESET_ALL}"
    def red(text: str) -> str: return f"{colorama.Fore.RED}{text}{colorama.Style.RESET_ALL}"
    def green(text: str) -> str: return f"{colorama.Fore.GREEN}{text}{colorama.Style.RESET_ALL}"
    def yellow(text: str) -> str: return f"{colorama.Fore.YELLOW}{text}{colorama.Style.RESET_ALL}"
except ModuleNotFoundError:
    def _plain(text: str) -> str: return text
    bright = dim = red = green = yellow = _plain

ROOT = Path(__file__).resolve().parent
SRC_ROOT = ROOT / "src"
BUILD_JS = ROOT / 'bokehjs' / 'build' / 'js'
BUILD_TSLIB = ROOT / 'bokehjs' / 'node_modules' / 'typescript' / 'lib'
PKG_STATIC = SRC_ROOT / 'bokeh' / 'server' / 'static'
PKG_JS = PKG_STATIC / 'js'
PKG_TSLIB = PKG_STATIC / 'lib'
COMPONENTS = ("bokeh", "bokeh-widgets", "bokeh-tables", "bokeh-api", "bokeh-gl", "bokeh-mathjax")
JS_FILES = [f"{c}{m}.js" for c, m in product(COMPONENTS, ("", ".min"))]

def build_js() -> None:
    print("\nBuilding BokehJS... ", end="")
    try:
        t0 = time.time()
        proc = subprocess.run(["node", "make", "build"], capture_output=True, cwd="bokehjs")
        t1 = time.time()
    except OSError as e:
        die(BUILD_EXEC_FAIL_MSG.format(exc=e))

    if proc.returncode != 0:
        out = indent(proc.stdout.decode('ascii', errors='ignore'), '    ')
        err = indent(proc.stderr.decode('ascii', errors='ignore'), '    ')
        die(BUILD_FAIL_MSG.format(stdout=red(out), stderr=red(err)))

    out = proc.stdout.decode('ascii', errors='ignore')
    pat = re.compile(r"(\[.*\]) (.*)", re.DOTALL)
    msg = []
    for line in out.strip().split("\n"):
        if m := pat.match(line):
            stamp, txt = m.groups()
            msg.append(f"   {dim(green(stamp))} {dim(txt)}")
    print(BUILD_SUCCESS_MSG.format(msg="\n".join(msg)))
    print(f"\n Build time: {bright(yellow(f'{t1-t0:0.1f} seconds'))}\n")

    print("Build artifact sizes:")
    try:
        for fn in JS_FILES:
            size = (BUILD_JS / fn).stat().st_size / 2**10
            print(f"  - {fn:<20} : {size:6.1f} KB")
    except FileNotFoundError as e:
        die(BUILD_SIZE_FAIL_MSG.format(exc=e))

def install_js(packages: list[str]) -> None:
    print("\nInstalling BokehJS... ", end="")

    missing = [fn for fn in JS_FILES if not (BUILD_JS / fn).exists()]
    if missing:
        die(BOKEHJS_INSTALL_FAIL.format(missing=", ".join(missing)))

    if PKG_JS.exists():
        rmtree(PKG_JS)
    copytree(BUILD_JS, PKG_JS)

    if PKG_TSLIB.exists():
        rmtree(PKG_TSLIB)
    if BUILD_TSLIB.exists():
        PKG_TSLIB.mkdir()
        for lib_file in BUILD_TSLIB.glob("lib.*.d.ts"):
            copy(lib_file, PKG_TSLIB)

    new = set(
        ".".join([*Path(parent).relative_to(SRC_ROOT).parts, d])
        for parent, dirs, _ in os.walk(PKG_STATIC) for d in dirs
    )
    existing = set(packages)
    packages.extend(tuple(new-existing))

    print(SUCCESS)

def build_or_install_bokehjs(packages: list[str]) -> None:
    action = os.environ.get("BOKEHJS_ACTION", "build")
    if (ROOT / 'PKG-INFO').exists():
        kind, loc = "PACKAGED", "bokeh.server.static"
    elif action == "install":
        kind, loc = "PREVIOUSLY BUILT", "bokehjs/build"
        install_js(packages)
    elif action == "build":
        kind, loc = "NEWLY BUILT", "bokehjs/build"
        build_js()
        install_js(packages)
    else:
        raise ValueError(f"Unrecognized action {action!r}")
    print(f"Used {bright(yellow(kind))} BokehJS from {loc}\n")

def die(x: str) -> NoReturn:
    print(f"{x}\n")
    sys.exit(1)

SUCCESS = f"{bright(green('Success!'))}\n"
FAILED = f"{bright(red('Failed.'))}\n"
BUILD_SUCCESS_MSG =f"{SUCCESS}\nBuild output:\n\n{{msg}}"
BUILD_SIZE_FAIL_MSG = f"{FAILED}\nERROR: could not determine sizes:\n\n     {{exc}}"
BOKEHJS_INSTALL_FAIL = f"{FAILED}\nERROR: Cannot install BokehJS: files missing in bokehjs/build:\n\n    {{missing}}"
BUILD_EXEC_FAIL_MSG = f"{FAILED}\nERROR: 'node make build' failed to execute:\n\n    {{exc}}"
BUILD_FAIL_MSG = f"""{FAILED}\nERROR: 'node make build' returned the following

---- on stdout:
{{stdout}}

---- on stderr:
{{stderr}}
"""

# --- Setuptools -------------------------------------------------------------

class Build(build):  # type: ignore
    def run(self) -> None:
        build_or_install_bokehjs(self.distribution.packages)
        super().run()

class EditableWheel(editable_wheel):  # type: ignore
    def run(self) -> None:
        build_or_install_bokehjs(self.distribution.packages)
        super().run()

class Sdist(sdist):  # type: ignore
    def run(self) -> None:
        build_or_install_bokehjs(self.distribution.packages)
        super().run()

setup(cmdclass={"build": Build, "editable_wheel": EditableWheel, "sdist": Sdist})
