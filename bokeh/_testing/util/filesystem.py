#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide functions for manipulating files and directories in tests.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import codecs
import os
import shutil
import sys
import tempfile

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

class TmpDir:
    '''

    '''
    def __init__(self, prefix):
        self._dir = tempfile.mkdtemp(prefix=prefix, dir=_LOCAL_TMP)

    def __exit__(self, type, value, traceback):
        try:
            shutil.rmtree(path=self._dir)
        except Exception as e:
            # prefer original exception to rmtree exception
            if value is None:
                print("Exception cleaning up TmpDir %s: %s" % (self._dir, str(e)), file=sys.stderr)
                raise e
            else:
                print("Failed to clean up TmpDir %s: %s" % (self._dir, str(e)), file=sys.stderr)
                raise value

    def __enter__(self):
        return self._dir

def with_directory_contents(contents, func):
    '''

    '''
    with (TmpDir(prefix="test-")) as dirname:
        for filename, file_content in contents.items():
            path = os.path.join(dirname, filename)
            if file_content is None:
                os.makedirs(path, exist_ok=True)
            else:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with codecs.open(path, 'w', 'utf-8') as f:
                    f.write(file_content)
        return func(os.path.realpath(dirname))

def with_file_contents(contents, func, dir=None, suffix=''):
    '''

    '''
    def with_file_object(f):
        f.write(contents.encode("UTF-8"))
        f.flush()
        # Windows will get mad if we try to rename it without closing,
        # and some users of with_file_contents want to rename it.
        f.close()
        func(f.name)

    with_temporary_file(with_file_object, dir=dir, suffix=suffix)

async def with_file_contents_async(contents, func, dir=None, suffix=''):
    '''

    '''
    async def with_file_object(f):
        f.write(contents.encode("UTF-8"))
        f.flush()
        # Windows will get mad if we try to rename it without closing,
        # and some users of with_file_contents want to rename it.
        f.close()
        await func(f.name)

    await with_temporary_file_async(with_file_object, dir=dir, suffix=suffix)

def with_temporary_file(func, dir=None, suffix=''):
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

async def with_temporary_file_async(func, dir=None, suffix=''):
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

class WorkingDir:
    '''

    '''
    def __init__(self, pwd):
        self._new = pwd
        self._old = os.getcwd()

    def __exit__(self, type, value, traceback):
        os.chdir(self._old)

    def __enter__(self):
        os.chdir(self._new)
        return self._new

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
