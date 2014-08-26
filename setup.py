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
import os
import platform
import shutil
import site
import subprocess
import sys

using_setuptools = False

if 'nightly' in sys.argv:
    from setuptools import setup
    using_setuptools = True
    sys.argv.remove('nightly')

    with open('__conda_version__.txt','r') as f:
        version = f.read().rstrip()

    vers_file = os.path.join('bokeh','__conda_version__.py')
    with open(vers_file,'w') as f:
        f.write("conda_version="+"'"+version+"'")

else:
    from distutils.core import setup

from distutils import dir_util
from os.path import abspath, relpath, exists, join, dirname, isdir

# Our own imports
import versioneer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

BOKEHJSROOT = 'bokehjs'
BOKEHJSBUILD = join(BOKEHJSROOT, 'build')
CSS = join(BOKEHJSBUILD, 'css')
JS  = join(BOKEHJSBUILD, 'js')

SERVER = 'bokeh/server'

if sys.version_info[0] < 3:
    input = raw_input

#-----------------------------------------------------------------------------
# Local utilities
#-----------------------------------------------------------------------------

versioneer.versionfile_source = 'bokeh/_version.py'
versioneer.versionfile_build = 'bokeh/_version.py'
versioneer.tag_prefix = ''  # tags are like 1.2.0
versioneer.parentdir_prefix = 'Bokeh-'  # dirname like 'myproject-1.2.0'

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

package_data = []

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
# Workaround to fix our issue: https://github.com/ContinuumIO/bokeh/issues/378

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
            if prefix.startswith("/System/Library/Frameworks/"): # Apple's Python
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
                        os.path.join(prefix, "python" + sys.version[:3], "lib-dynload")]
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
            if sys.version[0] == '2':
                sitedirs.append(os.path.join(prefix, "lib",
                                             "python" + sys.version[:3],
                                             "dist-packages"))
            else:
                sitedirs.append(os.path.join(prefix, "lib",
                                             "python" + sys.version[0],
                                             "dist-packages"))
            sitedirs.append(os.path.join(prefix, "local/lib",
                                         "python" + sys.version[:3],
                                         "dist-packages"))
            sitedirs.append(os.path.join(prefix, "lib", "dist-python"))
        else:
            sitedirs = [prefix, os.path.join(prefix, "lib", "site-packages")]
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
    return sitepackages

def check_remove_bokeh_install(site_packages):
    bokeh_path = join(site_packages, "bokeh")
    if not (exists(bokeh_path) and isdir(bokeh_path)):
        return
    prompt = "Found existing bokeh install: %s\nRemove it? [y|N] " % bokeh_path
    val = input(prompt)
    if val == "y":
        print ("Removing old bokeh install...", end=" ")
        try:
            shutil.rmtree(bokeh_path)
            print ("Done")
        except (IOError, OSError):
            print ("Unable to remove old bokeh at %s, exiting" % bokeh_path)
            sys.exit(-1)
    else:
        print ("Not removing old bokeh install")

def remove_bokeh_pth(path_file):
    if exists(path_file):
        try:
            os.remove(path_file)
        except (IOError, OSError):
            print ("Unable to remove old path file at %s, exiting" % path_file)
            sys.exit(-1)
        return True
    return False

def build_js():
    print("Building BokehJS...")
    os.chdir('bokehjs')

    cmd = [join('node_modules', '.bin', 'grunt'), 'deploy']

    try:
        proc = subprocess.Popen(cmd)
    except OSError:
        print("Failed to run: %s. Did you run `npm install` before?" % " ".join(cmd))
        sys.exit(1)
    finally:
        os.chdir('..')

    if proc.wait() != 0:
        print("ERROR: could not build bokehjs")
        sys.exit(1)

def install_js():
    target_jsdir = join(SERVER, 'static', 'js')
    target_cssdir = join(SERVER, 'static', 'css')

    if ( not exists(join(JS, 'bokeh.js')) or
         not exists(join(JS, 'bokeh.min.js')) or
         not exists(join(CSS, 'bokeh.css')) or
         not exists(join(CSS, 'bokeh.min.css'))):
        print("ERROR: Cannot install BokehJS, files missing in bokehjs/build. Need to run at least once with --build_js?")
        sys.exit(1)

    if exists(target_jsdir):
        shutil.rmtree(target_jsdir)
    shutil.copytree(JS, target_jsdir)

    if exists(target_cssdir):
        shutil.rmtree(target_cssdir)
    shutil.copytree(CSS, target_cssdir)

def clean():
    print("Removing prior-built items...", end=" ")
    dir_util.remove_tree('build/lib/bokeh')
    print("Done")

def get_user_jsargs():
    print("""
Bokeh includes a JavaScript library (BokehJS) that has its own
build process. How would you like to handle BokehJS:

1) build and install fresh BokehJS
2) install last built BokehJS
""")
    mapping = {"1": True, "2": False}
    value = input("Choice? ")
    while value not in mapping:
        print("Input '%s' not understood. Valid choices: 1, 2\n" % value)
        value = input("Choice? ")
    return mapping[value]

def parse_jsargs():
    installing = 'install' in sys.argv or 'develop' in sys.argv

    if '--build_js' in sys.argv:
        if not installing:
            print("Error: Option '--build_js' only valid with 'install' or 'develop', exiting.")
            sys.exit(1)
        jsbuild = True
        sys.argv.remove('--build_js')

    elif '--install_js' in sys.argv:
        if not installing:
            print("Error: Option '--install_js' only valid with 'install' or 'develop', exiting.")
            sys.exit(1)
        jsbuild = False
        sys.argv.remove('--install_js')

    else:
        if installing:
            jsbuild = get_user_jsargs()
        else:
            jsbuild = False

    return jsbuild

#-----------------------------------------------------------------------------
# Main script
#-----------------------------------------------------------------------------

# Set up this checkout or source archive with the right BokehJS files.

if sys.version_info[:2] < (2, 6):
    raise RuntimeError("Bokeh requires python >= 2.6")

jsbuild = parse_jsargs()

if jsbuild:
    build_js()

install_js()

sampledata_suffixes = ('.csv', '.conf', '.gz', '.json', '.png')

package_path(join(SERVER, 'static'))
package_path(join(SERVER, 'templates'))
package_path(join('bokeh', '_templates'))
package_path(join('bokeh', 'sampledata'), sampledata_suffixes)
package_path(join('bokeh', 'server', 'redis.conf'))

scripts = ['bokeh-server', 'websocket_worker.py']

if '--user' in sys.argv:
    site_packages = site.USER_SITE
else:
    site_packages = getsitepackages()[0]

path_file = join(site_packages, "bokeh.pth")
path = abspath(dirname(__file__))

print()
if 'develop' in sys.argv:
    check_remove_bokeh_install(site_packages)
    with open(path_file, "w+") as f:
        f.write(path)
    print("Installing Bokeh for development:")
    print("  - writing path '%s' to %s" % (path, path_file))
    print("  - using %s built bokehjs from bokehjs/build\n" % ("NEWLY" if jsbuild else "PREVIOUSLY"))
    sys.exit()

elif 'clean' in sys.argv:
    clean()

elif 'install' in sys.argv:
    pth_removed = remove_bokeh_pth(path_file)
    print("Installing Bokeh:")
    if pth_removed:
        print("  - removed path file at %s" % path_file)
    print("  - using %s built bokehjs from bokehjs/build\n" % ("NEWLY" if jsbuild else "PREVIOUSLY"))

elif '--help' in sys.argv:
    print("Bokeh-specific options available with 'install' or 'develop':\n")
    print("  --build_js          build and install a fresh BokehJS")
    print("  --install_js        install only last previously built BokehJS")

print()

REQUIRES = [
        'Flask>=0.10.1',
        'Jinja2>=2.7',
        'MarkupSafe>=0.18',
        'Werkzeug>=0.9.1',
        'greenlet>=0.4.1',
        'itsdangerous>=0.21',
        'python-dateutil>=2.1',
        'pytz==2013b',
        'requests>=1.2.3',
        'six>=1.5.2',
        'pygments>=1.6',
        'pystache>=0.5.3',
        'markdown>=2.3.1',
        'PyYAML>=3.10',
        # tests
        'nose>=1.3.0',
        'mock>=1.0.1',
        'colorama>=0.2.7'
    ]

if sys.version_info[:2] == (2, 6):
    REQUIRES.append('argparse>=1.1')

if sys.version_info[0] != 3 and platform.python_implementation() != "PyPy":
    REQUIRES.extend([
        'websocket>=0.2.1',
        'gevent>=1.0',
        'gevent-websocket>=0.9.2',
    ])

if sys.platform != "win32":
    REQUIRES.append('redis>=2.7.6')

if platform.python_implementation() != "PyPy":
    # You need to install PyPy's fork of NumPy to make it work:
    # pip install git+https://bitbucket.org/pypy/numpy.git
    # Also pandas is not yet working with PyPy .
    REQUIRES.extend([
        'numpy>=1.7.1',
        'pandas>=0.11.0'
    ])

#need to create throw away class for cmdclass call in setup
from distutils.command.build_py import build_py as _build_py
class build_py(_build_py):
    pass

if 'BOKEH_DEV_VERSION' in os.environ:
    _version = os.environ['BOKEH_DEV_VERSION']
    _cmdclass = {'build_py': build_py}
else:
    _version = versioneer.get_version()
    _cmdclass = versioneer.get_cmdclass()

extra_kw = {}
if using_setuptools:
    extra_kw = dict(zip_safe=False, install_requires=REQUIRES)

setup(
    name='bokeh',
    version=_version,
    cmdclass=_cmdclass,
    packages=[
        'bokeh',
        'bokeh.charts',
        'bokeh.crossfilter',
        'bokeh.mplexporter',
        'bokeh.mplexporter.renderers',
        'bokeh.sampledata',
        'bokeh.server',
        'bokeh.server.models',
        'bokeh.server.views',
        'bokeh.server.utils',
        'bokeh.server.tests',
        'bokeh.tests',
        'bokeh.transforms'
    ],
    package_data={'bokeh': package_data},
    author='Continuum Analytics',
    author_email='info@continuum.io',
    url='http://github.com/ContinuumIO/Bokeh',
    description='Statistical and novel interactive HTML plots for Python',
    license='New BSD',
    scripts=scripts,
    **extra_kw
)
