#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

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
from typing import List, Optional

# Bokeh imports
from .. import __version__
from ..settings import settings
from .base import Kind, Resources, Urls
from .assets import Asset, ScriptRef

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

_DEV_PAT = re.compile(r"^(\d)+\.(\d)+\.(\d)+(dev|rc)")

__all__ = ()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

class CDNResources(Resources):
    mode = "cdn"

    def __init__(self, version: Optional[str] = None) -> None:
        self.version = settings.version(version)

    def _resolve(self, kind: Kind) -> List[Asset]:
        cdn = self._cdn_urls()
        urls = list(cdn["urls"](self.components(kind), kind))
        return [ ScriptRef(url) for url in urls ]

    def _cdn_base_url(self) -> str:
        return "https://cdn.bokeh.org"

    def _cdn_urls(self) -> Urls:
        if self.version is None:
            if settings.docs_cdn():
                version = settings.docs_cdn()
            else:
                version = __version__.split("-")[0]
        else:
            version = self.version

        # check if we want minified js and css
        _minified = ".min" if self.minified else ""
        _legacy = "legacy/" if self.legacy else ""

        base_url = self._cdn_base_url()
        dev_container = "bokeh/dev"
        rel_container = "bokeh/release"

        # check the 'dev' fingerprint
        container = dev_container if _DEV_PAT.match(version) else rel_container

        if version.endswith(("dev", "rc")):
            log.debug("Getting CDN URL for local dev version will not produce usable URL")

        def mk_url(comp: str, kind: Kind) -> str:
            return f"{base_url}/{container}/{_legacy}{comp}-{version}{_minified}.{kind}"

        result: Urls = {
            "urls": lambda components, kind: [mk_url(component, kind) for component in components],
            "messages": [],
        }

        if len(__version__.split("-")) > 1:
            result["messages"].append({
                "type": "warn",
                "text": (
                    f"Requesting CDN BokehJS version '{version}' from Bokeh development version '{__version__}'. "
                    "This configuration is unsupported and may not work!"
                ),
            })

        return result
