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
import io
import hashlib
from os.path import abspath, join, split, pardir

# External imports

# Bokeh imports

# Module under test

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

TOP_PATH = abspath(join(split(__file__)[0], pardir))

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

pinned_template_sha256 = "882bcee1a8d3a51f6e92680029f5cba119bb0c16e637d196524fa33384bd398f"

def test_autoload_template_has_changed():
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
