#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the ``check_integrity`` function.

'''

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
import contextlib
from typing import (
    Iterable,
    Iterator,
    List,
    Set,
)

# External imports
from typing_extensions import Literal, Protocol

# Bokeh imports
from ...model import Model
from ...settings import settings
from ...util.dataclasses import dataclass
from .issue import Warning

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__silencers__: Set[Warning] = set()

__all__ = (
    'check_integrity',
    'silence',
    'silenced',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@dataclass
class ValidationIssue:
    code: int
    name: str
    text: str
    extra: str

@dataclass
class ValidationIssues:
    error: List[ValidationIssue]
    warning: List[ValidationIssue]

ValidatorType = Literal["error", "warning"]

class Validator(Protocol):
    def __call__(self) -> List[ValidationIssue]: ...
    validator_type: ValidatorType

def silence(warning: Warning, silence: bool = True) -> Set[Warning]:
    ''' Silence a particular warning on all Bokeh models.

    Args:
        warning (Warning) : Bokeh warning to silence
        silence (bool) : Whether or not to silence the warning

    Returns:
        A set containing the all silenced warnings

    This function adds or removes warnings from a set of silencers which
    is referred to when running ``check_integrity``. If a warning
    is added to the silencers - then it will never be raised.

    .. code-block:: python

        >>> from bokeh.core.validation.warnings import EMPTY_LAYOUT
        >>> bokeh.core.validation.silence(EMPTY_LAYOUT, True)
        {1002}

    To turn a warning back on use the same method but with the silence
    argument set to false

    .. code-block:: python

        >>> bokeh.core.validation.silence(EMPTY_LAYOUT, False)
        set()

    '''
    if not isinstance(warning, Warning):
        raise ValueError(f"Input to silence should be a warning object - not of type {type(warning)}")
    if silence:
        __silencers__.add(warning)
    elif warning in __silencers__:
        __silencers__.remove(warning)
    return __silencers__

def is_silenced(warning: Warning) -> bool:
    ''' Check if a warning has been silenced.

    Args:
        warning (Warning) : Bokeh warning to check

    Returns:
        bool

    '''
    return warning in __silencers__

@contextlib.contextmanager
def silenced(warning: Warning) -> Iterator[None]:
    silence(warning, True)
    try:
        yield
    finally:
        silence(warning, False)

def check_integrity(models: Iterable[Model]) -> ValidationIssues:
    ''' Collect all warnings associated with a collection of Bokeh models.

    Args:
        models (seq[Model]) : a collection of Models to test

    Returns:
        ValidationIssues: A collection of all warning and error messages

    This function will return an object containing all errors and/or
    warning conditions that are detected. For example, layouts without
    any children will add a warning to the collection:

    .. code-block:: python

        >>> empty_row = Row()

        >>> check_integrity([empty_row])
        ValidationIssues(
            error=[],
            warning=[
                ValidationIssue(
                    code=1002,
                    name="EMPTY_LAYOUT",
                    text="Layout has no children",
                    extra="Row(id='1001', ...)",
                ),
            ],
        )

    '''
    issues = ValidationIssues(error=[], warning=[])

    for model in models:
        validators: List[Validator] = []
        for name in dir(model):
            if not name.startswith("_check"):
                continue
            obj = getattr(model, name)
            if getattr(obj, "validator_type", None):
                validators.append(obj)
        for func in validators:
            if func.validator_type == "error":
                issues.error.extend(func())
            else:
                issues.warning.extend(func())

    return issues

def process_validation_issues(issues: ValidationIssues) -> None:
    ''' Log warning and error messages for a dictionary containing warnings and error messages.

    Args:
        issues (ValidationIssue) : A collection of all warning and error messages

    Returns:
        None

    This function will emit log warning and error messages for all error or
    warning conditions in the dictionary. For example, a dictionary
    containing a warning for empty layout will trigger a warning:

    .. code-block:: python

        >>> process_validation_issues(validations)
        W-1002 (EMPTY_LAYOUT): Layout has no children: Row(id='2404a029-c69b-4e30-9b7d-4b7b6cdaad5b', ...)

    '''
    errors = issues.error
    warnings = [issue for issue in issues.warning if not is_silenced(Warning.get_by_code(issue.code))]

    warning_messages: List[str] = []
    for warning in sorted(warnings, key=lambda warning: warning.code):
        msg = f"W-{warning.code} ({warning.name}): {warning.text}: {warning.extra}"
        warning_messages.append(msg)
        log.warning(msg)

    error_messages: List[str] = []
    for error in sorted(errors, key=lambda error: error.code):
        msg = f"E-{error.code} ({error.name}): {error.text}: {error.extra}"
        error_messages.append(msg)
        log.error(msg)

    if settings.validation_level() == "errors":
        if len(errors):
            raise RuntimeError(f"Errors encountered during validation: {error_messages}")
    elif settings.validation_level() == "all":
        if len(errors) or len(warnings):
            raise RuntimeError(f"Errors encountered during validation: {error_messages + warning_messages}")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
