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

Test___all__ = verify_all(be, ALL)


def test_embed_mime_type() -> None:
    assert be.EMBED_MIME_TYPE == "application/vnd.bokeh.embed+json"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
