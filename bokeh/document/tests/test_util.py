import bokeh.document.util as bdu

from bokeh.document import Document

from .setup import AnotherModelInTestDocument, SomeModelInTestDocument

def test_compute_one_attribute_patch():
    d = Document()
    root1 = SomeModelInTestDocument(foo=42)
    child1 = SomeModelInTestDocument(foo=43)
    root1.child = child1
    d.add_root(root1)

    before = d.to_json()

    root1.foo = 47

    after = d.to_json()

    patch = bdu.compute_patch_between_json(before, after)

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

def test_compute_two_attribute_patch():
    d = Document()
    root1 = SomeModelInTestDocument(foo=42)
    child1 = AnotherModelInTestDocument(bar=43)
    root1.child = child1
    d.add_root(root1)

    before = d.to_json()

    root1.foo=47
    child1.bar=57

    after = d.to_json()

    patch = bdu.compute_patch_between_json(before, after)

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

def test_compute_remove_root_patch():
    d = Document()
    root1 = SomeModelInTestDocument(foo=42)
    child1 = AnotherModelInTestDocument(bar=43)
    root1.child = child1
    d.add_root(root1)

    before = d.to_json()

    d.remove_root(root1)

    after = d.to_json()

    patch = bdu.compute_patch_between_json(before, after)

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

def test_compute_add_root_patch():
    d = Document()
    root1 = SomeModelInTestDocument(foo=42)
    child1 = AnotherModelInTestDocument(bar=43)
    root1.child = child1
    d.add_root(root1)

    before = d.to_json()

    root2 = SomeModelInTestDocument(foo=57)
    d.add_root(root2)

    after = d.to_json()

    patch = bdu.compute_patch_between_json(before, after)

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
