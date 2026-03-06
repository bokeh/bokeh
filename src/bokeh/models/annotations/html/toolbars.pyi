#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...tools import Toolbar
from .html_annotation import HTMLAnnotation

@dataclass
class ToolbarPanel(HTMLAnnotation):

    toolbar: Toolbar = ...
