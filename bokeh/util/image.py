""" Functions useful for image manipulations
"""

import numpy as np


def convert_rgb_to_bokehrbga(img):
    """
    convert RGB image to two-dimensional array of RGBA values (encoded as 32-bit integers)

    Bokeh require rbga
    :param img: (N,M, 3) array (dtype = uint8)
    :return: (K, R, dtype=uint32) array
    """
    if img.dtype != np.uint8:
        raise NotImplementedError

    if img.ndim != 3:
        raise NotImplementedError

    bokeh_img = np.dstack([img, 255 * np.ones(img.shape[:2], np.uint8)])
    final_rgba_image = np.squeeze(bokeh_img.view(dtype=np.uint32))
    return final_rgba_image


def convert_gray_to_bokehrbga(img):
    """
    convert grayscale image to two-dimensional array of RGBA values (encoded as 32-bit integers)

    :param img: (N,M) array (dtype = uint8)
    :return: (K, R, dtype=uint32) array
    """
    if img.dtype != np.uint8:
        raise NotImplementedError

    if img.ndim != 2:
        raise NotImplementedError

    bokeh_img = np.expand_dims(img, img.ndim)
    bokeh_img = np.concatenate([bokeh_img]*3, axis=-1)
    return convert_rgb_to_bokehrbga(bokeh_img)

