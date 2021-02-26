#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Setup script for Bokeh.

Two separate components comprise Bokeh:

* A JavaScript runtime BokehJS that draws and handles events in browsers
* Python "bindings" and an optional server for interacting with BokehJS

The BokehJS library is written in a mixture of TypeScript and pure JavaScript.
This necessitates a "compilation" step to build a complete BokehJS from these
sources, and this fact makes the Bokeh setup and install more complicated than
typical pure Python projects.

In order to build BokehJS, the first step is to make sure that the "npm"
command is installed. If you are using conda, you can typically just run

    conda install -c conda-forge nodejs

Otherwise, you can find general instructions for installing NodeJS here:

    https://nodejs.org/en/download/

Once you have "npm" installed, this script can be used to build BokehJS
from the ``bokehjs`` source subdirectory, and install Bokeh into the python
source package by issuing the command:

    python setup.py install --build-js

The script also supports the standard "develop" mode that setuptools offers:

    python setup.py develop --build-js

It can take a few minutes for BokehJS to build, if you are not making changes
to the BokehJS source code, then you only need to build it once, the first
time. Subsequence invocations can be made to install the previously built
BokehJS from the ``bokehjs`` source subdirectory with the ``--install-js``
option, e.g:

    python setup.py develop --install-js

It is also possible to build BokehJS "by hand" under the ``bokehjs`` source
subdirectory. In this case, to simply install the build BokehJS quickly into
the python source tree, the following command may be issued:

    python setup.py --install-js

This will copy BokehJS from the ``bokehjs`` source directory, into the python
package directory, and perform no other actions.

Note that source distributions (sdists) are published with a pre-built BokehJS
included inside the python package, and do not include the ``bokehjs`` source.
The ``--build-js`` and ``-install-js`` options are not valid when running from
an sdist. They will be ignored, and warning printed.

'''
import sys
from shutil import copy

from setuptools import find_packages, setup

import versioneer

from _setup_support import ( # isort:skip
    build_or_install_bokehjs, check_building_sdist, conda_rendering,
    fixup_for_packaged, install_js, show_bokehjs, show_help,
)

# immediately bail on unsupported Python versions
if sys.version_info[:2] < (3, 7):
    raise RuntimeError("Bokeh requires python >= 3.7")

# we want to have the license at the top level of the GitHub repo, but setup
# can't include it from there, so copy it to the package directory first thing
copy("LICENSE.txt", "bokeh/")

# immediately handle lightweight "python setup.py --install-js"
if len(sys.argv) == 2 and sys.argv[-1] == '--install-js':
    install_js()
    sys.exit()

# state our runtime deps here, also used by meta.yaml (so KEEP the spaces)
REQUIRES = [
    'PyYAML >=3.10',
    'python-dateutil >=2.1',
    'Jinja2 >=2.7',
    'numpy >=1.11.3',
    'pillow >=7.1.0',
    'packaging >=16.8',
    'tornado >=5.1',
    'typing_extensions >=3.7.4',
]

# if this is just conda-build skimming information, skip all this actual work
if not conda_rendering():
    fixup_for_packaged()   # --build_js and --install_js not valid FROM sdist
    check_building_sdist() # must build or install BokehJS when MAKING sdists

    bokehjs_action = build_or_install_bokehjs()

setup(
    # basic package metadata
    name='bokeh',
    version=versioneer.get_version(),
    description='Interactive plots and applications in the browser from Python',
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    license='BSD-3-Clause',
    author='Bokeh Team',
    author_email='info@bokeh.org',
    url='http://github.com/bokeh/bokeh',
    classifiers=open("classifiers.txt").read().strip().split('\n'),

    # details needed by setup
    install_requires=REQUIRES,
    python_requires=">=3.7",
    packages=find_packages(include=["bokeh", "bokeh.*"]),
    include_package_data=True,
    entry_points={'console_scripts': ['bokeh = bokeh.__main__:main']},
    zip_safe=False,
    cmdclass=versioneer.get_cmdclass(),
)

# if this is just conda-build skimming information, skip all this actual work
if not conda_rendering():
    if '--help'  in sys.argv: show_help(bokehjs_action)
    if 'develop' in sys.argv: show_bokehjs(bokehjs_action, develop=True)
    if 'install' in sys.argv: show_bokehjs(bokehjs_action)
