#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
import re
import sys
from subprocess import run

from tests.support.util.api import verify_all
from tests.support.util.types import Capture

# Module under test
import bokeh as b # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL =  (
    '__version__',
    'license',
)

_LICENSE = """\
Copyright (c) Anaconda, Inc., and Bokeh Contributors
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

def test___version___type() -> None:
    assert isinstance(b.__version__, str)

def test___version___defined() -> None:
    VERSION_PAT = re.compile(r"^(\d+\.\d+\.\d+)((?:\.dev|\.rc).*)?")
    assert VERSION_PAT.match(b.__version__.strip(".dirty"))

def test_download_removed() -> None:
    assert not hasattr(b, "download")

def test_jupyter_labextension_path_is_relative_to_the_bokeh_package() -> None:
    assert b._jupyter_labextension_paths() == [{
        "src": "jupyter/labextension",
        "dest": "@bokeh/bokeh-jupyter",
    }]

def test_license(capsys: Capture) -> None:
    b.license()
    out, _ = capsys.readouterr()
    assert out == _LICENSE

def test_import_preserves_warning_configuration() -> None:
    run([sys.executable, "-c", """
import warnings

filters = warnings.filters.copy()
formatter = warnings.formatwarning

import bokeh

assert warnings.filters == filters
assert warnings.formatwarning is formatter
"""], check=True)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
