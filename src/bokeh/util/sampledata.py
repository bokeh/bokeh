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
from os.path import splitext
from pathlib import Path
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
    print(f"Using data directory: {data_dir}")

    # HTTP requests are cheaper for us, and there is nothing private to protect
    s3 = 'http://sampledata.bokeh.org'
    files = json.load(open(Path(__file__).parent / "sampledata.json"))

    for filename, md5 in files:
        real_name, ext = splitext(filename)
        if ext == '.zip':
            if not splitext(real_name)[1]:
                real_name += ".csv"
        else:
            real_name += ext
        real_path = data_dir /real_name

        if real_path.exists():
            local_md5 = hashlib.md5(open(real_path, 'rb').read()).hexdigest()
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

def external_data_dir(create: bool = False) -> Path:
    '''

    '''
    try:
        import yaml
    except ImportError:
        raise RuntimeError("'yaml' and 'pyyaml' are required to use bokeh.sampledata functions")

    bokeh_dir = _bokeh_dir(create=create)
    data_dir = bokeh_dir / "data"

    try:
        config = yaml.safe_load(open(bokeh_dir / 'config'))
        data_dir = Path.expanduser(config['sampledata_dir'])
    except (OSError, TypeError):
        pass

    if not data_dir.exists():
        if not create:
            raise RuntimeError('bokeh sample data directory does not exist, please execute bokeh.sampledata.download()')
        print(f"Creating {data_dir} directory")
        try:
            data_dir.mkdir()
        except OSError:
            raise RuntimeError(f"could not create bokeh data directory at {data_dir}")
    else:
        if not data_dir.is_dir():
            raise RuntimeError(f"{data_dir} exists but is not a directory")

    return data_dir

def external_path(filename: str | Path) -> Path:
    data_dir = external_data_dir()
    fn = data_dir / filename
    if not fn.exists() or not fn.is_file():
        raise RuntimeError(f"Could not locate external data file {fn}. Please execute bokeh.sampledata.download()")
    return fn

def package_csv(module: str, name: str, **kw: Any) -> pd.DataFrame:
    '''

    '''
    import pandas as pd
    return pd.read_csv(package_path(name), **kw)

def package_dir() -> Path:
    '''

    '''
    return Path(__file__).parents[1].joinpath("sampledata", "_data").resolve()

def package_path(filename: str | Path) -> Path:
    '''

    '''
    return package_dir() / filename

def open_csv(filename: str | Path) -> TextIO:
    '''

    '''
    return open(filename, 'r', newline='', encoding='utf8')

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _bokeh_dir(create: bool = False) -> Path:
    bokeh_dir = Path("~").expanduser() / ".bokeh"
    if not bokeh_dir.exists():
        if not create: return bokeh_dir
        print(f"Creating {bokeh_dir} directory")
        try:
            bokeh_dir.mkdir()
        except OSError:
            raise RuntimeError(f"could not create bokeh config directory at {bokeh_dir}")
    else:
        if not bokeh_dir.is_dir():
            raise RuntimeError(f"{bokeh_dir} exists but is not a directory")
    return bokeh_dir

def _download_file(base_url: str, filename: str, data_dir: Path, progress: bool = True) -> None:
    '''

    '''
    # These are actually somewhat expensive imports that added ~5% to overall
    # typical bokeh import times. Since downloading sampledata is not a common
    # action, we defer them to inside this function.
    from zipfile import ZipFile

    file_url = urljoin(base_url, filename)
    file_path = data_dir / filename

    url = urlopen(file_url)

    with open(file_path, 'wb') as file:
        file_size = int(url.headers["Content-Length"])
        print(f"Downloading: {filename} ({file_size} bytes)")

        fetch_size = 0
        block_size = 16384

        while True:
            data = url.read(block_size)
            if not data:
                break

            fetch_size += len(data)
            file.write(data)

            if progress:
                status = f"\r{fetch_size:< 10d} [{fetch_size*100.0/file_size:6.2f}%%]"
                stdout.write(status)
                stdout.flush()

    if progress:
        print()

    real_name, ext = splitext(filename)

    if ext == '.zip':
        if not splitext(real_name)[1]:
            real_name += ".csv"

        print(f"Unpacking: {real_name}")

        with ZipFile(file_path, 'r') as zip_file:
            zip_file.extract(real_name, data_dir)

        file_path.unlink()

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# This is necessary so that we can run the sampledata download code in the
# release build, before an actual package exists.
if __name__ == "__main__":
    download(progress=False)
