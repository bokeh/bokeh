#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""
"""

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
from typing import ClassVar

# Bokeh imports
from ...util.dataclasses import dataclass

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@dataclass(frozen=True)
class Issue:
    code: int
    name: str
    description: str

@dataclass(frozen=True)
class Warning(Issue):
    _code_map: ClassVar[dict[int, Warning]] = {}
    _name_map: ClassVar[dict[str, Warning]] = {}

    def __post_init__(self) -> None:
        Warning._code_map[self.code] = self
        Warning._name_map[self.name] = self

    @classmethod
    def get_by_code(cls, code: int) -> Warning:
        return cls._code_map[code]

    @classmethod
    def get_by_name(cls, name: str) -> Warning:
        return cls._name_map[name]

    @classmethod
    def all(cls) -> list[Warning]:
        return list(cls._code_map.values())

@dataclass(frozen=True)
class Error(Issue):
    _code_map: ClassVar[dict[int, Error]] = {}
    _name_map: ClassVar[dict[str, Error]] = {}

    def __post_init__(self) -> None:
        Error._code_map[self.code] = self
        Error._name_map[self.name] = self

    @classmethod
    def get_by_code(cls, code: int) -> Error:
        return cls._code_map[code]

    @classmethod
    def get_by_name(cls, name: str) -> Error:
        return cls._name_map[name]

    @classmethod
    def all(cls) -> list[Error]:
        return list(cls._code_map.values())

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
