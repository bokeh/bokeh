from numpy.testing import assert_allclose, assert_equal
import matplotlib.pyplot as plt
from .. import utils


def test_path_data():
    circle = plt.Circle((0, 0), 1)
    vertices, codes = utils.SVG_path(circle.get_path())

    assert_allclose(vertices.shape, (25, 2))
    assert_equal(codes, ['M', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'Z'])
