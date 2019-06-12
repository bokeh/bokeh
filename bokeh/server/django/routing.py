#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import re
from typing import Dict, List

# External imports
from django.conf.urls import url
from django.urls.resolvers import URLPattern
from channels.http import AsgiHandler

# Bokeh imports
from bokeh.server.contexts import ApplicationContext
from .consumers import DocConsumer, AutoloadJsConsumer, WSConsumer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'RoutingConfiguration',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class RoutingConfiguration(object):

    _http_urlpatterns: List[str] = []
    _websocket_urlpatterns: List[str] = []

    _prefix = None # "bokehapps"

    def __init__(self, app_contexts: Dict[str, ApplicationContext]):

        for app_name, app_context in app_contexts.items():
            self._add_new_routing(app_name, app_context)

    def get_http_urlpatterns(self) -> List[URLPattern]:
        return self._http_urlpatterns + [url(r"", AsgiHandler)]

    def get_websocket_urlpatterns(self) -> List[URLPattern]:
        return self._websocket_urlpatterns

    def _add_new_routing(self, app_name: str, app_context: ApplicationContext) -> None:
        kwargs = dict(app_context=app_context)

        def join(*components):
            return "/".join([ component.strip("/") for component in components if component ])

        def urlpattern(suffix=""):
            return r"^{}$".format(join(self._prefix or "", re.escape(app_name)) + suffix)

        self._http_urlpatterns.append(url(urlpattern("/"), DocConsumer, kwargs=kwargs))
        self._http_urlpatterns.append(url(urlpattern("/autoload.js"), AutoloadJsConsumer, kwargs=kwargs))
        self._websocket_urlpatterns.append(url(urlpattern("/ws"), WSConsumer, kwargs=kwargs))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
