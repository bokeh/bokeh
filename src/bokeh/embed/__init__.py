#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide functions for embedding Bokeh standalone and server content in
web pages.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ._output import EmbedFragment, EmbedMount, ExternalEmbed
from ._util import (
    CallbackPolicy,
    EmbedBuildError,
    EmbedInput,
    EmbedSpec,
    SerializationPolicy,
    ServerRoot,
    ThemePolicy,
    ThemeSource,
    embed,
    embed_server,
)
from .resources import (
    ExtensionRequirement,
    ResourceAssetRequirement,
    ResourceRequirements,
)
from .result import (
    EMBED_MIME_TYPE,
    EmbedResult,
    EmbedRoot,
    EmbedValidationError,
)
from .server import server_document, server_session
from .standalone import (
    autoload_static,
    components,
    file_html,
    json_item,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CallbackPolicy',
    'EmbedFragment',
    'EmbedMount',
    'EmbedRoot',
    'EmbedValidationError',
    'EmbedResult',
    'EMBED_MIME_TYPE',
    'EmbedBuildError',
    'EmbedInput',
    'EmbedSpec',
    'ExtensionRequirement',
    'ExternalEmbed',
    'ResourceAssetRequirement',
    'ResourceRequirements',
    'SerializationPolicy',
    'ServerRoot',
    'ThemePolicy',
    'ThemeSource',
    'autoload_static',
    'components',
    'embed',
    'embed_server',
    'file_html',
    'json_item',
    'server_document',
    'server_session',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------



#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
