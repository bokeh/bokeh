from __future__ import absolute_import

import unittest
import numpy as np

from bokeh.util.image import convert_gray_to_bokehrbga, convert_rgb_to_bokehrbga

class TestConvertRgbToBokehRgba(unittest.TestCase):
    def test_basic(self):
        img = np.ones((10, 100, 3), dtype=np.uint8)
        img_converted = convert_rgb_to_bokehrbga(img)

        assert(img_converted.dtype == np.uint32)
        assert(img_converted.shape == (10, 100))
        view = img_converted.view(dtype=np.uint8).reshape((10, 100, 4))

        assert(np.all(view[:, :, 3] == 255))  # no alpha

        assert(np.all(view[:, :, 0] == img[:, :, 0])) # same red
        assert(np.all(view[:, :, 1] == img[:, :, 1])) # same green
        assert(np.all(view[:, :, 2] == img[:, :, 2])) # same blue

class TestConvertRgbToBokehRgba(unittest.TestCase):
    def test_basic(self):
        img = np.ones((10, 100), dtype=np.uint8)

        img[0, 0] = 255
        img[-1, -1] = 0

        img_converted = convert_gray_to_bokehrbga(img)

        assert(img_converted.dtype == np.uint32)
        assert(img_converted.shape == (10, 100))

        view = img_converted.view(dtype=np.uint8).reshape((10, 100, 4))
        assert(np.all(view[:, :, 3] == 255))  # no alpha

        assert(view[0, 0, 0] == 255)
        assert(view[0, 0, 1] == 255)
        assert(view[0, 0, 2] == 255)

        assert(view[-1, -1, 0] == 0)
        assert(view[-1, -1, 1] == 0)
        assert(view[-1, -1, 2] == 0)


if __name__ == "__main__":
    unittest.main()
