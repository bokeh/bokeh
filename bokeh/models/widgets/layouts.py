
### Deprecation note:
### bokeh.models.widgets.layouts has been deprecated in 0.11.1 in favor of
### bokeh.models.layouts and is awaiting removal. The following imports will
### allow layouts to be imported from bokeh.models.widgets during the
### deprecation cycle, but doing so will raise a warning.

from bokeh.util.deprecate import deprecated_module
deprecated_module(
    'bokeh.models.widgets.layouts',
    '0.11.1',
    'use bokeh.models.layouts instead')
del deprecated_module

from ..layouts import * # NOQA
