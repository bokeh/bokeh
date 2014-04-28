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
from distutils.core import setup
from os.path import abspath, exists, join, dirname

# Our own imports
import versioneer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

BOKEHJSROOT = 'bokehjs'
BOKEHJSBUILD = join(BOKEHJSROOT, 'build')
BOKEHJSREL = join(BOKEHJSROOT, 'release')

SERVER = 'bokeh/server'

APP = [join(BOKEHJSREL, 'js', 'bokeh.js'),
       join(BOKEHJSREL, 'js', 'bokeh.min.js')]
CSS = join(BOKEHJSREL, 'css')

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


def package_path(path, package_data_dirs):
    for dirname, _, files in os.walk(path):
        dirname = os.path.relpath(dirname, 'bokeh')
        for f in files:
            package_data_dirs.append(join(dirname, f))


def get_sample_data():
    """Scan sampledata for files with the above extensions and add to
    pkg_data_dirs."""
    data_files = []
    root = join("bokeh", "sampledata")
    for path, dirs, files in os.walk(root):
        for fs in files:
            if fs.endswith(suffix_list):
                data_files.append(join("sampledata", fs))
    return data_files

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

#-----------------------------------------------------------------------------
# Main script
#-----------------------------------------------------------------------------

# Set up this checkout or source archive with the right BokehJS files.

if sys.version_info[:2] < (2, 6):
    raise RuntimeError("Bokeh requires python >= 2.6")

# TODO (bev) remove 'devjs' in 0.5
if 'devjs' in sys.argv:
    print("WARNING: 'devjs' is deprecated and will be removed in Bokeh 0.5, please use 'develop'")
    sys.argv.remove("devjs")
    sys.argv.append("develop")

# TODO (bev) remove '--deploy' in 0.5
if '--deploy' in sys.argv:
    print("WARNING: '--deploy' is deprecated and will be removed in Bokeh 0.5, please use '--build_js'")
    sys.argv.remove("--deploy")
    sys.argv.append("--build_js")

if 'develop' in sys.argv:
    APP = [join(BOKEHJSBUILD, 'js', 'bokeh.js'),
           join(BOKEHJSBUILD, 'js', 'bokeh.min.js')]
    CSS = join(BOKEHJSBUILD, 'css')

if '--build_js' in sys.argv:
    os.chdir('bokehjs')
    try:
        print("deploying bokehjs...")
        out = subprocess.check_output(['grunt', 'deploy'])
        sys.argv.remove('--build_js')
    except subprocess.CalledProcessError:
        print("ERROR: could not deploy bokehjs")
        sys.exit(1)
    os.chdir('..')

if exists(join(SERVER, 'static', 'js')):
    shutil.rmtree(join(SERVER, 'static', 'js'))
os.mkdir(join(SERVER, 'static', 'js'))

for app in APP:
    shutil.copy(app, join(SERVER, 'static', 'js'))
shutil.copytree(join(BOKEHJSROOT, 'src', 'vendor'),
                join(SERVER, 'static', 'js', 'vendor'))

if exists(join(SERVER, 'static', 'css')):
    shutil.rmtree(join(SERVER, 'static', 'css'))
shutil.copytree(CSS, join(SERVER, 'static', 'css'))

package_data_dirs = []
package_path(join(SERVER, 'static'), package_data_dirs)
package_path(join(SERVER, 'templates'), package_data_dirs)
package_path('bokeh/templates', package_data_dirs)
package_data_dirs.append('server/redis.conf')

suffix_list = ('.csv', '.conf', '.gz', '.json')

package_data_dirs = package_data_dirs + get_sample_data()

scripts = ['bokeh-server']

if '--user' in sys.argv:
    site_packages = site.USER_SITE
else:
    site_packages = getsitepackages()[0]

path_file = join(site_packages, "bokeh.pth")
path = abspath(dirname(__file__))

if 'devjs' in sys.argv or 'develop' in sys.argv:
    with open(path_file, "w+") as f:
        f.write(path)
    print("develop mode, wrote path (%s) to (%s)" % (path, path_file))
    sys.exit()
elif 'install' in sys.argv:
    if exists(path_file):
        os.remove(path_file)
        print("Installing bokeh, removing bokeh.pth if it exists.")
    else:
        print("Installing bokeh...")

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

setup(
    name='bokeh',
    version=versioneer.get_version(),
    cmdclass=versioneer.get_cmdclass(),
    packages=[
        'bokeh',
        'bokeh.chaco_gg',
        'bokeh.sampledata',
        'bokeh.server',
        'bokeh.session',
        'bokeh.server.models',
        'bokeh.server.views',
        'bokeh.server.tests',
        'bokeh.tests',
        'bokeh.transforms'
    ],
    package_data={'bokeh': package_data_dirs},
    author='Continuum Analytics',
    author_email='info@continuum.io',
    url='http://github.com/ContinuumIO/Bokeh',
    description='Statistical and novel interactive HTML plots for Python',
    zip_safe=False,
    license='New BSD',
    scripts=scripts,
    install_requires=REQUIRES,
)
