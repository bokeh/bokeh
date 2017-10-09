#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

from bokeh.util.api import INTERNAL, PUBLIC ; INTERNAL, PUBLIC
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from mock import patch
import sys

# External imports

# Bokeh imports

# Module under test
import bokeh.util.api as bua

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

def afunc(): pass

class aclass(object):
    def ameth(self): pass

    @property
    def aprop(self): pass

    @aprop.setter
    def aprop(self): pass

@bua.public("foo")
def pub_func():
    """doc"""
    pass

@bua.internal("foo")
def int_func():
    """doc"""
    pass

@bua.public("foo")
class pub_class(object):
    """doc"""

    @bua.public("foo")
    def pub_meth(self):
        """doc"""
        pass

    @bua.internal("foo")
    def int_meth():
        """doc"""
        pass

    @property
    @bua.public("foo")
    def pub_prop(self):
        """doc"""
        pass

    @pub_prop.setter
    @bua.public("foo")
    def pub_prop(self, val):
        """doc"""
        pass

    @property
    @bua.internal("foo")
    def int_prop(self):
        """doc"""
        pass

    @int_prop.setter
    @bua.internal("foo")
    def int_prop(self, val):
        """doc"""
        pass

@bua.internal("foo")
class int_class(pub_class):
    """doc"""
    pass

plain_objs = [afunc, aclass, aclass.ameth, aclass.aprop]
pub_objs = [pub_func, pub_class, pub_class.pub_meth, pub_class.pub_prop.fget, pub_class.pub_prop.fset]
int_objs = [int_func, int_class, int_class.int_meth, pub_class.int_prop.fget, pub_class.int_prop.fset]

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

def test_PUBLIC():
    # not like this couldn't ever change, but should be intentional
    assert bua.PUBLIC == "public"

def test_INTERNAL():
    # not like this couldn't ever change, but should be intentional
    assert bua.INTERNAL == "internal"

@pytest.mark.parametrize('obj', pub_objs, ids=str)
def test_public_sets_level(obj):
    assert bua.is_level(obj, bua.PUBLIC)

@pytest.mark.parametrize('obj', int_objs, ids=str)
def test_internal_sets_level(obj):
    assert bua.is_level(obj, bua.INTERNAL)

@pytest.mark.parametrize('obj', pub_objs, ids=str)
def test_public_sets_version(obj):
    assert bua.is_version(obj, "foo")

@pytest.mark.parametrize('obj', int_objs, ids=str)
def test_internal_sets_version(obj):
    assert bua.is_version(obj, "foo")

@pytest.mark.parametrize('obj', plain_objs, ids=str)
def test_is_declared_is_false_for_undeclared(obj):
    assert bua.is_declared(obj) is False

@pytest.mark.parametrize('obj', pub_objs+int_objs, ids=str)
def test_is_declared_is_false_for_public_or_internal(obj):
    assert bua.is_declared(obj) is True

def test_is_level():
    class Test(object): pass
    obj = Test()

    obj.__bklevel__ = bua.PUBLIC
    assert bua.is_level(obj, bua.PUBLIC)
    assert not bua.is_level(obj, bua.INTERNAL)

    obj.__bklevel__ = bua.INTERNAL
    assert bua.is_level(obj, bua.INTERNAL)
    assert not bua.is_level(obj, bua.PUBLIC)

def test_is_level_raises_on_bad_level():
    with pytest.raises(ValueError):
        bua.is_level(pub_func, "junk")

def test_is_version():
    class Test(object): pass
    obj = Test()

    obj.__bkversion__ = "foo"
    assert bua.is_version(obj, "foo")
    assert not bua.is_version(obj, "bar")

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__LEVELS():
    assert bua._LEVELS == [bua.PUBLIC, bua.INTERNAL]

# most of the testing of _access is done by testing @public and @internal
# above, with the two tests below ensuring that those functions defer the
# actual work to _access

@patch("bokeh.util.api._access")
def test__access_called_by_public(mock_access):
    r = bua.public("v")
    assert callable(r)
    assert mock_access.call_count == 1
    assert mock_access.call_args[0] == ('v', bua.PUBLIC)
    assert mock_access.call_args[1] == {}

@patch("bokeh.util.api._access")
def test__access_called_by_internal(mock_access):
    r = bua.internal("v")
    assert callable(r)
    assert mock_access.call_count == 1
    assert mock_access.call_args[0] == ('v', bua.INTERNAL)
    assert mock_access.call_args[1] == {}

def test__access_sets___bkapi__():
    # These numbers are based on the setup classes in this module, if they
    # change then these numbers may also change

    # Also note, using globals here otherwise Flake8 will complain about
    # undeclared __bkapi__
    assert globals()['__bkapi__'] == {bua.PUBLIC: 5, bua.INTERNAL:5}

@pytest.mark.parametrize('obj', pub_objs+int_objs, ids=str)
def test__access_preserves___doc__(obj):
    assert obj.__doc__ == "doc"

@pytest.mark.parametrize('obj', plain_objs, ids=str)
def test__get_module(obj):
    m = bua._get_module(afunc)
    assert m is sys.modules[__name__]

def test__increment_api_count():
    class Test(object): pass
    obj = Test()

    assert not hasattr(obj, '__bkapi__')
    bua._increment_api_count(obj, bua.PUBLIC)
    assert(obj.__bkapi__) == {bua.PUBLIC: 1, bua.INTERNAL: 0}

    bua._increment_api_count(obj, bua.PUBLIC)
    assert(obj.__bkapi__) == {bua.PUBLIC: 2, bua.INTERNAL: 0}

    bua._increment_api_count(obj, bua.INTERNAL)
    assert(obj.__bkapi__) == {bua.PUBLIC: 2, bua.INTERNAL: 1}

    bua._increment_api_count(obj, bua.PUBLIC)
    assert(obj.__bkapi__) == {bua.PUBLIC: 3, bua.INTERNAL: 1}

    bua._increment_api_count(obj, bua.INTERNAL)
    assert(obj.__bkapi__) == {bua.PUBLIC: 3, bua.INTERNAL: 2}
