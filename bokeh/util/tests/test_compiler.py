from __future__ import absolute_import

from mock import Mock

import bokeh.util.compiler as buc

def test_nodejs_compile_coffeescript():
    assert buc.nodejs_compile("""(a, b) -> a + b""", "coffeescript", "some.coffee") == \
        dict(code="""\
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function (a, b) {
    return a + b;
});
""", deps=[])

    assert buc.nodejs_compile("""some = require 'some/module'""", "coffeescript", "some.coffee") == \
        dict(code="""\
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function f(a, b) { return a + b; }
;
""", deps=[])

    assert buc.nodejs_compile("""var some = require('some/module');""", "javascript", "some.js") == \
        dict(code="""\
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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

def test__detect_nodejs_calls_wait():
    m = Mock()
    old_Popen = buc.Popen
    buc.Popen = lambda *args, **kw: m
    buc._detect_nodejs()
    assert m.wait.called
    buc.Popen = old_Popen
