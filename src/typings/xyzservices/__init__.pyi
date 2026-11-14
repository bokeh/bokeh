# Partial stubs for xyzservices, covering the API used by Bokeh.
from typing import Any

class Bunch(dict[str, Any]):
    def query_name(self, name: str) -> TileProvider: ...

class TileProvider(Bunch):
    def build_url(
        self,
        x: int | str | None = None,
        y: int | str | None = None,
        z: int | str | None = None,
        scale_factor: str | None = None,
        fill_subdomain: bool | None = True,
        **kwargs: Any,
    ) -> str: ...

    def requires_token(self) -> bool: ...

    @property
    def html_attribution(self) -> str: ...

providers: Bunch
