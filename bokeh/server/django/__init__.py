import six

if six.PY2:
    raise ImportError("bokeh.server.django requires Python 3.x")

from bokeh.util.dependencies import import_required

import_required("django", "django is required by bokeh.server.django")
import_required("channels", "The package channels is required by bokeh.server.django. "
                            "and must be installed'")

from .apps import DjangoBokehConfig
default_app_config = "bokeh.server.django.DjangoBokehConfig"

from .routing import document, autoload, directory
