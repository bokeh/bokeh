''' Functions to help with testing Bokeh and reporting issues.
'''
from __future__ import absolute_import, print_function

import codecs
import errno
import os
import importlib
import shutil
import sys
import tempfile

import pytest
from six import string_types

def verify_all(module, ALL):

    class Test___all__(object):
        def test___all__(self):
            if isinstance(module, string_types):
                mod = importlib.import_module(module)
            else:
                mod = module
            assert hasattr(mod, "__all__")
            assert mod.__all__ == ALL

        @pytest.mark.parametrize('name', ALL)
        @pytest.mark.unit
        def test_contents(self, name):
            if isinstance(module, string_types):
                mod = importlib.import_module(module)
            else:
                mod = module
            assert hasattr(mod, name)
    return Test___all__

def makedirs_ok_if_exists(path):
    try:
        os.makedirs(path)
    except IOError as e:  # pragma: no cover (py3 only)
        if e.errno != errno.EEXIST:
            raise e
    except OSError as e:  # pragma: no cover (py2 only)
        if e.errno != errno.EEXIST:
            raise e
    return path

local_tmp = os.path.abspath("./build/tmp")
makedirs_ok_if_exists(local_tmp)

class WorkingDir(object):
    def __init__(self, pwd):
        self._new = pwd
        self._old = os.getcwd()

    def __exit__(self, type, value, traceback):
        os.chdir(self._old)

    def __enter__(self):
        os.chdir(self._new)
        return self._new

class TmpDir(object):
    def __init__(self, prefix):
        self._dir = tempfile.mkdtemp(prefix=prefix, dir=local_tmp)

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

def with_temporary_file(func, dir=None):
    if dir is None:
        dir = local_tmp
    import tempfile
    # Windows throws a permission denied if we use delete=True for
    # auto-delete, and then try to open the file again ourselves
    # with f.name. So we manually delete in the finally block
    # below.
    f = tempfile.NamedTemporaryFile(dir=dir, delete=False)
    try:
        func(f)
    finally:
        f.close()
        os.remove(f.name)

def with_directory_contents(contents, func):
    with (TmpDir(prefix="test-")) as dirname:
        for filename, file_content in contents.items():
            path = os.path.join(dirname, filename)
            if file_content is None:
                # make a directory
                makedirs_ok_if_exists(path)
            else:
                makedirs_ok_if_exists(os.path.dirname(path))
                with codecs.open(path, 'w', 'utf-8') as f:
                    f.write(file_content)
        return func(os.path.realpath(dirname))

def with_file_contents(contents, func, dir=None):
    def with_file_object(f):
        f.write(contents.encode("UTF-8"))
        f.flush()
        # Windows will get mad if we try to rename it without closing,
        # and some users of with_file_contents want to rename it.
        f.close()
        func(f.name)

    with_temporary_file(with_file_object, dir=dir)
