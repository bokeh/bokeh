#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

from bokeh.util.api import INTERNAL, PUBLIC ; INTERNAL, PUBLIC
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

# Module under test
import bokeh.io.notebook as binb

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    PUBLIC: (

        ( 'CommsHandle',            (1, 0, 0) ),
        ( 'CommsHandle.comms.fget', (1, 0, 0) ),
        ( 'CommsHandle.doc.fget',   (1, 0, 0) ),
        ( 'CommsHandle.json.fget',  (1, 0, 0) ),
        ( 'CommsHandle.update',     (1, 0, 0) ),
        ( 'install_notebook_hook',  (1, 0, 0) ),
        ( 'push_notebook',          (1, 0, 0) ),
        ( 'run_notebook_hook',      (1, 0, 0) ),

    ), INTERNAL: (

        ( 'destroy_server', (1, 0, 0) ),
        ( 'get_comms',      (1, 0, 0) ),
        ( 'load_notebook',  (1, 0, 0) ),

    )

}

test_public_api, test_internal_api, test_all_declared, test_all_tested = verify_api(binb, api)

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

def test_install_notebook_hook():
    binb.install_notebook_hook("foo", "load", "doc", "app")
    assert binb._HOOKS["foo"]['load'] == "load"
    assert binb._HOOKS["foo"]['doc'] == "doc"
    assert binb._HOOKS["foo"]['app'] == "app"
    with pytest.raises(RuntimeError):
        binb.install_notebook_hook("foo", "load2", "doc2", "app2")
    binb.install_notebook_hook("foo", "load2", "doc2", "app2", overwrite=True)
    assert binb._HOOKS["foo"]['load'] == "load2"
    assert binb._HOOKS["foo"]['doc'] == "doc2"
    assert binb._HOOKS["foo"]['app'] == "app2"

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__compute_patch_between_json_one_attribute_patch():
    from bokeh.document import Document
    from bokeh.document.tests.setup import SomeModelInTestDocument
    d = Document()
    root1 = SomeModelInTestDocument(foo=42)
    child1 = SomeModelInTestDocument(foo=43)
    root1.child = child1
    d.add_root(root1)

    before = d.to_json()

    root1.foo = 47

    after = d.to_json()

    patch = binb._compute_patch_between_json(before, after)

    expected = dict(references=[],
                    events=[
                        {'attr': u'foo',
                         'kind': 'ModelChanged',
                         'model': {'id': None,
                                   'type': 'SomeModelInTestDocument'},
                         'new': 47}
                    ])
    expected['events'][0]['model']['id'] = root1._id
    assert expected == patch

    d2 = Document.from_json(before)
    d2.apply_json_patch(patch)
    assert root1.foo == d2.roots[0].foo

def test__compute_patch_between_json_two_attribute_patch():
    from bokeh.document import Document
    from bokeh.document.tests.setup import AnotherModelInTestDocument, SomeModelInTestDocument
    d = Document()
    root1 = SomeModelInTestDocument(foo=42)
    child1 = AnotherModelInTestDocument(bar=43)
    root1.child = child1
    d.add_root(root1)

    before = d.to_json()

    root1.foo=47
    child1.bar=57

    after = d.to_json()

    patch = binb._compute_patch_between_json(before, after)

    expected = dict(references=[],
                    events=[
                        {'attr': u'bar',
                         'kind': 'ModelChanged',
                         'model': {'id': None,
                                   'type': 'AnotherModelInTestDocument'},
                         'new': 57},
                        {'attr': u'foo',
                         'kind': 'ModelChanged',
                         'model': {'id': None,
                                   'type': 'SomeModelInTestDocument'},
                         'new': 47}
                        ])
    expected['events'][0]['model']['id'] = child1._id
    expected['events'][1]['model']['id'] = root1._id

    # order is undefined, so fix our expectation if needed
    assert len(patch['events']) == 2
    if patch['events'][0]['model']['type'] == 'AnotherModelInTestDocument':
        pass
    else:
        tmp = expected['events'][0]
        expected['events'][0] = expected['events'][1]
        expected['events'][1] = tmp

    assert expected == patch

    d2 = Document.from_json(before)
    d2.apply_json_patch(patch)
    assert root1.foo == d2.roots[0].foo
    assert root1.child.bar == d2.roots[0].child.bar

def test__compute_patch_between_json_remove_root_patch():
    from bokeh.document import Document
    from bokeh.document.tests.setup import AnotherModelInTestDocument, SomeModelInTestDocument
    d = Document()
    root1 = SomeModelInTestDocument(foo=42)
    child1 = AnotherModelInTestDocument(bar=43)
    root1.child = child1
    d.add_root(root1)

    before = d.to_json()

    d.remove_root(root1)

    after = d.to_json()

    patch = binb._compute_patch_between_json(before, after)

    expected = dict(references=[],
                    events= [
                        {'kind': 'RootRemoved',
                         'model': {'id': None,
                                   'type': 'SomeModelInTestDocument'}}
                    ])
    expected['events'][0]['model']['id'] = root1._id

    assert expected == patch

    d2 = Document.from_json(before)
    d2.apply_json_patch(patch)
    assert d2.roots == []

def test__compute_patch_between_json_add_root_patch():
    from bokeh.document import Document
    from bokeh.document.tests.setup import AnotherModelInTestDocument, SomeModelInTestDocument
    d = Document()
    root1 = SomeModelInTestDocument(foo=42)
    child1 = AnotherModelInTestDocument(bar=43)
    root1.child = child1
    d.add_root(root1)

    before = d.to_json()

    root2 = SomeModelInTestDocument(foo=57)
    d.add_root(root2)

    after = d.to_json()

    patch = binb._compute_patch_between_json(before, after)

    expected = {
        'references' : [
            { 'attributes': {'child': None, 'foo': 57},
              'id': None,
              'type': 'SomeModelInTestDocument'}
        ],
        'events' : [
            { 'kind': 'RootAdded',
              'model': {'id': None,
                        'type': 'SomeModelInTestDocument'}
            }
        ]
    }

    expected['references'][0]['id'] = root2._id
    expected['events'][0]['model']['id'] = root2._id

    assert expected == patch

    d2 = Document.from_json(before)
    d2.apply_json_patch(patch)
    assert len(d2.roots) == 2
    assert d2.roots[0].foo == 42
    assert d2.roots[1].foo == 57
