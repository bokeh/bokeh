var lpad = require('../string/lpad');

    /**
     * Add padding zeros if n.length < minLength.
     */
    function pad(n, minLength, char){
        return lpad(''+ n, minLength, char || '0');
    }

    module.exports = pad;


