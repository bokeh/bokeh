var toString = require('../lang/toString');

    var ESCAPE_CHARS = /[\\.+*?\^$\[\](){}\/'#]/g;

    /**
     * Escape RegExp string chars.
     */
    function escapeRegExp(str) {
        str = toString(str);
        return str.replace(ESCAPE_CHARS,'\\$&');
    }

    module.exports = escapeRegExp;


