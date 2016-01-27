from __future__ import absolute_import

from bokeh.util.deprecate import deprecatedModuleAttribute

# This file is excluded from flake8 checking in setup.cfg

from .buttons import *
from .dialogs import *
from .groups import *
from .icons import *
from .inputs import *
from .markups import *
from .panels import *
from .tables import *
from .widget import *

# Deprecation for layouts imports from bokeh.models.widgets

from bokeh.models.layouts import *

for layout in [BaseBox, Layout, HBox, VBox, VBoxForm]:
    deprecatedModuleAttribute(
        "0.11.1",
        "use 'bokeh.models.%s' or 'bokeh.models.layouts.%s'" % (layout.__name__, layout.__name__),
        __name__,
        "%s" % (layout.__name__)
    )

del deprecatedModuleAttribute
