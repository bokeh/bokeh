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
from ..util.functions import or_else, url_join
from .artifacts import Artifact
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

    def __init__(self, *, version: Optional[str] = None, dev: Optional[bool] = None, legacy: Optional[bool] = None) -> None:
        super().__init__(dev=dev, legacy=legacy)
        self.version = settings.version(version)

    def __call__(self, *, version: Optional[str] = None, dev: Optional[bool] = None, legacy: Optional[bool] = None) -> "CDNResources":
        return self.__class__(version=or_else(version, self.version), dev=or_else(dev, self.dev), legacy=or_else(legacy, self.legacy))

    def _cdn_base_url(self) -> str:
        return "https://cdn.bokeh.org"

    def _resolve(self, artifact: Artifact) -> Urls:
        if self.version is None:
            if settings.docs_cdn():
                version = settings.docs_cdn()
            else:
                version = __version__.split("-")[0]
        else:
            version = self.version

        minified = ".min" if self.dev else ""
        legacy = "legacy" if self.legacy else ""

        base_url = self._cdn_base_url()
        dev_container = "bokeh/dev"
        rel_container = "bokeh/release"

        # check the 'dev' fingerprint
        container = dev_container if _DEV_PAT.match(version) else rel_container

        def mk_filename(comp: str, kind: Kind) -> str:
            return f"{comp}-{version}{minified}.{kind}"

        def mk_url(comp: str, kind: Kind) -> str:
            return url_join(base_url, container, legacy, mk_filename(comp, kind))

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

            result["hashes"] = lambda components, kind: \
                { mk_url(component, kind): sri_hashes[mk_filename(component, kind)] for component in components }

        return result

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

_sri_hashes: Optional[Dict[str, str]]
if is_full_release():
    _sri_hashes = get_sri_hashes_for_version(version)
else:
    _sri_hashes = None