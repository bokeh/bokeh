
    /**
     * Enforce a specific amount of decimal digits and also fix floating
     * point rounding issues.
     * @example `enforcePrecision(0.615, 2) -> 0.62`, `(0.615).toFixed(2) ->
     * 0.61`
     */
    function enforcePrecision(val, nDecimalDigits){
        var pow = Math.pow(10, nDecimalDigits);
        return +(Math.round(val * pow) / pow).toFixed(nDecimalDigits);
    }
    module.exports = enforcePrecision;

