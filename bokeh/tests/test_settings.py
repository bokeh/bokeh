#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import logging
import os

# External imports

# Bokeh imports
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.settings as bs

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
    'cookie_secret',
    'docs_cdn',
    'docs_version',
    'ignore_filename',
    'log_level',
    'minified',
    'nodejs_path',
    'perform_document_validation',
    'phantomjs_path',
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
    'version',
    'xsrf_cookies',
)

class TestSettings(object):

    def test_standard_settings(self):
        settings = [k for k,v in bs.settings.__class__.__dict__.items() if isinstance(v, bs.PrioritizedSetting)]
        assert set(settings) == set(_expected_settings)

    @pytest.mark.parametrize("name", _expected_settings)
    def test_prefix(self, name):
        ps = getattr(bs.settings, name)
        assert ps.env_var.startswith("BOKEH_")

    @pytest.mark.parametrize("name", _expected_settings)
    def test_parent(self, name):
        ps = getattr(bs.settings, name)
        assert ps._parent == bs.settings

    def test_types(self):
        assert bs.settings.ignore_filename.convert_type == "Bool"
        assert bs.settings.minified.convert_type == "Bool"
        assert bs.settings.perform_document_validation.convert_type == "Bool"
        assert bs.settings.simple_ids.convert_type == "Bool"
        assert bs.settings.strict.convert_type == "Bool"
        assert bs.settings.xsrf_cookies.convert_type == "Bool"

        assert bs.settings.py_log_level.convert_type == "Log Level"

        assert bs.settings.allowed_ws_origin.convert_type == "List[String]"

        default_typed = set(_expected_settings) - set([
            'ignore_filename',
            'minified',
            'perform_document_validation',
            'simple_ids',
            'strict',
            'py_log_level',
            'allowed_ws_origin',
            'xsrf_cookies',
        ])
        for name in default_typed:
            ps = getattr(bs.settings, name)
            assert ps.convert_type == "String"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class TestConverters(object):
    @pytest.mark.parametrize("value", ["Yes", "YES", "yes", "1", "ON", "on", "true", "True", True])
    def test_convert_bool(self, value):
        assert bs.convert_bool(value)

    @pytest.mark.parametrize("value", ["No", "NO", "no", "0", "OFF", "off", "false", "False", False])
    def test_convert_bool_false(self, value):
        assert not bs.convert_bool(value)

    @pytest.mark.parametrize("value", [True, False])
    def test_convert_bool_identity(self, value):
        assert bs.convert_bool(value) == value

    def test_convert_bool_bad(self):
        with pytest.raises(ValueError):
            bs.convert_bool("junk")

    @pytest.mark.parametrize("value", ["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"])
    def test_convert_logging_good(self, value):
        assert bs.convert_logging(value) == getattr(logging, value)

        # check lowercase works too
        assert bs.convert_logging(value.lower()) == getattr(logging, value)

    def test_convert_logging_none(self):
        assert bs.convert_logging("NONE") == None

        # check lowercase works
        assert bs.convert_logging("none") == None

        # check value works
        assert bs.convert_logging(None) == None

    @pytest.mark.parametrize("value", ["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"])
    def test_convert_logging_identity(self, value):
        level = getattr(logging, value)
        assert bs.convert_logging(level) == level

    def test_convert_logging_bad(self):
        with pytest.raises(ValueError):
            bs.convert_logging("junk")

class TestPrioritizedSetting(object):
    def test_env_var_property(self):
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO")
        assert ps.env_var == "BOKEH_FOO"

    def test_everything_unset_raises(self):
        ps = bs.PrioritizedSetting("foo")
        with pytest.raises(RuntimeError):
            ps()

    def test_implict_default(self):
        ps = bs.PrioritizedSetting("foo", default=10)
        assert ps() == 10

    def test_implict_default_converts(self):
        ps = bs.PrioritizedSetting("foo", convert=int, default="10")
        assert ps() == 10

    def test_help(self):
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO", default=10, help="bar")
        assert ps.help == "bar"

    def test_name(self):
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO", default=10)
        assert ps.name == "foo"

    def test_default(self):
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO", default=10)
        assert ps.default == 10
        assert ps() == 10

    def test_dev_default(self):
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO", default=10, dev_default=20)
        assert ps.dev_default == 20
        os.environ['BOKEH_DEV'] = "yes"
        assert ps() == 20
        del os.environ['BOKEH_DEV']

    def test_env_var(self):
        os.environ["BOKEH_FOO"] = "30"
        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO")
        assert ps.env_var == "BOKEH_FOO"
        assert ps() == "30"
        del os.environ["BOKEH_FOO"]

    def test_env_var_converts(self):
        os.environ["BOKEH_FOO"] = "30"
        ps = bs.PrioritizedSetting("foo", convert=int, env_var="BOKEH_FOO")
        assert ps() == 30
        del os.environ["BOKEH_FOO"]

    def test_user_set(self):
        ps = bs.PrioritizedSetting("foo")
        ps.set_value(40)
        assert ps() == 40

    def test_user_unset(self):
        ps = bs.PrioritizedSetting("foo", default=2)
        ps.set_value(40)
        assert ps() == 40
        ps.unset_value()
        assert ps() == 2

    def test_user_set_converts(self):
        ps = bs.PrioritizedSetting("foo", convert=int)
        ps.set_value("40")
        assert ps() == 40

    def test_immediate(self):
        ps = bs.PrioritizedSetting("foo")
        assert ps(50) == 50

    def test_immediate_converts(self):
        ps = bs.PrioritizedSetting("foo", convert=int)
        assert ps("50") == 50

    def test_precedence(self):
        class FakeSettings(object):
            config_override = {}
            config_user = {}
            config_system = {}

        ps = bs.PrioritizedSetting("foo", env_var="BOKEH_FOO", convert=int, default=0, dev_default=5)
        ps._parent = FakeSettings

        # 0. implicit default
        assert ps() == 0

        # 0. implicit default (DEV)
        os.environ['BOKEH_DEV'] = "yes"
        assert ps() == 5
        del os.environ['BOKEH_DEV']

        # 1. global config file
        FakeSettings.config_system['foo'] = 10
        assert ps() == 10

        # 2. local config file
        FakeSettings.config_user['foo'] = 20
        assert ps() == 20

        # 3. environment variable
        os.environ["BOKEH_FOO"] = "30"
        assert ps() == 30

        # 4. override config file
        FakeSettings.config_override['foo'] = 40
        assert ps() == 40

        # 5. previously user-set value
        ps.set_value(50)
        assert ps() == 50

        # 6. immediate values
        assert ps(60) == 60

        del os.environ["BOKEH_FOO"]

    def test_descriptors(self):
        class FakeSettings(object):
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
