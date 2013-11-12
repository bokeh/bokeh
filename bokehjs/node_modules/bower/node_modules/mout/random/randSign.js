var random = require('./random');

    /**
     * Returns random sign (-1 or 1)
     */
    function randomSign() {
        return random() > 0.5? 1 : -1;
    }

    module.exports = randomSign;

