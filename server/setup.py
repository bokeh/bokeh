import os

from io import StringIO

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))

def safeopen(fn):
    try:
        return open(fn)
    except IOError:
        return StringIO()

with safeopen(os.path.join(here, 'README.txt')) as f:
    README = f.read()
with safeopen(os.path.join(here, 'CHANGES.txt')) as f:
    CHANGES = f.read()

setup(name='bokeh_server',
      version='0.0',
      description='Bokeh Server',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
        "Programming Language :: Python",
        ],
      author='',
      author_email='',
      url='',
      keywords='bokeh graph plot server',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      test_suite='bokeh_server.tests',
      install_requires=[
        'Flask>=0.10.1',
        'Werkzeug>=0.9.1',
        'itsdangerous>=0.21',
        'greenlet>=0.4.1',
        'tornado>=4.0.1',
        'bokeh',
        ],
      entry_points="""\
      [console_scripts]
      bokeh_server = bokeh_server:main
      """,
      )
