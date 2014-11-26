from __future__ import absolute_import

from .deprecate import deprecated_module
deprecated_module(__name__, "0.7.0", "use bokeh.models.widgets instead")

from .models.widget import Widget
from .models.widgets import *
