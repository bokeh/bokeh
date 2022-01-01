#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide functions for manipulating files and directories in tests.

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

# Standard library imports
import os
import shutil
import sys
import tempfile
from contextlib import contextmanager
from types import TracebackType
from typing import (
    IO,
    Awaitable,
    Callable,
    ContextManager,
    Dict,
    Iterator,
    Type,
)

# Bokeh imports
from bokeh.core.types import PathLike

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'TmpDir',
    'with_directory_contents',
    'with_temporary_file',
    'WorkingDir',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TmpDir(ContextManager[str]):
    '''

    '''

    def __init__(self, prefix: str) -> None:
        self._dir = tempfile.mkdtemp(prefix=prefix, dir=_LOCAL_TMP)

    def __exit__(self, type: Type[BaseException] | None, value: BaseException | None, traceback: TracebackType | None) -> None:
        try:
            shutil.rmtree(path=self._dir)
        except Exception as e:
            # prefer original exception to rmtree exception
            if value is None:
                print(f"Exception cleaning up TmpDir {self._dir}: {e}", file=sys.stderr)
                raise e
            else:
                print(f"Failed to clean up TmpDir {self._dir}: {e}", file=sys.stderr)
                raise value

    def __enter__(self) -> str:
        return self._dir

def with_directory_contents(contents: Dict[PathLike, str | None], func: Callable[[str], None]) -> None:
    '''

    '''
    with TmpDir(prefix="test-") as dirname:
        for filename, file_content in contents.items():
            path = os.path.join(dirname, filename)
            if file_content is None:
                os.makedirs(path, exist_ok=True)
            else:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "w", encoding="utf-8") as f:
                    f.write(file_content)
        func(os.path.realpath(dirname))

def with_file_contents(contents: str, func: Callable[[str], None], dir: PathLike | None = None, suffix: str = '') -> None:
    '''

    '''
    def with_file_object(f: IO[bytes]) -> None:
        f.write(contents.encode("UTF-8"))
        f.flush()
        # Windows will get mad if we try to rename it without closing,
        # and some users of with_file_contents want to rename it.
        f.close()
        func(f.name)

    with_temporary_file(with_file_object, dir=dir, suffix=suffix)

async def with_file_contents_async(contents: str, func: Callable[[str], Awaitable[None]], dir: PathLike | None = None, suffix: str = '') -> None:
    '''

    '''
    async def with_file_object(f: IO[bytes]) -> None:
        f.write(contents.encode("UTF-8"))
        f.flush()
        # Windows will get mad if we try to rename it without closing,
        # and some users of with_file_contents want to rename it.
        f.close()
        await func(f.name)

    await with_temporary_file_async(with_file_object, dir=dir, suffix=suffix)

def with_temporary_file(func: Callable[[IO[bytes]], None], dir: PathLike | None = None, suffix: str = '') -> None:
    '''

    '''
    if dir is None:
        dir = _LOCAL_TMP

    # Windows throws a permission denied if we use delete=True for
    # auto-delete, and then try to open the file again ourselves
    # with f.name. So we manually delete in the finally block
    # below.
    f = tempfile.NamedTemporaryFile(dir=dir, delete=False, suffix=suffix)
    try:
        func(f)
    finally:
        f.close()
        os.remove(f.name)

async def with_temporary_file_async(func: Callable[[IO[bytes]], Awaitable[None]], dir: PathLike | None = None, suffix: str = '') -> None:
    '''

    '''
    if dir is None:
        dir = _LOCAL_TMP

    # Windows throws a permission denied if we use delete=True for
    # auto-delete, and then try to open the file again ourselves
    # with f.name. So we manually delete in the finally block
    # below.
    f = tempfile.NamedTemporaryFile(dir=dir, delete=False, suffix=suffix)
    try:
        await func(f)
    finally:
        f.close()
        os.remove(f.name)

@contextmanager
def WorkingDir(new: PathLike) -> Iterator[PathLike]:
    old = os.getcwd()
    os.chdir(new)
    yield new
    os.chdir(old)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

_LOCAL_TMP = os.path.abspath("./build/tmp")
os.makedirs(_LOCAL_TMP, exist_ok=True)
