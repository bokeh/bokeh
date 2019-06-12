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

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
from typing import Optional, List, Dict, Union, Callable

# External imports
from django.apps import AppConfig
from django.conf import settings

# Bokeh imports
from bokeh.command.util import build_single_handler_applications
from bokeh.application import Application
from bokeh.server.contexts import ApplicationContext
from bokeh.application.handlers.function import FunctionHandler
from bokeh.application.handlers.document_lifecycle import DocumentLifecycleHandler
from .routing import RoutingConfiguration

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DjangoBokehConfig',
)

ApplicationLike = Union[Application, Callable]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class DjangoBokehConfig(AppConfig):

    name = label = 'bokeh.server.django'

    applications: Union[Dict[str, ApplicationLike], ApplicationLike] = {}

    _routes: Optional[RoutingConfiguration] = None

    @property
    def routes(self) -> RoutingConfiguration:
        if self._routes is None:
            self._routes = self._resolve_routes()
        return self._routes

    def _resolve_routes(self) -> RoutingConfiguration:
        user_apps = self.applications
        base_apps = user_apps if isinstance(user_apps, Dict) else {"/": user_apps}

        apps_dirs = getattr(settings, "BOKEH_APPS_DIRS", [])

        paths: List[str] = []
        for apps_dir in apps_dirs:
            if os.path.exists(apps_dir):
                paths += [ entry.path for entry in os.scandir(apps_dir) if is_bokeh_app(entry) ]
            else:
                log.warn("bokeh applications directory '{}' doesn't exist".format(apps_dir))

        def normalize(app: ApplicationLike) -> Application:
            return Application(FunctionHandler(app)) if callable(app) else app

        apps = {url: normalize(app) for (url, app) in base_apps.items()}
        apps.update(build_single_handler_applications(paths))

        for app in apps.values():
            if not any(isinstance(handler, DocumentLifecycleHandler) for handler in app.handlers):
                app.add(DocumentLifecycleHandler())

        contexts = {url: ApplicationContext(app, url=url) for (url, app) in apps.items()}
        return RoutingConfiguration(contexts)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def is_bokeh_app(entry: os.DirEntry) -> bool:
    return (entry.is_dir() or entry.name.endswith(('.py', '.ipynb'))) and not entry.name.startswith((".", "_"))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
