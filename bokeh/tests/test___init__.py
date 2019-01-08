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
from os.path import dirname, join
from shutil import copy
import warnings

# External imports
from six import string_types

# Bokeh imports
from bokeh._testing.util.api import verify_all
from bokeh.util.warnings import BokehDeprecationWarning, BokehUserWarning

# Module under test
import bokeh as b

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL =  (
    '__version__',
    'license',
    'sampledata',
)

_LICENSE = """\
Copyright (c) 2012 - 2018, Anaconda, Inc., and Bokeh Contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

Neither the name of Anaconda nor the names of any contributors
may be used to endorse or promote products derived from this software
without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
THE POSSIBILITY OF SUCH DAMAGE.

"""

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(b, ALL)

def test___version___type():
    assert isinstance(b.__version__, string_types)

def test___version___defined():
    assert b.__version__ != 'unknown'

def test_license(capsys):
    # This sucks, but when testing from source, there's no guarantee that
    # setup.py has been called to install the license file otherwise.
    copy(
        join(dirname(__file__), '..', '..', 'LICENSE.txt'),
        join(dirname(__file__), '..')
    )

    b.license()
    out, err = capsys.readouterr()
    assert out == _LICENSE

class TestWarnings(object):
    @pytest.mark.parametrize('cat', (BokehDeprecationWarning, BokehUserWarning))
    def test_bokeh_custom(self, cat):
        r = warnings.formatwarning("message", cat, "line", "lineno")
        assert r == "%s: %s\n" %(cat.__name__, "message")

    def test_general_default(self):
        r = warnings.formatwarning("message", RuntimeWarning, "line", "lineno")
        assert r == "line:lineno: RuntimeWarning: message\n"

    def test_filters(self):
        assert ('always', None, BokehUserWarning, None, 0) in warnings.filters
        assert ('always', None, BokehDeprecationWarning, None, 0) in warnings.filters

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
