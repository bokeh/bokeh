#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..dom import DOMNode
from .ui_element import UIElement

@dataclass
class Pane(UIElement):

    elements: list[UIElement | DOMNode] = ...
