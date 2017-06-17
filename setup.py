#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Setup script for Bokeh.

Two separate components comprise Bokeh:

* A JavaScript runtime BokehJS that draws and handles events in browsers
* Python "bindings" and an optional server for interacting with BokehJS

The BokehJS library is written in a mixture of CoffeeScript, TypeScript, and
pure JavaScript. This necessitates a "compilation" step to build a complete
BokehJS from these sources, and this fact makes the Bokeh setup and install
more complicated than typical pure Python projects.

In order to build BokehJS, the first step is to make sure that the "npm"
command is installed. If you are using conda, you can typically just run

    conda install -c bokeh nodejs

Othewise, you can find general instructions for installing NodeJS here:

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
BokehJS from the ``bokehjs`` source subdirectoruy with the ``--install-js``
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
from os.path import join
from shutil import copy
import sys

from setuptools import find_packages, setup

from _setup_support import (build_or_install_bokehjs, fixup_building_sdist,
                            fixup_for_packaged, fixup_old_jsargs, get_cmdclass,
                            get_package_data, get_version, install_js,
                            package_files, package_path, ROOT, SERVER,
                            show_bokehjs, show_help)

# immediately bail for ancient pythons
if sys.version_info[:2] < (2, 7):
    raise RuntimeError("Bokeh requires python >= 2.7")

# immediately handle lightweight "python setup.py --install-js"
if len(sys.argv) == 2 and sys.argv[-1] == '--install-js':
    install_js()
    sys.exit()

# we want to have the license at the top level of the GitHub repo, but setup
# can't include it from there, so copy it to the package directory first thing
copy("LICENSE.txt", "bokeh/")

# state our runtime deps here, also used by meta.yaml (so KEEP the spaces)
REQUIRES = [
    'six >=1.5.2',
    'requests >=1.2.3',
    'PyYAML >=3.10',
    'python-dateutil >=2.1',
    'Jinja2 >=2.7',
    'numpy >=1.7.1',
    'tornado >=4.3',

    # this will be removed when Bokeh hits 1.0
    'bkcharts >=0.2',
]

# handle the compat difference for futures (meta.yaml handles differently)
if sys.version_info[:2] == (2, 7):
    REQUIRES.append('futures >=3.0.3')

# if this is just conda-build skimming information, skip all this actual work
if "conda-build" not in sys.argv[0]:
    fixup_old_jsargs()     # handle --build_js and --install_js
    fixup_for_packaged()   # --build_js and --install_js not valid FROM sdist
    fixup_building_sdist() # must build BokehJS when MAKING sdists

    bokehjs_action = build_or_install_bokehjs()

# configuration to include all the special or non-python files in the package
# directory that need to also be installed or included in a build
sampledata_pats = ('.csv', '.conf', '.gz', '.json', '.png', '.ics', '.geojson')
package_path(join(SERVER, 'static'))
package_path(join(ROOT, 'bokeh', 'core', '_templates'))
package_path(join(ROOT, 'bokeh', 'sphinxext', '_templates'))
package_path(join(ROOT, 'bokeh', 'server', 'views'), ('.html'))
package_path(join(ROOT, 'bokeh', 'sampledata'), sampledata_pats)
package_files('LICENSE.txt', 'themes/*.yaml')

setup(

    # basic package metadata
    name='bokeh',
    version=get_version(),
    description='Interactive plots and applications in the browser from Python',
    license='New BSD',
    author='Continuum Analytics',
    author_email='info@continuum.io',
    url='http://github.com/bokeh/bokeh',
    classifiers=open("classifiers.txt").read().strip().split('\n'),

    # details needed by setup
    install_requires=REQUIRES,
    packages=find_packages(exclude=["scripts*", "tests*"]),
    package_data=get_package_data(),
    entry_points={'console_scripts': ['bokeh = bokeh.__main__:main',], },
    zip_safe=False,
    cmdclass=get_cmdclass()

)

# if this is just conda-build skimming information, skip all this actual work
if "conda-build" not in sys.argv[0]:
    if '--help'  in sys.argv: show_help(bokehjs_action)
    if 'develop' in sys.argv: show_bokehjs(bokehjs_action, develop=True)
    if 'install' in sys.argv: show_bokehjs(bokehjs_action)
