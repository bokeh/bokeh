#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide (optional) Pandas properties.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ...util.dependencies import import_optional
from .bases import Property

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

pd = import_optional('pandas')

__all__ = (
    'PandasDataFrame',
    'PandasGroupBy',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class PandasDataFrame(Property):
    ''' Accept Pandas DataFrame values.

    This property only exists to support type validation, e.g. for "accepts"
    clauses. It is not serializable itself, and is not useful to add to
    Bokeh models directly.

    '''
    def validate(self, value, detail=True):
        super(PandasDataFrame, self).validate(value, detail)

        if pd and isinstance(value, pd.DataFrame):
            return

        msg = "" if not detail else "expected Pandas DataFrame, got %r" % value
        raise ValueError(msg)

class PandasGroupBy(Property):
    ''' Accept Pandas DataFrame values.

    This property only exists to support type validation, e.g. for "accepts"
    clauses. It is not serializable itself, and is not useful to add to
    Bokeh models directly.

    '''
    def validate(self, value, detail=True):
        super(PandasGroupBy, self).validate(value, detail)

        if pd and isinstance(value, pd.core.groupby.GroupBy):
            return

        msg = "" if not detail else "expected Pandas GroupBy, got %r" % value
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
