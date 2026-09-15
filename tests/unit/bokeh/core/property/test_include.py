#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh.core.has_props import HasProps
from bokeh.core.properties import Int, Override, String
from tests.support.util.api import verify_all

# Module under test
import bokeh.core.property.include as bcpi # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Include',
)

class IsDelegate(HasProps):
    x = Int(12, help="Original x documentation.")
    y = String("hello")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_Include:
    def test_is_not_property_factory(self) -> None:
        include = bcpi.Include(IsDelegate)

        assert not hasattr(include, "make_descriptor")
        assert not hasattr(include, "make_descriptors")

    def test_include_with_prefix(self) -> None:

        class IncludesDelegateWithPrefix(HasProps):
            z = bcpi.Include(IsDelegate, prefix="z", help="The {prop} values.")

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
        assert IncludesDelegateWithPrefix.lookup("z_x").__doc__ == "The x values.\n\nOriginal x documentation."

        x_include = getattr(IncludesDelegateWithPrefix.lookup("z_x").property, "_include")
        y_include = getattr(IncludesDelegateWithPrefix.lookup("z_y").property, "_include")
        assert x_include is y_include

    def test_include_help_context(self) -> None:
        class IncludesDelegateWithContext(HasProps):
            z = bcpi.Include(IsDelegate, prefix="z", help="""
            ``{model}.{name}`` provides its {prop}.\n\n{doc}
            """)

        assert IncludesDelegateWithContext.lookup("z_x").__doc__ == (
            "``IncludesDelegateWithContext.z_x`` provides its x.\n\nOriginal x documentation."
        )

    def test_include_preserves_declaration_order(self) -> None:
        class Ordered(HasProps):
            before = Int()
            delegate = bcpi.Include(IsDelegate)
            after = Int()

        assert list(Ordered.properties()) == ["before", "x", "y", "after"]

    def test_multiple_includes_preserve_declaration_order(self) -> None:
        class Ordered(HasProps):
            first = bcpi.Include(IsDelegate, prefix="first")
            middle = Int()
            second = bcpi.Include(IsDelegate, prefix="second")

        assert list(Ordered.properties()) == ["first_x", "first_y", "middle", "second_x", "second_y"]

    def test_include_without_prefix(self) -> None:
        class IncludesDelegateWithoutPrefix(HasProps):
            z = bcpi.Include(IsDelegate)

        o = IncludesDelegateWithoutPrefix()
        assert o.x == 12
        assert o.y == "hello"
        assert not hasattr(o, 'z')

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' not in o.properties_with_values(include_defaults=False)
        assert IncludesDelegateWithoutPrefix.lookup("x").__doc__ == "Original x documentation."

    def test_include_rejects_duplicate_property(self) -> None:
        with pytest.raises(RuntimeError, match=r"Multiple property declarations created Duplicate\.x"):
            class Duplicate(HasProps):
                x = Int()
                delegate = bcpi.Include(IsDelegate)

        with pytest.raises(RuntimeError, match=r"Multiple property declarations created Duplicate\.x"):
            class Duplicate(HasProps):
                delegate = bcpi.Include(IsDelegate)
                x = Int()

        with pytest.raises(RuntimeError, match=r"Multiple property declarations created Duplicate\.x"):
            class Duplicate(HasProps):
                x = None
                delegate = bcpi.Include(IsDelegate)

    def test_include_without_prefix_using_override(self) -> None:
        class IncludesDelegateWithoutPrefixUsingOverride(HasProps):
            z = bcpi.Include(IsDelegate)
            y = Override(default="world") # override the Include changing just the default

        o = IncludesDelegateWithoutPrefixUsingOverride()
        assert o.x == 12
        assert o.y == 'world'
        assert not hasattr(o, 'z')

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' not in o.properties_with_values(include_defaults=False)

    def test_include_without_prefix_using_prior_override(self) -> None:
        class IncludesDelegateWithoutPrefixUsingOverride(HasProps):
            y = Override(default="world")
            z = bcpi.Include(IsDelegate)

        o = IncludesDelegateWithoutPrefixUsingOverride()
        assert o.x == 12
        assert o.y == "world"

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
