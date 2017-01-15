#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Setup script for Bokeh.

'''
from os.path import join
from shutil import copy
import sys

from setuptools import find_packages, setup

from _setup_support import (build_or_install_bokehjs, develop,
                            fixup_argv_for_sdist, fixup_old_js_args, install,
                            get_cmdclass, get_package_data, get_version,
                            install_js, package_files, package_path,
                            ROOT, SERVER, show_help)

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
]

# handle the compat difference for futures (meta.yaml handles differently)
if sys.version_info[:2] == (2, 7):
    REQUIRES.append('futures >=3.0.3')

fixup_old_js_args()    # handle --build_js and --install_js

fixup_argv_for_sdist() # must build BokehJS when making sdists

jsbuild, jsinstall = build_or_install_bokehjs()

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
    classifiers=open("classifiers.txt").read().split('\n'),

    # details needed by setup
    install_requires=REQUIRES,
    packages=find_packages(),
    package_data=get_package_data(),
    entry_points={'console_scripts': ['bokeh = bokeh.__main__:main',], },
    zip_safe=False,
    cmdclass=get_cmdclass()

)

# report on extra information specific to the bokeh build
if '--help'  in sys.argv: show_help(jsbuild, jsinstall)
if 'develop' in sys.argv: develop(jsbuild, jsinstall)
if 'install' in sys.argv: install(jsbuild, jsinstall)
