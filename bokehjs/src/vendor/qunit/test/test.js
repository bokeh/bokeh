test("module without setup/teardown (default)", function() {
	expect(1);
	ok(true);
});

test("expect in test", 3, function() {
	ok(true);
	ok(true);
	ok(true);
});

test("expect in test", 1, function() {
	ok(true);
});

test("expect query and multiple issue", function() {
	expect(2);
	ok(true);
	var expected = expect();
	equal(expected, 2);
	expect(expected + 1);
	ok(true);
});

QUnit.module("assertion helpers");

QUnit.test( "QUnit.assert compatibility", function( assert ) {
	QUnit.expect(4);

	assert.ok( true, "Calling method on `assert` argument to test() callback" );

	// Should also work, although not documented
	QUnit.assert.ok( true, "Calling method on QUnit.assert object" );

	// Test compatibility aliases
	QUnit.ok( true, "Calling aliased method in QUnit root object" );
	ok( true, "Calling aliased function in global namespace" );
});

module("setup test", {
	setup: function() {
		ok(true);
	}
});

test("module with setup", function() {
	expect(2);
	ok(true);
});

test("module with setup, expect in test call", 2, function() {
	ok(true);
});

var state;

module("setup/teardown test", {
	setup: function() {
		state = true;
		ok(true);
		x = 1;
	},
	teardown: function() {
		ok(true);
		// can introduce and delete globals in setup/teardown
		// without noglobals sounding the alarm
		delete x;
	}
});

test("module with setup/teardown", function() {
	expect(3);
	ok(true);
});

module("setup/teardown test 2");

test("module without setup/teardown", function() {
	expect(1);
	ok(true);
});



var orgDate;

module("Date test", {
	setup: function() {
		orgDate = Date;
		Date = function () {
			ok( false, 'QUnit should internally be independant from Date-related manipulation and testing' );
			return new orgDate();
		};
	},
	teardown: function() {
		Date = orgDate;
	}
});

test("sample test for Date test", function () {
	expect(1);
	ok(true);
});

if (typeof setTimeout !== 'undefined') {
state = 'fail';

module("teardown and stop", {
	teardown: function() {
		equal(state, "done", "Test teardown.");
	}
});

test("teardown must be called after test ended", function() {
	expect(1);
	stop();
	setTimeout(function() {
		state = "done";
		start();
	}, 13);
});

test("parameter passed to stop increments semaphore n times", function() {
	expect(1);
	stop(3);
	setTimeout(function() {
		state = "not enough starts";
		start(), start();
	}, 13);
	setTimeout(function() {
		state = "done";
		start();
	}, 15);
});

test("parameter passed to start decrements semaphore n times", function() {
	expect(1);
	stop(), stop(), stop();
	setTimeout(function() {
		state = "done";
		start(3);
	}, 18);
});

module("async setup test", {
	setup: function() {
		stop();
		setTimeout(function(){
			ok(true);
			start();
		}, 500);
	}
});

asyncTest("module with async setup", function() {
	expect(2);
	ok(true);
	start();
});

module("async teardown test", {
	teardown: function() {
		stop();
		setTimeout(function(){
			ok(true);
			start();
		}, 500);
	}
});

asyncTest("module with async teardown", function() {
	expect(2);
	ok(true);
	start();
});

module("asyncTest");

asyncTest("asyncTest", function() {
	expect(2);
	ok(true);
	setTimeout(function() {
		state = "done";
		ok(true);
		start();
	}, 13);
});

asyncTest("asyncTest", 2, function() {
	ok(true);
	setTimeout(function() {
		state = "done";
		ok(true);
		start();
	}, 13);
});

test("sync", 2, function() {
	stop();
	setTimeout(function() {
		ok(true);
		start();
	}, 13);
	stop();
	setTimeout(function() {
		ok(true);
		start();
	}, 125);
});

test("test synchronous calls to stop", 2, function() {
	stop();
	setTimeout(function(){
		ok(true, 'first');
		start();
		stop();
		setTimeout(function(){
			ok(true, 'second');
			start();
		}, 150);
	}, 150);
});
}

module("save scope", {
	setup: function() {
		this.foo = "bar";
	},
	teardown: function() {
		deepEqual(this.foo, "bar");
	}
});
test("scope check", function() {
	expect(2);
	deepEqual(this.foo, "bar");
});

module("simple testEnvironment setup", {
	foo: "bar",
	bugid: "#5311" // example of meta-data
});
test("scope check", function() {
	deepEqual(this.foo, "bar");
});
test("modify testEnvironment",function() {
	expect(0);
	this.foo="hamster";
});
test("testEnvironment reset for next test",function() {
	deepEqual(this.foo, "bar");
});

module("testEnvironment with object", {
	options:{
		recipe:"soup",
		ingredients:["hamster","onions"]
	}
});
test("scope check", function() {
	deepEqual(this.options, {recipe:"soup",ingredients:["hamster","onions"]}) ;
});
test("modify testEnvironment",function() {
	expect(0);
	// since we do a shallow copy, the testEnvironment can be modified
	this.options.ingredients.push("carrots");
});
test("testEnvironment reset for next test",function() {
	deepEqual(this.options, {recipe:"soup",ingredients:["hamster","onions","carrots"]}, "Is this a bug or a feature? Could do a deep copy") ;
});


module("testEnvironment tests");

function makeurl() {
	var testEnv = QUnit.current_testEnvironment;
	var url = testEnv.url || 'http://example.com/search';
	var q   = testEnv.q   || 'a search test';
	return url + '?q='+encodeURIComponent(q);
}

test("makeurl working",function() {
	equal( QUnit.current_testEnvironment, this, 'The current testEnvironment is global');
	equal( makeurl(), 'http://example.com/search?q=a%20search%20test', 'makeurl returns a default url if nothing specified in the testEnvironment');
});

module("testEnvironment with makeurl settings", {
	url: 'http://google.com/',
	q: 'another_search_test'
});
test("makeurl working with settings from testEnvironment", function() {
	equal( makeurl(), 'http://google.com/?q=another_search_test', 'rather than passing arguments, we use test metadata to from the url');
});

module("jsDump");
test("jsDump output", function() {
	equal( QUnit.jsDump.parse([1, 2]), "[\n  1,\n  2\n]" );
	equal( QUnit.jsDump.parse({top: 5, left: 0}), "{\n  \"left\": 0,\n  \"top\": 5\n}" );
	if (typeof document !== 'undefined' && document.getElementById("qunit-header")) {
		equal( QUnit.jsDump.parse(document.getElementById("qunit-header")), "<h1 id=\"qunit-header\"></h1>" );
		equal( QUnit.jsDump.parse(document.getElementsByTagName("h1")), "[\n  <h1 id=\"qunit-header\"></h1>\n]" );
	}
});

module("assertions");
test("raises",function() {
	function CustomError( message ) {
		this.message = message;
	}

	CustomError.prototype.toString = function() {
		return this.message;
	};

	throws(
		function() {
			throw "my error"
		}
	);

	throws(
		function() {
			throw "my error"
		},
		"simple string throw, no 'expected' value given"
	);

	throws(
		function() {
			throw new CustomError();
		},
		CustomError,
		'thrown error is an instance of CustomError'
	);

	throws(
		function() {
			throw new CustomError("some error description");
		},
		/description/,
		"use a regex to match against the stringified error"
	);

	throws(
		function() {
			throw new CustomError("some error description");
		},
		function( err ) {
			if ( (err instanceof CustomError) && /description/.test(err) ) {
				return true;
			}
		},
		"custom validation function"
	);

	throws(
		function() {
			( window.execScript || function( data ) {
				window["eval"].call( window, data );
			})( "throw 'error'" );
		},
		'globally-executed errors caught'
	);

    this.CustomError = CustomError;

    throws(
        function() {
            throw new this.CustomError("some error description");
        },
        /description/,
        "throw error from property of 'this' context"
    );

    raises(
        function() {
            throw "error"
        },
        "simple throw, asserting with deprecated raises() function"
    );

});

if (typeof document !== "undefined") {

module("fixture");
test("setup", function() {
	expect(0);
	document.getElementById("qunit-fixture").innerHTML = "foobar";
});
test("basics", function() {
	equal( document.getElementById("qunit-fixture").innerHTML, "test markup", "automatically reset" );
});

test("running test name displayed", function() {
	expect(2);

	var displaying = document.getElementById("qunit-testresult");

	ok( /running test name displayed/.test(displaying.innerHTML), "Expect test name to be found in displayed text" );
	ok( /fixture/.test(displaying.innerHTML), "Expect module name to be found in displayed text" );
});

}

module("custom assertions");
(function() {
	function mod2(value, expected, message) {
		var actual = value % 2;
		QUnit.push(actual == expected, actual, expected, message);
	}
	test("mod2", function() {
		mod2(2, 0, "2 % 2 == 0");
		mod2(3, 1, "3 % 2 == 1");
	});
})();


module("recursions");

function Wrap(x) {
	this.wrap = x;
	if (x == undefined)  this.first = true;
}

function chainwrap(depth, first, prev) {
	depth = depth || 0;
	var last = prev || new Wrap();
	first = first || last;

	if (depth == 1) {
		first.wrap = last;
	}
	if (depth > 1) {
		last = chainwrap(depth-1, first, new Wrap(last));
	}

	return last;
}

test("check jsDump recursion", function() {
	expect(4);

	var noref = chainwrap(0);
	var nodump = QUnit.jsDump.parse(noref);
	equal(nodump, '{\n  "first": true,\n  "wrap": undefined\n}');

	var selfref = chainwrap(1);
	var selfdump = QUnit.jsDump.parse(selfref);
	equal(selfdump, '{\n  "first": true,\n  "wrap": recursion(-1)\n}');

	var parentref = chainwrap(2);
	var parentdump = QUnit.jsDump.parse(parentref);
	equal(parentdump, '{\n  "wrap": {\n    "first": true,\n    "wrap": recursion(-2)\n  }\n}');

	var circref = chainwrap(10);
	var circdump = QUnit.jsDump.parse(circref);
	ok(new RegExp("recursion\\(-10\\)").test(circdump), "(" +circdump + ") should show -10 recursion level");
});

test("check (deep-)equal recursion", function() {
	var noRecursion = chainwrap(0);
	equal(noRecursion, noRecursion, "I should be equal to me.");
	deepEqual(noRecursion, noRecursion, "... and so in depth.");

	var selfref = chainwrap(1);
	equal(selfref, selfref, "Even so if I nest myself.");
	deepEqual(selfref, selfref, "... into the depth.");

	var circref = chainwrap(10);
	equal(circref, circref, "Or hide that through some levels of indirection.");
	deepEqual(circref, circref, "... and checked on all levels!");
});


test('Circular reference with arrays', function() {

	// pure array self-ref
	var arr = [];
	arr.push(arr);

	var arrdump = QUnit.jsDump.parse(arr);

	equal(arrdump, '[\n  recursion(-1)\n]');
	equal(arr, arr[0], 'no endless stack when trying to dump arrays with circular ref');


	// mix obj-arr circular ref
	var obj = {};
	var childarr = [obj];
	obj.childarr = childarr;

	var objdump = QUnit.jsDump.parse(obj);
	var childarrdump = QUnit.jsDump.parse(childarr);

	equal(objdump, '{\n  "childarr": [\n    recursion(-2)\n  ]\n}');
	equal(childarrdump, '[\n  {\n    "childarr": recursion(-2)\n  }\n]');

	equal(obj.childarr, childarr, 'no endless stack when trying to dump array/object mix with circular ref');
	equal(childarr[0], obj, 'no endless stack when trying to dump array/object mix with circular ref');

});


test('Circular reference - test reported by soniciq in #105', function() {
	var MyObject = function() {};
	MyObject.prototype.parent = function(obj) {
		if (obj === undefined) { return this._parent; }
		this._parent = obj;
	};
	MyObject.prototype.children = function(obj) {
		if (obj === undefined) { return this._children; }
		this._children = obj;
	};

	var a = new MyObject(),
		b = new MyObject();

	var barr = [b];
	a.children(barr);
	b.parent(a);

	equal(a.children(), barr);
	deepEqual(a.children(), [b]);
});

(function() {
	var reset = QUnit.reset;
	module("reset");
	test("reset runs assertions", function() {
		expect(0);
		QUnit.reset = function() {
			ok( false, "reset should not modify test status" );
			reset.apply( this, arguments );
		};
	});
	test("reset runs assertions, cleanup", function() {
		expect(0);
		QUnit.reset = reset;
	});
})();

if (typeof setTimeout !== 'undefined') {
function testAfterDone(){
	var testName = "ensure has correct number of assertions";

	function secondAfterDoneTest(){
		QUnit.config.done = [];
		//QUnit.done = function(){};
		//because when this does happen, the assertion count parameter doesn't actually
		//work we use this test to check the assertion count.
		module("check previous test's assertion counts");
		test('count previous two test\'s assertions', function(){
			var spans = document.getElementsByTagName('span'),
			tests = [],
			countNodes;

			//find these two tests
			for (var i = 0; i < spans.length; i++) {
				if (spans[i].innerHTML.indexOf(testName) !== -1) {
					tests.push(spans[i]);
				}
			}

			//walk dom to counts
			countNodes = tests[0].nextSibling.nextSibling.getElementsByTagName('b');
			equal(countNodes[1].innerHTML, "99");
			countNodes = tests[1].nextSibling.nextSibling.getElementsByTagName('b');
			equal(countNodes[1].innerHTML, "99");
		});
	}
	QUnit.config.done = [];
	QUnit.done(secondAfterDoneTest);

	module("Synchronous test after load of page");

	asyncTest('Async test', function(){
		start();
		for (var i = 1; i < 100; i++) {
			ok(i);
		}
	});

	test(testName, 99, function(){
		for (var i = 1; i < 100; i++) {
			ok(i);
		}
	});

	//we need two of these types of tests in order to ensure that assertions
	//don't move between tests.
	test(testName + ' 2', 99, function(){
		for (var i = 1; i < 100; i++) {
			ok(i);
		}
	});


}

QUnit.done(testAfterDone);

}
