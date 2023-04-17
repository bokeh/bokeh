#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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

    for file_name, md5 in metadata().items():
        real_path = data_dir / real_name(file_name)

        if real_path.exists():
            with open(real_path, "rb") as file:
                data = file.read()
            local_md5 = hashlib.md5(data).hexdigest()
            if local_md5 == md5:
                print(f"Skipping {file_name!r} (checksum match)")
                continue

        print(f"Fetching {file_name!r}")
        _download_file(s3, file_name, data_dir, progress=progress)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def real_name(name: str) -> str:
    real_name, ext = splitext(name)
    if ext == ".zip":
        if not splitext(real_name)[1]:
            return f"{real_name}.csv"
        else:
            return real_name
    else:
        return name

def metadata() -> dict[str, str]:
    with (Path(__file__).parent / "sampledata.json").open("rb") as f:
        return dict(json.load(f))

def external_csv(module: str, name: str, **kw: Any) -> pd.DataFrame:
    import pandas as pd
    return pd.read_csv(external_path(name), **kw)

def external_data_dir(*, create: bool = False) -> Path:
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

def external_path(file_name: str) -> Path:
    data_dir = external_data_dir()
    file_path = data_dir / file_name
    if not file_path.exists() or not file_path.is_file():
        raise RuntimeError(f"Could not locate external data file {file_path}. Please execute bokeh.sampledata.download()")
    with open(file_path, "rb") as file:
        meta = metadata()
        known_md5 = meta.get(file_name) or \
                    meta.get(f"{file_name}.zip") or \
                    meta.get(f"{splitext(file_name)[0]}.zip")
        if known_md5 is None:
            raise RuntimeError(f"Unknown external data file {file_name}")

        local_md5 = hashlib.md5(file.read()).hexdigest()
        if known_md5 != local_md5:
            raise RuntimeError(f"External data file {file_path} is outdated. Please execute bokeh.sampledata.download()")
    return file_path

def package_csv(module: str, name: str, **kw: Any) -> pd.DataFrame:
    import pandas as pd
    return pd.read_csv(package_path(name), **kw)

def package_dir() -> Path:
    return Path(__file__).parents[1].joinpath("sampledata", "_data").resolve()

def package_path(filename: str | Path) -> Path:
    return package_dir() / filename

def load_json(filename: str | Path) -> Any:
    with open(filename, "rb") as f:
        return json.load(f)

def open_csv(filename: str | Path) -> TextIO:
    return open(filename, newline='', encoding='utf8')

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
