/*!
 * numbro.js
 * version : 1.6.2
 * author : Företagsplatsen AB
 * license : MIT
 * http://www.foretagsplatsen.se
 */

var _ = require("underscore");

    /************************************
        Constants
    ************************************/

    var numbro,
        VERSION = '1.6.2',
    // internal storage for culture config files
        cultures = {},
    // Todo: Remove in 2.0.0
        languages = cultures,
        currentCulture = 'en-US',
        zeroFormat = null,
        defaultFormat = '0,0',
        defaultCurrencyFormat = '0$',
        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),
    // default culture
        enUS = {
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't'
            },
            ordinal: function(number) {
                var b = number % 10;
                return (~~(number % 100 / 10) === 1) ? 'th' :
                    (b === 1) ? 'st' :
                        (b === 2) ? 'nd' :
                            (b === 3) ? 'rd' : 'th';
            },
            currency: {
                symbol: '$',
                position: 'prefix'
            },
            defaults: {
                currencyFormat: ',0000 a'
            },
            formats: {
                fourDigits: '0000 a',
                fullWithTwoDecimals: '$ ,0.00',
                fullWithTwoDecimalsNoCurrency: ',0.00'
            }
        };

    /************************************
        Constructors
    ************************************/


    // Numbro prototype object
    function Numbro(number) {
        this._value = number;
    }

    function zeroes(count) {
        var i, ret = '';

        for (i = 0; i < count; i++) {
            ret += '0';
        }

        return ret;
    }
    /**
     * Implementation of toFixed() for numbers with exponent > 21
     *
     *
     */
    function toFixedLarge(value, precision) {
        var mantissa,
            beforeDec,
            afterDec,
            exponent,
            str;

        str = value.toString();

        mantissa = str.split('e')[0];
        exponent  = str.split('e')[1];

        beforeDec = mantissa.split('.')[0];
        afterDec = mantissa.split('.')[1] || '';

        str = beforeDec + afterDec + zeroes(exponent - afterDec.length);
        if (precision > 0) {
            str += '.' + zeroes(precision);
        }

        return str;
    }

    /**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     */
    function toFixed(value, precision, roundingFunction, optionals) {
        var power = Math.pow(10, precision),
            optionalsRegExp,
            output;

        if (value.toFixed(0).search('e') > -1) {
            // Above 1e21, toFixed returns scientific notation, which
            // is useless and unexpected
            output = toFixedLarge(value, precision);
        }
        else {
            //roundingFunction = (roundingFunction !== undefined ? roundingFunction : Math.round);
            // Multiply up by precision, round accurately, then divide and use native toFixed():
            output = (roundingFunction(value * power) / power).toFixed(precision);
        }

        if (optionals) {
            optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
            output = output.replace(optionalsRegExp, '');
        }

        return output;
    }

    /************************************
        Formatting
    ************************************/

    // determine what type of formatting we need to do
    function formatNumbro(value, format, language, roundingFunction) {
        var output;
        // TODO: do something with `language`

        // figure out what kind of format we are dealing with
        if (format.indexOf('$') > -1) { // currency!!!!!
            output = formatCurrency(value, format, roundingFunction);
        } else if (format.indexOf('%') > -1) { // percentage
            output = formatPercentage(value, format, roundingFunction);
        } else if (format.indexOf(':') > -1) { // time
            output = formatTime(value);
        } else { // plain ol' numbers or bytes
            output = formatNumber(value, format, roundingFunction);
        }

        // return string
        return output;
    }

    function formatCurrency(value, originalFormat, roundingFunction) {
        var format = originalFormat,
            symbolIndex = format.indexOf('$'),
            openParenIndex = format.indexOf('('),
            plusSignIndex = format.indexOf('+'),
            minusSignIndex = format.indexOf('-'),
            space = '',
            decimalSeparator = '',
            spliceIndex,
            output;

        if(format.indexOf('$') === -1){
            // Use defaults instead of the format provided
            if (cultures[currentCulture].currency.position === 'infix') {
                decimalSeparator = cultures[currentCulture].currency.symbol;
                if (cultures[currentCulture].currency.spaceSeparated) {
                    decimalSeparator = ' ' + decimalSeparator + ' ';
                }
            } else if (cultures[currentCulture].currency.spaceSeparated) {
                space = ' ';
            }
        } else {
            // check for space before or after currency
            if (format.indexOf(' $') > -1) {
                space = ' ';
                format = format.replace(' $', '');
            } else if (format.indexOf('$ ') > -1) {
                space = ' ';
                format = format.replace('$ ', '');
            } else {
                format = format.replace('$', '');
            }
        }

        // Format The Number
        output = formatNumber(value, format, roundingFunction, decimalSeparator);

        if (originalFormat.indexOf('$') === -1) {
            // Use defaults instead of the format provided
            switch (cultures[currentCulture].currency.position) {
                case 'postfix':
                    if (output.indexOf(')') > -1) {
                        output = output.split('');
                        output.splice(-1, 0, space + cultures[currentCulture].currency.symbol);
                        output = output.join('');
                    } else {
                        output = output + space + cultures[currentCulture].currency.symbol;
                    }
                    break;
                case 'infix':
                    break;
                case 'prefix':
                    if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
                        output = output.split('');
                        spliceIndex = Math.max(openParenIndex, minusSignIndex) + 1;

                        output.splice(spliceIndex, 0, cultures[currentCulture].currency.symbol + space);
                        output = output.join('');
                    } else {
                        output = cultures[currentCulture].currency.symbol + space + output;
                    }
                    break;
                default:
                    throw Error('Currency position should be among ["prefix", "infix", "postfix"]');
            }
        } else {
            // position the symbol
            if (symbolIndex <= 1) {
                if (output.indexOf('(') > -1 || output.indexOf('+') > -1 || output.indexOf('-') > -1) {
                    output = output.split('');
                    spliceIndex = 1;
                    if (symbolIndex < openParenIndex || symbolIndex < plusSignIndex || symbolIndex < minusSignIndex) {
                        // the symbol appears before the "(", "+" or "-"
                        spliceIndex = 0;
                    }
                    output.splice(spliceIndex, 0, cultures[currentCulture].currency.symbol + space);
                    output = output.join('');
                } else {
                    output = cultures[currentCulture].currency.symbol + space + output;
                }
            } else {
                if (output.indexOf(')') > -1) {
                    output = output.split('');
                    output.splice(-1, 0, space + cultures[currentCulture].currency.symbol);
                    output = output.join('');
                } else {
                    output = output + space + cultures[currentCulture].currency.symbol;
                }
            }
        }

        return output;
    }

    function formatPercentage(value, format, roundingFunction) {
        var space = '',
            output;
        value = value * 100;

        // check for space before %
        if (format.indexOf(' %') > -1) {
            space = ' ';
            format = format.replace(' %', '');
        } else {
            format = format.replace('%', '');
        }

        output = formatNumber(value, format, roundingFunction);

        if (output.indexOf(')') > -1) {
            output = output.split('');
            output.splice(-1, 0, space + '%');
            output = output.join('');
        } else {
            output = output + space + '%';
        }

        return output;
    }

    function formatTime(value) {
        var hours = Math.floor(value / 60 / 60),
            minutes = Math.floor((value - (hours * 60 * 60)) / 60),
            seconds = Math.round(value - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' +
            ((minutes < 10) ? '0' + minutes : minutes) + ':' +
            ((seconds < 10) ? '0' + seconds : seconds);
    }

    function formatNumber (value, format, roundingFunction, sep) {
        var negP = false,
            signed = false,
            optDec = false,
            abbr = '',
            i,
            abbrK = false, // force abbreviation to thousands
            abbrM = false, // force abbreviation to millions
            abbrB = false, // force abbreviation to billions
            abbrT = false, // force abbreviation to trillions
            abbrForce = false, // force abbreviation
            bytes = '',
            ord = '',
            abs = Math.abs(value),
            binarySuffixes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'],
            decimalSuffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            min,
            max,
            power,
            totalLength,
            length,
            minimumPrecision,
            pow,
            w,
            intPrecision,
            precision,
            prefix,
            postfix,
            thousands,
            d = '',
            forcedNeg = false,
            neg = false,
            indexOpenP,
            size,
            indexMinus,
            paren = '',
            minlen;

        // check if number is zero and a custom zero format has been set
        if (value === 0 && zeroFormat !== null) {
            return zeroFormat;
        }

        if (!isFinite(value)) {
            return '' + value;
        }

        if (format.indexOf('{') === 0) {
            var end = format.indexOf('}');
            if (end === -1) {
                throw Error('Format should also contain a "}"');
            }
            prefix = format.slice(1, end);
            format = format.slice(end + 1);
        } else {
            prefix = '';
        }

        if (format.indexOf('}') === format.length - 1) {
            var start = format.indexOf('{');
            if (start === -1) {
                throw Error('Format should also contain a "{"');
            }
            postfix = format.slice(start + 1, -1);
            format = format.slice(0, start + 1);
        } else {
            postfix = '';
        }

        // check for min length
        var info;
        if (format.indexOf('.') === -1) {
            info = format.match(/([0-9]+).*/);
        } else {
            info = format.match(/([0-9]+)\..*/);
        }
        minlen = info === null ? -1 : info[1].length;

        // see if we should use parentheses for negative number or if we should prefix with a sign
        // if both are present we default to parentheses
        if (format.indexOf('-') !== -1) {
            forcedNeg = true;
        }
        if (format.indexOf('(') > -1) {
            negP = true;
            format = format.slice(1, -1);
        } else if (format.indexOf('+') > -1) {
            signed = true;
            format = format.replace(/\+/g, '');
        }

        // see if abbreviation is wanted
        if (format.indexOf('a') > -1) {
            intPrecision = format.split('.')[0].match(/[0-9]+/g) || ['0'];
            intPrecision = parseInt(intPrecision[0], 10);

            // check if abbreviation is specified
            abbrK = format.indexOf('aK') >= 0;
            abbrM = format.indexOf('aM') >= 0;
            abbrB = format.indexOf('aB') >= 0;
            abbrT = format.indexOf('aT') >= 0;
            abbrForce = abbrK || abbrM || abbrB || abbrT;

            // check for space before abbreviation
            if (format.indexOf(' a') > -1) {
                abbr = ' ';
                format = format.replace(' a', '');
            } else {
                format = format.replace('a', '');
            }

            totalLength = Math.floor(Math.log(abs) / Math.LN10) + 1;

            minimumPrecision = totalLength % 3;
            minimumPrecision = minimumPrecision === 0 ? 3 : minimumPrecision;

            if (intPrecision && abs !== 0) {

                length = Math.floor(Math.log(abs) / Math.LN10) + 1 - intPrecision;

                pow = 3 * ~~((Math.min(intPrecision, totalLength) - minimumPrecision) / 3);

                abs = abs / Math.pow(10, pow);

                if (format.indexOf('.') === -1 && intPrecision > 3) {
                    format += '[.]';

                    size = length === 0 ? 0 : 3 * ~~(length / 3) - length;
                    size = size < 0 ? size + 3 : size;

                    for (i = 0; i < size; i++) {
                        format += '0';
                    }
                }
            }

            if (Math.floor(Math.log(Math.abs(value)) / Math.LN10) + 1 !== intPrecision) {
                if (abs >= Math.pow(10, 12) && !abbrForce || abbrT) {
                    // trillion
                    abbr = abbr + cultures[currentCulture].abbreviations.trillion;
                    value = value / Math.pow(10, 12);
                } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !abbrForce || abbrB) {
                    // billion
                    abbr = abbr + cultures[currentCulture].abbreviations.billion;
                    value = value / Math.pow(10, 9);
                } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !abbrForce || abbrM) {
                    // million
                    abbr = abbr + cultures[currentCulture].abbreviations.million;
                    value = value / Math.pow(10, 6);
                } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !abbrForce || abbrK) {
                    // thousand
                    abbr = abbr + cultures[currentCulture].abbreviations.thousand;
                    value = value / Math.pow(10, 3);
                }
            }
        }

        // see if we are formatting binary bytes
        if (format.indexOf('b') > -1) {
            // check for space before
            if (format.indexOf(' b') > -1) {
                bytes = ' ';
                format = format.replace(' b', '');
            } else {
                format = format.replace('b', '');
            }

            for (power = 0; power <= binarySuffixes.length; power++) {
                min = Math.pow(1024, power);
                max = Math.pow(1024, power + 1);

                if (value >= min && value < max) {
                    bytes = bytes + binarySuffixes[power];
                    if (min > 0) {
                        value = value / min;
                    }
                    break;
                }
            }
        }

        // see if we are formatting decimal bytes
        if (format.indexOf('d') > -1) {
            // check for space before
            if (format.indexOf(' d') > -1) {
                bytes = ' ';
                format = format.replace(' d', '');
            } else {
                format = format.replace('d', '');
            }

            for (power = 0; power <= decimalSuffixes.length; power++) {
                min = Math.pow(1000, power);
                max = Math.pow(1000, power + 1);

                if (value >= min && value < max) {
                    bytes = bytes + decimalSuffixes[power];
                    if (min > 0) {
                        value = value / min;
                    }
                    break;
                }
            }
        }

        // see if ordinal is wanted
        if (format.indexOf('o') > -1) {
            // check for space before
            if (format.indexOf(' o') > -1) {
                ord = ' ';
                format = format.replace(' o', '');
            } else {
                format = format.replace('o', '');
            }

            if (cultures[currentCulture].ordinal) {
                ord = ord + cultures[currentCulture].ordinal(value);
            }
        }

        if (format.indexOf('[.]') > -1) {
            optDec = true;
            format = format.replace('[.]', '.');
        }

        w = value.toString().split('.')[0];
        precision = format.split('.')[1];
        thousands = format.indexOf(',');

        if (precision) {
            if (precision.indexOf('*') !== -1) {
                d = toFixed(value, value.toString().split('.')[1].length, roundingFunction);
            } else {
                if (precision.indexOf('[') > -1) {
                    precision = precision.replace(']', '');
                    precision = precision.split('[');
                    d = toFixed(value, (precision[0].length + precision[1].length), roundingFunction,
                        precision[1].length);
                } else {
                    d = toFixed(value, precision.length, roundingFunction);
                }
            }

            w = d.split('.')[0];

            if (d.split('.')[1].length) {
                var p = sep ? abbr + sep : cultures[currentCulture].delimiters.decimal;
                d = p + d.split('.')[1];
            } else {
                d = '';
            }

            if (optDec && Number(d.slice(1)) === 0) {
                d = '';
            }
        } else {
            w = toFixed(value, null, roundingFunction);
        }

        // format number
        if (w.indexOf('-') > -1) {
            w = w.slice(1);
            neg = true;
        }

        if (w.length < minlen) {
            w = new Array(minlen - w.length + 1).join('0') + w;
        }

        if (thousands > -1) {
            w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' +
                cultures[currentCulture].delimiters.thousands);
        }

        if (format.indexOf('.') === 0) {
            w = '';
        }

        indexOpenP = format.indexOf('(');
        indexMinus = format.indexOf('-');

        if (indexOpenP < indexMinus) {
            paren = ((negP && neg) ? '(' : '') + (((forcedNeg && neg) || (!negP && neg)) ? '-' : '');
        } else {
            paren = (((forcedNeg && neg) || (!negP && neg)) ? '-' : '') + ((negP && neg) ? '(' : '');
        }

        return prefix +
            paren + ((!neg && signed && value !== 0) ? '+' : '') +
            w + d +
            ((ord) ? ord : '') +
            ((abbr && !sep) ? abbr : '') +
            ((bytes) ? bytes : '') +
            ((negP && neg) ? ')' : '') +
            postfix;
    }

    /************************************
        Top Level Functions
    ************************************/

    numbro = function(input) {
        if (numbro.isNumbro(input)) {
            input = input.value();
        } else if (input === 0 || typeof input === 'undefined') {
            input = 0;
        } else if (!Number(input)) {
            input = numbro.fn.unformat(input);
        }

        return new Numbro(Number(input));
    };

    // version number
    numbro.version = VERSION;

    // compare numbro object
    numbro.isNumbro = function(obj) {
        return obj instanceof Numbro;
    };

    /**
     * This function allow the user to set a new language with a fallback if
     * the language does not exist. If no fallback language is provided,
     * it fallbacks to english.
     *
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `setCulture` should be used instead.
     */
    numbro.setLanguage = function(newLanguage, fallbackLanguage) {
        console.warn('`setLanguage` is deprecated since version 1.6.0. Use `setCulture` instead');
        var key = newLanguage,
            prefix = newLanguage.split('-')[0],
            matchingLanguage = null;
        if (!languages[key]) {
            Object.keys(languages).forEach(function(language) {
                if (!matchingLanguage && language.split('-')[0] === prefix) {
                    matchingLanguage = language;
                }
            });
            key = matchingLanguage || fallbackLanguage || 'en-US';
        }
        chooseCulture(key);
    };

    /**
     * This function allow the user to set a new culture with a fallback if
     * the culture does not exist. If no fallback culture is provided,
     * it fallbacks to "en-US".
     */
    numbro.setCulture = function(newCulture, fallbackCulture) {
        var key = newCulture,
            suffix = newCulture.split('-')[1],
            matchingCulture = null;
        if (!cultures[key]) {
            if (suffix) {
                Object.keys(cultures).forEach(function(language) {
                    if (!matchingCulture && language.split('-')[1] === suffix) {
                        matchingCulture = language;
                    }
                });
            }

            key = matchingCulture || fallbackCulture || 'en-US';
        }
        chooseCulture(key);
    };

    /**
     * This function will load languages and then set the global language.  If
     * no arguments are passed in, it will simply return the current global
     * language key.
     *
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `culture` should be used instead.
     */
    numbro.language = function(key, values) {
        console.warn('`language` is deprecated since version 1.6.0. Use `culture` instead');

        if (!key) {
            return currentCulture;
        }

        if (key && !values) {
            if (!languages[key]) {
                throw new Error('Unknown language : ' + key);
            }
            chooseCulture(key);
        }

        if (values || !languages[key]) {
            setCulture(key, values);
        }

        return numbro;
    };

    /**
     * This function will load cultures and then set the global culture.  If
     * no arguments are passed in, it will simply return the current global
     * culture code.
     */
    numbro.culture = function(code, values) {
        if (!code) {
            return currentCulture;
        }

        if (code && !values) {
            if (!cultures[code]) {
                throw new Error('Unknown culture : ' + code);
            }
            chooseCulture(code);
        }

        if (values || !cultures[code]) {
            setCulture(code, values);
        }

        return numbro;
    };

    /**
     * This function provides access to the loaded language data.  If
     * no arguments are passed in, it will simply return the current
     * global language object.
     *
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `culture` should be used instead.
     */
    numbro.languageData = function(key) {
        console.warn('`languageData` is deprecated since version 1.6.0. Use `cultureData` instead');

        if (!key) {
            return languages[currentCulture];
        }

        if (!languages[key]) {
            throw new Error('Unknown language : ' + key);
        }

        return languages[key];
    };

    /**
     * This function provides access to the loaded culture data.  If
     * no arguments are passed in, it will simply return the current
     * global culture object.
     */
    numbro.cultureData = function(code) {
        if (!code) {
            return cultures[currentCulture];
        }

        if (!cultures[code]) {
            throw new Error('Unknown culture : ' + code);
        }

        return cultures[code];
    };

    numbro.culture('en-US', enUS);

    /**
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `cultures` should be used instead.
     */
    numbro.languages = function() {
        console.warn('`languages` is deprecated since version 1.6.0. Use `cultures` instead');

        return languages;
    };

    numbro.cultures = function() {
        return cultures;
    };

    numbro.zeroFormat = function(format) {
        zeroFormat = typeof(format) === 'string' ? format : null;
    };

    numbro.defaultFormat = function(format) {
        defaultFormat = typeof(format) === 'string' ? format : '0.0';
    };

    numbro.defaultCurrencyFormat = function (format) {
        defaultCurrencyFormat = typeof(format) === 'string' ? format : '0$';
    };

    numbro.validate = function(val, culture) {

        var _decimalSep,
            _thousandSep,
            _currSymbol,
            _valArray,
            _abbrObj,
            _thousandRegEx,
            cultureData,
            temp;

        //coerce val to string
        if (typeof val !== 'string') {
            val += '';
            if (console.warn) {
                console.warn('Numbro.js: Value is not string. It has been co-erced to: ', val);
            }
        }

        //trim whitespaces from either sides
        val = val.trim();

        //if val is just digits return true
        if ( !! val.match(/^\d+$/)) {
            return true;
        }

        //if val is empty return false
        if (val === '') {
            return false;
        }

        //get the decimal and thousands separator from numbro.cultureData
        try {
            //check if the culture is understood by numbro. if not, default it to current culture
            cultureData = numbro.cultureData(culture);
        } catch (e) {
            cultureData = numbro.cultureData(numbro.culture());
        }

        //setup the delimiters and currency symbol based on culture
        _currSymbol = cultureData.currency.symbol;
        _abbrObj = cultureData.abbreviations;
        _decimalSep = cultureData.delimiters.decimal;
        if (cultureData.delimiters.thousands === '.') {
            _thousandSep = '\\.';
        } else {
            _thousandSep = cultureData.delimiters.thousands;
        }

        // validating currency symbol
        temp = val.match(/^[^\d]+/);
        if (temp !== null) {
            val = val.substr(1);
            if (temp[0] !== _currSymbol) {
                return false;
            }
        }

        //validating abbreviation symbol
        temp = val.match(/[^\d]+$/);
        if (temp !== null) {
            val = val.slice(0, -1);
            if (temp[0] !== _abbrObj.thousand && temp[0] !== _abbrObj.million &&
                    temp[0] !== _abbrObj.billion && temp[0] !== _abbrObj.trillion) {
                return false;
            }
        }

        _thousandRegEx = new RegExp(_thousandSep + '{2}');

        if (!val.match(/[^\d.,]/g)) {
            _valArray = val.split(_decimalSep);
            if (_valArray.length > 2) {
                return false;
            } else {
                if (_valArray.length < 2) {
                    return ( !! _valArray[0].match(/^\d+.*\d$/) && !_valArray[0].match(_thousandRegEx));
                } else {
                    if (_valArray[0].length === 1) {
                        return ( !! _valArray[0].match(/^\d+$/) &&
                            !_valArray[0].match(_thousandRegEx) &&
                            !! _valArray[1].match(/^\d+$/));
                    } else {
                        return ( !! _valArray[0].match(/^\d+.*\d$/) &&
                            !_valArray[0].match(_thousandRegEx) &&
                            !! _valArray[1].match(/^\d+$/));
                    }
                }
            }
        }

        return false;
    };

    numbro.includeLocalesInNode = function(culturesPath, culture) {
        if (!inNodejsRuntime()) {
            return;
        }

        var path = require('path');

        culture.forEach(function(langLocaleCode) {
            var culture = require(path.join(__dirname, culturesPath, langLocaleCode));
            numbro.culture(culture.langLocaleCode, culture);
        });
    };

    /**
     * * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `loadCulturesInNode` should be used instead.
     */
    numbro.loadLanguagesInNode = function(languagesPath) {
        console.warn('`loadLanguagesInNode` is deprecated since version 1.6.0. Use `loadCulturesInNode` instead');

        if (!inNodejsRuntime()) {
            return;
        }

        var fs = require('fs');
        var path = require('path');

        var langFiles = fs.readdirSync(path.join(__dirname, languagesPath));

        numbro.includeLocalesInNode(languagesPath, langFiles);
    };

    numbro.loadCulturesInNode = function(culturesPath) {
        if (!inNodejsRuntime()) {
            return;
        }

        var fs = require('fs');
        var path = require('path');

        var langFiles = fs.readdirSync(path.join(__dirname, culturesPath));

        numbro.includeLocalesInNode(culturesPath, langFiles);
    };

    /************************************
        Helpers
    ************************************/

    function setCulture(code, values) {
        cultures[code] = values;
    }

    function chooseCulture(code) {
        currentCulture = code;
        var defaults = cultures[code].defaults;
        if (defaults && defaults.format) {
            numbro.defaultFormat(defaults.format);
        }
        if (defaults && defaults.currencyFormat) {
            numbro.defaultCurrencyFormat(defaults.currencyFormat);
        }
    }

    function inNodejsRuntime() {
        return (typeof process !== 'undefined') &&
            (process.browser === undefined) &&
            (process.title === 'node' || process.title === 'grunt');
    }

    function format(input, formatString, language, roundingFunction) {
        return formatNumbro(
            Number(input),
            _.isString(formatString)        ? formatString        : defaultFormat,
            _.isString(language)            ? languages[language] : languages[defaultLanguage],
            _.isUndefined(roundingFunction) ? Math.round          : roundingFunction);
    }

    module.exports = {"format": format};
