#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
    # XXX: groupby.groupby possibly due to a bug in import following in mypy
    from pandas import DataFrame  # noqa: F401
    from pandas.core.groupby.groupby import GroupBy  # noqa: F401

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'PandasDataFrame',
    'PandasGroupBy',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class PandasDataFrame(Property["DataFrame"]):
    """ Accept Pandas DataFrame values.

    This property only exists to support type validation, e.g. for "accepts"
    clauses. It is not serializable itself, and is not useful to add to
    Bokeh models directly.

    """

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

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

        import pandas as pd
        if isinstance(value, pd.core.groupby.GroupBy):  # type: ignore
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
