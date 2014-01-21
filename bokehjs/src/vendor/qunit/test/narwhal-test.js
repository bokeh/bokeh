// run with
// node test/node-test.js
var QUnit = require("../qunit/qunit");
QUnit.log(function(details) {
	if (!details.result) {
		var output = "FAILED: " + (details.message ? details.message + ", " : "");
		if (details.actual) {
			output += "expected: " + details.expected + ", actual: " + details.actual;
		}
		if (details.source) {
			output += ", " + details.source;
		}
		print(output);
	} else {
		print("ok!");
	}
});
QUnit.test("yo", function() {
	QUnit.equal(true, false);
	QUnit.equal(true, false, "gotta fail");
	x.y.z;
});