

    /**
     * "Convert" value into a 32-bit unsigned integer.
     * IMPORTANT: Value will wrap at 2^32.
     */
    function toUInt(val){
        return val >>> 0;
    }

    module.exports = toUInt;


