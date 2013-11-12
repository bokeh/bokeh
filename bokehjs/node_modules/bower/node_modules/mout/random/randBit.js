var random = require('./random');

    /**
     * Returns random bit (0 or 1)
     */
    function randomBit() {
        return random() > 0.5? 1 : 0;
    }

    module.exports = randomBit;

