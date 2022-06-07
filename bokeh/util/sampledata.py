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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# NOTE: since downloading sampledata is not a common occurrence, non-stdlib
# imports are generally deferrered in this module

# Standard library imports
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from sys import stdout
from typing import Any, TextIO, cast
from urllib.parse import urljoin
from urllib.request import urlopen

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "download",
)

DataFrame = Any

BLOCK_SIZE = 16384

# HTTP requests are cheaper for us, and there is nothing private to protect
S3 = "http://sampledata.bokeh.org"

@dataclass
class FileSpec:
    remote: str
    local: str
    md5: str

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def download(progress: bool = True) -> None:
    ''' Download larger data sets for various Bokeh examples.

    '''
    data_dir = external_data_dir(create=True)
    print(f"Using data directory: {data_dir}")

    for spec in _load_config():
        local_path = data_dir / spec.local

        if local_path.exists():
            with open(local_path, 'rb') as f:
                if hashlib.md5(f.read()).hexdigest() == spec.md5:
                    print(f"Skipping {spec.local!r} (checksum match)")
                    continue
            print(f"Re-fetching {spec.local!r} (checksum mismatch)")
        else:
            print(f"Fetching {spec.local!r} (no local file)")

        _download_file(spec, data_dir, progress=progress)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def external_csv(module: str, name: str, **kw: Any) -> DataFrame:
    '''

    '''
    from .dependencies import import_required
    pd = import_required("pandas", "{module} sample data requires Pandas (http://pandas.pydata.org) to be installed")
    return cast(Any, pd).read_csv(external_path(name), **kw)

def external_data_dir(create: bool = False) -> Path:
    '''

    '''
    try:
        import yaml
    except ImportError:
        raise RuntimeError("'yaml' and 'pyyaml' are required to use bokeh.sampledata functions")

    bokeh_dir = _bokeh_dir(create=create)

    try:
        with open(open(bokeh_dir / "config")) as f:
            config = yaml.safe_load(f)
            data_dir = Path(config["sampledata_dir"]).expanduser()
    except (OSError, TypeError, KeyError):
        data_dir = bokeh_dir / "data"

    if not data_dir.exists():
        if not create:
            raise RuntimeError("bokeh sample data directory does not exist, please execute bokeh.sampledata.download()")
        print(f"Creating {data_dir} directory")
        try:
            data_dir.mkdir()
        except OSError:
            raise RuntimeError(f"could not create bokeh data directory at {data_dir}")
    else:
        if not data_dir.is_dir():
            raise RuntimeError(f"{data_dir} exists but is not a directory")

    return data_dir

def external_path(filename: str) -> Path:
    data_dir = external_data_dir()
    path = data_dir / filename
    if not (path.exists() and path.is_file()):
        raise RuntimeError(f"Could not locate external data file {filename}. Please execute bokeh.sampledata.download()")
    return path

def package_csv(module: str, name: str, **kw: Any) -> DataFrame:
    '''

    '''
    from .dependencies import import_required
    pd = import_required("pandas", "{module} sample data requires Pandas (http://pandas.pydata.org) to be installed")
    return cast(Any, pd).read_csv(package_path(name), **kw)


def package_dir() -> Path:
    '''

    '''
    return Path(__file__).parents[1] / "sampledata" / "_data"

def package_path(filename: str) -> str:
    '''

    '''
    return package_dir() / filename

def open_csv(filename: str) -> TextIO:
    '''

    '''
    return open(filename, 'r', newline='', encoding='utf8')

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _bokeh_dir(create: bool = False) -> Path:
    '''

    '''
    dot_bokeh = Path.home() / ".bokeh"
    if not dot_bokeh.exists():
        if not create: return dot_bokeh
        print(f"Creating {dot_bokeh} directory")
        try:
            dot_bokeh.mkdir()
        except OSError:
            raise RuntimeError(f"could not create bokeh config directory at {dot_bokeh}")
    else:
        if not dot_bokeh.is_dir():
            raise RuntimeError(f"{dot_bokeh} exists but is not a directory")
    return dot_bokeh

def _download_file(spec: FileSpec, data_dir: Path, progress: bool = True) -> None:
    '''

    '''
    # These are actually somewhat expensive imports that added ~5% to overall
    # typical bokeh import times. Since downloading sampledata is not a common
    # action, we defer them to inside this function.
    from zipfile import ZipFile

    download_path = data_dir / spec.remote

    remote = urlopen(urljoin(S3, spec.remote))

    with open(download_path, 'wb') as f:
        file_size = int(remote.headers["Content-Length"])
        print(f"Downloading: {spec.remote} ({file_size} bytes)")

        fetched = 0
        while data := remote.read(BLOCK_SIZE):
            fetched += len(data)
            f.write(data)

            if progress:
                status = f"\r{fetched:10d} [{fetched*100.0/file_size:6.2f}%]"
                stdout.write(status)
                stdout.flush()

    if progress:
        print()

    if download_path.suffix == ".zip":
        print(f"Unpacking: {spec.remote}")

        with ZipFile(download_path, "r") as zip_file:
            zip_file.extract(spec.local, data_dir)

        download_path.unlink()

def _load_config() -> tuple(FileSpec):
    specs = []
    with open(Path(__file__).parent / "sampledata.json") as f:
        entries = json.load(f)
        for entry in entries:
            remote=entry["s3name"]
            md5=entry["md5"]
            spec = FileSpec(remote=remote, md5=md5, local=entry.get("name", remote))
            specs.append(spec)

    return tuple(specs)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
