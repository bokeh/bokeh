#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from importlib import import_module
from typing import List, Optional

# External imports
from django.apps import AppConfig
from django.conf import settings

# Bokeh imports
from .routing import Routing, RoutingConfiguration

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DjangoBokehConfig',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class DjangoBokehConfig(AppConfig):

    name = label = 'bokeh.server.django'

    _routes: Optional[RoutingConfiguration] = None

    @property
    def bokeh_apps(self) -> List[Routing]:
        module = settings.ROOT_URLCONF
        url_conf = import_module(module) if isinstance(module, str) else module
        return url_conf.bokeh_apps

    @property
    def routes(self) -> RoutingConfiguration:
        if self._routes is None:
            self._routes = RoutingConfiguration(self.bokeh_apps)
        return self._routes

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
