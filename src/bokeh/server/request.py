#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Framework-neutral HTTP request types used by Bokeh server applications. '''

from __future__ import annotations

# Standard library imports
from collections.abc import Iterator, Mapping
from dataclasses import dataclass, field
from typing import Protocol

__all__ = (
    'ServerRequest',
)

class CookieValue(Protocol):
    @property
    def value(self) -> str: ...

class RequestLike(Protocol):
    @property
    def method(self) -> str: ...
    @property
    def uri(self) -> str: ...
    @property
    def path(self) -> str: ...
    @property
    def arguments(self) -> Mapping[str, list[bytes]]: ...
    @property
    def headers(self) -> Mapping[str, str]: ...
    @property
    def cookies(self) -> Mapping[str, CookieValue]: ...

class Headers(Mapping[str, str]):
    ''' A small, case-insensitive HTTP header mapping. '''

    def __init__(self, values: Mapping[str, str] | None = None) -> None:
        self._values: dict[str, tuple[str, str]] = {}
        if values is not None:
            for name, value in values.items():
                self._values[name.lower()] = (name, value)

    def __getitem__(self, name: str) -> str:
        return self._values[name.lower()][1]

    def __iter__(self) -> Iterator[str]:
        return (name for name, _ in self._values.values())

    def __len__(self) -> int:
        return len(self._values)

@dataclass(frozen=True)
class Cookie:
    value: str

@dataclass
class ServerRequest:
    method: str
    uri: str
    path: str
    arguments: dict[str, list[bytes]] = field(default_factory=dict)
    headers: Headers = field(default_factory=Headers)
    cookies: dict[str, Cookie] = field(default_factory=dict)
    remote_ip: str | None = None
    protocol: str = "http"
    host: str = ""
    query: str = ""
    root_path: str = ""
