#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Helper functions for downloading and accessing sample data.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# NOTE: since downloading sampledata is not a common occurrnce, non-stdlib
# imports are generally deferrered in this module

# Standard library imports
from os import mkdir, remove
from os.path import abspath, dirname, exists, expanduser, isdir, isfile, join, splitext
from sys import stdout

# External imports
import six

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'download',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def download(progress=True):
    ''' Download larger data sets for various Bokeh examples.

    '''
    data_dir = external_data_dir(create=True)
    print("Using data directory: %s" % data_dir)

    s3 = 'https://s3.amazonaws.com/bokeh_data/'
    files = [
        (s3, 'CGM.csv'),
        (s3, 'US_Counties.zip'),
        (s3, 'us_cities.json'),
        (s3, 'unemployment09.csv'),
        (s3, 'AAPL.csv'),
        (s3, 'FB.csv'),
        (s3, 'GOOG.csv'),
        (s3, 'IBM.csv'),
        (s3, 'MSFT.csv'),
        (s3, 'WPP2012_SA_DB03_POPULATION_QUINQUENNIAL.zip'),
        (s3, 'gapminder_fertility.csv'),
        (s3, 'gapminder_population.csv'),
        (s3, 'gapminder_life_expectancy.csv'),
        (s3, 'gapminder_regions.csv'),
        (s3, 'world_cities.zip'),
        (s3, 'airports.json'),
        (s3, 'movies.db.zip'),
        (s3, 'airports.csv'),
        (s3, 'routes.csv'),
        (s3, 'haarcascade_frontalface_default.xml'),
    ]

    for base_url, filename in files:
        _download_file(base_url, filename, data_dir, progress=progress)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def external_csv(module, name, **kw):
    '''

    '''
    from .dependencies import import_required
    pd = import_required('pandas', '%s sample data requires Pandas (http://pandas.pydata.org) to be installed' % module)
    return pd.read_csv(external_path(name), **kw)

def external_data_dir(create=False):
    '''

    '''
    try:
        import yaml
    except ImportError:
        raise RuntimeError("'yaml' and 'pyyaml' are required to use bokeh.sampledata functions")

    bokeh_dir = _bokeh_dir(create=create)
    data_dir = join(bokeh_dir, "data")

    try:
        config = yaml.load(open(join(bokeh_dir, 'config')))
        data_dir = expanduser(config['sampledata_dir'])
    except (IOError, TypeError):
        pass

    if not exists(data_dir):
        if not create:
            raise RuntimeError('bokeh sample data directory does not exist, please execute bokeh.sampledata.download()')
        print("Creating %s directory" % data_dir)
        try:
            mkdir(data_dir)
        except OSError:
            raise RuntimeError("could not create bokeh data directory at %s" % data_dir)
    else:
        if not isdir(data_dir):
            raise RuntimeError("%s exists but is not a directory" % data_dir)

    return data_dir

def external_path(filename):
    data_dir = external_data_dir()
    fn = join(data_dir, filename)
    if not exists(fn) and isfile(fn):
        raise RuntimeError('Could not locate external data file %e. Please execute bokeh.sampledata.download()' % fn)
    return fn

def package_csv(module, name, **kw):
    '''

    '''
    from .dependencies import import_required
    pd = import_required('pandas', '%s sample data requires Pandas (http://pandas.pydata.org) to be installed' % module)
    return pd.read_csv(package_path(name), **kw)


def package_dir():
    '''

    '''
    return abspath(join(dirname(__file__), "..", "sampledata", "_data"))

def package_path(filename):
    '''

    '''
    return join(package_dir(), filename)

def open_csv(filename):
    '''

    '''
    # csv differs in Python 2.x and Python 3.x. Open the file differently in each.
    if six.PY2:
        return open(filename, 'rb')
    else:
        return open(filename, 'r', newline='', encoding='utf8')

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _bokeh_dir(create=False):
    '''

    '''
    bokeh_dir = join(expanduser("~"), ".bokeh")
    if not exists(bokeh_dir):
        if not create: return bokeh_dir
        print("Creating %s directory" % bokeh_dir)
        try:
            mkdir(bokeh_dir)
        except OSError:
            raise RuntimeError("could not create bokeh config directory at %s" % bokeh_dir)
    else:
        if not isdir(bokeh_dir):
            raise RuntimeError("%s exists but is not a directory" % bokeh_dir)
    return bokeh_dir

def _download_file(base_url, filename, data_dir, progress=True):
    '''

    '''
    # These is actually a somewhat expensive imports that added ~5% to overall
    # typical bokeh import times. Since downloading sampledata is not a common
    # action, we defer them to inside this function.
    from six.moves.urllib.request import urlopen
    from zipfile import ZipFile

    file_url = join(base_url, filename)
    file_path = join(data_dir, filename)

    url = urlopen(file_url)

    with open(file_path, 'wb') as file:
        file_size = int(url.headers["Content-Length"])
        print("Downloading: %s (%d bytes)" % (filename, file_size))

        fetch_size = 0
        block_size = 16384

        while True:
            data = url.read(block_size)
            if not data:
                break

            fetch_size += len(data)
            file.write(data)

            if progress:
                status = "\r%10d [%6.2f%%]" % (fetch_size, fetch_size*100.0/file_size)
                stdout.write(status)
                stdout.flush()

    if progress:
        print()

    real_name, ext = splitext(filename)

    if ext == '.zip':
        if not splitext(real_name)[1]:
            real_name += ".csv"

        print("Unpacking: %s" % real_name)

        with ZipFile(file_path, 'r') as zip_file:
            zip_file.extract(real_name, data_dir)

        remove(file_path)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
