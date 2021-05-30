from typing import Any, Callable, TypeVar

F = TypeVar("F", bound=Callable[..., Any])

RerunFilter = Callable[[Any, str, Any, Any], bool]

def flaky(max_runs: int | None = ..., min_passes: int | None = ..., rerun_filter: RerunFilter | None = ...) -> Callable[[F], F]: ...
