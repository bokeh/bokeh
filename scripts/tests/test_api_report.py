from __future__ import absolute_import
import os
import pytest

from ..api_report import diff_versions


def test_working_pipeline():
    first = diff_versions("0.11.0", "0.12.0").split("\n")
    with open("scripts/tests/samples/sample_diff.txt") as f:
        second = f.read().split("\n")
    assert not set(first) - set(second)
