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

    pip install .

Bokeh also supports the standard "editable" installs for developmnet:

    pip install -e .

It can take a few minutes for BokehJS to build, if you are not making changes
to the BokehJS source code, then you only need to build it once, the first
time. Subsequence invocations can be made to install the previously built
BokehJS from the ``bokehjs`` source subdirectory with the ``install-js``
option, e.g:

    BOKEHJS_ACTION="install" pip install .
'''
from setuptools import find_packages, setup

import versioneer
from _setup_support import INSTALL_REQUIRES, BuildJSCmd, check_python

# bail on unsupported Python versions
check_python()

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
    url='https://github.com/bokeh/bokeh',
    classifiers=open("classifiers.txt").read().strip().split('\n'),

    # details needed by setup
    install_requires=INSTALL_REQUIRES,
    python_requires=">=3.8",
    packages=find_packages(include=["bokeh", "bokeh.*"]),
    include_package_data=True,
    entry_points={'console_scripts': ['bokeh = bokeh.__main__:main']},
    zip_safe=False,
    cmdclass=versioneer.get_cmdclass({"build_ext": BuildJSCmd}),
)
