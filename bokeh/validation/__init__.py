''' The validation module provides the capability to perform integrity
checks on an entire collection of Bokeh models.

'''
from __future__ import absolute_import

from .check import check_integrity
from .decorators import error, warning
from .exceptions import ValidationError

