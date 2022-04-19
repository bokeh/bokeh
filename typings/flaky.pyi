from collections.abc import Callable
from typing import Any, TypeVar

from typing_extensions import TypeAlias

_F = TypeVar("_F", bound=Callable[..., Any])

RerunFilter: TypeAlias = Callable[[Any, str, Any, Any], bool]

def flaky(max_runs: int | None = ..., min_passes: int | None = ..., rerun_filter: RerunFilter | None = ...) -> Callable[[_F], _F]: ...
