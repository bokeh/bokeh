#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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
import re
from pathlib import Path
from typing import Callable, List, Union

# External imports
from channels.http import AsgiHandler
from django.conf.urls import url
from django.urls.resolvers import URLPattern

# Bokeh imports
from bokeh.application import Application
from bokeh.application.handlers.document_lifecycle import DocumentLifecycleHandler
from bokeh.application.handlers.function import FunctionHandler
from bokeh.command.util import (
    build_single_handler_application,
    build_single_handler_applications,
)
from bokeh.server.contexts import ApplicationContext

# Bokeh imports
from .consumers import AutoloadJsConsumer, DocConsumer, WSConsumer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'RoutingConfiguration',
)

ApplicationLike = Union[Application, Callable, Path]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Routing:
    url: str
    app: Application
    app_context: ApplicationContext
    document: bool
    autoload: bool

    def __init__(self, url: str, app: ApplicationLike, *, document: bool = False, autoload: bool = False) -> None:
        self.url = url
        self.app = self._fixup(self._normalize(app))
        self.app_context = ApplicationContext(self.app, url=self.url)
        self.document = document
        self.autoload = autoload

    def _normalize(self, obj: ApplicationLike) -> Application:
        if callable(obj):
            return Application(FunctionHandler(obj, trap_exceptions=True))
        elif isinstance(obj, Path):
            return build_single_handler_application(obj)
        else:
            return obj

    def _fixup(self, app: Application) -> Application:
        if not any(isinstance(handler, DocumentLifecycleHandler) for handler in app.handlers):
            app.add(DocumentLifecycleHandler())
        return app

def document(url: str, app: ApplicationLike) -> Routing:
    return Routing(url, app, document=True)

def autoload(url: str, app: ApplicationLike) -> Routing:
    return Routing(url, app, autoload=True)

def directory(*apps_paths: Path) -> List[Routing]:
    paths: List[Path] = []

    for apps_path in apps_paths:
        if apps_path.exists():
            paths += [ entry for entry in apps_path.glob("*") if is_bokeh_app(entry) ]
        else:
            log.warn(f"bokeh applications directory '{apps_path}' doesn't exist")

    return [ document(url, app) for url, app in build_single_handler_applications(paths).items() ]


class RoutingConfiguration:
    _http_urlpatterns: List[str] = []
    _websocket_urlpatterns: List[str] = []

    def __init__(self, routings: List[Routing]):
        for routing in routings:
            self._add_new_routing(routing)

    def get_http_urlpatterns(self) -> List[URLPattern]:
        return self._http_urlpatterns + [url(r"", AsgiHandler)]

    def get_websocket_urlpatterns(self) -> List[URLPattern]:
        return self._websocket_urlpatterns

    def _add_new_routing(self, routing: Routing) -> None:
        kwargs = dict(app_context=routing.app_context)

        def join(*components):
            return "/".join([ component.strip("/") for component in components if component ])

        def urlpattern(suffix=""):
            return r"^{}$".format(join(re.escape(routing.url)) + suffix)

        if routing.document:
            self._http_urlpatterns.append(url(urlpattern(), DocConsumer, kwargs=kwargs))
        if routing.autoload:
            self._http_urlpatterns.append(url(urlpattern("/autoload.js"), AutoloadJsConsumer, kwargs=kwargs))

        self._websocket_urlpatterns.append(url(urlpattern("/ws"), WSConsumer, kwargs=kwargs))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def is_bokeh_app(entry: Path) -> bool:
    return (entry.is_dir() or entry.name.endswith(('.py', '.ipynb'))) and not entry.name.startswith((".", "_"))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
