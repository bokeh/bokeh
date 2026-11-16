#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide validation of serialized data against Bokeh's JSON schemas.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
import json
from functools import cache
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

import bokeh

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "PROTOCOL_SCHEMA_PATH",
    "protocol_errors",
    "protocol_schema",
    "validate_protocol",
)

PROTOCOL_SCHEMA_PATH = Path(bokeh.__file__).parent / "_schemas" / "protocol.json"

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@cache
def protocol_schema() -> dict[str, Any]:
    ''' Load the schema of Bokeh's protocol. '''
    return json.loads(PROTOCOL_SCHEMA_PATH.read_text(encoding="utf-8"))

def protocol_errors(instance: Any) -> list[str]:
    ''' Return messages describing how ``instance`` violates the protocol schema. '''
    validator = _protocol_validator()
    return [f"{'/'.join(map(str, error.absolute_path)) or '<root>'}: {error.message}" for error in validator.iter_errors(instance)]

def validate_protocol(instance: Any) -> None:
    ''' Assert that ``instance`` conforms to the protocol schema. '''
    errors = protocol_errors(instance)
    assert not errors, "\n".join(errors)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

@cache
def _protocol_validator() -> Draft202012Validator:
    return Draft202012Validator(protocol_schema())
