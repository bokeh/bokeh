'''

'''
from __future__ import print_function

import shutil
from os.path import dirname, exists, isdir, join, realpath, relpath
import os, re, subprocess, sys, time

import versioneer

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

# some functions prompt for user input, handle input vs raw_input (py2 vs py3)
if sys.version_info[0] < 3:
    input = raw_input # NOQA

# -----------------------------------------------------------------------------
# Module global variables
# -----------------------------------------------------------------------------

ROOT = dirname(realpath(__file__))
BOKEHJSROOT = join(ROOT, 'bokehjs')
BOKEHJSBUILD = join(BOKEHJSROOT, 'build')
CSS = join(BOKEHJSBUILD, 'css')
JS = join(BOKEHJSBUILD, 'js')
SERVER = join(ROOT, 'bokeh/server')

# -----------------------------------------------------------------------------
# Helpers for command line operations
# -----------------------------------------------------------------------------

def develop(jsbuild, jsinstall):
    '''

    '''
    print()
    print("Installed Bokeh for development:")
    if jsinstall:
        print("  - using %s built BokehJS from bokehjs/build\n" % (bright(yellow("NEWLY")) if jsbuild else bright(yellow("PREVIOUSLY"))))
    else:
        print("  - using %s BokehJS, located in 'bokeh.server.static'\n" % yellow("PACKAGED"))
    print()
    sys.exit()

def install(jsbuild, jsinstall):
    '''

    '''
    print()
    print("Installed Bokeh:")
    if jsinstall:
        print("  - using %s built BokehJS from bokehjs/build\n" % (bright(yellow("NEWLY")) if jsbuild else bright(yellow("PREVIOUSLY"))))
    else:
        print("  - using %s BokehJS, located in 'bokeh.server.static'\n" % bright(yellow("PACKAGED")))
    print()

def show_help(jsbuild, jsinstall):
    '''

    '''
    print()
    if jsinstall:
        print("Bokeh-specific options available with 'install' or 'develop':")
        print()
        print("  --build-js          build and install a fresh BokehJS")
        print("  --install-js        install only last previously built BokehJS")
    else:
        print("Bokeh is using PACKAGED BokehJS, located in 'bokeh.server.static'")
        print()
    print()

# -----------------------------------------------------------------------------
# Other functions used directly by setup.py
# -----------------------------------------------------------------------------

def build_or_install_bokehjs():
    '''

    '''
    # check for package install, set jsinstall to False to skip prompt
    if not exists(join(ROOT, 'MANIFEST.in')):
        if "--build-js" in sys.argv or "--install-js" in sys.argv:
            print(SDIST_BUILD_WARNING)
            if "--build-js" in sys.argv:
                sys.argv.remove('--build-js')
            if "--install-js" in sys.argv:
                sys.argv.remove('--install-js')
        jsbuild = False
        jsinstall = False
    else:
        jsinstall, jsbuild = parse_jsargs()

    if jsbuild:
        build_js()

    if jsinstall:
        install_js()

    return jsbuild, jsinstall

def fixup_argv_for_sdist():
    ''' Check for 'sdist' and ensure we always build BokehJS when packaging

    Source distributions do not ship with BokehJS source code, but must ship
    with a pre-built BokehJS library. This function modifies ``sys.argv`` as
    necessary so that ``--build-js`` IS present, and ``--install-js` is NOT.

    '''
    if "sdist" in sys.argv:
        if "--install-js" in sys.argv:
            print("Removing '--install-js' incompatible with 'sdist'")
            sys.argv.remove('--install-js')
        if "--build-js" not in sys.argv:
            print("Adding '--build-js' required for 'sdist'")
            sys.argv.append('--build-js')

def fixup_old_js_args():
    ''' Fixup (and warn about) old style command line options with underscores.

    This function modifies ``sys.argv`` to make the replacements:

    * ``--build_js`` to --build-js
    * ``--install_js`` to --install-js

    and prints a warning about their deprecation.

    '''
    for i in range(len(sys.argv)):

        if sys.argv[i] == '--build_js':
            print("WARNING: --build_js (with underscore) is deprecated, use --build-js")
            sys.argv[i] = '--build-js'

        if sys.argv[i] == '--install_js':
            print("WARNING: --install_js (with underscore) is deprecated, use --install-js")
            sys.argv[i] = '--install-js'

# Horrible hack: workaround to allow creation of bdist_wheel on pip
# installation. Why, for God's sake, is pip forcing the generation of wheels
# when installing a package?
def get_cmdclass():
    ''' Work around a setuptools deficiency.

    There is no need to build wheels when installing a package, however some
    versions of setuptools seem to mandate this. This is a hacky workaround
    that modifies the ``cmdclass`` returned by versioneer so that not having
    wheel installed is not a fatal error.

    '''
    cmdclass = versioneer.get_cmdclass()

    try:
        from wheel.bdist_wheel import bdist_wheel
    except ImportError:
        # pip is not claiming for bdist_wheel when wheel is not installed
        bdist_wheel = None

    if bdist_wheel is not None:
        cmdclass["bdist_wheel"] = bdist_wheel

    return cmdclass

def get_package_data():
    '''

    '''
    return { 'bokeh': _PACKAGE_DATA }

def get_version():
    '''

    '''
    return versioneer.get_version()

# -----------------------------------------------------------------------------
# Helpers for operation in the bokehjs dir
# -----------------------------------------------------------------------------

def jsbuild_prompt():
    '''

    '''
    print(BOKEHJS_BUILD_PROMPT)
    mapping = {"1": True, "2": False}
    value = input("Choice? ")
    while value not in mapping:
        print("Input '%s' not understood. Valid choices: 1, 2\n" % value)
        value = input("Choice? ")
    return mapping[value]

def parse_jsargs():
    '''

    '''
    options = ('install', 'develop', 'sdist', 'egg_info', 'build')
    installing = any(arg in sys.argv for arg in options)

    if '--build-js' in sys.argv:
        if not installing:
            print("Error: Option '--build-js' only valid with 'install', 'develop', 'sdist', or 'build', exiting.")
            sys.exit(1)
        sys.argv.remove('--build-js')
        return installing, True

    elif '--install-js' in sys.argv:
        sys.argv.remove('--install-js')
        return installing, False

    else:
        return installing, installing and jsbuild_prompt()

# -----------------------------------------------------------------------------
# Helpers for operations in the bokehjs dir
# -----------------------------------------------------------------------------

def build_js():
    '''

    '''
    print("Building BokehJS... ", end="")
    sys.stdout.flush()
    os.chdir('bokehjs')

    if sys.platform != "win32":
        cmd = [join('node_modules', '.bin', 'gulp'), 'build']
    else:
        cmd = [join('node_modules', '.bin', 'gulp.cmd'), 'build']

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
        outmsg = "\n".join(["    " + x for x in outmsg.split("\n")])
        errmsg = proc.stderr.read().decode('ascii', errors='ignore')
        errmsg = "\n".join(["    " + x for x in errmsg.split("\n")])
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
    msg = "\n".join(["    " + x for x in msg.split("\n")])
    print(BUILD_SUCCESS_MSG % indented_msg)
    print("Build time: %s" % bright(yellow("%0.1f seconds" % (t1-t0))))
    print()
    print("Build artifact sizes:")
    try:
        def size(*path):
            return os.stat(join("bokehjs", "build", *path)).st_size / 2**10

        print("  - bokeh.js              : %6.1f KB" % size("js", "bokeh.js"))
        print("  - bokeh.css             : %6.1f KB" % size("css", "bokeh.css"))
        print("  - bokeh.min.js          : %6.1f KB" % size("js", "bokeh.min.js"))
        print("  - bokeh.min.css         : %6.1f KB" % size("css", "bokeh.min.css"))

        print("  - bokeh-widgets.js      : %6.1f KB" % size("js", "bokeh-widgets.js"))
        print("  - bokeh-widgets.css     : %6.1f KB" % size("css", "bokeh-widgets.css"))
        print("  - bokeh-widgets.min.js  : %6.1f KB" % size("js", "bokeh-widgets.min.js"))
        print("  - bokeh-widgets.min.css : %6.1f KB" % size("css", "bokeh-widgets.min.css"))

        print("  - bokeh-api.js          : %6.1f KB" % size("js", "bokeh-api.js"))
        print("  - bokeh-api.min.js      : %6.1f KB" % size("js", "bokeh-api.min.js"))
    except Exception as e:
        print(BUILD_SIZE_FAIL_MSG % e)

def install_js():
    '''

    '''
    target_jsdir = join(SERVER, 'static', 'js')
    target_cssdir = join(SERVER, 'static', 'css')

    STATIC_ASSETS = [
        join(JS,  'bokeh.js'),
        join(JS,  'bokeh.min.js'),
        join(CSS, 'bokeh.css'),
        join(CSS, 'bokeh.min.css'),
    ]
    if not all([exists(a) for a in STATIC_ASSETS]):
        print(BOKEHJS_INSTALL_FAIL)
        sys.exit(1)

    if exists(target_jsdir):
        shutil.rmtree(target_jsdir)
    shutil.copytree(JS, target_jsdir)

    if exists(target_cssdir):
        shutil.rmtree(target_cssdir)
    shutil.copytree(CSS, target_cssdir)

# -----------------------------------------------------------------------------
# Helpers for collecting package data
# -----------------------------------------------------------------------------

_PACKAGE_DATA = []

def package_files(*paths):
    '''

    '''
    _PACKAGE_DATA.extend(paths)

def package_path(path, filters=()):
    '''

    '''
    if not os.path.exists(path):
        raise RuntimeError("packaging non-existent path: %s" % path)
    elif os.path.isfile(path):
        _PACKAGE_DATA.append(relpath(path, 'bokeh'))
    else:
        for path, dirs, files in os.walk(path):
            path = relpath(path, 'bokeh')
            for f in files:
                if not filters or f.endswith(filters):
                    _PACKAGE_DATA.append(join(path, f))

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
  Dev Guide: http://bokeh.pydata.org/docs/dev_guide.html#bokehjs.
"""

BUILD_EXEC_FAIL_MSG = bright(red("Failed.")) + """

ERROR: subprocess.Popen(%r) failed to execute:

    %s

Have you run `npm install` from the bokehjs subdirectory?
For more information, see the Dev Guide:

    http://bokeh.pydata.org/en/latest/docs/dev_guide.html
"""

BUILD_FAIL_MSG = bright(red("Failed.")) + """

ERROR: 'gulp build' returned the following

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
