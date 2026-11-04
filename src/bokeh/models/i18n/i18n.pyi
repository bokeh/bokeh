#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
# Standard library imports
from typing import Any

# Bokeh imports
from ...model import Model

class I18n(Model):
    locale: str = ...

    locales_codes: list[str] = ...

    translations: dict[str, dict[str, str] | dict[str, Any]] = ...

    languages: list[tuple[str, str]] = ...

    source_language: str = ...

    auto_t_enabled: bool = ...
