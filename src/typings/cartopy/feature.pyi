from typing import Any

class NaturalEarthFeature:
    def __init__(self, category: str, name: str, scale: str, **kwargs: Any) -> None: ...
    def with_scale(self, scale: str) -> NaturalEarthFeature: ...
    def geometries(self) -> Any: ...

BORDERS: NaturalEarthFeature
COASTLINE: NaturalEarthFeature
LAND: NaturalEarthFeature
LAKES: NaturalEarthFeature
OCEAN: NaturalEarthFeature
RIVERS: NaturalEarthFeature
STATES: NaturalEarthFeature
