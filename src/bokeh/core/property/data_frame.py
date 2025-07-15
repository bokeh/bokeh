#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide (optional) Pandas properties.

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
from typing import TYPE_CHECKING, Any

# Bokeh imports
from .bases import Property

if TYPE_CHECKING:
    from narwhals.stable.v1.typing import IntoDataFrame, IntoSeries  # noqa: F401
    from pandas import DataFrame  # noqa: F401
    from pandas.core.groupby import GroupBy  # noqa: F401


#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'EagerDataFrame',
    'EagerSeries',
    'PandasDataFrame',
    'PandasGroupBy',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class EagerDataFrame(Property["IntoDataFrame"]):
    """ Accept eager dataframe supported by Narwhals.

    This property only exists to support type validation, e.g. for "accepts"
    clauses. It is not serializable itself, and is not useful to add to
    Bokeh models directly.

    """
    def validate(self, value: Any, detail: bool = True) -> None:
        import narwhals.stable.v1 as nw
        super().validate(value, detail)

        if nw.dependencies.is_into_dataframe(value):
            return

        msg = "" if not detail else f"expected object convertible to Narwhals DataFrame, got {value!r}"
        raise ValueError(msg)

class EagerSeries(Property["IntoSeries"]):
    """ Accept eager series supported by Narwhals.

    This property only exists to support type validation, e.g. for "accepts"
    clauses. It is not serializable itself, and is not useful to add to
    Bokeh models directly.

    """
    def validate(self, value: Any, detail: bool = True) -> None:
        import narwhals.stable.v1 as nw
        super().validate(value, detail)

        if nw.dependencies.is_into_series(value):
            return

        msg = "" if not detail else f"expected object convertible to Narwhals Series, got {value!r}"
        raise ValueError(msg)

class PandasDataFrame(Property["DataFrame"]):
    """ Accept Pandas DataFrame values.

    This class is pandas-specific - are more generic one is
    ``EagerDataFrame()``.

    This property only exists to support type validation, e.g. for "accepts"
    clauses. It is not serializable itself, and is not useful to add to
    Bokeh models directly.

    """
    def __init__(self) -> None:
        super().__init__()


    def validate(self, value: Any, detail: bool = True) -> None:
        import pandas as pd
        if isinstance(value, pd.DataFrame):
            return

        msg = "" if not detail else f"expected Pandas DataFrame, got {value!r}"
        raise ValueError(msg)

class PandasGroupBy(Property["GroupBy[Any]"]):
    """ Accept Pandas DataFrame values.

    This property only exists to support type validation, e.g. for "accepts"
    clauses. It is not serializable itself, and is not useful to add to
    Bokeh models directly.

    """

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        from pandas.core.groupby import GroupBy
        if isinstance(value, GroupBy):
            return

        msg = "" if not detail else f"expected Pandas GroupBy, got {value!r}"
        raise ValueError(msg)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
