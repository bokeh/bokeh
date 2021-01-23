#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide properties for various visual attrributes.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import base64
import datetime  # lgtm [py/import-and-import-from]
import re
from io import BytesIO

# External imports
import PIL.Image

# Bokeh imports
from ...util.serialization import convert_datetime_type
from .. import enums
from .auto import Auto
from .bases import Property
from .container import Seq, Tuple
from .datetime import Datetime, TimeDelta
from .either import Either
from .enum import Enum
from .nullable import Nullable
from .numeric import Float, Int
from .primitive import String
from .string import Regex

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DashPattern',
    'FontSize',
    'HatchPatternType',
    'Image',
    'MinMaxBounds',
    'MarkerType',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class DashPattern(Either):
    """ Accept line dash specifications.

    Express patterns that describe line dashes.  ``DashPattern`` values
    can be specified in a variety of ways:

    * An enum: "solid", "dashed", "dotted", "dotdash", "dashdot"
    * a tuple or list of integers in the `HTML5 Canvas dash specification style`_.
      Note that if the list of integers has an odd number of elements, then
      it is duplicated, and that duplicated list becomes the new dash list.

    To indicate that dashing is turned off (solid lines), specify the empty
    list [].

    .. _HTML5 Canvas dash specification style: http://www.w3.org/html/wg/drafts/2dcontext/html5_canvas/#dash-list

    """

    _dash_patterns = {
        "solid": [],
        "dashed": [6],
        "dotted": [2,4],
        "dotdash": [2,4,6,4],
        "dashdot": [6,4,2,4],
    }

    def __init__(self, default=[], help=None):
        types = Enum(enums.DashPattern), Regex(r"^(\d+(\s+\d+)*)?$"), Seq(Int)
        super().__init__(*types, default=default, help=help)

    def __str__(self):
        return self.__class__.__name__

    def transform(self, value):
        value = super().transform(value)

        if isinstance(value, str):
            try:
                return self._dash_patterns[value]
            except KeyError:
                return [int(x) for x in  value.split()]
        else:
            return value

    def _sphinx_type(self):
        return self._sphinx_prop_link()

class FontSize(String):

    _font_size_re = re.compile(r"^[0-9]+(.[0-9]+)?(%|em|ex|ch|ic|rem|vw|vh|vi|vb|vmin|vmax|cm|mm|q|in|pc|pt|px)$", re.I)

    def validate(self, value, detail=True):
        super().validate(value, detail)

        if isinstance(value, str):
            if len(value) == 0:
                msg = "" if not detail else "empty string is not a valid font size value"
                raise ValueError(msg)
            elif not self._font_size_re.match(value):
                msg = "" if not detail else f"{value!r} is not a valid font size value"
                raise ValueError(msg)

class HatchPatternType(Either):
    """ Accept built-in fill hatching specifications.

    Accepts either "long" names, e.g. "horizontal-wave" or the single letter
    abbreviations, e.g. "v"

    """

    def __init__(self, default=[], help=None):
        types = Enum(enums.HatchPattern), Enum(enums.HatchPatternAbbreviation)
        super().__init__(*types, default=default, help=help)

    def __str__(self):
        return self.__class__.__name__

    def _sphinx_type(self):
        return self._sphinx_prop_link()

class Image(Property):
    """ Accept image file types, e.g PNG, JPEG, TIFF, etc.

    This property can be configured with:

    * A string filename to be loaded with ``PIL.Image.open``
    * An RGB(A) NumPy array, will be converted to PNG
    * A ``PIL.Image.Image`` object

    In all cases, the image data is serialized as a Base64 encoded string.

    """

    def validate(self, value, detail=True):
        import numpy as np

        if isinstance(value, (str, PIL.Image.Image)):
            return

        if isinstance(value, np.ndarray):
            if value.dtype == "uint8" and len(value.shape) == 3 and value.shape[2] in (3, 4):
                return

        msg = "" if not detail else f"invalid value: {value!r}; allowed values are string filenames, PIL.Image.Image instances, or RGB(A) NumPy arrays"
        raise ValueError(msg)

    def transform(self, value):
        import numpy as np
        if isinstance(value, np.ndarray):
            value = PIL.Image.fromarray(value)

        if isinstance(value, str):
            value = PIL.Image.open(value)

        if isinstance(value, PIL.Image.Image):
            out = BytesIO()
            fmt = value.format or "PNG"
            value.save(out, fmt)
            encoded = base64.b64encode(out.getvalue()).decode('ascii')
            return f"data:image/{fmt.lower()};base64,{encoded}"

        raise ValueError(f"Could not transform {value!r}")

class MinMaxBounds(Either):
    """ Accept (min, max) bounds tuples for use with Ranges.

    Bounds are provided as a tuple of ``(min, max)`` so regardless of whether your range is
    increasing or decreasing, the first item should be the minimum value of the range and the
    second item should be the maximum. Setting min > max will result in a ``ValueError``.

    Setting bounds to None will allow your plot to pan/zoom as far as you want. If you only
    want to constrain one end of the plot, you can set min or max to
    ``None`` e.g. ``DataRange1d(bounds=(None, 12))`` """

    def __init__(self, accept_datetime=False, default='auto', help=None):
        types = (
            Auto,

            Tuple(Float, Float),
            Tuple(Nullable(Float), Float),
            Tuple(Float, Nullable(Float)),

            Tuple(TimeDelta, TimeDelta),
            Tuple(Nullable(TimeDelta), TimeDelta),
            Tuple(TimeDelta, Nullable(TimeDelta)),
        )
        if accept_datetime:
            types = types + (
                Tuple(Datetime, Datetime),
                Tuple(Nullable(Datetime), Datetime),
                Tuple(Datetime, Nullable(Datetime)),
            )
        super().__init__(*types, default=default, help=help)

    def validate(self, value, detail=True):
        super().validate(value, detail)

        if value[0] is None or value[1] is None:
            return

        value = list(value)

        # make sure the values are timestamps for comparison
        if isinstance(value[0], datetime.datetime):
            value[0] = convert_datetime_type(value[0])

        if isinstance(value[1], datetime.datetime):
            value[1] = convert_datetime_type(value[1])

        if value[0] < value[1]:
            return

        msg = "" if not detail else "Invalid bounds: maximum smaller than minimum. Correct usage: bounds=(min, max)"
        raise ValueError(msg)

    def _sphinx_type(self):
        return self._sphinx_prop_link()

class MarkerType(Enum):
    """

    """
    def __init__(self, **kw):
        super().__init__(enums.MarkerType, **kw)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
