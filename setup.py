
import os
from os.path import abspath, isdir
import sys
import shutil
from distutils.core import setup
import versioneer

versioneer.versionfile_source = 'bokeh/_version.py'
versioneer.versionfile_build = 'bokeh/_version.py'
versioneer.tag_prefix = '' # tags are like 1.2.0
versioneer.parentdir_prefix = 'Bokeh-' # dirname like 'myproject-1.2.0'

# Set up this checkout or source archive with the right BokehJS files.

JSBUILD_APP = "jsbuild/application.js"
JSBUILD_NB = "jsbuild/bokehnotebook.js"
DEV_APP = "bokeh/server/static/js/application.js"
DEV_NB = "bokeh/server/static/js/bokehnotebook.js"
if 'develop' in sys.argv:
    # Don't import setuptools unless the user is actively trying to do
    # something that requires it.
    import setuptools

if not os.path.exists(DEV_APP):
    shutil.copy(JSBUILD_APP, DEV_APP)
if not os.path.exists(DEV_NB):
    shutil.copy(JSBUILD_NB, DEV_NB)


if sys.platform == 'win32':
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
package_data_dirs.append('server/redis.conf')

package_data_dirs.append('sampledata/iris.csv')
package_data_dirs.append('sampledata/US Regions State Boundaries.csv.gz')

scripts = []
if sys.platform != 'win32':
    scripts.extend(['bokeh-server','docserver.py'])

setup(
    name = 'bokeh',
    version=versioneer.get_version(),
    cmdclass=versioneer.get_cmdclass(),
    packages = ['bokeh', 'bokeh.chaco_gg', 'bokeh.server',
                'bokeh.server.models', 'bokeh.server.views',
                'bokeh.server.test', 'bokeh.specialmodels',
                'bokeh.sampledata', 'bokeh.vendor',
                'bokeh.tests'],
    package_data = {'bokeh' : package_data_dirs},
    author = 'Continuum Analytics',
    author_email = 'info@continuum.io',
    url = 'http://github.com/ContinuumIO/Bokeh',
    description = 'Statistical and novel interactive HTML plots for Python',
    zip_safe=False,
    license = 'New BSD',
    scripts = scripts,
    install_requires = ['markdown', 'pygments', 'smartypants', 
        'sphinx', 'sphinx_bootstrap_theme']
)
