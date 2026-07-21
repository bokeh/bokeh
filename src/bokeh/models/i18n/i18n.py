#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" """

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from ...core.property.any import Any as AnyProperty
from ...core.property.container import List, Tuple
from ...core.property.primitive import Bool, String
from ...model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "I18n",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------
class I18n(Model):
    """ Allows to configure i18n aspects of the document, its models and the application. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    locales_codes = List(String, default=["en"], help="""
    List of locales codes supported.
    """)

    # TODO: Type shoundn't be Any
    translations = AnyProperty(default={}, help="""
    Mapping with all the defined translations available.
    """)

    languages = List(Tuple(String, String), default=[("English", "en")], help="""
    List of tuples with supported locales codes and their respective label to show.
    """)

    source_language = String(default="en", help="""
    Language locale code of the source language of the strings.
    """)

    auto_t_enabled = Bool(default=False, help="""
    If auto translations (only Chrome >= 138) should be done.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
