#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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
from ..util.version import is_full_release
from .assets import Asset, ScriptLink
from .base import Kind, Resources, Urls, Message
from .sri import get_sri_hashes_for_version

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

    def __init__(self, *, version: Optional[str] = None, dev: Optional[bool] = None) -> None:
        self.version = settings.version(version)

    def _resolve(self, kind: Kind) -> List[Asset]:
        cdn = self._cdn_urls()
        urls = cdn.urls(self.components(kind), kind)
        return [ ScriptLink(url) for url in urls ]

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

        def mk_filename(comp: str, kind: Kind) -> str:
            return f"{comp}-{version}{_minified}.{kind}"

        def mk_url(comp: str, kind: Kind) -> str:
            return f"{base_url}/{container}/{_legacy}{mk_filename(comp, kind)}"

        result = Urls(lambda components, kind: [ mk_url(component, kind) for component in components ])

        if len(__version__.split("-")) > 1:
            log.debug("Getting CDN URL for local dev version may not produce usable URL")
            result.messages.append(Message(
                type = "warn",
                text = (
                    f"Requesting CDN BokehJS version '{version}' from Bokeh development version '{__version__}'. "
                    "This configuration is unsupported and may not work!"
                ),
            ))

        if is_full_release():
            sri_hashes = get_sri_hashes_for_version(version)
            result["hashes"] = lambda components, kind: \
                { mk_url(component, kind): sri_hashes[mk_filename(component, kind)] for component in components }

        return result
