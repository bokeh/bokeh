#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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

# Standard library imports
import logging
import os

# Bokeh imports
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.settings as bs # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'settings',
)

logging.basicConfig(level=logging.DEBUG)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bs, ALL)

_expected_settings = (
    'allowed_ws_origin',
    'auth_module',
    'browser',
    'cdn_version',
    'cookie_secret',
    'docs_cdn',
    'docs_version',
    'ignore_filename',
    'legacy',
    'log_level',
    'minified',
    'nodejs_path',
    'perform_document_validation',
    'pretty',
    'py_log_level',
    'resources',
    'rootdir',
    'secret_key',
    'sign_sessions',
    'simple_ids',
    'ssl_certfile',
    'ssl_keyfile',
    'ssl_password',
    'strict',
    'xsrf_cookies',
)


class TestSettings:
    def test_standard_settings(self) -> None:
        settings = [k for k,v in bs.settings.__class__.__dict__.items() if isinstance(v, bs.PrioritizedSetting)]
        assert set(settings) == set(_expected_settings)

    @pytest.mark.parametrize("name", _expected_settings)
    def test_prefix(self, name) -> None:
        ps = getattr(bs.settings, name)
        assert ps.env_var.startswith("BOKEH_")

    @pytest.mark.parametrize("name", _expected_settings)
    def test_parent(self, name) -> None:
        ps = getattr(bs.settings, name)
        assert ps._parent == bs.settings

    def test_types(self) -> None:
        assert bs.settings.ignore_filename.convert_type == "Bool"
        assert bs.settings.minified.convert_type == "Bool"
        assert bs.settings.perform_document_validation.convert_type == "Bool"
        assert bs.settings.simple_ids.convert_type == "Bool"
        assert bs.settings.strict.convert_type == "Bool"
        assert bs.settings.xsrf_cookies.convert_type == "Bool"

        assert bs.settings.py_log_level.convert_type == "Log Level"

        assert bs.settings.allowed_ws_origin.convert_type == "List[String]"

        default_typed = set(_expected_settings) - {
            'ignore_filename',
            'legacy',
            'minified',
            'perform_document_validation',
            'simple_ids',
            'strict',
            'py_log_level',
            'allowed_ws_origin',
            'xsrf_cookies',
        }
        for name in default_typed:
            ps = getattr(bs.settings, name)
            assert ps.convert_type == "String"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class TestConverters:
    @pytest.mark.parametrize("value", ["Yes", "YES", "yes", "1", "ON", "on", "true", "True", True])
    def test_convert_bool(self, value) -> None:
        assert bs.convert_bool(value)

    @pytest.mark.parametrize("value", ["No", "NO", "no", "0", "OFF", "off", "false", "False", False])
    def test_convert_bool_false(self, value) -> None:
        assert not bs.convert_bool(value)

    @pytest.mark.parametrize("value", [True, False])
    def test_convert_bool_identity(self, value) -> None:
        assert bs.convert_bool(value) == value

    def test_convert_bool_bad(self) -> None:
        with pytest.raises(ValueError):
            bs.convert_bool("junk")

    @pytest.mark.parametrize("value", ["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"])
    def test_convert_logging_good(self, value) -> None:
        assert bs.convert_logging(value) == getattr(logging, value)

        # check lowercase works too
        assert bs.convert_logging(value.lower()) == getattr(logging, value)

    def test_convert_logging_none(self) -> None:
        assert bs.convert_logging("NONE") == None

        # check lowercase works
        assert bs.convert_logging("none") == None

        # check value works
        assert bs.convert_logging(None) == None

    @pytest.mark.parametrize("value", ["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"])
    def test_convert_logging_identity(self, value) -> None:
        level = getattr(logging, value)
        assert bs.convert_logging(level) == level

    def test_convert_logging_bad(self) -> None:
        with pytest.raises(ValueError):
            bs.convert_logging("junk")

class TestPrioritizedSetting:
    def test_env_var_property(self) -> None:
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO")
        assert ps.env_var == "BOKEH_FOO"

    def test_everything_unset_raises(self) -> None:
        ps = bs.PrioritizedSetting("foo")
        with pytest.raises(RuntimeError):
            ps()

    def test_implict_default(self) -> None:
        ps = bs.PrioritizedSetting("foo", default=10)
        assert ps() == 10

    def test_implict_default_converts(self) -> None:
        ps = bs.PrioritizedSetting("foo", convert=int, default="10")
        assert ps() == 10

    def test_help(self) -> None:
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO", default=10, help="bar")
        assert ps.help == "bar"

    def test_name(self) -> None:
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO", default=10)
        assert ps.name == "foo"

    def test_global_default(self) -> None:
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO", default=10)
        assert ps.default == 10
        assert ps() == 10

    def test_local_default(self) -> None:
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO", default=10)
        assert ps.default == 10
        assert ps(default=20) == 20

    def test_dev_default(self) -> None:
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO", default=10, dev_default=25)
        assert ps.dev_default == 25
        os.environ['BOKEH_DEV'] = "yes"
        assert ps() == 25
        assert ps(default=20) == 25
        del os.environ['BOKEH_DEV']

    def test_env_var(self) -> None:
        os.environ["BOKEH_FOO"] = "30"
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO")
        assert ps.env_var == "BOKEH_FOO"
        assert ps() == "30"
        assert ps(default=20) == "30"
        del os.environ["BOKEH_FOO"]

    def test_env_var_converts(self) -> None:
        os.environ["BOKEH_FOO"] = "30"
        ps = bs.PrioritizedSetting("foo", convert=int, env_var="BOKEH_FOO")
        assert ps() == 30
        del os.environ["BOKEH_FOO"]

    def test_user_set(self) -> None:
        ps = bs.PrioritizedSetting("foo")
        ps.set_value(40)
        assert ps() == 40
        assert ps(default=20) == 40

    def test_user_unset(self) -> None:
        ps = bs.PrioritizedSetting("foo", default=2)
        ps.set_value(40)
        assert ps() == 40
        ps.unset_value()
        assert ps() == 2

    def test_user_set_converts(self) -> None:
        ps = bs.PrioritizedSetting("foo", convert=int)
        ps.set_value("40")
        assert ps() == 40

    def test_immediate(self) -> None:
        ps = bs.PrioritizedSetting("foo")
        assert ps(50) == 50
        assert ps(50, default=20) == 50

    def test_immediate_converts(self) -> None:
        ps = bs.PrioritizedSetting("foo", convert=int)
        assert ps("50") == 50

    def test_precedence(self) -> None:
        class FakeSettings:
            config_override = {}
            config_user = {}
            config_system = {}

        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO", convert=int, default=0, dev_default=15)
        ps._parent = FakeSettings

        # 0. global default
        assert ps() == 0

        # 1. local default
        assert ps(default=10) == 10

        # 1.5. implicit default (DEV)
        os.environ['BOKEH_DEV'] = "yes"
        assert ps() == 15
        del os.environ['BOKEH_DEV']

        # 2. global config file
        FakeSettings.config_system['foo'] = 20
        assert ps() == 20
        assert ps(default=10) == 20

        # 3. local config file
        FakeSettings.config_user['foo'] = 30
        assert ps() == 30
        assert ps(default=10) == 30

        # 4. environment variable
        os.environ["BOKEH_FOO"] = "40"
        assert ps() == 40
        assert ps(default=10) == 40

        # 5. override config file
        FakeSettings.config_override['foo'] = 50
        assert ps() == 50
        assert ps(default=10) == 50

        # 6. previously user-set value
        ps.set_value(60)
        assert ps() == 60
        assert ps(default=10) == 60

        # 7. immediate values
        assert ps(70) == 70
        assert ps(70, default=10) == 70

        del os.environ["BOKEH_FOO"]

    def test_descriptors(self) -> None:
        class FakeSettings:
            foo = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO")
            bar = bs.PrioritizedSetting("bar", env_var="BOKEH_BAR", default=10)

        s = FakeSettings()
        assert s.foo is FakeSettings.foo

        assert s.bar() == 10
        s.bar = 20
        assert s.bar() == 20

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
