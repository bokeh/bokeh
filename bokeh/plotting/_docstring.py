#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from inspect import Parameter

# Bokeh imports
from ..models import Marker

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'generate_docstring',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def generate_docstring(glyphclass, parameters, extra_docs):
    return f""" {_docstring_header(glyphclass)}

Args:
{_docstring_args(parameters)}

Keyword args:
{_docstring_kwargs(parameters)}

{_docstring_other()}

It is also possible to set the color and alpha parameters of extra glyphs for
selection, nonselection, hover, or muted. To do so, add the relevane prefix to
any visual parameter. For example, pass ``nonselection_alpha`` to set the line
and fill alpha for nonselect, or ``hover_fill_alpha`` to set the fill alpha for
hover. See the `Glyphs`_ section od the User's Guide for full details.

.. _Glyphs: https://docs.bokeh.org/en/latest/docs/user_guide/styling.html#glyphs

Returns:
    :class:`~bokeh.models.renderers.GlyphRenderer`

{_docstring_extra(extra_docs)}
"""

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _add_arglines(arglines, param, typ, doc):
    default = param.default if param.default != Parameter.empty else None

    # add a line for the arg
    arglines.append(f"    {param.name} ({typ}{', optional' if default else ''}):")

    # add the docs for the argument
    if doc:
        arglines += [f"    {x}" for x in doc.rstrip().strip("\n").split("\n")]

    # if there is a default, add it last
    if default is not None:
        arglines.append(f"\n        (default: {default})")

    # blank line between args
    arglines.append("")

def _docstring_args(parameters):
    arglines = []
    for param, typ, doc in (x for x in parameters if x[0].kind == Parameter.POSITIONAL_OR_KEYWORD):
        _add_arglines(arglines, param, typ, doc)
    return "\n".join(arglines)

def _docstring_extra(extra_docs):
    return "" if extra_docs is None else extra_docs

def _docstring_header(glyphclass):
    glyph_class = "Scatter" if issubclass(glyphclass, Marker) else glyphclass.__name__
    return f"Configure and add :class:`~bokeh.models.glyphs.{glyph_class}` glyphs to this Figure."

def _docstring_kwargs(parameters):
    arglines = []
    for param, typ, doc in (x for x in parameters if x[0].kind == Parameter.KEYWORD_ONLY):
        _add_arglines(arglines, param, typ, doc)
    return "\n".join(arglines)

def _docstring_other():
    # XXX (bev) this should be automated with and Options class
    return _OTHER_PARAMS

_OTHER_PARAMS = """
Other Parameters:
    alpha (float, optional) :
        An alias to set all alpha keyword arguments at once. (default: None)

        Alpha values must be between 0 (fully transparent) and 1 (fully opaque).

        Any explicitly set values for ``line_alpha``, etc. will override this
        setting.

    color (Color, optional) :
        An alias to set all color keyword arguments at once. (default: None)

        Acceptable values for colors are described in the `Specifying Colors`_
        section of the User's Guide.

        Any explicitly set values for ``line_color``, etc. will override this
        setting.

        .. _Specifying Colors: https://docs.bokeh.org/en/latest/docs/user_guide/styling.html#specifying-colors

    legend_field (str, optional) :
        Specify that the glyph should produce multiple legend entried by
        `Grouping in the Browser`_. The value of this parameter is the name of a
        column in the data source that should be used or the grouping.

        The grouping is performed *in JavaScript*, at the time time the Bokeh
        content is rendered in the browser. If the data is subsequently updated,
        the legend will automatically re-group.

        .. note::
            Only one of ``legend_field``, ``legend_group``, or ``legend_label``
            should be supplied

        .. _Grouping in the Browser: https://docs.bokeh.org/en/latest/docs/user_guide/annotations.html#automatic-grouping-browser

    legend_group (str, optional) :
        Specify that the glyph should produce multiple legend entried by
        `Grouping in Python`_. The value of this parameter is the name of a
        column in the data source that should be used or the grouping.

        The grouping is performed in Python, before the Bokeh output is sent to
        a browser. If the date is subsequently updated, the legend will *not*
        automatically re-group.

        .. note::
            Only one of ``legend_field``, ``legend_group``, or ``legend_label``
            should be supplied

        .. _Grouping in Python: https://docs.bokeh.org/en/latest/docs/user_guide/annotations.html#automatic-grouping-python

    legend_label (str, optional) :
        Specify that the glyph should produce a single `Basic Legend Label`_ in
        the legend. The legend entry is labeled with exactly the text supplied
        here.

        .. note::
            Only one of ``legend_field``, ``legend_group``, or ``legend_label``
            should be supplied

        .. _Basic Legend Label: https://docs.bokeh.org/en/latest/docs/user_guide/annotations.html#basic-legend-label

    muted (bool, optionall) :
        Whether the glyph should be rendered as muted (default: False)

        For this to be useful, an ``muted_glyph`` must be configured on the
        returned ``GlyphRender``. This can be done by explicitly creating a
        ``Glyph`` to use, or more simply by passing e.g. ``muted_color``, etc.
        to this glyph function.

    name (str, optional) :
        An optional user-supplied name to attach to the renderer (default: None)

        Bokeh does not use this value in any way, but it may be useful for
        searching a Bokeh document to find a specific model.

    source (ColumnDataSource, optional) :
        A user-supplied data source. (defatult: None)

        If not supplied, Bokeh will automatically construct an internal
        ``ColumnDataSource`` with default column names from the coordinates and
        other arguments that were passed-in as literal list or array values.

        If supplied, Bokeh will use the supplied data source to drive the glyph.
        In this case, literal list or arrays may not be used for coordinates or
        other arguments. Only singular fixed valued (e.g. ``x=10``) or column
        names in the data souce (e.g. ``x="time"``) are permitted.

    view (CDSView, optional) :
        A view for filtering the data source. (default: None)

    visible (bool, optional) :
        Whether the glyph should be rendered. (default: True)

    x_range_name (str, optional) :
        The name of an extra range to use for mapping x-coordinates.
        (default: None)

        If not supplied, then the default ``y_range`` of the plot will be used
        for coordinate mapping.

    y_range_name (str, optional) :
        The name of an extra range to use for mapping y-coordinates.
        (default: None)

        If not supplied, then the default ``y_range`` of the plot will be used
        for coordinate mapping.

    level (RenderLevel, optional) :
        Specify the render level order for this glyph.

"""

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
