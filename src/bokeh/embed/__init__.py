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
from .artifact import ArtifactRoot, ArtifactValidationError, EmbedArtifact
from .compiler import (
    EmbedCompileError,
    EmbedSpec,
    embed,
    embed_server,
)
from .renderers import ArtifactFragment, ArtifactMount, ExternalArtifact
from .resources import (
    ExtensionRequirement,
    ResourceAssetRequirement,
    ResourceRequirements,
)
from .server import server_document, server_session
from .standalone import (
    EmbedMigrationError,
    autoload_static,
    components,
    file_html,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ArtifactFragment',
    'ArtifactMount',
    'ArtifactRoot',
    'ArtifactValidationError',
    'EmbedArtifact',
    'EmbedCompileError',
    'EmbedMigrationError',
    'EmbedSpec',
    'ExtensionRequirement',
    'ExternalArtifact',
    'ResourceAssetRequirement',
    'ResourceRequirements',
    'autoload_static',
    'components',
    'embed',
    'embed_server',
    'file_html',
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
