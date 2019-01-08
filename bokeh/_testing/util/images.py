#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide tools for testing Bokeh maipulating images.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from PIL import Image, ImageChops

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'image_diff',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def image_diff(diff_path, before_path, after_path, superimpose=False):
    """ Returns the percentage of differing pixels. """
    before = Image.open(before_path)
    after = Image.open(after_path)

    before = before.convert('RGBA')
    after = after.convert('RGBA')

    width = max(before.width, after.width)
    height = max(before.height, after.height)

    resized_before = Image.new("RGBA", (width, height), "white")
    resized_after = Image.new("RGBA", (width, height), "white")

    resized_before.paste(before)
    resized_after.paste(after)

    mask = ImageChops.difference(resized_before, resized_after)
    mask = mask.convert('L')
    mask = mask.point(lambda k: 0 if k == 0 else 255)

    if mask.getbbox() is None:
        return 0
    else:
        diff = mask.convert('RGB')
        if superimpose:
            diff.paste(resized_after, mask=mask)
        else:
            diff.paste((0, 0, 255), mask=mask)
        diff.save(diff_path)

        pixels = 0

        for v in mask.getdata():
            if v == 255:
                pixels += 1

        return float(pixels)/(width*height)*100

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

logging.getLogger('PIL.PngImagePlugin').setLevel(logging.INFO)
