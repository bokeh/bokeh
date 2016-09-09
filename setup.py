"""Setup script for Bokeh."""

#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENCE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from __future__ import print_function

# Stdlib imports
import os, platform, re, shutil, site, subprocess, sys, time
from os.path import abspath, dirname, exists, isdir, join, realpath, relpath
from shutil import copy
import sys

if 'install' in sys.argv and sys.platform.startswith('win'):
    # Try use setuptools, so that entry_points is handled, creating a bokeh.exe
    try:
        import setuptools
    except ImportError:
        pass

try:
    import colorama
    def bright(text): return "%s%s%s" % (colorama.Style.BRIGHT, text, colorama.Style.RESET_ALL)
    def dim(text): return "%s%s%s" % (colorama.Style.DIM, text, colorama.Style.RESET_ALL)
    def white(text): return "%s%s%s" % (colorama.Fore.WHITE, text, colorama.Style.RESET_ALL)
    def blue(text): return "%s%s%s" % (colorama.Fore.BLUE, text, colorama.Style.RESET_ALL)
    def red(text): return "%s%s%s" % (colorama.Fore.RED, text, colorama.Style.RESET_ALL)
    def green(text): return "%s%s%s" % (colorama.Fore.GREEN, text, colorama.Style.RESET_ALL)
    def yellow(text): return "%s%s%s" % (colorama.Fore.YELLOW, text, colorama.Style.RESET_ALL)
    sys.platform == "win32" and colorama.init()
except ImportError:
    def bright(text): return text
    def dim(text): return text
    def white(text) : return text
    def blue(text) : return text
    def red(text) : return text
    def green(text) : return text
    def yellow(text) : return text

if 'nightly' in sys.argv:
    from setuptools import setup

    sys.argv.remove('nightly')

    with open('__conda_version__.txt', 'r') as f:
        version = f.read().rstrip()

    vers_file = os.path.join('bokeh', '__conda_version__.py')
    with open(vers_file, 'w') as f:
        f.write("conda_version=" + "'" + version + "'")

else:
    from distutils.core import setup

from distutils import dir_util

# Our own imports
import versioneer

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

ROOT = dirname(realpath(__file__))
BOKEHJSROOT = join(ROOT, 'bokehjs')
BOKEHJSBUILD = join(BOKEHJSROOT, 'build')
CSS = join(BOKEHJSBUILD, 'css')
JS = join(BOKEHJSBUILD, 'js')

SERVER = join(ROOT, 'bokeh/server')

if sys.version_info[0] < 3:
    input = raw_input

# -----------------------------------------------------------------------------
# Local utilities
# -----------------------------------------------------------------------------

versioneer.versionfile_source = 'bokeh/_version.py'
versioneer.versionfile_build = 'bokeh/_version.py'
versioneer.tag_prefix = ''  # tags are like 1.2.0
versioneer.parentdir_prefix = 'Bokeh-'  # dirname like 'myproject-1.2.0'

# -----------------------------------------------------------------------------
# Classes and functions
# -----------------------------------------------------------------------------

copy("LICENSE.txt", "bokeh/")

package_data = ['LICENSE.txt', 'themes/*.yaml']

def package_path(path, filters=()):
    if not os.path.exists(path):
        raise RuntimeError("packaging non-existent path: %s" % path)
    elif os.path.isfile(path):
        package_data.append(relpath(path, 'bokeh'))
    else:
        for path, dirs, files in os.walk(path):
            path = relpath(path, 'bokeh')
            for f in files:
                if not filters or f.endswith(filters):
                    package_data.append(join(path, f))

# You can't install Bokeh in a virtualenv because the lack of getsitepackages()
# This is an open bug: https://github.com/pypa/virtualenv/issues/355
# And this is an intended PR to fix it: https://github.com/pypa/virtualenv/pull/508
# Workaround to fix our issue: https://github.com/bokeh/bokeh/issues/378
def getsitepackages():
    """Returns a list containing all global site-packages directories
    (and possibly site-python)."""

    _is_64bit = (getattr(sys, 'maxsize', None) or getattr(sys, 'maxint')) > 2**32
    _is_pypy = hasattr(sys, 'pypy_version_info')
    _is_jython = sys.platform[:4] == 'java'

    prefixes = [sys.prefix, sys.exec_prefix]

    sitepackages = []
    seen = set()

    for prefix in prefixes:
        if not prefix or prefix in seen:
            continue
        seen.add(prefix)

        if sys.platform in ('os2emx', 'riscos') or _is_jython:
            sitedirs = [os.path.join(prefix, "Lib", "site-packages")]
        elif _is_pypy:
            sitedirs = [os.path.join(prefix, 'site-packages')]
        elif sys.platform == 'darwin' and prefix == sys.prefix:
            if prefix.startswith("/System/Library/Frameworks/"):  # Apple's Python
                sitedirs = [os.path.join("/Library/Python", sys.version[:3], "site-packages"),
                            os.path.join(prefix, "Extras", "lib", "python")]

            else:  # any other Python distros on OSX work this way
                sitedirs = [os.path.join(prefix, "lib",
                            "python" + sys.version[:3], "site-packages")]

        elif os.sep == '/':
            sitedirs = [os.path.join(prefix,
                                     "lib",
                                     "python" + sys.version[:3],
                                     "site-packages"),
                        os.path.join(prefix, "lib", "site-python"),
                        ]
            lib64_dir = os.path.join(prefix, "lib64", "python" + sys.version[:3], "site-packages")
            if (os.path.exists(lib64_dir) and
                os.path.realpath(lib64_dir) not in [os.path.realpath(p) for p in sitedirs]):
                if _is_64bit:
                    sitedirs.insert(0, lib64_dir)
                else:
                    sitedirs.append(lib64_dir)
            try:
                # sys.getobjects only available in --with-pydebug build
                sys.getobjects
                sitedirs.insert(0, os.path.join(sitedirs[0], 'debug'))
            except AttributeError:
                pass
            # Debian-specific dist-packages directories:
            sitedirs.append(os.path.join(prefix, "local/lib",
                                         "python" + sys.version[:3],
                                         "dist-packages"))
            sitedirs.append(os.path.join(prefix, "lib",
                                         "python" + sys.version[:3],
                                         "dist-packages"))
            if sys.version_info[0] >= 3:
                sitedirs.append(os.path.join(prefix, "lib",
                                             "python" + sys.version[0],
                                             "dist-packages"))
            sitedirs.append(os.path.join(prefix, "lib", "dist-python"))
        else:
            sitedirs = [os.path.join(prefix, "lib", "site-packages"), prefix]

        if sys.platform == 'darwin':
            # for framework builds *only* we add the standard Apple
            # locations. Currently only per-user, but /Library and
            # /Network/Library could be added too
            if 'Python.framework' in prefix:
                home = os.environ.get('HOME')
                if home:
                    sitedirs.append(
                        os.path.join(home,
                                     'Library',
                                     'Python',
                                     sys.version[:3],
                                     'site-packages'))
        for sitedir in sitedirs:
            sitepackages.append(os.path.abspath(sitedir))

    sitepackages = [p for p in sitepackages if os.path.isdir(p)]
    return sitepackages


def check_remove_bokeh_install(site_packages):
    old_bokeh_files = []
    for d in os.listdir(site_packages):
        bokeh_path = join(site_packages, d)
        if not (d == 'bokeh' or d.startswith('bokeh-')):
            continue
        old_bokeh_files.append(bokeh_path)

    if len(old_bokeh_files) == 0:
        return

    print("Found old Bokeh files:")
    for path in old_bokeh_files:
        print(" - %s" % path)
    val = input("Remove %s? [y|N] " % ("it" if len(old_bokeh_files)==1 else "them",))
    if val == "y":
        print("Removing old Bokeh files...", end=" ")
        for path in old_bokeh_files:
            try:
                if isdir(path): shutil.rmtree(path)
                else: os.remove(path)
            except (IOError, OSError) as e:
                print(bright(red("\nUnable to remove old Bokeh file at %s, exiting" % path)) + " [reason: %s]" % e)
                sys.exit(-1)
        print("Done")
    else:
        print(bright(red("Old Bokeh files not removed, exiting.")))
        sys.exit(1)


def remove_bokeh_pth(path_file):
    if exists(path_file):
        try:
            os.remove(path_file)
        except (IOError, OSError):
            print(bright(red("Unable to remove old path file at %s, exiting" % path_file)))
            sys.exit(-1)
        return True
    return False

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

def build_js():
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
    target_jsdir = join(SERVER, 'static', 'js')
    target_cssdir = join(SERVER, 'static', 'css')

    STATIC_ASSETS = [
        join(JS, 'bokeh.js'),
        join(JS, 'bokeh.min.js'),
        join(CSS, 'bokeh.css'),
        join(CSS, 'bokeh.min.css'),
    ]
    if not all([exists(a) for a in STATIC_ASSETS]):
        print("""
ERROR: Cannot install BokehJS: files missing in `./bokehjs/build`.


Please build BokehJS by running setup.py with the `--build_js` option.
  Dev Guide: http://bokeh.pydata.org/docs/dev_guide.html#bokehjs.
""")
        sys.exit(1)

    if exists(target_jsdir):
        shutil.rmtree(target_jsdir)
    shutil.copytree(JS, target_jsdir)

    if exists(target_cssdir):
        shutil.rmtree(target_cssdir)
    shutil.copytree(CSS, target_cssdir)


def clean():
    print("Removing prior-built items...", end=" ")

    build_dir = 'build/lib/bokeh'
    if os.path.exists(build_dir):
        dir_util.remove_tree(build_dir)

    for root, dirs, files in os.walk('.'):
        for item in files:
            if item.endswith('.pyc'):
                os.remove(os.path.join(root, item))

    print("Done")


def get_user_jsargs():
    print("""
Bokeh includes a JavaScript library (BokehJS) that has its own
build process. How would you like to handle BokehJS:

1) build and install fresh BokehJS
2) install last built BokehJS from bokeh/bokehjs/build
""")
    mapping = {"1": True, "2": False}
    value = input("Choice? ")
    while value not in mapping:
        print("Input '%s' not understood. Valid choices: 1, 2\n" % value)
        value = input("Choice? ")
    return mapping[value]


def parse_jsargs():
    options = ('install', 'develop', 'sdist', 'egg_info', 'build')
    installing = any(arg in sys.argv for arg in options)

    if '--build_js' in sys.argv:
        if not installing:
            print("Error: Option '--build_js' only valid with 'install', 'develop', 'sdist', or 'build', exiting.")
            sys.exit(1)
        jsbuild = True
        sys.argv.remove('--build_js')

    elif '--install_js' in sys.argv:
        # Note that --install_js can be used by itself (without sdist/install/develop)
        jsbuild = False
        sys.argv.remove('--install_js')

    else:
        if installing:
            jsbuild = get_user_jsargs()
        else:
            jsbuild = False

    return jsbuild


def package_tree(pkgroot):
    """ Get list of packages by walking the directory structure and
    including all dirs that have an __init__.py or are named test.
    """
    subdirs = [os.path.relpath(i[0], ROOT).replace(os.path.sep, '.')
               for i in os.walk(os.path.join(ROOT, pkgroot))
               if '__init__.py' in i[2]]
    return subdirs

# -----------------------------------------------------------------------------
# Main script
# -----------------------------------------------------------------------------

# Aliases for build_js and install_js

for i in range(len(sys.argv)):
    if sys.argv[i] == '--build-js':
        sys.argv[i] = '--build_js'
    if sys.argv[i] == '--install-js':
        sys.argv[i] = '--install_js'

# Set up this checkout or source archive with the right BokehJS files.

if sys.version_info[:2] < (2, 6):
    raise RuntimeError("Bokeh requires python >= 2.6")

# Lightweight command to only install js and nothing more - developer mode
if len(sys.argv) == 2 and sys.argv[-1] == '--install_js':
    install_js()
    sys.exit(0)

# check for 'sdist' and make sure we always do a BokehJS build when packaging
if "sdist" in sys.argv:
    if "--install_js" in sys.argv:
        print("Removing '--install_js' incompatible with 'sdist'")
        sys.argv.remove('--install_js')
    if "--build_js" not in sys.argv:
        print("Adding '--build_js' required for 'sdist'")
        sys.argv.append('--build_js')


# check for package install, set jsinstall to False to skip prompt
jsinstall = True
if not exists(join(ROOT, 'MANIFEST.in')):
    if "--build_js" in sys.argv or "--install_js" in sys.argv:
        print("BokehJS source code is not shipped in sdist packages; "
              "building/installing from the bokehjs source directory is disabled. "
              "To build or develop BokehJS yourself, you must clone the full "
              "Bokeh repository from https://github.com/bokeh/bokeh")
        if "--build_js" in sys.argv:
            sys.argv.remove('--build_js')
        if "--install_js" in sys.argv:
            sys.argv.remove('--install_js')
    jsbuild = False
    jsinstall = False
else:
    jsbuild = parse_jsargs()

if jsbuild:
    build_js()

if jsinstall:
    install_js()

sampledata_suffixes = ('.csv', '.conf', '.gz', '.json', '.png', '.ics', '.geojson')

package_path(join(SERVER, 'static'))
package_path(join(ROOT, 'bokeh', 'core', '_templates'))
package_path(join(ROOT, 'bokeh', 'server', 'views'), ('.html'))
package_path(join(ROOT, 'bokeh', 'sampledata'), sampledata_suffixes)

if '--user' in sys.argv:
    site_packages = site.USER_SITE
else:
    site_packages = getsitepackages()[0]

path_file = join(site_packages, "bokeh.pth")
path = abspath(dirname(__file__))

print()
if 'develop' in sys.argv:
    # Note that setuptools supports 'develop' too, but we roll our own implementation
    # that removes any existing Bokeh installation, and works in virtualenv
    if exists('bokeh/__conda_version__.py'):
        print(bright(red("ERROR:")) + " Detected a __conda_version__.py file, exiting")
        sys.exit(1)
    check_remove_bokeh_install(site_packages)
    with open(path_file, "w+") as f:
        f.write(path)
    print("Installing Bokeh for development:")
    print("  - writing path '%s' to %s" % (path, path_file))
    if jsinstall:
        print("  - using %s built BokehJS from bokehjs/build\n" % (bright(yellow("NEWLY")) if jsbuild else bright(yellow("PREVIOUSLY"))))
    else:
        print("  - using %s BokehJS, located in 'bokeh.server.static'\n" % yellow("PACKAGED"))
    sys.exit()

elif 'clean' in sys.argv:
    clean()

elif 'install' in sys.argv:
    pth_removed = remove_bokeh_pth(path_file)
    print("Installing Bokeh:")
    if pth_removed:
        print("  - removed path file at %s" % path_file)
    if jsinstall:
        print("  - using %s built BokehJS from bokehjs/build\n" % (bright(yellow("NEWLY")) if jsbuild else bright(yellow("PREVIOUSLY"))))
    else:
        print("  - using %s BokehJS, located in 'bokeh.server.static'\n" % bright(yellow("PACKAGED")))

elif '--help' in sys.argv:
    if jsinstall:
        print("Bokeh-specific options available with 'install' or 'develop':")
        print()
        print("  --build_js          build and install a fresh BokehJS")
        print("  --install_js        install only last previously built BokehJS")
    else:
        print("Bokeh is using PACKAGED BokehJS, located in 'bokeh.server.static'")
        print()

print()

REQUIRES = [
        'six>=1.5.2',
        'requests>=1.2.3',
        'PyYAML>=3.10',
        'python-dateutil>=2.1',
        'Jinja2>=2.7',
        'numpy>=1.7.1',
        'tornado>=4.3',
    ]

if sys.version_info[:2] == (2, 7):
    REQUIRES.append('futures>=3.0.3')

_version = versioneer.get_version()
_cmdclass = versioneer.get_cmdclass()

# Horrible hack: workaround to allow creation of bdist_wheel on pip installation
# Why, for God's sake, is pip forcing the generation of wheels when installing a package?

try:
    from wheel.bdist_wheel import bdist_wheel
except ImportError as e:
    # pip is not claiming for bdist_wheel when wheel is not installed
    bdist_wheel = None

if bdist_wheel is not None:
    _cmdclass["bdist_wheel"] = bdist_wheel

# Note on scripts and entry points. The 'scripts' value is handled by
# distutils but does not provide an .exe, making it not very useful on
# Windows. The 'entry_points' value is handled only if setuptools is
# used, and does make an .exe. Note that in our conda recipe, we
# seperately define an entry point.

setup(
    name='bokeh',
    version=_version,
    cmdclass=_cmdclass,
    packages=package_tree('bokeh'),
    package_data={'bokeh': package_data},
    author='Continuum Analytics',
    author_email='info@continuum.io',
    url='http://github.com/bokeh/bokeh',
    description='Statistical and novel interactive HTML plots for Python',
    license='New BSD',
    scripts=['bin/bokeh', 'bin/bokeh-server'],
    entry_points={'console_scripts': ['bokeh = bokeh.__main__:main',], },
    zip_safe=False,
    install_requires=REQUIRES
)
