(function() {
	var count = 0, suiteCount = 0, currentSuite, currentTest, suites = [], assertCount, start, results = {failed:0, passed:0, total:0, time:0};

	QUnit.jUnitReport = function(data) {
		// Gets called when a report is generated
	};

	QUnit.moduleStart(function(data) {
		currentSuite = {
			name: data.name,
			tests: [],
			failures: 0,
			time: 0,
			stdout : '',
			stderr : ''
		};

		suites.push(currentSuite);
	});

	QUnit.moduleDone(function(data) {
	});

	QUnit.testStart(function(data) {
		if(!start){ start = new Date(); }

		assertCount = 0;

		currentTest = {
			name: data.name,
			failures: [],
			start: new Date()
		};

		// Setup default suite if no module was specified
		if (!currentSuite) {
			currentSuite = {
				name: "default",
				tests: [],
				failures: 0,
				time: 0,
				stdout : '',
				stderr : ''
			};

			suites.push(currentSuite);
		}

		currentSuite.tests.push(currentTest);
	});

	QUnit.testDone(function(data) {
		currentTest.failed = data.failed;
		currentTest.total = data.total;
		currentSuite.failures += data.failed;

		results.failed += data.failed;
		results.passed += data.passed;
		results.total += data.total;
	});

	QUnit.log(function(data) {
		assertCount++;

		if (!data.result) {
			currentTest.failures.push(data.message);

			// Add log message of failure to make it easier to find in jenkins UI
			currentSuite.stdout += '[' + currentSuite.name + ', ' + currentTest.name + ', ' + assertCount + '] ' + data.message + '\n';
		}
	});

	QUnit.done(function(data) {
		function ISODateString(d) {
			function pad(n) {
				return n < 10 ? '0' + n : n;
			}

			return d.getUTCFullYear() + '-' +
				pad(d.getUTCMonth() + 1)+'-' +
				pad(d.getUTCDate()) + 'T' +
				pad(d.getUTCHours()) + ':' +
				pad(d.getUTCMinutes()) + ':' +
				pad(d.getUTCSeconds()) + 'Z';
		}

		// Generate XML report
		var i, ti, fi, test, suite,
			xmlWriter = new XmlWriter({
				linebreak_at : "testsuites,testsuite,testcase,failure,system-out,system-err"
			}),
			now = new Date();

		xmlWriter.start('testsuites');

		for (i = 0; i < suites.length; i++) {
			suite = suites[i];

			// Calculate time
			for (ti = 0; ti < suite.tests.length; ti++) {
				test = suite.tests[ti];

				test.time = (now.getTime() - test.start.getTime()) / 1000;
				suite.time += test.time;
			}

			xmlWriter.start('testsuite', {
				id: "" + i,
				name: suite.name,
				errors: "0",
				failures: suite.failures,
				hostname: "localhost",
				tests: suite.tests.length,
				time: Math.round(suite.time * 1000) / 1000,
				timestamp: ISODateString(now)
			});

			for (ti = 0; ti < suite.tests.length; ti++) {
				test = suite.tests[ti];

				xmlWriter.start('testcase', {
					name: test.name,
					total: test.total,
					failed: test.failed,
					time: Math.round(test.time * 1000) / 1000
				});

				for (fi = 0; fi < test.failures.length; fi++) {
					xmlWriter.start('failure', {type: "AssertionFailedError", message: test.failures[fi]}, true);
				}

				xmlWriter.end('testcase');
			}

			if (suite.stdout) {
				xmlWriter.start('system-out');
				xmlWriter.cdata('\n' + suite.stdout);
				xmlWriter.end('system-out');
			}

			if (suite.stderr) {
				xmlWriter.start('system-err');
				xmlWriter.cdata('\n' + suite.stderr);
				xmlWriter.end('system-err');
			}

			xmlWriter.end('testsuite');
		}

		xmlWriter.end('testsuites');

        results.time = new Date() - start;

		QUnit.jUnitReport({
			results:results,
			xml: xmlWriter.getString()
		});
	});

	function XmlWriter(settings) {
		function addLineBreak(name) {
			if (lineBreakAt[name] && data[data.length - 1] !== '\n') {
				data.push('\n');
			}
		}

		function makeMap(items, delim, map) {
			var i;

			items = items || [];

			if (typeof(items) === "string") {
				items = items.split(',');
			}

			map = map || {};

			i = items.length;
			while (i--) {
				map[items[i]] = {};
			}

			return map;
		}

		function encode(text) {
			var baseEntities = {
				'"' : '&quot;',
				"'" : '&apos;',
				'<' : '&lt;',
				'>' : '&gt;',
				'&' : '&amp;'
			};

			return ('' + text).replace(/[<>&\"\']/g, function(chr) {
				return baseEntities[chr] || chr;
			});
		}

		var data = [], stack = [], lineBreakAt;

		settings = settings || {};
		lineBreakAt = makeMap(settings.linebreak_at || 'mytag');

		this.start = function(name, attrs, empty) {
			if (!empty) {
				stack.push(name);
			}

			data.push('<', name);

			for (var aname in attrs) {
				data.push(" " + encode(aname), '="', encode(attrs[aname]), '"');
			}

			data.push(empty ? ' />' : '>');
			addLineBreak(name);
		};

		this.end = function(name) {
			stack.pop();
			addLineBreak(name);
			data.push('</', name, '>');
			addLineBreak(name);
		};

		this.text = function(text) {
			data.push(encode(text));
		};

		this.cdata = function(text) {
			data.push('<![CDATA[', text, ']]>');
		};

		this.comment = function(text) {
			data.push('<!--', text, '-->');
		};

		this.pi = function(name, text) {
			if (text) {
				data.push('<?', name, ' ', text, '?>\n');
			} else {
				data.push('<?', name, '?>\n');
			}
		};

		this.doctype = function(text) {
			data.push('<!DOCTYPE', text, '>\n');
		};

		this.getString = function() {
			for (var i = stack.length - 1; i >= 0; i--) {
				this.end(stack[i]);
			}

			stack = [];

			return data.join('').replace(/\n$/, '');
		};

		this.reset = function() {
			data = [];
			stack = [];
		};

		this.pi(settings.xmldecl || 'xml version="1.0" encoding="UTF-8"');
	}
})();