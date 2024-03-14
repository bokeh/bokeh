#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide decorators help with define Bokeh validation checks.

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
from typing import (
    Any,
    Callable,
    TypeAlias,
    cast,
)

# Bokeh imports
from .check import ValidationIssue, Validator, ValidatorType
from .issue import Error, Issue, Warning

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "error",
    "warning",
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

ValidationFunction: TypeAlias = Callable[..., str | None]
ValidationDecorator: TypeAlias = Callable[[ValidationFunction], Validator]

def _validator(code_or_name: int | str | Issue, validator_type: ValidatorType) -> ValidationDecorator:
    """ Internal shared implementation to handle both error and warning
    validation checks.

    Args:
        code code_or_name (int, str or Issue) : a defined error code or custom message
        validator_type (str) : either "error" or "warning"

    Returns:
        validation decorator

    """
    issues: type[Error] | type[Warning] = \
        Error if validator_type == "error" else Warning

    def decorator(func: ValidationFunction) -> Validator:
        assert func.__name__.startswith("_check"), f"validation function {func.__qualname__} must have '_check' prefix"

        def _wrapper(*args: Any, **kwargs: Any) -> list[ValidationIssue]:
            extra = func(*args, **kwargs)
            if extra is None:
                return []
            issue: Issue
            name: str
            if isinstance(code_or_name, str):
                issue = issues.get_by_name("EXT")
                name = f"{issue.name}:{code_or_name}"
            elif isinstance(code_or_name, int):
                try:
                    issue = issues.get_by_code(code_or_name)
                    name = issue.name
                except KeyError:
                    raise ValueError(f"unknown {validator_type} code {code_or_name}")
            else:
                issue = code_or_name
                name = issue.name
            code = issue.code
            text = issue.description
            return [ValidationIssue(code, name, text, extra)]

        wrapper = cast(Validator, _wrapper)
        wrapper.validator_type = validator_type
        return wrapper

    return decorator

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def error(code_or_name: int | str | Issue) -> ValidationDecorator:
    """ Decorator to mark a validator method for a Bokeh error condition

    Args:
        code_or_name (int, str or Issue) : a code from ``bokeh.validation.errors`` or a string label for a custom check

    Returns:
        callable : decorator for Bokeh model methods

    The function that is decorated must have a name that starts with
    ``_check``, and return a string message in case a bad condition is
    detected, and ``None`` if no bad condition is detected.

    Examples:

    The first example uses a numeric code for a standard error provided in
    ``bokeh.validation.errors``. This usage is primarily of interest to Bokeh
    core developers.

    .. code-block:: python

        from bokeh.validation.errors import REQUIRED_RANGES

        @error(REQUIRED_RANGES)
        def _check_no_glyph_renderers(self):
            if bad_condition: return "message"

    The second example shows how a custom warning check can be implemented by
    passing an arbitrary string label to the decorator. This usage is primarily
    of interest to anyone extending Bokeh with their own custom models.

    .. code-block:: python

        @error("MY_CUSTOM_WARNING")
        def _check_my_custom_warning(self):
            if bad_condition: return "message"

    """
    return _validator(code_or_name, "error")

def warning(code_or_name: int | str | Issue) -> ValidationDecorator:
    """ Decorator to mark a validator method for a Bokeh error condition

    Args:
        code_or_name (int, str or Issue) : a code from ``bokeh.validation.errors`` or a string label for a custom check

    Returns:
        callable : decorator for Bokeh model methods

    The function that is decorated should have a name that starts with
    ``_check``, and return a string message in case a bad condition is
    detected, and ``None`` if no bad condition is detected.

    Examples:

    The first example uses a numeric code for a standard warning provided in
    ``bokeh.validation.warnings``. This usage is primarily of interest to Bokeh
    core developers.

    .. code-block:: python

        from bokeh.validation.warnings import MISSING_RENDERERS

        @warning(MISSING_RENDERERS)
        def _check_no_glyph_renderers(self):
            if bad_condition: return "message"

    The second example shows how a custom warning check can be implemented by
    passing an arbitrary string label to the decorator. This usage is primarily
    of interest to anyone extending Bokeh with their own custom models.

    .. code-block:: python

        @warning("MY_CUSTOM_WARNING")
        def _check_my_custom_warning(self):
            if bad_condition: return "message"

    """
    return _validator(code_or_name, "warning")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
