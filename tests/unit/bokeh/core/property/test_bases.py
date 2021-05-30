#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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

# External imports
import numpy as np
from mock import MagicMock, patch

# Bokeh imports
from bokeh._testing.util.api import verify_all
from bokeh._testing.util.types import Capture
from bokeh.core.has_props import HasProps

# Module under test
import bokeh.core.property.bases as bcpb # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'ContainerProperty',
    'DeserializationError',
    'PrimitiveProperty',
    'Property',
    'validation_on',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestProperty:
    @patch('bokeh.core.property.bases.Property.validate')
    def test_is_valid_supresses_validation_detail(self, mock_validate: MagicMock) -> None:
        p = bcpb.Property()
        p.is_valid(None)
        assert mock_validate.called
        assert mock_validate.call_args[0] == (None, False)

    def test_serialized_default(self) -> None:
        p = bcpb.Property()
        assert p.serialized == True
        assert p.readonly == False

        # readonly=True sets serialized=False if unspecified
        p = bcpb.Property(readonly=True)
        assert p.serialized == False
        assert p.readonly == True

        # explicit serialized value always respected
        p = bcpb.Property(readonly=True, serialized=True)
        assert p.serialized == True
        assert p.readonly == True


    def test_assert_bools(self) -> None:
        hp = HasProps()
        p = bcpb.Property()

        p.asserts(True, "true")
        assert p.prepare_value(hp, "foo", 10) == 10

        p.asserts(False, "false")
        with pytest.raises(ValueError) as e:
                p.prepare_value(hp, "foo", 10)
                assert str(e) == "false"

    def test_assert_functions(self) -> None:
        hp = HasProps()
        p = bcpb.Property()

        p.asserts(lambda obj, value: True, "true")
        p.asserts(lambda obj, value: obj is hp, "true")
        p.asserts(lambda obj, value: value==10, "true")
        assert p.prepare_value(hp, "foo", 10) == 10

        p.asserts(lambda obj, value: False, "false")
        with pytest.raises(ValueError) as e:
                p.prepare_value(hp, "foo", 10)
                assert str(e) == "false"

    def test_assert_msg_funcs(self) -> None:
        hp = HasProps()
        p = bcpb.Property()

        def raise_(ex):
                raise ex

        p.asserts(False, lambda obj, name, value: raise_(ValueError("bad %s %s %s" % (hp==obj, name, value))))

        with pytest.raises(ValueError) as e:
                p.prepare_value(hp, "foo", 10)
                assert str(e) == "bad True name, 10"

    def test_matches_basic_types(self, capsys: Capture) -> None:
        p = bcpb.Property()
        for x in [1, 1.2, "a", np.arange(4), None, False, True, {}, []]:
                assert p.matches(x, x) is True
                assert p.matches(x, "junk") is False
        out, err = capsys.readouterr()
        assert err == ""

    def test_matches_compatible_arrays(self, capsys: Capture) -> None:
        p = bcpb.Property()
        a = np.arange(5)
        b = np.arange(5)
        assert p.matches(a, b) is True
        assert p.matches(a, b+1) is False
        for x in [1, 1.2, "a", np.arange(4), None, False]:
                assert p.matches(a, x) is False
                assert p.matches(x, b) is False
        out, err = capsys.readouterr()
        assert err == ""

    def test_matches_incompatible_arrays(self, capsys: Capture) -> None:
        p = bcpb.Property()
        a = np.arange(5)
        b = np.arange(5).astype(str)
        assert p.matches(a, b) is False
        out, err = capsys.readouterr()
        # no way to suppress FutureWarning in this case
        # assert err == ""

    def test_matches_dicts_with_array_values(self, capsys: Capture) -> None:
        p = bcpb.Property()
        d1 = dict(foo=np.arange(10))
        d2 = dict(foo=np.arange(10))

        assert p.matches(d1, d1) is True
        assert p.matches(d1, d2) is True

        # XXX not sure if this is preferable to have match, or not
        assert p.matches(d1, dict(foo=list(range(10)))) is True

        assert p.matches(d1, dict(foo=np.arange(11))) is False
        assert p.matches(d1, dict(bar=np.arange(10))) is False
        assert p.matches(d1, dict(bar=10)) is False
        out, err = capsys.readouterr()
        assert err == ""

    def test_matches_non_dict_containers_with_array_false(self, capsys: Capture) -> None:
        p = bcpb.Property()
        d1 = [np.arange(10)]
        d2 = [np.arange(10)]
        assert p.matches(d1, d1) is True  # because object identity
        assert p.matches(d1, d2) is False

        t1 = (np.arange(10),)
        t2 = (np.arange(10),)
        assert p.matches(t1, t1) is True  # because object identity
        assert p.matches(t1, t2) is False

        out, err = capsys.readouterr()
        assert err == ""

    def test_matches_dicts_with_series_values(self, capsys: Capture, pd) -> None:
        p = bcpb.Property()
        d1 = pd.DataFrame(dict(foo=np.arange(10)))
        d2 = pd.DataFrame(dict(foo=np.arange(10)))

        assert p.matches(d1.foo, d1.foo) is True
        assert p.matches(d1.foo, d2.foo) is True

        # XXX not sure if this is preferable to have match, or not
        assert p.matches(d1.foo, (range(10))) is True

        assert p.matches(d1.foo, np.arange(11)) is False
        assert p.matches(d1.foo, np.arange(10)+1) is False
        assert p.matches(d1.foo, 10) is False
        out, err = capsys.readouterr()
        assert err == ""

    def test_matches_dicts_with_index_values(self, capsys: Capture, pd) -> None:
        p = bcpb.Property()
        d1 = pd.DataFrame(dict(foo=np.arange(10)))
        d2 = pd.DataFrame(dict(foo=np.arange(10)))

        assert p.matches(d1.index, d1.index) is True
        assert p.matches(d1.index, d2.index) is True

        # XXX not sure if this is preferable to have match, or not
        assert p.matches(d1.index, list(range(10))) is True

        assert p.matches(d1.index, np.arange(11)) is False
        assert p.matches(d1.index, np.arange(10)+1) is False
        assert p.matches(d1.index, 10) is False
        out, err = capsys.readouterr()
        assert err == ""

    def test_validation_on(self) -> None:
        assert bcpb.Property._should_validate == True
        assert bcpb.validation_on()

        bcpb.Property._should_validate = False
        assert not bcpb.validation_on()

        bcpb.Property._should_validate = True
        assert bcpb.validation_on()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpb, ALL)
