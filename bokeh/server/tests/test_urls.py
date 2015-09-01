from __future__ import absolute_import

import pytest

import bokeh.server.urls as urls

def test_endpoints():
    assert { endpoint for endpoint, handler in urls.patterns } == { '/ws' }