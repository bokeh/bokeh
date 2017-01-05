### Deprecation note:
### bokeh.models.widgets.layouts has been deprecated in 0.11.1 in favor of
### bokeh.models.layouts and is awaiting removal. The following imports will
### allow layouts to be imported from bokeh.models.widgets during the
### deprecation cycle, but doing so will raise a warning.

from bokeh.util.deprecation import deprecated
deprecated((0, 11, 1), 'bokeh.models.widgets.layouts', 'bokeh.models.layouts')
del deprecated

from ..layouts import * # NOQA
