
import os
from os.path import abspath, exists, isdir, join, dirname
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

APP = [join(BOKEHJSREL, 'js', 'bokeh.js'),
       join(BOKEHJSREL, 'js', 'bokeh.min.js')]
CSS = join(BOKEHJSREL, 'css')


if 'devjs' in sys.argv or 'develop' in sys.argv:
    # Don't import setuptools unless the user is actively
    # trying to do something that requires it.
    APP = [join(BOKEHJSBUILD, 'js', 'bokeh.js'),
           join(BOKEHJSBUILD, 'js', 'bokeh.min.js')]
    CSS = join(BOKEHJSBUILD, 'css')

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
package_data_dirs.append('sampledata/elements.csv')
package_data_dirs.append('sampledata/iris.csv')
package_data_dirs.append('sampledata/US Regions State Boundaries.csv.gz')

scripts = []
if sys.platform != 'win32':
    scripts.extend(['bokeh-server'])

import site
site_packages = site.getsitepackages()[0]
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
        print("installing bokeh, removing bokeh.pth if it exists")
    else:
        print("installing bokeh,  bokeh.pth was not found, so we did not clean it")
    
REQUIRES = [
        'Flask==0.10.1',
        'Jinja2==2.7',
        'MarkupSafe==0.18',
        'Werkzeug==0.9.1',
        'argparse==1.2.1',
        'greenlet==0.4.1',
        'itsdangerous==0.21',
        'numpy>=1.7.1',
        'pandas>=0.11.0',
        'python-dateutil==2.1',
        'pytz==2013b',
        'requests==1.2.3',
        'six==1.5.2',
        'wsgiref==0.1.2',
        'pygments==1.6',
        'pystache==0.5.3',
        'markdown==2.3.1',
        'PyYAML==3.10',
        # tests
        'mock==1.0.1',
        'websocket==0.2.1',
        'colorama==0.2.7'
    ]
if sys.version_info[0] != 3:
    REQUIRES.extend([
        'gevent==0.13.8',
        'gevent-websocket==0.3.6',
    ])
if sys.platform != "win32":
    REQUIRES.append('redis==2.7.6')

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
        'bokeh.server.tests',
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
    install_requires = REQUIRES,
)
