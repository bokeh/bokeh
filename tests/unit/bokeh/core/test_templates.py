#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import hashlib
import io
from os.path import abspath, join, split

# Module under test
import bokeh.core.templates as bct # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

TOP_PATH = abspath(join(split(bct.__file__)[0]))

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _crlf_cr_2_lf_bin(s):
    import re
    return re.sub(b"\r\n|\r|\n", b"\n", s)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def compute_sha256(data):
    sha256 = hashlib.sha256()
    sha256.update(data)
    return sha256.hexdigest()

pinned_template_sha256 = "f3667e80d84d19b7d2b0642a3dd17131b72c0468981a3dd08227345d1fb2cfe5"

def test_autoload_template_has_changed() -> None:
    """This is not really a test but a reminder that if you change the
    autoload_nb_js.js template then you should make sure that insertion of
    plots into notebooks is working as expected. In particular, this test was
    created as part of https://github.com/bokeh/bokeh/issues/7125.
    """
    with io.open(join(TOP_PATH, '_templates/autoload_nb_js.js'), mode='rb') as f:
        assert pinned_template_sha256 == compute_sha256(_crlf_cr_2_lf_bin(f.read())), \
        """It seems that the template autoload_nb_js.js has changed.
        If this is voluntary and that proper testing of plots insertion
        in notebooks has been completed successfully, update this test
        with the new file SHA256 signature."""

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
