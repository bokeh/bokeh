#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh._testing.util.api import verify_all
from bokeh.core.has_props import HasProps
from bokeh.core.properties import Int, Override, String

# Module under test
import bokeh.core.property.include as bcpi # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Include',
)

class IsDelegate(HasProps):
    x = Int(12)
    y = String("hello")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_Include:
    def test_include_with_prefix(self) -> None:

        class IncludesDelegateWithPrefix(HasProps):
            z = bcpi.Include(IsDelegate, use_prefix=True)

        o = IncludesDelegateWithPrefix()
        assert o.z_x == 12
        assert o.z_y == "hello"
        assert not hasattr(o, 'z')
        assert not hasattr(o, 'x')
        assert not hasattr(o, 'y')

        assert 'z' not in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=True)
        assert 'y' not in o.properties_with_values(include_defaults=True)
        assert 'z_x' in o.properties_with_values(include_defaults=True)
        assert 'z_y' in o.properties_with_values(include_defaults=True)
        assert 'z_x' not in o.properties_with_values(include_defaults=False)
        assert 'z_y' not in o.properties_with_values(include_defaults=False)

    def test_include_without_prefix(self) -> None:
        class IncludesDelegateWithoutPrefix(HasProps):
            z = bcpi.Include(IsDelegate, use_prefix=False)

        o = IncludesDelegateWithoutPrefix()
        assert o.x == 12
        assert o.y == "hello"
        assert not hasattr(o, 'z')

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' not in o.properties_with_values(include_defaults=False)


    def test_include_without_prefix_using_override(self) -> None:
        class IncludesDelegateWithoutPrefixUsingOverride(HasProps):
            z = bcpi.Include(IsDelegate, use_prefix=False)
            y = Override(default="world") # override the Include changing just the default

        o = IncludesDelegateWithoutPrefixUsingOverride()
        assert o.x == 12
        assert o.y == 'world'
        assert not hasattr(o, 'z')

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' not in o.properties_with_values(include_defaults=False)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpi, ALL)
