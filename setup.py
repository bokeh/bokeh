# needs to be tested
import sys
if len(sys.argv)>1 and sys.argv[1] == 'develop':
    # Only import setuptools if we have to
    import setuptools

from distutils.core import setup
import os
import sys
__version__ = (0, 0, 1)
import requests
print "downloading compiled javascript from github"
# Compatibility with old Requests package (prior to 0.10.0). Check for .text
# attribute, and lacking that
response = requests.get("http://raw.github.com/ContinuumIO/bokehjs-build/master/application.js")
if hasattr(response, 'text'):
    # New Requests library; .text contains Unicode
    jssource = response.text
else:
    # Old Requests library; .content should be properly encoded
    jssource = response.content
with open("bokeh/server/static/js/application.js", "w+") as f:
    f.write(jssource.encode('UTF-8'))
print "downloading completed"
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

setup(
    name = 'bokeh',
    version = '.'.join([str(x) for x in __version__]),
    packages = ['bokeh', 'bokeh.chaco_gg', 'bokeh.server',
                'bokeh.server.models', 'bokeh.server.views',
                'bokeh.server.test'],
    package_data = {'bokeh' : package_data_dirs},
    author = 'Continuum Analytics',
    author_email = 'info@continuum.io',
    url = 'http://github.com/ContinuumIO/Bokeh',
    description = 'Statistical and novel interactive HTML plots for Python',
    zip_safe=False,
    license = 'New BSD',
)
