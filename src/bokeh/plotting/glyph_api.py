#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ..models import glyphs
from ..util.deprecation import deprecated
from ._decorators import glyph_method, marker_method

if TYPE_CHECKING:
    from ..models.coordinates import CoordinateMapping
    from ..models.plots import Plot
    from ..models.renderers import GlyphRenderer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "GlyphAPI",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class GlyphAPI:
    """ """

    @property
    def plot(self) -> Plot | None:
        return self._parent

    @property
    def coordinates(self) -> CoordinateMapping | None:
        return self._coordinates

    def __init__(self, parent: Plot | None = None, coordinates: CoordinateMapping | None = None) -> None:
        self._parent = parent
        self._coordinates = coordinates

    @glyph_method(glyphs.AnnularWedge)
    def annular_wedge(self, **kwargs: Any) -> GlyphRenderer:
        pass

    @glyph_method(glyphs.Annulus)
    def annulus(self, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.annulus(x=[1, 2, 3], y=[1, 2, 3], color="#7FC97F",
                     inner_radius=0.2, outer_radius=0.5)

        show(plot)

"""

    @glyph_method(glyphs.Arc)
    def arc(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        pass

    @marker_method()
    def asterisk(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.asterisk(x=[1,2,3], y=[1,2,3], size=20, color="#F0027F")

        show(plot)

"""

    @glyph_method(glyphs.Bezier)
    def bezier(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        pass

    @glyph_method(glyphs.Circle)
    def _circle(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        pass

    def circle(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """ Configure and add :class:`~bokeh.models.glyphs.Circle` glyphs to this figure.

        Args:
            x (str or seq[float]) : values or field names of center x coordinates

            y (str or seq[float]) : values or field names of center y coordinates

            radius (str or list[float]) : values or field names of radii in |data units|

            color (color value, optional): shorthand to set both fill and line color

            source (:class:`~bokeh.models.sources.ColumnDataSource`) : a user-supplied data source.
                An attempt will be made to convert the object to :class:`~bokeh.models.sources.ColumnDataSource`
                if needed. If none is supplied, one is created for the user automatically.

            **kwargs: |line properties| and |fill properties|

        Examples:

            .. code-block:: python

                from bokeh.plotting import figure, show

                plot = figure(width=300, height=300)
                plot.circle(x=[1, 2, 3], y=[1, 2, 3], radius=0.2)

                show(plot)

        """
        if "size" in kwargs:
            deprecated((3, 4, 0), "circle() method with size value", "scatter(size=...) instead")
            if "radius" in kwargs:
                raise ValueError("can only provide one of size or radius")
            return self.scatter(*args, **kwargs)
        else:
            return self._circle(*args, **kwargs)

    @glyph_method(glyphs.Block)
    def block(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.block(x=[1, 2, 3], y=[1,2,3], width=0.5, height=1, , color="#CAB2D6")

        show(plot)

"""

    @marker_method()
    def circle_cross(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.circle_cross(x=[1,2,3], y=[4,5,6], size=20,
                          color="#FB8072", fill_alpha=0.2, line_width=2)

        show(plot)

"""

    @marker_method()
    def circle_dot(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.circle_dot(x=[1,2,3], y=[4,5,6], size=20,
                        color="#FB8072", fill_color=None)

        show(plot)

"""

    @marker_method()
    def circle_x(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.circle_x(x=[1, 2, 3], y=[1, 2, 3], size=20,
                      color="#DD1C77", fill_alpha=0.2)

        show(plot)

"""

    @marker_method()
    def circle_y(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.circle_y(x=[1, 2, 3], y=[1, 2, 3], size=20,
                      color="#DD1C77", fill_alpha=0.2)

        show(plot)

"""

    @marker_method()
    def cross(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.cross(x=[1, 2, 3], y=[1, 2, 3], size=20,
                   color="#E6550D", line_width=2)

        show(plot)

"""

    @marker_method()
    def dash(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.dash(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                  color="#99D594", line_width=2)

        show(plot)

"""

    @marker_method()
    def diamond(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.diamond(x=[1, 2, 3], y=[1, 2, 3], size=20,
                     color="#1C9099", line_width=2)

        show(plot)

"""

    @marker_method()
    def diamond_cross(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.diamond_cross(x=[1, 2, 3], y=[1, 2, 3], size=20,
                           color="#386CB0", fill_color=None, line_width=2)

        show(plot)

"""

    @marker_method()
    def diamond_dot(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.diamond_dot(x=[1, 2, 3], y=[1, 2, 3], size=20,
                         color="#386CB0", fill_color=None)

        show(plot)

"""

    @marker_method()
    def dot(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.dot(x=[1, 2, 3], y=[1, 2, 3], size=20, color="#386CB0")

        show(plot)

"""

    @glyph_method(glyphs.HArea)
    def harea(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.harea(x1=[0, 0, 0], x2=[1, 4, 2], y=[1, 2, 3],
                   fill_color="#99D594")

        show(plot)

"""

    @glyph_method(glyphs.HAreaStep)
    def harea_step(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.harea_step(x1=[1, 2, 3], x2=[0, 0, 0], y=[1, 4, 2],
                        step_mode="after", fill_color="#99D594")

        show(plot)

"""

    @glyph_method(glyphs.HBar)
    def hbar(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.hbar(y=[1, 2, 3], height=0.5, left=0, right=[1,2,3], color="#CAB2D6")

        show(plot)

"""

    @glyph_method(glyphs.HSpan)
    def hspan(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300, x_range=(0, 1))
        plot.hspan(y=[1, 2, 3], color="#CAB2D6")

        show(plot)

"""

    @glyph_method(glyphs.HStrip)
    def hstrip(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300, x_range=(0, 1))
        plot.hstrip(y0=[1, 2, 5], y1=[3, 4, 8], color="#CAB2D6")

        show(plot)

"""

    @glyph_method(glyphs.Ellipse)
    def ellipse(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.ellipse(x=[1, 2, 3], y=[1, 2, 3], width=30, height=20,
                     color="#386CB0", fill_color=None, line_width=2)

        show(plot)

"""

    @marker_method()
    def hex(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.hex(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,30], color="#74ADD1")

        show(plot)

"""

    @marker_method()
    def hex_dot(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.hex_dot(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,30],
                     color="#74ADD1", fill_color=None)

        show(plot)

"""

    @glyph_method(glyphs.HexTile)
    def hex_tile(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300, match_aspect=True)
        plot.hex_tile(r=[0, 0, 1], q=[1, 2, 2], fill_color="#74ADD1")

        show(plot)

"""

    @glyph_method(glyphs.Image)
    def image(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
.. note::
    If both ``palette`` and ``color_mapper`` are passed, a ``ValueError``
    exception will be raised. If neither is passed, then the ``Greys9``
    palette will be used as a default.

"""

    @glyph_method(glyphs.ImageRGBA)
    def image_rgba(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
.. note::
    The ``image_rgba`` method accepts images as a two-dimensional array of RGBA
    values (encoded as 32-bit integers).

"""

    @glyph_method(glyphs.ImageStack)
    def image_stack(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        pass

    @glyph_method(glyphs.ImageURL)
    def image_url(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        pass

    @marker_method()
    def inverted_triangle(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.inverted_triangle(x=[1, 2, 3], y=[1, 2, 3], size=20, color="#DE2D26")

        show(plot)

"""

    @glyph_method(glyphs.Line)
    def line(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        p = figure(title="line", width=300, height=300)
        p.line(x=[1, 2, 3, 4, 5], y=[6, 7, 2, 4, 5])

        show(p)

"""

    @glyph_method(glyphs.MathMLGlyph)
    def mathml(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, show

        p = figure(width=300, height=300)
        p.mathml(x=[0], y=[0], text=['''
          <math display="block">
            <mrow>
              <msup>
                <mi>x</mi>
                <mn>2</mn>
              </msup>
              <msup>
                <mi>y</mi>
                <mn>2</mn>
              </msup>
            </mrow>
          </math>
        '''])

        show(p)

"""

    @glyph_method(glyphs.MultiLine)
    def multi_line(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
.. note::
    For this glyph, the data is not simply an array of scalars, it is an
    "array of arrays".

Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        p = figure(width=300, height=300)
        p.multi_line(xs=[[1, 2, 3], [2, 3, 4]], ys=[[6, 7, 2], [4, 5, 7]],
                    color=['red','green'])

        show(p)

"""

    @glyph_method(glyphs.MultiPolygons)
    def multi_polygons(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
.. note::
    For this glyph, the data is not simply an array of scalars, it is a
    nested array.

Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        p = figure(width=300, height=300)
        p.multi_polygons(xs=[[[[1, 1, 2, 2]]], [[[1, 1, 3], [1.5, 1.5, 2]]]],
                        ys=[[[[4, 3, 3, 4]]], [[[1, 3, 1], [1.5, 2, 1.5]]]],
                        color=['red', 'green'])
        show(p)

"""

    @glyph_method(glyphs.Patch)
    def patch(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        p = figure(width=300, height=300)
        p.patch(x=[1, 2, 3, 2], y=[6, 7, 2, 2], color="#99d8c9")

        show(p)

"""

    @glyph_method(glyphs.Patches)
    def patches(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
.. note::
    For this glyph, the data is not simply an array of scalars, it is an
    "array of arrays".

Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        p = figure(width=300, height=300)
        p.patches(xs=[[1,2,3],[4,5,6,5]], ys=[[1,2,1],[4,5,5,4]],
                  color=["#43a2ca", "#a8ddb5"])

        show(p)

"""

    @marker_method()
    def plus(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.plus(x=[1, 2, 3], y=[1, 2, 3], size=20, color="#DE2D26")

        show(plot)

"""

    @glyph_method(glyphs.Quad)
    def quad(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.quad(top=[2, 3, 4], bottom=[1, 2, 3], left=[1, 2, 3],
                  right=[1.2, 2.5, 3.7], color="#B3DE69")

        show(plot)

"""

    @glyph_method(glyphs.Quadratic)
    def quadratic(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        pass

    @glyph_method(glyphs.Ray)
    def ray(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.ray(x=[1, 2, 3], y=[1, 2, 3], length=45, angle=-0.7, color="#FB8072",
                line_width=2)

        show(plot)

"""

    @glyph_method(glyphs.Rect)
    def rect(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.rect(x=[1, 2, 3], y=[1, 2, 3], width=10, height=20, color="#CAB2D6",
                  width_units="screen", height_units="screen")

        show(plot)

    .. warning::
        ``Rect`` glyphs are not well defined on logarithmic scales. Use
        :class:`~bokeh.models.Block` or :class:`~bokeh.models.Quad` glyphs
        instead.

"""

    @glyph_method(glyphs.Step)
    def step(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.step(x=[1, 2, 3, 4, 5], y=[1, 2, 3, 2, 5], color="#FB8072")

        show(plot)

"""

    @glyph_method(glyphs.Segment)
    def segment(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.segment(x0=[1, 2, 3], y0=[1, 2, 3],
                     x1=[1, 2, 3], y1=[1.2, 2.5, 3.7],
                     color="#F4A582", line_width=3)

        show(plot)

"""

    @marker_method()
    def square(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.square(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,30], color="#74ADD1")

        show(plot)

"""

    @marker_method()
    def square_cross(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.square_cross(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                          color="#7FC97F",fill_color=None, line_width=2)

        show(plot)

"""

    @marker_method()
    def square_dot(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.square_dot(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                        color="#7FC97F", fill_color=None)

        show(plot)

"""

    @marker_method()
    def square_pin(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.square_pin(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                        color="#7FC97F",fill_color=None, line_width=2)

        show(plot)

"""

    @marker_method()
    def square_x(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.square_x(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                      color="#FDAE6B",fill_color=None, line_width=2)

        show(plot)

"""

    @marker_method()
    def star(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.star(x=[1, 2, 3], y=[1, 2, 3], size=20,
                  color="#1C9099", line_width=2)

        show(plot)

"""

    @marker_method()
    def star_dot(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.star_dot(x=[1, 2, 3], y=[1, 2, 3], size=20,
                      color="#386CB0", fill_color=None, line_width=2)

        show(plot)

"""

    @glyph_method(glyphs.TeXGlyph)
    def tex(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, show

        p = figure(width=300, height=300)
        p.tex(x=[0], y=[0], text=["x^2 y^2])

        show(p)

"""

    @glyph_method(glyphs.Text)
    def text(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
.. note::
    The location and angle of the text relative to the ``x``, ``y`` coordinates
    is indicated by the alignment and baseline text properties.

"""

    @marker_method()
    def triangle(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.triangle(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                      color="#99D594", line_width=2)

        show(plot)

"""

    @marker_method()
    def triangle_dot(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.triangle_dot(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                          color="#99D594", fill_color=None)

        show(plot)

"""

    @marker_method()
    def triangle_pin(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.triangle_pin(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                      color="#99D594", line_width=2)

        show(plot)

"""

    @glyph_method(glyphs.VArea)
    def varea(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.varea(x=[1, 2, 3], y1=[0, 0, 0], y2=[1, 4, 2],
                   fill_color="#99D594")

        show(plot)

"""

    @glyph_method(glyphs.VAreaStep)
    def varea_step(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.varea_step(x=[1, 2, 3], y1=[0, 0, 0], y2=[1, 4, 2],
                        step_mode="after", fill_color="#99D594")

        show(plot)

"""

    @glyph_method(glyphs.VBar)
    def vbar(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.vbar(x=[1, 2, 3], width=0.5, bottom=0, top=[1,2,3], color="#CAB2D6")

        show(plot)

"""

    @glyph_method(glyphs.VSpan)
    def vspan(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300, y_range=(0, 1))
        plot.vspan(x=[1, 2, 3], color="#CAB2D6")

        show(plot)

"""

    @glyph_method(glyphs.VStrip)
    def vstrip(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300, y_range=(0, 1))
        plot.vstrip(x0=[1, 2, 5], x1=[3, 4, 8], color="#CAB2D6")

        show(plot)

"""

    @glyph_method(glyphs.Wedge)
    def wedge(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.wedge(x=[1, 2, 3], y=[1, 2, 3], radius=15, start_angle=0.6,
                   end_angle=4.1, radius_units="screen", color="#2b8cbe")

        show(plot)

"""

    @marker_method()
    def x(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.x(x=[1, 2, 3], y=[1, 2, 3], size=[10, 20, 25], color="#fa9fb5")

        show(plot)

"""

    @marker_method()
    def y(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        """
Examples:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

        plot = figure(width=300, height=300)
        plot.y(x=[1, 2, 3], y=[1, 2, 3], size=20, color="#DE2D26")

        show(plot)

"""

    # -------------------------------------------------------------------------

    @glyph_method(glyphs.Scatter)
    def _scatter(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        pass

    def scatter(self, *args: Any, **kwargs: Any) -> GlyphRenderer:
        ''' Creates a scatter plot of the given x and y items.

        Args:
            x (str or seq[float]) : values or field names of center x coordinates

            y (str or seq[float]) : values or field names of center y coordinates

            size (str or list[float]) : values or field names of sizes in |screen units|

            marker (str, or list[str]): values or field names of marker types

            color (color value, optional): shorthand to set both fill and line color

            source (:class:`~bokeh.models.sources.ColumnDataSource`) : a user-supplied data source.
                An attempt will be made to convert the object to :class:`~bokeh.models.sources.ColumnDataSource`
                if needed. If none is supplied, one is created for the user automatically.

            **kwargs: |line properties| and |fill properties|

        Examples:

            >>> p.scatter([1,2,3],[4,5,6], marker="square", fill_color="red")
            >>> p.scatter("data1", "data2", marker="mtype", source=data_source, ...)

        .. note::
            ``Scatter`` markers with multiple marker types may be drawn in a
            different order when using the WebGL output backend. This is an explicit
            trade-off made in the interests of performance.

        '''
        marker_type = kwargs.pop("marker", "circle")

        if isinstance(marker_type, str) and marker_type in _MARKER_SHORTCUTS:
            marker_type = _MARKER_SHORTCUTS[marker_type]

        if marker_type == "circle" and "radius" in kwargs:
            deprecated((3, 4, 0), "scatter(radius=...)", "circle(radius=...) instead")
            if "size" in kwargs:
                raise ValueError("can only provide one of size or radius")
            return self.circle(*args, **kwargs)
        else:
            return self._scatter(*args, marker=marker_type, **kwargs)

_MARKER_SHORTCUTS = {
    "*"  : "asterisk",
    "+"  : "cross",
    "o"  : "circle",
    "o+" : "circle_cross",
    "o." : "circle_dot",
    "ox" : "circle_x",
    "oy" : "circle_y",
    "-"  : "dash",
    "."  : "dot",
    "v"  : "inverted_triangle",
    "^"  : "triangle",
    "^." : "triangle_dot",
}

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
