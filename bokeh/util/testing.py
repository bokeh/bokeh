''' Functions to help with testing Bokeh and reporting issues.
'''
from __future__ import absolute_import, print_function

import codecs
import errno
from inspect import isclass, isfunction, getmembers
import os
import importlib
import shutil
import sys
import tempfile

import pytest
from six import string_types

from .api import DEV, GENERAL
from .api import is_declared, is_level, is_version

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
        def test_contents(self, name):
            if isinstance(module, string_types):
                mod = importlib.import_module(module)
            else:
                mod = module
            assert hasattr(mod, name)
    return Test___all__

def verify_api(module, api):

    class Test_api(object):

        test_general_api = _generate_api_check(module, api, GENERAL)
        test_dev_api = _generate_api_check(module, api, DEV)

        @pytest.mark.api
        def test_all_declared(self):
            to_check = []
            for name, obj in getmembers(module):

                # only test objects defined in this module
                if getattr(obj, '__module__', None) != module.__name__: continue

                # pure private objects are not versioned
                if name.startswith('_'): continue
                to_check.append((name, obj))

                if isclass(obj):
                    for cname, cobj in getmembers(obj):
                        # pure private methods are not versioned
                        if cname.startswith('_'): continue
                        to_check.append((name + "." + cname, cobj))

            for (name, obj) in to_check:

                if isfunction(obj):
                    assert is_declared(obj), "visible function %r is not API declared" % name

                elif isclass(obj):
                    assert is_declared(obj), "visible class %r is not API declared" % name

                elif isinstance(obj, property):
                    assert is_declared(obj.fget), "visible Python property getter %r is not API declared" % name
                    if obj.fdel is not None:
                        assert is_declared(obj.fset), "visible Python property getter %r is not API declared" % name
                    if obj.fdel is not None:
                        assert is_declared(obj.fdel), "visible Python property getter %r is not API declared" % name

        @pytest.mark.api
        def test_all_tested(self):
            for level in (DEV, GENERAL):
                recorded = module.__bkapi__[level]
                assert len(api[level]) == recorded, "expected %d tests for %s API objects in %s, got %d" % (recorded, level, module.__name__, len(api[level]))

    return Test_api

def _generate_api_check(module, api, level):
    if len(api[level]) > 0:
        @pytest.mark.parametrize('name,version', api[level], ids=str)
        @pytest.mark.api
        def test_api(self, name, version):
            assert isinstance(version, tuple)
            assert len(version) == 3
            assert version >= (1, 0, 0)
            elts = name.split(".")
            # property
            if len(elts) == 3:
                (clsname, propname, proptype) = elts
                prop = getattr(module, clsname).__dict__[propname]
                obj = getattr(prop, proptype)
            # method
            elif len(elts) == 2:
                (clsname, attr) = elts
                obj = getattr(getattr(module, clsname), attr)
            # function
            else:
                obj = getattr(module, name)

            assert is_level(obj, level), "%s expected to declare api level %r" % (name, level)
            assert is_version(obj, version), "%s expected to declare first-version %s" % (name, version)

    else:
        @pytest.mark.api
        def test_api(self): assert True

    return test_api

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

def skipIfPy3(message):
    ''' unittest decorator to skip a test for Python 3

    '''
    from unittest import skipIf
    from .platform import is_py3
    return skipIf(is_py3(), message)
