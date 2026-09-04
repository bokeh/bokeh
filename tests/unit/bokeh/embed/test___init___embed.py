#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from tests.support.util.api import verify_all

# Module under test
import bokeh.embed as be # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
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
    'ResourceConflictError',
    'ResourcePolicy',
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

Test___all__ = verify_all(be, ALL)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
