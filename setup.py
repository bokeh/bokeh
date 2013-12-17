
import os
from os.path import abspath, exists, isdir, join
import sys
import shutil
from distutils.core import setup
import versioneer

versioneer.versionfile_source = 'bokeh/_version.py'
versioneer.versionfile_build = 'bokeh/_version.py'
versioneer.tag_prefix = '' # tags are like 1.2.0
versioneer.parentdir_prefix = 'Bokeh-' # dirname like 'myproject-1.2.0'

# Set up this checkout or source archive with the right BokehJS files.


BOKEHJSROOT = 'bokehjs'
BOKEHJSBUILD = join(BOKEHJSROOT, 'build')
BOKEHJSREL = join(BOKEHJSROOT, 'release')

SERVER = 'bokeh/server'

APP = join(BOKEHJSREL, 'js', 'bokeh.js')
CSS = join(BOKEHJSREL, 'css')

if 'develop' in sys.argv:
    # Don't import setuptools unless the user is actively
    # trying to do something that requires it.
    import setuptools

if 'devjs' in sys.argv:
    # Don't import setuptools unless the user is actively
    # trying to do something that requires it.
    APP = join(BOKEHJSBUILD, 'js', 'bokeh.js')
    CSS = join(BOKEHJSBUILD, 'css')
    sys.argv[sys.argv.index("devjs")] = "develop"
    import setuptools

if exists(join(SERVER, 'static', 'js')):
    shutil.rmtree(join(SERVER, 'static', 'js'))
os.mkdir(join(SERVER, 'static', 'js'))
shutil.copy(APP, join(SERVER, 'static', 'js'))
shutil.copytree(join(BOKEHJSROOT, 'src', 'vendor'), 
                join(SERVER, 'static', 'js', 'vendor'))

if exists(join(SERVER, 'static', 'css')):
    shutil.rmtree(join(SERVER, 'static', 'css'))
shutil.copytree(CSS, join(SERVER, 'static', 'css'))

def package_path(path, package_data_dirs):
    for dirname, _, files in os.walk(path):
        dirname = os.path.relpath(dirname, 'bokeh')
        for f in files:
            package_data_dirs.append(join(dirname, f))

package_data_dirs = []

package_path(join(SERVER, 'static'), package_data_dirs)
package_path(join(SERVER, 'templates'), package_data_dirs)
package_path('bokeh/templates', package_data_dirs)

package_data_dirs.append('server/redis.conf')
package_data_dirs.append('sampledata/iris.csv')
package_data_dirs.append('sampledata/US Regions State Boundaries.csv.gz')

scripts = []
if sys.platform != 'win32':
    scripts.extend(['bokeh-server'])

setup(
    name = 'bokeh',
    version=versioneer.get_version(),
    cmdclass=versioneer.get_cmdclass(),
    packages = [
        'bokeh',
        'bokeh.chaco_gg',
        'bokeh.sampledata',
        'bokeh.server',
        'bokeh.server.models',
        'bokeh.server.views',
        'bokeh.server.test',
        'bokeh.specialmodels',
        'bokeh.tests'
    ],
    package_data = {'bokeh' : package_data_dirs},
    author = 'Continuum Analytics',
    author_email = 'info@continuum.io',
    url = 'http://github.com/ContinuumIO/Bokeh',
    description = 'Statistical and novel interactive HTML plots for Python',
    zip_safe=False,
    license = 'New BSD',
    scripts = scripts,
    install_requires = [
        'markdown',
        'pygments',
        'smartypants',
        'sphinx',
        'sphinx_bootstrap_theme',
    ]
)
