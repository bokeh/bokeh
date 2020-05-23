#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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
import subprocess
import sys
import time
from glob import glob
from os.path import dirname, exists, join, realpath

# provide fallbacks for highlights in case colorama is not installed
try:
    import colorama
    from colorama import Fore, Style

    def bright(text): return "%s%s%s" % (Style.BRIGHT, text, Style.RESET_ALL)
    def dim(text):    return "%s%s%s" % (Style.DIM,    text, Style.RESET_ALL)
    def red(text):    return "%s%s%s" % (Fore.RED,     text, Style.RESET_ALL)
    def green(text):  return "%s%s%s" % (Fore.GREEN,   text, Style.RESET_ALL)
    def yellow(text): return "%s%s%s" % (Fore.YELLOW,  text, Style.RESET_ALL)
    sys.platform == "win32" and colorama.init()
except ImportError:
    def bright(text):  return text
    def dim(text):     return text
    def red(text) :    return text
    def green(text) :  return text
    def yellow(text) : return text

# -----------------------------------------------------------------------------
# Module global variables
# -----------------------------------------------------------------------------

ROOT = dirname(realpath(__file__))
BOKEHJSROOT = join(ROOT, 'bokehjs')
BOKEHJSBUILD = join(BOKEHJSROOT, 'build')
JS = join(BOKEHJSBUILD, 'js')
SERVER = join(ROOT, 'bokeh/server')
TSLIB = join(BOKEHJSROOT , 'node_modules/typescript/lib')

# -----------------------------------------------------------------------------
# Helpers for command line operations
# -----------------------------------------------------------------------------

def show_bokehjs(bokehjs_action, develop=False):
    ''' Print a useful report after setuptools output describing where and how
    BokehJS is installed.

    Args:
        bokehjs_action (str) : one of 'built', 'installed', or 'packaged'
            how (or if) BokehJS was installed into the python source tree

        develop (bool, optional) :
            whether the command was for "develop" mode (default: False)

    Returns:
        None

    '''
    print()
    if develop:
        print("Installed Bokeh for DEVELOPMENT:")
    else:
        print("Installed Bokeh:")
    if bokehjs_action in ['built', 'installed']:
        print("  - using %s built BokehJS from bokehjs/build\n" % (bright(yellow("NEWLY")) if bokehjs_action=='built' else bright(yellow("PREVIOUSLY"))))
    else:
        print("  - using %s BokehJS, located in 'bokeh.server.static'\n" % bright(yellow("PACKAGED")))
    print()

def show_help(bokehjs_action):
    ''' Print information about extra Bokeh-specific command line options.

    Args:
        bokehjs_action (str) : one of 'built', 'installed', or 'packaged'
            how (or if) BokehJS was installed into the python source tree

    Returns:
        None

    '''
    print()
    if bokehjs_action in ['built', 'installed']:
        print("Bokeh-specific options available with 'install' or 'develop':")
        print()
        print("  --build-js          build and install a fresh BokehJS")
        print("  --install-js        install only last previously built BokehJS")
    else:
        print("Bokeh is using PACKAGED BokehJS, located in 'bokeh.server.static'")
        print()
        print("No extra Bokeh-specific options are available.")
    print()

# -----------------------------------------------------------------------------
# Other functions used directly by setup.py
# -----------------------------------------------------------------------------

def build_or_install_bokehjs():
    ''' Build a new BokehJS (and install it) or install a previously build
    BokehJS.

    If no options ``--build-js`` or ``--install-js`` are detected, the
    user is prompted for what to do.

    If ``--existing-js`` is detected, then this setup.py is being run from a
    packaged sdist, no action is taken.

    Note that ``-build-js`` is only compatible with the following ``setup.py``
    commands: install, develop, sdist, egg_info, build

    Returns:
        str : one of 'built', 'installed', 'packaged'
            How (or if) BokehJS was installed into the python source tree

    '''

    # This happens when building from inside a published, pre-packaged sdist
    # The --existing-js option is not otherwise documented
    if '--existing-js' in sys.argv:
        sys.argv.remove('--existing-js')
        return "packaged"

    if '--build-js' not in sys.argv and '--install-js' not in sys.argv:
        jsbuild = jsbuild_prompt()

    elif '--build-js' in sys.argv:
        jsbuild = True
        sys.argv.remove('--build-js')

    # must be "--install-js"
    else:
        jsbuild = False
        sys.argv.remove('--install-js')

    jsbuild_ok = ('install', 'develop', 'sdist', 'egg_info', 'build')
    if jsbuild and not any(arg in sys.argv for arg in jsbuild_ok):
        print("Error: Option '--build-js' only valid with 'install', 'develop', 'sdist', or 'build', exiting.")
        sys.exit(1)

    if jsbuild:
        build_js()
        install_js()
        return "built"
    else:
        install_js()
        return "installed"

def conda_rendering():
    return os.getenv("CONDA_BUILD_STATE" ,"junk") == "RENDER"


def check_building_sdist():
    ''' Check for 'sdist' and ensure we always build or install BokehJS when
    packaging

    Source distributions do not ship with BokehJS source code, but must ship
    with a pre-built BokehJS library. This function checks ``sys.argv`` to
    ensure that ``--build-js`` or ``--install-js` is present.

    Returns:
        None

    '''
    if "sdist" in sys.argv:
        if "--install-js" not in sys.argv and "--build-js" not in sys.argv:
            print("Error: Option '--build-js' or '--install-js' must be present with 'sdist', exiting.")
            sys.exit(1)

def fixup_for_packaged():
    ''' If we are installing FROM an sdist, then a pre-built BokehJS is
    already installed in the python source tree.

    The command line options ``--build-js`` or ``--install-js`` are
    removed from ``sys.argv``, with a warning.

    Also adds ``--existing-js`` to ``sys.argv`` to signal that BokehJS is
    already packaged.

    Returns:
        None

    '''
    if exists(join(ROOT, 'PKG-INFO')):
        if "--build-js" in sys.argv or "--install-js" in sys.argv:
            print(SDIST_BUILD_WARNING)
            if "--build-js" in sys.argv:
                sys.argv.remove('--build-js')
            if "--install-js" in sys.argv:
                sys.argv.remove('--install-js')
        if "--existing-js" not in sys.argv:
            sys.argv.append('--existing-js')

# -----------------------------------------------------------------------------
# Helpers for operation in the bokehjs dir
# -----------------------------------------------------------------------------

def jsbuild_prompt():
    ''' Prompt users whether to build a new BokehJS or install an existing one.

    Returns:
        bool : True, if a new build is requested, False otherwise

    '''
    print(BOKEHJS_BUILD_PROMPT)
    mapping = {"1": True, "2": False}
    value = input("Choice? ")  # lgtm [py/use-of-input]
    while value not in mapping:
        print("Input '%s' not understood. Valid choices: 1, 2\n" % value)
        value = input("Choice? ")  # lgtm [py/use-of-input]
    return mapping[value]

# -----------------------------------------------------------------------------
# Helpers for operations in the bokehjs dir
# -----------------------------------------------------------------------------

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
    except Exception as e:
        print(BUILD_SIZE_FAIL_MSG % e)
        sys.exit(1)

def install_js():
    ''' Copy built BokehJS files into the Python source tree.

    Returns:
        None

    '''
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
        shutil.rmtree(target_jsdir)
    shutil.copytree(JS, target_jsdir)

    if exists(target_tslibdir):
        shutil.rmtree(target_tslibdir)
    if exists(TSLIB):
        os.mkdir(target_tslibdir)
        for lib_file in glob(join(TSLIB, "lib.*.d.ts")):
            shutil.copy(lib_file, target_tslibdir)

# -----------------------------------------------------------------------------
# Status and error message strings
# -----------------------------------------------------------------------------

BOKEHJS_BUILD_PROMPT = """
Bokeh includes a JavaScript library (BokehJS) that has its own
build process. How would you like to handle BokehJS:

1) build and install fresh BokehJS
2) install last built BokehJS from bokeh/bokehjs/build
"""

BOKEHJS_INSTALL_FAIL = """
ERROR: Cannot install BokehJS: files missing in `./bokehjs/build`.


Please build BokehJS by running setup.py with the `--build-js` option.
  Dev Guide: https://docs.bokeh.org/en/latest/docs/dev_guide/setup.html.
"""

BUILD_EXEC_FAIL_MSG = bright(red("Failed.")) + """

ERROR: subprocess.Popen(%r) failed to execute:

    %s

Have you run `npm ci` from the bokehjs subdirectory?
For more information, see the Dev Guide:

    https://docs.bokeh.org/en/latest/docs/dev_guide.html
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

SDIST_BUILD_WARNING = """
Source distribution (sdist) packages come with PRE-BUILT BokehJS files.

Building/installing from the bokehjs source directory of sdist packages is
disabled, and the options --build-js and --install-js will be IGNORED.

To build or develop BokehJS yourself, you must clone the full Bokeh GitHub
repository from https://github.com/bokeh/bokeh
"""
