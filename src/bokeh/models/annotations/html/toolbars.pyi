# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...tools import Toolbar
from .html_annotation import HTMLAnnotation

@dataclass
class ToolbarPanel(HTMLAnnotation):

    toolbar: Toolbar = ...
