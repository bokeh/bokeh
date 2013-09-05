# needs to be tested
import sys
if 'develop' in sys.argv:
    # Only import setuptools if we have to
    import setuptools
else:
    import shutil
    shutil.copy("jsbuild/application.js",
                "bokeh/server/static/js/application.js")
    shutil.copy("jsbuild/bokehnotebook.js",
                "bokeh/server/static/js/bokehnotebook.js")

import os
import shutil
from os.path import abspath, isdir
from distutils.core import setup

if sys.plaform == 'win32':
    bokehjs = abspath('bokeh/server/static/vendor/bokehjs')
    if not isdir(bokehjs):
        os.unlink(bokehjs)
        shutil.copytree(abspath('subtree/bokehjs/static'), bokehjs)

__version__ = (0, 1, 1)
package_data_dirs = []
for dirname, _, files in os.walk('bokeh/server/static', followlinks=True):
    dirname = os.path.relpath(dirname, 'bokeh')
    for f in files:
        package_data_dirs.append(os.path.join(dirname, f))

for dirname, _, files in os.walk('bokeh/server/templates', followlinks=True):
    dirname = os.path.relpath(dirname, 'bokeh')
    for f in files:
        package_data_dirs.append(os.path.join(dirname, f))

for dirname, _, files in os.walk('bokeh/templates', followlinks=True):
    dirname = os.path.relpath(dirname, 'bokeh')
    for f in files:
        package_data_dirs.append(os.path.join(dirname, f))

scripts = []
if sys.platform != 'win32':
    scripts.append('bokeh-server')


setup(
    name = 'bokeh',
    version = '.'.join([str(x) for x in __version__]),
    packages = ['bokeh', 'bokeh.chaco_gg', 'bokeh.server',
                'bokeh.server.models', 'bokeh.server.views',
                'bokeh.server.test', 'bokeh.specialmodels'],
    package_data = {'bokeh' : package_data_dirs},
    author = 'Continuum Analytics',
    author_email = 'info@continuum.io',
    url = 'http://github.com/ContinuumIO/Bokeh',
    description = 'Statistical and novel interactive HTML plots for Python',
    zip_safe=False,
    license = 'New BSD',
    scripts = scripts,
)
