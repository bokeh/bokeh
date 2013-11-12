'use strict';
module.exports = (function () {
	var term;

	if (process.argv.indexOf('--no-color') !== -1) {
		return false;
	}

	if (process.argv.indexOf('--color') !== -1) {
		return true;
	}

	if (!process.stdout.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return true;
	}

	if ('COLORTERM' in process.env) {
		return true;
	}

	term = process.env.TERM;

	if (!term) {
		return false;
	}

	term = term.toLowerCase();

	return term.indexOf('color') !== -1 || term === 'xterm' || term === 'linux';
})();
