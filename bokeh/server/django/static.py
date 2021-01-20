#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import re

# External imports
from django.http import Http404
from django.urls import re_path
from django.views import static

# Bokeh imports
from bokeh.embed.bundle import extension_dirs

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def serve_extensions(request, path):
    root = extension_dirs

    try:
        name, artifact_path = path.split(os.sep, 1)
    except ValueError:
        raise Http404

    artifacts_dir = root.get(name, None)
    if artifacts_dir is not None:
        return static.serve(request, artifact_path, document_root=artifacts_dir)
    else:
        raise Http404

def static_extensions(prefix: str = "/static/extensions/"):
    return [re_path(r'^%s(?P<path>.*)$' % re.escape(prefix.lstrip('/')), serve_extensions)]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
