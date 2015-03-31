/*!
 * numeral.js
 * version : 1.5.3
 * author : Adam Draper
 * license : MIT
 * http://adamwdraper.github.com/Numeral-js/
 */

var _ = require("underscore");

    var languages = {};
    var defaultFormat = '0,0';
    var defaultLanguage = 'en';

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

        // roundingFunction = (roundingFunction !== undefined ? roundingFunction : Math.round);
        // Multiply up by precision, round accurately, then divide and use native toFixed():
        output = (roundingFunction(value * power) / power).toFixed(precision);

        if (optionals) {
            optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
            output = output.replace(optionalsRegExp, '');
        }

        return output;
    }

    // determine what type of formatting we need to do
    function formatNumeral(value, format, language, roundingFunction) {
        var output;

        // figure out what kind of format we are dealing with
        if (format.indexOf('$') > -1) { // currency!!!!!
            output = formatCurrency(value, format, language, roundingFunction);
        } else if (format.indexOf('%') > -1) { // percentage
            output = formatPercentage(value, format, language, roundingFunction);
        } else if (format.indexOf(':') > -1) { // time
            output = formatTime(value, format, language);
        } else { // plain ol' numbers or bytes
            output = formatNumber(value, format, language, roundingFunction);
        }

        return output;
    }

    function formatCurrency(value, format, language, roundingFunction) {
        var symbolIndex = format.indexOf('$'),
            openParenIndex = format.indexOf('('),
            minusSignIndex = format.indexOf('-'),
            space = '',
            spliceIndex,
            output;

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

        // format the number
        output = formatNumber(value, format, language, roundingFunction);

        // position the symbol
        if (symbolIndex <= 1) {
            if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
                output = output.split('');
                spliceIndex = 1;
                if (symbolIndex < openParenIndex || symbolIndex < minusSignIndex){
                    // the symbol appears before the "(" or "-"
                    spliceIndex = 0;
                }
                output.splice(spliceIndex, 0, language.currency.symbol + space);
                output = output.join('');
            } else {
                output = language.currency.symbol + space + output;
            }
        } else {
            if (output.indexOf(')') > -1) {
                output = output.split('');
                output.splice(-1, 0, space + language.currency.symbol);
                output = output.join('');
            } else {
                output = output + space + language.currency.symbol;
            }
        }

        return output;
    }

    function formatPercentage(value, format, language, roundingFunction) {
        var space = '',
            output,
            value = value * 100;

        // check for space before %
        if (format.indexOf(' %') > -1) {
            space = ' ';
            format = format.replace(' %', '');
        } else {
            format = format.replace('%', '');
        }

        output = formatNumber(value, format, language, roundingFunction);

        if (output.indexOf(')') > -1 ) {
            output = output.split('');
            output.splice(-1, 0, space + '%');
            output = output.join('');
        } else {
            output = output + space + '%';
        }

        return output;
    }

    function formatTime(value, language) {
        var hours = Math.floor(value/60/60),
            minutes = Math.floor((value - (hours * 60 * 60))/60),
            seconds = Math.round(value - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
    }

    function formatNumber(value, format, language, roundingFunction) {
        var negP = false,
            signed = false,
            optDec = false,
            abbr = '',
            abbrK = false, // force abbreviation to thousands
            abbrM = false, // force abbreviation to millions
            abbrB = false, // force abbreviation to billions
            abbrT = false, // force abbreviation to trillions
            abbrForce = false, // force abbreviation
            bytes = '',
            ord = '',
            abs = Math.abs(value),
            suffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            min,
            max,
            power,
            w,
            precision,
            thousands,
            d = '',
            neg = false;

        // see if we should use parentheses for negative number or if we should prefix with a sign
        // if both are present we default to parentheses
        if (format.indexOf('(') > -1) {
            negP = true;
            format = format.slice(1, -1);
        } else if (format.indexOf('+') > -1) {
            signed = true;
            format = format.replace(/\+/g, '');
        }

        // see if abbreviation is wanted
        if (format.indexOf('a') > -1) {
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

            if (abs >= Math.pow(10, 12) && !abbrForce || abbrT) {
                // trillion
                abbr = abbr + language.abbreviations.trillion;
                value = value / Math.pow(10, 12);
            } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !abbrForce || abbrB) {
                // billion
                abbr = abbr + language.abbreviations.billion;
                value = value / Math.pow(10, 9);
            } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !abbrForce || abbrM) {
                // million
                abbr = abbr + language.abbreviations.million;
                value = value / Math.pow(10, 6);
            } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !abbrForce || abbrK) {
                // thousand
                abbr = abbr + language.abbreviations.thousand;
                value = value / Math.pow(10, 3);
            }
        }

        // see if we are formatting bytes
        if (format.indexOf('b') > -1) {
            // check for space before
            if (format.indexOf(' b') > -1) {
                bytes = ' ';
                format = format.replace(' b', '');
            } else {
                format = format.replace('b', '');
            }

            for (power = 0; power <= suffixes.length; power++) {
                min = Math.pow(1024, power);
                max = Math.pow(1024, power+1);

                if (value >= min && value < max) {
                    bytes = bytes + suffixes[power];
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

            ord = ord + language.ordinal(value);
        }

        if (format.indexOf('[.]') > -1) {
            optDec = true;
            format = format.replace('[.]', '.');
        }

        w = value.toString().split('.')[0];
        precision = format.split('.')[1];
        thousands = format.indexOf(',');

        if (precision) {
            if (precision.indexOf('[') > -1) {
                precision = precision.replace(']', '');
                precision = precision.split('[');
                d = toFixed(value, (precision[0].length + precision[1].length), roundingFunction, precision[1].length);
            } else {
                d = toFixed(value, precision.length, roundingFunction);
            }

            w = d.split('.')[0];

            if (d.split('.')[1].length) {
                d = language.delimiters.decimal + d.split('.')[1];
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

        if (thousands > -1) {
            w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + language.delimiters.thousands);
        }

        if (format.indexOf('.') === 0) {
            w = '';
        }

        return ((negP && neg) ? '(' : '') +
               ((!negP && neg) ? '-' : '') +
               ((!neg && signed) ? '+' : '') +
               w +
               d +
               ((ord) ? ord : '') +
               ((abbr) ? abbr : '') +
               ((bytes) ? bytes : '') +
               ((negP && neg) ? ')' : '');
    }

    function addLanguage(key, spec) {
        languages[key] = spec;
    }

    addLanguage('en', {
        delimiters: {
            thousands: ',',
            decimal:   '.'
        },
        abbreviations: {
            thousand: 'k',
            million:  'm',
            billion:  'b',
            trillion: 't'
        },
        ordinal: function (number) {
            var b = number % 10;
            return (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        },
        currency: {
            symbol: '$'
        }
    });

    function format(input, formatString, language, roundingFunction) {
        return formatNumeral(
            Number(input),
            _.isString(formatString)        ? formatString        : defaultFormat,
            _.isString(language)            ? languages[language] : languages[defaultLanguage],
            _.isUndefined(roundingFunction) ? Math.round          : roundingFunction);
    }

    module.exports = {"format": format};
