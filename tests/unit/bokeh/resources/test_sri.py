# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
import pytest  # noqa isort:skip

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import re

# External imports
from packaging.version import Version as V

# Bokeh imports
from bokeh import __version__

# Module under test
import bokeh.resources.sri as sri  # isort:skip

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

VERSION_PAT = re.compile(r"^(\d+\.\d+\.\d+)$")

class TestSRIHashes(object):
    def test_get_all_hashes_valid_format(self) -> None:
        all_hashes = sri.get_all_sri_hashes()
        for key, value in all_hashes.items():
            assert VERSION_PAT.match(key), f"{key} is not a valid version for the SRI hashes dict"
            assert isinstance(value, dict)
            assert len(value)
            assert f"bokeh-{key}.js" in value
            assert f"bokeh-{key}.min.js" in value
            for h in value.values():
                assert len(h) == 64

    def test_get_all_hashes_copies(self) -> None:
        ah1 = sri.get_all_sri_hashes()
        ah2 = sri.get_all_sri_hashes()
        assert ah1 == ah2 == sri._SRI_HASHES
        assert ah1 is not ah2
        assert ah1 is not sri._SRI_HASHES
        assert ah2 is not sri._SRI_HASHES

    # TODO: (bev) conda build on CI is generating bogus versions like "0+untagged.1.g19dd2c8"
    @pytest.mark.skip
    def test_get_all_hashes_no_future_keys(self) -> None:
        current = V(__version__.split("-", 1)[0])  # remove git hash, "-dirty", etc
        all_hashes = sri.get_all_sri_hashes()
        for key in all_hashes:
            assert (
                V(key) < current
            ), f"SRI hash dict contains vesion {key} which is newer than current version {__version__}"

    def test_get_sri_hashes_for_version(self) -> None:
        all_hashes = sri.get_all_sri_hashes()
        for key, value in all_hashes.items():
            h = sri.get_sri_hashes_for_version(key)
            assert h == all_hashes[key]
