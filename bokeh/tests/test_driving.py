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
from numpy.testing import assert_allclose

# Bokeh imports
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.driving as bd

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'bounce',
    'cosine',
    'count',
    'force',
    'linear',
    'repeat',
    'sine',
)

def _collector(results):
    def foo(val):
        results.append(val)
    return foo

w = 0.3
A = 3
phi = 0.1
offset = 2

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bd, ALL)

def test_bounce():
    results = []
    func = bd.bounce([0, 1, 5, -1])(_collector(results))
    for i in range(8):
        func()
    assert results == [0, 1, 5, -1, -1, 5, 1, 0]

def test_cosine():
    results = []
    func = bd.cosine(w, A, phi, offset)(_collector(results))
    for i in range(4):
        func()
    assert_allclose(
        results,
        [4.985012495834077, 4.763182982008655, 4.294526561853465, 3.6209069176044197]
    )

def test_count():
    results = []
    func = bd.count()(_collector(results))
    for i in range(8):
        func()
    assert results == list(range(8))

def test_force():
    results = []
    seq = (x for x in ["foo", "bar", "baz"])
    w = bd.force(_collector(results), seq)
    w()
    assert results == ["foo"]
    w()
    assert results == ["foo", "bar"]
    w()
    assert results == ["foo", "bar", "baz"]

def test_linear():
    results = []
    func = bd.linear(m=2.5, b=3.7)(_collector(results))
    for i in range(4):
        func()
    assert_allclose(results, [3.7, 6.2, 8.7, 11.2])

def test_repeat():
    results = []
    func = bd.repeat([0, 1, 5, -1])(_collector(results))
    for i in range(8):
        func()
    assert results == [0, 1, 5, -1, 0, 1, 5, -1]

def test_sine():
    results = []
    func = bd.sine(w, A, phi, offset)(_collector(results))
    for i in range(4):
        func()
    assert_allclose(
        results,
        [2.2995002499404844, 3.1682550269259515, 3.932653061713073, 4.524412954423689]
    )

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__advance():
    results = []
    testf = _collector(results)
    s = bd._advance(testf)
    next(s)
    assert results == [0]
    next(s)
    assert results == [0, 1]
    next(s)
    assert results == [0, 1, 2]
    next(s)
    assert results == [0, 1, 2, 3]

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
