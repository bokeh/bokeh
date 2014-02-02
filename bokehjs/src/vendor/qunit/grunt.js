/*global config:true, task:true*/
module.exports = function( grunt ) {

grunt.loadNpmTasks( "grunt-git-authors" );

grunt.initConfig({
	pkg: '<json:package.json>',
	qunit: {
		// TODO include 'test/logs.html' as well
		qunit: 'test/index.html',
		addons: [
			'addons/canvas/canvas.html',
			'addons/close-enough/close-enough.html',
			'addons/composite/composite-demo-test.html'
		]
	},
	lint: {
		qunit: 'qunit/qunit.js',
		// addons: 'addons/**/*.js',
		grunt: 'grunt.js'
		// TODO need to figure out which warnings to fix and which to disable
		// tests: 'test/test.js'
	},
	jshint: {
		qunit: {
			options: {
				onevar: true,
				browser: true,
				bitwise: true,
				curly: true,
				trailing: true,
				immed: true,
				latedef: false,
				newcap: true,
				noarg: false,
				noempty: true,
				nonew: true,
				sub: true,
				undef: true,
				eqnull: true,
				proto: true,
				smarttabs: true
			},
			globals: {
				jQuery: true,
				exports: true
			}
		},
		addons: {
			options: {
				browser: true,
				curly: true,
				eqnull: true,
				eqeqeq: true,
				expr: true,
				evil: true,
				jquery: true,
				latedef: true,
				noarg: true,
				onevar: true,
				smarttabs: true,
				trailing: true,
				undef: true
			},
			globals: {
				module: true,
				test: true,
				asyncTest: true,
				expect: true,
				start: true,
				stop: true,
				QUnit: true
			}
		},
		tests: {
		}
	}
});

grunt.registerTask( "build-git", function( sha ) {
	function processor( content ) {
		var tagline = " - A JavaScript Unit Testing Framework";
		return content.replace( tagline, "-" + sha + " " + grunt.template.today('isoDate') + tagline );
	}
	grunt.file.copy( "qunit/qunit.css", "dist/qunit-git.css", {
		process: processor
	});
	grunt.file.copy( "qunit/qunit.js", "dist/qunit-git.js", {
		process: processor
	});
});

grunt.registerTask( "testswarm", function( commit, configFile ) {
	var testswarm = require( "testswarm" ),
		config = grunt.file.readJSON( configFile ).qunit;
	testswarm({
		url: config.swarmUrl,
		pollInterval: 10000,
		timeout: 1000 * 60 * 30,
		done: this.async()
	}, {
		authUsername: "qunit",
		authToken: config.authToken,
		jobName: 'QUnit commit #<a href="https://github.com/jquery/qunit/commit/' + commit + '">' + commit.substr( 0, 10 ) + '</a>',
		runMax: config.runMax,
		"runNames[]": "QUnit",
		"runUrls[]": config.testUrl + commit + "/test/index.html",
		"browserSets[]": ["popular"]
	});
});

grunt.registerTask('default', 'lint qunit');

};
