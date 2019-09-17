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

# External imports
import mock
from six import string_types

# Bokeh imports
from bokeh._version import get_versions

# Module under test
import bokeh.util.version as buv

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test___version__(object):

    def test_basic(self):
        assert isinstance(buv.__version__, string_types)
        assert buv.__version__ == get_versions()['version']

class Test_base_version(object):
    def test_returns_helper(self):
        with mock.patch('bokeh.util.version._base_version_helper') as helper:
            buv.base_version()
            assert helper.called

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class Test__base_version_helper(object):

    def test_release_version_unchanged(self):
        assert buv._base_version_helper("0.2.3") == "0.2.3"
        assert buv._base_version_helper("1.2.3") == "1.2.3"

    def test_dev_version_stripped(self):
        assert buv._base_version_helper("0.2.3dev2") == "0.2.3"
        assert buv._base_version_helper("1.2.3dev10") == "1.2.3"

    def test_rc_version_stripped(self):
        assert buv._base_version_helper("0.2.3rc2") == "0.2.3"
        assert buv._base_version_helper("1.2.3rc10") == "1.2.3"

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
