#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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

# External imports

# Bokeh imports
from bokeh.core.properties import Int, Instance
from bokeh.document import Document
from bokeh.model import Model

# Module under test
import bokeh.application.handlers.function as bahf

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class AnotherModelInTestFunction(Model):
    bar = Int(1)

class SomeModelInTestFunction(Model):
    foo = Int(2)
    child = Instance(Model)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_FunctionHandler(object):

    def test_empty_func(self):
        def noop(doc):
            pass
        handler = bahf.FunctionHandler(noop)
        doc = Document()
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert not doc.roots

    def test_func_adds_roots(self):
        def add_roots(doc):
            doc.add_root(AnotherModelInTestFunction())
            doc.add_root(SomeModelInTestFunction())
        handler = bahf.FunctionHandler(add_roots)
        doc = Document()
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert len(doc.roots) == 2

    def test_safe_to_fork(self):
        def noop(doc):
            pass
        handler = bahf.FunctionHandler(noop)
        doc = Document()
        assert handler.safe_to_fork
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert not handler.safe_to_fork

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
