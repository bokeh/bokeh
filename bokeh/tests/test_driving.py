from numpy.testing import assert_allclose

import bokeh.driving as driving

def _collector(results):
    def foo(val):
        results.append(val)
    return foo

w = 0.3
A = 3
phi = 0.1
offset = 2

def test_sine_sequence_values():
    results = []
    func = driving.sine(w, A, phi, offset)(_collector(results))
    for i in range(4):
        func()
    assert_allclose(
        results,
        [2.2995002499404844, 3.1682550269259515, 3.932653061713073, 4.524412954423689]
    )

def test_cosine_sequence_values():
    results = []
    func = driving.cosine(w, A, phi, offset)(_collector(results))
    for i in range(4):
        func()
    assert_allclose(
        results,
        [4.985012495834077, 4.763182982008655, 4.294526561853465, 3.6209069176044197]
    )

def test_linear_sequence_values():
    results = []
    func = driving.linear(m=2.5, b=3.7)(_collector(results))
    for i in range(4):
        func()
    assert_allclose(results, [3.7, 6.2, 8.7, 11.2])

def test_bounce_sequence_values():
    results = []
    func = driving.bounce([0, 1, 5, -1])(_collector(results))
    for i in range(8):
        func()
    assert results == [0, 1, 5, -1, -1, 5, 1, 0]

def test_repeat_sequence_values():
    results = []
    func = driving.repeat([0, 1, 5, -1])(_collector(results))
    for i in range(8):
        func()
    assert results == [0, 1, 5, -1, 0, 1, 5, -1]

def test_count_sequence_values():
    results = []
    func = driving.count()(_collector(results))
    for i in range(8):
        func()
    assert results == list(range(8))
