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
import os
from os.path import abspath, dirname
import sys
from types import ModuleType

# External imports

# Bokeh imports

# Module under test
import bokeh.application.handlers.code_runner as bahc

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class TestCodeRunner(object):

    # Public methods ----------------------------------------------------------

    def test_init(self):
        cr = bahc.CodeRunner("# test", "path", [])
        assert cr.failed is False
        assert cr.error is None
        assert cr.error_detail is None
        assert cr.ran is False
        assert cr.source == "# test"
        assert cr.path == "path"

    def test_syntax_error_init(self):
        cr = bahc.CodeRunner("This is a syntax error", "path", [])
        assert cr.failed is True
        assert "Invalid syntax in" in cr.error
        assert cr.error_detail is not None

    def test_new_module_success(self):
        cr = bahc.CodeRunner("# test", "path", [])
        m = cr.new_module()
        assert isinstance(m, ModuleType)
        assert m.__dict__['__name__'].startswith('bk_script_')
        assert m.__dict__['__file__'] == abspath("path")

    def test_new_module_resets_run_errors(self):
        cr = bahc.CodeRunner("# test", "path", [])
        cr._failed = True
        m = cr.new_module()
        assert isinstance(m, ModuleType)
        assert m.__dict__['__name__'].startswith('bk_script_')
        assert m.__dict__['__file__'] == abspath("path")

    def test_new_module_returns_None_for_permanent_errors(self):
        cr = bahc.CodeRunner("This is a syntax error", "path", [])
        assert cr.failed is True
        m = cr.new_module()
        assert m is None

    def test_reset_run_errors(self):
        cr = bahc.CodeRunner("# test", "path", [])
        cr._failed = True
        cr._error = "error"
        cr._error_detail = "detail"
        cr.reset_run_errors()
        assert cr.failed is False
        assert cr.error is None
        assert cr.error_detail is None

    def test_reset_run_errors_leaves_permanent_errors(self):
        cr = bahc.CodeRunner("This is a syntax error", "path", [])
        cr._failed = True
        cr.reset_run_errors()
        assert cr.failed is True
        assert cr.error is not None
        assert cr.error_detail is not None

    def test_run_sets_ran(self):
        cr = bahc.CodeRunner("# test", "path", [])
        m = cr.new_module()
        assert not cr.ran
        cr.run(m, lambda: None)
        assert cr.ran

    def test_run_runs_post_check(self):
        cr = bahc.CodeRunner("# test", "path", [])
        m = cr.new_module()
        assert not cr.ran
        result = {}
        def post_check():
            result['ran'] = True
        cr.run(m, post_check)
        assert cr.ran
        assert result == dict(ran=True)

    def test_run_fixups_argv(self):
        cr = bahc.CodeRunner("import sys; argv = list(sys.argv)", "path", ["foo", 10])
        assert not cr.ran
        m = cr.new_module()
        cr.run(m, lambda: None)
        assert m.__dict__['argv'] == ["path", "foo", 10]

    def test_run_fixups_path(self):
        cr = bahc.CodeRunner("import sys; path = list(sys.path)", "/dir/to/path", ["foo", 10])
        assert not cr.ran
        m = cr.new_module()
        cr.run(m, lambda: None)
        assert m.__dict__['path'][0] == dirname("/dir/to/path")
        assert m.__dict__['path'][1:] == sys.path

    def test_run_restores_cwd(self):
        old_cwd = os.getcwd()
        cr = bahc.CodeRunner("import os; os.chdir('/')", "path", ["foo", 10])
        assert not cr.ran
        m = cr.new_module()
        cr.run(m, lambda: None)
        assert os.getcwd() == old_cwd

    def test_run_restores_argv(self):
        old_argv = list(sys.argv)
        cr = bahc.CodeRunner("# test", "path", ["foo", 10])
        assert not cr.ran
        m = cr.new_module()
        cr.run(m, lambda: None)
        assert sys.argv == old_argv

    def test_run_restores_path(self):
        old_path = list(sys.path)
        cr = bahc.CodeRunner("# test", "path", ["foo", 10])
        assert not cr.ran
        m = cr.new_module()
        cr.run(m, lambda: None)
        assert sys.path == old_path

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
