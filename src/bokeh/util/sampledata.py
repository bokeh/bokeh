#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Helper functions for downloading and accessing sample data.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

# NOTE: skip logging imports so that this module may be run as a script

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import hashlib
import json
from os import mkdir, remove
from os.path import (
    abspath,
    dirname,
    exists,
    expanduser,
    isdir,
    isfile,
    join,
    splitext,
)
from sys import stdout
from typing import TYPE_CHECKING, Any, TextIO
from urllib.parse import urljoin
from urllib.request import urlopen

# NOTE: since downloading sampledata is not a common occurrence, non-stdlib
# imports are generally deferrered in this module

if TYPE_CHECKING:
    import pandas as pd

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'download',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def download(progress: bool = True) -> None:
    ''' Download larger data sets for various Bokeh examples.

    '''
    data_dir = external_data_dir(create=True)
    print("Using data directory: %s" % data_dir)

    # HTTP requests are cheaper for us, and there is nothing private to protect
    s3 = 'http://sampledata.bokeh.org'
    files = json.load(open(join(dirname(__file__), "sampledata.json")))

    for filename, md5 in files:
        real_name, ext = splitext(filename)
        if ext == '.zip':
            if not splitext(real_name)[1]:
                real_name += ".csv"
        else:
            real_name += ext
        real_path = join(data_dir, real_name)

        if exists(real_path):
            local_md5 = hashlib.md5(open(real_path,'rb').read()).hexdigest()
            if local_md5 == md5:
                print(f"Skipping {filename!r} (checksum match)")
                continue
            else:
                print(f"Re-fetching {filename!r} (checksum mismatch)")

        _download_file(s3, filename, data_dir, progress=progress)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def external_csv(module: str, name: str, **kw: Any) -> pd.DataFrame:
    '''

    '''
    import pandas as pd
    return pd.read_csv(external_path(name), **kw)

def external_data_dir(create: bool = False) -> str:
    '''

    '''
    try:
        import yaml
    except ImportError:
        raise RuntimeError("'yaml' and 'pyyaml' are required to use bokeh.sampledata functions")

    bokeh_dir = _bokeh_dir(create=create)
    data_dir = join(bokeh_dir, "data")

    try:
        config = yaml.safe_load(open(join(bokeh_dir, 'config')))
        data_dir = expanduser(config['sampledata_dir'])
    except (OSError, TypeError):
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

def external_path(filename: str) -> str:
    data_dir = external_data_dir()
    fn = join(data_dir, filename)
    if not exists(fn) and isfile(fn):
        raise RuntimeError('Could not locate external data file %s. Please execute bokeh.sampledata.download()' % fn)
    return fn

def package_csv(module: str, name: str, **kw: Any) -> pd.DataFrame:
    '''

    '''
    import pandas as pd
    return pd.read_csv(package_path(name), **kw)


def package_dir() -> str:
    '''

    '''
    return abspath(join(dirname(__file__), "..", "sampledata", "_data"))

def package_path(filename: str) -> str:
    '''

    '''
    return join(package_dir(), filename)

def open_csv(filename: str) -> TextIO:
    '''

    '''
    return open(filename, 'r', newline='', encoding='utf8')

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _bokeh_dir(create: bool = False) -> str:
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

def _download_file(base_url: str, filename: str, data_dir: str, progress: bool = True) -> None:
    '''

    '''
    # These are actually somewhat expensive imports that added ~5% to overall
    # typical bokeh import times. Since downloading sampledata is not a common
    # action, we defer them to inside this function.
    from zipfile import ZipFile

    file_url = urljoin(base_url, filename)
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

# This is necessary so that we can run the sampledata download code in the
# release build, before an actual package exists.
if __name__ == "__main__":
    download(progress=False)
