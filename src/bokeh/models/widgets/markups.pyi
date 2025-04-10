#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...core.has_props import abstract
from .widget import Widget

@abstract
@dataclass(init=False)
class Markup(Widget):

    text: str = ...

    disable_math: bool = ...

@dataclass
class Paragraph(Markup):
    ...

@dataclass
class Div(Markup):

    render_as_text: bool = ...

@dataclass
class PreText(Paragraph):
    ...
