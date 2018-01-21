from __future__ import absolute_import

import bokeh.util.compiler as buc

from mock import patch

def test_nodejs_compile_coffeescript():
    assert buc.nodejs_compile("""(a, b) -> a + b""", "coffeescript", "some.coffee") == \
        dict(code="""\
(function (a, b) {
    return a + b;
});
""", deps=[])

    assert buc.nodejs_compile("""some = require 'some/module'""", "coffeescript", "some.coffee") == \
        dict(code="""\
var some;
some = require('some/module');
""", deps=["some/module"])

    assert buc.nodejs_compile("""(a, b) -> a + b +""", "coffeescript", "some.coffee") == \
        dict(error=dict(
            message="unexpected end of input",
            text="some.coffee:unexpected end of input"))

    assert buc.nodejs_compile("""some = require some/module'""", "coffeescript", "some.coffee") == \
        dict(error=dict(
            line=1,
            column=27,
            message="missing '",
            text="some.coffee:1:27:missing '",
            extract="some = require some/module'",
            annotated="some.coffee:1:27:missing '\n  some = require some/module'\n                            ^"))

    assert buc.nodejs_compile("""(a, b) -> a + b +""", "coffeescript", "some.coffee") == \
        dict(error=dict(
            message="unexpected end of input",
            text="some.coffee:unexpected end of input"))

    assert buc.nodejs_compile("""some = require some/module'""", "coffeescript", "some.coffee") == \
        dict(error=dict(
            line=1,
            column=27,
            message="missing '",
            text="some.coffee:1:27:missing '",
            extract="some = require some/module'",
            annotated="some.coffee:1:27:missing '\n  some = require some/module'\n                            ^"))

def test_nodejs_compile_javascript():
    assert buc.nodejs_compile("""function f(a, b) { return a + b; };""", "javascript", "some.js") == \
        dict(code="""\
function f(a, b) { return a + b; }
;
""", deps=[])

    assert buc.nodejs_compile("""var some = require('some/module');""", "javascript", "some.js") == \
        dict(code="""\
var some = require('some/module');
""", deps=["some/module"])

    assert buc.nodejs_compile("""function f(a, b) { eturn a + b; };""", "javascript", "some.js") == \
        dict(error=dict(
            line=1,
            column=26,
            message="';' expected.",
            text="some.js:1:26:';' expected."))

def test_nodejs_compile_less():
    assert buc.nodejs_compile(""".bk-some-style { color: mix(#ff0000, #0000ff, 50%); }""", "less", "some.less") == \
        dict(code=""".bk-some-style{color:#800080}""")

    assert buc.nodejs_compile(""".bk-some-style color: green; }""", "less", "some.less") == \
        dict(error=dict(
            line=1,
            column=21,
            message="Unrecognised input",
            text="some.less:1:21:Unrecognised input",
            extract=".bk-some-style color: green; }",
            annotated="some.less:1:21:Unrecognised input\n  .bk-some-style color: green; }"))

def test_Implementation():
    obj = buc.Implementation()
    assert obj.file == None

def test_Inline():
    obj = buc.Inline("code")
    assert obj.code == "code"
    assert obj.file == None

    obj = buc.Inline("code", "file")
    assert obj.code == "code"
    assert obj.file == "file"

def test_CoffeeScript():
    obj = buc.CoffeeScript("code")
    assert isinstance(obj, buc.Inline)
    assert obj.code == "code"
    assert obj.file == None
    assert obj.lang == "coffeescript"

def test_TypeScript():
    obj = buc.TypeScript("code")
    assert isinstance(obj, buc.Inline)
    assert obj.code == "code"
    assert obj.file == None
    assert obj.lang == "typescript"

def test_JavaScript():
    obj = buc.JavaScript("code")
    assert isinstance(obj, buc.Inline)
    assert obj.code == "code"
    assert obj.file == None
    assert obj.lang == "javascript"

def test_Less():
    obj = buc.Less("code")
    assert isinstance(obj, buc.Inline)
    assert obj.code == "code"
    assert obj.file == None
    assert obj.lang == "less"

@patch('io.open')
def test_FromFile(mock_open):
    obj = buc.FromFile("path.coffee")
    assert obj.lang == "coffeescript"

    obj = buc.FromFile("path.ts")
    assert obj.lang == "typescript"

    obj = buc.FromFile("path.js")
    assert obj.lang == "javascript"

    obj = buc.FromFile("path.css")
    assert obj.lang == "less"

    obj = buc.FromFile("path.less")
    assert obj.lang == "less"

def test_exts():
    assert buc.exts == (".coffee", ".ts", ".js", ".css", ".less")
