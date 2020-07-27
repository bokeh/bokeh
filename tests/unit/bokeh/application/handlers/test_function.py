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

# Bokeh imports
from bokeh.core.properties import Instance, Int
from bokeh.document import Document
from bokeh.model import Model

# Module under test
import bokeh.application.handlers.function as bahf # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class AnotherModelInTestFunction(Model):
    bar = Int(1)

class SomeModelInTestFunction(Model):
    foo = Int(2)
    child = Instance(Model)


class Test_FunctionHandler:
    # Public methods ----------------------------------------------------------

    def test_empty_func(self) -> None:
        def noop(doc):
            pass
        handler = bahf.FunctionHandler(noop)
        doc = Document()
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert not doc.roots

    def test_func_adds_roots(self) -> None:
        def add_roots(doc):
            doc.add_root(AnotherModelInTestFunction())
            doc.add_root(SomeModelInTestFunction())
        handler = bahf.FunctionHandler(add_roots)
        doc = Document()
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert len(doc.roots) == 2

    def test_safe_to_fork(self) -> None:
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
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
