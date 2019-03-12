#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from mock import patch

# External imports

# Bokeh imports
from bokeh.model import Model
from bokeh.core.properties import Int

# Module under test
import bokeh.core.validation as v

from bokeh.core.validation.errors import codes as ec
from bokeh.core.validation.warnings import codes as wc

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_error_decorator_code():
    for code in ec:
        @v.error(code)
        def good():
            return None
        assert good() == []

        @v.error(code)
        def bad():
            return "bad"
        assert bad() == [(code,) + ec[code] + ('bad',)]

def test_warning_decorator_code():
    for code in wc:
        @v.warning(code)
        def good():
            return None
        assert good() == []

        @v.warning(code)
        def bad():
            return "bad"
        assert bad() == [(code,) + wc[code] + ('bad',)]

def test_error_decorator_custom():
    @v.error("E1")
    def good():
        return None
    assert good() == []

    @v.error("E2")
    def bad():
        return "bad"
    assert bad() == [(9999, 'EXT:E2', 'Custom extension reports error', 'bad')]

def test_warning_decorator_custom():
    @v.warning("W1")
    def good():
        return None
    assert good() == []

    @v.warning("W2")
    def bad():
        return "bad"
    assert bad() == [ (9999, 'EXT:W2', 'Custom extension reports warning', 'bad')]

class Mod(Model):

    foo = Int(default=0)

    @v.error("E")
    def _check_error(self):
        if self.foo > 5: return "err"

    @v.warning("W")
    def _check_warning(self):
        if self.foo < -5: return "wrn"

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_check_pass(mock_warn, mock_error):
    m = Mod()

    v.check_integrity([m])
    assert not mock_error.called
    assert not mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_check_error(mock_warn, mock_error):
    m = Mod(foo=10)
    v.check_integrity([m])
    assert mock_error.called
    assert not mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_check_warn(mock_warn, mock_error):
    m = Mod(foo=-10)
    v.check_integrity([m])
    assert not mock_error.called
    assert mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_silence_and_check_warn(mock_warn, mock_error):
    from bokeh.core.validation.warnings import EXT
    m = Mod(foo=-10)
    try:
        v.silence(EXT)  # turn the warning off
        v.check_integrity([m])
        assert not mock_error.called
        assert not mock_warn.called
    finally:
        v.silence(EXT, False)  # turn the warning back on
        v.check_integrity([m])
        assert not mock_error.called
        assert mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_silence_with_bad_input_and_check_warn(mock_warn, mock_error):
    m = Mod(foo=-10)
    with pytest.raises(ValueError, match=('Input to silence should be a '
                                          'warning object')):
        v.silence('EXT:W')
    v.check_integrity([m])
    assert not mock_error.called
    assert mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_silence_warning_already_in_silencers_is_ok(mock_warn, mock_error):
    from bokeh.core.validation.warnings import EXT
    m = Mod(foo=-10)
    try:
        silencers0= v.silence(EXT)  # turn the warning off
        silencers1 = v.silence(EXT)  # do it a second time - no-op
        assert len(silencers0) == 1
        assert silencers0 == silencers1  # silencers is same as before

        v.check_integrity([m])
        assert not mock_error.called
        assert not mock_warn.called
    finally:
        v.silence(EXT, False)  # turn the warning back on
        v.check_integrity([m])
        assert not mock_error.called
        assert mock_warn.called

@patch('bokeh.core.validation.check.log.error')
@patch('bokeh.core.validation.check.log.warning')
def test_silence_remove_warning_that_is_not_in_silencers_is_ok(mock_warn, mock_error):
    from bokeh.core.validation.warnings import EXT
    m = Mod(foo=-10)

    silencers0 = v.silence(EXT)  # turn the warning off
    assert len(silencers0) == 1

    silencers1 = v.silence(EXT, False)  # turn the warning back on
    silencers2 = v.silence(EXT, False)  # do it a second time - no-op
    assert len(silencers1) == 0
    assert silencers1 == silencers2

    v.check_integrity([m])
    assert not mock_error.called
    assert mock_warn.called
#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
