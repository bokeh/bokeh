#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from abc import abstractmethod
from typing import Unpack

from ..._specs import NumberSpec
from ...core.property_mixins import (
    FillProps,
    HatchProps,
    LineProps,
    _FillPropsInit,
    _HatchPropsInit,
    _LinePropsInit,
)
from ..graphics import Marking, _MarkingInit

class _ArrowHeadInit(_MarkingInit, total=False):
    size: NumberSpec

class ArrowHead(Marking):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ArrowHeadInit]) -> None: ...

    size: NumberSpec = ...

class _OpenHeadInit(_ArrowHeadInit, _LinePropsInit, total=False):
    ...

class OpenHead(ArrowHead, LineProps):
    def __init__(self, **kwargs: Unpack[_OpenHeadInit]) -> None: ...

def auto_arrowhead() -> OpenHead: ...

class _NormalHeadInit(_ArrowHeadInit, _LinePropsInit, _FillPropsInit, _HatchPropsInit, total=False):
    ...

class NormalHead(ArrowHead, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_NormalHeadInit]) -> None: ...

class _TeeHeadInit(_ArrowHeadInit, _LinePropsInit, total=False):
    ...

class TeeHead(ArrowHead, LineProps):
    def __init__(self, **kwargs: Unpack[_TeeHeadInit]) -> None: ...

class _VeeHeadInit(_ArrowHeadInit, _LinePropsInit, _FillPropsInit, _HatchPropsInit, total=False):
    ...

class VeeHead(ArrowHead, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_VeeHeadInit]) -> None: ...
