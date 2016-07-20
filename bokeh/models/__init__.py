from __future__ import absolute_import

# This file is excluded from flake8 checking in setup.cfg

### Deprecation note:
### bokeh.models.annotations.Legend was deprecated in 0.12.1 in favor of
### bokeh.models.guides.Legend and is awaiting removal. This following Imports
### will load all of the annotations except Legend (which is imported into
### that modules for backwards compatibility) in order to prevent raising
### a deprecation warning
from .annotations import (
    Arrow, BoxAnnotation, Label, LabelSet, PolyAnnotation, Span, Title, Tooltip
)
from .arrow_heads import *
from .axes import *
from .callbacks import *
from .formatters import *
from .glyphs import *
from .grids import *
from .guides import *
from .layouts import *
from .images import *
from .map_plots import *
from .markers import *
from .mappers import *
from .plots import *
from .ranges import *
from .renderers import *
from .sources import *
from .tickers import *
from .tiles import *
from .tools import *
from .transforms import *

### Deprecation note:
### bokeh.models.widgets.layouts was deprecated in 0.11.1 in favor of
### bokeh.models.layouts and is awaiting removal. The following imports will
### load all widgets modules except layouts, in order to prevent raising a
### deprecation warning.

from .widgets.buttons import *
from .widgets.dialogs import *
from .widgets.groups import *
from .widgets.icons import *
from .widgets.inputs import *
from .widgets.markups import *
from .widgets.panels import *
from .widgets.tables import *
from .widgets.widget import *
