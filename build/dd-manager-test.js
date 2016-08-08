(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":90}],2:[function(require,module,exports){
(function (process,global){
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.async = global.async || {})));
}(this, function (exports) { 'use strict';

    /**
     * A faster alternative to `Function#apply`, this function invokes `func`
     * with the `this` binding of `thisArg` and the arguments of `args`.
     *
     * @private
     * @param {Function} func The function to invoke.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {Array} args The arguments to invoke `func` with.
     * @returns {*} Returns the result of `func`.
     */
    function apply(func, thisArg, args) {
      var length = args.length;
      switch (length) {
        case 0: return func.call(thisArg);
        case 1: return func.call(thisArg, args[0]);
        case 2: return func.call(thisArg, args[0], args[1]);
        case 3: return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    var funcTag = '[object Function]';
    var genTag = '[object GeneratorFunction]';
    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto.toString;

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 8 which returns 'object' for typed array and weak map constructors,
      // and PhantomJS 1.9 which returns 'function' for `NodeList` instances.
      var tag = isObject(value) ? objectToString.call(value) : '';
      return tag == funcTag || tag == genTag;
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return !!value && typeof value == 'object';
    }

    /** `Object#toString` result references. */
    var symbolTag = '[object Symbol]';

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$1 = objectProto$1.toString;

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && objectToString$1.call(value) == symbolTag);
    }

    /** Used as references for various `Number` constants. */
    var NAN = 0 / 0;

    /** Used to match leading and trailing whitespace. */
    var reTrim = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal = /^0o[0-7]+$/i;

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt = parseInt;

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = isFunction(value.valueOf) ? value.valueOf() : value;
        value = isObject(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }

    var INFINITY = 1 / 0;
    var MAX_INTEGER = 1.7976931348623157e+308;
    /**
     * Converts `value` to a finite number.
     *
     * @static
     * @memberOf _
     * @since 4.12.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted number.
     * @example
     *
     * _.toFinite(3.2);
     * // => 3.2
     *
     * _.toFinite(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toFinite(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toFinite('3.2');
     * // => 3.2
     */
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = (value < 0 ? -1 : 1);
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }

    /**
     * Converts `value` to an integer.
     *
     * **Note:** This method is loosely based on
     * [`ToInteger`](http://www.ecma-international.org/ecma-262/6.0/#sec-tointeger).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.toInteger(3.2);
     * // => 3
     *
     * _.toInteger(Number.MIN_VALUE);
     * // => 0
     *
     * _.toInteger(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toInteger('3.2');
     * // => 3
     */
    function toInteger(value) {
      var result = toFinite(value),
          remainder = result % 1;

      return result === result ? (remainder ? result - remainder : result) : 0;
    }

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max;

    /**
     * Creates a function that invokes `func` with the `this` binding of the
     * created function and arguments from `start` and beyond provided as
     * an array.
     *
     * **Note:** This method is based on the
     * [rest parameter](https://mdn.io/rest_parameters).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Function
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.rest(function(what, names) {
     *   return what + ' ' + _.initial(names).join(', ') +
     *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
     * });
     *
     * say('hello', 'fred', 'barney', 'pebbles');
     * // => 'hello fred, barney, & pebbles'
     */
    function rest(func, start) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      start = nativeMax(start === undefined ? (func.length - 1) : toInteger(start), 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            array = Array(length);

        while (++index < length) {
          array[index] = args[start + index];
        }
        switch (start) {
          case 0: return func.call(this, array);
          case 1: return func.call(this, args[0], array);
          case 2: return func.call(this, args[0], args[1], array);
        }
        var otherArgs = Array(start + 1);
        index = -1;
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = array;
        return apply(func, this, otherArgs);
      };
    }

    function initialParams (fn) {
        return rest(function (args /*..., callback*/) {
            var callback = args.pop();
            fn.call(this, args, callback);
        });
    }

    function applyEach$1(eachfn) {
        return rest(function (fns, args) {
            var go = initialParams(function (args, callback) {
                var that = this;
                return eachfn(fns, function (fn, cb) {
                    fn.apply(that, args.concat([cb]));
                }, callback);
            });
            if (args.length) {
                return go.apply(this, args);
            } else {
                return go;
            }
        });
    }

    /**
     * The base implementation of `_.property` without support for deep paths.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @returns {Function} Returns the new accessor function.
     */
    function baseProperty(key) {
      return function(object) {
        return object == null ? undefined : object[key];
      };
    }

    /**
     * Gets the "length" property value of `object`.
     *
     * **Note:** This function is used to avoid a
     * [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792) that affects
     * Safari on at least iOS 8.1-8.3 ARM64.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {*} Returns the "length" value.
     */
    var getLength = baseProperty('length');

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This function is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length,
     *  else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength(getLength(value)) && !isFunction(value);
    }

    /**
     * A method that returns `undefined`.
     *
     * @static
     * @memberOf _
     * @since 2.3.0
     * @category Util
     * @example
     *
     * _.times(2, _.noop);
     * // => [undefined, undefined]
     */
    function noop() {
      // No operation performed.
    }

    function once(fn) {
        return function () {
            if (fn === null) return;
            var callFn = fn;
            fn = null;
            callFn.apply(this, arguments);
        };
    }

    var iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator;

    function getIterator (coll) {
        return iteratorSymbol && coll[iteratorSymbol] && coll[iteratorSymbol]();
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeGetPrototype = Object.getPrototypeOf;

    /**
     * Gets the `[[Prototype]]` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {null|Object} Returns the `[[Prototype]]`.
     */
    function getPrototype(value) {
      return nativeGetPrototype(Object(value));
    }

    /** Used for built-in method references. */
    var objectProto$2 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto$2.hasOwnProperty;

    /**
     * The base implementation of `_.has` without support for deep paths.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {Array|string} key The key to check.
     * @returns {boolean} Returns `true` if `key` exists, else `false`.
     */
    function baseHas(object, key) {
      // Avoid a bug in IE 10-11 where objects with a [[Prototype]] of `null`,
      // that are composed entirely of index properties, return `false` for
      // `hasOwnProperty` checks of them.
      return object != null &&
        (hasOwnProperty.call(object, key) ||
          (typeof object == 'object' && key in object && getPrototype(object) === null));
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeKeys = Object.keys;

    /**
     * The base implementation of `_.keys` which doesn't skip the constructor
     * property of prototypes or treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      return nativeKeys(Object(object));
    }

    /**
     * The base implementation of `_.times` without support for iteratee shorthands
     * or max array length checks.
     *
     * @private
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the array of results.
     */
    function baseTimes(n, iteratee) {
      var index = -1,
          result = Array(n);

      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }

    /**
     * This method is like `_.isArrayLike` except that it also checks if `value`
     * is an object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array-like object,
     *  else `false`.
     * @example
     *
     * _.isArrayLikeObject([1, 2, 3]);
     * // => true
     *
     * _.isArrayLikeObject(document.body.children);
     * // => true
     *
     * _.isArrayLikeObject('abc');
     * // => false
     *
     * _.isArrayLikeObject(_.noop);
     * // => false
     */
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }

    /** `Object#toString` result references. */
    var argsTag = '[object Arguments]';

    /** Used for built-in method references. */
    var objectProto$3 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$3.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$2 = objectProto$3.toString;

    /** Built-in value references. */
    var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      // Safari 8.1 incorrectly makes `arguments.callee` enumerable in strict mode.
      return isArrayLikeObject(value) && hasOwnProperty$1.call(value, 'callee') &&
        (!propertyIsEnumerable.call(value, 'callee') || objectToString$2.call(value) == argsTag);
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @type {Function}
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    /** `Object#toString` result references. */
    var stringTag = '[object String]';

    /** Used for built-in method references. */
    var objectProto$4 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$3 = objectProto$4.toString;

    /**
     * Checks if `value` is classified as a `String` primitive or object.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified,
     *  else `false`.
     * @example
     *
     * _.isString('abc');
     * // => true
     *
     * _.isString(1);
     * // => false
     */
    function isString(value) {
      return typeof value == 'string' ||
        (!isArray(value) && isObjectLike(value) && objectToString$3.call(value) == stringTag);
    }

    /**
     * Creates an array of index keys for `object` values of arrays,
     * `arguments` objects, and strings, otherwise `null` is returned.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array|null} Returns index keys, else `null`.
     */
    function indexKeys(object) {
      var length = object ? object.length : undefined;
      if (isLength(length) &&
          (isArray(object) || isString(object) || isArguments(object))) {
        return baseTimes(length, String);
      }
      return null;
    }

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER$1 = 9007199254740991;

    /** Used to detect unsigned integer values. */
    var reIsUint = /^(?:0|[1-9]\d*)$/;

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      length = length == null ? MAX_SAFE_INTEGER$1 : length;
      return !!length &&
        (typeof value == 'number' || reIsUint.test(value)) &&
        (value > -1 && value % 1 == 0 && value < length);
    }

    /** Used for built-in method references. */
    var objectProto$5 = Object.prototype;

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$5;

      return value === proto;
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    function keys(object) {
      var isProto = isPrototype(object);
      if (!(isProto || isArrayLike(object))) {
        return baseKeys(object);
      }
      var indexes = indexKeys(object),
          skipIndexes = !!indexes,
          result = indexes || [],
          length = result.length;

      for (var key in object) {
        if (baseHas(object, key) &&
            !(skipIndexes && (key == 'length' || isIndex(key, length))) &&
            !(isProto && key == 'constructor')) {
          result.push(key);
        }
      }
      return result;
    }

    function createArrayIterator(coll) {
        var i = -1;
        var len = coll.length;
        return function next() {
            return ++i < len ? { value: coll[i], key: i } : null;
        };
    }

    function createES2015Iterator(iterator) {
        var i = -1;
        return function next() {
            var item = iterator.next();
            if (item.done) return null;
            i++;
            return { value: item.value, key: i };
        };
    }

    function createObjectIterator(obj) {
        var okeys = keys(obj);
        var i = -1;
        var len = okeys.length;
        return function next() {
            var key = okeys[++i];
            return i < len ? { value: obj[key], key: key } : null;
        };
    }

    function iterator(coll) {
        if (isArrayLike(coll)) {
            return createArrayIterator(coll);
        }

        var iterator = getIterator(coll);
        return iterator ? createES2015Iterator(iterator) : createObjectIterator(coll);
    }

    function onlyOnce(fn) {
        return function () {
            if (fn === null) throw new Error("Callback was already called.");
            var callFn = fn;
            fn = null;
            callFn.apply(this, arguments);
        };
    }

    function _eachOfLimit(limit) {
        return function (obj, iteratee, callback) {
            callback = once(callback || noop);
            if (limit <= 0 || !obj) {
                return callback(null);
            }
            var nextElem = iterator(obj);
            var done = false;
            var running = 0;

            function iterateeCallback(err) {
                running -= 1;
                if (err) {
                    done = true;
                    callback(err);
                } else if (done && running <= 0) {
                    return callback(null);
                } else {
                    replenish();
                }
            }

            function replenish() {
                while (running < limit && !done) {
                    var elem = nextElem();
                    if (elem === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iteratee(elem.value, elem.key, onlyOnce(iterateeCallback));
                }
            }

            replenish();
        };
    }

    /**
     * The same as [`eachOf`]{@link module:Collections.eachOf} but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name eachOfLimit
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.eachOf]{@link module:Collections.eachOf}
     * @alias forEachOfLimit
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A function to apply to each
     * item in `coll`. The `key` is the item's key, or index in the case of an
     * array. The iteratee is passed a `callback(err)` which must be called once it
     * has completed. If no error has occurred, the callback should be run without
     * arguments or with an explicit `null` argument. Invoked with
     * (item, key, callback).
     * @param {Function} [callback] - A callback which is called when all
     * `iteratee` functions have finished, or an error occurs. Invoked with (err).
     */
    function eachOfLimit(coll, limit, iteratee, callback) {
      _eachOfLimit(limit)(coll, iteratee, callback);
    }

    function doLimit(fn, limit) {
        return function (iterable, iteratee, callback) {
            return fn(iterable, limit, iteratee, callback);
        };
    }

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT$1 = 'Expected a function';

    /**
     * Creates a function that invokes `func`, with the `this` binding and arguments
     * of the created function, while it's called less than `n` times. Subsequent
     * calls to the created function return the result of the last `func` invocation.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Function
     * @param {number} n The number of calls at which `func` is no longer invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * jQuery(element).on('click', _.before(5, addContactToList));
     * // => allows adding up to 4 contacts to the list
     */
    function before(n, func) {
      var result;
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT$1);
      }
      n = toInteger(n);
      return function() {
        if (--n > 0) {
          result = func.apply(this, arguments);
        }
        if (n <= 1) {
          func = undefined;
        }
        return result;
      };
    }

    /**
     * Creates a function that is restricted to invoking `func` once. Repeat calls
     * to the function return the value of the first invocation. The `func` is
     * invoked with the `this` binding and arguments of the created function.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` invokes `createApplication` once
     */
    function once$1(func) {
      return before(2, func);
    }

    // eachOf implementation optimized for array-likes
    function eachOfArrayLike(coll, iteratee, callback) {
        callback = once$1(callback || noop);
        var index = 0,
            completed = 0,
            length = coll.length;
        if (length === 0) {
            callback(null);
        }

        function iteratorCallback(err) {
            if (err) {
                callback(err);
            } else if (++completed === length) {
                callback(null);
            }
        }

        for (; index < length; index++) {
            iteratee(coll[index], index, onlyOnce(iteratorCallback));
        }
    }

    // a generic version of eachOf which can handle array, object, and iterator cases.
    var eachOfGeneric = doLimit(eachOfLimit, Infinity);

    /**
     * Like [`each`]{@link module:Collections.each}, except that it passes the key (or index) as the second argument
     * to the iteratee.
     *
     * @name eachOf
     * @static
     * @memberOf module:Collections
     * @method
     * @alias forEachOf
     * @category Collection
     * @see [async.each]{@link module:Collections.each}
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each
     * item in `coll`. The `key` is the item's key, or index in the case of an
     * array. The iteratee is passed a `callback(err)` which must be called once it
     * has completed. If no error has occurred, the callback should be run without
     * arguments or with an explicit `null` argument. Invoked with
     * (item, key, callback).
     * @param {Function} [callback] - A callback which is called when all
     * `iteratee` functions have finished, or an error occurs. Invoked with (err).
     * @example
     *
     * var obj = {dev: "/dev.json", test: "/test.json", prod: "/prod.json"};
     * var configs = {};
     *
     * async.forEachOf(obj, function (value, key, callback) {
     *     fs.readFile(__dirname + value, "utf8", function (err, data) {
     *         if (err) return callback(err);
     *         try {
     *             configs[key] = JSON.parse(data);
     *         } catch (e) {
     *             return callback(e);
     *         }
     *         callback();
     *     });
     * }, function (err) {
     *     if (err) console.error(err.message);
     *     // configs is now a map of JSON data
     *     doSomethingWith(configs);
     * });
     */
    function eachOf (coll, iteratee, callback) {
        var eachOfImplementation = isArrayLike(coll) ? eachOfArrayLike : eachOfGeneric;
        eachOfImplementation(coll, iteratee, callback);
    }

    function doParallel(fn) {
        return function (obj, iteratee, callback) {
            return fn(eachOf, obj, iteratee, callback);
        };
    }

    function _asyncMap(eachfn, arr, iteratee, callback) {
        callback = once(callback || noop);
        arr = arr || [];
        var results = [];
        var counter = 0;

        eachfn(arr, function (value, _, callback) {
            var index = counter++;
            iteratee(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    /**
     * Produces a new collection of values by mapping each value in `coll` through
     * the `iteratee` function. The `iteratee` is called with an item from `coll`
     * and a callback for when it has finished processing. Each of these callback
     * takes 2 arguments: an `error`, and the transformed item from `coll`. If
     * `iteratee` passes an error to its callback, the main `callback` (for the
     * `map` function) is immediately called with the error.
     *
     * Note, that since this function applies the `iteratee` to each item in
     * parallel, there is no guarantee that the `iteratee` functions will complete
     * in order. However, the results array will be in the same order as the
     * original `coll`.
     *
     * If `map` is passed an Object, the results will be an Array.  The results
     * will roughly be in the order of the original Objects' keys (but this can
     * vary across JavaScript engines)
     *
     * @name map
     * @static
     * @memberOf module:Collections
     * @method
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, transformed)` which must be called
     * once it has completed with an error (which can be `null`) and a
     * transformed item. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Results is an Array of the
     * transformed items from the `coll`. Invoked with (err, results).
     * @example
     *
     * async.map(['file1','file2','file3'], fs.stat, function(err, results) {
     *     // results is now an array of stats for each file
     * });
     */
    var map = doParallel(_asyncMap);

    /**
     * Applies the provided arguments to each function in the array, calling
     * `callback` after all functions have completed. If you only provide the first
     * argument, then it will return a function which lets you pass in the
     * arguments as if it were a single function call.
     *
     * @name applyEach
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Array|Iterable|Object} fns - A collection of asynchronous functions to all
     * call with the same arguments
     * @param {...*} [args] - any number of separate arguments to pass to the
     * function.
     * @param {Function} [callback] - the final argument should be the callback,
     * called when all functions have completed processing.
     * @returns {Function} - If only the first argument is provided, it will return
     * a function which lets you pass in the arguments as if it were a single
     * function call.
     * @example
     *
     * async.applyEach([enableSearch, updateSchema], 'bucket', callback);
     *
     * // partial application example:
     * async.each(
     *     buckets,
     *     async.applyEach([enableSearch, updateSchema]),
     *     callback
     * );
     */
    var applyEach = applyEach$1(map);

    function doParallelLimit(fn) {
        return function (obj, limit, iteratee, callback) {
            return fn(_eachOfLimit(limit), obj, iteratee, callback);
        };
    }

    /**
     * The same as [`map`]{@link module:Collections.map} but runs a maximum of `limit` async operations at a time.
     *
     * @name mapLimit
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.map]{@link module:Collections.map}
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, transformed)` which must be called
     * once it has completed with an error (which can be `null`) and a transformed
     * item. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Results is an array of the
     * transformed items from the `coll`. Invoked with (err, results).
     */
    var mapLimit = doParallelLimit(_asyncMap);

    /**
     * The same as [`map`]{@link module:Collections.map} but runs only a single async operation at a time.
     *
     * @name mapSeries
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.map]{@link module:Collections.map}
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, transformed)` which must be called
     * once it has completed with an error (which can be `null`) and a
     * transformed item. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Results is an array of the
     * transformed items from the `coll`. Invoked with (err, results).
     */
    var mapSeries = doLimit(mapLimit, 1);

    /**
     * The same as [`applyEach`]{@link module:ControlFlow.applyEach} but runs only a single async operation at a time.
     *
     * @name applyEachSeries
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.applyEach]{@link module:ControlFlow.applyEach}
     * @category Control Flow
     * @param {Array|Iterable|Object} fns - A collection of asynchronous functions to all
     * call with the same arguments
     * @param {...*} [args] - any number of separate arguments to pass to the
     * function.
     * @param {Function} [callback] - the final argument should be the callback,
     * called when all functions have completed processing.
     * @returns {Function} - If only the first argument is provided, it will return
     * a function which lets you pass in the arguments as if it were a single
     * function call.
     */
    var applyEachSeries = applyEach$1(mapSeries);

    /**
     * Creates a continuation function with some arguments already applied.
     *
     * Useful as a shorthand when combined with other control flow functions. Any
     * arguments passed to the returned function are added to the arguments
     * originally passed to apply.
     *
     * @name apply
     * @static
     * @memberOf module:Utils
     * @method
     * @category Util
     * @param {Function} function - The function you want to eventually apply all
     * arguments to. Invokes with (arguments...).
     * @param {...*} arguments... - Any number of arguments to automatically apply
     * when the continuation is called.
     * @example
     *
     * // using apply
     * async.parallel([
     *     async.apply(fs.writeFile, 'testfile1', 'test1'),
     *     async.apply(fs.writeFile, 'testfile2', 'test2')
     * ]);
     *
     *
     * // the same process without using apply
     * async.parallel([
     *     function(callback) {
     *         fs.writeFile('testfile1', 'test1', callback);
     *     },
     *     function(callback) {
     *         fs.writeFile('testfile2', 'test2', callback);
     *     }
     * ]);
     *
     * // It's possible to pass any number of additional arguments when calling the
     * // continuation:
     *
     * node> var fn = async.apply(sys.puts, 'one');
     * node> fn('two', 'three');
     * one
     * two
     * three
     */
    var apply$1 = rest(function (fn, args) {
        return rest(function (callArgs) {
            return fn.apply(null, args.concat(callArgs));
        });
    });

    /**
     * Take a sync function and make it async, passing its return value to a
     * callback. This is useful for plugging sync functions into a waterfall,
     * series, or other async functions. Any arguments passed to the generated
     * function will be passed to the wrapped function (except for the final
     * callback argument). Errors thrown will be passed to the callback.
     *
     * If the function passed to `asyncify` returns a Promise, that promises's
     * resolved/rejected state will be used to call the callback, rather than simply
     * the synchronous return value.
     *
     * This also means you can asyncify ES2016 `async` functions.
     *
     * @name asyncify
     * @static
     * @memberOf module:Utils
     * @method
     * @alias wrapSync
     * @category Util
     * @param {Function} func - The synchronous function to convert to an
     * asynchronous function.
     * @returns {Function} An asynchronous wrapper of the `func`. To be invoked with
     * (callback).
     * @example
     *
     * // passing a regular synchronous function
     * async.waterfall([
     *     async.apply(fs.readFile, filename, "utf8"),
     *     async.asyncify(JSON.parse),
     *     function (data, next) {
     *         // data is the result of parsing the text.
     *         // If there was a parsing error, it would have been caught.
     *     }
     * ], callback);
     *
     * // passing a function returning a promise
     * async.waterfall([
     *     async.apply(fs.readFile, filename, "utf8"),
     *     async.asyncify(function (contents) {
     *         return db.model.create(contents);
     *     }),
     *     function (model, next) {
     *         // `model` is the instantiated model object.
     *         // If there was an error, this function would be skipped.
     *     }
     * ], callback);
     *
     * // es6 example
     * var q = async.queue(async.asyncify(async function(file) {
     *     var intermediateStep = await processFile(file);
     *     return await somePromise(intermediateStep)
     * }));
     *
     * q.push(files);
     */
    function asyncify(func) {
        return initialParams(function (args, callback) {
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (isObject(result) && typeof result.then === 'function') {
                result.then(function (value) {
                    callback(null, value);
                }, function (err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    }

    /**
     * A specialized version of `_.forEach` for arrays without support for
     * iteratee shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEach(array, iteratee) {
      var index = -1,
          length = array ? array.length : 0;

      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * Creates a base function for methods like `_.forIn` and `_.forOwn`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var index = -1,
            iterable = Object(object),
            props = keysFunc(object),
            length = props.length;

        while (length--) {
          var key = props[fromRight ? length : ++index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }

    /**
     * The base implementation of `baseForOwn` which iterates over `object`
     * properties returned by `keysFunc` and invokes `iteratee` for each property.
     * Iteratee functions may exit iteration early by explicitly returning `false`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseFor = createBaseFor();

    /**
     * The base implementation of `_.forOwn` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwn(object, iteratee) {
      return object && baseFor(object, iteratee, keys);
    }

    /**
     * Gets the index at which the first occurrence of `NaN` is found in `array`.
     *
     * @private
     * @param {Array} array The array to search.
     * @param {number} fromIndex The index to search from.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {number} Returns the index of the matched `NaN`, else `-1`.
     */
    function indexOfNaN(array, fromIndex, fromRight) {
      var length = array.length,
          index = fromIndex + (fromRight ? 1 : -1);

      while ((fromRight ? index-- : ++index < length)) {
        var other = array[index];
        if (other !== other) {
          return index;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
     *
     * @private
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseIndexOf(array, value, fromIndex) {
      if (value !== value) {
        return indexOfNaN(array, fromIndex);
      }
      var index = fromIndex - 1,
          length = array.length;

      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Determines the best order for running the functions in `tasks`, based on
     * their requirements. Each function can optionally depend on other functions
     * being completed first, and each function is run as soon as its requirements
     * are satisfied.
     *
     * If any of the functions pass an error to their callback, the `auto` sequence
     * will stop. Further tasks will not execute (so any other functions depending
     * on it will not run), and the main `callback` is immediately called with the
     * error.
     *
     * Functions also receive an object containing the results of functions which
     * have completed so far as the first argument, if they have dependencies. If a
     * task function has no dependencies, it will only be passed a callback.
     *
     * @name auto
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Object} tasks - An object. Each of its properties is either a
     * function or an array of requirements, with the function itself the last item
     * in the array. The object's key of a property serves as the name of the task
     * defined by that property, i.e. can be used when specifying requirements for
     * other tasks. The function receives one or two arguments:
     * * a `results` object, containing the results of the previously executed
     *   functions, only passed if the task has any dependencies,
     * * a `callback(err, result)` function, which must be called when finished,
     *   passing an `error` (which can be `null`) and the result of the function's
     *   execution.
     * @param {number} [concurrency=Infinity] - An optional `integer` for
     * determining the maximum number of tasks that can be run in parallel. By
     * default, as many as possible.
     * @param {Function} [callback] - An optional callback which is called when all
     * the tasks have been completed. It receives the `err` argument if any `tasks`
     * pass an error to their callback. Results are always returned; however, if an
     * error occurs, no further `tasks` will be performed, and the results object
     * will only contain partial results. Invoked with (err, results).
     * @returns undefined
     * @example
     *
     * async.auto({
     *     // this function will just be passed a callback
     *     readData: async.apply(fs.readFile, 'data.txt', 'utf-8'),
     *     showData: ['readData', function(results, cb) {
     *         // results.readData is the file's contents
     *         // ...
     *     }]
     * }, callback);
     *
     * async.auto({
     *     get_data: function(callback) {
     *         console.log('in get_data');
     *         // async code to get some data
     *         callback(null, 'data', 'converted to array');
     *     },
     *     make_folder: function(callback) {
     *         console.log('in make_folder');
     *         // async code to create a directory to store a file in
     *         // this is run at the same time as getting the data
     *         callback(null, 'folder');
     *     },
     *     write_file: ['get_data', 'make_folder', function(results, callback) {
     *         console.log('in write_file', JSON.stringify(results));
     *         // once there is some data and the directory exists,
     *         // write the data to a file in the directory
     *         callback(null, 'filename');
     *     }],
     *     email_link: ['write_file', function(results, callback) {
     *         console.log('in email_link', JSON.stringify(results));
     *         // once the file is written let's email a link to it...
     *         // results.write_file contains the filename returned by write_file.
     *         callback(null, {'file':results.write_file, 'email':'user@example.com'});
     *     }]
     * }, function(err, results) {
     *     console.log('err = ', err);
     *     console.log('results = ', results);
     * });
     */
    function auto (tasks, concurrency, callback) {
        if (typeof concurrency === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = once(callback || noop);
        var keys$$ = keys(tasks);
        var numTasks = keys$$.length;
        if (!numTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = numTasks;
        }

        var results = {};
        var runningTasks = 0;
        var hasError = false;

        var listeners = {};

        var readyTasks = [];

        // for cycle detection:
        var readyToCheck = []; // tasks that have been identified as reachable
        // without the possibility of returning to an ancestor task
        var uncheckedDependencies = {};

        baseForOwn(tasks, function (task, key) {
            if (!isArray(task)) {
                // no dependencies
                enqueueTask(key, [task]);
                readyToCheck.push(key);
                return;
            }

            var dependencies = task.slice(0, task.length - 1);
            var remainingDependencies = dependencies.length;
            if (remainingDependencies === 0) {
                enqueueTask(key, task);
                readyToCheck.push(key);
                return;
            }
            uncheckedDependencies[key] = remainingDependencies;

            arrayEach(dependencies, function (dependencyName) {
                if (!tasks[dependencyName]) {
                    throw new Error('async.auto task `' + key + '` has a non-existent dependency in ' + dependencies.join(', '));
                }
                addListener(dependencyName, function () {
                    remainingDependencies--;
                    if (remainingDependencies === 0) {
                        enqueueTask(key, task);
                    }
                });
            });
        });

        checkForDeadlocks();
        processQueue();

        function enqueueTask(key, task) {
            readyTasks.push(function () {
                runTask(key, task);
            });
        }

        function processQueue() {
            if (readyTasks.length === 0 && runningTasks === 0) {
                return callback(null, results);
            }
            while (readyTasks.length && runningTasks < concurrency) {
                var run = readyTasks.shift();
                run();
            }
        }

        function addListener(taskName, fn) {
            var taskListeners = listeners[taskName];
            if (!taskListeners) {
                taskListeners = listeners[taskName] = [];
            }

            taskListeners.push(fn);
        }

        function taskComplete(taskName) {
            var taskListeners = listeners[taskName] || [];
            arrayEach(taskListeners, function (fn) {
                fn();
            });
            processQueue();
        }

        function runTask(key, task) {
            if (hasError) return;

            var taskCallback = onlyOnce(rest(function (err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    baseForOwn(results, function (val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[key] = args;
                    hasError = true;
                    listeners = [];

                    callback(err, safeResults);
                } else {
                    results[key] = args;
                    taskComplete(key);
                }
            }));

            runningTasks++;
            var taskFn = task[task.length - 1];
            if (task.length > 1) {
                taskFn(results, taskCallback);
            } else {
                taskFn(taskCallback);
            }
        }

        function checkForDeadlocks() {
            // Kahn's algorithm
            // https://en.wikipedia.org/wiki/Topological_sorting#Kahn.27s_algorithm
            // http://connalle.blogspot.com/2013/10/topological-sortingkahn-algorithm.html
            var currentTask;
            var counter = 0;
            while (readyToCheck.length) {
                currentTask = readyToCheck.pop();
                counter++;
                arrayEach(getDependents(currentTask), function (dependent) {
                    if (--uncheckedDependencies[dependent] === 0) {
                        readyToCheck.push(dependent);
                    }
                });
            }

            if (counter !== numTasks) {
                throw new Error('async.auto cannot execute tasks due to a recursive dependency');
            }
        }

        function getDependents(taskName) {
            var result = [];
            baseForOwn(tasks, function (task, key) {
                if (isArray(task) && baseIndexOf(task, taskName, 0) >= 0) {
                    result.push(key);
                }
            });
            return result;
        }
    }

    /**
     * A specialized version of `_.map` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function arrayMap(array, iteratee) {
      var index = -1,
          length = array ? array.length : 0,
          result = Array(length);

      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function copyArray(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /**
     * Checks if `value` is a global object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {null|Object} Returns `value` if it's a global object, else `null`.
     */
    function checkGlobal(value) {
      return (value && value.Object === Object) ? value : null;
    }

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = checkGlobal(typeof global == 'object' && global);

    /** Detect free variable `self`. */
    var freeSelf = checkGlobal(typeof self == 'object' && self);

    /** Detect `this` as the global object. */
    var thisGlobal = checkGlobal(typeof this == 'object' && this);

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || thisGlobal || Function('return this')();

    /** Built-in value references. */
    var Symbol$1 = root.Symbol;

    /** Used as references for various `Number` constants. */
    var INFINITY$1 = 1 / 0;

    /** Used to convert symbols to primitives and strings. */
    var symbolProto = Symbol$1 ? Symbol$1.prototype : undefined;
    var symbolToString = symbolProto ? symbolProto.toString : undefined;
    /**
     * The base implementation of `_.toString` which doesn't convert nullish
     * values to empty strings.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {string} Returns the string.
     */
    function baseToString(value) {
      // Exit early for strings to avoid a performance hit in some environments.
      if (typeof value == 'string') {
        return value;
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : '';
      }
      var result = (value + '');
      return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
    }

    /**
     * The base implementation of `_.slice` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseSlice(array, start, end) {
      var index = -1,
          length = array.length;

      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = end > length ? length : end;
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : ((end - start) >>> 0);
      start >>>= 0;

      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }

    /**
     * Casts `array` to a slice if it's needed.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {number} start The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the cast slice.
     */
    function castSlice(array, start, end) {
      var length = array.length;
      end = end === undefined ? length : end;
      return (!start && end >= length) ? array : baseSlice(array, start, end);
    }

    /**
     * Used by `_.trim` and `_.trimEnd` to get the index of the last string symbol
     * that is not found in the character symbols.
     *
     * @private
     * @param {Array} strSymbols The string symbols to inspect.
     * @param {Array} chrSymbols The character symbols to find.
     * @returns {number} Returns the index of the last unmatched string symbol.
     */
    function charsEndIndex(strSymbols, chrSymbols) {
      var index = strSymbols.length;

      while (index-- && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
      return index;
    }

    /**
     * Used by `_.trim` and `_.trimStart` to get the index of the first string symbol
     * that is not found in the character symbols.
     *
     * @private
     * @param {Array} strSymbols The string symbols to inspect.
     * @param {Array} chrSymbols The character symbols to find.
     * @returns {number} Returns the index of the first unmatched string symbol.
     */
    function charsStartIndex(strSymbols, chrSymbols) {
      var index = -1,
          length = strSymbols.length;

      while (++index < length && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
      return index;
    }

    /** Used to compose unicode character classes. */
    var rsAstralRange = '\\ud800-\\udfff';
    var rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23';
    var rsComboSymbolsRange = '\\u20d0-\\u20f0';
    var rsVarRange = '\\ufe0e\\ufe0f';
    var rsAstral = '[' + rsAstralRange + ']';
    var rsCombo = '[' + rsComboMarksRange + rsComboSymbolsRange + ']';
    var rsFitz = '\\ud83c[\\udffb-\\udfff]';
    var rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')';
    var rsNonAstral = '[^' + rsAstralRange + ']';
    var rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}';
    var rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]';
    var rsZWJ = '\\u200d';
    var reOptMod = rsModifier + '?';
    var rsOptVar = '[' + rsVarRange + ']?';
    var rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*';
    var rsSeq = rsOptVar + reOptMod + rsOptJoin;
    var rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';
    /** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
    var reComplexSymbol = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

    /**
     * Converts `string` to an array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the converted array.
     */
    function stringToArray(string) {
      return string.match(reComplexSymbol);
    }

    /**
     * Converts `value` to a string. An empty string is returned for `null`
     * and `undefined` values. The sign of `-0` is preserved.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {string} Returns the string.
     * @example
     *
     * _.toString(null);
     * // => ''
     *
     * _.toString(-0);
     * // => '-0'
     *
     * _.toString([1, 2, 3]);
     * // => '1,2,3'
     */
    function toString(value) {
      return value == null ? '' : baseToString(value);
    }

    /** Used to match leading and trailing whitespace. */
    var reTrim$1 = /^\s+|\s+$/g;

    /**
     * Removes leading and trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trim('  abc  ');
     * // => 'abc'
     *
     * _.trim('-_-abc-_-', '_-');
     * // => 'abc'
     *
     * _.map(['  foo  ', '  bar  '], _.trim);
     * // => ['foo', 'bar']
     */
    function trim(string, chars, guard) {
      string = toString(string);
      if (string && (guard || chars === undefined)) {
        return string.replace(reTrim$1, '');
      }
      if (!string || !(chars = baseToString(chars))) {
        return string;
      }
      var strSymbols = stringToArray(string),
          chrSymbols = stringToArray(chars),
          start = charsStartIndex(strSymbols, chrSymbols),
          end = charsEndIndex(strSymbols, chrSymbols) + 1;

      return castSlice(strSymbols, start, end).join('');
    }

    var FN_ARGS = /^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m;
    var FN_ARG_SPLIT = /,/;
    var FN_ARG = /(=.+)?(\s*)$/;
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

    function parseParams(func) {
        func = func.toString().replace(STRIP_COMMENTS, '');
        func = func.match(FN_ARGS)[2].replace(' ', '');
        func = func ? func.split(FN_ARG_SPLIT) : [];
        func = func.map(function (arg) {
            return trim(arg.replace(FN_ARG, ''));
        });
        return func;
    }

    /**
     * A dependency-injected version of the [async.auto]{@link module:ControlFlow.auto} function. Dependent
     * tasks are specified as parameters to the function, after the usual callback
     * parameter, with the parameter names matching the names of the tasks it
     * depends on. This can provide even more readable task graphs which can be
     * easier to maintain.
     *
     * If a final callback is specified, the task results are similarly injected,
     * specified as named parameters after the initial error parameter.
     *
     * The autoInject function is purely syntactic sugar and its semantics are
     * otherwise equivalent to [async.auto]{@link module:ControlFlow.auto}.
     *
     * @name autoInject
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.auto]{@link module:ControlFlow.auto}
     * @category Control Flow
     * @param {Object} tasks - An object, each of whose properties is a function of
     * the form 'func([dependencies...], callback). The object's key of a property
     * serves as the name of the task defined by that property, i.e. can be used
     * when specifying requirements for other tasks.
     * * The `callback` parameter is a `callback(err, result)` which must be called
     *   when finished, passing an `error` (which can be `null`) and the result of
     *   the function's execution. The remaining parameters name other tasks on
     *   which the task is dependent, and the results from those tasks are the
     *   arguments of those parameters.
     * @param {Function} [callback] - An optional callback which is called when all
     * the tasks have been completed. It receives the `err` argument if any `tasks`
     * pass an error to their callback, and a `results` object with any completed
     * task results, similar to `auto`.
     * @example
     *
     * //  The example from `auto` can be rewritten as follows:
     * async.autoInject({
     *     get_data: function(callback) {
     *         // async code to get some data
     *         callback(null, 'data', 'converted to array');
     *     },
     *     make_folder: function(callback) {
     *         // async code to create a directory to store a file in
     *         // this is run at the same time as getting the data
     *         callback(null, 'folder');
     *     },
     *     write_file: function(get_data, make_folder, callback) {
     *         // once there is some data and the directory exists,
     *         // write the data to a file in the directory
     *         callback(null, 'filename');
     *     },
     *     email_link: function(write_file, callback) {
     *         // once the file is written let's email a link to it...
     *         // write_file contains the filename returned by write_file.
     *         callback(null, {'file':write_file, 'email':'user@example.com'});
     *     }
     * }, function(err, results) {
     *     console.log('err = ', err);
     *     console.log('email_link = ', results.email_link);
     * });
     *
     * // If you are using a JS minifier that mangles parameter names, `autoInject`
     * // will not work with plain functions, since the parameter names will be
     * // collapsed to a single letter identifier.  To work around this, you can
     * // explicitly specify the names of the parameters your task function needs
     * // in an array, similar to Angular.js dependency injection.
     *
     * // This still has an advantage over plain `auto`, since the results a task
     * // depends on are still spread into arguments.
     * async.autoInject({
     *     //...
     *     write_file: ['get_data', 'make_folder', function(get_data, make_folder, callback) {
     *         callback(null, 'filename');
     *     }],
     *     email_link: ['write_file', function(write_file, callback) {
     *         callback(null, {'file':write_file, 'email':'user@example.com'});
     *     }]
     *     //...
     * }, function(err, results) {
     *     console.log('err = ', err);
     *     console.log('email_link = ', results.email_link);
     * });
     */
    function autoInject(tasks, callback) {
        var newTasks = {};

        baseForOwn(tasks, function (taskFn, key) {
            var params;

            if (isArray(taskFn)) {
                params = copyArray(taskFn);
                taskFn = params.pop();

                newTasks[key] = params.concat(params.length > 0 ? newTask : taskFn);
            } else if (taskFn.length === 1) {
                // no dependencies, use the function as-is
                newTasks[key] = taskFn;
            } else {
                params = parseParams(taskFn);
                if (taskFn.length === 0 && params.length === 0) {
                    throw new Error("autoInject task functions require explicit parameters.");
                }

                params.pop();

                newTasks[key] = params.concat(newTask);
            }

            function newTask(results, taskCb) {
                var newArgs = arrayMap(params, function (name) {
                    return results[name];
                });
                newArgs.push(taskCb);
                taskFn.apply(null, newArgs);
            }
        });

        auto(newTasks, callback);
    }

    var hasSetImmediate = typeof setImmediate === 'function' && setImmediate;
    var hasNextTick = typeof process === 'object' && typeof process.nextTick === 'function';

    function fallback(fn) {
        setTimeout(fn, 0);
    }

    function wrap(defer) {
        return rest(function (fn, args) {
            defer(function () {
                fn.apply(null, args);
            });
        });
    }

    var _defer;

    if (hasSetImmediate) {
        _defer = setImmediate;
    } else if (hasNextTick) {
        _defer = process.nextTick;
    } else {
        _defer = fallback;
    }

    var setImmediate$1 = wrap(_defer);

    // Simple doubly linked list (https://en.wikipedia.org/wiki/Doubly_linked_list) implementation
    // used for queues. This implementation assumes that the node provided by the user can be modified
    // to adjust the next and last properties. We implement only the minimal functionality
    // for queue support.
    function DLL() {
        this.head = this.tail = null;
        this.length = 0;
    }

    function setInitial(dll, node) {
        dll.length = 1;
        dll.head = dll.tail = node;
    }

    DLL.prototype.removeLink = function (node) {
        if (node.prev) node.prev.next = node.next;else this.head = node.next;
        if (node.next) node.next.prev = node.prev;else this.tail = node.prev;

        node.prev = node.next = null;
        this.length -= 1;
        return node;
    };

    DLL.prototype.empty = DLL;

    DLL.prototype.insertAfter = function (node, newNode) {
        newNode.prev = node;
        newNode.next = node.next;
        if (node.next) node.next.prev = newNode;else this.tail = newNode;
        node.next = newNode;
        this.length += 1;
    };

    DLL.prototype.insertBefore = function (node, newNode) {
        newNode.prev = node.prev;
        newNode.next = node;
        if (node.prev) node.prev.next = newNode;else this.head = newNode;
        node.prev = newNode;
        this.length += 1;
    };

    DLL.prototype.unshift = function (node) {
        if (this.head) this.insertBefore(this.head, node);else setInitial(this, node);
    };

    DLL.prototype.push = function (node) {
        if (this.tail) this.insertAfter(this.tail, node);else setInitial(this, node);
    };

    DLL.prototype.shift = function () {
        return this.head && this.removeLink(this.head);
    };

    DLL.prototype.pop = function () {
        return this.tail && this.removeLink(this.tail);
    };

    function queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        } else if (concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }

        function _insert(data, insertAtFront, callback) {
            if (callback != null && typeof callback !== 'function') {
                throw new Error('task callback must be a function');
            }
            q.started = true;
            if (!isArray(data)) {
                data = [data];
            }
            if (data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return setImmediate$1(function () {
                    q.drain();
                });
            }
            arrayEach(data, function (task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (insertAtFront) {
                    q._tasks.unshift(item);
                } else {
                    q._tasks.push(item);
                }
            });
            setImmediate$1(q.process);
        }

        function _next(tasks) {
            return rest(function (args) {
                workers -= 1;

                arrayEach(tasks, function (task) {
                    arrayEach(workersList, function (worker, index) {
                        if (worker === task) {
                            workersList.splice(index, 1);
                            return false;
                        }
                    });

                    task.callback.apply(task, args);

                    if (args[0] != null) {
                        q.error(args[0], task.data);
                    }
                });

                if (workers <= q.concurrency - q.buffer) {
                    q.unsaturated();
                }

                if (q.idle()) {
                    q.drain();
                }
                q.process();
            });
        }

        var workers = 0;
        var workersList = [];
        var q = {
            _tasks: new DLL(),
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            unsaturated: noop,
            buffer: concurrency / 4,
            empty: noop,
            drain: noop,
            error: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q._tasks.empty();
            },
            unshift: function (data, callback) {
                _insert(data, true, callback);
            },
            process: function () {
                while (!q.paused && workers < q.concurrency && q._tasks.length) {
                    var tasks = [],
                        data = [];
                    var l = q._tasks.length;
                    if (q.payload) l = Math.min(l, q.payload);
                    for (var i = 0; i < l; i++) {
                        var node = q._tasks.shift();
                        tasks.push(node);
                        data.push(node.data);
                    }

                    if (q._tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);

                    if (workers === q.concurrency) {
                        q.saturated();
                    }

                    var cb = onlyOnce(_next(tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q._tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function () {
                return q._tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) {
                    return;
                }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q._tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    setImmediate$1(q.process);
                }
            }
        };
        return q;
    }

    /**
     * A cargo of tasks for the worker function to complete. Cargo inherits all of
     * the same methods and event callbacks as [`queue`]{@link module:ControlFlow.queue}.
     * @typedef {Object} CargoObject
     * @memberOf module:ControlFlow
     * @property {Function} length - A function returning the number of items
     * waiting to be processed. Invoke like `cargo.length()`.
     * @property {number} payload - An `integer` for determining how many tasks
     * should be process per round. This property can be changed after a `cargo` is
     * created to alter the payload on-the-fly.
     * @property {Function} push - Adds `task` to the `queue`. The callback is
     * called once the `worker` has finished processing the task. Instead of a
     * single task, an array of `tasks` can be submitted. The respective callback is
     * used for every task in the list. Invoke like `cargo.push(task, [callback])`.
     * @property {Function} saturated - A callback that is called when the
     * `queue.length()` hits the concurrency and further tasks will be queued.
     * @property {Function} empty - A callback that is called when the last item
     * from the `queue` is given to a `worker`.
     * @property {Function} drain - A callback that is called when the last item
     * from the `queue` has returned from the `worker`.
     * @property {Function} idle - a function returning false if there are items
     * waiting or being processed, or true if not. Invoke like `cargo.idle()`.
     * @property {Function} pause - a function that pauses the processing of tasks
     * until `resume()` is called. Invoke like `cargo.pause()`.
     * @property {Function} resume - a function that resumes the processing of
     * queued tasks when the queue is paused. Invoke like `cargo.resume()`.
     * @property {Function} kill - a function that removes the `drain` callback and
     * empties remaining tasks from the queue forcing it to go idle. Invoke like `cargo.kill()`.
     */

    /**
     * Creates a `cargo` object with the specified payload. Tasks added to the
     * cargo will be processed altogether (up to the `payload` limit). If the
     * `worker` is in progress, the task is queued until it becomes available. Once
     * the `worker` has completed some tasks, each callback of those tasks is
     * called. Check out [these](https://camo.githubusercontent.com/6bbd36f4cf5b35a0f11a96dcd2e97711ffc2fb37/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f313637363837312f36383130382f62626330636662302d356632392d313165322d393734662d3333393763363464633835382e676966) [animations](https://camo.githubusercontent.com/f4810e00e1c5f5f8addbe3e9f49064fd5d102699/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f313637363837312f36383130312f38346339323036362d356632392d313165322d383134662d3964336430323431336266642e676966)
     * for how `cargo` and `queue` work.
     *
     * While [`queue`]{@link module:ControlFlow.queue} passes only one task to one of a group of workers
     * at a time, cargo passes an array of tasks to a single worker, repeating
     * when the worker is finished.
     *
     * @name cargo
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.queue]{@link module:ControlFlow.queue}
     * @category Control Flow
     * @param {Function} worker - An asynchronous function for processing an array
     * of queued tasks, which must call its `callback(err)` argument when finished,
     * with an optional `err` argument. Invoked with `(tasks, callback)`.
     * @param {number} [payload=Infinity] - An optional `integer` for determining
     * how many tasks should be processed per round; if omitted, the default is
     * unlimited.
     * @returns {module:ControlFlow.CargoObject} A cargo object to manage the tasks. Callbacks can
     * attached as certain properties to listen for specific events during the
     * lifecycle of the cargo and inner queue.
     * @example
     *
     * // create a cargo object with payload 2
     * var cargo = async.cargo(function(tasks, callback) {
     *     for (var i=0; i<tasks.length; i++) {
     *         console.log('hello ' + tasks[i].name);
     *     }
     *     callback();
     * }, 2);
     *
     * // add some items
     * cargo.push({name: 'foo'}, function(err) {
     *     console.log('finished processing foo');
     * });
     * cargo.push({name: 'bar'}, function(err) {
     *     console.log('finished processing bar');
     * });
     * cargo.push({name: 'baz'}, function(err) {
     *     console.log('finished processing baz');
     * });
     */
    function cargo(worker, payload) {
      return queue(worker, 1, payload);
    }

    /**
     * The same as [`eachOf`]{@link module:Collections.eachOf} but runs only a single async operation at a time.
     *
     * @name eachOfSeries
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.eachOf]{@link module:Collections.eachOf}
     * @alias forEachOfSeries
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`. The
     * `key` is the item's key, or index in the case of an array. The iteratee is
     * passed a `callback(err)` which must be called once it has completed. If no
     * error has occurred, the callback should be run without arguments or with an
     * explicit `null` argument. Invoked with (item, key, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Invoked with (err).
     */
    var eachOfSeries = doLimit(eachOfLimit, 1);

    /**
     * Reduces `coll` into a single value using an async `iteratee` to return each
     * successive step. `memo` is the initial state of the reduction. This function
     * only operates in series.
     *
     * For performance reasons, it may make sense to split a call to this function
     * into a parallel map, and then use the normal `Array.prototype.reduce` on the
     * results. This function is for situations where each step in the reduction
     * needs to be async; if you can get the data before reducing it, then it's
     * probably a good idea to do so.
     *
     * @name reduce
     * @static
     * @memberOf module:Collections
     * @method
     * @alias inject
     * @alias foldl
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {*} memo - The initial state of the reduction.
     * @param {Function} iteratee - A function applied to each item in the
     * array to produce the next step in the reduction. The `iteratee` is passed a
     * `callback(err, reduction)` which accepts an optional error as its first
     * argument, and the state of the reduction as the second. If an error is
     * passed to the callback, the reduction is stopped and the main `callback` is
     * immediately called with the error. Invoked with (memo, item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result is the reduced value. Invoked with
     * (err, result).
     * @example
     *
     * async.reduce([1,2,3], 0, function(memo, item, callback) {
     *     // pointless async:
     *     process.nextTick(function() {
     *         callback(null, memo + item)
     *     });
     * }, function(err, result) {
     *     // result is now equal to the last value of memo, which is 6
     * });
     */
    function reduce(coll, memo, iteratee, callback) {
        callback = once(callback || noop);
        eachOfSeries(coll, function (x, i, callback) {
            iteratee(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    }

    /**
     * Version of the compose function that is more natural to read. Each function
     * consumes the return value of the previous function. It is the equivalent of
     * [compose]{@link module:ControlFlow.compose} with the arguments reversed.
     *
     * Each function is executed with the `this` binding of the composed function.
     *
     * @name seq
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.compose]{@link module:ControlFlow.compose}
     * @category Control Flow
     * @param {...Function} functions - the asynchronous functions to compose
     * @returns {Function} a function that composes the `functions` in order
     * @example
     *
     * // Requires lodash (or underscore), express3 and dresende's orm2.
     * // Part of an app, that fetches cats of the logged user.
     * // This example uses `seq` function to avoid overnesting and error
     * // handling clutter.
     * app.get('/cats', function(request, response) {
     *     var User = request.models.User;
     *     async.seq(
     *         _.bind(User.get, User),  // 'User.get' has signature (id, callback(err, data))
     *         function(user, fn) {
     *             user.getCats(fn);      // 'getCats' has signature (callback(err, data))
     *         }
     *     )(req.session.user_id, function (err, cats) {
     *         if (err) {
     *             console.error(err);
     *             response.json({ status: 'error', message: err.message });
     *         } else {
     *             response.json({ status: 'ok', message: 'Cats found', data: cats });
     *         }
     *     });
     * });
     */
    var seq = rest(function seq(functions) {
        return rest(function (args) {
            var that = this;

            var cb = args[args.length - 1];
            if (typeof cb == 'function') {
                args.pop();
            } else {
                cb = noop;
            }

            reduce(functions, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([rest(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            }, function (err, results) {
                cb.apply(that, [err].concat(results));
            });
        });
    });

    /**
     * Creates a function which is a composition of the passed asynchronous
     * functions. Each function consumes the return value of the function that
     * follows. Composing functions `f()`, `g()`, and `h()` would produce the result
     * of `f(g(h()))`, only this version uses callbacks to obtain the return values.
     *
     * Each function is executed with the `this` binding of the composed function.
     *
     * @name compose
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {...Function} functions - the asynchronous functions to compose
     * @returns {Function} an asynchronous function that is the composed
     * asynchronous `functions`
     * @example
     *
     * function add1(n, callback) {
     *     setTimeout(function () {
     *         callback(null, n + 1);
     *     }, 10);
     * }
     *
     * function mul3(n, callback) {
     *     setTimeout(function () {
     *         callback(null, n * 3);
     *     }, 10);
     * }
     *
     * var add1mul3 = async.compose(mul3, add1);
     * add1mul3(4, function (err, result) {
     *     // result now equals 15
     * });
     */
    var compose = rest(function (args) {
      return seq.apply(null, args.reverse());
    });

    function concat$1(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }

    /**
     * Applies `iteratee` to each item in `coll`, concatenating the results. Returns
     * the concatenated list. The `iteratee`s are called in parallel, and the
     * results are concatenated as they return. There is no guarantee that the
     * results array will be returned in the original order of `coll` passed to the
     * `iteratee` function.
     *
     * @name concat
     * @static
     * @memberOf module:Collections
     * @method
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, results)` which must be called once
     * it has completed with an error (which can be `null`) and an array of results.
     * Invoked with (item, callback).
     * @param {Function} [callback(err)] - A callback which is called after all the
     * `iteratee` functions have finished, or an error occurs. Results is an array
     * containing the concatenated results of the `iteratee` function. Invoked with
     * (err, results).
     * @example
     *
     * async.concat(['dir1','dir2','dir3'], fs.readdir, function(err, files) {
     *     // files is now a list of filenames that exist in the 3 directories
     * });
     */
    var concat = doParallel(concat$1);

    function doSeries(fn) {
        return function (obj, iteratee, callback) {
            return fn(eachOfSeries, obj, iteratee, callback);
        };
    }

    /**
     * The same as [`concat`]{@link module:Collections.concat} but runs only a single async operation at a time.
     *
     * @name concatSeries
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.concat]{@link module:Collections.concat}
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, results)` which must be called once
     * it has completed with an error (which can be `null`) and an array of results.
     * Invoked with (item, callback).
     * @param {Function} [callback(err)] - A callback which is called after all the
     * `iteratee` functions have finished, or an error occurs. Results is an array
     * containing the concatenated results of the `iteratee` function. Invoked with
     * (err, results).
     */
    var concatSeries = doSeries(concat$1);

    /**
     * Returns a function that when called, calls-back with the values provided.
     * Useful as the first function in a [`waterfall`]{@link module:ControlFlow.waterfall}, or for plugging values in to
     * [`auto`]{@link module:ControlFlow.auto}.
     *
     * @name constant
     * @static
     * @memberOf module:Utils
     * @method
     * @category Util
     * @param {...*} arguments... - Any number of arguments to automatically invoke
     * callback with.
     * @returns {Function} Returns a function that when invoked, automatically
     * invokes the callback with the previous given arguments.
     * @example
     *
     * async.waterfall([
     *     async.constant(42),
     *     function (value, next) {
     *         // value === 42
     *     },
     *     //...
     * ], callback);
     *
     * async.waterfall([
     *     async.constant(filename, "utf8"),
     *     fs.readFile,
     *     function (fileData, next) {
     *         //...
     *     }
     *     //...
     * ], callback);
     *
     * async.auto({
     *     hostname: async.constant("https://server.net/"),
     *     port: findFreePort,
     *     launchServer: ["hostname", "port", function (options, cb) {
     *         startServer(options, cb);
     *     }],
     *     //...
     * }, callback);
     */
    var constant = rest(function (values) {
        var args = [null].concat(values);
        return initialParams(function (ignoredArgs, callback) {
            return callback.apply(this, args);
        });
    });

    /**
     * This method returns the first argument given to it.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * console.log(_.identity(object) === object);
     * // => true
     */
    function identity(value) {
      return value;
    }

    function _createTester(eachfn, check, getResult) {
        return function (arr, limit, iteratee, cb) {
            function done(err) {
                if (cb) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, getResult(false));
                    }
                }
            }
            function wrappedIteratee(x, _, callback) {
                if (!cb) return callback();
                iteratee(x, function (err, v) {
                    if (cb) {
                        if (err) {
                            cb(err);
                            cb = iteratee = false;
                        } else if (check(v)) {
                            cb(null, getResult(true, x));
                            cb = iteratee = false;
                        }
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                cb = cb || noop;
                eachfn(arr, limit, wrappedIteratee, done);
            } else {
                cb = iteratee;
                cb = cb || noop;
                iteratee = limit;
                eachfn(arr, wrappedIteratee, done);
            }
        };
    }

    function _findGetResult(v, x) {
        return x;
    }

    /**
     * Returns the first value in `coll` that passes an async truth test. The
     * `iteratee` is applied in parallel, meaning the first iteratee to return
     * `true` will fire the detect `callback` with that result. That means the
     * result might not be the first item in the original `coll` (in terms of order)
     * that passes the test.

     * If order within the original `coll` is important, then look at
     * [`detectSeries`]{@link module:Collections.detectSeries}.
     *
     * @name detect
     * @static
     * @memberOf module:Collections
     * @method
     * @alias find
     * @category Collections
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, truthValue)` which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the `iteratee` functions have finished.
     * Result will be the first item in the array that passes the truth test
     * (iteratee) or the value `undefined` if none passed. Invoked with
     * (err, result).
     * @example
     *
     * async.detect(['file1','file2','file3'], function(filePath, callback) {
     *     fs.access(filePath, function(err) {
     *         callback(null, !err)
     *     });
     * }, function(err, result) {
     *     // result now equals the first file in the list that exists
     * });
     */
    var detect = _createTester(eachOf, identity, _findGetResult);

    /**
     * The same as [`detect`]{@link module:Collections.detect} but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name detectLimit
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.detect]{@link module:Collections.detect}
     * @alias findLimit
     * @category Collections
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, truthValue)` which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the `iteratee` functions have finished.
     * Result will be the first item in the array that passes the truth test
     * (iteratee) or the value `undefined` if none passed. Invoked with
     * (err, result).
     */
    var detectLimit = _createTester(eachOfLimit, identity, _findGetResult);

    /**
     * The same as [`detect`]{@link module:Collections.detect} but runs only a single async operation at a time.
     *
     * @name detectSeries
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.detect]{@link module:Collections.detect}
     * @alias findSeries
     * @category Collections
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, truthValue)` which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the `iteratee` functions have finished.
     * Result will be the first item in the array that passes the truth test
     * (iteratee) or the value `undefined` if none passed. Invoked with
     * (err, result).
     */
    var detectSeries = _createTester(eachOfSeries, identity, _findGetResult);

    function consoleFunc(name) {
        return rest(function (fn, args) {
            fn.apply(null, args.concat([rest(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    } else if (console[name]) {
                        arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }

    /**
     * Logs the result of an `async` function to the `console` using `console.dir`
     * to display the properties of the resulting object. Only works in Node.js or
     * in browsers that support `console.dir` and `console.error` (such as FF and
     * Chrome). If multiple arguments are returned from the async function,
     * `console.dir` is called on each argument in order.
     *
     * @name dir
     * @static
     * @memberOf module:Utils
     * @method
     * @category Util
     * @param {Function} function - The function you want to eventually apply all
     * arguments to.
     * @param {...*} arguments... - Any number of arguments to apply to the function.
     * @example
     *
     * // in a module
     * var hello = function(name, callback) {
     *     setTimeout(function() {
     *         callback(null, {hello: name});
     *     }, 1000);
     * };
     *
     * // in the node repl
     * node> async.dir(hello, 'world');
     * {hello: 'world'}
     */
    var dir = consoleFunc('dir');

    /**
     * The post-check version of [`during`]{@link module:ControlFlow.during}. To reflect the difference in
     * the order of operations, the arguments `test` and `fn` are switched.
     *
     * Also a version of [`doWhilst`]{@link module:ControlFlow.doWhilst} with asynchronous `test` function.
     * @name doDuring
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.during]{@link module:ControlFlow.during}
     * @category Control Flow
     * @param {Function} fn - A function which is called each time `test` passes.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} test - asynchronous truth test to perform before each
     * execution of `fn`. Invoked with (...args, callback), where `...args` are the
     * non-error args from the previous callback of `fn`.
     * @param {Function} [callback] - A callback which is called after the test
     * function has failed and repeated execution of `fn` has stopped. `callback`
     * will be passed an error if one occured, otherwise `null`.
     */
    function doDuring(fn, test, callback) {
        callback = onlyOnce(callback || noop);

        var next = rest(function (err, args) {
            if (err) return callback(err);
            args.push(check);
            test.apply(this, args);
        });

        function check(err, truth) {
            if (err) return callback(err);
            if (!truth) return callback(null);
            fn(next);
        }

        check(null, true);
    }

    /**
     * The post-check version of [`whilst`]{@link module:ControlFlow.whilst}. To reflect the difference in
     * the order of operations, the arguments `test` and `iteratee` are switched.
     *
     * `doWhilst` is to `whilst` as `do while` is to `while` in plain JavaScript.
     *
     * @name doWhilst
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.whilst]{@link module:ControlFlow.whilst}
     * @category Control Flow
     * @param {Function} iteratee - A function which is called each time `test`
     * passes. The function is passed a `callback(err)`, which must be called once
     * it has completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} test - synchronous truth test to perform after each
     * execution of `iteratee`. Invoked with Invoked with the non-error callback
     * results of `iteratee`.
     * @param {Function} [callback] - A callback which is called after the test
     * function has failed and repeated execution of `iteratee` has stopped.
     * `callback` will be passed an error and any arguments passed to the final
     * `iteratee`'s callback. Invoked with (err, [results]);
     */
    function doWhilst(iteratee, test, callback) {
        callback = onlyOnce(callback || noop);
        var next = rest(function (err, args) {
            if (err) return callback(err);
            if (test.apply(this, args)) return iteratee(next);
            callback.apply(null, [null].concat(args));
        });
        iteratee(next);
    }

    /**
     * Like ['doWhilst']{@link module:ControlFlow.doWhilst}, except the `test` is inverted. Note the
     * argument ordering differs from `until`.
     *
     * @name doUntil
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.doWhilst]{@link module:ControlFlow.doWhilst}
     * @category Control Flow
     * @param {Function} fn - A function which is called each time `test` fails.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} test - synchronous truth test to perform after each
     * execution of `fn`. Invoked with the non-error callback results of `fn`.
     * @param {Function} [callback] - A callback which is called after the test
     * function has passed and repeated execution of `fn` has stopped. `callback`
     * will be passed an error and any arguments passed to the final `fn`'s
     * callback. Invoked with (err, [results]);
     */
    function doUntil(fn, test, callback) {
        doWhilst(fn, function () {
            return !test.apply(this, arguments);
        }, callback);
    }

    /**
     * Like [`whilst`]{@link module:ControlFlow.whilst}, except the `test` is an asynchronous function that
     * is passed a callback in the form of `function (err, truth)`. If error is
     * passed to `test` or `fn`, the main callback is immediately called with the
     * value of the error.
     *
     * @name during
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.whilst]{@link module:ControlFlow.whilst}
     * @category Control Flow
     * @param {Function} test - asynchronous truth test to perform before each
     * execution of `fn`. Invoked with (callback).
     * @param {Function} fn - A function which is called each time `test` passes.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} [callback] - A callback which is called after the test
     * function has failed and repeated execution of `fn` has stopped. `callback`
     * will be passed an error, if one occured, otherwise `null`.
     * @example
     *
     * var count = 0;
     *
     * async.during(
     *     function (callback) {
     *         return callback(null, count < 5);
     *     },
     *     function (callback) {
     *         count++;
     *         setTimeout(callback, 1000);
     *     },
     *     function (err) {
     *         // 5 seconds have passed
     *     }
     * );
     */
    function during(test, fn, callback) {
        callback = onlyOnce(callback || noop);

        function next(err) {
            if (err) return callback(err);
            test(check);
        }

        function check(err, truth) {
            if (err) return callback(err);
            if (!truth) return callback(null);
            fn(next);
        }

        test(check);
    }

    function _withoutIndex(iteratee) {
        return function (value, index, callback) {
            return iteratee(value, callback);
        };
    }

    /**
     * Applies the function `iteratee` to each item in `coll`, in parallel.
     * The `iteratee` is called with an item from the list, and a callback for when
     * it has finished. If the `iteratee` passes an error to its `callback`, the
     * main `callback` (for the `each` function) is immediately called with the
     * error.
     *
     * Note, that since this function applies `iteratee` to each item in parallel,
     * there is no guarantee that the iteratee functions will complete in order.
     *
     * @name each
     * @static
     * @memberOf module:Collections
     * @method
     * @alias forEach
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item
     * in `coll`. The iteratee is passed a `callback(err)` which must be called once
     * it has completed. If no error has occurred, the `callback` should be run
     * without arguments or with an explicit `null` argument. The array index is not
     * passed to the iteratee. Invoked with (item, callback). If you need the index,
     * use `eachOf`.
     * @param {Function} [callback] - A callback which is called when all
     * `iteratee` functions have finished, or an error occurs. Invoked with (err).
     * @example
     *
     * // assuming openFiles is an array of file names and saveFile is a function
     * // to save the modified contents of that file:
     *
     * async.each(openFiles, saveFile, function(err){
     *   // if any of the saves produced an error, err would equal that error
     * });
     *
     * // assuming openFiles is an array of file names
     * async.each(openFiles, function(file, callback) {
     *
     *     // Perform operation on file here.
     *     console.log('Processing file ' + file);
     *
     *     if( file.length > 32 ) {
     *       console.log('This file name is too long');
     *       callback('File name too long');
     *     } else {
     *       // Do work to process file here
     *       console.log('File processed');
     *       callback();
     *     }
     * }, function(err) {
     *     // if any of the file processing produced an error, err would equal that error
     *     if( err ) {
     *       // One of the iterations produced an error.
     *       // All processing will now stop.
     *       console.log('A file failed to process');
     *     } else {
     *       console.log('All files have been processed successfully');
     *     }
     * });
     */
    function eachLimit(coll, iteratee, callback) {
      eachOf(coll, _withoutIndex(iteratee), callback);
    }

    /**
     * The same as [`each`]{@link module:Collections.each} but runs a maximum of `limit` async operations at a time.
     *
     * @name eachLimit
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.each]{@link module:Collections.each}
     * @alias forEachLimit
     * @category Collection
     * @param {Array|Iterable|Object} coll - A colleciton to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A function to apply to each item in `coll`. The
     * iteratee is passed a `callback(err)` which must be called once it has
     * completed. If no error has occurred, the `callback` should be run without
     * arguments or with an explicit `null` argument. The array index is not passed
     * to the iteratee. Invoked with (item, callback). If you need the index, use
     * `eachOfLimit`.
     * @param {Function} [callback] - A callback which is called when all
     * `iteratee` functions have finished, or an error occurs. Invoked with (err).
     */
    function eachLimit$1(coll, limit, iteratee, callback) {
      _eachOfLimit(limit)(coll, _withoutIndex(iteratee), callback);
    }

    /**
     * The same as [`each`]{@link module:Collections.each} but runs only a single async operation at a time.
     *
     * @name eachSeries
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.each]{@link module:Collections.each}
     * @alias forEachSeries
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each
     * item in `coll`. The iteratee is passed a `callback(err)` which must be called
     * once it has completed. If no error has occurred, the `callback` should be run
     * without arguments or with an explicit `null` argument. The array index is
     * not passed to the iteratee. Invoked with (item, callback). If you need the
     * index, use `eachOfSeries`.
     * @param {Function} [callback] - A callback which is called when all
     * `iteratee` functions have finished, or an error occurs. Invoked with (err).
     */
    var eachSeries = doLimit(eachLimit$1, 1);

    /**
     * Wrap an async function and ensure it calls its callback on a later tick of
     * the event loop.  If the function already calls its callback on a next tick,
     * no extra deferral is added. This is useful for preventing stack overflows
     * (`RangeError: Maximum call stack size exceeded`) and generally keeping
     * [Zalgo](http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony)
     * contained.
     *
     * @name ensureAsync
     * @static
     * @memberOf module:Utils
     * @method
     * @category Util
     * @param {Function} fn - an async function, one that expects a node-style
     * callback as its last argument.
     * @returns {Function} Returns a wrapped function with the exact same call
     * signature as the function passed in.
     * @example
     *
     * function sometimesAsync(arg, callback) {
     *     if (cache[arg]) {
     *         return callback(null, cache[arg]); // this would be synchronous!!
     *     } else {
     *         doSomeIO(arg, callback); // this IO would be asynchronous
     *     }
     * }
     *
     * // this has a risk of stack overflows if many results are cached in a row
     * async.mapSeries(args, sometimesAsync, done);
     *
     * // this will defer sometimesAsync's callback if necessary,
     * // preventing stack overflows
     * async.mapSeries(args, async.ensureAsync(sometimesAsync), done);
     */
    function ensureAsync(fn) {
        return initialParams(function (args, callback) {
            var sync = true;
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    setImmediate$1(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            fn.apply(this, args);
            sync = false;
        });
    }

    function notId(v) {
        return !v;
    }

    /**
     * Returns `true` if every element in `coll` satisfies an async test. If any
     * iteratee call returns `false`, the main `callback` is immediately called.
     *
     * @name every
     * @static
     * @memberOf module:Collections
     * @method
     * @alias all
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in the
     * collection in parallel. The iteratee is passed a `callback(err, truthValue)`
     * which must be called with a  boolean argument once it has completed. Invoked
     * with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result will be either `true` or `false`
     * depending on the values of the async tests. Invoked with (err, result).
     * @example
     *
     * async.every(['file1','file2','file3'], function(filePath, callback) {
     *     fs.access(filePath, function(err) {
     *         callback(null, !err)
     *     });
     * }, function(err, result) {
     *     // if result is true then every file exists
     * });
     */
    var every = _createTester(eachOf, notId, notId);

    /**
     * The same as [`every`]{@link module:Collections.every} but runs a maximum of `limit` async operations at a time.
     *
     * @name everyLimit
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.every]{@link module:Collections.every}
     * @alias allLimit
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A truth test to apply to each item in the
     * collection in parallel. The iteratee is passed a `callback(err, truthValue)`
     * which must be called with a  boolean argument once it has completed. Invoked
     * with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result will be either `true` or `false`
     * depending on the values of the async tests. Invoked with (err, result).
     */
    var everyLimit = _createTester(eachOfLimit, notId, notId);

    /**
     * The same as [`every`]{@link module:Collections.every} but runs only a single async operation at a time.
     *
     * @name everySeries
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.every]{@link module:Collections.every}
     * @alias allSeries
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in the
     * collection in parallel. The iteratee is passed a `callback(err, truthValue)`
     * which must be called with a  boolean argument once it has completed. Invoked
     * with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result will be either `true` or `false`
     * depending on the values of the async tests. Invoked with (err, result).
     */
    var everySeries = doLimit(everyLimit, 1);

    function _filter(eachfn, arr, iteratee, callback) {
        callback = once(callback || noop);
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iteratee(x, function (err, v) {
                if (err) {
                    callback(err);
                } else {
                    if (v) {
                        results.push({ index: index, value: x });
                    }
                    callback();
                }
            });
        }, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null, arrayMap(results.sort(function (a, b) {
                    return a.index - b.index;
                }), baseProperty('value')));
            }
        });
    }

    /**
     * Returns a new array of all the values in `coll` which pass an async truth
     * test. This operation is performed in parallel, but the results array will be
     * in the same order as the original.
     *
     * @name filter
     * @static
     * @memberOf module:Collections
     * @method
     * @alias select
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results).
     * @example
     *
     * async.filter(['file1','file2','file3'], function(filePath, callback) {
     *     fs.access(filePath, function(err) {
     *         callback(null, !err)
     *     });
     * }, function(err, results) {
     *     // results now equals an array of the existing files
     * });
     */
    var filter = doParallel(_filter);

    /**
     * The same as [`filter`]{@link module:Collections.filter} but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name filterLimit
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.filter]{@link module:Collections.filter}
     * @alias selectLimit
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results).
     */
    var filterLimit = doParallelLimit(_filter);

    /**
     * The same as [`filter`]{@link module:Collections.filter} but runs only a single async operation at a time.
     *
     * @name filterSeries
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.filter]{@link module:Collections.filter}
     * @alias selectSeries
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results)
     */
    var filterSeries = doLimit(filterLimit, 1);

    /**
     * Calls the asynchronous function `fn` with a callback parameter that allows it
     * to call itself again, in series, indefinitely.

     * If an error is passed to the
     * callback then `errback` is called with the error, and execution stops,
     * otherwise it will never be called.
     *
     * @name forever
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Function} fn - a function to call repeatedly. Invoked with (next).
     * @param {Function} [errback] - when `fn` passes an error to it's callback,
     * this function will be called, and execution stops. Invoked with (err).
     * @example
     *
     * async.forever(
     *     function(next) {
     *         // next is suitable for passing to things that need a callback(err [, whatever]);
     *         // it will result in this function being called again.
     *     },
     *     function(err) {
     *         // if next is called with a value in its first parameter, it will appear
     *         // in here as 'err', and execution will stop.
     *     }
     * );
     */
    function forever(fn, errback) {
        var done = onlyOnce(errback || noop);
        var task = ensureAsync(fn);

        function next(err) {
            if (err) return done(err);
            task(next);
        }
        next();
    }

    /**
     * Logs the result of an `async` function to the `console`. Only works in
     * Node.js or in browsers that support `console.log` and `console.error` (such
     * as FF and Chrome). If multiple arguments are returned from the async
     * function, `console.log` is called on each argument in order.
     *
     * @name log
     * @static
     * @memberOf module:Utils
     * @method
     * @category Util
     * @param {Function} function - The function you want to eventually apply all
     * arguments to.
     * @param {...*} arguments... - Any number of arguments to apply to the function.
     * @example
     *
     * // in a module
     * var hello = function(name, callback) {
     *     setTimeout(function() {
     *         callback(null, 'hello ' + name);
     *     }, 1000);
     * };
     *
     * // in the node repl
     * node> async.log(hello, 'world');
     * 'hello world'
     */
    var log = consoleFunc('log');

    /**
     * The same as [`mapValues`]{@link module:Collections.mapValues} but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name mapValuesLimit
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.mapValues]{@link module:Collections.mapValues}
     * @category Collection
     * @param {Object} obj - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A function to apply to each value in `obj`.
     * The iteratee is passed a `callback(err, transformed)` which must be called
     * once it has completed with an error (which can be `null`) and a
     * transformed value. Invoked with (value, key, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Result is an object of the
     * transformed values from the `obj`. Invoked with (err, result).
     */
    function mapValuesLimit(obj, limit, iteratee, callback) {
        callback = once(callback || noop);
        var newObj = {};
        eachOfLimit(obj, limit, function (val, key, next) {
            iteratee(val, key, function (err, result) {
                if (err) return next(err);
                newObj[key] = result;
                next();
            });
        }, function (err) {
            callback(err, newObj);
        });
    }

    /**
     * A relative of [`map`]{@link module:Collections.map}, designed for use with objects.
     *
     * Produces a new Object by mapping each value of `obj` through the `iteratee`
     * function. The `iteratee` is called each `value` and `key` from `obj` and a
     * callback for when it has finished processing. Each of these callbacks takes
     * two arguments: an `error`, and the transformed item from `obj`. If `iteratee`
     * passes an error to its callback, the main `callback` (for the `mapValues`
     * function) is immediately called with the error.
     *
     * Note, the order of the keys in the result is not guaranteed.  The keys will
     * be roughly in the order they complete, (but this is very engine-specific)
     *
     * @name mapValues
     * @static
     * @memberOf module:Collections
     * @method
     * @category Collection
     * @param {Object} obj - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each value and key in
     * `coll`. The iteratee is passed a `callback(err, transformed)` which must be
     * called once it has completed with an error (which can be `null`) and a
     * transformed value. Invoked with (value, key, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Results is an array of the
     * transformed items from the `obj`. Invoked with (err, result).
     * @example
     *
     * async.mapValues({
     *     f1: 'file1',
     *     f2: 'file2',
     *     f3: 'file3'
     * }, function (file, key, callback) {
     *   fs.stat(file, callback);
     * }, function(err, result) {
     *     // results is now a map of stats for each file, e.g.
     *     // {
     *     //     f1: [stats for file1],
     *     //     f2: [stats for file2],
     *     //     f3: [stats for file3]
     *     // }
     * });
     */

    var mapValues = doLimit(mapValuesLimit, Infinity);

    /**
     * The same as [`mapValues`]{@link module:Collections.mapValues} but runs only a single async operation at a time.
     *
     * @name mapValuesSeries
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.mapValues]{@link module:Collections.mapValues}
     * @category Collection
     * @param {Object} obj - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each value in `obj`.
     * The iteratee is passed a `callback(err, transformed)` which must be called
     * once it has completed with an error (which can be `null`) and a
     * transformed value. Invoked with (value, key, callback).
     * @param {Function} [callback] - A callback which is called when all `iteratee`
     * functions have finished, or an error occurs. Result is an object of the
     * transformed values from the `obj`. Invoked with (err, result).
     */
    var mapValuesSeries = doLimit(mapValuesLimit, 1);

    function has(obj, key) {
        return key in obj;
    }

    /**
     * Caches the results of an `async` function. When creating a hash to store
     * function results against, the callback is omitted from the hash and an
     * optional hash function can be used.
     *
     * If no hash function is specified, the first argument is used as a hash key,
     * which may work reasonably if it is a string or a data type that converts to a
     * distinct string. Note that objects and arrays will not behave reasonably.
     * Neither will cases where the other arguments are significant. In such cases,
     * specify your own hash function.
     *
     * The cache of results is exposed as the `memo` property of the function
     * returned by `memoize`.
     *
     * @name memoize
     * @static
     * @memberOf module:Utils
     * @method
     * @category Util
     * @param {Function} fn - The function to proxy and cache results from.
     * @param {Function} hasher - An optional function for generating a custom hash
     * for storing results. It has all the arguments applied to it apart from the
     * callback, and must be synchronous.
     * @returns {Function} a memoized version of `fn`
     * @example
     *
     * var slow_fn = function(name, callback) {
     *     // do something
     *     callback(null, result);
     * };
     * var fn = async.memoize(slow_fn);
     *
     * // fn can now be used as if it were slow_fn
     * fn('some name', function() {
     *     // callback
     * });
     */
    function memoize(fn, hasher) {
        var memo = Object.create(null);
        var queues = Object.create(null);
        hasher = hasher || identity;
        var memoized = initialParams(function memoized(args, callback) {
            var key = hasher.apply(null, args);
            if (has(memo, key)) {
                setImmediate$1(function () {
                    callback.apply(null, memo[key]);
                });
            } else if (has(queues, key)) {
                queues[key].push(callback);
            } else {
                queues[key] = [callback];
                fn.apply(null, args.concat([rest(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    }

    /**
     * Calls `callback` on a later loop around the event loop. In Node.js this just
     * calls `setImmediate`.  In the browser it will use `setImmediate` if
     * available, otherwise `setTimeout(callback, 0)`, which means other higher
     * priority events may precede the execution of `callback`.
     *
     * This is used internally for browser-compatibility purposes.
     *
     * @name nextTick
     * @static
     * @memberOf module:Utils
     * @method
     * @alias setImmediate
     * @category Util
     * @param {Function} callback - The function to call on a later loop around
     * the event loop. Invoked with (args...).
     * @param {...*} args... - any number of additional arguments to pass to the
     * callback on the next tick.
     * @example
     *
     * var call_order = [];
     * async.nextTick(function() {
     *     call_order.push('two');
     *     // call_order now equals ['one','two']
     * });
     * call_order.push('one');
     *
     * async.setImmediate(function (a, b, c) {
     *     // a, b, and c equal 1, 2, and 3
     * }, 1, 2, 3);
     */
    var _defer$1;

    if (hasNextTick) {
        _defer$1 = process.nextTick;
    } else if (hasSetImmediate) {
        _defer$1 = setImmediate;
    } else {
        _defer$1 = fallback;
    }

    var nextTick = wrap(_defer$1);

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(rest(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    /**
     * Run the `tasks` collection of functions in parallel, without waiting until
     * the previous function has completed. If any of the functions pass an error to
     * its callback, the main `callback` is immediately called with the value of the
     * error. Once the `tasks` have completed, the results are passed to the final
     * `callback` as an array.
     *
     * **Note:** `parallel` is about kicking-off I/O tasks in parallel, not about
     * parallel execution of code.  If your tasks do not use any timers or perform
     * any I/O, they will actually be executed in series.  Any synchronous setup
     * sections for each task will happen one after the other.  JavaScript remains
     * single-threaded.
     *
     * It is also possible to use an object instead of an array. Each property will
     * be run as a function and the results will be passed to the final `callback`
     * as an object instead of an array. This can be a more readable way of handling
     * results from {@link async.parallel}.
     *
     * @name parallel
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Array|Iterable|Object} tasks - A collection containing functions to run.
     * Each function is passed a `callback(err, result)` which it must call on
     * completion with an error `err` (which can be `null`) and an optional `result`
     * value.
     * @param {Function} [callback] - An optional callback to run once all the
     * functions have completed successfully. This function gets a results array
     * (or object) containing all the result arguments passed to the task callbacks.
     * Invoked with (err, results).
     * @example
     * async.parallel([
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'one');
     *         }, 200);
     *     },
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'two');
     *         }, 100);
     *     }
     * ],
     * // optional callback
     * function(err, results) {
     *     // the results array will equal ['one','two'] even though
     *     // the second function had a shorter timeout.
     * });
     *
     * // an example using an object instead of an array
     * async.parallel({
     *     one: function(callback) {
     *         setTimeout(function() {
     *             callback(null, 1);
     *         }, 200);
     *     },
     *     two: function(callback) {
     *         setTimeout(function() {
     *             callback(null, 2);
     *         }, 100);
     *     }
     * }, function(err, results) {
     *     // results is now equals to: {one: 1, two: 2}
     * });
     */
    function parallelLimit(tasks, callback) {
      _parallel(eachOf, tasks, callback);
    }

    /**
     * The same as [`parallel`]{@link module:ControlFlow.parallel} but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name parallelLimit
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.parallel]{@link module:ControlFlow.parallel}
     * @category Control Flow
     * @param {Array|Collection} tasks - A collection containing functions to run.
     * Each function is passed a `callback(err, result)` which it must call on
     * completion with an error `err` (which can be `null`) and an optional `result`
     * value.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} [callback] - An optional callback to run once all the
     * functions have completed successfully. This function gets a results array
     * (or object) containing all the result arguments passed to the task callbacks.
     * Invoked with (err, results).
     */
    function parallelLimit$1(tasks, limit, callback) {
      _parallel(_eachOfLimit(limit), tasks, callback);
    }

    /**
     * A queue of tasks for the worker function to complete.
     * @typedef {Object} QueueObject
     * @memberOf module:ControlFlow
     * @property {Function} length - a function returning the number of items
     * waiting to be processed. Invoke with `queue.length()`.
     * @property {boolean} started - a boolean indicating whether or not any
     * items have been pushed and processed by the queue.
     * @property {Function} running - a function returning the number of items
     * currently being processed. Invoke with `queue.running()`.
     * @property {Function} workersList - a function returning the array of items
     * currently being processed. Invoke with `queue.workersList()`.
     * @property {Function} idle - a function returning false if there are items
     * waiting or being processed, or true if not. Invoke with `queue.idle()`.
     * @property {number} concurrency - an integer for determining how many `worker`
     * functions should be run in parallel. This property can be changed after a
     * `queue` is created to alter the concurrency on-the-fly.
     * @property {Function} push - add a new task to the `queue`. Calls `callback`
     * once the `worker` has finished processing the task. Instead of a single task,
     * a `tasks` array can be submitted. The respective callback is used for every
     * task in the list. Invoke with `queue.push(task, [callback])`,
     * @property {Function} unshift - add a new task to the front of the `queue`.
     * Invoke with `queue.unshift(task, [callback])`.
     * @property {Function} saturated - a callback that is called when the number of
     * running workers hits the `concurrency` limit, and further tasks will be
     * queued.
     * @property {Function} unsaturated - a callback that is called when the number
     * of running workers is less than the `concurrency` & `buffer` limits, and
     * further tasks will not be queued.
     * @property {number} buffer - A minimum threshold buffer in order to say that
     * the `queue` is `unsaturated`.
     * @property {Function} empty - a callback that is called when the last item
     * from the `queue` is given to a `worker`.
     * @property {Function} drain - a callback that is called when the last item
     * from the `queue` has returned from the `worker`.
     * @property {Function} error - a callback that is called when a task errors.
     * Has the signature `function(error, task)`.
     * @property {boolean} paused - a boolean for determining whether the queue is
     * in a paused state.
     * @property {Function} pause - a function that pauses the processing of tasks
     * until `resume()` is called. Invoke with `queue.pause()`.
     * @property {Function} resume - a function that resumes the processing of
     * queued tasks when the queue is paused. Invoke with `queue.resume()`.
     * @property {Function} kill - a function that removes the `drain` callback and
     * empties remaining tasks from the queue forcing it to go idle. Invoke with `queue.kill()`.
     */

    /**
     * Creates a `queue` object with the specified `concurrency`. Tasks added to the
     * `queue` are processed in parallel (up to the `concurrency` limit). If all
     * `worker`s are in progress, the task is queued until one becomes available.
     * Once a `worker` completes a `task`, that `task`'s callback is called.
     *
     * @name queue
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Function} worker - An asynchronous function for processing a queued
     * task, which must call its `callback(err)` argument when finished, with an
     * optional `error` as an argument.  If you want to handle errors from an
     * individual task, pass a callback to `q.push()`. Invoked with
     * (task, callback).
     * @param {number} [concurrency=1] - An `integer` for determining how many
     * `worker` functions should be run in parallel.  If omitted, the concurrency
     * defaults to `1`.  If the concurrency is `0`, an error is thrown.
     * @returns {module:ControlFlow.QueueObject} A queue object to manage the tasks. Callbacks can
     * attached as certain properties to listen for specific events during the
     * lifecycle of the queue.
     * @example
     *
     * // create a queue object with concurrency 2
     * var q = async.queue(function(task, callback) {
     *     console.log('hello ' + task.name);
     *     callback();
     * }, 2);
     *
     * // assign a callback
     * q.drain = function() {
     *     console.log('all items have been processed');
     * };
     *
     * // add some items to the queue
     * q.push({name: 'foo'}, function(err) {
     *     console.log('finished processing foo');
     * });
     * q.push({name: 'bar'}, function (err) {
     *     console.log('finished processing bar');
     * });
     *
     * // add some items to the queue (batch-wise)
     * q.push([{name: 'baz'},{name: 'bay'},{name: 'bax'}], function(err) {
     *     console.log('finished processing item');
     * });
     *
     * // add some items to the front of the queue
     * q.unshift({name: 'bar'}, function (err) {
     *     console.log('finished processing bar');
     * });
     */
    function queue$1 (worker, concurrency) {
      return queue(function (items, cb) {
        worker(items[0], cb);
      }, concurrency, 1);
    }

    /**
     * The same as [async.queue]{@link module:ControlFlow.queue} only tasks are assigned a priority and
     * completed in ascending priority order.
     *
     * @name priorityQueue
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.queue]{@link module:ControlFlow.queue}
     * @category Control Flow
     * @param {Function} worker - An asynchronous function for processing a queued
     * task, which must call its `callback(err)` argument when finished, with an
     * optional `error` as an argument.  If you want to handle errors from an
     * individual task, pass a callback to `q.push()`. Invoked with
     * (task, callback).
     * @param {number} concurrency - An `integer` for determining how many `worker`
     * functions should be run in parallel.  If omitted, the concurrency defaults to
     * `1`.  If the concurrency is `0`, an error is thrown.
     * @returns {module:ControlFlow.QueueObject} A priorityQueue object to manage the tasks. There are two
     * differences between `queue` and `priorityQueue` objects:
     * * `push(task, priority, [callback])` - `priority` should be a number. If an
     *   array of `tasks` is given, all tasks will be assigned the same priority.
     * * The `unshift` method was removed.
     */
    function priorityQueue (worker, concurrency) {
        // Start with a normal queue
        var q = queue$1(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            if (callback == null) callback = noop;
            if (typeof callback !== 'function') {
                throw new Error('task callback must be a function');
            }
            q.started = true;
            if (!isArray(data)) {
                data = [data];
            }
            if (data.length === 0) {
                // call drain immediately if there are no tasks
                return setImmediate$1(function () {
                    q.drain();
                });
            }

            priority = priority || 0;
            var nextNode = q._tasks.head;
            while (nextNode && priority >= nextNode.priority) {
                nextNode = nextNode.next;
            }

            arrayEach(data, function (task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: callback
                };

                if (nextNode) {
                    q._tasks.insertBefore(nextNode, item);
                } else {
                    q._tasks.push(item);
                }
            });
            setImmediate$1(q.process);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    }

    /**
     * Runs the `tasks` array of functions in parallel, without waiting until the
     * previous function has completed. Once any the `tasks` completed or pass an
     * error to its callback, the main `callback` is immediately called. It's
     * equivalent to `Promise.race()`.
     *
     * @name race
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Array} tasks - An array containing functions to run. Each function
     * is passed a `callback(err, result)` which it must call on completion with an
     * error `err` (which can be `null`) and an optional `result` value.
     * @param {Function} callback - A callback to run once any of the functions have
     * completed. This function gets an error or result from the first function that
     * completed. Invoked with (err, result).
     * @returns undefined
     * @example
     *
     * async.race([
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'one');
     *         }, 200);
     *     },
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'two');
     *         }, 100);
     *     }
     * ],
     * // main callback
     * function(err, result) {
     *     // the result will be equal to 'two' as it finishes earlier
     * });
     */
    function race(tasks, callback) {
        callback = once(callback || noop);
        if (!isArray(tasks)) return callback(new TypeError('First argument to race must be an array of functions'));
        if (!tasks.length) return callback();
        arrayEach(tasks, function (task) {
            task(callback);
        });
    }

    var slice = Array.prototype.slice;

    /**
     * Same as [`reduce`]{@link module:Collections.reduce}, only operates on `array` in reverse order.
     *
     * @name reduceRight
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.reduce]{@link module:Collections.reduce}
     * @alias foldr
     * @category Collection
     * @param {Array} array - A collection to iterate over.
     * @param {*} memo - The initial state of the reduction.
     * @param {Function} iteratee - A function applied to each item in the
     * array to produce the next step in the reduction. The `iteratee` is passed a
     * `callback(err, reduction)` which accepts an optional error as its first
     * argument, and the state of the reduction as the second. If an error is
     * passed to the callback, the reduction is stopped and the main `callback` is
     * immediately called with the error. Invoked with (memo, item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result is the reduced value. Invoked with
     * (err, result).
     */
    function reduceRight(array, memo, iteratee, callback) {
      var reversed = slice.call(array).reverse();
      reduce(reversed, memo, iteratee, callback);
    }

    /**
     * Wraps the function in another function that always returns data even when it
     * errors.
     *
     * The object returned has either the property `error` or `value`.
     *
     * @name reflect
     * @static
     * @memberOf module:Utils
     * @method
     * @category Util
     * @param {Function} fn - The function you want to wrap
     * @returns {Function} - A function that always passes null to it's callback as
     * the error. The second argument to the callback will be an `object` with
     * either an `error` or a `value` property.
     * @example
     *
     * async.parallel([
     *     async.reflect(function(callback) {
     *         // do some stuff ...
     *         callback(null, 'one');
     *     }),
     *     async.reflect(function(callback) {
     *         // do some more stuff but error ...
     *         callback('bad stuff happened');
     *     }),
     *     async.reflect(function(callback) {
     *         // do some more stuff ...
     *         callback(null, 'two');
     *     })
     * ],
     * // optional callback
     * function(err, results) {
     *     // values
     *     // results[0].value = 'one'
     *     // results[1].error = 'bad stuff happened'
     *     // results[2].value = 'two'
     * });
     */
    function reflect(fn) {
        return initialParams(function reflectOn(args, reflectCallback) {
            args.push(rest(function callback(err, cbArgs) {
                if (err) {
                    reflectCallback(null, {
                        error: err
                    });
                } else {
                    var value = null;
                    if (cbArgs.length === 1) {
                        value = cbArgs[0];
                    } else if (cbArgs.length > 1) {
                        value = cbArgs;
                    }
                    reflectCallback(null, {
                        value: value
                    });
                }
            }));

            return fn.apply(this, args);
        });
    }

    function reject$1(eachfn, arr, iteratee, callback) {
        _filter(eachfn, arr, function (value, cb) {
            iteratee(value, function (err, v) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, !v);
                }
            });
        }, callback);
    }

    /**
     * The opposite of [`filter`]{@link module:Collections.filter}. Removes values that pass an `async` truth test.
     *
     * @name reject
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.filter]{@link module:Collections.filter}
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results).
     * @example
     *
     * async.reject(['file1','file2','file3'], function(filePath, callback) {
     *     fs.access(filePath, function(err) {
     *         callback(null, !err)
     *     });
     * }, function(err, results) {
     *     // results now equals an array of missing files
     *     createFiles(results);
     * });
     */
    var reject = doParallel(reject$1);

    /**
     * A helper function that wraps an array or an object of functions with reflect.
     *
     * @name reflectAll
     * @static
     * @memberOf module:Utils
     * @method
     * @see [async.reflect]{@link module:Utils.reflect}
     * @category Util
     * @param {Array} tasks - The array of functions to wrap in `async.reflect`.
     * @returns {Array} Returns an array of functions, each function wrapped in
     * `async.reflect`
     * @example
     *
     * let tasks = [
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'one');
     *         }, 200);
     *     },
     *     function(callback) {
     *         // do some more stuff but error ...
     *         callback(new Error('bad stuff happened'));
     *     },
     *     function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'two');
     *         }, 100);
     *     }
     * ];
     *
     * async.parallel(async.reflectAll(tasks),
     * // optional callback
     * function(err, results) {
     *     // values
     *     // results[0].value = 'one'
     *     // results[1].error = Error('bad stuff happened')
     *     // results[2].value = 'two'
     * });
     *
     * // an example using an object instead of an array
     * let tasks = {
     *     one: function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'one');
     *         }, 200);
     *     },
     *     two: function(callback) {
     *         callback('two');
     *     },
     *     three: function(callback) {
     *         setTimeout(function() {
     *             callback(null, 'three');
     *         }, 100);
     *     }
     * };
     *
     * async.parallel(async.reflectAll(tasks),
     * // optional callback
     * function(err, results) {
     *     // values
     *     // results.one.value = 'one'
     *     // results.two.error = 'two'
     *     // results.three.value = 'three'
     * });
     */
    function reflectAll(tasks) {
        var results;
        if (isArray(tasks)) {
            results = arrayMap(tasks, reflect);
        } else {
            results = {};
            baseForOwn(tasks, function (task, key) {
                results[key] = reflect.call(this, task);
            });
        }
        return results;
    }

    /**
     * The same as [`reject`]{@link module:Collections.reject} but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name rejectLimit
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.reject]{@link module:Collections.reject}
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results).
     */
    var rejectLimit = doParallelLimit(reject$1);

    /**
     * The same as [`reject`]{@link module:Collections.reject} but runs only a single async operation at a time.
     *
     * @name rejectSeries
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.reject]{@link module:Collections.reject}
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in `coll`.
     * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
     * with a boolean argument once it has completed. Invoked with (item, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Invoked with (err, results).
     */
    var rejectSeries = doLimit(rejectLimit, 1);

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Util
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new constant function.
     * @example
     *
     * var objects = _.times(2, _.constant({ 'a': 1 }));
     *
     * console.log(objects);
     * // => [{ 'a': 1 }, { 'a': 1 }]
     *
     * console.log(objects[0] === objects[1]);
     * // => true
     */
    function constant$1(value) {
      return function() {
        return value;
      };
    }

    /**
     * Attempts to get a successful response from `task` no more than `times` times
     * before returning an error. If the task is successful, the `callback` will be
     * passed the result of the successful task. If all attempts fail, the callback
     * will be passed the error and result (if any) of the final attempt.
     *
     * @name retry
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Object|number} [opts = {times: 5, interval: 0}| 5] - Can be either an
     * object with `times` and `interval` or a number.
     * * `times` - The number of attempts to make before giving up.  The default
     *   is `5`.
     * * `interval` - The time to wait between retries, in milliseconds.  The
     *   default is `0`. The interval may also be specified as a function of the
     *   retry count (see example).
     * * If `opts` is a number, the number specifies the number of times to retry,
     *   with the default interval of `0`.
     * @param {Function} task - A function which receives two arguments: (1) a
     * `callback(err, result)` which must be called when finished, passing `err`
     * (which can be `null`) and the `result` of the function's execution, and (2)
     * a `results` object, containing the results of the previously executed
     * functions (if nested inside another control flow). Invoked with
     * (callback, results).
     * @param {Function} [callback] - An optional callback which is called when the
     * task has succeeded, or after the final failed attempt. It receives the `err`
     * and `result` arguments of the last attempt at completing the `task`. Invoked
     * with (err, results).
     * @example
     *
     * // The `retry` function can be used as a stand-alone control flow by passing
     * // a callback, as shown below:
     *
     * // try calling apiMethod 3 times
     * async.retry(3, apiMethod, function(err, result) {
     *     // do something with the result
     * });
     *
     * // try calling apiMethod 3 times, waiting 200 ms between each retry
     * async.retry({times: 3, interval: 200}, apiMethod, function(err, result) {
     *     // do something with the result
     * });
     *
     * // try calling apiMethod 10 times with exponential backoff
     * // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
     * async.retry({
     *   times: 10,
     *   interval: function(retryCount) {
     *     return 50 * Math.pow(2, retryCount);
     *   }
     * }, apiMethod, function(err, result) {
     *     // do something with the result
     * });
     *
     * // try calling apiMethod the default 5 times no delay between each retry
     * async.retry(apiMethod, function(err, result) {
     *     // do something with the result
     * });
     *
     * // It can also be embedded within other control flow functions to retry
     * // individual methods that are not as reliable, like this:
     * async.auto({
     *     users: api.getUsers.bind(api),
     *     payments: async.retry(3, api.getPayments.bind(api))
     * }, function(err, results) {
     *     // do something with the results
     * });
     */
    function retry(opts, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var options = {
            times: DEFAULT_TIMES,
            intervalFunc: constant$1(DEFAULT_INTERVAL)
        };

        function parseTimes(acc, t) {
            if (typeof t === 'object') {
                acc.times = +t.times || DEFAULT_TIMES;

                acc.intervalFunc = typeof t.interval === 'function' ? t.interval : constant$1(+t.interval || DEFAULT_INTERVAL);
            } else if (typeof t === 'number' || typeof t === 'string') {
                acc.times = +t || DEFAULT_TIMES;
            } else {
                throw new Error("Invalid arguments for async.retry");
            }
        }

        if (arguments.length < 3 && typeof opts === 'function') {
            callback = task || noop;
            task = opts;
        } else {
            parseTimes(options, opts);
            callback = callback || noop;
        }

        if (typeof task !== 'function') {
            throw new Error("Invalid arguments for async.retry");
        }

        var attempt = 1;
        function retryAttempt() {
            task(function (err) {
                if (err && attempt++ < options.times) {
                    setTimeout(retryAttempt, options.intervalFunc(attempt));
                } else {
                    callback.apply(null, arguments);
                }
            });
        }

        retryAttempt();
    }

    /**
     * A close relative of [`retry`]{@link module:ControlFlow.retry}.  This method wraps a task and makes it
     * retryable, rather than immediately calling it with retries.
     *
     * @name retryable
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.retry]{@link module:ControlFlow.retry}
     * @category Control Flow
     * @param {Object|number} [opts = {times: 5, interval: 0}| 5] - optional
     * options, exactly the same as from `retry`
     * @param {Function} task - the asynchronous function to wrap
     * @returns {Functions} The wrapped function, which when invoked, will retry on
     * an error, based on the parameters specified in `opts`.
     * @example
     *
     * async.auto({
     *     dep1: async.retryable(3, getFromFlakyService),
     *     process: ["dep1", async.retryable(3, function (results, cb) {
     *         maybeProcessData(results.dep1, cb);
     *     })]
     * }, callback);
     */
    function retryable (opts, task) {
        if (!task) {
            task = opts;
            opts = null;
        }
        return initialParams(function (args, callback) {
            function taskFn(cb) {
                task.apply(null, args.concat([cb]));
            }

            if (opts) retry(opts, taskFn, callback);else retry(taskFn, callback);
        });
    }

    /**
     * Run the functions in the `tasks` collection in series, each one running once
     * the previous function has completed. If any functions in the series pass an
     * error to its callback, no more functions are run, and `callback` is
     * immediately called with the value of the error. Otherwise, `callback`
     * receives an array of results when `tasks` have completed.
     *
     * It is also possible to use an object instead of an array. Each property will
     * be run as a function, and the results will be passed to the final `callback`
     * as an object instead of an array. This can be a more readable way of handling
     *  results from {@link async.series}.
     *
     * **Note** that while many implementations preserve the order of object
     * properties, the [ECMAScript Language Specification](http://www.ecma-international.org/ecma-262/5.1/#sec-8.6)
     * explicitly states that
     *
     * > The mechanics and order of enumerating the properties is not specified.
     *
     * So if you rely on the order in which your series of functions are executed,
     * and want this to work on all platforms, consider using an array.
     *
     * @name series
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Array|Iterable|Object} tasks - A collection containing functions to run, each
     * function is passed a `callback(err, result)` it must call on completion with
     * an error `err` (which can be `null`) and an optional `result` value.
     * @param {Function} [callback] - An optional callback to run once all the
     * functions have completed. This function gets a results array (or object)
     * containing all the result arguments passed to the `task` callbacks. Invoked
     * with (err, result).
     * @example
     * async.series([
     *     function(callback) {
     *         // do some stuff ...
     *         callback(null, 'one');
     *     },
     *     function(callback) {
     *         // do some more stuff ...
     *         callback(null, 'two');
     *     }
     * ],
     * // optional callback
     * function(err, results) {
     *     // results is now equal to ['one', 'two']
     * });
     *
     * async.series({
     *     one: function(callback) {
     *         setTimeout(function() {
     *             callback(null, 1);
     *         }, 200);
     *     },
     *     two: function(callback){
     *         setTimeout(function() {
     *             callback(null, 2);
     *         }, 100);
     *     }
     * }, function(err, results) {
     *     // results is now equal to: {one: 1, two: 2}
     * });
     */
    function series(tasks, callback) {
      _parallel(eachOfSeries, tasks, callback);
    }

    /**
     * Returns `true` if at least one element in the `coll` satisfies an async test.
     * If any iteratee call returns `true`, the main `callback` is immediately
     * called.
     *
     * @name some
     * @static
     * @memberOf module:Collections
     * @method
     * @alias any
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in the array
     * in parallel. The iteratee is passed a `callback(err, truthValue)` which must
     * be called with a boolean argument once it has completed. Invoked with
     * (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the iteratee functions have finished.
     * Result will be either `true` or `false` depending on the values of the async
     * tests. Invoked with (err, result).
     * @example
     *
     * async.some(['file1','file2','file3'], function(filePath, callback) {
     *     fs.access(filePath, function(err) {
     *         callback(null, !err)
     *     });
     * }, function(err, result) {
     *     // if result is true then at least one of the files exists
     * });
     */
    var some = _createTester(eachOf, Boolean, identity);

    /**
     * The same as [`some`]{@link module:Collections.some} but runs a maximum of `limit` async operations at a time.
     *
     * @name someLimit
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.some]{@link module:Collections.some}
     * @alias anyLimit
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - A truth test to apply to each item in the array
     * in parallel. The iteratee is passed a `callback(err, truthValue)` which must
     * be called with a boolean argument once it has completed. Invoked with
     * (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the iteratee functions have finished.
     * Result will be either `true` or `false` depending on the values of the async
     * tests. Invoked with (err, result).
     */
    var someLimit = _createTester(eachOfLimit, Boolean, identity);

    /**
     * The same as [`some`]{@link module:Collections.some} but runs only a single async operation at a time.
     *
     * @name someSeries
     * @static
     * @memberOf module:Collections
     * @method
     * @see [async.some]{@link module:Collections.some}
     * @alias anySeries
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A truth test to apply to each item in the array
     * in parallel. The iteratee is passed a `callback(err, truthValue)` which must
     * be called with a boolean argument once it has completed. Invoked with
     * (item, callback).
     * @param {Function} [callback] - A callback which is called as soon as any
     * iteratee returns `true`, or after all the iteratee functions have finished.
     * Result will be either `true` or `false` depending on the values of the async
     * tests. Invoked with (err, result).
     */
    var someSeries = doLimit(someLimit, 1);

    /**
     * Sorts a list by the results of running each `coll` value through an async
     * `iteratee`.
     *
     * @name sortBy
     * @static
     * @memberOf module:Collections
     * @method
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {Function} iteratee - A function to apply to each item in `coll`.
     * The iteratee is passed a `callback(err, sortValue)` which must be called once
     * it has completed with an error (which can be `null`) and a value to use as
     * the sort criteria. Invoked with (item, callback).
     * @param {Function} callback - A callback which is called after all the
     * `iteratee` functions have finished, or an error occurs. Results is the items
     * from the original `coll` sorted by the values returned by the `iteratee`
     * calls. Invoked with (err, results).
     * @example
     *
     * async.sortBy(['file1','file2','file3'], function(file, callback) {
     *     fs.stat(file, function(err, stats) {
     *         callback(err, stats.mtime);
     *     });
     * }, function(err, results) {
     *     // results is now the original array of files sorted by
     *     // modified date
     * });
     *
     * // By modifying the callback parameter the
     * // sorting order can be influenced:
     *
     * // ascending order
     * async.sortBy([1,9,3,5], function(x, callback) {
     *     callback(null, x);
     * }, function(err,result) {
     *     // result callback
     * });
     *
     * // descending order
     * async.sortBy([1,9,3,5], function(x, callback) {
     *     callback(null, x*-1);    //<- x*-1 instead of x, turns the order around
     * }, function(err,result) {
     *     // result callback
     * });
     */
    function sortBy(coll, iteratee, callback) {
        map(coll, function (x, callback) {
            iteratee(x, function (err, criteria) {
                if (err) return callback(err);
                callback(null, { value: x, criteria: criteria });
            });
        }, function (err, results) {
            if (err) return callback(err);
            callback(null, arrayMap(results.sort(comparator), baseProperty('value')));
        });

        function comparator(left, right) {
            var a = left.criteria,
                b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    }

    /**
     * Sets a time limit on an asynchronous function. If the function does not call
     * its callback within the specified milliseconds, it will be called with a
     * timeout error. The code property for the error object will be `'ETIMEDOUT'`.
     *
     * @name timeout
     * @static
     * @memberOf module:Utils
     * @method
     * @category Util
     * @param {Function} asyncFn - The asynchronous function you want to set the
     * time limit.
     * @param {number} milliseconds - The specified time limit.
     * @param {*} [info] - Any variable you want attached (`string`, `object`, etc)
     * to timeout Error for more information..
     * @returns {Function} Returns a wrapped function that can be used with any of
     * the control flow functions.
     * @example
     *
     * async.timeout(function(callback) {
     *     doAsyncTask(callback);
     * }, 1000);
     */
    function timeout(asyncFn, milliseconds, info) {
        var originalCallback, timer;
        var timedOut = false;

        function injectedCallback() {
            if (!timedOut) {
                originalCallback.apply(null, arguments);
                clearTimeout(timer);
            }
        }

        function timeoutCallback() {
            var name = asyncFn.name || 'anonymous';
            var error = new Error('Callback function "' + name + '" timed out.');
            error.code = 'ETIMEDOUT';
            if (info) {
                error.info = info;
            }
            timedOut = true;
            originalCallback(error);
        }

        return initialParams(function (args, origCallback) {
            originalCallback = origCallback;
            // setup timer and call original function
            timer = setTimeout(timeoutCallback, milliseconds);
            asyncFn.apply(null, args.concat(injectedCallback));
        });
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeCeil = Math.ceil;
    var nativeMax$1 = Math.max;
    /**
     * The base implementation of `_.range` and `_.rangeRight` which doesn't
     * coerce arguments to numbers.
     *
     * @private
     * @param {number} start The start of the range.
     * @param {number} end The end of the range.
     * @param {number} step The value to increment or decrement by.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the range of numbers.
     */
    function baseRange(start, end, step, fromRight) {
      var index = -1,
          length = nativeMax$1(nativeCeil((end - start) / (step || 1)), 0),
          result = Array(length);

      while (length--) {
        result[fromRight ? length : ++index] = start;
        start += step;
      }
      return result;
    }

    /**
     * The same as [times]{@link module:ControlFlow.times} but runs a maximum of `limit` async operations at a
     * time.
     *
     * @name timesLimit
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.times]{@link module:ControlFlow.times}
     * @category Control Flow
     * @param {number} count - The number of times to run the function.
     * @param {number} limit - The maximum number of async operations at a time.
     * @param {Function} iteratee - The function to call `n` times. Invoked with the
     * iteration index and a callback (n, next).
     * @param {Function} callback - see [async.map]{@link module:Collections.map}.
     */
    function timeLimit(count, limit, iteratee, callback) {
      mapLimit(baseRange(0, count, 1), limit, iteratee, callback);
    }

    /**
     * Calls the `iteratee` function `n` times, and accumulates results in the same
     * manner you would use with [map]{@link module:Collections.map}.
     *
     * @name times
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.map]{@link module:Collections.map}
     * @category Control Flow
     * @param {number} n - The number of times to run the function.
     * @param {Function} iteratee - The function to call `n` times. Invoked with the
     * iteration index and a callback (n, next).
     * @param {Function} callback - see {@link module:Collections.map}.
     * @example
     *
     * // Pretend this is some complicated async factory
     * var createUser = function(id, callback) {
     *     callback(null, {
     *         id: 'user' + id
     *     });
     * };
     *
     * // generate 5 users
     * async.times(5, function(n, next) {
     *     createUser(n, function(err, user) {
     *         next(err, user);
     *     });
     * }, function(err, users) {
     *     // we should now have 5 users
     * });
     */
    var times = doLimit(timeLimit, Infinity);

    /**
     * The same as [times]{@link module:ControlFlow.times} but runs only a single async operation at a time.
     *
     * @name timesSeries
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.times]{@link module:ControlFlow.times}
     * @category Control Flow
     * @param {number} n - The number of times to run the function.
     * @param {Function} iteratee - The function to call `n` times. Invoked with the
     * iteration index and a callback (n, next).
     * @param {Function} callback - see {@link module:Collections.map}.
     */
    var timesSeries = doLimit(timeLimit, 1);

    /**
     * A relative of `reduce`.  Takes an Object or Array, and iterates over each
     * element in series, each step potentially mutating an `accumulator` value.
     * The type of the accumulator defaults to the type of collection passed in.
     *
     * @name transform
     * @static
     * @memberOf module:Collections
     * @method
     * @category Collection
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
     * @param {*} [accumulator] - The initial state of the transform.  If omitted,
     * it will default to an empty Object or Array, depending on the type of `coll`
     * @param {Function} iteratee - A function applied to each item in the
     * collection that potentially modifies the accumulator. The `iteratee` is
     * passed a `callback(err)` which accepts an optional error as its first
     * argument. If an error is passed to the callback, the transform is stopped
     * and the main `callback` is immediately called with the error.
     * Invoked with (accumulator, item, key, callback).
     * @param {Function} [callback] - A callback which is called after all the
     * `iteratee` functions have finished. Result is the transformed accumulator.
     * Invoked with (err, result).
     * @example
     *
     * async.transform([1,2,3], function(acc, item, index, callback) {
     *     // pointless async:
     *     process.nextTick(function() {
     *         acc.push(item * 2)
     *         callback(null)
     *     });
     * }, function(err, result) {
     *     // result is now equal to [2, 4, 6]
     * });
     *
     * @example
     *
     * async.transform({a: 1, b: 2, c: 3}, function (obj, val, key, callback) {
     *     setImmediate(function () {
     *         obj[key] = val * 2;
     *         callback();
     *     })
     * }, function (err, result) {
     *     // result is equal to {a: 2, b: 4, c: 6}
     * })
     */
    function transform(coll, accumulator, iteratee, callback) {
        if (arguments.length === 3) {
            callback = iteratee;
            iteratee = accumulator;
            accumulator = isArray(coll) ? [] : {};
        }
        callback = once(callback || noop);

        eachOf(coll, function (v, k, cb) {
            iteratee(accumulator, v, k, cb);
        }, function (err) {
            callback(err, accumulator);
        });
    }

    /**
     * Undoes a [memoize]{@link module:Utils.memoize}d function, reverting it to the original,
     * unmemoized form. Handy for testing.
     *
     * @name unmemoize
     * @static
     * @memberOf module:Utils
     * @method
     * @see [async.memoize]{@link module:Utils.memoize}
     * @category Util
     * @param {Function} fn - the memoized function
     * @returns {Function} a function that calls the original unmemoized function
     */
    function unmemoize(fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    }

    /**
     * Repeatedly call `fn`, while `test` returns `true`. Calls `callback` when
     * stopped, or an error occurs.
     *
     * @name whilst
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Function} test - synchronous truth test to perform before each
     * execution of `fn`. Invoked with ().
     * @param {Function} iteratee - A function which is called each time `test` passes.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} [callback] - A callback which is called after the test
     * function has failed and repeated execution of `fn` has stopped. `callback`
     * will be passed an error and any arguments passed to the final `fn`'s
     * callback. Invoked with (err, [results]);
     * @returns undefined
     * @example
     *
     * var count = 0;
     * async.whilst(
     *     function() { return count < 5; },
     *     function(callback) {
     *         count++;
     *         setTimeout(function() {
     *             callback(null, count);
     *         }, 1000);
     *     },
     *     function (err, n) {
     *         // 5 seconds have passed, n = 5
     *     }
     * );
     */
    function whilst(test, iteratee, callback) {
        callback = onlyOnce(callback || noop);
        if (!test()) return callback(null);
        var next = rest(function (err, args) {
            if (err) return callback(err);
            if (test()) return iteratee(next);
            callback.apply(null, [null].concat(args));
        });
        iteratee(next);
    }

    /**
     * Repeatedly call `fn` until `test` returns `true`. Calls `callback` when
     * stopped, or an error occurs. `callback` will be passed an error and any
     * arguments passed to the final `fn`'s callback.
     *
     * The inverse of [whilst]{@link module:ControlFlow.whilst}.
     *
     * @name until
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @see [async.whilst]{@link module:ControlFlow.whilst}
     * @category Control Flow
     * @param {Function} test - synchronous truth test to perform before each
     * execution of `fn`. Invoked with ().
     * @param {Function} fn - A function which is called each time `test` fails.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} [callback] - A callback which is called after the test
     * function has passed and repeated execution of `fn` has stopped. `callback`
     * will be passed an error and any arguments passed to the final `fn`'s
     * callback. Invoked with (err, [results]);
     */
    function until(test, fn, callback) {
        whilst(function () {
            return !test.apply(this, arguments);
        }, fn, callback);
    }

    /**
     * Runs the `tasks` array of functions in series, each passing their results to
     * the next in the array. However, if any of the `tasks` pass an error to their
     * own callback, the next function is not executed, and the main `callback` is
     * immediately called with the error.
     *
     * @name waterfall
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Array} tasks - An array of functions to run, each function is passed
     * a `callback(err, result1, result2, ...)` it must call on completion. The
     * first argument is an error (which can be `null`) and any further arguments
     * will be passed as arguments in order to the next task.
     * @param {Function} [callback] - An optional callback to run once all the
     * functions have completed. This will be passed the results of the last task's
     * callback. Invoked with (err, [results]).
     * @returns undefined
     * @example
     *
     * async.waterfall([
     *     function(callback) {
     *         callback(null, 'one', 'two');
     *     },
     *     function(arg1, arg2, callback) {
     *         // arg1 now equals 'one' and arg2 now equals 'two'
     *         callback(null, 'three');
     *     },
     *     function(arg1, callback) {
     *         // arg1 now equals 'three'
     *         callback(null, 'done');
     *     }
     * ], function (err, result) {
     *     // result now equals 'done'
     * });
     *
     * // Or, with named functions:
     * async.waterfall([
     *     myFirstFunction,
     *     mySecondFunction,
     *     myLastFunction,
     * ], function (err, result) {
     *     // result now equals 'done'
     * });
     * function myFirstFunction(callback) {
     *     callback(null, 'one', 'two');
     * }
     * function mySecondFunction(arg1, arg2, callback) {
     *     // arg1 now equals 'one' and arg2 now equals 'two'
     *     callback(null, 'three');
     * }
     * function myLastFunction(arg1, callback) {
     *     // arg1 now equals 'three'
     *     callback(null, 'done');
     * }
     */
    function waterfall (tasks, callback) {
        callback = once(callback || noop);
        if (!isArray(tasks)) return callback(new Error('First argument to waterfall must be an array of functions'));
        if (!tasks.length) return callback();
        var taskIndex = 0;

        function nextTask(args) {
            if (taskIndex === tasks.length) {
                return callback.apply(null, [null].concat(args));
            }

            var taskCallback = onlyOnce(rest(function (err, args) {
                if (err) {
                    return callback.apply(null, [err].concat(args));
                }
                nextTask(args);
            }));

            args.push(taskCallback);

            var task = tasks[taskIndex++];
            task.apply(null, args);
        }

        nextTask([]);
    }

    var index = {
      applyEach: applyEach,
      applyEachSeries: applyEachSeries,
      apply: apply$1,
      asyncify: asyncify,
      auto: auto,
      autoInject: autoInject,
      cargo: cargo,
      compose: compose,
      concat: concat,
      concatSeries: concatSeries,
      constant: constant,
      detect: detect,
      detectLimit: detectLimit,
      detectSeries: detectSeries,
      dir: dir,
      doDuring: doDuring,
      doUntil: doUntil,
      doWhilst: doWhilst,
      during: during,
      each: eachLimit,
      eachLimit: eachLimit$1,
      eachOf: eachOf,
      eachOfLimit: eachOfLimit,
      eachOfSeries: eachOfSeries,
      eachSeries: eachSeries,
      ensureAsync: ensureAsync,
      every: every,
      everyLimit: everyLimit,
      everySeries: everySeries,
      filter: filter,
      filterLimit: filterLimit,
      filterSeries: filterSeries,
      forever: forever,
      log: log,
      map: map,
      mapLimit: mapLimit,
      mapSeries: mapSeries,
      mapValues: mapValues,
      mapValuesLimit: mapValuesLimit,
      mapValuesSeries: mapValuesSeries,
      memoize: memoize,
      nextTick: nextTick,
      parallel: parallelLimit,
      parallelLimit: parallelLimit$1,
      priorityQueue: priorityQueue,
      queue: queue$1,
      race: race,
      reduce: reduce,
      reduceRight: reduceRight,
      reflect: reflect,
      reflectAll: reflectAll,
      reject: reject,
      rejectLimit: rejectLimit,
      rejectSeries: rejectSeries,
      retry: retry,
      retryable: retryable,
      seq: seq,
      series: series,
      setImmediate: setImmediate$1,
      some: some,
      someLimit: someLimit,
      someSeries: someSeries,
      sortBy: sortBy,
      timeout: timeout,
      times: times,
      timesLimit: timeLimit,
      timesSeries: timesSeries,
      transform: transform,
      unmemoize: unmemoize,
      until: until,
      waterfall: waterfall,
      whilst: whilst,

      // aliases
      all: every,
      any: some,
      forEach: eachLimit,
      forEachSeries: eachSeries,
      forEachLimit: eachLimit$1,
      forEachOf: eachOf,
      forEachOfSeries: eachOfSeries,
      forEachOfLimit: eachOfLimit,
      inject: reduce,
      foldl: reduce,
      foldr: reduceRight,
      select: filter,
      selectLimit: filterLimit,
      selectSeries: filterSeries,
      wrapSync: asyncify
    };

    exports['default'] = index;
    exports.applyEach = applyEach;
    exports.applyEachSeries = applyEachSeries;
    exports.apply = apply$1;
    exports.asyncify = asyncify;
    exports.auto = auto;
    exports.autoInject = autoInject;
    exports.cargo = cargo;
    exports.compose = compose;
    exports.concat = concat;
    exports.concatSeries = concatSeries;
    exports.constant = constant;
    exports.detect = detect;
    exports.detectLimit = detectLimit;
    exports.detectSeries = detectSeries;
    exports.dir = dir;
    exports.doDuring = doDuring;
    exports.doUntil = doUntil;
    exports.doWhilst = doWhilst;
    exports.during = during;
    exports.each = eachLimit;
    exports.eachLimit = eachLimit$1;
    exports.eachOf = eachOf;
    exports.eachOfLimit = eachOfLimit;
    exports.eachOfSeries = eachOfSeries;
    exports.eachSeries = eachSeries;
    exports.ensureAsync = ensureAsync;
    exports.every = every;
    exports.everyLimit = everyLimit;
    exports.everySeries = everySeries;
    exports.filter = filter;
    exports.filterLimit = filterLimit;
    exports.filterSeries = filterSeries;
    exports.forever = forever;
    exports.log = log;
    exports.map = map;
    exports.mapLimit = mapLimit;
    exports.mapSeries = mapSeries;
    exports.mapValues = mapValues;
    exports.mapValuesLimit = mapValuesLimit;
    exports.mapValuesSeries = mapValuesSeries;
    exports.memoize = memoize;
    exports.nextTick = nextTick;
    exports.parallel = parallelLimit;
    exports.parallelLimit = parallelLimit$1;
    exports.priorityQueue = priorityQueue;
    exports.queue = queue$1;
    exports.race = race;
    exports.reduce = reduce;
    exports.reduceRight = reduceRight;
    exports.reflect = reflect;
    exports.reflectAll = reflectAll;
    exports.reject = reject;
    exports.rejectLimit = rejectLimit;
    exports.rejectSeries = rejectSeries;
    exports.retry = retry;
    exports.retryable = retryable;
    exports.seq = seq;
    exports.series = series;
    exports.setImmediate = setImmediate$1;
    exports.some = some;
    exports.someLimit = someLimit;
    exports.someSeries = someSeries;
    exports.sortBy = sortBy;
    exports.timeout = timeout;
    exports.times = times;
    exports.timesLimit = timeLimit;
    exports.timesSeries = timesSeries;
    exports.transform = transform;
    exports.unmemoize = unmemoize;
    exports.until = until;
    exports.waterfall = waterfall;
    exports.whilst = whilst;
    exports.all = every;
    exports.allLimit = everyLimit;
    exports.allSeries = everySeries;
    exports.any = some;
    exports.anyLimit = someLimit;
    exports.anySeries = someSeries;
    exports.find = detect;
    exports.findLimit = detectLimit;
    exports.findSeries = detectSeries;
    exports.forEach = eachLimit;
    exports.forEachSeries = eachSeries;
    exports.forEachLimit = eachLimit$1;
    exports.forEachOf = eachOf;
    exports.forEachOfSeries = eachOfSeries;
    exports.forEachOfLimit = eachOfLimit;
    exports.inject = reduce;
    exports.foldl = reduce;
    exports.foldr = reduceRight;
    exports.select = filter;
    exports.selectLimit = filterLimit;
    exports.selectSeries = filterSeries;
    exports.wrapSync = asyncify;

}));
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":62}],3:[function(require,module,exports){
/**
 * Module dependencies.
 */

var type;
try {
  type = require('component-type');
} catch (_) {
  type = require('type');
}

/**
 * Module exports.
 */

module.exports = clone;

/**
 * Clones objects.
 *
 * @param {Mixed} any object
 * @api public
 */

function clone(obj){
  switch (type(obj)) {
    case 'object':
      var copy = {};
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          copy[key] = clone(obj[key]);
        }
      }
      return copy;

    case 'array':
      var copy = new Array(obj.length);
      for (var i = 0, l = obj.length; i < l; i++) {
        copy[i] = clone(obj[i]);
      }
      return copy;

    case 'regexp':
      // from millermedeiros/amd-utils - MIT
      var flags = '';
      flags += obj.multiline ? 'm' : '';
      flags += obj.global ? 'g' : '';
      flags += obj.ignoreCase ? 'i' : '';
      return new RegExp(obj.source, flags);

    case 'date':
      return new Date(obj.getTime());

    default: // string, number, boolean, …
      return obj;
  }
}

},{"component-type":5,"type":5}],4:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],5:[function(require,module,exports){
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  if (isBuffer(val)) return 'buffer';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val);

  return typeof val;
};

// code borrowed from https://github.com/feross/is-buffer/blob/master/index.js
function isBuffer(obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],6:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],7:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./_is-object":27}],8:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject')
  , toLength  = require('./_to-length')
  , toIndex   = require('./_to-index');
module.exports = function(IS_INCLUDES){
  return function($this, el, fromIndex){
    var O      = toIObject($this)
      , length = toLength(O.length)
      , index  = toIndex(fromIndex, length)
      , value;
    // Array#includes uses SameValueZero equality algorithm
    if(IS_INCLUDES && el != el)while(length > index){
      value = O[index++];
      if(value != value)return true;
    // Array#toIndex ignores holes, Array#includes - not
    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
      if(O[index] === el)return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};
},{"./_to-index":43,"./_to-iobject":45,"./_to-length":46}],9:[function(require,module,exports){
'use strict';
var aFunction  = require('./_a-function')
  , isObject   = require('./_is-object')
  , invoke     = require('./_invoke')
  , arraySlice = [].slice
  , factories  = {};

var construct = function(F, len, args){
  if(!(len in factories)){
    for(var n = [], i = 0; i < len; i++)n[i] = 'a[' + i + ']';
    factories[len] = Function('F,a', 'return new F(' + n.join(',') + ')');
  } return factories[len](F, args);
};

module.exports = Function.bind || function bind(that /*, args... */){
  var fn       = aFunction(this)
    , partArgs = arraySlice.call(arguments, 1);
  var bound = function(/* args... */){
    var args = partArgs.concat(arraySlice.call(arguments));
    return this instanceof bound ? construct(fn, args.length, args) : invoke(fn, args, that);
  };
  if(isObject(fn.prototype))bound.prototype = fn.prototype;
  return bound;
};
},{"./_a-function":6,"./_invoke":24,"./_is-object":27}],10:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],11:[function(require,module,exports){
var core = module.exports = {version: '2.4.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],12:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./_a-function":6}],13:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],14:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_fails":18}],15:[function(require,module,exports){
var isObject = require('./_is-object')
  , document = require('./_global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./_global":19,"./_is-object":27}],16:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');
},{}],17:[function(require,module,exports){
var global    = require('./_global')
  , core      = require('./_core')
  , hide      = require('./_hide')
  , redefine  = require('./_redefine')
  , ctx       = require('./_ctx')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE]
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE] || (exports[PROTOTYPE] = {})
    , key, own, out, exp;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if(target)redefine(target, key, out, type & $export.U);
    // export
    if(exports[key] != out)hide(exports, key, exp);
    if(IS_PROTO && expProto[key] != out)expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library` 
module.exports = $export;
},{"./_core":11,"./_ctx":12,"./_global":19,"./_hide":21,"./_redefine":37}],18:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],19:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],20:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],21:[function(require,module,exports){
var dP         = require('./_object-dp')
  , createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./_descriptors":14,"./_object-dp":30,"./_property-desc":36}],22:[function(require,module,exports){
module.exports = require('./_global').document && document.documentElement;
},{"./_global":19}],23:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function(){
  return Object.defineProperty(require('./_dom-create')('div'), 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_descriptors":14,"./_dom-create":15,"./_fails":18}],24:[function(require,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function(fn, args, that){
  var un = that === undefined;
  switch(args.length){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return              fn.apply(that, args);
};
},{}],25:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./_cof":10}],26:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg){
  return cof(arg) == 'Array';
};
},{"./_cof":10}],27:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],28:[function(require,module,exports){
'use strict';
// 19.1.2.1 Object.assign(target, source, ...)
var getKeys  = require('./_object-keys')
  , gOPS     = require('./_object-gops')
  , pIE      = require('./_object-pie')
  , toObject = require('./_to-object')
  , IObject  = require('./_iobject')
  , $assign  = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || require('./_fails')(function(){
  var A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
  var T     = toObject(target)
    , aLen  = arguments.length
    , index = 1
    , getSymbols = gOPS.f
    , isEnum     = pIE.f;
  while(aLen > index){
    var S      = IObject(arguments[index++])
      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
  } return T;
} : $assign;
},{"./_fails":18,"./_iobject":25,"./_object-gops":32,"./_object-keys":34,"./_object-pie":35,"./_to-object":47}],29:[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject    = require('./_an-object')
  , dPs         = require('./_object-dps')
  , enumBugKeys = require('./_enum-bug-keys')
  , IE_PROTO    = require('./_shared-key')('IE_PROTO')
  , Empty       = function(){ /* empty */ }
  , PROTOTYPE   = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function(){
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe')
    , i      = enumBugKeys.length
    , lt     = '<'
    , gt     = '>'
    , iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while(i--)delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties){
  var result;
  if(O !== null){
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty;
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"./_an-object":7,"./_dom-create":15,"./_enum-bug-keys":16,"./_html":22,"./_object-dps":31,"./_shared-key":38}],30:[function(require,module,exports){
var anObject       = require('./_an-object')
  , IE8_DOM_DEFINE = require('./_ie8-dom-define')
  , toPrimitive    = require('./_to-primitive')
  , dP             = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes){
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if(IE8_DOM_DEFINE)try {
    return dP(O, P, Attributes);
  } catch(e){ /* empty */ }
  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
  if('value' in Attributes)O[P] = Attributes.value;
  return O;
};
},{"./_an-object":7,"./_descriptors":14,"./_ie8-dom-define":23,"./_to-primitive":48}],31:[function(require,module,exports){
var dP       = require('./_object-dp')
  , anObject = require('./_an-object')
  , getKeys  = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties){
  anObject(O);
  var keys   = getKeys(Properties)
    , length = keys.length
    , i = 0
    , P;
  while(length > i)dP.f(O, P = keys[i++], Properties[P]);
  return O;
};
},{"./_an-object":7,"./_descriptors":14,"./_object-dp":30,"./_object-keys":34}],32:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;
},{}],33:[function(require,module,exports){
var has          = require('./_has')
  , toIObject    = require('./_to-iobject')
  , arrayIndexOf = require('./_array-includes')(false)
  , IE_PROTO     = require('./_shared-key')('IE_PROTO');

module.exports = function(object, names){
  var O      = toIObject(object)
    , i      = 0
    , result = []
    , key;
  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while(names.length > i)if(has(O, key = names[i++])){
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};
},{"./_array-includes":8,"./_has":20,"./_shared-key":38,"./_to-iobject":45}],34:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys       = require('./_object-keys-internal')
  , enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O){
  return $keys(O, enumBugKeys);
};
},{"./_enum-bug-keys":16,"./_object-keys-internal":33}],35:[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;
},{}],36:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],37:[function(require,module,exports){
var global    = require('./_global')
  , hide      = require('./_hide')
  , has       = require('./_has')
  , SRC       = require('./_uid')('src')
  , TO_STRING = 'toString'
  , $toString = Function[TO_STRING]
  , TPL       = ('' + $toString).split(TO_STRING);

require('./_core').inspectSource = function(it){
  return $toString.call(it);
};

(module.exports = function(O, key, val, safe){
  var isFunction = typeof val == 'function';
  if(isFunction)has(val, 'name') || hide(val, 'name', key);
  if(O[key] === val)return;
  if(isFunction)has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if(O === global){
    O[key] = val;
  } else {
    if(!safe){
      delete O[key];
      hide(O, key, val);
    } else {
      if(O[key])O[key] = val;
      else hide(O, key, val);
    }
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString(){
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});
},{"./_core":11,"./_global":19,"./_has":20,"./_hide":21,"./_uid":49}],38:[function(require,module,exports){
var shared = require('./_shared')('keys')
  , uid    = require('./_uid');
module.exports = function(key){
  return shared[key] || (shared[key] = uid(key));
};
},{"./_shared":39,"./_uid":49}],39:[function(require,module,exports){
var global = require('./_global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./_global":19}],40:[function(require,module,exports){
var fails = require('./_fails');

module.exports = function(method, arg){
  return !!method && fails(function(){
    arg ? method.call(null, function(){}, 1) : method.call(null);
  });
};
},{"./_fails":18}],41:[function(require,module,exports){
var $export = require('./_export')
  , defined = require('./_defined')
  , fails   = require('./_fails')
  , spaces  = require('./_string-ws')
  , space   = '[' + spaces + ']'
  , non     = '\u200b\u0085'
  , ltrim   = RegExp('^' + space + space + '*')
  , rtrim   = RegExp(space + space + '*$');

var exporter = function(KEY, exec, ALIAS){
  var exp   = {};
  var FORCE = fails(function(){
    return !!spaces[KEY]() || non[KEY]() != non;
  });
  var fn = exp[KEY] = FORCE ? exec(trim) : spaces[KEY];
  if(ALIAS)exp[ALIAS] = fn;
  $export($export.P + $export.F * FORCE, 'String', exp);
};

// 1 -> String#trimLeft
// 2 -> String#trimRight
// 3 -> String#trim
var trim = exporter.trim = function(string, TYPE){
  string = String(defined(string));
  if(TYPE & 1)string = string.replace(ltrim, '');
  if(TYPE & 2)string = string.replace(rtrim, '');
  return string;
};

module.exports = exporter;
},{"./_defined":13,"./_export":17,"./_fails":18,"./_string-ws":42}],42:[function(require,module,exports){
module.exports = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';
},{}],43:[function(require,module,exports){
var toInteger = require('./_to-integer')
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};
},{"./_to-integer":44}],44:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],45:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject')
  , defined = require('./_defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./_defined":13,"./_iobject":25}],46:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./_to-integer":44}],47:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./_defined":13}],48:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function(it, S){
  if(!isObject(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};
},{"./_is-object":27}],49:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],50:[function(require,module,exports){
'use strict';
var $export       = require('./_export')
  , $indexOf      = require('./_array-includes')(false)
  , $native       = [].indexOf
  , NEGATIVE_ZERO = !!$native && 1 / [1].indexOf(1, -0) < 0;

$export($export.P + $export.F * (NEGATIVE_ZERO || !require('./_strict-method')($native)), 'Array', {
  // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
  indexOf: function indexOf(searchElement /*, fromIndex = 0 */){
    return NEGATIVE_ZERO
      // convert -0 to +0
      ? $native.apply(this, arguments) || 0
      : $indexOf(this, searchElement, arguments[1]);
  }
});
},{"./_array-includes":8,"./_export":17,"./_strict-method":40}],51:[function(require,module,exports){
// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
var $export = require('./_export');

$export($export.S, 'Array', {isArray: require('./_is-array')});
},{"./_export":17,"./_is-array":26}],52:[function(require,module,exports){
// 19.2.3.2 / 15.3.4.5 Function.prototype.bind(thisArg, args...)
var $export = require('./_export');

$export($export.P, 'Function', {bind: require('./_bind')});
},{"./_bind":9,"./_export":17}],53:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./_export');

$export($export.S + $export.F, 'Object', {assign: require('./_object-assign')});
},{"./_export":17,"./_object-assign":28}],54:[function(require,module,exports){
var $export = require('./_export')
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export($export.S, 'Object', {create: require('./_object-create')});
},{"./_export":17,"./_object-create":29}],55:[function(require,module,exports){
'use strict';
// 21.1.3.25 String.prototype.trim()
require('./_string-trim')('trim', function($trim){
  return function trim(){
    return $trim(this, 3);
  };
});
},{"./_string-trim":41}],56:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":57}],57:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":61}],58:[function(require,module,exports){
(function (global){
((typeof define === "function" && define.amd && function (m) {
    define("formatio", ["samsam"], m);
}) || (typeof module === "object" && function (m) {
    module.exports = m(require("samsam"));
}) || function (m) { this.formatio = m(this.samsam); }
)(function (samsam) {
    "use strict";

    var formatio = {
        excludeConstructors: ["Object", /^.$/],
        quoteStrings: true,
        limitChildrenCount: 0
    };

    var hasOwn = Object.prototype.hasOwnProperty;

    var specialObjects = [];
    if (typeof global !== "undefined") {
        specialObjects.push({ object: global, value: "[object global]" });
    }
    if (typeof document !== "undefined") {
        specialObjects.push({
            object: document,
            value: "[object HTMLDocument]"
        });
    }
    if (typeof window !== "undefined") {
        specialObjects.push({ object: window, value: "[object Window]" });
    }

    function functionName(func) {
        if (!func) { return ""; }
        if (func.displayName) { return func.displayName; }
        if (func.name) { return func.name; }
        var matches = func.toString().match(/function\s+([^\(]+)/m);
        return (matches && matches[1]) || "";
    }

    function constructorName(f, object) {
        var name = functionName(object && object.constructor);
        var excludes = f.excludeConstructors ||
                formatio.excludeConstructors || [];

        var i, l;
        for (i = 0, l = excludes.length; i < l; ++i) {
            if (typeof excludes[i] === "string" && excludes[i] === name) {
                return "";
            } else if (excludes[i].test && excludes[i].test(name)) {
                return "";
            }
        }

        return name;
    }

    function isCircular(object, objects) {
        if (typeof object !== "object") { return false; }
        var i, l;
        for (i = 0, l = objects.length; i < l; ++i) {
            if (objects[i] === object) { return true; }
        }
        return false;
    }

    function ascii(f, object, processed, indent) {
        if (typeof object === "string") {
            var qs = f.quoteStrings;
            var quote = typeof qs !== "boolean" || qs;
            return processed || quote ? '"' + object + '"' : object;
        }

        if (typeof object === "function" && !(object instanceof RegExp)) {
            return ascii.func(object);
        }

        processed = processed || [];

        if (isCircular(object, processed)) { return "[Circular]"; }

        if (Object.prototype.toString.call(object) === "[object Array]") {
            return ascii.array.call(f, object, processed);
        }

        if (!object) { return String((1/object) === -Infinity ? "-0" : object); }
        if (samsam.isElement(object)) { return ascii.element(object); }

        if (typeof object.toString === "function" &&
                object.toString !== Object.prototype.toString) {
            return object.toString();
        }

        var i, l;
        for (i = 0, l = specialObjects.length; i < l; i++) {
            if (object === specialObjects[i].object) {
                return specialObjects[i].value;
            }
        }

        return ascii.object.call(f, object, processed, indent);
    }

    ascii.func = function (func) {
        return "function " + functionName(func) + "() {}";
    };

    ascii.array = function (array, processed) {
        processed = processed || [];
        processed.push(array);
        var pieces = [];
        var i, l;
        l = (this.limitChildrenCount > 0) ? 
            Math.min(this.limitChildrenCount, array.length) : array.length;

        for (i = 0; i < l; ++i) {
            pieces.push(ascii(this, array[i], processed));
        }

        if(l < array.length)
            pieces.push("[... " + (array.length - l) + " more elements]");

        return "[" + pieces.join(", ") + "]";
    };

    ascii.object = function (object, processed, indent) {
        processed = processed || [];
        processed.push(object);
        indent = indent || 0;
        var pieces = [], properties = samsam.keys(object).sort();
        var length = 3;
        var prop, str, obj, i, k, l;
        l = (this.limitChildrenCount > 0) ? 
            Math.min(this.limitChildrenCount, properties.length) : properties.length;

        for (i = 0; i < l; ++i) {
            prop = properties[i];
            obj = object[prop];

            if (isCircular(obj, processed)) {
                str = "[Circular]";
            } else {
                str = ascii(this, obj, processed, indent + 2);
            }

            str = (/\s/.test(prop) ? '"' + prop + '"' : prop) + ": " + str;
            length += str.length;
            pieces.push(str);
        }

        var cons = constructorName(this, object);
        var prefix = cons ? "[" + cons + "] " : "";
        var is = "";
        for (i = 0, k = indent; i < k; ++i) { is += " "; }

        if(l < properties.length)
            pieces.push("[... " + (properties.length - l) + " more elements]");

        if (length + indent > 80) {
            return prefix + "{\n  " + is + pieces.join(",\n  " + is) + "\n" +
                is + "}";
        }
        return prefix + "{ " + pieces.join(", ") + " }";
    };

    ascii.element = function (element) {
        var tagName = element.tagName.toLowerCase();
        var attrs = element.attributes, attr, pairs = [], attrName, i, l, val;

        for (i = 0, l = attrs.length; i < l; ++i) {
            attr = attrs.item(i);
            attrName = attr.nodeName.toLowerCase().replace("html:", "");
            val = attr.nodeValue;
            if (attrName !== "contenteditable" || val !== "inherit") {
                if (!!val) { pairs.push(attrName + "=\"" + val + "\""); }
            }
        }

        var formatted = "<" + tagName + (pairs.length > 0 ? " " : "");
        var content = element.innerHTML;

        if (content.length > 20) {
            content = content.substr(0, 20) + "[...]";
        }

        var res = formatted + pairs.join(" ") + ">" + content +
                "</" + tagName + ">";

        return res.replace(/ contentEditable="inherit"/, "");
    };

    function Formatio(options) {
        for (var opt in options) {
            this[opt] = options[opt];
        }
    }

    Formatio.prototype = {
        functionName: functionName,

        configure: function (options) {
            return new Formatio(options);
        },

        constructorName: function (object) {
            return constructorName(this, object);
        },

        ascii: function (object, processed, indent) {
            return ascii(this, object, processed, indent);
        }
    };

    return Formatio.prototype;
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"samsam":63}],59:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],60:[function(require,module,exports){
(function (global){
/*global global, window*/
/**
 * @author Christian Johansen (christian@cjohansen.no) and contributors
 * @license BSD
 *
 * Copyright (c) 2010-2014 Christian Johansen
 */

(function (global) {
    "use strict";

    // Make properties writable in IE, as per
    // http://www.adequatelygood.com/Replacing-setTimeout-Globally.html
    // JSLint being anal
    var glbl = global;

    global.setTimeout = glbl.setTimeout;
    global.clearTimeout = glbl.clearTimeout;
    global.setInterval = glbl.setInterval;
    global.clearInterval = glbl.clearInterval;
    global.Date = glbl.Date;

    // setImmediate is not a standard function
    // avoid adding the prop to the window object if not present
    if('setImmediate' in global) {
        global.setImmediate = glbl.setImmediate;
        global.clearImmediate = glbl.clearImmediate;
    }

    // node expects setTimeout/setInterval to return a fn object w/ .ref()/.unref()
    // browsers, a number.
    // see https://github.com/cjohansen/Sinon.JS/pull/436

    var NOOP = function () { return undefined; };
    var timeoutResult = setTimeout(NOOP, 0);
    var addTimerReturnsObject = typeof timeoutResult === "object";
    clearTimeout(timeoutResult);

    var NativeDate = Date;
    var uniqueTimerId = 1;

    /**
     * Parse strings like "01:10:00" (meaning 1 hour, 10 minutes, 0 seconds) into
     * number of milliseconds. This is used to support human-readable strings passed
     * to clock.tick()
     */
    function parseTime(str) {
        if (!str) {
            return 0;
        }

        var strings = str.split(":");
        var l = strings.length, i = l;
        var ms = 0, parsed;

        if (l > 3 || !/^(\d\d:){0,2}\d\d?$/.test(str)) {
            throw new Error("tick only understands numbers and 'h:m:s'");
        }

        while (i--) {
            parsed = parseInt(strings[i], 10);

            if (parsed >= 60) {
                throw new Error("Invalid time " + str);
            }

            ms += parsed * Math.pow(60, (l - i - 1));
        }

        return ms * 1000;
    }

    /**
     * Used to grok the `now` parameter to createClock.
     */
    function getEpoch(epoch) {
        if (!epoch) { return 0; }
        if (typeof epoch.getTime === "function") { return epoch.getTime(); }
        if (typeof epoch === "number") { return epoch; }
        throw new TypeError("now should be milliseconds since UNIX epoch");
    }

    function inRange(from, to, timer) {
        return timer && timer.callAt >= from && timer.callAt <= to;
    }

    function mirrorDateProperties(target, source) {
        var prop;
        for (prop in source) {
            if (source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }

        // set special now implementation
        if (source.now) {
            target.now = function now() {
                return target.clock.now;
            };
        } else {
            delete target.now;
        }

        // set special toSource implementation
        if (source.toSource) {
            target.toSource = function toSource() {
                return source.toSource();
            };
        } else {
            delete target.toSource;
        }

        // set special toString implementation
        target.toString = function toString() {
            return source.toString();
        };

        target.prototype = source.prototype;
        target.parse = source.parse;
        target.UTC = source.UTC;
        target.prototype.toUTCString = source.prototype.toUTCString;

        return target;
    }

    function createDate() {
        function ClockDate(year, month, date, hour, minute, second, ms) {
            // Defensive and verbose to avoid potential harm in passing
            // explicit undefined when user does not pass argument
            switch (arguments.length) {
            case 0:
                return new NativeDate(ClockDate.clock.now);
            case 1:
                return new NativeDate(year);
            case 2:
                return new NativeDate(year, month);
            case 3:
                return new NativeDate(year, month, date);
            case 4:
                return new NativeDate(year, month, date, hour);
            case 5:
                return new NativeDate(year, month, date, hour, minute);
            case 6:
                return new NativeDate(year, month, date, hour, minute, second);
            default:
                return new NativeDate(year, month, date, hour, minute, second, ms);
            }
        }

        return mirrorDateProperties(ClockDate, NativeDate);
    }

    function addTimer(clock, timer) {
        if (timer.func === undefined) {
            throw new Error("Callback must be provided to timer calls");
        }

        if (!clock.timers) {
            clock.timers = {};
        }

        timer.id = uniqueTimerId++;
        timer.createdAt = clock.now;
        timer.callAt = clock.now + (timer.delay || (clock.duringTick ? 1 : 0));

        clock.timers[timer.id] = timer;

        if (addTimerReturnsObject) {
            return {
                id: timer.id,
                ref: NOOP,
                unref: NOOP
            };
        }

        return timer.id;
    }


    function compareTimers(a, b) {
        // Sort first by absolute timing
        if (a.callAt < b.callAt) {
            return -1;
        }
        if (a.callAt > b.callAt) {
            return 1;
        }

        // Sort next by immediate, immediate timers take precedence
        if (a.immediate && !b.immediate) {
            return -1;
        }
        if (!a.immediate && b.immediate) {
            return 1;
        }

        // Sort next by creation time, earlier-created timers take precedence
        if (a.createdAt < b.createdAt) {
            return -1;
        }
        if (a.createdAt > b.createdAt) {
            return 1;
        }

        // Sort next by id, lower-id timers take precedence
        if (a.id < b.id) {
            return -1;
        }
        if (a.id > b.id) {
            return 1;
        }

        // As timer ids are unique, no fallback `0` is necessary
    }

    function firstTimerInRange(clock, from, to) {
        var timers = clock.timers,
            timer = null,
            id,
            isInRange;

        for (id in timers) {
            if (timers.hasOwnProperty(id)) {
                isInRange = inRange(from, to, timers[id]);

                if (isInRange && (!timer || compareTimers(timer, timers[id]) === 1)) {
                    timer = timers[id];
                }
            }
        }

        return timer;
    }

    function callTimer(clock, timer) {
        var exception;

        if (typeof timer.interval === "number") {
            clock.timers[timer.id].callAt += timer.interval;
        } else {
            delete clock.timers[timer.id];
        }

        try {
            if (typeof timer.func === "function") {
                timer.func.apply(null, timer.args);
            } else {
                eval(timer.func);
            }
        } catch (e) {
            exception = e;
        }

        if (!clock.timers[timer.id]) {
            if (exception) {
                throw exception;
            }
            return;
        }

        if (exception) {
            throw exception;
        }
    }

    function timerType(timer) {
        if (timer.immediate) {
            return "Immediate";
        } else if (typeof timer.interval !== "undefined") {
            return "Interval";
        } else {
            return "Timeout";
        }
    }

    function clearTimer(clock, timerId, ttype) {
        if (!timerId) {
            // null appears to be allowed in most browsers, and appears to be
            // relied upon by some libraries, like Bootstrap carousel
            return;
        }

        if (!clock.timers) {
            clock.timers = [];
        }

        // in Node, timerId is an object with .ref()/.unref(), and
        // its .id field is the actual timer id.
        if (typeof timerId === "object") {
            timerId = timerId.id;
        }

        if (clock.timers.hasOwnProperty(timerId)) {
            // check that the ID matches a timer of the correct type
            var timer = clock.timers[timerId];
            if (timerType(timer) === ttype) {
                delete clock.timers[timerId];
            } else {
				throw new Error("Cannot clear timer: timer created with set" + ttype + "() but cleared with clear" + timerType(timer) + "()");
			}
        }
    }

    function uninstall(clock, target) {
        var method,
            i,
            l;

        for (i = 0, l = clock.methods.length; i < l; i++) {
            method = clock.methods[i];

            if (target[method].hadOwnProperty) {
                target[method] = clock["_" + method];
            } else {
                try {
                    delete target[method];
                } catch (ignore) {}
            }
        }

        // Prevent multiple executions which will completely remove these props
        clock.methods = [];
    }

    function hijackMethod(target, method, clock) {
        var prop;

        clock[method].hadOwnProperty = Object.prototype.hasOwnProperty.call(target, method);
        clock["_" + method] = target[method];

        if (method === "Date") {
            var date = mirrorDateProperties(clock[method], target[method]);
            target[method] = date;
        } else {
            target[method] = function () {
                return clock[method].apply(clock, arguments);
            };

            for (prop in clock[method]) {
                if (clock[method].hasOwnProperty(prop)) {
                    target[method][prop] = clock[method][prop];
                }
            }
        }

        target[method].clock = clock;
    }

    var timers = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setImmediate: global.setImmediate,
        clearImmediate: global.clearImmediate,
        setInterval: setInterval,
        clearInterval: clearInterval,
        Date: Date
    };

    var keys = Object.keys || function (obj) {
        var ks = [],
            key;

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                ks.push(key);
            }
        }

        return ks;
    };

    exports.timers = timers;

    function createClock(now) {
        var clock = {
            now: getEpoch(now),
            timeouts: {},
            Date: createDate()
        };

        clock.Date.clock = clock;

        clock.setTimeout = function setTimeout(func, timeout) {
            return addTimer(clock, {
                func: func,
                args: Array.prototype.slice.call(arguments, 2),
                delay: timeout
            });
        };

        clock.clearTimeout = function clearTimeout(timerId) {
            return clearTimer(clock, timerId, "Timeout");
        };

        clock.setInterval = function setInterval(func, timeout) {
            return addTimer(clock, {
                func: func,
                args: Array.prototype.slice.call(arguments, 2),
                delay: timeout,
                interval: timeout
            });
        };

        clock.clearInterval = function clearInterval(timerId) {
            return clearTimer(clock, timerId, "Interval");
        };

        clock.setImmediate = function setImmediate(func) {
            return addTimer(clock, {
                func: func,
                args: Array.prototype.slice.call(arguments, 1),
                immediate: true
            });
        };

        clock.clearImmediate = function clearImmediate(timerId) {
            return clearTimer(clock, timerId, "Immediate");
        };

        clock.tick = function tick(ms) {
            ms = typeof ms === "number" ? ms : parseTime(ms);
            var tickFrom = clock.now, tickTo = clock.now + ms, previous = clock.now;
            var timer = firstTimerInRange(clock, tickFrom, tickTo);
            var oldNow;

            clock.duringTick = true;

            var firstException;
            while (timer && tickFrom <= tickTo) {
                if (clock.timers[timer.id]) {
                    tickFrom = clock.now = timer.callAt;
                    try {
                        oldNow = clock.now;
                        callTimer(clock, timer);
                        // compensate for any setSystemTime() call during timer callback
                        if (oldNow !== clock.now) {
                            tickFrom += clock.now - oldNow;
                            tickTo += clock.now - oldNow;
                            previous += clock.now - oldNow;
                        }
                    } catch (e) {
                        firstException = firstException || e;
                    }
                }

                timer = firstTimerInRange(clock, previous, tickTo);
                previous = tickFrom;
            }

            clock.duringTick = false;
            clock.now = tickTo;

            if (firstException) {
                throw firstException;
            }

            return clock.now;
        };

        clock.reset = function reset() {
            clock.timers = {};
        };

        clock.setSystemTime = function setSystemTime(now) {
            // determine time difference
            var newNow = getEpoch(now);
            var difference = newNow - clock.now;

            // update 'system clock'
            clock.now = newNow;

            // update timers and intervals to keep them stable
            for (var id in clock.timers) {
                if (clock.timers.hasOwnProperty(id)) {
                    var timer = clock.timers[id];
                    timer.createdAt += difference;
                    timer.callAt += difference;
                }
            }
        };

        return clock;
    }
    exports.createClock = createClock;

    exports.install = function install(target, now, toFake) {
        var i,
            l;

        if (typeof target === "number") {
            toFake = now;
            now = target;
            target = null;
        }

        if (!target) {
            target = global;
        }

        var clock = createClock(now);

        clock.uninstall = function () {
            uninstall(clock, target);
        };

        clock.methods = toFake || [];

        if (clock.methods.length === 0) {
            clock.methods = keys(timers);
        }

        for (i = 0, l = clock.methods.length; i < l; i++) {
            hijackMethod(target, clock.methods[i], clock);
        }

        return clock;
    };

}(global || this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],61:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],62:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],63:[function(require,module,exports){
((typeof define === "function" && define.amd && function (m) { define("samsam", m); }) ||
 (typeof module === "object" &&
      function (m) { module.exports = m(); }) || // Node
 function (m) { this.samsam = m(); } // Browser globals
)(function () {
    var o = Object.prototype;
    var div = typeof document !== "undefined" && document.createElement("div");

    function isNaN(value) {
        // Unlike global isNaN, this avoids type coercion
        // typeof check avoids IE host object issues, hat tip to
        // lodash
        var val = value; // JsLint thinks value !== value is "weird"
        return typeof value === "number" && value !== val;
    }

    function getClass(value) {
        // Returns the internal [[Class]] by calling Object.prototype.toString
        // with the provided value as this. Return value is a string, naming the
        // internal class, e.g. "Array"
        return o.toString.call(value).split(/[ \]]/)[1];
    }

    /**
     * @name samsam.isArguments
     * @param Object object
     *
     * Returns ``true`` if ``object`` is an ``arguments`` object,
     * ``false`` otherwise.
     */
    function isArguments(object) {
        if (getClass(object) === 'Arguments') { return true; }
        if (typeof object !== "object" || typeof object.length !== "number" ||
                getClass(object) === "Array") {
            return false;
        }
        if (typeof object.callee == "function") { return true; }
        try {
            object[object.length] = 6;
            delete object[object.length];
        } catch (e) {
            return true;
        }
        return false;
    }

    /**
     * @name samsam.isElement
     * @param Object object
     *
     * Returns ``true`` if ``object`` is a DOM element node. Unlike
     * Underscore.js/lodash, this function will return ``false`` if ``object``
     * is an *element-like* object, i.e. a regular object with a ``nodeType``
     * property that holds the value ``1``.
     */
    function isElement(object) {
        if (!object || object.nodeType !== 1 || !div) { return false; }
        try {
            object.appendChild(div);
            object.removeChild(div);
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * @name samsam.keys
     * @param Object object
     *
     * Return an array of own property names.
     */
    function keys(object) {
        var ks = [], prop;
        for (prop in object) {
            if (o.hasOwnProperty.call(object, prop)) { ks.push(prop); }
        }
        return ks;
    }

    /**
     * @name samsam.isDate
     * @param Object value
     *
     * Returns true if the object is a ``Date``, or *date-like*. Duck typing
     * of date objects work by checking that the object has a ``getTime``
     * function whose return value equals the return value from the object's
     * ``valueOf``.
     */
    function isDate(value) {
        return typeof value.getTime == "function" &&
            value.getTime() == value.valueOf();
    }

    /**
     * @name samsam.isNegZero
     * @param Object value
     *
     * Returns ``true`` if ``value`` is ``-0``.
     */
    function isNegZero(value) {
        return value === 0 && 1 / value === -Infinity;
    }

    /**
     * @name samsam.equal
     * @param Object obj1
     * @param Object obj2
     *
     * Returns ``true`` if two objects are strictly equal. Compared to
     * ``===`` there are two exceptions:
     *
     *   - NaN is considered equal to NaN
     *   - -0 and +0 are not considered equal
     */
    function identical(obj1, obj2) {
        if (obj1 === obj2 || (isNaN(obj1) && isNaN(obj2))) {
            return obj1 !== 0 || isNegZero(obj1) === isNegZero(obj2);
        }
    }


    /**
     * @name samsam.deepEqual
     * @param Object obj1
     * @param Object obj2
     *
     * Deep equal comparison. Two values are "deep equal" if:
     *
     *   - They are equal, according to samsam.identical
     *   - They are both date objects representing the same time
     *   - They are both arrays containing elements that are all deepEqual
     *   - They are objects with the same set of properties, and each property
     *     in ``obj1`` is deepEqual to the corresponding property in ``obj2``
     *
     * Supports cyclic objects.
     */
    function deepEqualCyclic(obj1, obj2) {

        // used for cyclic comparison
        // contain already visited objects
        var objects1 = [],
            objects2 = [],
        // contain pathes (position in the object structure)
        // of the already visited objects
        // indexes same as in objects arrays
            paths1 = [],
            paths2 = [],
        // contains combinations of already compared objects
        // in the manner: { "$1['ref']$2['ref']": true }
            compared = {};

        /**
         * used to check, if the value of a property is an object
         * (cyclic logic is only needed for objects)
         * only needed for cyclic logic
         */
        function isObject(value) {

            if (typeof value === 'object' && value !== null &&
                    !(value instanceof Boolean) &&
                    !(value instanceof Date)    &&
                    !(value instanceof Number)  &&
                    !(value instanceof RegExp)  &&
                    !(value instanceof String)) {

                return true;
            }

            return false;
        }

        /**
         * returns the index of the given object in the
         * given objects array, -1 if not contained
         * only needed for cyclic logic
         */
        function getIndex(objects, obj) {

            var i;
            for (i = 0; i < objects.length; i++) {
                if (objects[i] === obj) {
                    return i;
                }
            }

            return -1;
        }

        // does the recursion for the deep equal check
        return (function deepEqual(obj1, obj2, path1, path2) {
            var type1 = typeof obj1;
            var type2 = typeof obj2;

            // == null also matches undefined
            if (obj1 === obj2 ||
                    isNaN(obj1) || isNaN(obj2) ||
                    obj1 == null || obj2 == null ||
                    type1 !== "object" || type2 !== "object") {

                return identical(obj1, obj2);
            }

            // Elements are only equal if identical(expected, actual)
            if (isElement(obj1) || isElement(obj2)) { return false; }

            var isDate1 = isDate(obj1), isDate2 = isDate(obj2);
            if (isDate1 || isDate2) {
                if (!isDate1 || !isDate2 || obj1.getTime() !== obj2.getTime()) {
                    return false;
                }
            }

            if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
                if (obj1.toString() !== obj2.toString()) { return false; }
            }

            var class1 = getClass(obj1);
            var class2 = getClass(obj2);
            var keys1 = keys(obj1);
            var keys2 = keys(obj2);

            if (isArguments(obj1) || isArguments(obj2)) {
                if (obj1.length !== obj2.length) { return false; }
            } else {
                if (type1 !== type2 || class1 !== class2 ||
                        keys1.length !== keys2.length) {
                    return false;
                }
            }

            var key, i, l,
                // following vars are used for the cyclic logic
                value1, value2,
                isObject1, isObject2,
                index1, index2,
                newPath1, newPath2;

            for (i = 0, l = keys1.length; i < l; i++) {
                key = keys1[i];
                if (!o.hasOwnProperty.call(obj2, key)) {
                    return false;
                }

                // Start of the cyclic logic

                value1 = obj1[key];
                value2 = obj2[key];

                isObject1 = isObject(value1);
                isObject2 = isObject(value2);

                // determine, if the objects were already visited
                // (it's faster to check for isObject first, than to
                // get -1 from getIndex for non objects)
                index1 = isObject1 ? getIndex(objects1, value1) : -1;
                index2 = isObject2 ? getIndex(objects2, value2) : -1;

                // determine the new pathes of the objects
                // - for non cyclic objects the current path will be extended
                //   by current property name
                // - for cyclic objects the stored path is taken
                newPath1 = index1 !== -1
                    ? paths1[index1]
                    : path1 + '[' + JSON.stringify(key) + ']';
                newPath2 = index2 !== -1
                    ? paths2[index2]
                    : path2 + '[' + JSON.stringify(key) + ']';

                // stop recursion if current objects are already compared
                if (compared[newPath1 + newPath2]) {
                    return true;
                }

                // remember the current objects and their pathes
                if (index1 === -1 && isObject1) {
                    objects1.push(value1);
                    paths1.push(newPath1);
                }
                if (index2 === -1 && isObject2) {
                    objects2.push(value2);
                    paths2.push(newPath2);
                }

                // remember that the current objects are already compared
                if (isObject1 && isObject2) {
                    compared[newPath1 + newPath2] = true;
                }

                // End of cyclic logic

                // neither value1 nor value2 is a cycle
                // continue with next level
                if (!deepEqual(value1, value2, newPath1, newPath2)) {
                    return false;
                }
            }

            return true;

        }(obj1, obj2, '$1', '$2'));
    }

    var match;

    function arrayContains(array, subset) {
        if (subset.length === 0) { return true; }
        var i, l, j, k;
        for (i = 0, l = array.length; i < l; ++i) {
            if (match(array[i], subset[0])) {
                for (j = 0, k = subset.length; j < k; ++j) {
                    if (!match(array[i + j], subset[j])) { return false; }
                }
                return true;
            }
        }
        return false;
    }

    /**
     * @name samsam.match
     * @param Object object
     * @param Object matcher
     *
     * Compare arbitrary value ``object`` with matcher.
     */
    match = function match(object, matcher) {
        if (matcher && typeof matcher.test === "function") {
            return matcher.test(object);
        }

        if (typeof matcher === "function") {
            return matcher(object) === true;
        }

        if (typeof matcher === "string") {
            matcher = matcher.toLowerCase();
            var notNull = typeof object === "string" || !!object;
            return notNull &&
                (String(object)).toLowerCase().indexOf(matcher) >= 0;
        }

        if (typeof matcher === "number") {
            return matcher === object;
        }

        if (typeof matcher === "boolean") {
            return matcher === object;
        }

        if (typeof(matcher) === "undefined") {
            return typeof(object) === "undefined";
        }

        if (matcher === null) {
            return object === null;
        }

        if (getClass(object) === "Array" && getClass(matcher) === "Array") {
            return arrayContains(object, matcher);
        }

        if (matcher && typeof matcher === "object") {
            if (matcher === object) {
                return true;
            }
            var prop;
            for (prop in matcher) {
                var value = object[prop];
                if (typeof value === "undefined" &&
                        typeof object.getAttribute === "function") {
                    value = object.getAttribute(prop);
                }
                if (matcher[prop] === null || typeof matcher[prop] === 'undefined') {
                    if (value !== matcher[prop]) {
                        return false;
                    }
                } else if (typeof  value === "undefined" || !match(value, matcher[prop])) {
                    return false;
                }
            }
            return true;
        }

        throw new Error("Matcher was not a string, a number, a " +
                        "function, a boolean or an object");
    };

    return {
        isArguments: isArguments,
        isElement: isElement,
        isDate: isDate,
        isNegZero: isNegZero,
        identical: identical,
        deepEqual: deepEqualCyclic,
        match: match,
        keys: keys
    };
});

},{}],64:[function(require,module,exports){
/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
var sinon = (function () { // eslint-disable-line no-unused-vars
    "use strict";

    var sinonModule;
    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        sinonModule = module.exports = require("./sinon/util/core");
        require("./sinon/extend");
        require("./sinon/walk");
        require("./sinon/typeOf");
        require("./sinon/times_in_words");
        require("./sinon/spy");
        require("./sinon/call");
        require("./sinon/behavior");
        require("./sinon/stub");
        require("./sinon/mock");
        require("./sinon/collection");
        require("./sinon/assert");
        require("./sinon/sandbox");
        require("./sinon/test");
        require("./sinon/test_case");
        require("./sinon/match");
        require("./sinon/format");
        require("./sinon/log_error");
    }

    if (isAMD) {
        define(loadDependencies);
    } else if (isNode) {
        loadDependencies(require, module.exports, module);
        sinonModule = module.exports;
    } else {
        sinonModule = {};
    }

    return sinonModule;
}());

},{"./sinon/assert":65,"./sinon/behavior":66,"./sinon/call":67,"./sinon/collection":68,"./sinon/extend":69,"./sinon/format":70,"./sinon/log_error":71,"./sinon/match":72,"./sinon/mock":73,"./sinon/sandbox":74,"./sinon/spy":75,"./sinon/stub":76,"./sinon/test":77,"./sinon/test_case":78,"./sinon/times_in_words":79,"./sinon/typeOf":80,"./sinon/util/core":81,"./sinon/walk":88}],65:[function(require,module,exports){
(function (global){
/**
 * @depend times_in_words.js
 * @depend util/core.js
 * @depend match.js
 * @depend format.js
 */
/**
 * Assertions matching the test spy retrieval interface.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal, global) {
    "use strict";

    var slice = Array.prototype.slice;

    function makeApi(sinon) {
        var assert;

        function verifyIsStub() {
            var method;

            for (var i = 0, l = arguments.length; i < l; ++i) {
                method = arguments[i];

                if (!method) {
                    assert.fail("fake is not a spy");
                }

                if (method.proxy && method.proxy.isSinonProxy) {
                    verifyIsStub(method.proxy);
                } else {
                    if (typeof method !== "function") {
                        assert.fail(method + " is not a function");
                    }

                    if (typeof method.getCall !== "function") {
                        assert.fail(method + " is not stubbed");
                    }
                }

            }
        }

        function verifyIsValidAssertion(assertionMethod, assertionArgs) {
            switch (assertionMethod) {
                case "notCalled":
                case "called":
                case "calledOnce":
                case "calledTwice":
                case "calledThrice":
                    if (assertionArgs.length !== 0) {
                        assert.fail(assertionMethod +
                                    " takes 1 argument but was called with " +
                                    (assertionArgs.length + 1) + " arguments");
                    }
                    break;
                default:
                    break;
            }
        }

        function failAssertion(object, msg) {
            object = object || global;
            var failMethod = object.fail || assert.fail;
            failMethod.call(object, msg);
        }

        function mirrorPropAsAssertion(name, method, message) {
            if (arguments.length === 2) {
                message = method;
                method = name;
            }

            assert[name] = function (fake) {
                verifyIsStub(fake);

                var args = slice.call(arguments, 1);
                verifyIsValidAssertion(name, args);

                var failed = false;

                if (typeof method === "function") {
                    failed = !method(fake);
                } else {
                    failed = typeof fake[method] === "function" ?
                        !fake[method].apply(fake, args) : !fake[method];
                }

                if (failed) {
                    failAssertion(this, (fake.printf || fake.proxy.printf).apply(fake, [message].concat(args)));
                } else {
                    assert.pass(name);
                }
            };
        }

        function exposedName(prefix, prop) {
            return !prefix || /^fail/.test(prop) ? prop :
                prefix + prop.slice(0, 1).toUpperCase() + prop.slice(1);
        }

        assert = {
            failException: "AssertError",

            fail: function fail(message) {
                var error = new Error(message);
                error.name = this.failException || assert.failException;

                throw error;
            },

            pass: function pass() {},

            callOrder: function assertCallOrder() {
                verifyIsStub.apply(null, arguments);
                var expected = "";
                var actual = "";

                if (!sinon.calledInOrder(arguments)) {
                    try {
                        expected = [].join.call(arguments, ", ");
                        var calls = slice.call(arguments);
                        var i = calls.length;
                        while (i) {
                            if (!calls[--i].called) {
                                calls.splice(i, 1);
                            }
                        }
                        actual = sinon.orderByFirstCall(calls).join(", ");
                    } catch (e) {
                        // If this fails, we'll just fall back to the blank string
                    }

                    failAssertion(this, "expected " + expected + " to be " +
                                "called in order but were called as " + actual);
                } else {
                    assert.pass("callOrder");
                }
            },

            callCount: function assertCallCount(method, count) {
                verifyIsStub(method);

                if (method.callCount !== count) {
                    var msg = "expected %n to be called " + sinon.timesInWords(count) +
                        " but was called %c%C";
                    failAssertion(this, method.printf(msg));
                } else {
                    assert.pass("callCount");
                }
            },

            expose: function expose(target, options) {
                if (!target) {
                    throw new TypeError("target is null or undefined");
                }

                var o = options || {};
                var prefix = typeof o.prefix === "undefined" && "assert" || o.prefix;
                var includeFail = typeof o.includeFail === "undefined" || !!o.includeFail;

                for (var method in this) {
                    if (method !== "expose" && (includeFail || !/^(fail)/.test(method))) {
                        target[exposedName(prefix, method)] = this[method];
                    }
                }

                return target;
            },

            match: function match(actual, expectation) {
                var matcher = sinon.match(expectation);
                if (matcher.test(actual)) {
                    assert.pass("match");
                } else {
                    var formatted = [
                        "expected value to match",
                        "    expected = " + sinon.format(expectation),
                        "    actual = " + sinon.format(actual)
                    ];

                    failAssertion(this, formatted.join("\n"));
                }
            }
        };

        mirrorPropAsAssertion("called", "expected %n to have been called at least once but was never called");
        mirrorPropAsAssertion("notCalled", function (spy) {
            return !spy.called;
        }, "expected %n to not have been called but was called %c%C");
        mirrorPropAsAssertion("calledOnce", "expected %n to be called once but was called %c%C");
        mirrorPropAsAssertion("calledTwice", "expected %n to be called twice but was called %c%C");
        mirrorPropAsAssertion("calledThrice", "expected %n to be called thrice but was called %c%C");
        mirrorPropAsAssertion("calledOn", "expected %n to be called with %1 as this but was called with %t");
        mirrorPropAsAssertion(
            "alwaysCalledOn",
            "expected %n to always be called with %1 as this but was called with %t"
        );
        mirrorPropAsAssertion("calledWithNew", "expected %n to be called with new");
        mirrorPropAsAssertion("alwaysCalledWithNew", "expected %n to always be called with new");
        mirrorPropAsAssertion("calledWith", "expected %n to be called with arguments %*%C");
        mirrorPropAsAssertion("calledWithMatch", "expected %n to be called with match %*%C");
        mirrorPropAsAssertion("alwaysCalledWith", "expected %n to always be called with arguments %*%C");
        mirrorPropAsAssertion("alwaysCalledWithMatch", "expected %n to always be called with match %*%C");
        mirrorPropAsAssertion("calledWithExactly", "expected %n to be called with exact arguments %*%C");
        mirrorPropAsAssertion("alwaysCalledWithExactly", "expected %n to always be called with exact arguments %*%C");
        mirrorPropAsAssertion("neverCalledWith", "expected %n to never be called with arguments %*%C");
        mirrorPropAsAssertion("neverCalledWithMatch", "expected %n to never be called with match %*%C");
        mirrorPropAsAssertion("threw", "%n did not throw exception%C");
        mirrorPropAsAssertion("alwaysThrew", "%n did not always throw exception%C");

        sinon.assert = assert;
        return assert;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var sinon = require("./util/core");
        require("./match");
        require("./format");
        module.exports = makeApi(sinon);
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon, // eslint-disable-line no-undef
    typeof global !== "undefined" ? global : self
));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./format":70,"./match":72,"./util/core":81}],66:[function(require,module,exports){
(function (process){
/**
 * @depend util/core.js
 * @depend extend.js
 */
/**
 * Stub behavior
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @author Tim Fischbach (mail@timfischbach.de)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal) {
    "use strict";

    var slice = Array.prototype.slice;
    var join = Array.prototype.join;
    var useLeftMostCallback = -1;
    var useRightMostCallback = -2;

    var nextTick = (function () {
        if (typeof process === "object" && typeof process.nextTick === "function") {
            return process.nextTick;
        }

        if (typeof setImmediate === "function") {
            return setImmediate;
        }

        return function (callback) {
            setTimeout(callback, 0);
        };
    })();

    function throwsException(error, message) {
        if (typeof error === "string") {
            this.exception = new Error(message || "");
            this.exception.name = error;
        } else if (!error) {
            this.exception = new Error("Error");
        } else {
            this.exception = error;
        }

        return this;
    }

    function getCallback(behavior, args) {
        var callArgAt = behavior.callArgAt;

        if (callArgAt >= 0) {
            return args[callArgAt];
        }

        var argumentList;

        if (callArgAt === useLeftMostCallback) {
            argumentList = args;
        }

        if (callArgAt === useRightMostCallback) {
            argumentList = slice.call(args).reverse();
        }

        var callArgProp = behavior.callArgProp;

        for (var i = 0, l = argumentList.length; i < l; ++i) {
            if (!callArgProp && typeof argumentList[i] === "function") {
                return argumentList[i];
            }

            if (callArgProp && argumentList[i] &&
                typeof argumentList[i][callArgProp] === "function") {
                return argumentList[i][callArgProp];
            }
        }

        return null;
    }

    function makeApi(sinon) {
        function getCallbackError(behavior, func, args) {
            if (behavior.callArgAt < 0) {
                var msg;

                if (behavior.callArgProp) {
                    msg = sinon.functionName(behavior.stub) +
                        " expected to yield to '" + behavior.callArgProp +
                        "', but no object with such a property was passed.";
                } else {
                    msg = sinon.functionName(behavior.stub) +
                        " expected to yield, but no callback was passed.";
                }

                if (args.length > 0) {
                    msg += " Received [" + join.call(args, ", ") + "]";
                }

                return msg;
            }

            return "argument at index " + behavior.callArgAt + " is not a function: " + func;
        }

        function callCallback(behavior, args) {
            if (typeof behavior.callArgAt === "number") {
                var func = getCallback(behavior, args);

                if (typeof func !== "function") {
                    throw new TypeError(getCallbackError(behavior, func, args));
                }

                if (behavior.callbackAsync) {
                    nextTick(function () {
                        func.apply(behavior.callbackContext, behavior.callbackArguments);
                    });
                } else {
                    func.apply(behavior.callbackContext, behavior.callbackArguments);
                }
            }
        }

        var proto = {
            create: function create(stub) {
                var behavior = sinon.extend({}, sinon.behavior);
                delete behavior.create;
                behavior.stub = stub;

                return behavior;
            },

            isPresent: function isPresent() {
                return (typeof this.callArgAt === "number" ||
                        this.exception ||
                        typeof this.returnArgAt === "number" ||
                        this.returnThis ||
                        this.returnValueDefined);
            },

            invoke: function invoke(context, args) {
                callCallback(this, args);

                if (this.exception) {
                    throw this.exception;
                } else if (typeof this.returnArgAt === "number") {
                    return args[this.returnArgAt];
                } else if (this.returnThis) {
                    return context;
                }

                return this.returnValue;
            },

            onCall: function onCall(index) {
                return this.stub.onCall(index);
            },

            onFirstCall: function onFirstCall() {
                return this.stub.onFirstCall();
            },

            onSecondCall: function onSecondCall() {
                return this.stub.onSecondCall();
            },

            onThirdCall: function onThirdCall() {
                return this.stub.onThirdCall();
            },

            withArgs: function withArgs(/* arguments */) {
                throw new Error(
                    "Defining a stub by invoking \"stub.onCall(...).withArgs(...)\" " +
                    "is not supported. Use \"stub.withArgs(...).onCall(...)\" " +
                    "to define sequential behavior for calls with certain arguments."
                );
            },

            callsArg: function callsArg(pos) {
                if (typeof pos !== "number") {
                    throw new TypeError("argument index is not number");
                }

                this.callArgAt = pos;
                this.callbackArguments = [];
                this.callbackContext = undefined;
                this.callArgProp = undefined;
                this.callbackAsync = false;

                return this;
            },

            callsArgOn: function callsArgOn(pos, context) {
                if (typeof pos !== "number") {
                    throw new TypeError("argument index is not number");
                }
                if (typeof context !== "object") {
                    throw new TypeError("argument context is not an object");
                }

                this.callArgAt = pos;
                this.callbackArguments = [];
                this.callbackContext = context;
                this.callArgProp = undefined;
                this.callbackAsync = false;

                return this;
            },

            callsArgWith: function callsArgWith(pos) {
                if (typeof pos !== "number") {
                    throw new TypeError("argument index is not number");
                }

                this.callArgAt = pos;
                this.callbackArguments = slice.call(arguments, 1);
                this.callbackContext = undefined;
                this.callArgProp = undefined;
                this.callbackAsync = false;

                return this;
            },

            callsArgOnWith: function callsArgWith(pos, context) {
                if (typeof pos !== "number") {
                    throw new TypeError("argument index is not number");
                }
                if (typeof context !== "object") {
                    throw new TypeError("argument context is not an object");
                }

                this.callArgAt = pos;
                this.callbackArguments = slice.call(arguments, 2);
                this.callbackContext = context;
                this.callArgProp = undefined;
                this.callbackAsync = false;

                return this;
            },

            yields: function () {
                this.callArgAt = useLeftMostCallback;
                this.callbackArguments = slice.call(arguments, 0);
                this.callbackContext = undefined;
                this.callArgProp = undefined;
                this.callbackAsync = false;

                return this;
            },

            yieldsRight: function () {
                this.callArgAt = useRightMostCallback;
                this.callbackArguments = slice.call(arguments, 0);
                this.callbackContext = undefined;
                this.callArgProp = undefined;
                this.callbackAsync = false;

                return this;
            },

            yieldsOn: function (context) {
                if (typeof context !== "object") {
                    throw new TypeError("argument context is not an object");
                }

                this.callArgAt = useLeftMostCallback;
                this.callbackArguments = slice.call(arguments, 1);
                this.callbackContext = context;
                this.callArgProp = undefined;
                this.callbackAsync = false;

                return this;
            },

            yieldsTo: function (prop) {
                this.callArgAt = useLeftMostCallback;
                this.callbackArguments = slice.call(arguments, 1);
                this.callbackContext = undefined;
                this.callArgProp = prop;
                this.callbackAsync = false;

                return this;
            },

            yieldsToOn: function (prop, context) {
                if (typeof context !== "object") {
                    throw new TypeError("argument context is not an object");
                }

                this.callArgAt = useLeftMostCallback;
                this.callbackArguments = slice.call(arguments, 2);
                this.callbackContext = context;
                this.callArgProp = prop;
                this.callbackAsync = false;

                return this;
            },

            throws: throwsException,
            throwsException: throwsException,

            returns: function returns(value) {
                this.returnValue = value;
                this.returnValueDefined = true;
                this.exception = undefined;

                return this;
            },

            returnsArg: function returnsArg(pos) {
                if (typeof pos !== "number") {
                    throw new TypeError("argument index is not number");
                }

                this.returnArgAt = pos;

                return this;
            },

            returnsThis: function returnsThis() {
                this.returnThis = true;

                return this;
            }
        };

        function createAsyncVersion(syncFnName) {
            return function () {
                var result = this[syncFnName].apply(this, arguments);
                this.callbackAsync = true;
                return result;
            };
        }

        // create asynchronous versions of callsArg* and yields* methods
        for (var method in proto) {
            // need to avoid creating anotherasync versions of the newly added async methods
            if (proto.hasOwnProperty(method) && method.match(/^(callsArg|yields)/) && !method.match(/Async/)) {
                proto[method + "Async"] = createAsyncVersion(method);
            }
        }

        sinon.behavior = proto;
        return proto;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var sinon = require("./util/core");
        require("./extend");
        module.exports = makeApi(sinon);
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

}).call(this,require('_process'))

},{"./extend":69,"./util/core":81,"_process":62}],67:[function(require,module,exports){
/**
  * @depend util/core.js
  * @depend match.js
  * @depend format.js
  */
/**
  * Spy calls
  *
  * @author Christian Johansen (christian@cjohansen.no)
  * @author Maximilian Antoni (mail@maxantoni.de)
  * @license BSD
  *
  * Copyright (c) 2010-2013 Christian Johansen
  * Copyright (c) 2013 Maximilian Antoni
  */
(function (sinonGlobal) {
    "use strict";

    var slice = Array.prototype.slice;

    function makeApi(sinon) {
        function throwYieldError(proxy, text, args) {
            var msg = sinon.functionName(proxy) + text;
            if (args.length) {
                msg += " Received [" + slice.call(args).join(", ") + "]";
            }
            throw new Error(msg);
        }

        var callProto = {
            calledOn: function calledOn(thisValue) {
                if (sinon.match && sinon.match.isMatcher(thisValue)) {
                    return thisValue.test(this.thisValue);
                }
                return this.thisValue === thisValue;
            },

            calledWith: function calledWith() {
                var l = arguments.length;
                if (l > this.args.length) {
                    return false;
                }
                for (var i = 0; i < l; i += 1) {
                    if (!sinon.deepEqual(arguments[i], this.args[i])) {
                        return false;
                    }
                }

                return true;
            },

            calledWithMatch: function calledWithMatch() {
                var l = arguments.length;
                if (l > this.args.length) {
                    return false;
                }
                for (var i = 0; i < l; i += 1) {
                    var actual = this.args[i];
                    var expectation = arguments[i];
                    if (!sinon.match || !sinon.match(expectation).test(actual)) {
                        return false;
                    }
                }
                return true;
            },

            calledWithExactly: function calledWithExactly() {
                return arguments.length === this.args.length &&
                    this.calledWith.apply(this, arguments);
            },

            notCalledWith: function notCalledWith() {
                return !this.calledWith.apply(this, arguments);
            },

            notCalledWithMatch: function notCalledWithMatch() {
                return !this.calledWithMatch.apply(this, arguments);
            },

            returned: function returned(value) {
                return sinon.deepEqual(value, this.returnValue);
            },

            threw: function threw(error) {
                if (typeof error === "undefined" || !this.exception) {
                    return !!this.exception;
                }

                return this.exception === error || this.exception.name === error;
            },

            calledWithNew: function calledWithNew() {
                return this.proxy.prototype && this.thisValue instanceof this.proxy;
            },

            calledBefore: function (other) {
                return this.callId < other.callId;
            },

            calledAfter: function (other) {
                return this.callId > other.callId;
            },

            callArg: function (pos) {
                this.args[pos]();
            },

            callArgOn: function (pos, thisValue) {
                this.args[pos].apply(thisValue);
            },

            callArgWith: function (pos) {
                this.callArgOnWith.apply(this, [pos, null].concat(slice.call(arguments, 1)));
            },

            callArgOnWith: function (pos, thisValue) {
                var args = slice.call(arguments, 2);
                this.args[pos].apply(thisValue, args);
            },

            "yield": function () {
                this.yieldOn.apply(this, [null].concat(slice.call(arguments, 0)));
            },

            yieldOn: function (thisValue) {
                var args = this.args;
                for (var i = 0, l = args.length; i < l; ++i) {
                    if (typeof args[i] === "function") {
                        args[i].apply(thisValue, slice.call(arguments, 1));
                        return;
                    }
                }
                throwYieldError(this.proxy, " cannot yield since no callback was passed.", args);
            },

            yieldTo: function (prop) {
                this.yieldToOn.apply(this, [prop, null].concat(slice.call(arguments, 1)));
            },

            yieldToOn: function (prop, thisValue) {
                var args = this.args;
                for (var i = 0, l = args.length; i < l; ++i) {
                    if (args[i] && typeof args[i][prop] === "function") {
                        args[i][prop].apply(thisValue, slice.call(arguments, 2));
                        return;
                    }
                }
                throwYieldError(this.proxy, " cannot yield to '" + prop +
                    "' since no callback was passed.", args);
            },

            getStackFrames: function () {
                // Omit the error message and the two top stack frames in sinon itself:
                return this.stack && this.stack.split("\n").slice(3);
            },

            toString: function () {
                var callStr = this.proxy ? this.proxy.toString() + "(" : "";
                var args = [];

                if (!this.args) {
                    return ":(";
                }

                for (var i = 0, l = this.args.length; i < l; ++i) {
                    args.push(sinon.format(this.args[i]));
                }

                callStr = callStr + args.join(", ") + ")";

                if (typeof this.returnValue !== "undefined") {
                    callStr += " => " + sinon.format(this.returnValue);
                }

                if (this.exception) {
                    callStr += " !" + this.exception.name;

                    if (this.exception.message) {
                        callStr += "(" + this.exception.message + ")";
                    }
                }
                if (this.stack) {
                    callStr += this.getStackFrames()[0].replace(/^\s*(?:at\s+|@)?/, " at ");

                }

                return callStr;
            }
        };

        callProto.invokeCallback = callProto.yield;

        function createSpyCall(spy, thisValue, args, returnValue, exception, id, stack) {
            if (typeof id !== "number") {
                throw new TypeError("Call id is not a number");
            }
            var proxyCall = sinon.create(callProto);
            proxyCall.proxy = spy;
            proxyCall.thisValue = thisValue;
            proxyCall.args = args;
            proxyCall.returnValue = returnValue;
            proxyCall.exception = exception;
            proxyCall.callId = id;
            proxyCall.stack = stack;

            return proxyCall;
        }
        createSpyCall.toString = callProto.toString; // used by mocks

        sinon.spyCall = createSpyCall;
        return createSpyCall;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var sinon = require("./util/core");
        require("./match");
        require("./format");
        module.exports = makeApi(sinon);
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./format":70,"./match":72,"./util/core":81}],68:[function(require,module,exports){
/**
 * @depend util/core.js
 * @depend spy.js
 * @depend stub.js
 * @depend mock.js
 */
/**
 * Collections of stubs, spies and mocks.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal) {
    "use strict";

    var push = [].push;
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    function getFakes(fakeCollection) {
        if (!fakeCollection.fakes) {
            fakeCollection.fakes = [];
        }

        return fakeCollection.fakes;
    }

    function each(fakeCollection, method) {
        var fakes = getFakes(fakeCollection);

        for (var i = 0, l = fakes.length; i < l; i += 1) {
            if (typeof fakes[i][method] === "function") {
                fakes[i][method]();
            }
        }
    }

    function compact(fakeCollection) {
        var fakes = getFakes(fakeCollection);
        var i = 0;
        while (i < fakes.length) {
            fakes.splice(i, 1);
        }
    }

    function makeApi(sinon) {
        var collection = {
            verify: function resolve() {
                each(this, "verify");
            },

            restore: function restore() {
                each(this, "restore");
                compact(this);
            },

            reset: function restore() {
                each(this, "reset");
            },

            verifyAndRestore: function verifyAndRestore() {
                var exception;

                try {
                    this.verify();
                } catch (e) {
                    exception = e;
                }

                this.restore();

                if (exception) {
                    throw exception;
                }
            },

            add: function add(fake) {
                push.call(getFakes(this), fake);
                return fake;
            },

            spy: function spy() {
                return this.add(sinon.spy.apply(sinon, arguments));
            },

            stub: function stub(object, property, value) {
                if (property) {
                    var original = object[property];

                    if (typeof original !== "function") {
                        if (!hasOwnProperty.call(object, property)) {
                            throw new TypeError("Cannot stub non-existent own property " + property);
                        }

                        object[property] = value;

                        return this.add({
                            restore: function () {
                                object[property] = original;
                            }
                        });
                    }
                }
                if (!property && !!object && typeof object === "object") {
                    var stubbedObj = sinon.stub.apply(sinon, arguments);

                    for (var prop in stubbedObj) {
                        if (typeof stubbedObj[prop] === "function") {
                            this.add(stubbedObj[prop]);
                        }
                    }

                    return stubbedObj;
                }

                return this.add(sinon.stub.apply(sinon, arguments));
            },

            mock: function mock() {
                return this.add(sinon.mock.apply(sinon, arguments));
            },

            inject: function inject(obj) {
                var col = this;

                obj.spy = function () {
                    return col.spy.apply(col, arguments);
                };

                obj.stub = function () {
                    return col.stub.apply(col, arguments);
                };

                obj.mock = function () {
                    return col.mock.apply(col, arguments);
                };

                return obj;
            }
        };

        sinon.collection = collection;
        return collection;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var sinon = require("./util/core");
        require("./mock");
        require("./spy");
        require("./stub");
        module.exports = makeApi(sinon);
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./mock":73,"./spy":75,"./stub":76,"./util/core":81}],69:[function(require,module,exports){
/**
 * @depend util/core.js
 */
(function (sinonGlobal) {
    "use strict";

    function makeApi(sinon) {

        // Adapted from https://developer.mozilla.org/en/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
        var hasDontEnumBug = (function () {
            var obj = {
                constructor: function () {
                    return "0";
                },
                toString: function () {
                    return "1";
                },
                valueOf: function () {
                    return "2";
                },
                toLocaleString: function () {
                    return "3";
                },
                prototype: function () {
                    return "4";
                },
                isPrototypeOf: function () {
                    return "5";
                },
                propertyIsEnumerable: function () {
                    return "6";
                },
                hasOwnProperty: function () {
                    return "7";
                },
                length: function () {
                    return "8";
                },
                unique: function () {
                    return "9";
                }
            };

            var result = [];
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    result.push(obj[prop]());
                }
            }
            return result.join("") !== "0123456789";
        })();

        /* Public: Extend target in place with all (own) properties from sources in-order. Thus, last source will
         *         override properties in previous sources.
         *
         * target - The Object to extend
         * sources - Objects to copy properties from.
         *
         * Returns the extended target
         */
        function extend(target /*, sources */) {
            var sources = Array.prototype.slice.call(arguments, 1);
            var source, i, prop;

            for (i = 0; i < sources.length; i++) {
                source = sources[i];

                for (prop in source) {
                    if (source.hasOwnProperty(prop)) {
                        target[prop] = source[prop];
                    }
                }

                // Make sure we copy (own) toString method even when in JScript with DontEnum bug
                // See https://developer.mozilla.org/en/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
                if (hasDontEnumBug && source.hasOwnProperty("toString") && source.toString !== target.toString) {
                    target.toString = source.toString;
                }
            }

            return target;
        }

        sinon.extend = extend;
        return sinon.extend;
    }

    function loadDependencies(require, exports, module) {
        var sinon = require("./util/core");
        module.exports = makeApi(sinon);
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./util/core":81}],70:[function(require,module,exports){
/**
 * @depend util/core.js
 */
/**
 * Format functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2014 Christian Johansen
 */
(function (sinonGlobal, formatio) {
    "use strict";

    function makeApi(sinon) {
        function valueFormatter(value) {
            return "" + value;
        }

        function getFormatioFormatter() {
            var formatter = formatio.configure({
                    quoteStrings: false,
                    limitChildrenCount: 250
                });

            function format() {
                return formatter.ascii.apply(formatter, arguments);
            }

            return format;
        }

        function getNodeFormatter() {
            try {
                var util = require("util");
            } catch (e) {
                /* Node, but no util module - would be very old, but better safe than sorry */
            }

            function format(v) {
                var isObjectWithNativeToString = typeof v === "object" && v.toString === Object.prototype.toString;
                return isObjectWithNativeToString ? util.inspect(v) : v;
            }

            return util ? format : valueFormatter;
        }

        var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
        var formatter;

        if (isNode) {
            try {
                formatio = require("formatio");
            }
            catch (e) {} // eslint-disable-line no-empty
        }

        if (formatio) {
            formatter = getFormatioFormatter();
        } else if (isNode) {
            formatter = getNodeFormatter();
        } else {
            formatter = valueFormatter;
        }

        sinon.format = formatter;
        return sinon.format;
    }

    function loadDependencies(require, exports, module) {
        var sinon = require("./util/core");
        module.exports = makeApi(sinon);
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon, // eslint-disable-line no-undef
    typeof formatio === "object" && formatio // eslint-disable-line no-undef
));

},{"./util/core":81,"formatio":58,"util":90}],71:[function(require,module,exports){
/**
 * @depend util/core.js
 */
/**
 * Logs errors
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2014 Christian Johansen
 */
(function (sinonGlobal) {
    "use strict";

    // cache a reference to setTimeout, so that our reference won't be stubbed out
    // when using fake timers and errors will still get logged
    // https://github.com/cjohansen/Sinon.JS/issues/381
    var realSetTimeout = setTimeout;

    function makeApi(sinon) {

        function log() {}

        function logError(label, err) {
            var msg = label + " threw exception: ";

            function throwLoggedError() {
                err.message = msg + err.message;
                throw err;
            }

            sinon.log(msg + "[" + err.name + "] " + err.message);

            if (err.stack) {
                sinon.log(err.stack);
            }

            if (logError.useImmediateExceptions) {
                throwLoggedError();
            } else {
                logError.setTimeout(throwLoggedError, 0);
            }
        }

        // When set to true, any errors logged will be thrown immediately;
        // If set to false, the errors will be thrown in separate execution frame.
        logError.useImmediateExceptions = false;

        // wrap realSetTimeout with something we can stub in tests
        logError.setTimeout = function (func, timeout) {
            realSetTimeout(func, timeout);
        };

        var exports = {};
        exports.log = sinon.log = log;
        exports.logError = sinon.logError = logError;

        return exports;
    }

    function loadDependencies(require, exports, module) {
        var sinon = require("./util/core");
        module.exports = makeApi(sinon);
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./util/core":81}],72:[function(require,module,exports){
/**
 * @depend util/core.js
 * @depend typeOf.js
 */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Match functions
 *
 * @author Maximilian Antoni (mail@maxantoni.de)
 * @license BSD
 *
 * Copyright (c) 2012 Maximilian Antoni
 */
(function (sinonGlobal) {
    "use strict";

    function makeApi(sinon) {
        function assertType(value, type, name) {
            var actual = sinon.typeOf(value);
            if (actual !== type) {
                throw new TypeError("Expected type of " + name + " to be " +
                    type + ", but was " + actual);
            }
        }

        var matcher = {
            toString: function () {
                return this.message;
            }
        };

        function isMatcher(object) {
            return matcher.isPrototypeOf(object);
        }

        function matchObject(expectation, actual) {
            if (actual === null || actual === undefined) {
                return false;
            }
            for (var key in expectation) {
                if (expectation.hasOwnProperty(key)) {
                    var exp = expectation[key];
                    var act = actual[key];
                    if (isMatcher(exp)) {
                        if (!exp.test(act)) {
                            return false;
                        }
                    } else if (sinon.typeOf(exp) === "object") {
                        if (!matchObject(exp, act)) {
                            return false;
                        }
                    } else if (!sinon.deepEqual(exp, act)) {
                        return false;
                    }
                }
            }
            return true;
        }

        function match(expectation, message) {
            var m = sinon.create(matcher);
            var type = sinon.typeOf(expectation);
            switch (type) {
            case "object":
                if (typeof expectation.test === "function") {
                    m.test = function (actual) {
                        return expectation.test(actual) === true;
                    };
                    m.message = "match(" + sinon.functionName(expectation.test) + ")";
                    return m;
                }
                var str = [];
                for (var key in expectation) {
                    if (expectation.hasOwnProperty(key)) {
                        str.push(key + ": " + expectation[key]);
                    }
                }
                m.test = function (actual) {
                    return matchObject(expectation, actual);
                };
                m.message = "match(" + str.join(", ") + ")";
                break;
            case "number":
                m.test = function (actual) {
                    // we need type coercion here
                    return expectation == actual; // eslint-disable-line eqeqeq
                };
                break;
            case "string":
                m.test = function (actual) {
                    if (typeof actual !== "string") {
                        return false;
                    }
                    return actual.indexOf(expectation) !== -1;
                };
                m.message = "match(\"" + expectation + "\")";
                break;
            case "regexp":
                m.test = function (actual) {
                    if (typeof actual !== "string") {
                        return false;
                    }
                    return expectation.test(actual);
                };
                break;
            case "function":
                m.test = expectation;
                if (message) {
                    m.message = message;
                } else {
                    m.message = "match(" + sinon.functionName(expectation) + ")";
                }
                break;
            default:
                m.test = function (actual) {
                    return sinon.deepEqual(expectation, actual);
                };
            }
            if (!m.message) {
                m.message = "match(" + expectation + ")";
            }
            return m;
        }

        matcher.or = function (m2) {
            if (!arguments.length) {
                throw new TypeError("Matcher expected");
            } else if (!isMatcher(m2)) {
                m2 = match(m2);
            }
            var m1 = this;
            var or = sinon.create(matcher);
            or.test = function (actual) {
                return m1.test(actual) || m2.test(actual);
            };
            or.message = m1.message + ".or(" + m2.message + ")";
            return or;
        };

        matcher.and = function (m2) {
            if (!arguments.length) {
                throw new TypeError("Matcher expected");
            } else if (!isMatcher(m2)) {
                m2 = match(m2);
            }
            var m1 = this;
            var and = sinon.create(matcher);
            and.test = function (actual) {
                return m1.test(actual) && m2.test(actual);
            };
            and.message = m1.message + ".and(" + m2.message + ")";
            return and;
        };

        match.isMatcher = isMatcher;

        match.any = match(function () {
            return true;
        }, "any");

        match.defined = match(function (actual) {
            return actual !== null && actual !== undefined;
        }, "defined");

        match.truthy = match(function (actual) {
            return !!actual;
        }, "truthy");

        match.falsy = match(function (actual) {
            return !actual;
        }, "falsy");

        match.same = function (expectation) {
            return match(function (actual) {
                return expectation === actual;
            }, "same(" + expectation + ")");
        };

        match.typeOf = function (type) {
            assertType(type, "string", "type");
            return match(function (actual) {
                return sinon.typeOf(actual) === type;
            }, "typeOf(\"" + type + "\")");
        };

        match.instanceOf = function (type) {
            assertType(type, "function", "type");
            return match(function (actual) {
                return actual instanceof type;
            }, "instanceOf(" + sinon.functionName(type) + ")");
        };

        function createPropertyMatcher(propertyTest, messagePrefix) {
            return function (property, value) {
                assertType(property, "string", "property");
                var onlyProperty = arguments.length === 1;
                var message = messagePrefix + "(\"" + property + "\"";
                if (!onlyProperty) {
                    message += ", " + value;
                }
                message += ")";
                return match(function (actual) {
                    if (actual === undefined || actual === null ||
                            !propertyTest(actual, property)) {
                        return false;
                    }
                    return onlyProperty || sinon.deepEqual(value, actual[property]);
                }, message);
            };
        }

        match.has = createPropertyMatcher(function (actual, property) {
            if (typeof actual === "object") {
                return property in actual;
            }
            return actual[property] !== undefined;
        }, "has");

        match.hasOwn = createPropertyMatcher(function (actual, property) {
            return actual.hasOwnProperty(property);
        }, "hasOwn");

        match.bool = match.typeOf("boolean");
        match.number = match.typeOf("number");
        match.string = match.typeOf("string");
        match.object = match.typeOf("object");
        match.func = match.typeOf("function");
        match.array = match.typeOf("array");
        match.regexp = match.typeOf("regexp");
        match.date = match.typeOf("date");

        sinon.match = match;
        return match;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var sinon = require("./util/core");
        require("./typeOf");
        module.exports = makeApi(sinon);
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./typeOf":80,"./util/core":81}],73:[function(require,module,exports){
/**
 * @depend times_in_words.js
 * @depend util/core.js
 * @depend call.js
 * @depend extend.js
 * @depend match.js
 * @depend spy.js
 * @depend stub.js
 * @depend format.js
 */
/**
 * Mock functions.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal) {
    "use strict";

    function makeApi(sinon) {
        var push = [].push;
        var match = sinon.match;

        function mock(object) {
            // if (typeof console !== undefined && console.warn) {
            //     console.warn("mock will be removed from Sinon.JS v2.0");
            // }

            if (!object) {
                return sinon.expectation.create("Anonymous mock");
            }

            return mock.create(object);
        }

        function each(collection, callback) {
            if (!collection) {
                return;
            }

            for (var i = 0, l = collection.length; i < l; i += 1) {
                callback(collection[i]);
            }
        }

        function arrayEquals(arr1, arr2, compareLength) {
            if (compareLength && (arr1.length !== arr2.length)) {
                return false;
            }

            for (var i = 0, l = arr1.length; i < l; i++) {
                if (!sinon.deepEqual(arr1[i], arr2[i])) {
                    return false;
                }
            }
            return true;
        }

        sinon.extend(mock, {
            create: function create(object) {
                if (!object) {
                    throw new TypeError("object is null");
                }

                var mockObject = sinon.extend({}, mock);
                mockObject.object = object;
                delete mockObject.create;

                return mockObject;
            },

            expects: function expects(method) {
                if (!method) {
                    throw new TypeError("method is falsy");
                }

                if (!this.expectations) {
                    this.expectations = {};
                    this.proxies = [];
                }

                if (!this.expectations[method]) {
                    this.expectations[method] = [];
                    var mockObject = this;

                    sinon.wrapMethod(this.object, method, function () {
                        return mockObject.invokeMethod(method, this, arguments);
                    });

                    push.call(this.proxies, method);
                }

                var expectation = sinon.expectation.create(method);
                push.call(this.expectations[method], expectation);

                return expectation;
            },

            restore: function restore() {
                var object = this.object;

                each(this.proxies, function (proxy) {
                    if (typeof object[proxy].restore === "function") {
                        object[proxy].restore();
                    }
                });
            },

            verify: function verify() {
                var expectations = this.expectations || {};
                var messages = [];
                var met = [];

                each(this.proxies, function (proxy) {
                    each(expectations[proxy], function (expectation) {
                        if (!expectation.met()) {
                            push.call(messages, expectation.toString());
                        } else {
                            push.call(met, expectation.toString());
                        }
                    });
                });

                this.restore();

                if (messages.length > 0) {
                    sinon.expectation.fail(messages.concat(met).join("\n"));
                } else if (met.length > 0) {
                    sinon.expectation.pass(messages.concat(met).join("\n"));
                }

                return true;
            },

            invokeMethod: function invokeMethod(method, thisValue, args) {
                var expectations = this.expectations && this.expectations[method] ? this.expectations[method] : [];
                var expectationsWithMatchingArgs = [];
                var currentArgs = args || [];
                var i, available;

                for (i = 0; i < expectations.length; i += 1) {
                    var expectedArgs = expectations[i].expectedArguments || [];
                    if (arrayEquals(expectedArgs, currentArgs, expectations[i].expectsExactArgCount)) {
                        expectationsWithMatchingArgs.push(expectations[i]);
                    }
                }

                for (i = 0; i < expectationsWithMatchingArgs.length; i += 1) {
                    if (!expectationsWithMatchingArgs[i].met() &&
                        expectationsWithMatchingArgs[i].allowsCall(thisValue, args)) {
                        return expectationsWithMatchingArgs[i].apply(thisValue, args);
                    }
                }

                var messages = [];
                var exhausted = 0;

                for (i = 0; i < expectationsWithMatchingArgs.length; i += 1) {
                    if (expectationsWithMatchingArgs[i].allowsCall(thisValue, args)) {
                        available = available || expectationsWithMatchingArgs[i];
                    } else {
                        exhausted += 1;
                    }
                }

                if (available && exhausted === 0) {
                    return available.apply(thisValue, args);
                }

                for (i = 0; i < expectations.length; i += 1) {
                    push.call(messages, "    " + expectations[i].toString());
                }

                messages.unshift("Unexpected call: " + sinon.spyCall.toString.call({
                    proxy: method,
                    args: args
                }));

                sinon.expectation.fail(messages.join("\n"));
            }
        });

        var times = sinon.timesInWords;
        var slice = Array.prototype.slice;

        function callCountInWords(callCount) {
            if (callCount === 0) {
                return "never called";
            }

            return "called " + times(callCount);
        }

        function expectedCallCountInWords(expectation) {
            var min = expectation.minCalls;
            var max = expectation.maxCalls;

            if (typeof min === "number" && typeof max === "number") {
                var str = times(min);

                if (min !== max) {
                    str = "at least " + str + " and at most " + times(max);
                }

                return str;
            }

            if (typeof min === "number") {
                return "at least " + times(min);
            }

            return "at most " + times(max);
        }

        function receivedMinCalls(expectation) {
            var hasMinLimit = typeof expectation.minCalls === "number";
            return !hasMinLimit || expectation.callCount >= expectation.minCalls;
        }

        function receivedMaxCalls(expectation) {
            if (typeof expectation.maxCalls !== "number") {
                return false;
            }

            return expectation.callCount === expectation.maxCalls;
        }

        function verifyMatcher(possibleMatcher, arg) {
            var isMatcher = match && match.isMatcher(possibleMatcher);

            return isMatcher && possibleMatcher.test(arg) || true;
        }

        sinon.expectation = {
            minCalls: 1,
            maxCalls: 1,

            create: function create(methodName) {
                var expectation = sinon.extend(sinon.stub.create(), sinon.expectation);
                delete expectation.create;
                expectation.method = methodName;

                return expectation;
            },

            invoke: function invoke(func, thisValue, args) {
                this.verifyCallAllowed(thisValue, args);

                return sinon.spy.invoke.apply(this, arguments);
            },

            atLeast: function atLeast(num) {
                if (typeof num !== "number") {
                    throw new TypeError("'" + num + "' is not number");
                }

                if (!this.limitsSet) {
                    this.maxCalls = null;
                    this.limitsSet = true;
                }

                this.minCalls = num;

                return this;
            },

            atMost: function atMost(num) {
                if (typeof num !== "number") {
                    throw new TypeError("'" + num + "' is not number");
                }

                if (!this.limitsSet) {
                    this.minCalls = null;
                    this.limitsSet = true;
                }

                this.maxCalls = num;

                return this;
            },

            never: function never() {
                return this.exactly(0);
            },

            once: function once() {
                return this.exactly(1);
            },

            twice: function twice() {
                return this.exactly(2);
            },

            thrice: function thrice() {
                return this.exactly(3);
            },

            exactly: function exactly(num) {
                if (typeof num !== "number") {
                    throw new TypeError("'" + num + "' is not a number");
                }

                this.atLeast(num);
                return this.atMost(num);
            },

            met: function met() {
                return !this.failed && receivedMinCalls(this);
            },

            verifyCallAllowed: function verifyCallAllowed(thisValue, args) {
                if (receivedMaxCalls(this)) {
                    this.failed = true;
                    sinon.expectation.fail(this.method + " already called " + times(this.maxCalls));
                }

                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    sinon.expectation.fail(this.method + " called with " + thisValue + " as thisValue, expected " +
                        this.expectedThis);
                }

                if (!("expectedArguments" in this)) {
                    return;
                }

                if (!args) {
                    sinon.expectation.fail(this.method + " received no arguments, expected " +
                        sinon.format(this.expectedArguments));
                }

                if (args.length < this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too few arguments (" + sinon.format(args) +
                        "), expected " + sinon.format(this.expectedArguments));
                }

                if (this.expectsExactArgCount &&
                    args.length !== this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too many arguments (" + sinon.format(args) +
                        "), expected " + sinon.format(this.expectedArguments));
                }

                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {

                    if (!verifyMatcher(this.expectedArguments[i], args[i])) {
                        sinon.expectation.fail(this.method + " received wrong arguments " + sinon.format(args) +
                            ", didn't match " + this.expectedArguments.toString());
                    }

                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        sinon.expectation.fail(this.method + " received wrong arguments " + sinon.format(args) +
                            ", expected " + sinon.format(this.expectedArguments));
                    }
                }
            },

            allowsCall: function allowsCall(thisValue, args) {
                if (this.met() && receivedMaxCalls(this)) {
                    return false;
                }

                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    return false;
                }

                if (!("expectedArguments" in this)) {
                    return true;
                }

                args = args || [];

                if (args.length < this.expectedArguments.length) {
                    return false;
                }

                if (this.expectsExactArgCount &&
                    args.length !== this.expectedArguments.length) {
                    return false;
                }

                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {
                    if (!verifyMatcher(this.expectedArguments[i], args[i])) {
                        return false;
                    }

                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        return false;
                    }
                }

                return true;
            },

            withArgs: function withArgs() {
                this.expectedArguments = slice.call(arguments);
                return this;
            },

            withExactArgs: function withExactArgs() {
                this.withArgs.apply(this, arguments);
                this.expectsExactArgCount = true;
                return this;
            },

            on: function on(thisValue) {
                this.expectedThis = thisValue;
                return this;
            },

            toString: function () {
                var args = (this.expectedArguments || []).slice();

                if (!this.expectsExactArgCount) {
                    push.call(args, "[...]");
                }

                var callStr = sinon.spyCall.toString.call({
                    proxy: this.method || "anonymous mock expectation",
                    args: args
                });

                var message = callStr.replace(", [...", "[, ...") + " " +
                    expectedCallCountInWords(this);

                if (this.met()) {
                    return "Expectation met: " + message;
                }

                return "Expected " + message + " (" +
                    callCountInWords(this.callCount) + ")";
            },

            verify: function verify() {
                if (!this.met()) {
                    sinon.expectation.fail(this.toString());
                } else {
                    sinon.expectation.pass(this.toString());
                }

                return true;
            },

            pass: function pass(message) {
                sinon.assert.pass(message);
            },

            fail: function fail(message) {
                var exception = new Error(message);
                exception.name = "ExpectationError";

                throw exception;
            }
        };

        sinon.mock = mock;
        return mock;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var sinon = require("./util/core");
        require("./times_in_words");
        require("./call");
        require("./extend");
        require("./match");
        require("./spy");
        require("./stub");
        require("./format");

        module.exports = makeApi(sinon);
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./call":67,"./extend":69,"./format":70,"./match":72,"./spy":75,"./stub":76,"./times_in_words":79,"./util/core":81}],74:[function(require,module,exports){
/**
 * @depend util/core.js
 * @depend extend.js
 * @depend collection.js
 * @depend util/fake_timers.js
 * @depend util/fake_server_with_clock.js
 */
/**
 * Manages fake collections as well as fake utilities such as Sinon's
 * timers and fake XHR implementation in one convenient object.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal) {
    "use strict";

    function makeApi(sinon) {
        var push = [].push;

        function exposeValue(sandbox, config, key, value) {
            if (!value) {
                return;
            }

            if (config.injectInto && !(key in config.injectInto)) {
                config.injectInto[key] = value;
                sandbox.injectedKeys.push(key);
            } else {
                push.call(sandbox.args, value);
            }
        }

        function prepareSandboxFromConfig(config) {
            var sandbox = sinon.create(sinon.sandbox);

            if (config.useFakeServer) {
                if (typeof config.useFakeServer === "object") {
                    sandbox.serverPrototype = config.useFakeServer;
                }

                sandbox.useFakeServer();
            }

            if (config.useFakeTimers) {
                if (typeof config.useFakeTimers === "object") {
                    sandbox.useFakeTimers.apply(sandbox, config.useFakeTimers);
                } else {
                    sandbox.useFakeTimers();
                }
            }

            return sandbox;
        }

        sinon.sandbox = sinon.extend(sinon.create(sinon.collection), {
            useFakeTimers: function useFakeTimers() {
                this.clock = sinon.useFakeTimers.apply(sinon, arguments);

                return this.add(this.clock);
            },

            serverPrototype: sinon.fakeServer,

            useFakeServer: function useFakeServer() {
                var proto = this.serverPrototype || sinon.fakeServer;

                if (!proto || !proto.create) {
                    return null;
                }

                this.server = proto.create();
                return this.add(this.server);
            },

            inject: function (obj) {
                sinon.collection.inject.call(this, obj);

                if (this.clock) {
                    obj.clock = this.clock;
                }

                if (this.server) {
                    obj.server = this.server;
                    obj.requests = this.server.requests;
                }

                obj.match = sinon.match;

                return obj;
            },

            restore: function () {
                sinon.collection.restore.apply(this, arguments);
                this.restoreContext();
            },

            restoreContext: function () {
                if (this.injectedKeys) {
                    for (var i = 0, j = this.injectedKeys.length; i < j; i++) {
                        delete this.injectInto[this.injectedKeys[i]];
                    }
                    this.injectedKeys = [];
                }
            },

            create: function (config) {
                if (!config) {
                    return sinon.create(sinon.sandbox);
                }

                var sandbox = prepareSandboxFromConfig(config);
                sandbox.args = sandbox.args || [];
                sandbox.injectedKeys = [];
                sandbox.injectInto = config.injectInto;
                var prop,
                    value;
                var exposed = sandbox.inject({});

                if (config.properties) {
                    for (var i = 0, l = config.properties.length; i < l; i++) {
                        prop = config.properties[i];
                        value = exposed[prop] || prop === "sandbox" && sandbox;
                        exposeValue(sandbox, config, prop, value);
                    }
                } else {
                    exposeValue(sandbox, config, "sandbox", value);
                }

                return sandbox;
            },

            match: sinon.match
        });

        sinon.sandbox.useFakeXMLHttpRequest = sinon.sandbox.useFakeServer;

        return sinon.sandbox;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var sinon = require("./util/core");
        require("./extend");
        require("./util/fake_server_with_clock");
        require("./util/fake_timers");
        require("./collection");
        module.exports = makeApi(sinon);
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./collection":68,"./extend":69,"./util/core":81,"./util/fake_server_with_clock":84,"./util/fake_timers":85}],75:[function(require,module,exports){
/**
  * @depend times_in_words.js
  * @depend util/core.js
  * @depend extend.js
  * @depend call.js
  * @depend format.js
  */
/**
  * Spy functions
  *
  * @author Christian Johansen (christian@cjohansen.no)
  * @license BSD
  *
  * Copyright (c) 2010-2013 Christian Johansen
  */
(function (sinonGlobal) {
    "use strict";

    function makeApi(sinon) {
        var push = Array.prototype.push;
        var slice = Array.prototype.slice;
        var callId = 0;

        function spy(object, property, types) {
            if (!property && typeof object === "function") {
                return spy.create(object);
            }

            if (!object && !property) {
                return spy.create(function () { });
            }

            if (types) {
                var methodDesc = sinon.getPropertyDescriptor(object, property);
                for (var i = 0; i < types.length; i++) {
                    methodDesc[types[i]] = spy.create(methodDesc[types[i]]);
                }
                return sinon.wrapMethod(object, property, methodDesc);
            }

            return sinon.wrapMethod(object, property, spy.create(object[property]));
        }

        function matchingFake(fakes, args, strict) {
            if (!fakes) {
                return undefined;
            }

            for (var i = 0, l = fakes.length; i < l; i++) {
                if (fakes[i].matches(args, strict)) {
                    return fakes[i];
                }
            }
        }

        function incrementCallCount() {
            this.called = true;
            this.callCount += 1;
            this.notCalled = false;
            this.calledOnce = this.callCount === 1;
            this.calledTwice = this.callCount === 2;
            this.calledThrice = this.callCount === 3;
        }

        function createCallProperties() {
            this.firstCall = this.getCall(0);
            this.secondCall = this.getCall(1);
            this.thirdCall = this.getCall(2);
            this.lastCall = this.getCall(this.callCount - 1);
        }

        var vars = "a,b,c,d,e,f,g,h,i,j,k,l";
        function createProxy(func, proxyLength) {
            // Retain the function length:
            var p;
            if (proxyLength) {
                eval("p = (function proxy(" + vars.substring(0, proxyLength * 2 - 1) + // eslint-disable-line no-eval
                    ") { return p.invoke(func, this, slice.call(arguments)); });");
            } else {
                p = function proxy() {
                    return p.invoke(func, this, slice.call(arguments));
                };
            }
            p.isSinonProxy = true;
            return p;
        }

        var uuid = 0;

        // Public API
        var spyApi = {
            reset: function () {
                if (this.invoking) {
                    var err = new Error("Cannot reset Sinon function while invoking it. " +
                                        "Move the call to .reset outside of the callback.");
                    err.name = "InvalidResetException";
                    throw err;
                }

                this.called = false;
                this.notCalled = true;
                this.calledOnce = false;
                this.calledTwice = false;
                this.calledThrice = false;
                this.callCount = 0;
                this.firstCall = null;
                this.secondCall = null;
                this.thirdCall = null;
                this.lastCall = null;
                this.args = [];
                this.returnValues = [];
                this.thisValues = [];
                this.exceptions = [];
                this.callIds = [];
                this.stacks = [];
                if (this.fakes) {
                    for (var i = 0; i < this.fakes.length; i++) {
                        this.fakes[i].reset();
                    }
                }

                return this;
            },

            create: function create(func, spyLength) {
                var name;

                if (typeof func !== "function") {
                    func = function () { };
                } else {
                    name = sinon.functionName(func);
                }

                if (!spyLength) {
                    spyLength = func.length;
                }

                var proxy = createProxy(func, spyLength);

                sinon.extend(proxy, spy);
                delete proxy.create;
                sinon.extend(proxy, func);

                proxy.reset();
                proxy.prototype = func.prototype;
                proxy.displayName = name || "spy";
                proxy.toString = sinon.functionToString;
                proxy.instantiateFake = sinon.spy.create;
                proxy.id = "spy#" + uuid++;

                return proxy;
            },

            invoke: function invoke(func, thisValue, args) {
                var matching = matchingFake(this.fakes, args);
                var exception, returnValue;

                incrementCallCount.call(this);
                push.call(this.thisValues, thisValue);
                push.call(this.args, args);
                push.call(this.callIds, callId++);

                // Make call properties available from within the spied function:
                createCallProperties.call(this);

                try {
                    this.invoking = true;

                    if (matching) {
                        returnValue = matching.invoke(func, thisValue, args);
                    } else {
                        returnValue = (this.func || func).apply(thisValue, args);
                    }

                    var thisCall = this.getCall(this.callCount - 1);
                    if (thisCall.calledWithNew() && typeof returnValue !== "object") {
                        returnValue = thisValue;
                    }
                } catch (e) {
                    exception = e;
                } finally {
                    delete this.invoking;
                }

                push.call(this.exceptions, exception);
                push.call(this.returnValues, returnValue);
                push.call(this.stacks, new Error().stack);

                // Make return value and exception available in the calls:
                createCallProperties.call(this);

                if (exception !== undefined) {
                    throw exception;
                }

                return returnValue;
            },

            named: function named(name) {
                this.displayName = name;
                return this;
            },

            getCall: function getCall(i) {
                if (i < 0 || i >= this.callCount) {
                    return null;
                }

                return sinon.spyCall(this, this.thisValues[i], this.args[i],
                                        this.returnValues[i], this.exceptions[i],
                                        this.callIds[i], this.stacks[i]);
            },

            getCalls: function () {
                var calls = [];
                var i;

                for (i = 0; i < this.callCount; i++) {
                    calls.push(this.getCall(i));
                }

                return calls;
            },

            calledBefore: function calledBefore(spyFn) {
                if (!this.called) {
                    return false;
                }

                if (!spyFn.called) {
                    return true;
                }

                return this.callIds[0] < spyFn.callIds[spyFn.callIds.length - 1];
            },

            calledAfter: function calledAfter(spyFn) {
                if (!this.called || !spyFn.called) {
                    return false;
                }

                return this.callIds[this.callCount - 1] > spyFn.callIds[spyFn.callCount - 1];
            },

            withArgs: function () {
                var args = slice.call(arguments);

                if (this.fakes) {
                    var match = matchingFake(this.fakes, args, true);

                    if (match) {
                        return match;
                    }
                } else {
                    this.fakes = [];
                }

                var original = this;
                var fake = this.instantiateFake();
                fake.matchingAguments = args;
                fake.parent = this;
                push.call(this.fakes, fake);

                fake.withArgs = function () {
                    return original.withArgs.apply(original, arguments);
                };

                for (var i = 0; i < this.args.length; i++) {
                    if (fake.matches(this.args[i])) {
                        incrementCallCount.call(fake);
                        push.call(fake.thisValues, this.thisValues[i]);
                        push.call(fake.args, this.args[i]);
                        push.call(fake.returnValues, this.returnValues[i]);
                        push.call(fake.exceptions, this.exceptions[i]);
                        push.call(fake.callIds, this.callIds[i]);
                    }
                }
                createCallProperties.call(fake);

                return fake;
            },

            matches: function (args, strict) {
                var margs = this.matchingAguments;

                if (margs.length <= args.length &&
                    sinon.deepEqual(margs, args.slice(0, margs.length))) {
                    return !strict || margs.length === args.length;
                }
            },

            printf: function (format) {
                var spyInstance = this;
                var args = slice.call(arguments, 1);
                var formatter;

                return (format || "").replace(/%(.)/g, function (match, specifyer) {
                    formatter = spyApi.formatters[specifyer];

                    if (typeof formatter === "function") {
                        return formatter.call(null, spyInstance, args);
                    } else if (!isNaN(parseInt(specifyer, 10))) {
                        return sinon.format(args[specifyer - 1]);
                    }

                    return "%" + specifyer;
                });
            }
        };

        function delegateToCalls(method, matchAny, actual, notCalled) {
            spyApi[method] = function () {
                if (!this.called) {
                    if (notCalled) {
                        return notCalled.apply(this, arguments);
                    }
                    return false;
                }

                var currentCall;
                var matches = 0;

                for (var i = 0, l = this.callCount; i < l; i += 1) {
                    currentCall = this.getCall(i);

                    if (currentCall[actual || method].apply(currentCall, arguments)) {
                        matches += 1;

                        if (matchAny) {
                            return true;
                        }
                    }
                }

                return matches === this.callCount;
            };
        }

        delegateToCalls("calledOn", true);
        delegateToCalls("alwaysCalledOn", false, "calledOn");
        delegateToCalls("calledWith", true);
        delegateToCalls("calledWithMatch", true);
        delegateToCalls("alwaysCalledWith", false, "calledWith");
        delegateToCalls("alwaysCalledWithMatch", false, "calledWithMatch");
        delegateToCalls("calledWithExactly", true);
        delegateToCalls("alwaysCalledWithExactly", false, "calledWithExactly");
        delegateToCalls("neverCalledWith", false, "notCalledWith", function () {
            return true;
        });
        delegateToCalls("neverCalledWithMatch", false, "notCalledWithMatch", function () {
            return true;
        });
        delegateToCalls("threw", true);
        delegateToCalls("alwaysThrew", false, "threw");
        delegateToCalls("returned", true);
        delegateToCalls("alwaysReturned", false, "returned");
        delegateToCalls("calledWithNew", true);
        delegateToCalls("alwaysCalledWithNew", false, "calledWithNew");
        delegateToCalls("callArg", false, "callArgWith", function () {
            throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
        });
        spyApi.callArgWith = spyApi.callArg;
        delegateToCalls("callArgOn", false, "callArgOnWith", function () {
            throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
        });
        spyApi.callArgOnWith = spyApi.callArgOn;
        delegateToCalls("yield", false, "yield", function () {
            throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
        });
        // "invokeCallback" is an alias for "yield" since "yield" is invalid in strict mode.
        spyApi.invokeCallback = spyApi.yield;
        delegateToCalls("yieldOn", false, "yieldOn", function () {
            throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
        });
        delegateToCalls("yieldTo", false, "yieldTo", function (property) {
            throw new Error(this.toString() + " cannot yield to '" + property +
                "' since it was not yet invoked.");
        });
        delegateToCalls("yieldToOn", false, "yieldToOn", function (property) {
            throw new Error(this.toString() + " cannot yield to '" + property +
                "' since it was not yet invoked.");
        });

        spyApi.formatters = {
            c: function (spyInstance) {
                return sinon.timesInWords(spyInstance.callCount);
            },

            n: function (spyInstance) {
                return spyInstance.toString();
            },

            C: function (spyInstance) {
                var calls = [];

                for (var i = 0, l = spyInstance.callCount; i < l; ++i) {
                    var stringifiedCall = "    " + spyInstance.getCall(i).toString();
                    if (/\n/.test(calls[i - 1])) {
                        stringifiedCall = "\n" + stringifiedCall;
                    }
                    push.call(calls, stringifiedCall);
                }

                return calls.length > 0 ? "\n" + calls.join("\n") : "";
            },

            t: function (spyInstance) {
                var objects = [];

                for (var i = 0, l = spyInstance.callCount; i < l; ++i) {
                    push.call(objects, sinon.format(spyInstance.thisValues[i]));
                }

                return objects.join(", ");
            },

            "*": function (spyInstance, args) {
                var formatted = [];

                for (var i = 0, l = args.length; i < l; ++i) {
                    push.call(formatted, sinon.format(args[i]));
                }

                return formatted.join(", ");
            }
        };

        sinon.extend(spy, spyApi);

        spy.spyCall = sinon.spyCall;
        sinon.spy = spy;

        return spy;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var core = require("./util/core");
        require("./call");
        require("./extend");
        require("./times_in_words");
        require("./format");
        module.exports = makeApi(core);
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./call":67,"./extend":69,"./format":70,"./times_in_words":79,"./util/core":81}],76:[function(require,module,exports){
/**
 * @depend util/core.js
 * @depend extend.js
 * @depend spy.js
 * @depend behavior.js
 * @depend walk.js
 */
/**
 * Stub functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal) {
    "use strict";

    function makeApi(sinon) {
        function stub(object, property, func) {
            if (!!func && typeof func !== "function" && typeof func !== "object") {
                throw new TypeError("Custom stub should be a function or a property descriptor");
            }

            var wrapper;

            if (func) {
                if (typeof func === "function") {
                    wrapper = sinon.spy && sinon.spy.create ? sinon.spy.create(func) : func;
                } else {
                    wrapper = func;
                    if (sinon.spy && sinon.spy.create) {
                        var types = sinon.objectKeys(wrapper);
                        for (var i = 0; i < types.length; i++) {
                            wrapper[types[i]] = sinon.spy.create(wrapper[types[i]]);
                        }
                    }
                }
            } else {
                var stubLength = 0;
                if (typeof object === "object" && typeof object[property] === "function") {
                    stubLength = object[property].length;
                }
                wrapper = stub.create(stubLength);
            }

            if (!object && typeof property === "undefined") {
                return sinon.stub.create();
            }

            if (typeof property === "undefined" && typeof object === "object") {
                sinon.walk(object || {}, function (value, prop, propOwner) {
                    // we don't want to stub things like toString(), valueOf(), etc. so we only stub if the object
                    // is not Object.prototype
                    if (
                        propOwner !== Object.prototype &&
                        prop !== "constructor" &&
                        typeof sinon.getPropertyDescriptor(propOwner, prop).value === "function"
                    ) {
                        stub(object, prop);
                    }
                });

                return object;
            }

            return sinon.wrapMethod(object, property, wrapper);
        }


        /*eslint-disable no-use-before-define*/
        function getParentBehaviour(stubInstance) {
            return (stubInstance.parent && getCurrentBehavior(stubInstance.parent));
        }

        function getDefaultBehavior(stubInstance) {
            return stubInstance.defaultBehavior ||
                    getParentBehaviour(stubInstance) ||
                    sinon.behavior.create(stubInstance);
        }

        function getCurrentBehavior(stubInstance) {
            var behavior = stubInstance.behaviors[stubInstance.callCount - 1];
            return behavior && behavior.isPresent() ? behavior : getDefaultBehavior(stubInstance);
        }
        /*eslint-enable no-use-before-define*/

        var uuid = 0;

        var proto = {
            create: function create(stubLength) {
                var functionStub = function () {
                    return getCurrentBehavior(functionStub).invoke(this, arguments);
                };

                functionStub.id = "stub#" + uuid++;
                var orig = functionStub;
                functionStub = sinon.spy.create(functionStub, stubLength);
                functionStub.func = orig;

                sinon.extend(functionStub, stub);
                functionStub.instantiateFake = sinon.stub.create;
                functionStub.displayName = "stub";
                functionStub.toString = sinon.functionToString;

                functionStub.defaultBehavior = null;
                functionStub.behaviors = [];

                return functionStub;
            },

            resetBehavior: function () {
                var i;

                this.defaultBehavior = null;
                this.behaviors = [];

                delete this.returnValue;
                delete this.returnArgAt;
                this.returnThis = false;

                if (this.fakes) {
                    for (i = 0; i < this.fakes.length; i++) {
                        this.fakes[i].resetBehavior();
                    }
                }
            },

            onCall: function onCall(index) {
                if (!this.behaviors[index]) {
                    this.behaviors[index] = sinon.behavior.create(this);
                }

                return this.behaviors[index];
            },

            onFirstCall: function onFirstCall() {
                return this.onCall(0);
            },

            onSecondCall: function onSecondCall() {
                return this.onCall(1);
            },

            onThirdCall: function onThirdCall() {
                return this.onCall(2);
            }
        };

        function createBehavior(behaviorMethod) {
            return function () {
                this.defaultBehavior = this.defaultBehavior || sinon.behavior.create(this);
                this.defaultBehavior[behaviorMethod].apply(this.defaultBehavior, arguments);
                return this;
            };
        }

        for (var method in sinon.behavior) {
            if (sinon.behavior.hasOwnProperty(method) &&
                !proto.hasOwnProperty(method) &&
                method !== "create" &&
                method !== "withArgs" &&
                method !== "invoke") {
                proto[method] = createBehavior(method);
            }
        }

        sinon.extend(stub, proto);
        sinon.stub = stub;

        return stub;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var core = require("./util/core");
        require("./behavior");
        require("./spy");
        require("./extend");
        module.exports = makeApi(core);
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./behavior":66,"./extend":69,"./spy":75,"./util/core":81}],77:[function(require,module,exports){
/**
 * @depend util/core.js
 * @depend sandbox.js
 */
/**
 * Test function, sandboxes fakes
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal) {
    "use strict";

    function makeApi(sinon) {
        var slice = Array.prototype.slice;

        function test(callback) {
            var type = typeof callback;

            if (type !== "function") {
                throw new TypeError("sinon.test needs to wrap a test function, got " + type);
            }

            function sinonSandboxedTest() {
                var config = sinon.getConfig(sinon.config);
                config.injectInto = config.injectIntoThis && this || config.injectInto;
                var sandbox = sinon.sandbox.create(config);
                var args = slice.call(arguments);
                var oldDone = args.length && args[args.length - 1];
                var exception, result;

                if (typeof oldDone === "function") {
                    args[args.length - 1] = function sinonDone(res) {
                        if (res) {
                            sandbox.restore();
                        } else {
                            sandbox.verifyAndRestore();
                        }
                        oldDone(res);
                    };
                }

                try {
                    result = callback.apply(this, args.concat(sandbox.args));
                } catch (e) {
                    exception = e;
                }

                if (typeof exception !== "undefined") {
                    sandbox.restore();
                    throw exception;
                } else if (typeof oldDone !== "function") {
                    sandbox.verifyAndRestore();
                }

                return result;
            }

            if (callback.length) {
                return function sinonAsyncSandboxedTest(done) { // eslint-disable-line no-unused-vars
                    return sinonSandboxedTest.apply(this, arguments);
                };
            }

            return sinonSandboxedTest;
        }

        test.config = {
            injectIntoThis: true,
            injectInto: null,
            properties: ["spy", "stub", "mock", "clock", "server", "requests"],
            useFakeTimers: true,
            useFakeServer: true
        };

        sinon.test = test;
        return test;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var core = require("./util/core");
        require("./sandbox");
        module.exports = makeApi(core);
    }

    if (isAMD) {
        define(loadDependencies);
    } else if (isNode) {
        loadDependencies(require, module.exports, module);
    } else if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(typeof sinon === "object" && sinon || null)); // eslint-disable-line no-undef

},{"./sandbox":74,"./util/core":81}],78:[function(require,module,exports){
/**
 * @depend util/core.js
 * @depend test.js
 */
/**
 * Test case, sandboxes all test functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal) {
    "use strict";

    function createTest(property, setUp, tearDown) {
        return function () {
            if (setUp) {
                setUp.apply(this, arguments);
            }

            var exception, result;

            try {
                result = property.apply(this, arguments);
            } catch (e) {
                exception = e;
            }

            if (tearDown) {
                tearDown.apply(this, arguments);
            }

            if (exception) {
                throw exception;
            }

            return result;
        };
    }

    function makeApi(sinon) {
        function testCase(tests, prefix) {
            if (!tests || typeof tests !== "object") {
                throw new TypeError("sinon.testCase needs an object with test functions");
            }

            prefix = prefix || "test";
            var rPrefix = new RegExp("^" + prefix);
            var methods = {};
            var setUp = tests.setUp;
            var tearDown = tests.tearDown;
            var testName,
                property,
                method;

            for (testName in tests) {
                if (tests.hasOwnProperty(testName) && !/^(setUp|tearDown)$/.test(testName)) {
                    property = tests[testName];

                    if (typeof property === "function" && rPrefix.test(testName)) {
                        method = property;

                        if (setUp || tearDown) {
                            method = createTest(property, setUp, tearDown);
                        }

                        methods[testName] = sinon.test(method);
                    } else {
                        methods[testName] = tests[testName];
                    }
                }
            }

            return methods;
        }

        sinon.testCase = testCase;
        return testCase;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var core = require("./util/core");
        require("./test");
        module.exports = makeApi(core);
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./test":77,"./util/core":81}],79:[function(require,module,exports){
/**
 * @depend util/core.js
 */
(function (sinonGlobal) {
    "use strict";

    function makeApi(sinon) {

        function timesInWords(count) {
            switch (count) {
                case 1:
                    return "once";
                case 2:
                    return "twice";
                case 3:
                    return "thrice";
                default:
                    return (count || 0) + " times";
            }
        }

        sinon.timesInWords = timesInWords;
        return sinon.timesInWords;
    }

    function loadDependencies(require, exports, module) {
        var core = require("./util/core");
        module.exports = makeApi(core);
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./util/core":81}],80:[function(require,module,exports){
/**
 * @depend util/core.js
 */
/**
 * Format functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2014 Christian Johansen
 */
(function (sinonGlobal) {
    "use strict";

    function makeApi(sinon) {
        function typeOf(value) {
            if (value === null) {
                return "null";
            } else if (value === undefined) {
                return "undefined";
            }
            var string = Object.prototype.toString.call(value);
            return string.substring(8, string.length - 1).toLowerCase();
        }

        sinon.typeOf = typeOf;
        return sinon.typeOf;
    }

    function loadDependencies(require, exports, module) {
        var core = require("./util/core");
        module.exports = makeApi(core);
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./util/core":81}],81:[function(require,module,exports){
/**
 * @depend ../../sinon.js
 */
/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal) {
    "use strict";

    var div = typeof document !== "undefined" && document.createElement("div");
    var hasOwn = Object.prototype.hasOwnProperty;

    function isDOMNode(obj) {
        var success = false;

        try {
            obj.appendChild(div);
            success = div.parentNode === obj;
        } catch (e) {
            return false;
        } finally {
            try {
                obj.removeChild(div);
            } catch (e) {
                // Remove failed, not much we can do about that
            }
        }

        return success;
    }

    function isElement(obj) {
        return div && obj && obj.nodeType === 1 && isDOMNode(obj);
    }

    function isFunction(obj) {
        return typeof obj === "function" || !!(obj && obj.constructor && obj.call && obj.apply);
    }

    function isReallyNaN(val) {
        return typeof val === "number" && isNaN(val);
    }

    function mirrorProperties(target, source) {
        for (var prop in source) {
            if (!hasOwn.call(target, prop)) {
                target[prop] = source[prop];
            }
        }
    }

    function isRestorable(obj) {
        return typeof obj === "function" && typeof obj.restore === "function" && obj.restore.sinon;
    }

    // Cheap way to detect if we have ES5 support.
    var hasES5Support = "keys" in Object;

    function makeApi(sinon) {
        sinon.wrapMethod = function wrapMethod(object, property, method) {
            if (!object) {
                throw new TypeError("Should wrap property of object");
            }

            if (typeof method !== "function" && typeof method !== "object") {
                throw new TypeError("Method wrapper should be a function or a property descriptor");
            }

            function checkWrappedMethod(wrappedMethod) {
                var error;

                if (!isFunction(wrappedMethod)) {
                    error = new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
                                        property + " as function");
                } else if (wrappedMethod.restore && wrappedMethod.restore.sinon) {
                    error = new TypeError("Attempted to wrap " + property + " which is already wrapped");
                } else if (wrappedMethod.calledBefore) {
                    var verb = wrappedMethod.returns ? "stubbed" : "spied on";
                    error = new TypeError("Attempted to wrap " + property + " which is already " + verb);
                }

                if (error) {
                    if (wrappedMethod && wrappedMethod.stackTrace) {
                        error.stack += "\n--------------\n" + wrappedMethod.stackTrace;
                    }
                    throw error;
                }
            }

            var error, wrappedMethod, i;

            // IE 8 does not support hasOwnProperty on the window object and Firefox has a problem
            // when using hasOwn.call on objects from other frames.
            var owned = object.hasOwnProperty ? object.hasOwnProperty(property) : hasOwn.call(object, property);

            if (hasES5Support) {
                var methodDesc = (typeof method === "function") ? {value: method} : method;
                var wrappedMethodDesc = sinon.getPropertyDescriptor(object, property);

                if (!wrappedMethodDesc) {
                    error = new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
                                        property + " as function");
                } else if (wrappedMethodDesc.restore && wrappedMethodDesc.restore.sinon) {
                    error = new TypeError("Attempted to wrap " + property + " which is already wrapped");
                }
                if (error) {
                    if (wrappedMethodDesc && wrappedMethodDesc.stackTrace) {
                        error.stack += "\n--------------\n" + wrappedMethodDesc.stackTrace;
                    }
                    throw error;
                }

                var types = sinon.objectKeys(methodDesc);
                for (i = 0; i < types.length; i++) {
                    wrappedMethod = wrappedMethodDesc[types[i]];
                    checkWrappedMethod(wrappedMethod);
                }

                mirrorProperties(methodDesc, wrappedMethodDesc);
                for (i = 0; i < types.length; i++) {
                    mirrorProperties(methodDesc[types[i]], wrappedMethodDesc[types[i]]);
                }
                Object.defineProperty(object, property, methodDesc);
            } else {
                wrappedMethod = object[property];
                checkWrappedMethod(wrappedMethod);
                object[property] = method;
                method.displayName = property;
            }

            method.displayName = property;

            // Set up a stack trace which can be used later to find what line of
            // code the original method was created on.
            method.stackTrace = (new Error("Stack Trace for original")).stack;

            method.restore = function () {
                // For prototype properties try to reset by delete first.
                // If this fails (ex: localStorage on mobile safari) then force a reset
                // via direct assignment.
                if (!owned) {
                    // In some cases `delete` may throw an error
                    try {
                        delete object[property];
                    } catch (e) {} // eslint-disable-line no-empty
                    // For native code functions `delete` fails without throwing an error
                    // on Chrome < 43, PhantomJS, etc.
                } else if (hasES5Support) {
                    Object.defineProperty(object, property, wrappedMethodDesc);
                }

                // Use strict equality comparison to check failures then force a reset
                // via direct assignment.
                if (object[property] === method) {
                    object[property] = wrappedMethod;
                }
            };

            method.restore.sinon = true;

            if (!hasES5Support) {
                mirrorProperties(method, wrappedMethod);
            }

            return method;
        };

        sinon.create = function create(proto) {
            var F = function () {};
            F.prototype = proto;
            return new F();
        };

        sinon.deepEqual = function deepEqual(a, b) {
            if (sinon.match && sinon.match.isMatcher(a)) {
                return a.test(b);
            }

            if (typeof a !== "object" || typeof b !== "object") {
                return isReallyNaN(a) && isReallyNaN(b) || a === b;
            }

            if (isElement(a) || isElement(b)) {
                return a === b;
            }

            if (a === b) {
                return true;
            }

            if ((a === null && b !== null) || (a !== null && b === null)) {
                return false;
            }

            if (a instanceof RegExp && b instanceof RegExp) {
                return (a.source === b.source) && (a.global === b.global) &&
                    (a.ignoreCase === b.ignoreCase) && (a.multiline === b.multiline);
            }

            var aString = Object.prototype.toString.call(a);
            if (aString !== Object.prototype.toString.call(b)) {
                return false;
            }

            if (aString === "[object Date]") {
                return a.valueOf() === b.valueOf();
            }

            var prop;
            var aLength = 0;
            var bLength = 0;

            if (aString === "[object Array]" && a.length !== b.length) {
                return false;
            }

            for (prop in a) {
                if (hasOwn.call(a, prop)) {
                    aLength += 1;

                    if (!(prop in b)) {
                        return false;
                    }

                    if (!deepEqual(a[prop], b[prop])) {
                        return false;
                    }
                }
            }

            for (prop in b) {
                if (hasOwn.call(b, prop)) {
                    bLength += 1;
                }
            }

            return aLength === bLength;
        };

        sinon.functionName = function functionName(func) {
            var name = func.displayName || func.name;

            // Use function decomposition as a last resort to get function
            // name. Does not rely on function decomposition to work - if it
            // doesn't debugging will be slightly less informative
            // (i.e. toString will say 'spy' rather than 'myFunc').
            if (!name) {
                var matches = func.toString().match(/function ([^\s\(]+)/);
                name = matches && matches[1];
            }

            return name;
        };

        sinon.functionToString = function toString() {
            if (this.getCall && this.callCount) {
                var thisValue,
                    prop;
                var i = this.callCount;

                while (i--) {
                    thisValue = this.getCall(i).thisValue;

                    for (prop in thisValue) {
                        if (thisValue[prop] === this) {
                            return prop;
                        }
                    }
                }
            }

            return this.displayName || "sinon fake";
        };

        sinon.objectKeys = function objectKeys(obj) {
            if (obj !== Object(obj)) {
                throw new TypeError("sinon.objectKeys called on a non-object");
            }

            var keys = [];
            var key;
            for (key in obj) {
                if (hasOwn.call(obj, key)) {
                    keys.push(key);
                }
            }

            return keys;
        };

        sinon.getPropertyDescriptor = function getPropertyDescriptor(object, property) {
            var proto = object;
            var descriptor;

            while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto, property))) {
                proto = Object.getPrototypeOf(proto);
            }
            return descriptor;
        };

        sinon.getConfig = function (custom) {
            var config = {};
            custom = custom || {};
            var defaults = sinon.defaultConfig;

            for (var prop in defaults) {
                if (defaults.hasOwnProperty(prop)) {
                    config[prop] = custom.hasOwnProperty(prop) ? custom[prop] : defaults[prop];
                }
            }

            return config;
        };

        sinon.defaultConfig = {
            injectIntoThis: true,
            injectInto: null,
            properties: ["spy", "stub", "mock", "clock", "server", "requests"],
            useFakeTimers: true,
            useFakeServer: true
        };

        sinon.timesInWords = function timesInWords(count) {
            return count === 1 && "once" ||
                count === 2 && "twice" ||
                count === 3 && "thrice" ||
                (count || 0) + " times";
        };

        sinon.calledInOrder = function (spies) {
            for (var i = 1, l = spies.length; i < l; i++) {
                if (!spies[i - 1].calledBefore(spies[i]) || !spies[i].called) {
                    return false;
                }
            }

            return true;
        };

        sinon.orderByFirstCall = function (spies) {
            return spies.sort(function (a, b) {
                // uuid, won't ever be equal
                var aCall = a.getCall(0);
                var bCall = b.getCall(0);
                var aId = aCall && aCall.callId || -1;
                var bId = bCall && bCall.callId || -1;

                return aId < bId ? -1 : 1;
            });
        };

        sinon.createStubInstance = function (constructor) {
            if (typeof constructor !== "function") {
                throw new TypeError("The constructor should be a function.");
            }
            return sinon.stub(sinon.create(constructor.prototype));
        };

        sinon.restore = function (object) {
            if (object !== null && typeof object === "object") {
                for (var prop in object) {
                    if (isRestorable(object[prop])) {
                        object[prop].restore();
                    }
                }
            } else if (isRestorable(object)) {
                object.restore();
            }
        };

        return sinon;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports) {
        makeApi(exports);
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{}],82:[function(require,module,exports){
/**
 * Minimal Event interface implementation
 *
 * Original implementation by Sven Fuchs: https://gist.github.com/995028
 * Modifications and tests by Christian Johansen.
 *
 * @author Sven Fuchs (svenfuchs@artweb-design.de)
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2011 Sven Fuchs, Christian Johansen
 */
if (typeof sinon === "undefined") {
    this.sinon = {};
}

(function () {
    "use strict";

    var push = [].push;

    function makeApi(sinon) {
        sinon.Event = function Event(type, bubbles, cancelable, target) {
            this.initEvent(type, bubbles, cancelable, target);
        };

        sinon.Event.prototype = {
            initEvent: function (type, bubbles, cancelable, target) {
                this.type = type;
                this.bubbles = bubbles;
                this.cancelable = cancelable;
                this.target = target;
            },

            stopPropagation: function () {},

            preventDefault: function () {
                this.defaultPrevented = true;
            }
        };

        sinon.ProgressEvent = function ProgressEvent(type, progressEventRaw, target) {
            this.initEvent(type, false, false, target);
            this.loaded = typeof progressEventRaw.loaded === "number" ? progressEventRaw.loaded : null;
            this.total = typeof progressEventRaw.total === "number" ? progressEventRaw.total : null;
            this.lengthComputable = !!progressEventRaw.total;
        };

        sinon.ProgressEvent.prototype = new sinon.Event();

        sinon.ProgressEvent.prototype.constructor = sinon.ProgressEvent;

        sinon.CustomEvent = function CustomEvent(type, customData, target) {
            this.initEvent(type, false, false, target);
            this.detail = customData.detail || null;
        };

        sinon.CustomEvent.prototype = new sinon.Event();

        sinon.CustomEvent.prototype.constructor = sinon.CustomEvent;

        sinon.EventTarget = {
            addEventListener: function addEventListener(event, listener) {
                this.eventListeners = this.eventListeners || {};
                this.eventListeners[event] = this.eventListeners[event] || [];
                push.call(this.eventListeners[event], listener);
            },

            removeEventListener: function removeEventListener(event, listener) {
                var listeners = this.eventListeners && this.eventListeners[event] || [];

                for (var i = 0, l = listeners.length; i < l; ++i) {
                    if (listeners[i] === listener) {
                        return listeners.splice(i, 1);
                    }
                }
            },

            dispatchEvent: function dispatchEvent(event) {
                var type = event.type;
                var listeners = this.eventListeners && this.eventListeners[type] || [];

                for (var i = 0; i < listeners.length; i++) {
                    if (typeof listeners[i] === "function") {
                        listeners[i].call(this, event);
                    } else {
                        listeners[i].handleEvent(event);
                    }
                }

                return !!event.defaultPrevented;
            }
        };
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require) {
        var sinon = require("./core");
        makeApi(sinon);
    }

    if (isAMD) {
        define(loadDependencies);
    } else if (isNode) {
        loadDependencies(require);
    } else {
        makeApi(sinon); // eslint-disable-line no-undef
    }
}());

},{"./core":81}],83:[function(require,module,exports){
/**
 * @depend fake_xdomain_request.js
 * @depend fake_xml_http_request.js
 * @depend ../format.js
 * @depend ../log_error.js
 */
/**
 * The Sinon "server" mimics a web server that receives requests from
 * sinon.FakeXMLHttpRequest and provides an API to respond to those requests,
 * both synchronously and asynchronously. To respond synchronuously, canned
 * answers have to be provided upfront.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function () {
    "use strict";

    var push = [].push;

    function responseArray(handler) {
        var response = handler;

        if (Object.prototype.toString.call(handler) !== "[object Array]") {
            response = [200, {}, handler];
        }

        if (typeof response[2] !== "string") {
            throw new TypeError("Fake server response body should be string, but was " +
                                typeof response[2]);
        }

        return response;
    }

    var wloc = typeof window !== "undefined" ? window.location : {};
    var rCurrLoc = new RegExp("^" + wloc.protocol + "//" + wloc.host);

    function matchOne(response, reqMethod, reqUrl) {
        var rmeth = response.method;
        var matchMethod = !rmeth || rmeth.toLowerCase() === reqMethod.toLowerCase();
        var url = response.url;
        var matchUrl = !url || url === reqUrl || (typeof url.test === "function" && url.test(reqUrl));

        return matchMethod && matchUrl;
    }

    function match(response, request) {
        var requestUrl = request.url;

        if (!/^https?:\/\//.test(requestUrl) || rCurrLoc.test(requestUrl)) {
            requestUrl = requestUrl.replace(rCurrLoc, "");
        }

        if (matchOne(response, this.getHTTPMethod(request), requestUrl)) {
            if (typeof response.response === "function") {
                var ru = response.url;
                var args = [request].concat(ru && typeof ru.exec === "function" ? ru.exec(requestUrl).slice(1) : []);
                return response.response.apply(response, args);
            }

            return true;
        }

        return false;
    }

    function makeApi(sinon) {
        sinon.fakeServer = {
            create: function (config) {
                var server = sinon.create(this);
                server.configure(config);
                if (!sinon.xhr.supportsCORS) {
                    this.xhr = sinon.useFakeXDomainRequest();
                } else {
                    this.xhr = sinon.useFakeXMLHttpRequest();
                }
                server.requests = [];

                this.xhr.onCreate = function (xhrObj) {
                    server.addRequest(xhrObj);
                };

                return server;
            },
            configure: function (config) {
                var whitelist = {
                    "autoRespond": true,
                    "autoRespondAfter": true,
                    "respondImmediately": true,
                    "fakeHTTPMethods": true
                };
                var setting;

                config = config || {};
                for (setting in config) {
                    if (whitelist.hasOwnProperty(setting) && config.hasOwnProperty(setting)) {
                        this[setting] = config[setting];
                    }
                }
            },
            addRequest: function addRequest(xhrObj) {
                var server = this;
                push.call(this.requests, xhrObj);

                xhrObj.onSend = function () {
                    server.handleRequest(this);

                    if (server.respondImmediately) {
                        server.respond();
                    } else if (server.autoRespond && !server.responding) {
                        setTimeout(function () {
                            server.responding = false;
                            server.respond();
                        }, server.autoRespondAfter || 10);

                        server.responding = true;
                    }
                };
            },

            getHTTPMethod: function getHTTPMethod(request) {
                if (this.fakeHTTPMethods && /post/i.test(request.method)) {
                    var matches = (request.requestBody || "").match(/_method=([^\b;]+)/);
                    return matches ? matches[1] : request.method;
                }

                return request.method;
            },

            handleRequest: function handleRequest(xhr) {
                if (xhr.async) {
                    if (!this.queue) {
                        this.queue = [];
                    }

                    push.call(this.queue, xhr);
                } else {
                    this.processRequest(xhr);
                }
            },

            log: function log(response, request) {
                var str;

                str = "Request:\n" + sinon.format(request) + "\n\n";
                str += "Response:\n" + sinon.format(response) + "\n\n";

                sinon.log(str);
            },

            respondWith: function respondWith(method, url, body) {
                if (arguments.length === 1 && typeof method !== "function") {
                    this.response = responseArray(method);
                    return;
                }

                if (!this.responses) {
                    this.responses = [];
                }

                if (arguments.length === 1) {
                    body = method;
                    url = method = null;
                }

                if (arguments.length === 2) {
                    body = url;
                    url = method;
                    method = null;
                }

                push.call(this.responses, {
                    method: method,
                    url: url,
                    response: typeof body === "function" ? body : responseArray(body)
                });
            },

            respond: function respond() {
                if (arguments.length > 0) {
                    this.respondWith.apply(this, arguments);
                }

                var queue = this.queue || [];
                var requests = queue.splice(0, queue.length);

                for (var i = 0; i < requests.length; i++) {
                    this.processRequest(requests[i]);
                }
            },

            processRequest: function processRequest(request) {
                try {
                    if (request.aborted) {
                        return;
                    }

                    var response = this.response || [404, {}, ""];

                    if (this.responses) {
                        for (var l = this.responses.length, i = l - 1; i >= 0; i--) {
                            if (match.call(this, this.responses[i], request)) {
                                response = this.responses[i].response;
                                break;
                            }
                        }
                    }

                    if (request.readyState !== 4) {
                        this.log(response, request);

                        request.respond(response[0], response[1], response[2]);
                    }
                } catch (e) {
                    sinon.logError("Fake server request processing", e);
                }
            },

            restore: function restore() {
                return this.xhr.restore && this.xhr.restore.apply(this.xhr, arguments);
            }
        };
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var sinon = require("./core");
        require("./fake_xdomain_request");
        require("./fake_xml_http_request");
        require("../format");
        makeApi(sinon);
        module.exports = sinon;
    }

    if (isAMD) {
        define(loadDependencies);
    } else if (isNode) {
        loadDependencies(require, module.exports, module);
    } else {
        makeApi(sinon); // eslint-disable-line no-undef
    }
}());

},{"../format":70,"./core":81,"./fake_xdomain_request":86,"./fake_xml_http_request":87}],84:[function(require,module,exports){
/**
 * @depend fake_server.js
 * @depend fake_timers.js
 */
/**
 * Add-on for sinon.fakeServer that automatically handles a fake timer along with
 * the FakeXMLHttpRequest. The direct inspiration for this add-on is jQuery
 * 1.3.x, which does not use xhr object's onreadystatehandler at all - instead,
 * it polls the object for completion with setInterval. Dispite the direct
 * motivation, there is nothing jQuery-specific in this file, so it can be used
 * in any environment where the ajax implementation depends on setInterval or
 * setTimeout.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function () {
    "use strict";

    function makeApi(sinon) {
        function Server() {}
        Server.prototype = sinon.fakeServer;

        sinon.fakeServerWithClock = new Server();

        sinon.fakeServerWithClock.addRequest = function addRequest(xhr) {
            if (xhr.async) {
                if (typeof setTimeout.clock === "object") {
                    this.clock = setTimeout.clock;
                } else {
                    this.clock = sinon.useFakeTimers();
                    this.resetClock = true;
                }

                if (!this.longestTimeout) {
                    var clockSetTimeout = this.clock.setTimeout;
                    var clockSetInterval = this.clock.setInterval;
                    var server = this;

                    this.clock.setTimeout = function (fn, timeout) {
                        server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);

                        return clockSetTimeout.apply(this, arguments);
                    };

                    this.clock.setInterval = function (fn, timeout) {
                        server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);

                        return clockSetInterval.apply(this, arguments);
                    };
                }
            }

            return sinon.fakeServer.addRequest.call(this, xhr);
        };

        sinon.fakeServerWithClock.respond = function respond() {
            var returnVal = sinon.fakeServer.respond.apply(this, arguments);

            if (this.clock) {
                this.clock.tick(this.longestTimeout || 0);
                this.longestTimeout = 0;

                if (this.resetClock) {
                    this.clock.restore();
                    this.resetClock = false;
                }
            }

            return returnVal;
        };

        sinon.fakeServerWithClock.restore = function restore() {
            if (this.clock) {
                this.clock.restore();
            }

            return sinon.fakeServer.restore.apply(this, arguments);
        };
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require) {
        var sinon = require("./core");
        require("./fake_server");
        require("./fake_timers");
        makeApi(sinon);
    }

    if (isAMD) {
        define(loadDependencies);
    } else if (isNode) {
        loadDependencies(require);
    } else {
        makeApi(sinon); // eslint-disable-line no-undef
    }
}());

},{"./core":81,"./fake_server":83,"./fake_timers":85}],85:[function(require,module,exports){
/**
 * Fake timer API
 * setTimeout
 * setInterval
 * clearTimeout
 * clearInterval
 * tick
 * reset
 * Date
 *
 * Inspired by jsUnitMockTimeOut from JsUnit
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function () {
    "use strict";

    function makeApi(s, lol) {
        /*global lolex */
        var llx = typeof lolex !== "undefined" ? lolex : lol;

        s.useFakeTimers = function () {
            var now;
            var methods = Array.prototype.slice.call(arguments);

            if (typeof methods[0] === "string") {
                now = 0;
            } else {
                now = methods.shift();
            }

            var clock = llx.install(now || 0, methods);
            clock.restore = clock.uninstall;
            return clock;
        };

        s.clock = {
            create: function (now) {
                return llx.createClock(now);
            }
        };

        s.timers = {
            setTimeout: setTimeout,
            clearTimeout: clearTimeout,
            setImmediate: (typeof setImmediate !== "undefined" ? setImmediate : undefined),
            clearImmediate: (typeof clearImmediate !== "undefined" ? clearImmediate : undefined),
            setInterval: setInterval,
            clearInterval: clearInterval,
            Date: Date
        };
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, epxorts, module, lolex) {
        var core = require("./core");
        makeApi(core, lolex);
        module.exports = core;
    }

    if (isAMD) {
        define(loadDependencies);
    } else if (isNode) {
        loadDependencies(require, module.exports, module, require("lolex"));
    } else {
        makeApi(sinon); // eslint-disable-line no-undef
    }
}());

},{"./core":81,"lolex":60}],86:[function(require,module,exports){
(function (global){
/**
 * @depend core.js
 * @depend ../extend.js
 * @depend event.js
 * @depend ../log_error.js
 */
/**
 * Fake XDomainRequest object
 */

/**
 * Returns the global to prevent assigning values to 'this' when this is undefined.
 * This can occur when files are interpreted by node in strict mode.
 * @private
 */
function getGlobal() {
    "use strict";

    return typeof window !== "undefined" ? window : global;
}

if (typeof sinon === "undefined") {
    if (typeof this === "undefined") {
        getGlobal().sinon = {};
    } else {
        this.sinon = {};
    }
}

// wrapper for global
(function (global) {
    "use strict";

    var xdr = { XDomainRequest: global.XDomainRequest };
    xdr.GlobalXDomainRequest = global.XDomainRequest;
    xdr.supportsXDR = typeof xdr.GlobalXDomainRequest !== "undefined";
    xdr.workingXDR = xdr.supportsXDR ? xdr.GlobalXDomainRequest : false;

    function makeApi(sinon) {
        sinon.xdr = xdr;

        function FakeXDomainRequest() {
            this.readyState = FakeXDomainRequest.UNSENT;
            this.requestBody = null;
            this.requestHeaders = {};
            this.status = 0;
            this.timeout = null;

            if (typeof FakeXDomainRequest.onCreate === "function") {
                FakeXDomainRequest.onCreate(this);
            }
        }

        function verifyState(x) {
            if (x.readyState !== FakeXDomainRequest.OPENED) {
                throw new Error("INVALID_STATE_ERR");
            }

            if (x.sendFlag) {
                throw new Error("INVALID_STATE_ERR");
            }
        }

        function verifyRequestSent(x) {
            if (x.readyState === FakeXDomainRequest.UNSENT) {
                throw new Error("Request not sent");
            }
            if (x.readyState === FakeXDomainRequest.DONE) {
                throw new Error("Request done");
            }
        }

        function verifyResponseBodyType(body) {
            if (typeof body !== "string") {
                var error = new Error("Attempted to respond to fake XDomainRequest with " +
                                    body + ", which is not a string.");
                error.name = "InvalidBodyException";
                throw error;
            }
        }

        sinon.extend(FakeXDomainRequest.prototype, sinon.EventTarget, {
            open: function open(method, url) {
                this.method = method;
                this.url = url;

                this.responseText = null;
                this.sendFlag = false;

                this.readyStateChange(FakeXDomainRequest.OPENED);
            },

            readyStateChange: function readyStateChange(state) {
                this.readyState = state;
                var eventName = "";
                switch (this.readyState) {
                case FakeXDomainRequest.UNSENT:
                    break;
                case FakeXDomainRequest.OPENED:
                    break;
                case FakeXDomainRequest.LOADING:
                    if (this.sendFlag) {
                        //raise the progress event
                        eventName = "onprogress";
                    }
                    break;
                case FakeXDomainRequest.DONE:
                    if (this.isTimeout) {
                        eventName = "ontimeout";
                    } else if (this.errorFlag || (this.status < 200 || this.status > 299)) {
                        eventName = "onerror";
                    } else {
                        eventName = "onload";
                    }
                    break;
                }

                // raising event (if defined)
                if (eventName) {
                    if (typeof this[eventName] === "function") {
                        try {
                            this[eventName]();
                        } catch (e) {
                            sinon.logError("Fake XHR " + eventName + " handler", e);
                        }
                    }
                }
            },

            send: function send(data) {
                verifyState(this);

                if (!/^(get|head)$/i.test(this.method)) {
                    this.requestBody = data;
                }
                this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";

                this.errorFlag = false;
                this.sendFlag = true;
                this.readyStateChange(FakeXDomainRequest.OPENED);

                if (typeof this.onSend === "function") {
                    this.onSend(this);
                }
            },

            abort: function abort() {
                this.aborted = true;
                this.responseText = null;
                this.errorFlag = true;

                if (this.readyState > sinon.FakeXDomainRequest.UNSENT && this.sendFlag) {
                    this.readyStateChange(sinon.FakeXDomainRequest.DONE);
                    this.sendFlag = false;
                }
            },

            setResponseBody: function setResponseBody(body) {
                verifyRequestSent(this);
                verifyResponseBodyType(body);

                var chunkSize = this.chunkSize || 10;
                var index = 0;
                this.responseText = "";

                do {
                    this.readyStateChange(FakeXDomainRequest.LOADING);
                    this.responseText += body.substring(index, index + chunkSize);
                    index += chunkSize;
                } while (index < body.length);

                this.readyStateChange(FakeXDomainRequest.DONE);
            },

            respond: function respond(status, contentType, body) {
                // content-type ignored, since XDomainRequest does not carry this
                // we keep the same syntax for respond(...) as for FakeXMLHttpRequest to ease
                // test integration across browsers
                this.status = typeof status === "number" ? status : 200;
                this.setResponseBody(body || "");
            },

            simulatetimeout: function simulatetimeout() {
                this.status = 0;
                this.isTimeout = true;
                // Access to this should actually throw an error
                this.responseText = undefined;
                this.readyStateChange(FakeXDomainRequest.DONE);
            }
        });

        sinon.extend(FakeXDomainRequest, {
            UNSENT: 0,
            OPENED: 1,
            LOADING: 3,
            DONE: 4
        });

        sinon.useFakeXDomainRequest = function useFakeXDomainRequest() {
            sinon.FakeXDomainRequest.restore = function restore(keepOnCreate) {
                if (xdr.supportsXDR) {
                    global.XDomainRequest = xdr.GlobalXDomainRequest;
                }

                delete sinon.FakeXDomainRequest.restore;

                if (keepOnCreate !== true) {
                    delete sinon.FakeXDomainRequest.onCreate;
                }
            };
            if (xdr.supportsXDR) {
                global.XDomainRequest = sinon.FakeXDomainRequest;
            }
            return sinon.FakeXDomainRequest;
        };

        sinon.FakeXDomainRequest = FakeXDomainRequest;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var sinon = require("./core");
        require("../extend");
        require("./event");
        require("../log_error");
        makeApi(sinon);
        module.exports = sinon;
    }

    if (isAMD) {
        define(loadDependencies);
    } else if (isNode) {
        loadDependencies(require, module.exports, module);
    } else {
        makeApi(sinon); // eslint-disable-line no-undef
    }
})(typeof global !== "undefined" ? global : self);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../extend":69,"../log_error":71,"./core":81,"./event":82}],87:[function(require,module,exports){
(function (global){
/**
 * @depend core.js
 * @depend ../extend.js
 * @depend event.js
 * @depend ../log_error.js
 */
/**
 * Fake XMLHttpRequest object
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal, global) {
    "use strict";

    function getWorkingXHR(globalScope) {
        var supportsXHR = typeof globalScope.XMLHttpRequest !== "undefined";
        if (supportsXHR) {
            return globalScope.XMLHttpRequest;
        }

        var supportsActiveX = typeof globalScope.ActiveXObject !== "undefined";
        if (supportsActiveX) {
            return function () {
                return new globalScope.ActiveXObject("MSXML2.XMLHTTP.3.0");
            };
        }

        return false;
    }

    var supportsProgress = typeof ProgressEvent !== "undefined";
    var supportsCustomEvent = typeof CustomEvent !== "undefined";
    var supportsFormData = typeof FormData !== "undefined";
    var supportsArrayBuffer = typeof ArrayBuffer !== "undefined";
    var supportsBlob = (function () {
        try {
            return !!new Blob();
        } catch (e) {
            return false;
        }
    })();
    var sinonXhr = { XMLHttpRequest: global.XMLHttpRequest };
    sinonXhr.GlobalXMLHttpRequest = global.XMLHttpRequest;
    sinonXhr.GlobalActiveXObject = global.ActiveXObject;
    sinonXhr.supportsActiveX = typeof sinonXhr.GlobalActiveXObject !== "undefined";
    sinonXhr.supportsXHR = typeof sinonXhr.GlobalXMLHttpRequest !== "undefined";
    sinonXhr.workingXHR = getWorkingXHR(global);
    sinonXhr.supportsCORS = sinonXhr.supportsXHR && "withCredentials" in (new sinonXhr.GlobalXMLHttpRequest());

    var unsafeHeaders = {
        "Accept-Charset": true,
        "Accept-Encoding": true,
        Connection: true,
        "Content-Length": true,
        Cookie: true,
        Cookie2: true,
        "Content-Transfer-Encoding": true,
        Date: true,
        Expect: true,
        Host: true,
        "Keep-Alive": true,
        Referer: true,
        TE: true,
        Trailer: true,
        "Transfer-Encoding": true,
        Upgrade: true,
        "User-Agent": true,
        Via: true
    };

    // An upload object is created for each
    // FakeXMLHttpRequest and allows upload
    // events to be simulated using uploadProgress
    // and uploadError.
    function UploadProgress() {
        this.eventListeners = {
            abort: [],
            error: [],
            load: [],
            loadend: [],
            progress: []
        };
    }

    UploadProgress.prototype.addEventListener = function addEventListener(event, listener) {
        this.eventListeners[event].push(listener);
    };

    UploadProgress.prototype.removeEventListener = function removeEventListener(event, listener) {
        var listeners = this.eventListeners[event] || [];

        for (var i = 0, l = listeners.length; i < l; ++i) {
            if (listeners[i] === listener) {
                return listeners.splice(i, 1);
            }
        }
    };

    UploadProgress.prototype.dispatchEvent = function dispatchEvent(event) {
        var listeners = this.eventListeners[event.type] || [];

        for (var i = 0, listener; (listener = listeners[i]) != null; i++) {
            listener(event);
        }
    };

    // Note that for FakeXMLHttpRequest to work pre ES5
    // we lose some of the alignment with the spec.
    // To ensure as close a match as possible,
    // set responseType before calling open, send or respond;
    function FakeXMLHttpRequest() {
        this.readyState = FakeXMLHttpRequest.UNSENT;
        this.requestHeaders = {};
        this.requestBody = null;
        this.status = 0;
        this.statusText = "";
        this.upload = new UploadProgress();
        this.responseType = "";
        this.response = "";
        if (sinonXhr.supportsCORS) {
            this.withCredentials = false;
        }

        var xhr = this;
        var events = ["loadstart", "load", "abort", "error", "loadend"];

        function addEventListener(eventName) {
            xhr.addEventListener(eventName, function (event) {
                var listener = xhr["on" + eventName];

                if (listener && typeof listener === "function") {
                    listener.call(this, event);
                }
            });
        }

        for (var i = events.length - 1; i >= 0; i--) {
            addEventListener(events[i]);
        }

        if (typeof FakeXMLHttpRequest.onCreate === "function") {
            FakeXMLHttpRequest.onCreate(this);
        }
    }

    function verifyState(xhr) {
        if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
            throw new Error("INVALID_STATE_ERR");
        }

        if (xhr.sendFlag) {
            throw new Error("INVALID_STATE_ERR");
        }
    }

    function getHeader(headers, header) {
        header = header.toLowerCase();

        for (var h in headers) {
            if (h.toLowerCase() === header) {
                return h;
            }
        }

        return null;
    }

    // filtering to enable a white-list version of Sinon FakeXhr,
    // where whitelisted requests are passed through to real XHR
    function each(collection, callback) {
        if (!collection) {
            return;
        }

        for (var i = 0, l = collection.length; i < l; i += 1) {
            callback(collection[i]);
        }
    }
    function some(collection, callback) {
        for (var index = 0; index < collection.length; index++) {
            if (callback(collection[index]) === true) {
                return true;
            }
        }
        return false;
    }
    // largest arity in XHR is 5 - XHR#open
    var apply = function (obj, method, args) {
        switch (args.length) {
        case 0: return obj[method]();
        case 1: return obj[method](args[0]);
        case 2: return obj[method](args[0], args[1]);
        case 3: return obj[method](args[0], args[1], args[2]);
        case 4: return obj[method](args[0], args[1], args[2], args[3]);
        case 5: return obj[method](args[0], args[1], args[2], args[3], args[4]);
        }
    };

    FakeXMLHttpRequest.filters = [];
    FakeXMLHttpRequest.addFilter = function addFilter(fn) {
        this.filters.push(fn);
    };
    var IE6Re = /MSIE 6/;
    FakeXMLHttpRequest.defake = function defake(fakeXhr, xhrArgs) {
        var xhr = new sinonXhr.workingXHR(); // eslint-disable-line new-cap

        each([
            "open",
            "setRequestHeader",
            "send",
            "abort",
            "getResponseHeader",
            "getAllResponseHeaders",
            "addEventListener",
            "overrideMimeType",
            "removeEventListener"
        ], function (method) {
            fakeXhr[method] = function () {
                return apply(xhr, method, arguments);
            };
        });

        var copyAttrs = function (args) {
            each(args, function (attr) {
                try {
                    fakeXhr[attr] = xhr[attr];
                } catch (e) {
                    if (!IE6Re.test(navigator.userAgent)) {
                        throw e;
                    }
                }
            });
        };

        var stateChange = function stateChange() {
            fakeXhr.readyState = xhr.readyState;
            if (xhr.readyState >= FakeXMLHttpRequest.HEADERS_RECEIVED) {
                copyAttrs(["status", "statusText"]);
            }
            if (xhr.readyState >= FakeXMLHttpRequest.LOADING) {
                copyAttrs(["responseText", "response"]);
            }
            if (xhr.readyState === FakeXMLHttpRequest.DONE) {
                copyAttrs(["responseXML"]);
            }
            if (fakeXhr.onreadystatechange) {
                fakeXhr.onreadystatechange.call(fakeXhr, { target: fakeXhr });
            }
        };

        if (xhr.addEventListener) {
            for (var event in fakeXhr.eventListeners) {
                if (fakeXhr.eventListeners.hasOwnProperty(event)) {

                    /*eslint-disable no-loop-func*/
                    each(fakeXhr.eventListeners[event], function (handler) {
                        xhr.addEventListener(event, handler);
                    });
                    /*eslint-enable no-loop-func*/
                }
            }
            xhr.addEventListener("readystatechange", stateChange);
        } else {
            xhr.onreadystatechange = stateChange;
        }
        apply(xhr, "open", xhrArgs);
    };
    FakeXMLHttpRequest.useFilters = false;

    function verifyRequestOpened(xhr) {
        if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
            throw new Error("INVALID_STATE_ERR - " + xhr.readyState);
        }
    }

    function verifyRequestSent(xhr) {
        if (xhr.readyState === FakeXMLHttpRequest.DONE) {
            throw new Error("Request done");
        }
    }

    function verifyHeadersReceived(xhr) {
        if (xhr.async && xhr.readyState !== FakeXMLHttpRequest.HEADERS_RECEIVED) {
            throw new Error("No headers received");
        }
    }

    function verifyResponseBodyType(body) {
        if (typeof body !== "string") {
            var error = new Error("Attempted to respond to fake XMLHttpRequest with " +
                                 body + ", which is not a string.");
            error.name = "InvalidBodyException";
            throw error;
        }
    }

    function convertToArrayBuffer(body) {
        var buffer = new ArrayBuffer(body.length);
        var view = new Uint8Array(buffer);
        for (var i = 0; i < body.length; i++) {
            var charCode = body.charCodeAt(i);
            if (charCode >= 256) {
                throw new TypeError("arraybuffer or blob responseTypes require binary string, " +
                                    "invalid character " + body[i] + " found.");
            }
            view[i] = charCode;
        }
        return buffer;
    }

    function isXmlContentType(contentType) {
        return !contentType || /(text\/xml)|(application\/xml)|(\+xml)/.test(contentType);
    }

    function convertResponseBody(responseType, contentType, body) {
        if (responseType === "" || responseType === "text") {
            return body;
        } else if (supportsArrayBuffer && responseType === "arraybuffer") {
            return convertToArrayBuffer(body);
        } else if (responseType === "json") {
            try {
                return JSON.parse(body);
            } catch (e) {
                // Return parsing failure as null
                return null;
            }
        } else if (supportsBlob && responseType === "blob") {
            var blobOptions = {};
            if (contentType) {
                blobOptions.type = contentType;
            }
            return new Blob([convertToArrayBuffer(body)], blobOptions);
        } else if (responseType === "document") {
            if (isXmlContentType(contentType)) {
                return FakeXMLHttpRequest.parseXML(body);
            }
            return null;
        }
        throw new Error("Invalid responseType " + responseType);
    }

    function clearResponse(xhr) {
        if (xhr.responseType === "" || xhr.responseType === "text") {
            xhr.response = xhr.responseText = "";
        } else {
            xhr.response = xhr.responseText = null;
        }
        xhr.responseXML = null;
    }

    FakeXMLHttpRequest.parseXML = function parseXML(text) {
        // Treat empty string as parsing failure
        if (text !== "") {
            try {
                if (typeof DOMParser !== "undefined") {
                    var parser = new DOMParser();
                    return parser.parseFromString(text, "text/xml");
                }
                var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = "false";
                xmlDoc.loadXML(text);
                return xmlDoc;
            } catch (e) {
                // Unable to parse XML - no biggie
            }
        }

        return null;
    };

    FakeXMLHttpRequest.statusCodes = {
        100: "Continue",
        101: "Switching Protocols",
        200: "OK",
        201: "Created",
        202: "Accepted",
        203: "Non-Authoritative Information",
        204: "No Content",
        205: "Reset Content",
        206: "Partial Content",
        207: "Multi-Status",
        300: "Multiple Choice",
        301: "Moved Permanently",
        302: "Found",
        303: "See Other",
        304: "Not Modified",
        305: "Use Proxy",
        307: "Temporary Redirect",
        400: "Bad Request",
        401: "Unauthorized",
        402: "Payment Required",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        407: "Proxy Authentication Required",
        408: "Request Timeout",
        409: "Conflict",
        410: "Gone",
        411: "Length Required",
        412: "Precondition Failed",
        413: "Request Entity Too Large",
        414: "Request-URI Too Long",
        415: "Unsupported Media Type",
        416: "Requested Range Not Satisfiable",
        417: "Expectation Failed",
        422: "Unprocessable Entity",
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        505: "HTTP Version Not Supported"
    };

    function makeApi(sinon) {
        sinon.xhr = sinonXhr;

        sinon.extend(FakeXMLHttpRequest.prototype, sinon.EventTarget, {
            async: true,

            open: function open(method, url, async, username, password) {
                this.method = method;
                this.url = url;
                this.async = typeof async === "boolean" ? async : true;
                this.username = username;
                this.password = password;
                clearResponse(this);
                this.requestHeaders = {};
                this.sendFlag = false;

                if (FakeXMLHttpRequest.useFilters === true) {
                    var xhrArgs = arguments;
                    var defake = some(FakeXMLHttpRequest.filters, function (filter) {
                        return filter.apply(this, xhrArgs);
                    });
                    if (defake) {
                        return FakeXMLHttpRequest.defake(this, arguments);
                    }
                }
                this.readyStateChange(FakeXMLHttpRequest.OPENED);
            },

            readyStateChange: function readyStateChange(state) {
                this.readyState = state;

                var readyStateChangeEvent = new sinon.Event("readystatechange", false, false, this);
                var event, progress;

                if (typeof this.onreadystatechange === "function") {
                    try {
                        this.onreadystatechange(readyStateChangeEvent);
                    } catch (e) {
                        sinon.logError("Fake XHR onreadystatechange handler", e);
                    }
                }

                if (this.readyState === FakeXMLHttpRequest.DONE) {
                    // ensure loaded and total are numbers
                    progress = {
                      loaded: this.progress || 0,
                      total: this.progress || 0
                    };

                    if (this.status === 0) {
                        event = this.aborted ? "abort" : "error";
                    }
                    else {
                        event = "load";
                    }

                    if (supportsProgress) {
                        this.upload.dispatchEvent(new sinon.ProgressEvent("progress", progress, this));
                        this.upload.dispatchEvent(new sinon.ProgressEvent(event, progress, this));
                        this.upload.dispatchEvent(new sinon.ProgressEvent("loadend", progress, this));
                    }

                    this.dispatchEvent(new sinon.ProgressEvent("progress", progress, this));
                    this.dispatchEvent(new sinon.ProgressEvent(event, progress, this));
                    this.dispatchEvent(new sinon.ProgressEvent("loadend", progress, this));
                }

                this.dispatchEvent(readyStateChangeEvent);
            },

            setRequestHeader: function setRequestHeader(header, value) {
                verifyState(this);

                if (unsafeHeaders[header] || /^(Sec-|Proxy-)/.test(header)) {
                    throw new Error("Refused to set unsafe header \"" + header + "\"");
                }

                if (this.requestHeaders[header]) {
                    this.requestHeaders[header] += "," + value;
                } else {
                    this.requestHeaders[header] = value;
                }
            },

            // Helps testing
            setResponseHeaders: function setResponseHeaders(headers) {
                verifyRequestOpened(this);
                this.responseHeaders = {};

                for (var header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        this.responseHeaders[header] = headers[header];
                    }
                }

                if (this.async) {
                    this.readyStateChange(FakeXMLHttpRequest.HEADERS_RECEIVED);
                } else {
                    this.readyState = FakeXMLHttpRequest.HEADERS_RECEIVED;
                }
            },

            // Currently treats ALL data as a DOMString (i.e. no Document)
            send: function send(data) {
                verifyState(this);

                if (!/^(get|head)$/i.test(this.method)) {
                    var contentType = getHeader(this.requestHeaders, "Content-Type");
                    if (this.requestHeaders[contentType]) {
                        var value = this.requestHeaders[contentType].split(";");
                        this.requestHeaders[contentType] = value[0] + ";charset=utf-8";
                    } else if (supportsFormData && !(data instanceof FormData)) {
                        this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";
                    }

                    this.requestBody = data;
                }

                this.errorFlag = false;
                this.sendFlag = this.async;
                clearResponse(this);
                this.readyStateChange(FakeXMLHttpRequest.OPENED);

                if (typeof this.onSend === "function") {
                    this.onSend(this);
                }

                this.dispatchEvent(new sinon.Event("loadstart", false, false, this));
            },

            abort: function abort() {
                this.aborted = true;
                clearResponse(this);
                this.errorFlag = true;
                this.requestHeaders = {};
                this.responseHeaders = {};

                if (this.readyState > FakeXMLHttpRequest.UNSENT && this.sendFlag) {
                    this.readyStateChange(FakeXMLHttpRequest.DONE);
                    this.sendFlag = false;
                }

                this.readyState = FakeXMLHttpRequest.UNSENT;
            },

            error: function error() {
                clearResponse(this);
                this.errorFlag = true;
                this.requestHeaders = {};
                this.responseHeaders = {};

                this.readyStateChange(FakeXMLHttpRequest.DONE);
            },

            getResponseHeader: function getResponseHeader(header) {
                if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
                    return null;
                }

                if (/^Set-Cookie2?$/i.test(header)) {
                    return null;
                }

                header = getHeader(this.responseHeaders, header);

                return this.responseHeaders[header] || null;
            },

            getAllResponseHeaders: function getAllResponseHeaders() {
                if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
                    return "";
                }

                var headers = "";

                for (var header in this.responseHeaders) {
                    if (this.responseHeaders.hasOwnProperty(header) &&
                        !/^Set-Cookie2?$/i.test(header)) {
                        headers += header + ": " + this.responseHeaders[header] + "\r\n";
                    }
                }

                return headers;
            },

            setResponseBody: function setResponseBody(body) {
                verifyRequestSent(this);
                verifyHeadersReceived(this);
                verifyResponseBodyType(body);
                var contentType = this.getResponseHeader("Content-Type");

                var isTextResponse = this.responseType === "" || this.responseType === "text";
                clearResponse(this);
                if (this.async) {
                    var chunkSize = this.chunkSize || 10;
                    var index = 0;

                    do {
                        this.readyStateChange(FakeXMLHttpRequest.LOADING);

                        if (isTextResponse) {
                            this.responseText = this.response += body.substring(index, index + chunkSize);
                        }
                        index += chunkSize;
                    } while (index < body.length);
                }

                this.response = convertResponseBody(this.responseType, contentType, body);
                if (isTextResponse) {
                    this.responseText = this.response;
                }

                if (this.responseType === "document") {
                    this.responseXML = this.response;
                } else if (this.responseType === "" && isXmlContentType(contentType)) {
                    this.responseXML = FakeXMLHttpRequest.parseXML(this.responseText);
                }
                this.progress = body.length;
                this.readyStateChange(FakeXMLHttpRequest.DONE);
            },

            respond: function respond(status, headers, body) {
                this.status = typeof status === "number" ? status : 200;
                this.statusText = FakeXMLHttpRequest.statusCodes[this.status];
                this.setResponseHeaders(headers || {});
                this.setResponseBody(body || "");
            },

            uploadProgress: function uploadProgress(progressEventRaw) {
                if (supportsProgress) {
                    this.upload.dispatchEvent(new sinon.ProgressEvent("progress", progressEventRaw));
                }
            },

            downloadProgress: function downloadProgress(progressEventRaw) {
                if (supportsProgress) {
                    this.dispatchEvent(new sinon.ProgressEvent("progress", progressEventRaw));
                }
            },

            uploadError: function uploadError(error) {
                if (supportsCustomEvent) {
                    this.upload.dispatchEvent(new sinon.CustomEvent("error", {detail: error}));
                }
            }
        });

        sinon.extend(FakeXMLHttpRequest, {
            UNSENT: 0,
            OPENED: 1,
            HEADERS_RECEIVED: 2,
            LOADING: 3,
            DONE: 4
        });

        sinon.useFakeXMLHttpRequest = function () {
            FakeXMLHttpRequest.restore = function restore(keepOnCreate) {
                if (sinonXhr.supportsXHR) {
                    global.XMLHttpRequest = sinonXhr.GlobalXMLHttpRequest;
                }

                if (sinonXhr.supportsActiveX) {
                    global.ActiveXObject = sinonXhr.GlobalActiveXObject;
                }

                delete FakeXMLHttpRequest.restore;

                if (keepOnCreate !== true) {
                    delete FakeXMLHttpRequest.onCreate;
                }
            };
            if (sinonXhr.supportsXHR) {
                global.XMLHttpRequest = FakeXMLHttpRequest;
            }

            if (sinonXhr.supportsActiveX) {
                global.ActiveXObject = function ActiveXObject(objId) {
                    if (objId === "Microsoft.XMLHTTP" || /^Msxml2\.XMLHTTP/i.test(objId)) {

                        return new FakeXMLHttpRequest();
                    }

                    return new sinonXhr.GlobalActiveXObject(objId);
                };
            }

            return FakeXMLHttpRequest;
        };

        sinon.FakeXMLHttpRequest = FakeXMLHttpRequest;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    function loadDependencies(require, exports, module) {
        var sinon = require("./core");
        require("../extend");
        require("./event");
        require("../log_error");
        makeApi(sinon);
        module.exports = sinon;
    }

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon, // eslint-disable-line no-undef
    typeof global !== "undefined" ? global : self
));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../extend":69,"../log_error":71,"./core":81,"./event":82}],88:[function(require,module,exports){
/**
 * @depend util/core.js
 */
(function (sinonGlobal) {
    "use strict";

    function makeApi(sinon) {
        function walkInternal(obj, iterator, context, originalObj, seen) {
            var proto, prop;

            if (typeof Object.getOwnPropertyNames !== "function") {
                // We explicitly want to enumerate through all of the prototype's properties
                // in this case, therefore we deliberately leave out an own property check.
                /* eslint-disable guard-for-in */
                for (prop in obj) {
                    iterator.call(context, obj[prop], prop, obj);
                }
                /* eslint-enable guard-for-in */

                return;
            }

            Object.getOwnPropertyNames(obj).forEach(function (k) {
                if (!seen[k]) {
                    seen[k] = true;
                    var target = typeof Object.getOwnPropertyDescriptor(obj, k).get === "function" ?
                        originalObj : obj;
                    iterator.call(context, target[k], k, target);
                }
            });

            proto = Object.getPrototypeOf(obj);
            if (proto) {
                walkInternal(proto, iterator, context, originalObj, seen);
            }
        }

        /* Public: walks the prototype chain of an object and iterates over every own property
         * name encountered. The iterator is called in the same fashion that Array.prototype.forEach
         * works, where it is passed the value, key, and own object as the 1st, 2nd, and 3rd positional
         * argument, respectively. In cases where Object.getOwnPropertyNames is not available, walk will
         * default to using a simple for..in loop.
         *
         * obj - The object to walk the prototype chain for.
         * iterator - The function to be called on each pass of the walk.
         * context - (Optional) When given, the iterator will be called with this object as the receiver.
         */
        function walk(obj, iterator, context) {
            return walkInternal(obj, iterator, context, obj, {});
        }

        sinon.walk = walk;
        return sinon.walk;
    }

    function loadDependencies(require, exports, module) {
        var sinon = require("./util/core");
        module.exports = makeApi(sinon);
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

    if (isAMD) {
        define(loadDependencies);
        return;
    }

    if (isNode) {
        loadDependencies(require, module.exports, module);
        return;
    }

    if (sinonGlobal) {
        makeApi(sinonGlobal);
    }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

},{"./util/core":81}],89:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],90:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":89,"_process":62,"inherits":59}],91:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _DOMComponentsTracking = require('./DOMComponentsTracking.js');

var _DOMComponentsTracking2 = _interopRequireDefault(_DOMComponentsTracking);

var _componentType = require('component-type');

var _componentType2 = _interopRequireDefault(_componentType);

var _semver = require('./functions/semver');

var _semver2 = _interopRequireDefault(_semver);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var AutoEvents = function () {
  function AutoEvents(options) {
    _classCallCheck(this, AutoEvents);

    this.options = Object.assign({
      trackDOMComponents: false
    }, options);
  }

  AutoEvents.prototype.setDigitalData = function setDigitalData(digitalData) {
    this.digitalData = digitalData;
  };

  AutoEvents.prototype.setDDListener = function setDDListener(ddListener) {
    this.ddListener = ddListener;
  };

  AutoEvents.prototype.onInitialize = function onInitialize() {
    var _this = this;

    if (this.digitalData) {
      this.fireViewedPage();
      this.fireViewedProductCategory();
      this.fireViewedProductDetail();
      this.fireViewedCart();
      this.fireCompletedTransaction();
      this.fireSearched();

      if (this.ddListener) {
        this.ddListener.push(['on', 'change:page', function (newPage, oldPage) {
          _this.onPageChange(newPage, oldPage);
        }]);

        this.ddListener.push(['on', 'change:product.id', function (newProductId, oldProductId) {
          _this.onProductChange(newProductId, oldProductId);
        }]);

        this.ddListener.push(['on', 'change:transaction.orderId', function (newOrderId, oldOrderId) {
          _this.onTransactionChange(newOrderId, oldOrderId);
        }]);
      }

      var trackDOMComponents = this.options.trackDOMComponents;
      if (!!window.jQuery && trackDOMComponents !== false) {
        var options = {};
        if ((0, _componentType2['default'])(trackDOMComponents) === 'object') {
          options.maxWebsiteWidth = trackDOMComponents.maxWebsiteWidth;
        }
        this.domComponentsTracking = new _DOMComponentsTracking2['default'](options);
        this.domComponentsTracking.initialize();
      }
    }
  };

  AutoEvents.prototype.getDOMComponentsTracking = function getDOMComponentsTracking() {
    return this.domComponentsTracking;
  };

  AutoEvents.prototype.onPageChange = function onPageChange(newPage, oldPage) {
    if (String(newPage.pageId) !== String(oldPage.pageId) || newPage.url !== oldPage.url || newPage.type !== oldPage.type || newPage.breadcrumb !== oldPage.breadcrumb) {
      this.fireViewedPage();
      this.fireViewedProductCategory();
      this.fireViewedCart();
      this.fireSearched();
    }
  };

  AutoEvents.prototype.onProductChange = function onProductChange(newProductId, oldProductId) {
    if (newProductId !== oldProductId) {
      this.fireViewedProductDetail();
    }
  };

  AutoEvents.prototype.onTransactionChange = function onTransactionChange(newOrderId, oldOrderId) {
    if (newOrderId !== oldOrderId) {
      this.fireCompletedTransaction();
    }
  };

  AutoEvents.prototype.fireViewedPage = function fireViewedPage(page) {
    page = page || this.digitalData.page;
    this.digitalData.events.push({
      enrichEventData: false,
      name: 'Viewed Page',
      category: 'Content',
      page: page,
      nonInteraction: true
    });
  };

  AutoEvents.prototype.fireViewedProductCategory = function fireViewedProductCategory() {
    var page = this.digitalData.page || {};
    var listing = this.digitalData.listing || {};
    if (page.type !== 'category') {
      return;
    }
    // compatibility with version <1.1.0
    if (this.digitalData.version && _semver2['default'].cmp(this.digitalData.version, '1.1.0') < 0) {
      if (page.categoryId) listing.categoryId = page.categoryId;
    }
    this.digitalData.events.push({
      enrichEventData: false,
      name: 'Viewed Product Category',
      category: 'Ecommerce',
      listing: listing,
      nonInteraction: true
    });
  };

  AutoEvents.prototype.fireViewedProductDetail = function fireViewedProductDetail(product) {
    product = product || this.digitalData.product;
    if (!product) {
      return;
    }
    this.digitalData.events.push({
      enrichEventData: false,
      name: 'Viewed Product Detail',
      category: 'Ecommerce',
      product: product,
      nonInteraction: true
    });
  };

  AutoEvents.prototype.fireViewedCart = function fireViewedCart() {
    var page = this.digitalData.page || {};
    var cart = this.digitalData.cart || {};
    if (page.type !== 'cart') {
      return;
    }
    this.digitalData.events.push({
      enrichEventData: false,
      name: 'Viewed Cart',
      category: 'Ecommerce',
      cart: cart,
      nonInteraction: true
    });
  };

  AutoEvents.prototype.fireCompletedTransaction = function fireCompletedTransaction(transaction) {
    transaction = transaction || this.digitalData.transaction;
    if (!transaction || transaction.isReturning === true) {
      return;
    }
    this.digitalData.events.push({
      enrichEventData: false,
      name: 'Completed Transaction',
      category: 'Ecommerce',
      transaction: transaction
    });
  };

  AutoEvents.prototype.fireSearched = function fireSearched(listing) {
    listing = listing || this.digitalData.listing;
    if (!listing || !listing.query) {
      return;
    }
    var event = {
      enrichEventData: false,
      name: 'Searched',
      category: 'Content',
      listing: listing
    };
    this.digitalData.events.push(event);
  };

  return AutoEvents;
}();

exports['default'] = AutoEvents;

},{"./DOMComponentsTracking.js":93,"./functions/semver":114,"component-type":5}],92:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _getProperty = require('./functions/getProperty.js');

var _getProperty2 = _interopRequireDefault(_getProperty);

var _componentClone = require('component-clone');

var _componentClone2 = _interopRequireDefault(_componentClone);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var DDHelper = function () {
  function DDHelper() {
    _classCallCheck(this, DDHelper);
  }

  DDHelper.get = function get(key, digitalData) {
    var value = (0, _getProperty2['default'])(digitalData, key);
    return (0, _componentClone2['default'])(value);
  };

  DDHelper.getProduct = function getProduct(id, digitalData) {
    if (digitalData.product && String(digitalData.product.id) === String(id)) {
      return (0, _componentClone2['default'])(digitalData.product);
    }
    // search in listings
    var _arr = ['listing', 'recommendation'];
    for (var _i = 0; _i < _arr.length; _i++) {
      var listingKey = _arr[_i];
      var listings = digitalData[listingKey];
      if (listings) {
        if (!Array.isArray(listings)) {
          listings = [listings];
        }
        for (var _iterator2 = listings, _isArray2 = Array.isArray(_iterator2), _i3 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          var _ref2;

          if (_isArray2) {
            if (_i3 >= _iterator2.length) break;
            _ref2 = _iterator2[_i3++];
          } else {
            _i3 = _iterator2.next();
            if (_i3.done) break;
            _ref2 = _i3.value;
          }

          var listing = _ref2;

          if (listing.items && listing.items.length) {
            for (var i = 0, length = listing.items.length; i < length; i++) {
              if (listing.items[i].id && String(listing.items[i].id) === String(id)) {
                var product = (0, _componentClone2['default'])(listing.items[i]);
                return product;
              }
            }
          }
        }
      }
    }
    // search in cart
    if (digitalData.cart && digitalData.cart.lineItems && digitalData.cart.lineItems.length) {
      for (var _iterator = digitalData.cart.lineItems, _isArray = Array.isArray(_iterator), _i2 = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i2 >= _iterator.length) break;
          _ref = _iterator[_i2++];
        } else {
          _i2 = _iterator.next();
          if (_i2.done) break;
          _ref = _i2.value;
        }

        var lineItem = _ref;

        if (lineItem.product && String(lineItem.product.id) === String(id)) {
          return (0, _componentClone2['default'])(lineItem.product);
        }
      }
    }
  };

  DDHelper.getListItem = function getListItem(id, digitalData, listName) {
    // search in listings
    var listingItem = {};
    var _arr2 = ['listing', 'recommendation'];
    for (var _i4 = 0; _i4 < _arr2.length; _i4++) {
      var listingKey = _arr2[_i4];
      var listings = digitalData[listingKey];
      if (listings) {
        if (!Array.isArray(listings)) {
          listings = [listings];
        }
        for (var _iterator3 = listings, _isArray3 = Array.isArray(_iterator3), _i5 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
          var _ref3;

          if (_isArray3) {
            if (_i5 >= _iterator3.length) break;
            _ref3 = _iterator3[_i5++];
          } else {
            _i5 = _iterator3.next();
            if (_i5.done) break;
            _ref3 = _i5.value;
          }

          var listing = _ref3;

          if (listing.items && listing.items.length && (!listName || listName === listing.listName)) {
            for (var i = 0, length = listing.items.length; i < length; i++) {
              if (listing.items[i].id && String(listing.items[i].id) === String(id)) {
                var product = (0, _componentClone2['default'])(listing.items[i]);
                listingItem.product = product;
                listingItem.position = i + 1;
                listingItem.listName = listName || listing.listName;
                return listingItem;
              }
            }
          }
        }
      }
    }
  };

  DDHelper.getCampaign = function getCampaign(id, digitalData) {
    if (digitalData.campaigns && digitalData.campaigns.length) {
      for (var _iterator4 = digitalData.campaigns, _isArray4 = Array.isArray(_iterator4), _i6 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
        var _ref4;

        if (_isArray4) {
          if (_i6 >= _iterator4.length) break;
          _ref4 = _iterator4[_i6++];
        } else {
          _i6 = _iterator4.next();
          if (_i6.done) break;
          _ref4 = _i6.value;
        }

        var campaign = _ref4;

        if (campaign.id && String(campaign.id) === String(id)) {
          return (0, _componentClone2['default'])(campaign);
        }
      }
    }
  };

  return DDHelper;
}();

exports['default'] = DDHelper;

},{"./functions/getProperty.js":105,"component-clone":3}],93:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * Automatically tracks DOM components with proper data-attributes
 *
 * - data-ddl-viewed-product="<product.id>"
 * - data-ddl-viewed-campaign="<campaign.id>"
 * - data-ddl-clicked-product="<product.id>"
 * - data-ddl-clicked-campaign="<campaign.id>"
 * - data-ddl-product-list-name="<listName>"
 *
 * If any DOM components are added to the page dynamically
 * corresponding digitalData variable should be updated:
 * digitalData.list, digitalData.recommendation or digitalData.campaigns
 */

var DOMComponentsTracking = function () {
  function DOMComponentsTracking(options) {
    _classCallCheck(this, DOMComponentsTracking);

    this.options = Object.assign({
      websiteMaxWidth: undefined
    }, options);

    this.viewedComponentIds = {
      product: [],
      campaign: []
    };

    this.$digitalDataComponents = {
      product: [],
      campaign: []
    };
  }

  DOMComponentsTracking.prototype.initialize = function initialize() {
    var _this = this;

    if (!window.jQuery) {
      return;
    }
    window.jQuery(function () {
      // detect max website width
      if (!_this.options.websiteMaxWidth) {
        var $body = window.jQuery('body');
        _this.options.websiteMaxWidth = $body.children('.container').first().width() || $body.children('div').first().width();
      }

      _this.defineDocBoundaries();
      _this.addClickHandlers();
      _this.startTracking();
    });
  };

  DOMComponentsTracking.prototype.defineDocBoundaries = function defineDocBoundaries() {
    var _this2 = this;

    var $window = window.jQuery(window);

    var _defineDocBoundaries = function _defineDocBoundaries() {
      _this2.docViewTop = $window.scrollTop();
      _this2.docViewBottom = _this2.docViewTop + $window.height();
      _this2.docViewLeft = $window.scrollLeft();
      _this2.docViewRight = _this2.docViewLeft + $window.width();

      var maxWebsiteWidth = _this2.options.maxWebsiteWidth;
      if (maxWebsiteWidth && maxWebsiteWidth < _this2.docViewRight && _this2.docViewLeft === 0) {
        _this2.docViewLeft = (_this2.docViewRight - maxWebsiteWidth) / 2;
        _this2.docViewRight = _this2.docViewLeft + maxWebsiteWidth;
      }
    };

    _defineDocBoundaries();
    $window.resize(function () {
      _defineDocBoundaries();
    });
    $window.scroll(function () {
      _defineDocBoundaries();
    });
  };

  DOMComponentsTracking.prototype.updateDigitalDataDomComponents = function updateDigitalDataDomComponents() {
    var _arr = ['product', 'campaign'];

    for (var _i = 0; _i < _arr.length; _i++) {
      var type = _arr[_i];
      var viewedSelector = 'ddl-viewed-' + type;
      this.$digitalDataComponents[type] = this.findByDataAttr(viewedSelector);
    }
  };

  DOMComponentsTracking.prototype.addClickHandlers = function addClickHandlers() {
    var _this3 = this;

    var onClick = function onClick(type) {
      var self = _this3;
      return function onClickHandler() {
        var $el = window.jQuery(this);
        var id = $el.data('ddl-clicked-' + type);
        if (type === 'product') {
          var listName = self.findParentByDataAttr('ddl-product-list-name', $el).data('ddl-product-list-name');
          self.fireClickedProduct(id, listName);
        } else if (type === 'campaign') {
          self.fireClickedCampaign(id);
        }
      };
    };

    var _arr2 = ['campaign', 'product'];
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      var type = _arr2[_i2];
      var eventName = 'click.ddl-clicked-' + type;
      var selector = this.getDataAttrSelector('ddl-clicked-' + type);
      window.jQuery(document).on(eventName, selector, onClick(type));
    }
  };

  DOMComponentsTracking.prototype.trackViews = function trackViews() {
    var _this4 = this;

    var _arr3 = ['campaign', 'product'];

    var _loop = function _loop() {
      var type = _arr3[_i3];
      var newViewedComponents = [];
      var $components = _this4.$digitalDataComponents[type];
      $components.each(function (index, el) {
        // eslint-disable-line no-loop-func
        var $el = window.jQuery(el);
        var id = $el.data('ddl-viewed-' + type);
        if (_this4.viewedComponentIds[type].indexOf(id) < 0 && _this4.isVisible($el)) {
          _this4.viewedComponentIds[type].push(id);
          if (type === 'product') {
            var listItem = {
              product: { id: id }
            };
            var listName = _this4.findParentByDataAttr('ddl-product-list-name', $el).data('ddl-product-list-name');
            if (listName) listItem.listName = listName;
            newViewedComponents.push(listItem);
          } else {
            newViewedComponents.push(id);
          }
        }
      });

      if (newViewedComponents.length > 0) {
        if (type === 'product') {
          _this4.fireViewedProduct(newViewedComponents);
        } else if (type === 'campaign') {
          _this4.fireViewedCampaign(newViewedComponents);
        }
      }
    };

    for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
      _loop();
    }
  };

  DOMComponentsTracking.prototype.startTracking = function startTracking() {
    var _this5 = this;

    var _track = function _track() {
      _this5.updateDigitalDataDomComponents();
      _this5.trackViews();
    };

    _track();
    setInterval(function () {
      _track();
    }, 500);
  };

  DOMComponentsTracking.prototype.fireViewedProduct = function fireViewedProduct(listItems) {
    window.digitalData.events.push({
      name: 'Viewed Product',
      category: 'Ecommerce',
      listItems: listItems
    });
  };

  DOMComponentsTracking.prototype.fireViewedCampaign = function fireViewedCampaign(campaigns) {
    window.digitalData.events.push({
      name: 'Viewed Campaign',
      category: 'Promo',
      campaigns: campaigns
    });
  };

  DOMComponentsTracking.prototype.fireClickedProduct = function fireClickedProduct(productId, listName) {
    var listItem = {
      product: {
        id: productId
      }
    };
    if (listName) listItem.listName = listName;
    window.digitalData.events.push({
      name: 'Clicked Product',
      category: 'Ecommerce',
      listItem: listItem
    });
  };

  DOMComponentsTracking.prototype.fireClickedCampaign = function fireClickedCampaign(campaign) {
    window.digitalData.events.push({
      name: 'Clicked Campaign',
      category: 'Promo',
      campaign: campaign
    });
  };

  /**
   * Returns true if element is visible by css
   * and at least 3/4 of the element fit user viewport
   *
   * @param $elem JQuery object
   * @returns boolean
   */

  DOMComponentsTracking.prototype.isVisible = function isVisible($elem) {
    var el = $elem[0];
    var $window = window.jQuery(window);

    var elemOffset = $elem.offset();
    var elemWidth = $elem.width();
    var elemHeight = $elem.height();

    var elemTop = elemOffset.top;
    var elemBottom = elemTop + elemHeight;
    var elemLeft = elemOffset.left;
    var elemRight = elemLeft + elemWidth;

    var visible = $elem.is(':visible') && $elem.css('opacity') > 0 && $elem.css('visibility') !== 'hidden';
    if (!visible) {
      return false;
    }

    var fitsVertical = elemBottom - elemHeight / 4 <= this.docViewBottom && elemTop + elemHeight / 4 >= this.docViewTop;
    var fitsHorizontal = elemLeft + elemWidth / 4 >= this.docViewLeft && elemRight - elemWidth / 4 <= this.docViewRight;

    if (!fitsVertical || !fitsHorizontal) {
      return false;
    }

    var elementFromPoint = document.elementFromPoint(elemLeft - $window.scrollLeft() + elemWidth / 2, elemTop - $window.scrollTop() + elemHeight / 2);

    while (elementFromPoint && elementFromPoint !== el && elementFromPoint.parentNode !== document) {
      elementFromPoint = elementFromPoint.parentNode;
    }

    return !!elementFromPoint && elementFromPoint === el;
  };

  /**
   * Find elements by data attribute name
   *
   * @param name
   * @param obj
   * @returns jQuery object
   */

  DOMComponentsTracking.prototype.findByDataAttr = function findByDataAttr(name, obj) {
    if (!obj) obj = window.jQuery(document.body);
    return obj.find(this.getDataAttrSelector(name));
  };

  /**
   * Find parent element by data attribute name
   *
   * @param name
   * @param obj
   * @returns jQuery object
   */

  DOMComponentsTracking.prototype.findParentByDataAttr = function findParentByDataAttr(name, obj) {
    return obj.closest(this.getDataAttrSelector(name));
  };

  DOMComponentsTracking.prototype.getDataAttrSelector = function getDataAttrSelector(name) {
    return '[data-' + name + ']';
  };

  return DOMComponentsTracking;
}();

exports['default'] = DOMComponentsTracking;

},{}],94:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _htmlGlobals = require('./functions/htmlGlobals.js');

var _htmlGlobals2 = _interopRequireDefault(_htmlGlobals);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var DigitalDataEnricher = function () {
  function DigitalDataEnricher(digitalData) {
    _classCallCheck(this, DigitalDataEnricher);

    this.digitalData = digitalData;
  }

  DigitalDataEnricher.prototype.setDigitalData = function setDigitalData(digitalData) {
    this.digitalData = digitalData;
  };

  DigitalDataEnricher.prototype.enrichDigitalData = function enrichDigitalData() {
    this.enrichPageData();
    this.enrichContextData();
  };

  DigitalDataEnricher.prototype.enrichPageData = function enrichPageData() {
    var page = this.digitalData.page;

    page.path = page.path || this.getHtmlGlobals().getLocation().pathname;
    page.referrer = page.referrer || this.getHtmlGlobals().getDocument().referrer;
    page.queryString = page.queryString || this.getHtmlGlobals().getLocation().search;
    page.title = page.title || this.getHtmlGlobals().getDocument().title;
    page.url = page.url || this.getHtmlGlobals().getLocation().href;
    page.hash = page.hash || this.getHtmlGlobals().getLocation().hash;
  };

  DigitalDataEnricher.prototype.enrichContextData = function enrichContextData() {
    var context = this.digitalData.context;
    context.userAgent = this.getHtmlGlobals().getNavigator().userAgent;
  };

  /**
   * Can be overriden for test purposes
   * @returns {{getDocument, getLocation, getNavigator}}
   */

  DigitalDataEnricher.prototype.getHtmlGlobals = function getHtmlGlobals() {
    return _htmlGlobals2['default'];
  };

  return DigitalDataEnricher;
}();

exports['default'] = DigitalDataEnricher;

},{"./functions/htmlGlobals.js":107}],95:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _componentType = require('component-type');

var _componentType2 = _interopRequireDefault(_componentType);

var _DDHelper = require('./DDHelper.js');

var _DDHelper2 = _interopRequireDefault(_DDHelper);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var EventDataEnricher = function () {
  function EventDataEnricher() {
    _classCallCheck(this, EventDataEnricher);
  }

  EventDataEnricher.product = function product(_product, digitalData) {
    var productId = void 0;

    if ((0, _componentType2['default'])(_product) === 'object') {
      productId = _product.id;
    } else {
      productId = _product;
      _product = {
        id: productId
      };
    }

    if (productId) {
      var ddlProduct = _DDHelper2['default'].getProduct(productId, digitalData) || {};
      if (ddlProduct) {
        _product = Object.assign(ddlProduct, _product);
      }
    }

    return _product;
  };

  EventDataEnricher.listItem = function listItem(_listItem, digitalData) {
    var productId = void 0;

    if ((0, _componentType2['default'])(_listItem.product) === 'object') {
      productId = _listItem.product.id;
    } else {
      productId = _listItem.product;
      _listItem.product = {
        id: productId
      };
    }

    if (productId) {
      var ddlListItem = _DDHelper2['default'].getListItem(productId, digitalData, _listItem.listName);
      if (ddlListItem) {
        _listItem.product = Object.assign(ddlListItem.product, _listItem.product);
        _listItem = Object.assign(ddlListItem, _listItem);
      }
    }

    return _listItem;
  };

  EventDataEnricher.listItems = function listItems(_listItems, digitalData) {
    var result = [];
    for (var _iterator = _listItems, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var listItem = _ref;

      var enrichedListItem = EventDataEnricher.listItem(listItem, digitalData);
      result.push(enrichedListItem);
    }
    return result;
  };

  EventDataEnricher.transaction = function transaction(_transaction, digitalData) {
    _transaction = _transaction || {};
    var ddlTransaction = _DDHelper2['default'].get('transaction', digitalData) || {};
    if (ddlTransaction) {
      _transaction = Object.assign(ddlTransaction, _transaction);
    }

    return _transaction;
  };

  EventDataEnricher.campaign = function campaign(_campaign, digitalData) {
    var campaignId = void 0;
    if ((0, _componentType2['default'])(_campaign) === 'object') {
      campaignId = _campaign.id;
    } else {
      campaignId = _campaign;
      _campaign = {
        id: campaignId
      };
    }

    if (campaignId) {
      var ddlCampaign = _DDHelper2['default'].getCampaign(campaignId, digitalData) || {};
      if (ddlCampaign) {
        _campaign = Object.assign(ddlCampaign, _campaign);
      }
    }

    return _campaign;
  };

  EventDataEnricher.campaigns = function campaigns(_campaigns, digitalData) {
    var result = [];
    for (var _iterator2 = _campaigns, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var campaign = _ref2;

      result.push(EventDataEnricher.campaign(campaign, digitalData));
    }
    return result;
  };

  EventDataEnricher.user = function user(_user, digitalData) {
    _user = _user || {};
    var ddlUser = _DDHelper2['default'].get('user', digitalData) || {};
    if (ddlUser) {
      _user = Object.assign(ddlUser, _user);
    }

    return _user;
  };

  EventDataEnricher.page = function page(_page, digitalData) {
    _page = _page || {};
    var ddlPage = _DDHelper2['default'].get('page', digitalData) || {};
    if (ddlPage) {
      _page = Object.assign(ddlPage, _page);
    }

    return _page;
  };

  return EventDataEnricher;
}();

exports['default'] = EventDataEnricher;

},{"./DDHelper.js":92,"component-type":5}],96:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _componentClone = require('component-clone');

var _componentClone2 = _interopRequireDefault(_componentClone);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _noop = require('./functions/noop.js');

var _noop2 = _interopRequireDefault(_noop);

var _deleteProperty = require('./functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _size = require('./functions/size.js');

var _size2 = _interopRequireDefault(_size);

var _after = require('./functions/after.js');

var _after2 = _interopRequireDefault(_after);

var _jsonIsEqual = require('./functions/jsonIsEqual.js');

var _jsonIsEqual2 = _interopRequireDefault(_jsonIsEqual);

var _DDHelper = require('./DDHelper.js');

var _DDHelper2 = _interopRequireDefault(_DDHelper);

var _EventDataEnricher = require('./EventDataEnricher.js');

var _EventDataEnricher2 = _interopRequireDefault(_EventDataEnricher);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _callbacks = {};
var _ddListener = [];
var _previousDigitalData = {};
var _digitalData = {};
var _checkForChangesIntervalId = void 0;
var _autoEvents = void 0;
var _viewabilityTracker = void 0;
var _isInitialized = false;

var _callbackOnComplete = function _callbackOnComplete(error) {
  if (error) {
    (0, _debug2['default'])('ddListener callback error: %s', error);
  }
};

function _getCopyWithoutEvents(digitalData) {
  var digitalDataCopy = (0, _componentClone2['default'])(digitalData);
  (0, _deleteProperty2['default'])(digitalDataCopy, 'events');
  return digitalDataCopy;
}

var EventManager = function () {
  function EventManager(digitalData, ddListener) {
    _classCallCheck(this, EventManager);

    _digitalData = digitalData || _digitalData;
    if (!Array.isArray(_digitalData.events)) {
      _digitalData.events = [];
    }
    _ddListener = ddListener || _ddListener;
    _previousDigitalData = _getCopyWithoutEvents(_digitalData);
  }

  EventManager.prototype.initialize = function initialize() {
    var _this = this;

    var events = _digitalData.events;
    // process callbacks
    this.addEarlyCallbacks();
    this.fireDefine();
    _ddListener.push = function (callbackInfo) {
      _this.addCallback(callbackInfo);
      _ddListener[_ddListener.length] = callbackInfo;
    };

    // process events
    this.fireUnfiredEvents();
    events.push = function (event) {
      _this.fireEvent(event);
      events[events.length] = event;
    };

    if (_autoEvents) {
      _autoEvents.onInitialize();
    }
    if (_viewabilityTracker) {
      _viewabilityTracker.initialize();
    }
    _checkForChangesIntervalId = setInterval(function () {
      _this.fireDefine();
      _this.checkForChanges();
    }, 100);

    _isInitialized = true;
  };

  EventManager.prototype.setAutoEvents = function setAutoEvents(autoEvents) {
    _autoEvents = autoEvents;
    _autoEvents.setDigitalData(_digitalData);
    _autoEvents.setDDListener(_ddListener);
  };

  EventManager.prototype.setViewabilityTracker = function setViewabilityTracker(viewabilityTracker) {
    _viewabilityTracker = viewabilityTracker;
  };

  EventManager.prototype.getAutoEvents = function getAutoEvents() {
    return _autoEvents;
  };

  EventManager.prototype.checkForChanges = function checkForChanges() {
    if (_callbacks.change && _callbacks.change.length > 0 || _callbacks.define && _callbacks.define.length > 0) {
      var digitalDataWithoutEvents = _getCopyWithoutEvents(_digitalData);
      if (!(0, _jsonIsEqual2['default'])(_previousDigitalData, digitalDataWithoutEvents)) {
        var previousDigitalDataWithoutEvents = _getCopyWithoutEvents(_previousDigitalData);
        _previousDigitalData = (0, _componentClone2['default'])(digitalDataWithoutEvents);
        this.fireDefine();
        this.fireChange(digitalDataWithoutEvents, previousDigitalDataWithoutEvents);
      }
    }
  };

  EventManager.prototype.addCallback = function addCallback(callbackInfo, processPastEvents) {
    if (processPastEvents !== false) {
      processPastEvents = true;
    }

    if (!Array.isArray(callbackInfo) || callbackInfo.length < 2) {
      return;
    }

    if (callbackInfo[0] === 'on') {
      if (callbackInfo.length < 3) {
        return;
      }
      var asyncHandler = _async2['default'].asyncify(callbackInfo[2]);
      this.on(callbackInfo[1], asyncHandler, processPastEvents);
    }if (callbackInfo[0] === 'off') {
      // TODO
    }
  };

  EventManager.prototype.fireDefine = function fireDefine() {
    var callback = void 0;
    if (_callbacks.define && _callbacks.define.length > 0) {
      for (var _iterator = _callbacks.define, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        if (_isArray) {
          if (_i >= _iterator.length) break;
          callback = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          callback = _i.value;
        }

        var value = void 0;
        if (callback.key) {
          var key = callback.key;
          value = _DDHelper2['default'].get(key, _digitalData);
        } else {
          value = _digitalData;
        }
        if (value !== undefined) {
          callback.handler(value, _callbackOnComplete);
          _callbacks.define.splice(_callbacks.define.indexOf(callback), 1);
        }
      }
    }
  };

  EventManager.prototype.fireChange = function fireChange(newValue, previousValue) {
    var callback = void 0;
    if (_callbacks.change && _callbacks.change.length > 0) {
      for (var _iterator2 = _callbacks.change, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          callback = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          callback = _i2.value;
        }

        if (callback.key) {
          var key = callback.key;
          var newKeyValue = _DDHelper2['default'].get(key, newValue);
          var previousKeyValue = callback.snapshot || _DDHelper2['default'].get(key, previousValue);
          if (!(0, _jsonIsEqual2['default'])(newKeyValue, previousKeyValue)) {
            callback.handler(newKeyValue, previousKeyValue, _callbackOnComplete);
          }
        } else {
          callback.handler(newValue, callback.snapshot || previousValue, _callbackOnComplete);
        }
      }
      if (callback.snapshot) {
        // remove DDL snapshot after first change fire
        // because now normal setInterval and _previousDigitalData will do the job
        // TODO: test performance using snapshots insted of _previousDigitalData
        (0, _deleteProperty2['default'])(callback, 'snapshot');
      }
    }
  };

  EventManager.prototype.fireEvent = function fireEvent(event) {
    var _this2 = this;

    var eventCallback = void 0;
    event.timestamp = new Date().getTime();

    if (_callbacks.event) {
      (function () {
        var results = [];
        var errors = [];
        var ready = (0, _after2['default'])((0, _size2['default'])(_callbacks.event), function () {
          if (typeof event.callback === 'function') {
            event.callback(results, errors);
          }
        });

        var eventCallbackOnComplete = function eventCallbackOnComplete(error, result) {
          if (result !== undefined) {
            results.push(result);
          }
          if (error) {
            errors.push(error);
          }
          _callbackOnComplete(error);
          ready();
        };

        for (var _iterator3 = _callbacks.event, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
          if (_isArray3) {
            if (_i3 >= _iterator3.length) break;
            eventCallback = _iterator3[_i3++];
          } else {
            _i3 = _iterator3.next();
            if (_i3.done) break;
            eventCallback = _i3.value;
          }

          var eventCopy = (0, _componentClone2['default'])(event);
          (0, _deleteProperty2['default'])(eventCopy, 'callback');
          if (eventCopy.enrichEventData !== false) {
            eventCopy = _this2.enrichEventWithData(eventCopy);
          }
          eventCallback.handler(eventCopy, eventCallbackOnComplete);
        }
      })();
    } else {
      if (typeof event.callback === 'function') {
        event.callback();
      }
    }

    event.hasFired = true;
  };

  EventManager.prototype.on = function on(eventInfo, handler, processPastEvents) {
    var _eventInfo$split = eventInfo.split(':');

    var type = _eventInfo$split[0];
    var key = _eventInfo$split[1];

    var snapshot = void 0;

    if (type === 'change') {
      if (key) {
        snapshot = (0, _componentClone2['default'])(_DDHelper2['default'].get(key, _digitalData));
      } else {
        snapshot = (0, _componentClone2['default'])(_getCopyWithoutEvents(_digitalData));
      }
    } else if (type === 'view') {
      _viewabilityTracker.addTracker(key, handler);
      return; // delegate view tracking to ViewabilityTracker
    }

    _callbacks[type] = _callbacks[type] || [];
    _callbacks[type].push({
      key: key,
      handler: handler,
      snapshot: snapshot
    });
    if (_isInitialized && type === 'event' && processPastEvents) {
      this.applyCallbackForPastEvents(handler);
    }
  };

  EventManager.prototype.applyCallbackForPastEvents = function applyCallbackForPastEvents(handler) {
    var events = _digitalData.events;
    var event = void 0;
    for (var _iterator4 = events, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        event = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        event = _i4.value;
      }

      if (event.hasFired) {
        var eventCopy = (0, _componentClone2['default'])(event);
        (0, _deleteProperty2['default'])(eventCopy, 'callback');
        if (eventCopy.enrichEventData !== false) {
          eventCopy = this.enrichEventWithData(eventCopy);
        }
        handler(eventCopy, _noop2['default']);
      }
    }
  };

  EventManager.prototype.fireUnfiredEvents = function fireUnfiredEvents() {
    var events = _digitalData.events;
    var event = void 0;
    for (var _iterator5 = events, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
      if (_isArray5) {
        if (_i5 >= _iterator5.length) break;
        event = _iterator5[_i5++];
      } else {
        _i5 = _iterator5.next();
        if (_i5.done) break;
        event = _i5.value;
      }

      if (!event.hasFired) {
        this.fireEvent(event);
      }
    }
  };

  EventManager.prototype.addEarlyCallbacks = function addEarlyCallbacks() {
    var callbackInfo = void 0;
    for (var _iterator6 = _ddListener, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
      if (_isArray6) {
        if (_i6 >= _iterator6.length) break;
        callbackInfo = _iterator6[_i6++];
      } else {
        _i6 = _iterator6.next();
        if (_i6.done) break;
        callbackInfo = _i6.value;
      }

      this.addCallback(callbackInfo);
    }
  };

  EventManager.prototype.enrichEventWithData = function enrichEventWithData(event) {
    var enrichableVars = ['product', 'listItem', 'listItems', 'transaction', 'campaign', 'campaigns', 'user', 'page'];

    for (var _iterator7 = enrichableVars, _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : _iterator7[Symbol.iterator]();;) {
      var _ref;

      if (_isArray7) {
        if (_i7 >= _iterator7.length) break;
        _ref = _iterator7[_i7++];
      } else {
        _i7 = _iterator7.next();
        if (_i7.done) break;
        _ref = _i7.value;
      }

      var enrichableVar = _ref;

      if (event[enrichableVar]) {
        var enricherMethod = _EventDataEnricher2['default'][enrichableVar];
        var eventVar = event[enrichableVar];
        event[enrichableVar] = enricherMethod(eventVar, _digitalData);
      }
    }

    return event;
  };

  EventManager.prototype.reset = function reset() {
    clearInterval(_checkForChangesIntervalId);
    while (_ddListener.length) {
      _ddListener.pop();
    }
    _ddListener.push = Array.prototype.push;
    _callbacks = {};
    _autoEvents = null;
    _viewabilityTracker = null;
  };

  return EventManager;
}();

exports['default'] = EventManager;

},{"./DDHelper.js":92,"./EventDataEnricher.js":95,"./functions/after.js":101,"./functions/deleteProperty.js":102,"./functions/jsonIsEqual.js":108,"./functions/noop.js":112,"./functions/size.js":115,"async":2,"component-clone":3,"debug":56}],97:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _loadScript = require('./functions/loadScript.js');

var _loadScript2 = _interopRequireDefault(_loadScript);

var _loadIframe = require('./functions/loadIframe.js');

var _loadIframe2 = _interopRequireDefault(_loadIframe);

var _loadPixel = require('./functions/loadPixel.js');

var _loadPixel2 = _interopRequireDefault(_loadPixel);

var _format = require('./functions/format.js');

var _format2 = _interopRequireDefault(_format);

var _noop = require('./functions/noop.js');

var _noop2 = _interopRequireDefault(_noop);

var _each = require('./functions/each.js');

var _each2 = _interopRequireDefault(_each);

var _deleteProperty = require('./functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _componentEmitter = require('component-emitter');

var _componentEmitter2 = _interopRequireDefault(_componentEmitter);

var _DDHelper = require('./DDHelper.js');

var _DDHelper2 = _interopRequireDefault(_DDHelper);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Integration = function (_EventEmitter) {
  _inherits(Integration, _EventEmitter);

  function Integration(digitalData, options, tags) {
    _classCallCheck(this, Integration);

    var _this = _possibleConstructorReturn(this, _EventEmitter.call(this));

    _this.options = options;
    _this.tags = tags || {};
    _this.digitalData = digitalData;
    _this.onLoad = _this.onLoad.bind(_this);
    _this._isEnriched = false;
    return _this;
  }

  Integration.prototype.initialize = function initialize() {
    var onLoad = this.onLoad;
    _async2['default'].nextTick(onLoad);
  };

  Integration.prototype.load = function load(tagName, callback) {
    var _this2 = this;

    setTimeout(function () {
      var callbackCalled = false;
      var safeCallback = function safeCallback() {
        if (!callbackCalled) {
          callback();
        }
      };

      // sometimes loadScript callback doesn't fire
      // for https scripts in IE8, IE9 and opera
      // in this case we check is script was loaded every 500ms
      var intervalId = setInterval(function () {
        if (_this2.isLoaded()) {
          safeCallback();
          clearInterval(intervalId);
        }
      }, 500);

      // Argument shuffling
      if (typeof tagName === 'function') {
        callback = tagName;tagName = null;
      }

      // Default arguments
      tagName = tagName || 'library';

      var tag = _this2.tags[tagName];
      if (!tag) throw new Error((0, _format2['default'])('tag "%s" not defined.', tagName));
      callback = callback || _noop2['default'];

      var el = void 0;
      var attr = tag.attr;
      switch (tag.type) {
        case 'img':
          attr.width = 1;
          attr.height = 1;
          el = (0, _loadPixel2['default'])(attr, safeCallback);
          break;
        case 'script':
          el = (0, _loadScript2['default'])(attr, function (err) {
            if (!err) return safeCallback();
            (0, _debug2['default'])('error loading "%s" error="%s"', tagName, err);
          });
          // TODO: hack until refactoring load-script
          (0, _deleteProperty2['default'])(attr, 'src');
          (0, _each2['default'])(attr, function (key, value) {
            el.setAttribute(key, value);
          });
          break;
        case 'iframe':
          el = (0, _loadIframe2['default'])(attr, safeCallback);
          break;
        default:
        // No default case
      }
    }, 0);
  };

  Integration.prototype.isLoaded = function isLoaded() {
    return false;
  };

  Integration.prototype.onLoad = function onLoad() {
    this.emit('load');
  };

  Integration.prototype.addTag = function addTag(name, tag) {
    if (!tag) {
      tag = name;
      name = 'library';
    }

    this.tags[name] = tag;
    return this;
  };

  Integration.prototype.getTag = function getTag(name) {
    if (!name) {
      name = 'library';
    }
    return this.tags[name];
  };

  Integration.prototype.setOption = function setOption(name, value) {
    this.options[name] = value;
    return this;
  };

  Integration.prototype.getOption = function getOption(name) {
    return this.options[name];
  };

  Integration.prototype.get = function get(key) {
    return _DDHelper2['default'].get(key, this.digitalData);
  };

  Integration.prototype.reset = function reset() {
    // abstract
  };

  Integration.prototype.onEnrich = function onEnrich() {
    this._isEnriched = true;
    this.emit('enrich');
  };

  Integration.prototype.isEnriched = function isEnriched() {
    return this._isEnriched;
  };

  Integration.prototype.trackEvent = function trackEvent() {
    // abstract
  };

  return Integration;
}(_componentEmitter2['default']);

exports['default'] = Integration;

},{"./DDHelper.js":92,"./functions/deleteProperty.js":102,"./functions/each.js":103,"./functions/format.js":104,"./functions/loadIframe.js":109,"./functions/loadPixel.js":110,"./functions/loadScript.js":111,"./functions/noop.js":112,"async":2,"component-emitter":4,"debug":56}],98:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _noop = require('./functions/noop.js');

var _noop2 = _interopRequireDefault(_noop);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var ViewabilityTracker = function () {
  function ViewabilityTracker(options) {
    _classCallCheck(this, ViewabilityTracker);

    this.options = Object.assign({
      websiteMaxWidth: 'auto'
    }, options);

    this.$trackedComponents = {};
    this.viewedComponents = {};
    this.selectorHandlers = {};
    this.selectors = [];
  }

  ViewabilityTracker.prototype.addTracker = function addTracker(selector, handler) {
    // start tracking only when at least one
    // tracker is added
    if (this.selectors.length === 0) {
      this.startTracking();
    }

    if (this.selectors.indexOf(selector) < 0) {
      this.selectors.push(selector);
    }

    var selectorHandlers = this.selectorHandlers[selector];
    if (!selectorHandlers) {
      this.selectorHandlers[selector] = [handler];
    } else {
      selectorHandlers.push(handler);
    }

    // prepare empty array for tacking already viewed components
    if (!this.viewedComponents[selector]) {
      this.viewedComponents[selector] = [];
    }
  };

  ViewabilityTracker.prototype.initialize = function initialize() {
    var _this = this;

    if (!window.jQuery) {
      return;
    }
    window.jQuery(function () {
      // detect max website width
      if (!_this.options.websiteMaxWidth || _this.options.websiteMaxWidth === 'auto') {
        var $body = window.jQuery('body');
        _this.options.websiteMaxWidth = $body.children('.container').first().width() || $body.children('div').first().width();
      }
    });
  };

  ViewabilityTracker.prototype.defineDocBoundaries = function defineDocBoundaries() {
    var _this2 = this;

    var $window = window.jQuery(window);

    var _defineDocBoundaries = function _defineDocBoundaries() {
      _this2.docViewTop = $window.scrollTop();
      _this2.docViewBottom = _this2.docViewTop + $window.height();
      _this2.docViewLeft = $window.scrollLeft();
      _this2.docViewRight = _this2.docViewLeft + $window.width();

      var maxWebsiteWidth = _this2.options.maxWebsiteWidth;
      if (maxWebsiteWidth && maxWebsiteWidth < _this2.docViewRight && _this2.docViewLeft === 0) {
        _this2.docViewLeft = (_this2.docViewRight - maxWebsiteWidth) / 2;
        _this2.docViewRight = _this2.docViewLeft + maxWebsiteWidth;
      }
    };

    _defineDocBoundaries();
    $window.resize(function () {
      _defineDocBoundaries();
    });
    $window.scroll(function () {
      _defineDocBoundaries();
    });
  };

  ViewabilityTracker.prototype.updateTrackedComponents = function updateTrackedComponents() {
    for (var _iterator = this.selectors, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var selector = _ref;

      this.$trackedComponents[selector] = window.jQuery(selector);
    }
  };

  ViewabilityTracker.prototype.trackViews = function trackViews() {
    var _this3 = this;

    var _loop = function _loop() {
      if (_isArray2) {
        if (_i2 >= _iterator2.length) return 'break';
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) return 'break';
        _ref2 = _i2.value;
      }

      var selector = _ref2;

      var newViewedComponents = [];
      var $components = _this3.$trackedComponents[selector];
      $components.each(function (index, el) {
        // eslint-disable-line no-loop-func
        var $el = window.jQuery(el);
        if (_this3.viewedComponents[selector].indexOf(el) < 0 && _this3.isVisible($el)) {
          _this3.viewedComponents[selector].push(el);
          newViewedComponents.push(el);
        }
      });

      if (newViewedComponents.length > 0) {
        var handlers = _this3.selectorHandlers[selector];
        for (var _iterator3 = handlers, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
          var _ref3;

          if (_isArray3) {
            if (_i3 >= _iterator3.length) break;
            _ref3 = _iterator3[_i3++];
          } else {
            _i3 = _iterator3.next();
            if (_i3.done) break;
            _ref3 = _i3.value;
          }

          var handler = _ref3;

          handler(newViewedComponents, _noop2['default']);
        }
      }
    };

    for (var _iterator2 = this.selectors, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      var _ret = _loop();

      if (_ret === 'break') break;
    }
  };

  ViewabilityTracker.prototype.startTracking = function startTracking() {
    var _this4 = this;

    this.defineDocBoundaries();

    var _track = function _track() {
      _this4.updateTrackedComponents();
      _this4.trackViews();
    };

    _track();
    setInterval(function () {
      _track();
    }, 500);
  };

  /**
   * Returns true if element is visible by css
   * and at least 3/4 of the element fit user viewport
   *
   * @param $elem JQuery object
   * @returns boolean
   */

  ViewabilityTracker.prototype.isVisible = function isVisible($elem) {
    var el = $elem[0];
    var $window = window.jQuery(window);

    var elemOffset = $elem.offset();
    var elemWidth = $elem.width();
    var elemHeight = $elem.height();

    var elemTop = elemOffset.top;
    var elemBottom = elemTop + elemHeight;
    var elemLeft = elemOffset.left;
    var elemRight = elemLeft + elemWidth;

    var visible = $elem.is(':visible') && $elem.css('opacity') > 0 && $elem.css('visibility') !== 'hidden';
    if (!visible) {
      return false;
    }

    var fitsVertical = elemBottom - elemHeight / 4 <= this.docViewBottom && elemTop + elemHeight / 4 >= this.docViewTop;
    var fitsHorizontal = elemLeft + elemWidth / 4 >= this.docViewLeft && elemRight - elemWidth / 4 <= this.docViewRight;

    if (!fitsVertical || !fitsHorizontal) {
      return false;
    }

    var elementFromPoint = document.elementFromPoint(elemLeft - $window.scrollLeft() + elemWidth / 2, elemTop - $window.scrollTop() + elemHeight / 2);

    while (elementFromPoint && elementFromPoint !== el && elementFromPoint.parentNode !== document) {
      elementFromPoint = elementFromPoint.parentNode;
    }

    return !!elementFromPoint && elementFromPoint === el;
  };

  return ViewabilityTracker;
}();

exports['default'] = ViewabilityTracker;

},{"./functions/noop.js":112}],99:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _GoogleAnalytics = require('./integrations/GoogleAnalytics.js');

var _GoogleAnalytics2 = _interopRequireDefault(_GoogleAnalytics);

var _GoogleTagManager = require('./integrations/GoogleTagManager.js');

var _GoogleTagManager2 = _interopRequireDefault(_GoogleTagManager);

var _Driveback = require('./integrations/Driveback.js');

var _Driveback2 = _interopRequireDefault(_Driveback);

var _RetailRocket = require('./integrations/RetailRocket.js');

var _RetailRocket2 = _interopRequireDefault(_RetailRocket);

var _FacebookPixel = require('./integrations/FacebookPixel.js');

var _FacebookPixel2 = _interopRequireDefault(_FacebookPixel);

var _SegmentStream = require('./integrations/SegmentStream.js');

var _SegmentStream2 = _interopRequireDefault(_SegmentStream);

var _SendPulse = require('./integrations/SendPulse.js');

var _SendPulse2 = _interopRequireDefault(_SendPulse);

var _OWOXBIStreaming = require('./integrations/OWOXBIStreaming.js');

var _OWOXBIStreaming2 = _interopRequireDefault(_OWOXBIStreaming);

var _Criteo = require('./integrations/Criteo.js');

var _Criteo2 = _interopRequireDefault(_Criteo);

var _MyTarget = require('./integrations/MyTarget.js');

var _MyTarget2 = _interopRequireDefault(_MyTarget);

var _YandexMetrica = require('./integrations/YandexMetrica.js');

var _YandexMetrica2 = _interopRequireDefault(_YandexMetrica);

var _Vkontakte = require('./integrations/Vkontakte.js');

var _Vkontakte2 = _interopRequireDefault(_Vkontakte);

var _Emarsys = require('./integrations/Emarsys.js');

var _Emarsys2 = _interopRequireDefault(_Emarsys);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var integrations = {
  'Google Analytics': _GoogleAnalytics2['default'],
  'Google Tag Manager': _GoogleTagManager2['default'],
  'OWOX BI Streaming': _OWOXBIStreaming2['default'],
  'Facebook Pixel': _FacebookPixel2['default'],
  'Driveback': _Driveback2['default'],
  'Retail Rocket': _RetailRocket2['default'],
  'SegmentStream': _SegmentStream2['default'],
  'SendPulse': _SendPulse2['default'],
  'Criteo': _Criteo2['default'],
  'myTarget': _MyTarget2['default'],
  'Yandex Metrica': _YandexMetrica2['default'],
  'Vkontakte': _Vkontakte2['default'],
  'Emarsys': _Emarsys2['default']
};

exports['default'] = integrations;

},{"./integrations/Criteo.js":117,"./integrations/Driveback.js":118,"./integrations/Emarsys.js":119,"./integrations/FacebookPixel.js":120,"./integrations/GoogleAnalytics.js":121,"./integrations/GoogleTagManager.js":122,"./integrations/MyTarget.js":123,"./integrations/OWOXBIStreaming.js":124,"./integrations/RetailRocket.js":125,"./integrations/SegmentStream.js":126,"./integrations/SendPulse.js":127,"./integrations/Vkontakte.js":128,"./integrations/YandexMetrica.js":129}],100:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var _componentClone = require('component-clone');

var _componentClone2 = _interopRequireDefault(_componentClone);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _size = require('./functions/size.js');

var _size2 = _interopRequireDefault(_size);

var _after = require('./functions/after.js');

var _after2 = _interopRequireDefault(_after);

var _each = require('./functions/each.js');

var _each2 = _interopRequireDefault(_each);

var _componentEmitter = require('component-emitter');

var _componentEmitter2 = _interopRequireDefault(_componentEmitter);

var _Integration = require('./Integration.js');

var _Integration2 = _interopRequireDefault(_Integration);

var _EventManager = require('./EventManager.js');

var _EventManager2 = _interopRequireDefault(_EventManager);

var _AutoEvents = require('./AutoEvents.js');

var _AutoEvents2 = _interopRequireDefault(_AutoEvents);

var _ViewabilityTracker = require('./ViewabilityTracker.js');

var _ViewabilityTracker2 = _interopRequireDefault(_ViewabilityTracker);

var _DDHelper = require('./DDHelper.js');

var _DDHelper2 = _interopRequireDefault(_DDHelper);

var _DigitalDataEnricher = require('./DigitalDataEnricher.js');

var _DigitalDataEnricher2 = _interopRequireDefault(_DigitalDataEnricher);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var ddManager = void 0;

/**
 * @type {string}
 * @private
 */
var _digitalDataNamespace = 'digitalData';

/**
 * @type {string}
 * @private
 */
var _ddListenerNamespace = 'ddListener';

/**
 * @type {string}
 * @private
 */
var _ddManagerNamespace = 'ddManager';

/**
 * @type {Object}
 * @private
 */
var _digitalData = {};

/**
 * @type {Array}
 * @private
 */
var _ddListener = [];

/**
 * @type {Object}
 * @private
 */
var _availableIntegrations = void 0;

/**
 * @type {EventManager}
 * @private
 */
var _eventManager = void 0;

/**
 * @type {Object}
 * @private
 */
var _integrations = {};

/**
 * @type {boolean}
 * @private
 */
var _isLoaded = false;

/**
 * @type {boolean}
 * @private
 */
var _isReady = false;

function _prepareGlobals() {
  if (_typeof(window[_digitalDataNamespace]) === 'object') {
    _digitalData = window[_digitalDataNamespace];
  } else {
    window[_digitalDataNamespace] = _digitalData;
  }

  _digitalData.website = _digitalData.website || {};
  _digitalData.page = _digitalData.page || {};
  _digitalData.user = _digitalData.user || {};
  _digitalData.context = _digitalData.context || {};
  _digitalData.integrations = _digitalData.integrations || {};
  if (!_digitalData.page.type || _digitalData.page.type !== 'confirmation') {
    _digitalData.cart = _digitalData.cart || {};
  }

  if (Array.isArray(window[_ddListenerNamespace])) {
    _ddListener = window[_ddListenerNamespace];
  } else {
    window[_ddListenerNamespace] = _ddListener;
  }
}

function _initializeIntegrations(settings) {
  var onLoad = function onLoad() {
    _isLoaded = true;
    ddManager.emit('load');
  };

  if (settings && (typeof settings === 'undefined' ? 'undefined' : _typeof(settings)) === 'object') {
    (function () {
      var integrationSettings = settings.integrations;
      if (integrationSettings) {
        if (Array.isArray(integrationSettings)) {
          for (var _iterator = integrationSettings, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            var _ref;

            if (_isArray) {
              if (_i >= _iterator.length) break;
              _ref = _iterator[_i++];
            } else {
              _i = _iterator.next();
              if (_i.done) break;
              _ref = _i.value;
            }

            var integrationSetting = _ref;

            var name = integrationSetting.name;
            var options = (0, _componentClone2['default'])(integrationSetting.options);
            if (typeof _availableIntegrations[name] === 'function') {
              var integration = new _availableIntegrations[name](_digitalData, options || {});
              ddManager.addIntegration(name, integration);
            }
          }
        } else {
          (0, _each2['default'])(integrationSettings, function (name, options) {
            if (typeof _availableIntegrations[name] === 'function') {
              var _integration = new _availableIntegrations[name](_digitalData, (0, _componentClone2['default'])(options));
              ddManager.addIntegration(name, _integration);
            }
          });
        }
      }

      var loaded = (0, _after2['default'])((0, _size2['default'])(_integrations), onLoad);

      if ((0, _size2['default'])(_integrations) > 0) {
        (0, _each2['default'])(_integrations, function (name, integration) {
          if (!integration.isLoaded() || integration.getOption('noConflict')) {
            integration.once('load', loaded);
            integration.initialize();
            _eventManager.addCallback(['on', 'event', function (event) {
              return integration.trackEvent(event);
            }], true);
          } else {
            loaded();
          }
        });
      } else {
        loaded();
      }
    })();
  }
}

ddManager = {

  VERSION: '1.1.2',

  setAvailableIntegrations: function setAvailableIntegrations(availableIntegrations) {
    _availableIntegrations = availableIntegrations;
  },

  processEarlyStubCalls: function processEarlyStubCalls() {
    var earlyStubCalls = window[_ddManagerNamespace] || [];
    var methodCallPromise = function methodCallPromise(method, args) {
      return function () {
        ddManager[method].apply(ddManager, args);
      };
    };

    while (earlyStubCalls.length > 0) {
      var args = earlyStubCalls.shift();
      var method = args.shift();
      if (ddManager[method]) {
        if (method === 'initialize' && earlyStubCalls.length > 0) {
          // run initialize stub after all other stubs
          _async2['default'].nextTick(methodCallPromise(method, args));
        } else {
          ddManager[method].apply(ddManager, args);
        }
      }
    }
  },

  /**
   * Initialize Digital Data Manager
   * @param settings
   *
   * Example:
   *
   * {
   *    autoEvents: {
   *      trackDOMComponents: {
   *        maxWebsiteWidth: 1024
   *      }
   *    },
   *    domain: 'example.com',
   *    sessionLength: 3600,
   *    integrations: [
   *      {
   *        'name': 'Google Tag Manager',
   *        'options': {
   *          'containerId': 'XXX'
   *        }
   *      },
   *      {
   *        'name': 'Google Analytics',
   *        'options': {
   *          'trackingId': 'XXX'
   *        }
   *      }
   *    ]
   * }
   */
  initialize: function initialize(settings) {
    settings = Object.assign({
      domain: null,
      autoEvents: {
        trackDOMComponents: false
      },
      websiteMaxWidth: 'auto',
      sessionLength: 3600
    }, settings);

    if (_isReady) {
      throw new Error('ddManager is already initialized');
    }

    _prepareGlobals();

    // initialize digital data enricher
    var digitalDataEnricher = new _DigitalDataEnricher2['default'](_digitalData);
    digitalDataEnricher.enrichDigitalData();

    // initialize event manager
    _eventManager = new _EventManager2['default'](_digitalData, _ddListener);
    if (settings.autoEvents !== false) {
      _eventManager.setAutoEvents(new _AutoEvents2['default'](settings.autoEvents));
    }
    _eventManager.setViewabilityTracker(new _ViewabilityTracker2['default']({
      websiteMaxWidth: settings.websiteMaxWidth
    }));

    _initializeIntegrations(settings);

    // should be initialized after integrations, otherwise
    // autoEvents will be fired immediately
    _eventManager.initialize();

    _isReady = true;
    ddManager.emit('ready');
  },

  isLoaded: function isLoaded() {
    return _isLoaded;
  },

  isReady: function isReady() {
    return _isReady;
  },

  addIntegration: function addIntegration(name, integration) {
    if (_isReady) {
      throw new Error('Adding integrations after ddManager initialization is not allowed');
    }

    if (!integration instanceof _Integration2['default'] || !name) {
      throw new TypeError('attempted to add an invalid integration');
    }
    _integrations[name] = integration;
  },

  getIntegration: function getIntegration(name) {
    return _integrations[name];
  },

  get: function get(key) {
    return _DDHelper2['default'].get(key, _digitalData);
  },

  getProduct: function getProduct(id) {
    return _DDHelper2['default'].getProduct(id, _digitalData);
  },

  getCampaign: function getCampaign(id) {
    return _DDHelper2['default'].getCampaign(id, _digitalData);
  },

  getEventManager: function getEventManager() {
    return _eventManager;
  },

  reset: function reset() {
    if (_eventManager instanceof _EventManager2['default']) {
      _eventManager.reset();
    }
    (0, _each2['default'])(_integrations, function (name, integration) {
      integration.removeAllListeners();
      integration.reset();
    });
    ddManager.removeAllListeners();
    _eventManager = null;
    _integrations = {};
    _isLoaded = false;
    _isReady = false;
  },

  Integration: _Integration2['default']
};

(0, _componentEmitter2['default'])(ddManager);

// fire ready and initialize event immediately
// if ddManager is already ready or initialized
var originalOn = ddManager.on;
ddManager.on = ddManager.addEventListener = function (event, handler) {
  if (event === 'ready') {
    if (_isReady) {
      handler();
      return;
    }
  } else if (event === 'load') {
    if (_isLoaded) {
      handler();
      return;
    }
  }

  originalOn.call(ddManager, event, handler);
};

exports['default'] = ddManager;

},{"./AutoEvents.js":91,"./DDHelper.js":92,"./DigitalDataEnricher.js":94,"./EventManager.js":96,"./Integration.js":97,"./ViewabilityTracker.js":98,"./functions/after.js":101,"./functions/each.js":103,"./functions/size.js":115,"async":2,"component-clone":3,"component-emitter":4}],101:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (times, fn) {
  var timeLeft = times;
  return function afterAll() {
    if (--timeLeft < 1) {
      return fn.apply(this, arguments);
    }
  };
};

},{}],102:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj, prop) {
  try {
    delete obj[prop];
  } catch (e) {
    obj[prop] = undefined;
  }
};

},{}],103:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj, fn) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      fn(key, obj[key]);
    }
  }
};

},{}],104:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = format;
/**
 * toString.
 */

var toString = window.JSON ? JSON.stringify : String;

/**
 * Formatters
 */

var formatters = {
  o: toString,
  s: String,
  d: parseInt
};

/**
 * Format the given `str`.
 *
 * @param {String} str
 * @param {...} args
 * @return {String}
 * @api public
 */

function format(str) {
  var args = [].slice.call(arguments, 1);
  var j = 0;

  return str.replace(/%([a-z])/gi, function (_, f) {
    return formatters[f] ? formatters[f](args[j++]) : _ + f;
  });
}

},{}],105:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (obj, prop) {
  var keyParts = _keyToArray(prop);
  var nestedVar = obj;
  while (keyParts.length > 0) {
    var childKey = keyParts.shift();
    if (nestedVar.hasOwnProperty(childKey)) {
      nestedVar = nestedVar[childKey];
    } else {
      return undefined;
    }
  }
  return nestedVar;
};

function _keyToArray(key) {
  key = key.trim();
  if (key === '') {
    return [];
  }
  key = key.replace(/\[(\w+)\]/g, '.$1');
  key = key.replace(/^\./, '');
  return key.split('.');
}

},{}],106:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = getQueryParam;
function getQueryParam(name, queryString) {
  if (!queryString) {
    queryString = location.search;
  }
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(queryString);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

},{}],107:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = {
  getDocument: function getDocument() {
    return window.document;
  },

  getLocation: function getLocation() {
    return window.location;
  },

  getNavigator: function getNavigator() {
    return window.navigator;
  }
};

},{}],108:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = jsonIsEqual;
function jsonIsEqual(json1, json2) {
  if (typeof json1 !== 'string') {
    json1 = JSON.stringify(json1);
  }
  if (typeof json2 !== 'string') {
    json2 = JSON.stringify(json2);
  }
  return json1 === json2;
}

},{}],109:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (options, fn) {
  if (!options) throw new Error('Cant load nothing...');

  // Allow for the simplest case, just passing a `src` string.
  if (typeof options === 'string') options = { src: options };

  var https = document.location.protocol === 'https:' || document.location.protocol === 'chrome-extension:';

  // If you use protocol relative URLs, third-party scripts like Google
  // Analytics break when testing with `file:` so this fixes that.
  if (options.src && options.src.indexOf('//') === 0) {
    options.src = https ? 'https:' + options.src : 'http:' + options.src;
  }

  // Allow them to pass in different URLs depending on the protocol.
  if (https && options.https) options.src = options.https;else if (!https && options.http) options.src = options.http;

  // Make the `<iframe>` element and insert it before the first iframe on the
  // page, which is guaranteed to exist since this Javaiframe is running.
  var iframe = document.createElement('iframe');
  iframe.src = options.src;
  iframe.width = options.width || 1;
  iframe.height = options.height || 1;
  iframe.style.display = 'none';

  // If we have a fn, attach event handlers, even in IE. Based off of
  // the Third-Party Javascript script loading example:
  // https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html
  if (typeof fn === 'function') {
    (0, _scriptOnLoad2['default'])(iframe, fn);
  }

  _async2['default'].nextTick(function () {
    // Append after event listeners are attached for IE.
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(iframe, firstScript);
  });

  // Return the iframe element in case they want to do anything special, like
  // give it an ID or attributes.
  return iframe;
};

var _scriptOnLoad = require('./scriptOnLoad.js');

var _scriptOnLoad2 = _interopRequireDefault(_scriptOnLoad);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

},{"./scriptOnLoad.js":113,"async":2}],110:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (options, fn) {
  fn = fn || function onPixelLoaded() {};
  var img = new Image();
  img.onerror = error(fn, 'failed to load pixel', img);
  img.onload = fn;
  img.src = options.src;
  img.width = 1;
  img.height = 1;
  return img;
};

/**
 * Create an error handler.
 *
 * @param {Fucntion} fn
 * @param {String} message
 * @param {Image} img
 * @return {Function}
 * @api private
 */

function error(fn, message, img) {
  return function (e) {
    e = e || window.event;
    var err = new Error(message);
    err.event = e;
    err.source = img;
    fn(err);
  };
}

},{}],111:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (options, fn) {
  if (!options) throw new Error('Cant load nothing...');

  // Allow for the simplest case, just passing a `src` string.
  if (typeof options === 'string') options = { src: options };

  var https = document.location.protocol === 'https:' || document.location.protocol === 'chrome-extension:';

  // If you use protocol relative URLs, third-party scripts like Google
  // Analytics break when testing with `file:` so this fixes that.
  if (options.src && options.src.indexOf('//') === 0) {
    options.src = https ? 'https:' + options.src : 'http:' + options.src;
  }

  // Allow them to pass in different URLs depending on the protocol.
  if (https && options.https) options.src = options.https;else if (!https && options.http) options.src = options.http;

  // Make the `<script>` element and insert it before the first script on the
  // page, which is guaranteed to exist since this Javascript is running.
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = options.src;

  // If we have a fn, attach event handlers, even in IE. Based off of
  // the Third-Party Javascript script loading example:
  // https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html
  if (typeof fn === 'function') {
    (0, _scriptOnLoad2['default'])(script, fn);
  }

  _async2['default'].nextTick(function () {
    // Append after event listeners are attached for IE.
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  });

  // Return the script element in case they want to do anything special, like
  // give it an ID or attributes.
  return script;
};

var _scriptOnLoad = require('./scriptOnLoad.js');

var _scriptOnLoad2 = _interopRequireDefault(_scriptOnLoad);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

},{"./scriptOnLoad.js":113,"async":2}],112:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function () {};

},{}],113:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (el, fn) {
  return el.addEventListener ? addEventListener(el, fn) : attachEvent(el, fn);
};

/**
 * Add event listener to `el`, `fn()`.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api private
 */

function addEventListener(el, fn) {
  el.addEventListener('load', function (_, e) {
    fn(null, e);
  }, false);
  el.addEventListener('error', function (e) {
    var err = new Error('script error "' + el.src + '"');
    err.event = e;
    fn(err);
  }, false);
}

/**
 * Attach event.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api private
 */

function attachEvent(el, fn) {
  el.attachEvent('onreadystatechange', function (e) {
    if (!/complete|loaded/.test(el.readyState)) return;
    // IE8 FIX
    if (el.readyState === 'loaded') {
      setTimeout(function () {
        fn(null, e);
      }, 500);
    } else {
      fn(null, e);
    }
  });
  el.attachEvent('onerror', function (e) {
    var err = new Error('failed to load the script "' + el.src + '"');
    err.event = e || window.event;
    fn(err);
  });
}

},{}],114:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.cmp = cmp;
function cmp(a, b) {
  var pa = a.split('.');
  var pb = b.split('.');
  for (var i = 0; i < 3; i++) {
    var na = Number(pa[i]);
    var nb = Number(pb[i]);
    if (na > nb) return 1;
    if (nb > na) return -1;
    if (!isNaN(na) && isNaN(nb)) return 1;
    if (isNaN(na) && !isNaN(nb)) return -1;
  }
  return 0;
}

exports['default'] = { cmp: cmp };

},{}],115:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj) {
  var size = 0;
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

},{}],116:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = throwError;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function throwError(code, message) {
  if (arguments.length === 1) {
    message = code;
    code = 'error';
  }
  var error = {
    code: code,
    message: message
  };
  (0, _debug2['default'])(message);
  throw error;
}

},{"debug":56}],117:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _semver = require('./../functions/semver');

var _semver2 = _interopRequireDefault(_semver);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof2(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof2(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

function lineItemsToCriteoItems(lineItems) {
  var products = [];
  for (var i = 0, length = lineItems.length; i < length; i++) {
    var lineItem = lineItems[i];
    if (lineItem.product) {
      var productId = lineItem.product.id || lineItem.product.skuCode;
      if (productId) {
        var product = {
          id: productId,
          price: lineItem.product.unitSalePrice || lineItem.product.unitPrice || 0,
          quantity: lineItem.quantity || 1
        };
        products.push(product);
      }
    }
  }
  return products;
}

var Criteo = function (_Integration) {
  _inherits(Criteo, _Integration);

  function Criteo(digitalData, options) {
    _classCallCheck(this, Criteo);

    var optionsWithDefaults = Object.assign({
      account: '',
      deduplication: undefined,
      noConflict: false
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.addTag({
      type: 'script',
      attr: {
        src: '//static.criteo.net/js/ld/ld.js'
      }
    });
    return _this;
  }

  Criteo.prototype.initialize = function initialize() {
    window.criteo_q = window.criteo_q || [];

    if (this.getOption('account') && !this.getOption('noConflict')) {
      var email = this.digitalData.user.email;
      var siteType = void 0;
      if (this.digitalData.version && _semver2['default'].cmp(this.digitalData.version, '1.1.0') < 0) {
        siteType = this.digitalData.page.siteType;
      } else {
        siteType = this.digitalData.website.type;
      }

      if (siteType) {
        siteType = siteType.toLocaleLowerCase();
      }

      if (['desktop', 'tablet', 'mobile'].indexOf(siteType) < 0) {
        siteType = 'desktop';
      }

      window.criteo_q.push({
        event: 'setAccount',
        account: this.getOption('account')
      }, {
        event: 'setSiteType',
        type: siteType.charAt(0) });

      if (email) {
        window.criteo_q.push({
          event: 'setEmail',
          email: email
        });
      } else {
        window.ddListener.push(['on', 'change:user.email', function (newValue) {
          window.criteo_q.push({
            event: 'setEmail',
            email: newValue
          });
        }]);
      }
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  };

  Criteo.prototype.isLoaded = function isLoaded() {
    return !!window.criteo_q && _typeof(window.criteo_q) === 'object';
  };

  Criteo.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'criteo_q');
  };

  Criteo.prototype.trackEvent = function trackEvent(event) {
    var methods = {
      'Viewed Page': 'onViewedPage',
      'Viewed Product Detail': 'onViewedProductDetail',
      'Completed Transaction': 'onCompletedTransaction',
      'Viewed Product Category': 'onViewedProductListing',
      'Viewed Cart': 'onViewedCart',
      'Searched': 'onViewedProductListing',
      'Subscribed': 'onSubscribed'
    };

    if (this.getOption('noConflict') !== true || event.name === 'Subscribed') {
      var method = methods[event.name];
      if (method) {
        this[method](event);
      }
    }
  };

  Criteo.prototype.onViewedPage = function onViewedPage(event) {
    var page = event.page;
    if (page) {
      if (page.type === 'home') {
        this.onViewedHome();
      }
    }
  };

  Criteo.prototype.onViewedHome = function onViewedHome() {
    window.criteo_q.push({
      event: 'viewHome'
    });
  };

  Criteo.prototype.onViewedProductListing = function onViewedProductListing(event) {
    var listing = event.listing;
    if (!listing || !listing.items || !listing.items.length) return;

    var items = listing.items;
    var productIds = [];
    var length = 3;
    if (items.length < 3) {
      length = items.length;
    }
    for (var i = 0; i < length; i++) {
      var productId = items[i].id || items[i].skuCode;
      if (productId) {
        productIds.push(productId);
      }
    }
    if (productIds.length > 0) {
      window.criteo_q.push({
        event: 'viewList',
        item: productIds
      });
    }
  };

  Criteo.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var product = event.product;
    var productId = void 0;
    if (product) {
      productId = product.id || product.skuCode;
    }
    if (productId) {
      window.criteo_q.push({
        event: 'viewItem',
        item: productId
      });
    }
  };

  Criteo.prototype.onViewedCart = function onViewedCart(event) {
    var cart = event.cart;
    if (cart && cart.lineItems && cart.lineItems.length > 0) {
      var products = lineItemsToCriteoItems(cart.lineItems);
      if (products.length > 0) {
        window.criteo_q.push({
          event: 'viewBasket',
          item: products
        });
      }
    }
  };

  Criteo.prototype.onCompletedTransaction = function onCompletedTransaction(event) {
    var transaction = event.transaction;
    if (transaction && transaction.lineItems && transaction.lineItems.length > 0) {
      var products = lineItemsToCriteoItems(transaction.lineItems);
      if (products.length > 0) {
        var deduplication = 0;
        if (this.getOption('deduplication') !== undefined) {
          deduplication = this.getOption('deduplication') ? 1 : 0;
        } else {
          var context = this.digitalData.context;
          if (context.campaign && context.campaign.source && context.campaign.source.toLocaleLowerCase() === 'criteo') {
            deduplication = 1;
          }
        }
        window.criteo_q.push({
          event: 'trackTransaction',
          id: transaction.orderId,
          new_customer: transaction.isFirst ? 1 : 0,
          deduplication: deduplication,
          item: products
        });
      }
    }
  };

  Criteo.prototype.onSubscribed = function onSubscribed(event) {
    var user = event.user;
    if (user && user.email) {
      window.criteo_q.push({
        event: 'setEmail',
        email: user.email
      });
    }
  };

  return Criteo;
}(_Integration3['default']);

exports['default'] = Criteo;

},{"./../Integration.js":97,"./../functions/deleteProperty":102,"./../functions/semver":114}],118:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _noop = require('./../functions/noop.js');

var _noop2 = _interopRequireDefault(_noop);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Driveback = function (_Integration) {
  _inherits(Driveback, _Integration);

  function Driveback(digitalData, options) {
    _classCallCheck(this, Driveback);

    var optionsWithDefaults = Object.assign({
      autoInit: true,
      websiteToken: ''
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.addTag({
      type: 'script',
      attr: {
        id: 'driveback-sdk',
        src: '//cdn.driveback.ru/js/loader.js'
      }
    });
    return _this;
  }

  Driveback.prototype.initialize = function initialize() {
    var _this2 = this;

    if (this.getOption('websiteToken')) {
      window.DrivebackNamespace = 'Driveback';
      window.Driveback = window.Driveback || {};
      window.DrivebackOnLoad = window.DrivebackOnLoad || [];
      window.Driveback.initStubCalled = false;
      window.Driveback.init = function () {
        window.Driveback.initStubCalled = true;
      };
      window.DrivebackLoaderAsyncInit = function () {
        window.Driveback.Loader.init(_this2.getOption('websiteToken'));
      };
      // by default Driveback is initialized automatically
      if (this.getOption('autoInit') === false) {
        window.DrivebackAsyncInit = _noop2['default'];
      }
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  };

  Driveback.prototype.isLoaded = function isLoaded() {
    return !!(window.Driveback && window.Driveback.Loader);
  };

  Driveback.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'Driveback');
    (0, _deleteProperty2['default'])(window, 'DriveBack');
    (0, _deleteProperty2['default'])(window, 'DrivebackNamespace');
    (0, _deleteProperty2['default'])(window, 'DrivebackOnLoad');
    (0, _deleteProperty2['default'])(window, 'DrivebackLoaderAsyncInit');
    (0, _deleteProperty2['default'])(window, 'DrivebackAsyncInit');
  };

  return Driveback;
}(_Integration3['default']);

exports['default'] = Driveback;

},{"./../Integration.js":97,"./../functions/deleteProperty.js":102,"./../functions/noop.js":112}],119:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof2(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof2(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

function go() {
  window.ScarabQueue.push(['go']);
}

function calculateLineItemSubtotal(lineItem) {
  var product = lineItem.product;
  var price = product.unitSalePrice || product.unitPrice || 0;
  var quantity = lineItem.quantity || 1;
  return price * quantity;
}

function mapLineItems(lineItems) {
  return lineItems.map(function mapLineItem(lineItem) {
    var product = lineItem.product;
    var lineItemSubtotal = lineItem.subtotal || calculateLineItemSubtotal(lineItem);
    return {
      item: product.id || product.skuCode,
      price: lineItemSubtotal,
      quantity: lineItem.quantity || 1
    };
  });
}

var Emarsys = function (_Integration) {
  _inherits(Emarsys, _Integration);

  function Emarsys(digitalData, options) {
    _classCallCheck(this, Emarsys);

    var optionsWithDefaults = Object.assign({
      merchantId: '',
      categorySeparator: ' > ',
      noConflict: false
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.addTag({
      type: 'script',
      attr: {
        id: 'scarab-js-api',
        src: '//recommender.scarabresearch.com/js/' + options.merchantId + '/scarab-v2.js'
      }
    });
    return _this;
  }

  Emarsys.prototype.initialize = function initialize() {
    window.ScarabQueue = window.ScarabQueue || [];
    if (!this.getOption('noConflict')) {
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  };

  Emarsys.prototype.isLoaded = function isLoaded() {
    return (typeof ScarabQueue === 'undefined' ? 'undefined' : _typeof(ScarabQueue)) === 'object';
  };

  Emarsys.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'ScarabQueue');
  };

  Emarsys.prototype.enrichDigitalData = function enrichDigitalData(done) {
    // TODO
    /*
    ScarabQueue.push(['recommend', {
      logic: 'TOPICAL',
      limit: 2,
      containerId: 'personal-recs',
      success: function(SC) {
        var container = SC.recommender.container;
        delete SC.recommender.container;
        container.innerHTML = JSON.stringify(SC, null, '  ');
        done();
      }
    }]);
    ScarabQueue.push(['go']);
    */
    done();
  };

  Emarsys.prototype.trackEvent = function trackEvent(event) {
    var methods = {
      'Viewed Page': 'onViewedPage',
      'Searched': 'onSearched',
      'Viewed Product Category': 'onViewedProductCategory',
      'Viewed Product Detail': 'onViewedProductDetail',
      'Completed Transaction': 'onCompletedTransaction'
    };

    var method = methods[event.name];
    if (this.getOption('merchantId')) {
      if (method && !this.getOption('noConflict')) {
        this[method](event);
      } else if (!method) {
        this.trackCustomEvent(event);
      }
    }
  };

  Emarsys.prototype.sendCommonData = function sendCommonData() {
    var user = this.digitalData.user || {};
    var cart = this.digitalData.cart || {};
    if (user.email) {
      window.ScarabQueue.push(['setEmail', user.email]);
    } else if (user.userId) {
      window.ScarabQueue.push(['setCustomerId', user.userId]);
    }
    if (cart.lineItems && cart.lineItems.length > 0) {
      window.ScarabQueue.push(['cart', mapLineItems(cart.lineItems)]);
    } else {
      window.ScarabQueue.push(['cart', []]);
    }
  };

  Emarsys.prototype.onViewedPage = function onViewedPage(event) {
    var page = event.page;
    this.sendCommonData();
    // product, category, search and confirmation pages are tracked separately
    if (['product', 'category', 'search', 'confirmation'].indexOf(page.type) < 0) {
      go();
    }
  };

  Emarsys.prototype.onViewedProductCategory = function onViewedProductCategory(event) {
    var listing = event.listing || {};
    var category = listing.category;
    if (Array.isArray(listing.category)) {
      category = category.join(this.getOption('categorySeparator'));
    }
    window.ScarabQueue.push(['category', category]);
    go();
  };

  Emarsys.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var product = event.product;
    window.ScarabQueue.push(['view', product.id || product.skuCode]);
    go();
  };

  Emarsys.prototype.onSearched = function onSearched(event) {
    var listing = event.listing || {};
    window.ScarabQueue.push(['searchTerm', listing.query]);
    go();
  };

  Emarsys.prototype.onCompletedTransaction = function onCompletedTransaction(event) {
    var transaction = event.transaction;
    window.ScarabQueue.push(['purchase', {
      orderId: transaction.orderId,
      items: mapLineItems(transaction.lineItems)
    }]);
    go();
  };

  return Emarsys;
}(_Integration3['default']);

exports['default'] = Emarsys;

},{"./../Integration.js":97,"./../functions/deleteProperty.js":102}],120:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _componentType = require('component-type');

var _componentType2 = _interopRequireDefault(_componentType);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var FacebookPixel = function (_Integration) {
  _inherits(FacebookPixel, _Integration);

  function FacebookPixel(digitalData, options) {
    _classCallCheck(this, FacebookPixel);

    var optionsWithDefaults = Object.assign({
      pixelId: ''
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.addTag({
      type: 'script',
      attr: {
        src: '//connect.facebook.net/en_US/fbevents.js'
      }
    });
    return _this;
  }

  FacebookPixel.prototype.initialize = function initialize() {
    if (this.getOption('pixelId') && !window.fbq) {
      window.fbq = window._fbq = function fbq() {
        if (window.fbq.callMethod) {
          window.fbq.callMethod.apply(window.fbq, arguments);
        } else {
          window.fbq.queue.push(arguments);
        }
      };
      window.fbq.push = window.fbq;
      window.fbq.loaded = true;
      window.fbq.version = '2.0';
      window.fbq.queue = [];
      this.load(this.onLoad);
      window.fbq('init', this.getOption('pixelId'));
    } else {
      this.onLoad();
    }
  };

  FacebookPixel.prototype.isLoaded = function isLoaded() {
    return !!(window.fbq && window.fbq.callMethod);
  };

  FacebookPixel.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'fbq');
  };

  FacebookPixel.prototype.trackEvent = function trackEvent(event) {
    if (event.name === 'Viewed Page') {
      this.onViewedPage();
    } else if (event.name === 'Viewed Product Category') {
      this.onViewedProductCategory(event.listing);
    } else if (event.name === 'Viewed Product Detail') {
      this.onViewedProductDetail(event.product);
    } else if (event.name === 'Added Product') {
      this.onAddedProduct(event.product, event.quantity);
    } else if (event.name === 'Completed Transaction') {
      this.onCompletedTransaction(event.transaction);
    } else if (['Viewed Product', 'Clicked Product', 'Viewed Campaign', 'Clicked Campaign', 'Removed Product', 'Viewed Checkout Step', 'Completed Checkout Step', 'Refunded Transaction'].indexOf(event.name) < 0) {
      this.onCustomEvent(event);
    }
  };

  FacebookPixel.prototype.onViewedPage = function onViewedPage() {
    window.fbq('track', 'PageView');
  };

  FacebookPixel.prototype.onViewedProductCategory = function onViewedProductCategory(listing) {
    window.fbq('track', 'ViewContent', {
      content_ids: [listing.categoryId || ''],
      content_type: 'product_group'
    });
  };

  FacebookPixel.prototype.onViewedProductDetail = function onViewedProductDetail(product) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id || product.skuCode || ''],
      content_type: 'product',
      content_name: product.name || '',
      content_category: product.category || '',
      currency: product.currency || '',
      value: product.unitSalePrice || product.unitPrice || 0
    });
  };

  FacebookPixel.prototype.onAddedProduct = function onAddedProduct(product, quantity) {
    if (product && (0, _componentType2['default'])(product) === 'object') {
      quantity = quantity || 1;
      window.fbq('track', 'AddToCart', {
        content_ids: [product.id || product.skuCode || ''],
        content_type: 'product',
        content_name: product.name || '',
        content_category: product.category || '',
        currency: product.currency || '',
        value: quantity * (product.unitSalePrice || product.unitPrice || 0)
      });
    }
  };

  FacebookPixel.prototype.onCompletedTransaction = function onCompletedTransaction(transaction) {
    if (transaction.lineItems && transaction.lineItems.length) {
      var contentIds = [];
      var revenue1 = 0;
      var revenue2 = 0;
      var currency1 = null;
      var currency2 = null;
      for (var _iterator = transaction.lineItems, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var lineItem = _ref;

        if (lineItem.product) {
          var product = lineItem.product;
          if (product.id) {
            contentIds.push(product.id);
          }
          revenue2 += (lineItem.quantity || 1) * (product.unitSalePrice || product.unitPrice || 0);
          currency2 = currency2 || product.currency;
        }
        revenue1 += lineItem.subtotal;
        currency1 = currency1 || lineItem.currency;
      }

      window.fbq('track', 'Purchase', {
        content_ids: contentIds,
        content_type: 'product',
        currency: transaction.currency || currency1 || currency2 || '',
        value: transaction.total || revenue1 || revenue2 || 0
      });
    }
  };

  FacebookPixel.prototype.onCustomEvent = function onCustomEvent(event) {
    window.fbq('trackCustom', event.name);
  };

  return FacebookPixel;
}(_Integration3['default']);

exports['default'] = FacebookPixel;

},{"./../Integration.js":97,"./../functions/deleteProperty.js":102,"component-type":5}],121:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _getProperty = require('./../functions/getProperty.js');

var _getProperty2 = _interopRequireDefault(_getProperty);

var _each = require('./../functions/each.js');

var _each2 = _interopRequireDefault(_each);

var _size = require('./../functions/size.js');

var _size2 = _interopRequireDefault(_size);

var _componentClone = require('component-clone');

var _componentClone2 = _interopRequireDefault(_componentClone);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

function getTransactionVoucher(transaction) {
  var voucher = void 0;
  if (Array.isArray(transaction.vouchers)) {
    voucher = transaction.vouchers[0];
  } else {
    voucher = transaction.voucher;
  }

  return voucher;
}

function getCheckoutOptions(event, checkoutOptions) {
  var optionNames = checkoutOptions;
  var options = [];
  for (var _iterator = optionNames, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var optionName = _ref;

    var optionValue = (0, _getProperty2['default'])(event, optionName);
    if (optionValue) {
      options.push(optionValue);
    }
  }
  return options.join(', ');
}

var GoogleAnalytics = function (_Integration) {
  _inherits(GoogleAnalytics, _Integration);

  function GoogleAnalytics(digitalData, options) {
    _classCallCheck(this, GoogleAnalytics);

    var optionsWithDefaults = Object.assign({
      trackingId: '',
      trackOnlyCustomEvents: false,
      doubleClick: false,
      enhancedLinkAttribution: false,
      enhancedEcommerce: false,
      sendUserId: false,
      anonymizeIp: false,
      domain: 'auto',
      includeSearch: false,
      siteSpeedSampleRate: 1,
      defaultCurrency: 'USD',
      metrics: {},
      dimensions: {},
      contentGroupings: {},
      productDimensions: {},
      productMetrics: {},
      namespace: 'ddl',
      noConflict: false,
      checkoutOptions: ['paymentMethod', 'shippingMethod'],
      filterEvents: []
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.addTag({
      type: 'script',
      attr: {
        src: '//www.google-analytics.com/analytics.js'
      }
    });
    return _this;
  }

  GoogleAnalytics.prototype.initialize = function initialize() {
    if (this.getOption('trackingId')) {
      this.pageCalled = false;

      // setup the tracker globals
      window.GoogleAnalyticsObject = 'ga';
      window.ga = window.ga || function gaPlaceholder() {
        window.ga.q = window.ga.q || [];
        window.ga.q.push(arguments);
      };
      window.ga.l = new Date().getTime();

      if (window.location.hostname === 'localhost') {
        this.setOption('domain', 'none');
      }

      this.initializeTracker();

      if (this.getOption('noConflict')) {
        this.onLoad();
      } else {
        this.load(this.onLoad);
      }
    } else {
      this.onLoad();
    }
    this.enrichDigitalData();
  };

  GoogleAnalytics.prototype.initializeTracker = function initializeTracker() {
    window.ga('create', this.getOption('trackingId'), {
      // Fall back on default to protect against empty string
      cookieDomain: this.getOption('domain'),
      siteSpeedSampleRate: this.getOption('siteSpeedSampleRate'),
      allowLinker: true,
      name: this.getOption('namespace') ? this.getOption('namespace') : undefined
    });
    // display advertising
    if (this.getOption('doubleClick')) {
      this.ga('require', 'displayfeatures');
    }
    // https://support.google.com/analytics/answer/2558867?hl=en
    if (this.getOption('enhancedLinkAttribution')) {
      this.ga('require', 'linkid', 'linkid.js');
    }

    // send global id
    var userId = this.get('user.id');
    if (this.getOption('sendUserId') && userId) {
      this.ga('set', 'userId', userId);
    }

    // anonymize after initializing, otherwise a warning is shown
    // in google analytics debugger
    if (this.getOption('anonymizeIp')) this.ga('set', 'anonymizeIp', true);

    // custom dimensions & metrics
    var custom = this.getCustomDimensions();
    if ((0, _size2['default'])(custom)) this.ga('set', custom);
  };

  GoogleAnalytics.prototype.ga = function ga() {
    if (!this.getOption('namespace')) {
      window.ga.apply(window, arguments);
    } else {
      if (arguments[0]) {
        arguments[0] = this.getOption('namespace') + '.' + arguments[0];
      }
      window.ga.apply(window, arguments);
    }
  };

  GoogleAnalytics.prototype.isLoaded = function isLoaded() {
    return !!window.gaplugins;
  };

  GoogleAnalytics.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'GoogleAnalyticsObject');
    (0, _deleteProperty2['default'])(window, 'ga');
    (0, _deleteProperty2['default'])(window, 'gaplugins');
    this.pageCalled = false;
  };

  GoogleAnalytics.prototype.getCustomDimensions = function getCustomDimensions(source) {
    var productScope = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

    source = source || this.digitalData;
    var settings = void 0;
    if (!productScope) {
      settings = Object.assign(this.getOption('metrics'), this.getOption('dimensions'), this.getOption('contentGroupings'));
    } else {
      settings = Object.assign(this.getOption('productMetrics'), this.getOption('productDimensions'));
    }
    var custom = {};
    (0, _each2['default'])(settings, function (key, value) {
      var dimensionVal = (0, _getProperty2['default'])(source, value);
      if (dimensionVal !== undefined) {
        if (typeof dimensionVal === 'boolean') dimensionVal = dimensionVal.toString();
        custom[key] = dimensionVal;
      }
    });
    return custom;
  };

  GoogleAnalytics.prototype.loadEnhancedEcommerce = function loadEnhancedEcommerce(currency) {
    if (!this.enhancedEcommerceLoaded) {
      this.ga('require', 'ec');
      this.enhancedEcommerceLoaded = true;
    }

    // Ensure we set currency for every hit
    this.ga('set', '&cu', currency || this.getOption('defaultCurrency'));
  };

  GoogleAnalytics.prototype.pushEnhancedEcommerce = function pushEnhancedEcommerce(event) {
    // Send a custom non-interaction event to ensure all EE data is pushed.
    // Without doing this we'd need to require page display after setting EE data.
    var cleanedArgs = [];
    var args = ['send', 'event', event.category || 'Ecommerce', event.name || 'not defined', event.label, {
      nonInteraction: 1
    }];

    for (var _iterator2 = args, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var arg = _ref2;

      if (arg !== undefined) {
        cleanedArgs.push(arg);
      }
    }

    this.setEventCustomDimensions(event);
    this.ga.apply(this, cleanedArgs);
  };

  GoogleAnalytics.prototype.enrichDigitalData = function enrichDigitalData() {
    var _this2 = this;

    window.ga(function (tracker) {
      var trackerName = _this2.getOption('namespace');
      tracker = tracker || window.ga.getByName(trackerName);
      if (tracker) {
        var clientId = tracker.get('clientId');
        _this2.digitalData.integrations.googleAnalytics = { clientId: clientId };
      }
      _this2.onEnrich();
    });
  };

  GoogleAnalytics.prototype.trackEvent = function trackEvent(event) {
    var filterEvents = this.getOption('filterEvents') || [];
    if (filterEvents.indexOf(event.name) >= 0) {
      return;
    }

    if (event.name === 'Viewed Page') {
      if (!this.getOption('noConflict')) {
        this.onViewedPage(event);
      }
    } else if (this.getOption('enhancedEcommerce')) {
      var methods = {
        'Viewed Product': this.onViewedProduct,
        'Clicked Product': this.onClickedProduct,
        'Viewed Product Detail': this.onViewedProductDetail,
        'Added Product': this.onAddedProduct,
        'Removed Product': this.onRemovedProduct,
        'Completed Transaction': this.onCompletedTransactionEnhanced,
        'Refunded Transaction': this.onRefundedTransaction,
        'Viewed Campaign': this.onViewedCampaign,
        'Clicked Campaign': this.onClickedCampaign,
        'Viewed Checkout Step': this.onViewedCheckoutStep,
        'Completed Checkout Step': this.onCompletedCheckoutStep
      };
      var method = methods[event.name];
      if (method) {
        method.bind(this)(event);
      } else {
        this.trackCustomEvent(event);
      }
    } else {
      if (event.name === 'Completed Transaction' && !this.getOption('noConflict')) {
        this.onCompletedTransaction(event);
      } else {
        this.onCustomEvent(event);
      }
    }
  };

  GoogleAnalytics.prototype.onViewedPage = function onViewedPage(event) {
    var page = event.page;
    var pageview = {};
    var pageUrl = page.url;
    var pagePath = page.path;
    if (this.getOption('includeSearch') && page.queryString) {
      pagePath = pagePath + page.queryString;
    }
    var pageTitle = page.name || page.title;

    pageview.page = pagePath;
    pageview.title = pageTitle;
    pageview.location = pageUrl;

    // set
    this.ga('set', {
      page: pagePath,
      title: pageTitle
    });

    if (this.pageCalled) {
      (0, _deleteProperty2['default'])(pageview, 'location');
    }

    // send
    this.setEventCustomDimensions(event);
    this.ga('send', 'pageview', pageview);

    this.pageCalled = true;
  };

  GoogleAnalytics.prototype.onViewedProduct = function onViewedProduct(event) {
    var listItems = event.listItems;
    if ((!listItems || !Array.isArray(listItems)) && event.listItem) {
      listItems = [event.listItem];
    }

    for (var _iterator3 = listItems, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref3;

      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        _ref3 = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        _ref3 = _i3.value;
      }

      var listItem = _ref3;

      var product = listItem.product;
      if (!product.id && !product.skuCode && !product.name) {
        continue;
      }
      this.loadEnhancedEcommerce(product.currency);

      var custom = this.getCustomDimensions(product, true);
      var gaProduct = Object.assign({
        id: product.id || product.skuCode,
        name: product.name,
        list: listItem.listName,
        category: product.category,
        brand: product.brand || product.manufacturer,
        price: product.unitSalePrice || product.unitPrice,
        currency: product.currency || this.getOption('defaultCurrency'),
        variant: product.variant,
        position: listItem.position
      }, custom);
      this.ga('ec:addImpression', gaProduct);
    }

    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onClickedProduct = function onClickedProduct(event) {
    if (!event.listItem) {
      return;
    }
    var product = event.listItem.product;
    this.loadEnhancedEcommerce(product.currency);
    this.enhancedEcommerceProductAction(event, 'click', {
      list: event.listItem.listName
    });
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var product = event.product;
    this.loadEnhancedEcommerce(product.currency);
    this.enhancedEcommerceProductAction(event, 'detail');
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onAddedProduct = function onAddedProduct(event) {
    var product = event.product;
    this.loadEnhancedEcommerce(product.currency);
    this.enhancedEcommerceProductAction(event, 'add');
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onRemovedProduct = function onRemovedProduct(event) {
    var product = event.product;
    this.loadEnhancedEcommerce(product.currency);
    this.enhancedEcommerceProductAction(event, 'remove');
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onCompletedTransaction = function onCompletedTransaction(event) {
    var _this3 = this;

    var transaction = event.transaction;
    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    // require ecommerce
    if (!this.ecommerce) {
      this.ga('require', 'ecommerce');
      this.ecommerce = true;
    }

    // add transaction
    this.ga('ecommerce:addTransaction', {
      id: transaction.orderId,
      affiliation: transaction.affiliation,
      shipping: transaction.shippingCost,
      tax: transaction.tax,
      revenue: transaction.total || transaction.subtotal || 0,
      currency: transaction.currency
    });

    // add products
    (0, _each2['default'])(transaction.lineItems, function (key, lineItem) {
      var product = lineItem.product;
      if (product) {
        _this3.ga('ecommerce:addItem', {
          id: transaction.orderId,
          category: product.category,
          quantity: lineItem.quantity,
          price: product.unitSalePrice || product.unitPrice,
          name: product.name,
          sku: product.skuCode,
          currency: product.currency || transaction.currency
        });
      }
    });

    // send
    this.ga('ecommerce:send');
  };

  GoogleAnalytics.prototype.onCompletedTransactionEnhanced = function onCompletedTransactionEnhanced(event) {
    var _this4 = this;

    var transaction = event.transaction;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    this.loadEnhancedEcommerce(transaction.currency);

    (0, _each2['default'])(transaction.lineItems, function (key, lineItem) {
      var product = lineItem.product;
      if (product) {
        product.currency = product.currency || transaction.currency || _this4.getOption('defaultCurrency');
        _this4.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    var voucher = getTransactionVoucher(transaction);
    this.ga('ec:setAction', 'purchase', {
      id: transaction.orderId,
      affiliation: transaction.affiliation,
      revenue: transaction.total || transaction.subtotal || 0,
      tax: transaction.tax,
      shipping: transaction.shippingCost,
      coupon: voucher
    });

    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onRefundedTransaction = function onRefundedTransaction(event) {
    var _this5 = this;

    var transaction = event.transaction;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;
    this.loadEnhancedEcommerce(transaction.currency);

    (0, _each2['default'])(transaction.lineItems, function (key, lineItem) {
      var product = lineItem.product;
      if (product) {
        product.currency = product.currency || transaction.currency || _this5.getOption('defaultCurrency');
        _this5.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    this.ga('ec:setAction', 'refund', {
      id: transaction.orderId
    });

    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onViewedCampaign = function onViewedCampaign(event) {
    var campaigns = event.campaigns;
    if ((!campaigns || !Array.isArray(campaigns)) && event.campaign) {
      campaigns = [event.campaign];
    }

    this.loadEnhancedEcommerce();

    for (var _iterator4 = campaigns, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
      var _ref4;

      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        _ref4 = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        _ref4 = _i4.value;
      }

      var campaign = _ref4;

      if (!campaign || !campaign.id) {
        continue;
      }

      this.ga('ec:addPromo', {
        id: campaign.id,
        name: campaign.name,
        creative: campaign.design || campaign.creative,
        position: campaign.position
      });
    }

    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onClickedCampaign = function onClickedCampaign(event) {
    var campaign = event.campaign;

    if (!campaign || !campaign.id) {
      return;
    }

    this.loadEnhancedEcommerce();
    this.ga('ec:addPromo', {
      id: campaign.id,
      name: campaign.name,
      creative: campaign.design || campaign.creative,
      position: campaign.position
    });
    this.ga('ec:setAction', 'promo_click', {});
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onViewedCheckoutStep = function onViewedCheckoutStep(event) {
    var _this6 = this;

    var cartOrTransaction = this.get('cart') || this.get('transaction');

    this.loadEnhancedEcommerce(cartOrTransaction.currency);

    (0, _each2['default'])(cartOrTransaction.lineItems, function (key, lineItem) {
      var product = lineItem.product;
      if (product) {
        product.currency = product.currency || cartOrTransaction.currency || _this6.getOption('defaultCurrency');
        _this6.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    this.ga('ec:setAction', 'checkout', {
      step: event.step || 1,
      option: getCheckoutOptions(event, this.getOption('checkoutOptions')) || undefined
    });

    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onCompletedCheckoutStep = function onCompletedCheckoutStep(event) {
    var cartOrTransaction = this.get('cart') || this.get('transaction');
    var options = getCheckoutOptions(event, this.getOption('checkoutOptions'));
    if (!event.step || !options) {
      return;
    }

    this.loadEnhancedEcommerce(cartOrTransaction.currency);

    this.ga('ec:setAction', 'checkout_option', {
      step: event.step,
      option: options
    });

    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onCustomEvent = function onCustomEvent(event) {
    var payload = {
      eventAction: event.name || 'event',
      eventCategory: event.category || 'All',
      eventLabel: event.label,
      eventValue: Math.round(event.value) || 0,
      nonInteraction: !!event.nonInteraction
    };

    this.setEventCustomDimensions(event);
    this.ga('send', 'event', payload);
  };

  GoogleAnalytics.prototype.setEventCustomDimensions = function setEventCustomDimensions(event) {
    // custom dimensions & metrics
    var source = (0, _componentClone2['default'])(event);
    var _arr = ['name', 'category', 'label', 'nonInteraction', 'value'];
    for (var _i5 = 0; _i5 < _arr.length; _i5++) {
      var prop = _arr[_i5];
      (0, _deleteProperty2['default'])(source, prop);
    }
    var custom = this.getCustomDimensions(source);
    if ((0, _size2['default'])(custom)) this.ga('set', custom);
  };

  GoogleAnalytics.prototype.enhancedEcommerceTrackProduct = function enhancedEcommerceTrackProduct(product, quantity, position) {
    var custom = this.getCustomDimensions(product, true);
    var gaProduct = Object.assign({
      id: product.id || product.skuCode,
      name: product.name,
      category: product.category,
      price: product.unitSalePrice || product.unitPrice,
      brand: product.brand || product.manufacturer,
      variant: product.variant,
      currency: product.currency
    }, custom);;
    if (quantity) gaProduct.quantity = quantity;
    if (position) gaProduct.position = position;
    // append coupon if it set
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#measuring-transactions
    if (product.voucher) gaProduct.coupon = product.voucher;
    this.ga('ec:addProduct', gaProduct);
  };

  GoogleAnalytics.prototype.enhancedEcommerceProductAction = function enhancedEcommerceProductAction(event, action, data) {
    var position = void 0;
    var product = void 0;
    if (event.listItem) {
      position = event.listItem.position;
      product = event.listItem.product;
    } else {
      product = event.product;
    }
    this.enhancedEcommerceTrackProduct(product, event.quantity, position);
    this.ga('ec:setAction', action, data || {});
  };

  return GoogleAnalytics;
}(_Integration3['default']);

exports['default'] = GoogleAnalytics;

},{"./../Integration.js":97,"./../functions/deleteProperty.js":102,"./../functions/each.js":103,"./../functions/getProperty.js":105,"./../functions/size.js":115,"component-clone":3}],122:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var GoogleTagManager = function (_Integration) {
  _inherits(GoogleTagManager, _Integration);

  function GoogleTagManager(digitalData, options) {
    _classCallCheck(this, GoogleTagManager);

    var optionsWithDefaults = Object.assign({
      containerId: null,
      noConflict: false
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.addTag({
      type: 'script',
      attr: {
        src: '//www.googletagmanager.com/gtm.js?id=' + options.containerId + '&l=dataLayer'
      }
    });
    return _this;
  }

  GoogleTagManager.prototype.initialize = function initialize() {
    if (this.getOption('containerId') && this.getOption('noConflict') === false) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ 'gtm.start': Number(new Date()), event: 'gtm.js' });
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  };

  GoogleTagManager.prototype.isLoaded = function isLoaded() {
    return !!(window.dataLayer && Array.prototype.push !== window.dataLayer.push);
  };

  GoogleTagManager.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'dataLayer');
    (0, _deleteProperty2['default'])(window, 'google_tag_manager');
  };

  GoogleTagManager.prototype.trackEvent = function trackEvent(event) {
    var name = event.name;
    var category = event.category;
    (0, _deleteProperty2['default'])(event, 'name');
    (0, _deleteProperty2['default'])(event, 'category');
    event.event = name;
    event.eventCategory = category;
    window.dataLayer.push(event);
  };

  return GoogleTagManager;
}(_Integration3['default']);

exports['default'] = GoogleTagManager;

},{"./../Integration.js":97,"./../functions/deleteProperty.js":102}],123:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

function lineItemsToProductIds(lineItems) {
  var productIds = lineItems.filter(function (lineItem) {
    return !!lineItem.product.id;
  }).map(function (lineItem) {
    return lineItem.product.id;
  });
  return productIds;
}

var MyTarget = function (_Integration) {
  _inherits(MyTarget, _Integration);

  function MyTarget(digitalData, options) {
    _classCallCheck(this, MyTarget);

    var optionsWithDefaults = Object.assign({
      counterId: '',
      list: '1',
      listProperty: undefined,
      listPropertyMapping: undefined,
      noConflict: false
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.addTag({
      type: 'script',
      attr: {
        id: 'topmailru-code',
        src: '//top-fwz1.mail.ru/js/code.js'
      }
    });
    return _this;
  }

  MyTarget.prototype.initialize = function initialize() {
    window._tmr = window._tmr || [];
    if (!this.getOption('noConflict')) {
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  };

  MyTarget.prototype.isLoaded = function isLoaded() {
    return !!(window._tmr && window._tmr.unload);
  };

  MyTarget.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, '_tmr');
  };

  MyTarget.prototype.getList = function getList() {
    var list = this.getOption('list');
    var listProperty = this.getOption('listProperty');
    if (listProperty) {
      var listPropertyValue = this.get(listProperty);
      if (listPropertyValue) {
        var listPropertyMapping = this.getOption('listPropertyMapping');
        if (listPropertyMapping && listPropertyMapping[listPropertyValue]) {
          list = listPropertyMapping[listPropertyValue];
        } else {
          if (parseInt(listPropertyValue, 10)) {
            list = listPropertyValue;
          }
        }
      }
    }
    return list;
  };

  MyTarget.prototype.trackEvent = function trackEvent(event) {
    var methods = {
      'Viewed Page': 'onViewedPage',
      'Viewed Product Category': 'onViewedProductCategory',
      'Viewed Product Detail': 'onViewedProductDetail',
      'Completed Transaction': 'onCompletedTransaction'
    };

    var method = methods[event.name];
    if (this.getOption('counterId')) {
      if (method && !this.getOption('noConflict')) {
        this[method](event);
      } else if (!method) {
        this.trackCustomEvent(event);
      }
    }
  };

  MyTarget.prototype.onViewedPage = function onViewedPage(event) {
    window._tmr.push({
      id: this.getOption('counterId'),
      type: 'pageView',
      start: Date.now()
    });

    var page = event.page;
    if (page) {
      if (page.type === 'home') {
        this.onViewedHome();
      } else if (page.type === 'cart') {
        this.onViewedCart();
      } else if (['product', 'category', 'checkout', 'confirmation'].indexOf(page.type) < 0) {
        this.onViewedOtherPage();
      }
    }
  };

  MyTarget.prototype.onViewedHome = function onViewedHome() {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'home',
      totalvalue: '',
      list: this.getList()
    });
  };

  MyTarget.prototype.onViewedProductCategory = function onViewedProductCategory() {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'category',
      totalvalue: '',
      list: this.getList()
    });
  };

  MyTarget.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var product = event.product;
    window._tmr.push({
      type: 'itemView',
      productid: product.id || product.skuCode || '',
      pagetype: 'product',
      totalvalue: product.unitSalePrice || product.unitPrice || '',
      list: this.getList()
    });
  };

  MyTarget.prototype.onViewedCart = function onViewedCart() {
    var cart = this.digitalData.cart;
    var productIds = void 0;

    if (cart.lineItems || cart.lineItems.length > 0) {
      productIds = lineItemsToProductIds(cart.lineItems);
    }

    window._tmr.push({
      type: 'itemView',
      productid: productIds || '',
      pagetype: 'cart',
      totalvalue: cart.total || cart.subtotal || '',
      list: this.getList()
    });
  };

  MyTarget.prototype.onViewedOtherPage = function onViewedOtherPage() {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'other',
      totalvalue: '',
      list: this.getList()
    });
  };

  MyTarget.prototype.onCompletedTransaction = function onCompletedTransaction(event) {
    var transaction = event.transaction;
    var productIds = void 0;

    if (transaction.lineItems || transaction.lineItems.length > 0) {
      productIds = lineItemsToProductIds(transaction.lineItems);
    }

    window._tmr.push({
      type: 'itemView',
      productid: productIds || '',
      pagetype: 'purchase',
      totalvalue: transaction.total || transaction.subtotal || '',
      list: this.getList()
    });
  };

  MyTarget.prototype.trackCustomEvent = function trackCustomEvent(event) {
    window._tmr.push({
      id: this.getOption('counterId'),
      type: 'reachGoal',
      goal: event.name
    });
  };

  return MyTarget;
}(_Integration3['default']);

exports['default'] = MyTarget;

},{"./../Integration.js":97,"./../functions/deleteProperty.js":102}],124:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var OWOXBIStreaming = function (_Integration) {
  _inherits(OWOXBIStreaming, _Integration);

  function OWOXBIStreaming(digitalData, options) {
    _classCallCheck(this, OWOXBIStreaming);

    var optionsWithDefaults = Object.assign({
      namespace: 'ddl',
      sessionIdDimension: ''
    }, options);

    return _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));
  }

  OWOXBIStreaming.prototype.initialize = function initialize() {
    this.ga('require', 'OWOXBIStreaming', {
      sessionIdDimension: this.getOption('sessionIdDimension')
    });
    /* eslint-disable */
    (function () {
      function g(h, b) {
        var f = h.get('sendHitTask'),
            g = function () {
          function a(a, e) {
            var d = 'XDomainRequest' in window ? 'XDomainRequest' : 'XMLHttpRequest',
                c = new window[d]();c.open('POST', a, !0);c.onprogress = function () {};c.ontimeout = function () {};c.onerror = function () {};c.onload = function () {};c.setRequestHeader && c.setRequestHeader('Content-Type', 'text/plain');'XDomainRequest' == d ? setTimeout(function () {
              c.send(e);
            }, 0) : c.send(e);
          }function f(a, e) {
            var d = new Image();d.onload = function () {};d.src = a + '?' + e;
          }var g = b && b.domain ? b.domain : 'google-analytics.bi.owox.com';return { send: function send(b) {
              var e = location.protocol + '//' + g + '/collect',
                  d;try {
                navigator.sendBeacon && navigator.sendBeacon(d = e + '?tid=' + h.get('trackingId'), b) || (2036 < b.length ? a(d ? d : e + '?tid=' + h.get('trackingId'), b) : f(e, b));
              } catch (c) {}
            } };
        }();h.set('sendHitTask', function (a) {
          if (b && 0 < b.sessionIdDimension) try {
            a.set('dimension' + b.sessionIdDimension, a.get('clientId') + '_' + Date.now()), a.get('buildHitTask')(a);
          } catch (h) {}f(a);g.send(a.get('hitPayload'));
        });
      }var f = window[window.GoogleAnalyticsObject || 'ga'];'function' == typeof f && f('provide', 'OWOXBIStreaming', g);
    })();
    /* eslint-enable */
    this._loaded = true;
    this.onLoad();
  };

  OWOXBIStreaming.prototype.isLoaded = function isLoaded() {
    return !!this._loaded;
  };

  OWOXBIStreaming.prototype.reset = function reset() {};

  OWOXBIStreaming.prototype.ga = function ga() {
    if (!this.getOption('namespace')) {
      window.ga.apply(window, arguments);
    } else {
      if (arguments[0]) {
        arguments[0] = this.getOption('namespace') + '.' + arguments[0];
      }
      window.ga.apply(window, arguments);
    }
  };

  return OWOXBIStreaming;
}(_Integration3['default']);

exports['default'] = OWOXBIStreaming;

},{"./../Integration.js":97}],125:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _getProperty = require('./../../src/functions/getProperty');

var _getProperty2 = _interopRequireDefault(_getProperty);

var _throwError = require('./../functions/throwError');

var _throwError2 = _interopRequireDefault(_throwError);

var _each = require('./../functions/each');

var _each2 = _interopRequireDefault(_each);

var _componentClone = require('component-clone');

var _componentClone2 = _interopRequireDefault(_componentClone);

var _componentType = require('component-type');

var _componentType2 = _interopRequireDefault(_componentType);

var _format = require('./../functions/format');

var _format2 = _interopRequireDefault(_format);

var _getQueryParam = require('./../functions/getQueryParam');

var _getQueryParam2 = _interopRequireDefault(_getQueryParam);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

function getEventVars(event) {
  var eventVars = (0, _componentClone2['default'])(event);
  (0, _deleteProperty2['default'])(event, 'name');
  (0, _deleteProperty2['default'])(event, 'category');
  return eventVars;
}

var RetailRocket = function (_Integration) {
  _inherits(RetailRocket, _Integration);

  function RetailRocket(digitalData, options) {
    _classCallCheck(this, RetailRocket);

    var optionsWithDefaults = Object.assign({
      partnerId: '',
      userIdProperty: 'user.userId',
      trackProducts: true, // legacy setting, use noConflict instead
      noConflict: false,
      trackAllEmails: false,
      listMethods: {},
      customVariables: {}
    }, options);

    // legacy setting mapper

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    if (_this.getOption('trackProducts') === false) {
      _this.setOption('noConflict', true);
    }

    _this.addTag({
      type: 'script',
      attr: {
        id: 'rrApi-jssdk',
        src: '//cdn.retailrocket.ru/content/javascript/tracking.js'
      }
    });
    return _this;
  }

  RetailRocket.prototype.initialize = function initialize() {
    if (this.getOption('partnerId')) {
      window.rrPartnerId = this.getOption('partnerId');
      var userId = (0, _getProperty2['default'])(this.digitalData, this.getOption('userIdProperty'));
      if (userId) {
        window.rrPartnerUserId = userId;
      }
      window.rrApi = {};
      window.rrApiOnReady = window.rrApiOnReady || [];
      window.rrApi.pageView = window.rrApi.addToBasket = window.rrApi.order = window.rrApi.categoryView = window.rrApi.setEmail = window.rrApi.view = window.rrApi.recomMouseDown = window.rrApi.recomAddToCart = window.rrApi.search = function () {};

      this.trackEmail();

      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  };

  RetailRocket.prototype.isLoaded = function isLoaded() {
    return !!(window.rrApi && typeof window.rrApi._initialize === 'function');
  };

  RetailRocket.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'rrPartnerId');
    (0, _deleteProperty2['default'])(window, 'rrApi');
    (0, _deleteProperty2['default'])(window, 'rrApiOnReady');
    (0, _deleteProperty2['default'])(window, 'rrApi');
    (0, _deleteProperty2['default'])(window, 'retailrocket');
    (0, _deleteProperty2['default'])(window, 'retailrocket_products');
    (0, _deleteProperty2['default'])(window, 'rrLibrary');
    var script = document.getElementById('rrApi-jssdk');
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  };

  RetailRocket.prototype.trackEvent = function trackEvent(event) {
    if (this.getOption('noConflict') !== true) {
      if (event.name === 'Viewed Product Category') {
        this.onViewedProductCategory(event.listing);
      } else if (event.name === 'Added Product') {
        this.onAddedProduct(event.product);
      } else if (event.name === 'Viewed Product Detail') {
        this.onViewedProductDetail(event.product);
      } else if (event.name === 'Clicked Product') {
        this.onClickedProduct(event.listItem);
      } else if (event.name === 'Completed Transaction') {
        this.onCompletedTransaction(event.transaction);
      } else if (event.name === 'Subscribed') {
        this.onSubscribed(event.user, getEventVars(event));
      } else if (event.name === 'Searched') {
        this.onSearched(event.listing);
      }
    } else {
      if (event.name === 'Subscribed') {
        this.onSubscribed(event.user, getEventVars(event));
      }
    }
  };

  RetailRocket.prototype.trackEmail = function trackEmail() {
    var _this2 = this;

    if (this.get('user.email')) {
      if (this.getOption('trackAllEmails') === true || this.get('user.isSubscribed') === true) {
        this.onSubscribed(this.get('user'));
      }
    } else {
      var email = (0, _getQueryParam2['default'])('rr_setemail', this.getQueryString());
      if (email) {
        this.digitalData.user.email = email;
        // Retail Rocker will track this query param automatically
      } else {
        window.ddListener.push(['on', 'change:user.email', function () {
          if (_this2.getOption('trackAllEmails') === true || _this2.get('user.isSubscribed') === true) {
            _this2.onSubscribed(_this2.get('user'));
          }
        }]);
      }
    }
  };

  RetailRocket.prototype.onViewedProductCategory = function onViewedProductCategory(listing) {
    var _this3 = this;

    listing = listing || {};
    var categoryId = listing.categoryId;
    if (!categoryId) {
      this.onValidationError('listing.categoryId');
      return;
    }
    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.categoryView(categoryId);
      } catch (e) {
        _this3.onError(e);
      }
    });
  };

  RetailRocket.prototype.onViewedProductDetail = function onViewedProductDetail(product) {
    var _this4 = this;

    var productId = this.getProductId(product);
    if (!productId) {
      this.onValidationError('product.id');
      return;
    }
    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.view(productId);
      } catch (e) {
        _this4.onError(e);
      }
    });
  };

  RetailRocket.prototype.onAddedProduct = function onAddedProduct(product) {
    var _this5 = this;

    var productId = this.getProductId(product);
    if (!productId) {
      this.onValidationError('product.id');
      return;
    }
    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.addToBasket(productId);
      } catch (e) {
        _this5.onError(e);
      }
    });
  };

  RetailRocket.prototype.onClickedProduct = function onClickedProduct(listItem) {
    var _this6 = this;

    if (!listItem) {
      this.onValidationError('listItem.product.id');
      return;
    }
    var productId = this.getProductId(listItem.product);
    if (!productId) {
      this.onValidationError('listItem.product.id');
      return;
    }
    var listName = listItem.listName;
    if (!listName) {
      return;
    }
    var methodName = this.getOption('listMethods')[listName];
    if (!methodName) {
      return;
    }
    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.recomMouseDown(productId, methodName);
      } catch (e) {
        _this6.onError(e);
      }
    });
  };

  RetailRocket.prototype.onCompletedTransaction = function onCompletedTransaction(transaction) {
    var _this7 = this;

    transaction = transaction || {};
    if (!this.validateTransaction(transaction)) {
      return;
    }

    var items = [];
    var lineItems = transaction.lineItems;
    for (var i = 0, length = lineItems.length; i < length; i++) {
      if (!this.validateTransactionLineItem(lineItems[i], i)) {
        continue;
      }
      var product = lineItems[i].product;
      items.push({
        id: product.id,
        qnt: lineItems[i].quantity,
        price: product.unitSalePrice || product.unitPrice
      });
    }

    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.order({
          transaction: transaction.orderId,
          items: items
        });
      } catch (e) {
        _this7.onError(e);
      }
    });
  };

  RetailRocket.prototype.onSubscribed = function onSubscribed(user, customs) {
    var _this8 = this;

    user = user || {};
    if (!user.email) {
      this.onValidationError('user.email');
      return;
    }

    var rrCustoms = {};
    if (customs) {
      var settings = this.getOption('customVariables');
      (0, _each2['default'])(settings, function (key, value) {
        var dimensionVal = (0, _getProperty2['default'])(customs, value);
        if (dimensionVal !== undefined) {
          if ((0, _componentType2['default'])(dimensionVal) === 'boolean') dimensionVal = dimensionVal.toString();
          rrCustoms[key] = dimensionVal;
        }
      });
    }

    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.setEmail(user.email, rrCustoms);
      } catch (e) {
        _this8.onError(e);
      }
    });
  };

  RetailRocket.prototype.onSearched = function onSearched(listing) {
    var _this9 = this;

    listing = listing || {};
    if (!listing.query) {
      this.onValidationError('listing.query');
      return;
    }
    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.search(listing.query);
      } catch (e) {
        _this9.onError(e);
      }
    });
  };

  RetailRocket.prototype.validateTransaction = function validateTransaction(transaction) {
    var isValid = true;
    if (!transaction.orderId) {
      this.onValidationError('transaction.orderId');
      isValid = false;
    }

    var lineItems = transaction.lineItems;
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      this.onValidationError('transaction.lineItems');
      isValid = false;
    }

    return isValid;
  };

  RetailRocket.prototype.validateLineItem = function validateLineItem(lineItem, index) {
    var isValid = true;
    if (!lineItem.product) {
      this.onValidationError((0, _format2['default'])('lineItems[%d].product', index));
      isValid = false;
    }

    return isValid;
  };

  RetailRocket.prototype.validateTransactionLineItem = function validateTransactionLineItem(lineItem, index) {
    var isValid = this.validateLineItem(lineItem, index);

    var product = lineItem.product;
    if (!product.id) {
      this.onValidationError((0, _format2['default'])('lineItems[%d].product.id', index));
      isValid = false;
    }
    if (!product.unitSalePrice && !product.unitPrice) {
      this.onValidationError((0, _format2['default'])('lineItems[%d].product.unitSalePrice', index));
      isValid = false;
    }
    if (!lineItem.quantity) {
      this.onValidationError((0, _format2['default'])('lineItems[%d].quantity', index));
      isValid = false;
    }

    return isValid;
  };

  RetailRocket.prototype.getProductId = function getProductId(product) {
    product = product || {};
    var productId = void 0;
    if ((0, _componentType2['default'])(product) === 'object') {
      productId = product.id;
    } else {
      productId = product;
    }
    return productId;
  };

  RetailRocket.prototype.onError = function onError(err) {
    (0, _throwError2['default'])('external_error', (0, _format2['default'])('Retail Rocket integration error: "%s"', err));
  };

  RetailRocket.prototype.onValidationError = function onValidationError(variableName) {
    (0, _throwError2['default'])('validation_error', (0, _format2['default'])('Retail Rocket integration error: DDL or event variable "%s" is not defined or empty', variableName));
  };

  /**
   * Can be stubbed in unit tests
   * @returns string
   */

  RetailRocket.prototype.getQueryString = function getQueryString() {
    return window.location.search;
  };

  return RetailRocket;
}(_Integration3['default']);

exports['default'] = RetailRocket;

},{"./../../src/functions/getProperty":105,"./../Integration.js":97,"./../functions/deleteProperty":102,"./../functions/each":103,"./../functions/format":104,"./../functions/getQueryParam":106,"./../functions/throwError":116,"component-clone":3,"component-type":5}],126:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _each = require('./../functions/each.js');

var _each2 = _interopRequireDefault(_each);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var SegmentStream = function (_Integration) {
  _inherits(SegmentStream, _Integration);

  function SegmentStream(digitalData, options) {
    _classCallCheck(this, SegmentStream);

    var optionsWithDefaults = Object.assign({
      sessionLength: 1800, // 30 min
      storagePrefix: 'ss:'
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.addTag({
      type: 'script',
      attr: {
        id: 'segmentstream-sdk',
        src: '//cdn.driveback.ru/js/segmentstream.js'
      }
    });
    return _this;
  }

  SegmentStream.prototype.initialize = function initialize() {
    var _this2 = this;

    var ssApi = window.ssApi = window.ssApi || [];

    if (ssApi.initialize) return;

    if (ssApi.invoked) {
      throw new Error('SegmentStream snippet included twice.');
    }

    ssApi.invoked = true;

    ssApi.methods = ['initialize', 'track', 'getData', 'getAnonymousId', 'pushOnReady'];

    ssApi.factory = function (method) {
      return function stub() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(method);
        ssApi.push(args);
        return ssApi;
      };
    };

    for (var i = 0; i < ssApi.methods.length; i++) {
      var key = ssApi.methods[i];
      ssApi[key] = ssApi.factory(key);
    }

    ssApi.initialize(this._options);
    ssApi.pushOnReady(function () {
      _this2.enrichDigitalData();
    });
    this.load(this.onLoad);
  };

  SegmentStream.prototype.isLoaded = function isLoaded() {
    return !!(window.ssApi && window.ssApi.initialize);
  };

  SegmentStream.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'ssApi');
    localStorage.clear();
  };

  SegmentStream.prototype.enrichDigitalData = function enrichDigitalData() {
    var _this3 = this;

    function lowercaseFirstLetter(string) {
      return string.charAt(0).toLowerCase() + string.slice(1);
    }
    var attributes = window.ssApi.getData().attributes;
    this.digitalData.user.ssAttributes = {};
    this.digitalData.user.anonymousId = window.ssApi.getAnonymousId();
    (0, _each2['default'])(attributes, function (name, value) {
      var key = lowercaseFirstLetter(name);
      _this3.digitalData.user.ssAttributes[key] = value;
    });
    this.onEnrich();
  };

  SegmentStream.prototype.trackEvent = function trackEvent(event) {
    var methods = {
      'Viewed Page': 'onViewedPage',
      'Viewed Product Detail': 'onViewedProductDetail',
      'Added Product': 'onAddedProduct'
    };

    var method = methods[event.name];
    if (method) {
      this[method](event);
    }
  };

  SegmentStream.prototype.onViewedPage = function onViewedPage() {
    var _this4 = this;

    ssApi.pushOnReady(function () {
      window.ssApi.track('Viewed Page');
      _this4.enrichDigitalData();
    });
  };

  SegmentStream.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var _this5 = this;

    ssApi.pushOnReady(function () {
      window.ssApi.track('Viewed Product Detail', {
        price: event.product.unitSalePrice || event.product.unitPrice || 0
      });
      _this5.enrichDigitalData();
    });
  };

  SegmentStream.prototype.onAddedProduct = function onAddedProduct(event) {
    var _this6 = this;

    ssApi.pushOnReady(function () {
      window.ssApi.track('Added Product', {
        price: event.product.unitSalePrice || event.product.unitPrice || 0
      });
      _this6.enrichDigitalData();
    });
  };

  return SegmentStream;
}(_Integration3['default']);

exports['default'] = SegmentStream;

},{"./../Integration.js":97,"./../functions/deleteProperty.js":102,"./../functions/each.js":103}],127:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _each = require('./../functions/each.js');

var _each2 = _interopRequireDefault(_each);

var _componentType = require('component-type');

var _componentType2 = _interopRequireDefault(_componentType);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var SendPulse = function (_Integration) {
  _inherits(SendPulse, _Integration);

  function SendPulse(digitalData, options) {
    _classCallCheck(this, SendPulse);

    var optionsWithDefaults = Object.assign({
      https: false,
      pushScriptUrl: '',
      pushSubscriptionTriggerEvent: 'Agreed to Receive Push Notifications'
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.addTag({
      type: 'script',
      attr: {
        charset: 'UTF-8',
        src: _this.getOption('pushScriptUrl')
      }
    });
    return _this;
  }

  SendPulse.prototype.initialize = function initialize() {
    var _this2 = this;

    this.load(function () {
      var original = window.oSpP.storeSubscription;
      window.oSpP.storeSubscription = function (value) {
        original(value);
        if (value !== 'DENY') {
          _this2.digitalData.user.pushNotifications.isSubscribed = true;
          _this2.sendUserAttributes(_this2.digitalData.user);
        }
      };
      _this2.enrichDigitalData();
      _this2.onLoad();
    });
  };

  SendPulse.prototype.enrichDigitalData = function enrichDigitalData() {
    var _this3 = this;

    var pushNotification = this.digitalData.user.pushNotifications = {};
    try {
      pushNotification.isSupported = this.checkPushNotificationsSupport();
      this.getPushSubscriptionInfo(function (subscriptionInfo) {
        if (!_this3.isLoaded()) {
          // to avoid problems in unit tests because of asyncoronous delay
          return;
        }
        if (subscriptionInfo === undefined) {
          pushNotification.isSubscribed = false;
          if (window.oSpP.isSafariNotificationSupported()) {
            var info = window.safari.pushNotification.permission('web.com.sendpulse.push');
            if (info.permission === 'denied') {
              pushNotification.isDenied = true;
            }
          }
        } else {
          if (subscriptionInfo.value === 'DENY') {
            pushNotification.isSubscribed = false;
            pushNotification.isDenied = true;
          } else {
            pushNotification.isSubscribed = true;
            pushNotification.subscriptionId = subscriptionInfo.value;
          }
        }
        _this3.onSubscriptionStatusReceived();
        _this3.onEnrich();
      });
    } catch (e) {
      pushNotification.isSupported = false;
      this.onEnrich();
    }
  };

  SendPulse.prototype.onSubscriptionStatusReceived = function onSubscriptionStatusReceived() {
    var _this4 = this;

    if (this.digitalData.user.pushNotifications.isSubscribed) {
      this.sendUserAttributes(this.digitalData.user);
    }
    window.ddListener.push(['on', 'change:user', function (newUser, oldUser) {
      if (newUser.pushNotifications.isSubscribed && oldUser !== undefined) {
        _this4.sendUserAttributes(newUser, oldUser);
      }
    }]);
  };

  SendPulse.prototype.checkPushNotificationsSupport = function checkPushNotificationsSupport() {
    var oSpP = window.oSpP;

    if (!oSpP.detectSite()) {
      return false;
    }
    if (oSpP.detectOs() === 'iOS') {
      return false;
    }
    var os = oSpP.detectOs();
    var browserInfo = oSpP.detectBrowser();
    var browserName = browserInfo.name.toLowerCase();
    if (browserName === 'chrome' && parseFloat(browserInfo.version) < 42) {
      return false;
    }
    if (browserName === 'firefox' && parseFloat(browserInfo.version) < 44) {
      return false;
    }
    if (browserName === 'firefox' && os === 'Android') {
      return false;
    }
    if (['safari', 'firefox', 'chrome'].indexOf(browserName) < 0) {
      return false;
    }
    if (browserName === 'safari') {
      return oSpP.isSafariNotificationSupported();
    } else if (this.isHttps()) {
      return oSpP.isServiceWorkerChromeSupported();
    }

    return true;
  };

  SendPulse.prototype.getPushSubscriptionInfo = function getPushSubscriptionInfo(callback) {
    var oSpP = window.oSpP;
    oSpP.getDbValue('SPIDs', 'SubscriptionId', function (event) {
      callback(event.target.result);
    });
  };

  SendPulse.prototype.sendUserAttributes = function sendUserAttributes(newUser, oldUser) {
    (0, _each2['default'])(newUser, function (key, value) {
      if ((0, _componentType2['default'])(value) !== 'object' && (!oldUser || value !== oldUser[key])) {
        window.oSpP.push(key, String(value));
      }
    });
  };

  SendPulse.prototype.isLoaded = function isLoaded() {
    return !!window.oSpP;
  };

  SendPulse.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'oSpP');
  };

  SendPulse.prototype.isHttps = function isHttps() {
    return window.location.href.indexOf('https://') === 0 && this.getOption('https') === true;
  };

  SendPulse.prototype.trackEvent = function trackEvent(event) {
    if (event.name === this.getOption('pushSubscriptionTriggerEvent')) {
      if (this.checkPushNotificationsSupport()) {
        if (this.isHttps()) {
          window.oSpP.startSubscription();
        } else {
          var browserInfo = window.oSpP.detectBrowser();
          var browserName = browserInfo.name.toLowerCase();
          if (browserName === 'safari') {
            window.oSpP.startSubscription();
          } else if (browserName === 'chrome' || browserName === 'firefox') {
            window.oSpP.showPopUp();
          }
        }
      }
    }
  };

  return SendPulse;
}(_Integration3['default']);

exports['default'] = SendPulse;

},{"./../Integration.js":97,"./../functions/deleteProperty.js":102,"./../functions/each.js":103,"component-type":5}],128:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Vkontakte = function (_Integration) {
  _inherits(Vkontakte, _Integration);

  function Vkontakte(digitalData, options) {
    _classCallCheck(this, Vkontakte);

    var optionsWithDefaults = Object.assign({
      eventPixels: {}
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this._isLoaded = false;
    return _this;
  }

  Vkontakte.prototype.initialize = function initialize() {
    this._isLoaded = true;
    this.onLoad();
  };

  Vkontakte.prototype.isLoaded = function isLoaded() {
    return this._isLoaded;
  };

  Vkontakte.prototype.reset = function reset() {
    // nothing to reset
  };

  Vkontakte.prototype.trackEvent = function trackEvent(event) {
    var eventPixels = this.getOption('eventPixels');
    if (eventPixels[event.name]) {
      var pixelUrl = eventPixels[event.name];
      this.addPixel(pixelUrl);
    }
  };

  Vkontakte.prototype.addPixel = function addPixel(pixelUrl) {
    (window.Image ? new Image() : window.document.createElement('img')).src = window.location.protocol + pixelUrl;
  };

  return Vkontakte;
}(_Integration3['default']);

exports['default'] = Vkontakte;

},{"./../Integration.js":97}],129:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

function getProductCategory(product) {
  var categories = [];
  if (product.category) categories.push(product.category);
  if (product.subcategory) categories.push(product.subcategory);
  return categories.length ? categories.join('/') : undefined;
}

function getProductId(product) {
  return product.id || product.skuCode || undefined;
}

function getProduct(product, quantity) {
  var yaProduct = {};
  var id = getProductId(product);
  var brand = product.brand || product.manufacturer;
  var price = product.unitSalePrice || product.unitPrice;
  var category = getProductCategory(product);
  if (id) yaProduct.id = id;
  if (product.name) yaProduct.name = product.name;
  if (brand) yaProduct.brand = brand;
  if (price) yaProduct.price = price;
  if (category) yaProduct.category = category;
  if (product.variant) yaProduct.variant = product.variant;
  if (product.voucher) yaProduct.coupon = product.voucher;
  if (quantity) yaProduct.quantity = quantity;
  return yaProduct;
}

var YandexMetrica = function (_Integration) {
  _inherits(YandexMetrica, _Integration);

  function YandexMetrica(digitalData, options) {
    _classCallCheck(this, YandexMetrica);

    var optionsWithDefaults = Object.assign({
      counterId: '',
      clickmap: false,
      webvisor: false,
      trackLinks: true,
      trackHash: false,
      purchaseGoalId: undefined,
      goals: {},
      noConflict: false
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.addTag({
      type: 'script',
      attr: {
        src: '//mc.yandex.ru/metrika/watch.js'
      }
    });
    return _this;
  }

  YandexMetrica.prototype.initialize = function initialize() {
    var _this2 = this;

    var id = this.getOption('counterId');

    window.yandex_metrika_callbacks = window.yandex_metrika_callbacks || [];
    this.dataLayer = window.dataLayer = window.dataLayer || [];
    if (!this.getOption('noConflict') && id) {
      window.yandex_metrika_callbacks.push(function () {
        _this2.yaCounter = window['yaCounter' + id] = new window.Ya.Metrika({
          id: id,
          clickmap: _this2.getOption('clickmap'),
          webvisor: _this2.getOption('webvisor'),
          trackLinks: _this2.getOption('trackLinks'),
          trackHash: _this2.getOption('trackHash'),
          ecommerce: true
        });
      });
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  };

  YandexMetrica.prototype.isLoaded = function isLoaded() {
    return !!(window.Ya && window.Ya.Metrika);
  };

  YandexMetrica.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'Ya');
    (0, _deleteProperty2['default'])(window, 'yandex_metrika_callbacks');
    (0, _deleteProperty2['default'])(window, 'dataLayer');
  };

  YandexMetrica.prototype.trackEvent = function trackEvent(event) {
    var methods = {
      'Viewed Product Detail': 'onViewedProductDetail',
      'Added Product': 'onAddedProduct',
      'Removed Product': 'onRemovedProduct',
      'Completed Transaction': 'onCompletedTransaction'
    };

    if (this.getOption('counterId')) {
      var method = methods[event.name];
      if (method && !this.getOption('noConflict')) {
        this[method](event);
      }

      var goals = this.getOption('goals');
      var goalIdentificator = goals[event.name];
      if (goalIdentificator) {
        this.yaCounter.reachGoal(goalIdentificator);
      }
    }
  };

  YandexMetrica.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var product = event.product;
    if (!getProductId(product) && !product.name) return;
    this.dataLayer.push({
      ecommerce: {
        detail: {
          products: [getProduct(product)]
        }
      }
    });
  };

  YandexMetrica.prototype.onAddedProduct = function onAddedProduct(event) {
    var product = event.product;
    if (!getProductId(product) && !product.name) return;
    var quantity = event.quantity || 1;
    this.dataLayer.push({
      ecommerce: {
        add: {
          products: [getProduct(product, quantity)]
        }
      }
    });
  };

  YandexMetrica.prototype.onRemovedProduct = function onRemovedProduct(event) {
    var product = event.product;
    if (!getProductId(product) && !product.name) return;
    var quantity = event.quantity;
    this.dataLayer.push({
      ecommerce: {
        remove: {
          products: [{
            id: getProductId(product),
            name: product.name,
            category: getProductCategory(product),
            quantity: quantity
          }]
        }
      }
    });
  };

  YandexMetrica.prototype.onCompletedTransaction = function onCompletedTransaction(event) {
    var transaction = event.transaction;
    if (!transaction.orderId) return;

    var products = transaction.lineItems.filter(function (lineItem) {
      var product = lineItem.product;
      return getProductId(product) || product.name;
    }).map(function (lineItem) {
      var product = lineItem.product;
      var quantity = lineItem.quantity || 1;
      return getProduct(product, quantity);
    });
    var purchase = {
      actionField: {
        id: transaction.orderId,
        goal_id: this.getOption('purchaseGoalId')
      },
      products: products
    };

    if (transaction.vouchers && transaction.vouchers.length) {
      purchase.actionField.coupon = transaction.vouchers[0];
    }

    if (transaction.total) {
      purchase.actionField.revenue = transaction.total;
    } else if (transaction.subtotal) {
      purchase.actionField.revenue = transaction.subtotal;
    }

    this.dataLayer.push({
      ecommerce: { purchase: purchase }
    });
  };

  return YandexMetrica;
}(_Integration3['default']);

exports['default'] = YandexMetrica;

},{"./../Integration.js":97,"./../functions/deleteProperty.js":102}],130:[function(require,module,exports){
'use strict';

require('core-js/modules/es6.object.create');

require('core-js/modules/es6.array.is-array');

require('core-js/modules/es6.array.index-of');

require('core-js/modules/es6.function.bind');

require('core-js/modules/es6.object.assign');

require('core-js/modules/es6.string.trim');

require('core-js/modules/_has');

},{"core-js/modules/_has":20,"core-js/modules/es6.array.index-of":50,"core-js/modules/es6.array.is-array":51,"core-js/modules/es6.function.bind":52,"core-js/modules/es6.object.assign":53,"core-js/modules/es6.object.create":54,"core-js/modules/es6.string.trim":55}],131:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _deleteProperty = require('./../src/functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _AutoEvents = require('./../src/AutoEvents.js');

var _AutoEvents2 = _interopRequireDefault(_AutoEvents);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('AutoEvents', function () {

  var _digitalData = void 0;
  var _ddListener = void 0;
  var _autoEvents = void 0;

  before(function () {
    _autoEvents = new _AutoEvents2['default']();
  });

  describe('#onInitialize', function () {

    beforeEach(function () {
      _digitalData = {
        page: {
          type: 'home'
        },
        events: []
      };
      _ddListener = [];
      _autoEvents.setDigitalData(_digitalData);
      _autoEvents.setDDListener(_ddListener);
    });

    it('should add DDL change listeners', function () {
      _autoEvents.onInitialize();
      _assert2['default'].ok(_ddListener.length == 3);
      _assert2['default'].ok(_ddListener[0][1] === 'change:page');
      _assert2['default'].ok(_ddListener[1][1] === 'change:product.id');
      _assert2['default'].ok(_ddListener[2][1] === 'change:transaction.orderId');
    });
  });

  describe('#fireViewedPage', function () {

    beforeEach(function () {
      _digitalData = {
        page: {
          type: 'home'
        },
        events: []
      };
      _autoEvents.setDigitalData(_digitalData);
    });

    it('should fire "Viewed Page" event', function () {
      _autoEvents.fireViewedPage();
      _assert2['default'].ok(_digitalData.events[0].name === 'Viewed Page');
      _assert2['default'].ok(_digitalData.events[0].page.type === 'home');
    });

    it('should fire only "Viewed Page" event', function () {
      _autoEvents.onInitialize();
      _assert2['default'].ok(_digitalData.events[0].name === 'Viewed Page');
      _assert2['default'].ok(_digitalData.events[0].page.type === 'home');
      _assert2['default'].ok(_digitalData.events.length === 1);
    });
  });

  describe('#fireViewedProductCategory', function () {

    beforeEach(function () {
      _digitalData = {
        page: {
          type: 'category'
        },
        listing: {
          categoryId: '123'
        },
        events: []
      };
      _autoEvents.setDigitalData(_digitalData);
    });

    it('should fire "Viewed Product Category" event', function () {
      _autoEvents.fireViewedProductCategory();
      _assert2['default'].ok(_digitalData.events[0].name === 'Viewed Product Category');
      _assert2['default'].ok(_digitalData.events[0].listing.categoryId === '123');
      _assert2['default'].ok(_digitalData.page.type === 'category');
    });

    it('should fire "Viewed Product Category" and "Viewed Page" event', function () {
      _autoEvents.onInitialize();
      _assert2['default'].ok(_digitalData.events[1].name === 'Viewed Product Category');
      _assert2['default'].ok(_digitalData.events[1].listing.categoryId === '123');
      _assert2['default'].ok(_digitalData.page.type === 'category');
      _assert2['default'].ok(_digitalData.events.length === 2);
    });
  });

  describe('#fireViewedProductCategory DDL version <1.1.0', function () {

    beforeEach(function () {
      _digitalData = {
        version: '1.0.0',
        page: {
          type: 'category',
          categoryId: '123'
        },
        events: []
      };
      _autoEvents.setDigitalData(_digitalData);
    });

    it('should fire "Viewed Product Category" event', function () {
      _autoEvents.fireViewedProductCategory();
      _assert2['default'].ok(_digitalData.events[0].name === 'Viewed Product Category');
      _assert2['default'].ok(_digitalData.events[0].listing.categoryId === '123');
      _assert2['default'].ok(_digitalData.page.type === 'category');
    });

    it('should fire "Viewed Product Category" and "Viewed Page" event', function () {
      _autoEvents.onInitialize();
      _assert2['default'].ok(_digitalData.events[1].name === 'Viewed Product Category');
      _assert2['default'].ok(_digitalData.events[1].listing.categoryId === '123');
      _assert2['default'].ok(_digitalData.page.type === 'category');
      _assert2['default'].ok(_digitalData.events.length === 2);
    });
  });

  describe('#fireViewedProductDetail', function () {

    beforeEach(function () {
      _digitalData = {
        page: {
          type: 'product'
        },
        product: {
          id: '123'
        },
        events: []
      };
      _autoEvents.setDigitalData(_digitalData);
    });

    it('should fire "Viewed Product Detail" event', function () {
      _autoEvents.fireViewedProductDetail();
      _assert2['default'].ok(_digitalData.events[0].name === 'Viewed Product Detail');
      _assert2['default'].ok(_digitalData.events[0].product.id === '123');
    });

    it('should fire "Viewed Product Detail" and "Viewed Page" event', function () {
      _autoEvents.onInitialize();
      _assert2['default'].ok(_digitalData.events[1].name === 'Viewed Product Detail');
      _assert2['default'].ok(_digitalData.events[1].product.id === '123');
      _assert2['default'].ok(_digitalData.events.length === 2);
    });
  });

  describe('#fireCompletedTransaction', function () {

    beforeEach(function () {
      _digitalData = {
        page: {
          type: 'confirmation'
        },
        transaction: {
          orderId: '123',
          total: 100
        },
        events: []
      };
      _autoEvents.setDigitalData(_digitalData);
    });

    it('should fire "Completed Transaction" event', function () {
      _autoEvents.fireCompletedTransaction();
      _assert2['default'].ok(_digitalData.events[0].name === 'Completed Transaction');
      _assert2['default'].ok(_digitalData.events[0].transaction.orderId === '123');
    });

    it('should not fire "Completed Transaction" for returning transactions', function () {
      _digitalData.transaction.isReturning = true;
      _autoEvents.onInitialize();
      _assert2['default'].ok(_digitalData.events.length === 1);
    });

    it('should not fire "Completed Transaction" if transaction object doesn\'t present', function () {
      (0, _deleteProperty2['default'])(_digitalData, 'transaction');
      _autoEvents.onInitialize();
      _assert2['default'].ok(_digitalData.events.length === 1);
    });

    it('should fire "Completed Transaction" and "Viewed Page" event', function () {
      _autoEvents.onInitialize();
      _assert2['default'].ok(_digitalData.events[1].name === 'Completed Transaction');
      _assert2['default'].ok(_digitalData.events[1].transaction.orderId === '123');
      _assert2['default'].ok(_digitalData.events.length === 2);
    });
  });

  describe('#fireSearched', function () {

    beforeEach(function () {
      _digitalData = {
        page: {
          type: 'search'
        },
        listing: {
          query: 'some query',
          resultCount: 10
        },
        events: []
      };
      _autoEvents.setDigitalData(_digitalData);
    });

    it('should fire "Searched" event', function () {
      _autoEvents.fireSearched();
      _assert2['default'].ok(_digitalData.events[0].name === 'Searched');
      _assert2['default'].ok(_digitalData.events[0].listing.query === 'some query');
      _assert2['default'].ok(_digitalData.events[0].listing.resultCount === 10);
    });

    it('should not fire "Searched" if there is no listing object', function () {
      (0, _deleteProperty2['default'])(_digitalData, 'listing');
      _autoEvents.onInitialize();
      _assert2['default'].ok(_digitalData.events.length === 1);
    });

    it('should not fire "Searched" if there is no query in listing object', function () {
      (0, _deleteProperty2['default'])(_digitalData.listing, 'query');
      _autoEvents.onInitialize();
      _assert2['default'].ok(_digitalData.events.length === 1);
    });

    it('should fire "Searched" and "Viewed Page" event', function () {
      _autoEvents.onInitialize();
      _assert2['default'].ok(_digitalData.events[1].name === 'Searched');
      _assert2['default'].ok(_digitalData.events[1].listing.query === 'some query');
      _assert2['default'].ok(_digitalData.events[1].listing.resultCount === 10);
      _assert2['default'].ok(_digitalData.events.length === 2);
    });
  });
});

},{"./../src/AutoEvents.js":91,"./../src/functions/deleteProperty.js":102,"assert":1}],132:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _DDHelper = require('./../src/DDHelper.js');

var _DDHelper2 = _interopRequireDefault(_DDHelper);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('DDHelper', function () {

  var _digitalData = void 0;

  describe('#get', function () {
    before(function () {
      _digitalData = {
        page: {
          type: 'category'
        },
        user: {
          email: 'text@email.com',
          userId: '123'
        },
        listing: {
          items: [{
            id: '1'
          }, {
            id: '2'
          }]
        }
      };
    });

    it('should get nested object', function () {
      _assert2['default'].ok(_DDHelper2['default'].get('page.type', _digitalData) === 'category');
    });

    it('should get nested object using array notation', function () {
      _assert2['default'].ok(_DDHelper2['default'].get('listing.items[1].id', _digitalData) === '2');
    });

    it('should get nested object using object notation', function () {
      _assert2['default'].ok(_DDHelper2['default'].get('listing.items.1.id', _digitalData) === '2');
    });

    it('should get nested object property', function () {
      _assert2['default'].ok(_DDHelper2['default'].get('listing.items.length', _digitalData) === 2);
    });
  });

  describe('#getProduct', function () {
    before(function () {
      _digitalData = {
        page: {
          type: 'category'
        },
        user: {
          email: 'text@email.com',
          userId: '123'
        },
        product: {
          id: '1'
        },
        listing: {
          items: [{
            id: '2'
          }, {
            id: '3'
          }, {
            id: '5'
          }]
        },
        recommendation: {
          listName: 'recom',
          items: [{
            id: '4'
          }, {
            id: '5'
          }]
        },
        cart: {
          lineItems: [{
            product: {
              id: '6'
            },
            quantity: 2
          }]
        }
      };
    });

    it('should get product from product key', function () {
      _assert2['default'].ok(_DDHelper2['default'].getProduct('1', _digitalData).id === '1');
    });

    it('should get product from listing key', function () {
      _assert2['default'].ok(_DDHelper2['default'].getProduct('2', _digitalData).id === '2');
    });

    it('should get product from recommendation key', function () {
      _assert2['default'].ok(_DDHelper2['default'].getProduct('4', _digitalData).id === '4');
    });

    it('should get product from list key without any listName properties', function () {
      _assert2['default'].ok(_DDHelper2['default'].getProduct('5', _digitalData, 'recom').id === '5');
      _assert2['default'].ok(!_DDHelper2['default'].getProduct('5', _digitalData, 'recom').listName);
    });

    it('should get product from cart key', function () {
      _assert2['default'].ok(_DDHelper2['default'].getProduct('6', _digitalData).id === '6');
    });
  });

  describe('#getListItem', function () {
    before(function () {
      _digitalData = {
        page: {
          type: 'category'
        },
        user: {
          email: 'text@email.com',
          userId: '123'
        },
        product: {
          id: '1'
        },
        listing: {
          items: [{
            id: '2'
          }, {
            id: '3'
          }, {
            id: '5'
          }]
        },
        recommendation: {
          listName: 'recom',
          items: [{
            id: '4'
          }, {
            id: '5'
          }]
        },
        cart: {
          lineItems: [{
            product: {
              id: '6'
            },
            quantity: 2
          }]
        }
      };
    });

    it('should not get product from product key', function () {
      _assert2['default'].ok(!_DDHelper2['default'].getListItem('1', _digitalData));
    });

    it('should get product from listing key', function () {
      _assert2['default'].ok(_DDHelper2['default'].getListItem('2', _digitalData).product.id === '2');
    });

    it('should get product from recommendation key', function () {
      _assert2['default'].ok(_DDHelper2['default'].getListItem('4', _digitalData).product.id === '4');
    });

    it('should get product from recommendation key from list "recom"', function () {
      _assert2['default'].ok(_DDHelper2['default'].getListItem('5', _digitalData, 'recom').product.id === '5');
      _assert2['default'].ok(_DDHelper2['default'].getListItem('5', _digitalData, 'recom').listName === 'recom');
    });

    it('should not get product from cart key', function () {
      _assert2['default'].ok(!_DDHelper2['default'].getListItem('6', _digitalData));
    });
  });

  describe('#getCampaign', function () {
    before(function () {
      _digitalData = {
        page: {
          type: 'category'
        },
        user: {
          email: 'text@email.com',
          userId: '123'
        },
        campaigns: [{
          id: '1'
        }, {
          id: '2'
        }]
      };
    });

    it('should get campaign from campaigns key', function () {
      _assert2['default'].ok(_DDHelper2['default'].getCampaign('1', _digitalData).id === '1');
    });
  });
});

},{"./../src/DDHelper.js":92,"assert":1}],133:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _deleteProperty = require('./../src/functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _DigitalDataEnricher = require('./../src/DigitalDataEnricher.js');

var _DigitalDataEnricher2 = _interopRequireDefault(_DigitalDataEnricher);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('DigitalDataEnricher', function () {

  var _digitalData = void 0;
  var _htmlGlobals = void 0;
  var _digitalDataEnricher = void 0;
  var _document = {
    referrer: 'http://google.com',
    title: 'Website Home Page'
  };
  var _location = {
    pathname: '/home',
    href: 'Website Home Page',
    search: '?utm_source=newsletter&utm_medium=email&utm_campaign=test_campaign',
    hash: '#title1'
  };
  var _navigator = {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
  };

  before(function () {
    _digitalDataEnricher = new _DigitalDataEnricher2['default'](_digitalData);
    _htmlGlobals = _digitalDataEnricher.getHtmlGlobals();
    _sinon2['default'].stub(_htmlGlobals, 'getDocument', function () {
      return _document;
    });
    _sinon2['default'].stub(_htmlGlobals, 'getLocation', function () {
      return _location;
    });
    _sinon2['default'].stub(_htmlGlobals, 'getNavigator', function () {
      return _navigator;
    });
  });

  after(function () {
    _htmlGlobals.getLocation.restore();
    _htmlGlobals.getDocument.restore();
    _htmlGlobals.getNavigator.restore();
  });

  describe('#enrichPageData', function () {

    before(function () {
      _digitalData = {
        page: {
          type: 'home'
        },
        events: []
      };
    });

    it('should enrich DDL page variable', function () {
      _digitalDataEnricher.setDigitalData(_digitalData);
      _digitalDataEnricher.enrichPageData();
      _assert2['default'].ok(_digitalData.page.url === _location.href);
      _assert2['default'].ok(_digitalData.page.path === _location.pathname);
      _assert2['default'].ok(_digitalData.page.queryString === _location.search);
      _assert2['default'].ok(_digitalData.page.hash === _location.hash);
      _assert2['default'].ok(_digitalData.page.referrer === _document.referrer);
      _assert2['default'].ok(_digitalData.page.title === _document.title);
    });
  });

  describe('#enrichContextData', function () {

    before(function () {
      _digitalData = {
        page: {
          type: 'home',
          url: 'http://example.com/home'
        },
        context: {},
        events: []
      };
    });

    it('should enrich DDL context variable', function () {
      _digitalDataEnricher.setDigitalData(_digitalData);
      _digitalDataEnricher.enrichContextData();
      _assert2['default'].ok(_digitalData.context.userAgent === _navigator.userAgent);
    });
  });
});

},{"./../src/DigitalDataEnricher.js":94,"./../src/functions/deleteProperty.js":102,"assert":1,"sinon":64}],134:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _deleteProperty = require('./../src/functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _EventDataEnricher = require('./../src/EventDataEnricher.js');

var _EventDataEnricher2 = _interopRequireDefault(_EventDataEnricher);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('EventDataEnricher', function () {

  var _digitalData = void 0;

  describe('#product', function () {

    before(function () {
      _digitalData = {
        page: {
          type: 'home'
        },
        events: []
      };
    });

    describe('using "product" DDL var', function () {

      beforeEach(function () {
        _digitalData.product = {
          id: '123',
          name: 'Test Product',
          unitPrice: 10000
        };
      });

      afterEach(function () {
        (0, _deleteProperty2['default'])(_digitalData, 'product');
        (0, _deleteProperty2['default'])(_digitalData, 'listing');
        (0, _deleteProperty2['default'])(_digitalData, 'recommendation');
      });

      it('should enrich product by id', function () {
        var event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: '123'
        };

        event.product = _EventDataEnricher2['default'].product(event.product, _digitalData);

        _assert2['default'].ok(event.name);
        _assert2['default'].ok(event.category);
        _assert2['default'].ok(event.product);
        _assert2['default'].ok(event.product.id === '123', 'product.id is is not equal to "123"');
        _assert2['default'].ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        _assert2['default'].ok(event.product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
      });

      it('should enrich product by product.id', function () {
        var event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitPrice: 11000,
            unitSalePrice: 11000
          }
        };

        event.product = _EventDataEnricher2['default'].product(event.product, _digitalData);

        _assert2['default'].ok(event.name);
        _assert2['default'].ok(event.category);
        _assert2['default'].ok(event.product);
        _assert2['default'].ok(event.product.id === '123', 'product.id is is not equal to "123"');
        _assert2['default'].ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        _assert2['default'].ok(event.product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        _assert2['default'].ok(event.product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        _assert2['default'].ok(_digitalData.product.unitPrice === 10000, 'DDL product.unitPrice is not equal to 10000');
      });
    });

    describe('using "listing" DDL var', function () {

      beforeEach(function () {
        _digitalData.listing = {
          items: [{
            id: '123',
            name: 'Test Product',
            unitPrice: 10000
          }, {
            id: '234',
            name: 'Test Product 2',
            unitPrice: 10000
          }]
        };
      });

      afterEach(function () {
        (0, _deleteProperty2['default'])(_digitalData, 'product');
        (0, _deleteProperty2['default'])(_digitalData, 'listing');
        (0, _deleteProperty2['default'])(_digitalData, 'recommendation');
      });

      it('should enrich product by id', function () {
        var event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: '123'
        };

        event.product = _EventDataEnricher2['default'].product(event.product, _digitalData);

        _assert2['default'].ok(event.name);
        _assert2['default'].ok(event.category);
        _assert2['default'].ok(event.product);
        _assert2['default'].ok(event.product.id === '123', 'product.id is is not equal to "123"');
        _assert2['default'].ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        _assert2['default'].ok(event.product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
      });

      it('should enrich products array by id', function () {
        var event = {
          name: 'Viewed Product',
          category: 'Ecommerce',
          listItems: [{
            product: '123'
          }, {
            product: '234'
          }]
        };

        event.listItems = _EventDataEnricher2['default'].listItems(event.listItems, _digitalData);

        _assert2['default'].ok(event.name);
        _assert2['default'].ok(event.category);
        _assert2['default'].ok(event.listItems);
        _assert2['default'].ok(event.listItems[0].product.id === '123', 'product.id is is not equal to "123"');
        _assert2['default'].ok(event.listItems[0].product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        _assert2['default'].ok(event.listItems[0].product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
        _assert2['default'].ok(event.listItems[1].product.id === '234', 'product.id is is not equal to "234"');
        _assert2['default'].ok(event.listItems[1].product.name === 'Test Product 2', 'product.name is not equal to "Test Product 2"');
        _assert2['default'].ok(event.listItems[1].product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
      });

      it('should enrich product by product.id', function () {
        var event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitPrice: 11000,
            unitSalePrice: 11000
          }
        };

        event.product = _EventDataEnricher2['default'].product(event.product, _digitalData);

        _assert2['default'].ok(event.name);
        _assert2['default'].ok(event.category);
        _assert2['default'].ok(event.product);
        _assert2['default'].ok(event.product.id === '123', 'product.id is is not equal to "123"');
        _assert2['default'].ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        _assert2['default'].ok(event.product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        _assert2['default'].ok(event.product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        _assert2['default'].ok(_digitalData.listing.items[0].unitPrice === 10000, 'DDL listing.items[0].unitPrice is not equal to 10000');
      });

      it('should enrich listItems array by product.id', function () {
        var event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          listItems: [{
            product: {
              id: '123',
              unitPrice: 11000,
              unitSalePrice: 11000
            }
          }, {
            product: {
              id: '234',
              unitPrice: 11000,
              unitSalePrice: 11000
            }
          }]
        };

        event.listItems = _EventDataEnricher2['default'].listItems(event.listItems, _digitalData);

        _assert2['default'].ok(event.name);
        _assert2['default'].ok(event.category);
        _assert2['default'].ok(event.listItems);
        _assert2['default'].ok(event.listItems[0].product.id === '123', 'product.id is is not equal to "123"');
        _assert2['default'].ok(event.listItems[0].product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        _assert2['default'].ok(event.listItems[0].product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        _assert2['default'].ok(event.listItems[0].product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        _assert2['default'].ok(event.listItems[1].product.id === '234', 'product.id is is not equal to "234"');
        _assert2['default'].ok(event.listItems[1].product.name === 'Test Product 2', 'product.name is not equal to "Test Product 2"');
        _assert2['default'].ok(event.listItems[1].product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        _assert2['default'].ok(event.listItems[1].product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        _assert2['default'].ok(_digitalData.listing.items[0].unitPrice === 10000, 'DDL listing.items[0].unitPrice is not equal to 10000');
      });
    });

    describe('using "recommendation" DDL var', function () {

      beforeEach(function () {
        _digitalData.recommendation = {
          items: [{
            id: '123',
            name: 'Test Product',
            unitPrice: 10000
          }]
        };
      });

      afterEach(function () {
        (0, _deleteProperty2['default'])(_digitalData, 'product');
        (0, _deleteProperty2['default'])(_digitalData, 'listing');
        (0, _deleteProperty2['default'])(_digitalData, 'recommendation');
      });

      it('should enrich product by id', function () {
        var event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: '123'
        };

        event.product = _EventDataEnricher2['default'].product(event.product, _digitalData);

        _assert2['default'].ok(event.name);
        _assert2['default'].ok(event.category);
        _assert2['default'].ok(event.product);
        _assert2['default'].ok(event.product.id === '123', 'product.id is is not equal to "123"');
        _assert2['default'].ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        _assert2['default'].ok(event.product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
      });

      it('should enrich product by product.id', function () {
        var event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitPrice: 11000,
            unitSalePrice: 11000
          }
        };

        event.product = _EventDataEnricher2['default'].product(event.product, _digitalData);

        _assert2['default'].ok(event.name);
        _assert2['default'].ok(event.category);
        _assert2['default'].ok(event.product);
        _assert2['default'].ok(event.product.id === '123', 'product.id is is not equal to "123"');
        _assert2['default'].ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        _assert2['default'].ok(event.product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        _assert2['default'].ok(event.product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        _assert2['default'].ok(_digitalData.recommendation.items[0].unitPrice === 10000, 'DDL recommendation.items[0].unitPrice is not equal to 10000');
      });
    });

    describe('using "listing" DDL var which is an array of listings', function () {

      beforeEach(function () {
        _digitalData.listing = [{
          items: [{
            id: '123',
            name: 'Test Product',
            unitPrice: 10000
          }]
        }];
      });

      afterEach(function () {
        (0, _deleteProperty2['default'])(_digitalData, 'product');
        (0, _deleteProperty2['default'])(_digitalData, 'listing');
        (0, _deleteProperty2['default'])(_digitalData, 'recommendation');
      });

      it('should enrich product by id', function () {
        var event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: '123'
        };

        event.product = _EventDataEnricher2['default'].product(event.product, _digitalData);

        _assert2['default'].ok(event.name);
        _assert2['default'].ok(event.category);
        _assert2['default'].ok(event.product);
        _assert2['default'].ok(event.product.id === '123', 'product.id is is not equal to "123"');
        _assert2['default'].ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        _assert2['default'].ok(event.product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
      });

      it('should enrich product by product.id', function () {
        var event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitPrice: 11000,
            unitSalePrice: 11000
          }
        };

        event.product = _EventDataEnricher2['default'].product(event.product, _digitalData);

        _assert2['default'].ok(event.name);
        _assert2['default'].ok(event.category);
        _assert2['default'].ok(event.product);
        _assert2['default'].ok(event.product.id === '123', 'product.id is is not equal to "123"');
        _assert2['default'].ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        _assert2['default'].ok(event.product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        _assert2['default'].ok(event.product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        _assert2['default'].ok(_digitalData.listing[0].items[0].unitPrice === 10000, 'DDL listing[0].items[0].unitPrice is not equal to 10000');
      });
    });
  });

  describe('#transaction', function () {

    before(function () {
      _digitalData = {
        page: {
          type: 'home'
        },
        transaction: {
          orderId: '123',
          lineItems: [{
            product: {
              id: '123'
            },
            quantity: 2
          }],
          total: 10000,
          subtotal: 10000
        },
        events: []
      };
    });

    it('should enrich transaction when transaction is empty', function () {
      var event = {
        name: 'Completed Transaction',
        category: 'Ecommerce'
      };

      event.transaction = _EventDataEnricher2['default'].transaction(event.transaction, _digitalData);

      _assert2['default'].ok(event.name);
      _assert2['default'].ok(event.category);
      _assert2['default'].ok(event.transaction);
      _assert2['default'].ok(event.transaction.orderId === '123', 'transaction.orderId is is not equal to "123"');
      _assert2['default'].ok(event.transaction.lineItems.length === 1, 'transaction.lineItemsLength is is not equal to 1');
    });

    it('should enrich transaction when transaction is not empty', function () {
      var event = {
        name: 'Completed Transaction',
        category: 'Ecommerce',
        transaction: {
          oderId: '123',
          subtotal: 11000
        }
      };

      event.transaction = _EventDataEnricher2['default'].transaction(event.transaction, _digitalData);

      _assert2['default'].ok(event.name);
      _assert2['default'].ok(event.category);
      _assert2['default'].ok(event.transaction);
      _assert2['default'].ok(event.transaction.orderId === '123', 'transaction.orderId is is not equal to "123"');
      _assert2['default'].ok(event.transaction.subtotal === 11000, 'transaction.subtital is is not equal to 11000');
      _assert2['default'].ok(event.transaction.lineItems.length === 1, 'transaction.lineItemsLength is is not equal to 1');
    });
  });

  describe('#campaign', function () {

    before(function () {
      _digitalData = {
        page: {
          type: 'home'
        },
        campaigns: [{
          id: '123',
          name: 'Campaign 1',
          category: 'Banner'
        }, {
          id: '234',
          name: 'Campaign 2',
          category: 'Banner'
        }],
        events: []
      };
    });

    it('should enrich campaign by id', function () {
      var event = {
        name: 'Clicked Campaign',
        category: 'Promo',
        campaign: '123'
      };

      event.campaign = _EventDataEnricher2['default'].campaign(event.campaign, _digitalData);

      _assert2['default'].ok(event.name);
      _assert2['default'].ok(event.category);
      _assert2['default'].ok(event.campaign);
      _assert2['default'].ok(event.campaign.id === '123', 'campaign.id is not equal to "123"');
      _assert2['default'].ok(event.campaign.name === 'Campaign 1', 'campaign.name is not equal to "Campaign 1"');
    });

    it('should enrich campaign by campaign.id', function () {
      var event = {
        name: 'Clicked Campaign',
        category: 'Promo',
        campaign: {
          id: '123',
          category: 'Banner 2',
          description: 'Lorem ipsum'
        }
      };

      event.campaign = _EventDataEnricher2['default'].campaign(event.campaign, _digitalData);

      _assert2['default'].ok(event.name);
      _assert2['default'].ok(event.category);
      _assert2['default'].ok(event.campaign);
      _assert2['default'].ok(event.campaign.id === '123', 'campaign.id is is not equal to "123"');
      _assert2['default'].ok(event.campaign.name === 'Campaign 1', 'campaign.name is not equal to "Campaign 1"');
      _assert2['default'].ok(event.campaign.category === 'Banner 2', 'campaign.category is not equal to "Banner 2"');
      _assert2['default'].ok(event.campaign.description === 'Lorem ipsum', 'campaign.category is not equal to "Lorem ipsum"');
      _assert2['default'].ok(_digitalData.campaigns[0].category === 'Banner', 'digitalData.campaigns[0].category is not equal to "Banner"');
    });

    it('should enrich campaigns array by id', function () {
      var event = {
        name: 'Viewed Campaign',
        category: 'Promo',
        campaigns: ['123', '234']
      };

      event.campaigns = _EventDataEnricher2['default'].campaigns(event.campaigns, _digitalData);

      _assert2['default'].ok(event.name);
      _assert2['default'].ok(event.category);
      _assert2['default'].ok(event.campaigns);
      _assert2['default'].ok(event.campaigns[0].id === '123', 'campaign.id is not equal to "123"');
      _assert2['default'].ok(event.campaigns[0].name === 'Campaign 1', 'campaign.name is not equal to "Campaign 1"');
      _assert2['default'].ok(event.campaigns[1].id === '234', 'campaign.id is not equal to "123"');
      _assert2['default'].ok(event.campaigns[1].name === 'Campaign 2', 'campaign.name is not equal to "Campaign 1"');
    });

    it('should enrich campaigns array by campaign.id', function () {
      var event = {
        name: 'Viewed Campaign',
        category: 'Promo',
        campaigns: [{
          id: '123',
          category: 'Banner 2',
          description: 'Lorem ipsum'
        }, {
          id: '234',
          category: 'Banner 2',
          description: 'Lorem ipsum'
        }]
      };

      event.campaigns = _EventDataEnricher2['default'].campaigns(event.campaigns, _digitalData);

      _assert2['default'].ok(event.name);
      _assert2['default'].ok(event.category);
      _assert2['default'].ok(event.campaigns);
      _assert2['default'].ok(event.campaigns[0].id === '123', 'campaign.id is is not equal to "123"');
      _assert2['default'].ok(event.campaigns[0].name === 'Campaign 1', 'campaign.name is not equal to "Campaign 1"');
      _assert2['default'].ok(event.campaigns[0].category === 'Banner 2', 'campaign.category is not equal to "Banner 2"');
      _assert2['default'].ok(event.campaigns[0].description === 'Lorem ipsum', 'campaign.category is not equal to "Lorem ipsum"');
      _assert2['default'].ok(event.campaigns[1].id === '234', 'campaign.id is is not equal to "123"');
      _assert2['default'].ok(event.campaigns[1].name === 'Campaign 2', 'campaign.name is not equal to "Campaign 1"');
      _assert2['default'].ok(event.campaigns[1].category === 'Banner 2', 'campaign.category is not equal to "Banner 2"');
      _assert2['default'].ok(event.campaigns[1].description === 'Lorem ipsum', 'campaign.category is not equal to "Lorem ipsum"');
      _assert2['default'].ok(_digitalData.campaigns[0].category === 'Banner', 'digitalData.campaigns[0].category is not equal to "Banner"');
    });
  });

  describe('#user', function () {

    before(function () {
      _digitalData = {
        page: {
          type: 'home'
        },
        user: {
          firstName: 'John',
          lastName: 'Dow',
          isLoggedIn: true,
          email: 'example@driveback.ru'
        },
        events: []
      };
    });

    it('should enrich user when user is empty', function () {
      var event = {
        name: 'Subscribed',
        category: 'Email'
      };

      event.user = _EventDataEnricher2['default'].user(event.user, _digitalData);

      _assert2['default'].ok(event.name);
      _assert2['default'].ok(event.category);
      _assert2['default'].ok(event.user);
      _assert2['default'].ok(event.user.isLoggedIn === true, 'user.isLoggedIn is not equal to TRUE');
      _assert2['default'].ok(event.user.firstName === 'John', 'user.firstName is not equal to "John"');
      _assert2['default'].ok(event.user.lastName === 'Dow', 'user.lastName is not equal to "Dow"');
      _assert2['default'].ok(event.user.email === 'example@driveback.ru', 'user.email is is not equal to "example@driveback.ru"');
    });

    it('should enrich user when user is not empty', function () {
      var event = {
        name: 'Subscribed',
        category: 'Email',
        user: {
          email: 'example2@driveback.ru'
        }
      };

      event.user = _EventDataEnricher2['default'].user(event.user, _digitalData);

      _assert2['default'].ok(event.name);
      _assert2['default'].ok(event.category);
      _assert2['default'].ok(event.user);
      _assert2['default'].ok(event.user.isLoggedIn === true, 'user.isLoggedIn is not equal to TRUE');
      _assert2['default'].ok(event.user.firstName === 'John', 'user.firstName is not equal to "John"');
      _assert2['default'].ok(event.user.lastName === 'Dow', 'user.lastName is not equal to "Dow"');
      _assert2['default'].ok(event.user.email === 'example2@driveback.ru', 'user.email is is not equal to "example2@driveback.ru"');
    });
  });

  describe('#page', function () {

    before(function () {
      _digitalData = {
        page: {
          type: 'category',
          categoryId: '123'
        },
        events: []
      };
    });

    it('should enrich user when user is empty', function () {
      var event = {
        name: 'Viewed Page',
        category: 'Content'
      };

      event.page = _EventDataEnricher2['default'].page(event.page, _digitalData);

      _assert2['default'].ok(event.name);
      _assert2['default'].ok(event.category);
      _assert2['default'].ok(event.page);
      _assert2['default'].ok(event.page.type === 'category', 'page.type is not equal to "category"');
      _assert2['default'].ok(event.page.categoryId === '123', 'page.categoryId is not equal to "123"');
    });

    it('should enrich user when user is not empty', function () {
      var event = {
        name: 'Subscribed',
        category: 'Email',
        page: {
          categoryId: '234',
          url: 'http://example.com'
        }
      };

      event.page = _EventDataEnricher2['default'].page(event.page, _digitalData);

      _assert2['default'].ok(event.name);
      _assert2['default'].ok(event.category);
      _assert2['default'].ok(event.page);
      _assert2['default'].ok(event.page.type === 'category', 'page.type is not equal to "category"');
      _assert2['default'].ok(event.page.categoryId === '234', 'page.categoryId is not equal to "234"');
      _assert2['default'].ok(event.page.url === 'http://example.com', 'page.categoryId is not equal to "http://example.com"');
    });
  });
});

},{"./../src/EventDataEnricher.js":95,"./../src/functions/deleteProperty.js":102,"assert":1}],135:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _reset = require('./reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _EventManager = require('./../src/EventManager.js');

var _EventManager2 = _interopRequireDefault(_EventManager);

var _AutoEvents = require('./../src/AutoEvents.js');

var _AutoEvents2 = _interopRequireDefault(_AutoEvents);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('EventManager', function () {

  var _eventManager = void 0;
  var _digitalData = void 0;
  var _ddListener = void 0;

  afterEach(function () {
    if (_eventManager) {
      _eventManager.reset();
      _eventManager = undefined;
    }
    (0, _reset2['default'])();
  });

  describe('working with events:', function () {

    var eventTemplate = {
      action: 'Added Product',
      category: 'Ecommerce'
    };

    beforeEach(function () {
      _digitalData = {
        events: []
      };
      _ddListener = [];
      _eventManager = new _EventManager2['default'](_digitalData, _ddListener);
    });

    it('should add time and hasFired fields to event', function () {
      var event = Object.assign({}, eventTemplate);

      _eventManager.initialize();

      _digitalData.events.push(event);

      _assert2['default'].ok(_digitalData.events.length == 1);
      _assert2['default'].ok(_digitalData.events[0].timestamp > 100000);
      _assert2['default'].ok(_digitalData.events[0].hasFired);
    });

    it('should process callback for event', function () {
      var event = Object.assign({}, eventTemplate);
      var callbackFired = false;
      var receivedEvent = void 0;

      _eventManager.initialize();

      _ddListener.push(['on', 'event', function (e) {
        callbackFired = true;
        receivedEvent = e;
      }]);
      _digitalData.events.push(event);

      _assert2['default'].ok(callbackFired);
      _assert2['default'].equal(receivedEvent.action, event.action);
      _assert2['default'].equal(receivedEvent.category, event.category);
    });

    it('should process early callback for event', function () {
      var event = Object.assign({}, eventTemplate);

      _ddListener.push(['on', 'event', function (e) {
        _assert2['default'].ok(true);
        _assert2['default'].equal(e.action, event.action);
        _assert2['default'].equal(e.category, event.category);
      }]);

      _eventManager.initialize();

      _digitalData.events.push(event);
    });

    it('should process early callback for early event', function () {
      var event = Object.assign({}, eventTemplate);

      _ddListener.push(['on', 'event', function (e) {
        _assert2['default'].ok(true);
        _assert2['default'].equal(e.action, event.action);
        _assert2['default'].equal(e.category, event.category);
      }]);
      _digitalData.events.push(event);

      _eventManager.initialize();
    });

    it('should fire event with callback inside when no listeners', function (done) {
      _eventManager.initialize();
      _digitalData.events.push({
        name: 'Test',
        category: 'Test',
        callback: function callback(result) {
          done();
        }
      });
    });

    it('should fire event with callback inside after listeners completed', function (done) {
      _eventManager.initialize();

      _ddListener.push(['on', 'event', function (e) {
        return 'test result';
      }]);

      _digitalData.events.push({
        name: 'Test',
        category: 'Test',
        callback: function callback(results) {
          _assert2['default'].ok(results[0] == 'test result');
          done();
        }
      });
    });

    it('should enrich product data from DDL', function (done) {
      _digitalData.product = {
        id: '123',
        name: 'Test Product'
      };

      _eventManager.initialize();

      _ddListener.push(['on', 'event', function (e) {
        (0, _assert2['default'])(e.product.name === 'Test Product');
        done();
      }]);

      _digitalData.events.push({
        name: 'Clicked Product',
        category: 'Ecommerce',
        product: '123'
      });
    });

    it('should not enrich product data from DDL', function (done) {
      _digitalData.product = {
        id: '123',
        name: 'Test Product'
      };

      _eventManager.initialize();

      _ddListener.push(['on', 'event', function (e) {
        (0, _assert2['default'])(!e.product.name);
        done();
      }]);

      _digitalData.events.push({
        name: 'Clicked Product',
        enrichEventData: false,
        category: 'Ecommerce',
        product: '123'
      });
    });

    it('should process past events event if listener was added later', function (done) {
      _eventManager.initialize();

      _digitalData.events.push({
        name: 'Clicked Product',
        category: 'Ecommerce',
        product: {
          id: '123',
          name: 'Test Product'
        }
      });

      _ddListener.push(['on', 'event', function (e) {
        _assert2['default'].ok(true);
        done();
      }]);
    });
  });

  describe(': listening for digitalData changes', function () {

    beforeEach(function () {
      _digitalData = {
        user: {
          returning: false
        },
        listing: {
          items: [{ id: 1 }, { id: 2 }]
        },
        test: 'test'
      };
      _ddListener = [];
      _eventManager = new _EventManager2['default'](_digitalData, _ddListener);
      _eventManager.initialize();
    });

    it('should fire change callback', function (done) {
      _ddListener.push(['on', 'change', function () {
        done();
      }]);
      _digitalData.test2 = 'test2';
    });

    it('should fire change key callback', function (done) {
      _ddListener.push(['on', 'change:user.returning', function (newValue, previousValue) {
        _assert2['default'].ok(newValue === true);
        _assert2['default'].ok(previousValue === false);
        done();
      }]);
      _digitalData.user.returning = true;
    });

    it('should fire change callback for array', function (done) {
      _ddListener.push(['on', 'change:listing.items', function (newValue, previousValue) {
        _assert2['default'].ok(newValue.length === 3);
        _assert2['default'].ok(previousValue.length === 2);
        done();
      }]);
      _digitalData.listing.items.push({ id: 3 });
    });

    it('should fire length change callback for array', function (done) {
      _ddListener.push(['on', 'change:listing.items.length', function (newValue, previousValue) {
        _assert2['default'].ok(newValue === 3);
        _assert2['default'].ok(previousValue === 2);
        done();
      }]);
      _digitalData.listing.items.push({ id: 3 });
    });

    it('should fire change callbacks asynchronously, ignoring possible exceptions', function (done) {
      _ddListener.push(['on', 'change', function (newValue, previousValue) {
        throw new Error('test error');
      }]);
      _ddListener.push(['on', 'change', function (newValue, previousValue) {
        done();
      }]);
      _digitalData.test2 = 'test2';
    });

    it('should handle change callback exception', function (done) {
      _ddListener.push(['on', 'change', function (newValue, previousValue) {
        throw new Error('test error');
      }]);
      _digitalData.test2 = 'test2';
      setTimeout(done, 1000);
    });

    it('should NOT fire change callback', function (done) {
      _ddListener.push(['on', 'change', function () {
        _assert2['default'].ok(false);
        done();
      }]);
      setTimeout(function () {
        _assert2['default'].ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.test = 'test';
    });

    it('should NOT fire change key callback', function (done) {
      _ddListener.push(['on', 'change:user.returning', function () {
        _assert2['default'].ok(false);
        done();
      }]);
      setTimeout(function () {
        _assert2['default'].ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.user.returning = false;
    });

    it('should NOT fire change callback for array', function (done) {
      _ddListener.push(['on', 'change:listing.items', function () {
        _assert2['default'].ok(false);
        done();
      }]);
      setTimeout(function () {
        _assert2['default'].ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.listing.items.pop();
      _digitalData.listing.items.push({ id: 2 });
    });

    it('should NOT fire length change callback for array', function (done) {
      _ddListener.push(['on', 'change:listing.items.length', function () {
        _assert2['default'].ok(false);
        done();
      }]);
      setTimeout(function () {
        _assert2['default'].ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.listing.items.pop();
      _digitalData.listing.items.push({ id: 3 });
    });

    it('should NOT fire change callback if event was added', function (done) {
      _ddListener.push(['on', 'change', function () {
        _assert2['default'].ok(false);
        done();
      }]);
      setTimeout(function () {
        _assert2['default'].ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.events.push({
        name: 'Test Event'
      });
    });
  });

  describe(': listening for digitalData define events', function () {

    beforeEach(function () {
      _digitalData = {
        user: {
          returning: false
        },
        listing: {
          items: [{ id: 1 }, { id: 2 }]
        },
        test: 'test'
      };
      _ddListener = [];
      _eventManager = new _EventManager2['default'](_digitalData, _ddListener);
      _eventManager.initialize();
    });

    it('should fire define callback', function (done) {
      _ddListener.push(['on', 'define', function () {
        done();
      }]);
    });

    it('should fire define key callback', function (done) {
      _ddListener.push(['on', 'define:user.test', function (value) {
        _assert2['default'].ok(value === true);
        done();
      }]);
      _digitalData.user.test = true;
    });

    it('should fire define key callback', function (done) {
      _digitalData.user.test = true;
      var ddListener = _ddListener || [];
      ddListener.push(['on', 'define:user.test', function (value) {
        _assert2['default'].ok(value === true);
        done();
      }]);
    });

    it('should fire define callback for array', function (done) {
      _ddListener.push(['on', 'define:listing.items', function (value) {
        _assert2['default'].ok(value.length === 3);
        done();
      }]);
      _digitalData.listing.items.push({ id: 3 });
    });

    it('should fire length define callback for array', function (done) {
      _ddListener.push(['on', 'define:listing.items.length', function (value) {
        _assert2['default'].ok(value === 3);
        done();
      }]);
      _digitalData.listing.items.push({ id: 3 });
    });

    it('should fire define callbacks asynchronously, ignoring possible exceptions', function (done) {
      _ddListener.push(['on', 'define', function (value) {
        throw new Error('test error');
      }]);
      _ddListener.push(['on', 'define', function (value) {
        done();
      }]);
      _digitalData.test2 = 'test2';
    });

    it('should handle define callback exception', function (done) {
      _ddListener.push(['on', 'define', function (value) {
        throw new Error('test error');
      }]);
      _digitalData.test2 = 'test2';
      setTimeout(done, 1000);
    });

    it('should fire define callback only once', function (done) {
      _ddListener.push(['on', 'define', function () {
        _assert2['default'].ok(true);
        done();
      }]);
      _ddListener.push(['on', 'define', function () {
        _assert2['default'].ok(false);
        done();
      }]);
      setTimeout(function () {
        _assert2['default'].ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.test = 'test';
    });

    it('should fire define key callback only once', function (done) {
      _ddListener.push(['on', 'define:user.returning', function () {
        _assert2['default'].ok(true);
        done();
      }]);
      _ddListener.push(['on', 'define:user.returning', function () {
        _assert2['default'].ok(false);
        done();
      }]);
      setTimeout(function () {
        _assert2['default'].ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.user.returning = false;
    });

    it('should fire define callback for array only once', function (done) {
      _ddListener.push(['on', 'define:listing.items', function () {
        _assert2['default'].ok(true);
        done();
      }]);
      _ddListener.push(['on', 'define:listing.items', function () {
        _assert2['default'].ok(false);
        done();
      }]);
      setTimeout(function () {
        _assert2['default'].ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.listing.items.pop();
      _digitalData.listing.items.push({ id: 2 });
    });

    it('should fire length define callback for array only once', function (done) {
      _ddListener.push(['on', 'define:listing.items.length', function () {
        _assert2['default'].ok(true);
        done();
      }]);
      _ddListener.push(['on', 'define:listing.items.length', function () {
        _assert2['default'].ok(false);
        done();
      }]);
      setTimeout(function () {
        _assert2['default'].ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.listing.items.pop();
      _digitalData.listing.items.push({ id: 3 });
    });

    it('should fire define callback event if key was already defined', function (done) {
      _ddListener.push(['on', 'define:user.returning', function () {
        _assert2['default'].ok(true);
        done();
      }]);
    });
  });

  describe(': listening for autoEvents based on DDL changes', function () {

    beforeEach(function () {
      _digitalData = {
        page: {
          type: 'home'
        }
      };
      _ddListener = [];
      _eventManager = new _EventManager2['default'](_digitalData, _ddListener);
      _eventManager.setAutoEvents(new _AutoEvents2['default']());
      _eventManager.initialize();
    });

    it('should fire Viewed Page event', function (done) {
      _digitalData.page = {
        type: 'content'
      };
      setTimeout(function () {
        _assert2['default'].ok(_digitalData.events.length === 2);
        _assert2['default'].ok(_digitalData.events[1].name === 'Viewed Page');
        _assert2['default'].ok(_digitalData.events[1].page.type === 'content');
        done();
      }, 101);
    });

    it('should fire Viewed Page and Viewed Product Category events', function (done) {
      _digitalData.page = {
        type: 'category'
      };
      _digitalData.listing = {
        categoryId: '123'
      };
      setTimeout(function () {
        _assert2['default'].ok(_digitalData.events.length === 3);
        _assert2['default'].ok(_digitalData.events[1].name === 'Viewed Page');
        _assert2['default'].ok(_digitalData.events[1].page.type === 'category');
        _assert2['default'].ok(_digitalData.events[2].name === 'Viewed Product Category');
        _assert2['default'].ok(_digitalData.events[2].listing.categoryId === '123');
        done();
      }, 101);
    });

    it('should fire Viewed Product Detail event', function (done) {
      _digitalData.product = {
        id: '123',
        name: 'Test Product'
      };
      setTimeout(function () {
        _assert2['default'].ok(_digitalData.events.length === 2);
        _assert2['default'].ok(_digitalData.events[1].name === 'Viewed Product Detail');
        _assert2['default'].ok(_digitalData.events[1].product.id === '123');
        done();
      }, 101);
    });

    it('should fire Completed Transaction event', function (done) {
      _digitalData.transaction = {
        orderId: '123'
      };
      setTimeout(function () {
        _assert2['default'].ok(_digitalData.events.length === 2);
        _assert2['default'].ok(_digitalData.events[1].name === 'Completed Transaction');
        _assert2['default'].ok(_digitalData.events[1].transaction.orderId === '123');
        done();
      }, 101);
    });
  });
});

},{"./../src/AutoEvents.js":91,"./../src/EventManager.js":96,"./reset.js":152,"assert":1}],136:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _reset = require('./reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _snippet = require('./snippet.js');

var _snippet2 = _interopRequireDefault(_snippet);

var _ddManager = require('../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

var _Integration = require('../src/Integration.js');

var _Integration2 = _interopRequireDefault(_Integration);

var _availableIntegrations = require('../src/availableIntegrations.js');

var _availableIntegrations2 = _interopRequireDefault(_availableIntegrations);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('DDManager', function () {

  afterEach(function () {
    _ddManager2['default'].reset();
    (0, _reset2['default'])();
  });

  describe('#initialize', function () {
    it('should initialize Array objects for window.digitalData.events and window.ddListener', function () {
      _ddManager2['default'].initialize();
      _assert2['default'].ok(Array.isArray(window.digitalData.events));
      _assert2['default'].ok(Array.isArray(window.ddListener));
    });

    it('should initialize website, page, user and cart objects', function () {
      _ddManager2['default'].initialize();
      _assert2['default'].ok(window.digitalData.website);
      _assert2['default'].ok(window.digitalData.page);
      _assert2['default'].ok(window.digitalData.user);
      _assert2['default'].ok(window.digitalData.cart); // if page !== 'confirmation'
    });

    it('should work well with async load using stubs from the snippet', function () {
      (0, _snippet2['default'])();
      window.ddManager.initialize();
      _ddManager2['default'].processEarlyStubCalls();

      _assert2['default'].ok(_ddManager2['default'].isReady());
      _assert2['default'].ok(Array.isArray(window.digitalData.events));
      _assert2['default'].ok(Array.isArray(window.ddListener));
    });

    it('should initialize after all other stubs', function (done) {
      (0, _snippet2['default'])();
      window.ddManager.initialize();
      window.ddManager.on('ready', function () {
        done();
      });
      _ddManager2['default'].processEarlyStubCalls();
    });

    it('should initialize DDManager instance', function () {
      _ddManager2['default'].initialize();
      _assert2['default'].ok(_ddManager2['default'].isReady());
    });

    it('should add integration if old-style object settings', function () {
      _ddManager2['default'].setAvailableIntegrations(_availableIntegrations2['default']);
      _ddManager2['default'].initialize({
        integrations: {
          'Google Tag Manager': {
            componentId: 'XXX'
          }
        }
      });

      _assert2['default'].ok(_ddManager2['default'].getIntegration('Google Tag Manager') instanceof _Integration2['default']);
    });

    it('should add integration if old-style object settings without options', function () {
      _ddManager2['default'].setAvailableIntegrations(_availableIntegrations2['default']);
      _ddManager2['default'].initialize({
        integrations: {
          'Google Tag Manager': true
        }
      });

      _assert2['default'].ok(_ddManager2['default'].getIntegration('Google Tag Manager') instanceof _Integration2['default']);
    });

    it('should add integration if new array settings', function () {
      _ddManager2['default'].setAvailableIntegrations(_availableIntegrations2['default']);
      _ddManager2['default'].initialize({
        integrations: [{
          'name': 'Google Tag Manager',
          'options': {
            'componentId': 'XXX'
          }
        }]
      });

      _assert2['default'].ok(_ddManager2['default'].getIntegration('Google Tag Manager') instanceof _Integration2['default']);
    });

    it('should add integration if new array settings without options', function () {
      _ddManager2['default'].setAvailableIntegrations(_availableIntegrations2['default']);
      _ddManager2['default'].initialize({
        integrations: [{
          'name': 'Google Tag Manager'
        }]
      });

      _assert2['default'].ok(_ddManager2['default'].getIntegration('Google Tag Manager') instanceof _Integration2['default']);
    });

    it('it should fire on("ready") event even if ddManager was ready before', function (done) {
      _ddManager2['default'].initialize();
      if (_ddManager2['default'].isReady()) {
        _ddManager2['default'].on('ready', function () {
          done();
        });
      } else {
        _assert2['default'].ok(false);
      }
    });

    it('it should fire once("ready") event even if ddManager was ready before', function (done) {
      _ddManager2['default'].initialize();
      if (_ddManager2['default'].isReady()) {
        _ddManager2['default'].once('ready', function () {
          done();
        });
      } else {
        _assert2['default'].ok(false);
      }
    });

    it('it should fire on("initialize") event even if ddManager was initialized before', function (done) {
      _ddManager2['default'].initialize();
      if (_ddManager2['default'].isReady()) {
        _ddManager2['default'].on('ready', function () {
          done();
        });
      } else {
        _assert2['default'].ok(false);
      }
    });

    it('it should fire once("initialize") event even if ddManager was initialized before', function (done) {
      _ddManager2['default'].initialize();
      if (_ddManager2['default'].isReady()) {
        _ddManager2['default'].once('ready', function () {
          done();
        });
      } else {
        _assert2['default'].ok(false);
      }
    });

    it('it should fire fire "Viewed Page" event if autoEvents == true', function (done) {
      _ddManager2['default'].initialize();
      if (_ddManager2['default'].isReady()) {
        _ddManager2['default'].once('ready', function () {
          _assert2['default'].ok(window.digitalData.events[0].name === 'Viewed Page');
          _assert2['default'].ok(window.digitalData.events.length === 1);
          done();
        });
      } else {
        _assert2['default'].ok(false);
      }
    });

    it('it should fire fire "Viewed Page" event if autoEvents == true', function (done) {
      _ddManager2['default'].initialize({
        autoEvents: false
      });
      if (_ddManager2['default'].isReady()) {
        _ddManager2['default'].once('ready', function () {
          _assert2['default'].ok(window.digitalData.events.length === 0);
          done();
        });
      } else {
        _assert2['default'].ok(false);
      }
    });

    it('it should enrich digital data', function (done) {
      _ddManager2['default'].initialize();
      if (_ddManager2['default'].isReady()) {
        _ddManager2['default'].once('ready', function () {
          _assert2['default'].ok(window.digitalData.context.userAgent);
          done();
        });
      } else {
        _assert2['default'].ok(false);
      }
    });

    it('it should send Viewed Page event once', function (done) {
      _ddManager2['default'].on('ready', function () {
        setTimeout(function () {
          _assert2['default'].equal(window.digitalData.events.length, 2);
          done();
        }, 1000);
      });
      window.digitalData = {
        page: {
          type: 'product'
        },
        product: {
          id: '123'
        }
      };
      _ddManager2['default'].setAvailableIntegrations(_availableIntegrations2['default']);
      _ddManager2['default'].initialize({
        autoEvents: true,
        integrations: {
          'Google Tag Manager': true,
          'SegmentStream': true
        }
      });
    });
  });
});

},{"../src/Integration.js":97,"../src/availableIntegrations.js":99,"../src/ddManager.js":100,"./reset.js":152,"./snippet.js":153,"assert":1}],137:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = argumentsToArray;
function argumentsToArray(args) {
  if (args && args[1] === undefined) {
    return undefined;
  }
  return Array.prototype.slice.call(args);
}

},{}],138:[function(require,module,exports){
'use strict';

require('./../src/polyfill.js');

require('./ddManagerSpec.js');

require('./AutoEventsSpec.js');

require('./DDHelperSpec.js');

require('./EventManagerSpec.js');

require('./EventDataEnricherSpec.js');

require('./DigitalDataEnricherSpec.js');

require('./integrations/GoogleAnalyticsSpec.js');

require('./integrations/GoogleTagManagerSpec.js');

require('./integrations/DrivebackSpec.js');

require('./integrations/RetailRocketSpec.js');

require('./integrations/FacebookPixelSpec.js');

require('./integrations/SegmentStreamSpec.js');

require('./integrations/SendPulseSpec.js');

require('./integrations/OWOXBIStreamingSpec.js');

require('./integrations/CriteoSpec.js');

require('./integrations/MyTargetSpec.js');

require('./integrations/YandexMetricaSpec.js');

require('./integrations/VkontakteSpec.js');

require('./integrations/EmarsysSpec.js');

},{"./../src/polyfill.js":130,"./AutoEventsSpec.js":131,"./DDHelperSpec.js":132,"./DigitalDataEnricherSpec.js":133,"./EventDataEnricherSpec.js":134,"./EventManagerSpec.js":135,"./ddManagerSpec.js":136,"./integrations/CriteoSpec.js":139,"./integrations/DrivebackSpec.js":140,"./integrations/EmarsysSpec.js":141,"./integrations/FacebookPixelSpec.js":142,"./integrations/GoogleAnalyticsSpec.js":143,"./integrations/GoogleTagManagerSpec.js":144,"./integrations/MyTargetSpec.js":145,"./integrations/OWOXBIStreamingSpec.js":146,"./integrations/RetailRocketSpec.js":147,"./integrations/SegmentStreamSpec.js":148,"./integrations/SendPulseSpec.js":149,"./integrations/VkontakteSpec.js":150,"./integrations/YandexMetricaSpec.js":151}],139:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _Criteo = require('./../../src/integrations/Criteo.js');

var _Criteo2 = _interopRequireDefault(_Criteo);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('Integrations: Criteo', function () {
  var criteo = void 0;
  var options = {
    account: '123'
  };

  beforeEach(function () {
    window.digitalData = {
      website: {},
      page: {},
      user: {},
      events: []
    };
    criteo = new _Criteo2['default'](window.digitalData, options);
    _ddManager2['default'].addIntegration('Criteo', criteo);
  });

  afterEach(function () {
    criteo.reset();
    _ddManager2['default'].reset();
    (0, _reset2['default'])();
  });

  describe('before loading', function () {
    beforeEach(function () {
      _sinon2['default'].stub(criteo, 'load');
    });

    afterEach(function () {
      criteo.load.restore();
    });

    describe('#constructor', function () {
      it('should add proper tags and options', function () {
        _assert2['default'].equal(options.account, criteo.getOption('account'));
        _assert2['default'].equal(undefined, criteo.getOption('deduplication'));
        _assert2['default'].equal('script', criteo.getTag().type);
        _assert2['default'].equal(criteo.getTag().attr.src, '//static.criteo.net/js/ld/ld.js');
      });
    });

    describe('#initialize', function () {
      it('should initialize criteo queue object', function () {
        _ddManager2['default'].initialize();
        _assert2['default'].ok(window.criteo_q);
        _assert2['default'].ok(window.criteo_q.push);
      });

      it('should call tags load after initialization', function () {
        _ddManager2['default'].initialize();
        _assert2['default'].ok(criteo.load.calledOnce);
      });

      it('should define account id', function () {
        _ddManager2['default'].initialize();
        _assert2['default'].deepEqual(window.criteo_q[0], { event: 'setAccount', account: options.account });
      });

      it('should define "d" site type if other option is not specified', function () {
        _ddManager2['default'].initialize();
        _assert2['default'].deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "d" });
      });

      it('should define "d" site type if digitalData.website.type is not one of: "desktop", "tablet" or "mobile"', function () {
        window.digitalData.website.type = "test";
        _ddManager2['default'].initialize();
        _assert2['default'].deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "d" });
      });

      it('should define "d" site type if digitalData.website.type is "desktop"', function () {
        window.digitalData.website.type = "desktop";
        _ddManager2['default'].initialize();
        _assert2['default'].deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "d" });
      });

      it('should define "t" site type if digitalData.website.type is "tablet"', function () {
        window.digitalData.website.type = "tablet";
        _ddManager2['default'].initialize();
        _assert2['default'].deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "t" });
      });

      it('should define "m" site type if digitalData.website.type is "mobile"', function () {
        window.digitalData.website.type = "mobile";
        _ddManager2['default'].initialize();
        _assert2['default'].deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "m" });
      });

      it('should set email if digitalData.user.email is defined', function () {
        window.digitalData.user.email = 'test@driveback.ru';
        _ddManager2['default'].initialize();
        _assert2['default'].deepEqual(window.criteo_q[2], { event: 'setEmail', email: window.digitalData.user.email });
      });
    });

    describe('#initialize version <1.1.0', function () {
      it('should define "d" site type if digitalData.page.siteType is not one of: "desktop", "tablet" or "mobile"', function () {
        window.digitalData.version = '1.0.11';
        window.digitalData.page.siteType = "test";
        _ddManager2['default'].initialize();
        _assert2['default'].deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "d" });
      });

      it('should define "d" site type if digitalData.page.siteType is "desktop"', function () {
        window.digitalData.version = '1.0.11';
        window.digitalData.page.siteType = "desktop";
        _ddManager2['default'].initialize();
        _assert2['default'].deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "d" });
      });

      it('should define "t" site type if digitalData.page.siteType is "tablet"', function () {
        window.digitalData.version = '1.0.11';
        window.digitalData.page.siteType = "tablet";
        _ddManager2['default'].initialize();
        _assert2['default'].deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "t" });
      });

      it('should define "m" site type if digitalData.page.siteType is "mobile"', function () {
        window.digitalData.version = '1.0.11';
        window.digitalData.page.siteType = "mobile";
        _ddManager2['default'].initialize();
        _assert2['default'].deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "m" });
      });
    });
  });

  describe('loading', function () {
    beforeEach(function () {
      _sinon2['default'].stub(criteo, 'load', function () {
        window.criteo_q = {
          push: function push() {}
        };
        criteo.onLoad();
      });
    });

    afterEach(function () {
      criteo.load.restore();
    });

    it('should load', function (done) {
      _assert2['default'].ok(!criteo.isLoaded());
      _ddManager2['default'].once('load', function () {
        _assert2['default'].ok(criteo.isLoaded());
        done();
      });
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });
  });

  describe('after loading', function () {
    beforeEach(function (done) {
      _sinon2['default'].stub(criteo, 'load', function () {
        setTimeout(criteo.onLoad, 0);
      });
      _ddManager2['default'].once('ready', function () {
        done();
      });
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });

    afterEach(function () {
      criteo.load.restore();
    });

    it('should set email if digitalData.user.email is changed at any time', function (done) {
      _assert2['default'].ok(!window.criteo_q[2]);
      window.digitalData.user.email = 'test@driveback.ru';
      setTimeout(function () {
        _assert2['default'].deepEqual(window.criteo_q[2], { event: 'setEmail', email: window.digitalData.user.email });
        done();
      }, 111);
    });

    describe('#onViewedHome', function () {
      it('should send viewHome event if user visits home page', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'home'
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], { event: 'viewHome' });
            done();
          }
        });
      });

      it('should not send viewHome event if user visits other pages', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'product'
          },
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send viewHome event if noConflict setting is true', function (done) {
        criteo.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'home'
          },
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });
    });

    describe('#onViewedProductCategory', function () {
      it('should send viewList event if user visits listing page with more than 3 items', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          listing: {
            items: [{
              id: '123'
            }, {
              id: '234'
            }, {
              id: '345'
            }, {
              id: '456'
            }]
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], { event: 'viewList', item: ['123', '234', '345'] });
            done();
          }
        });
      });

      it('should send viewList event if user visits listing page with less than 3 items', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          listing: {
            items: [{
              id: '123'
            }, {
              id: '234'
            }]
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], { event: 'viewList', item: ['123', '234'] });
            done();
          }
        });
      });

      it('should not send viewList event if digitalData.listing obejct is not defined', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send viewList event if noConflict setting is true', function (done) {
        criteo.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          listing: {
            items: [{
              id: '123'
            }]
          },
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });
    });

    describe('#onSearched', function () {
      it('should send viewList event if user visits listing page with more than 3 items', function (done) {
        window.digitalData.events.push({
          name: 'Searched',
          category: 'Content',
          listing: {
            items: [{
              id: '123'
            }, {
              id: '234'
            }, {
              id: '345'
            }, {
              id: '456'
            }]
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], { event: 'viewList', item: ['123', '234', '345'] });
            done();
          }
        });
      });

      it('should send viewList event if user visits listing page with less than 3 items', function (done) {
        window.digitalData.events.push({
          name: 'Searched',
          category: 'Ecommerce',
          listing: {
            items: [{
              id: '123'
            }, {
              id: '234'
            }]
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], { event: 'viewList', item: ['123', '234'] });
            done();
          }
        });
      });

      it('should not send viewList event if digitalData.listing obejct is not defined', function (done) {
        window.digitalData.events.push({
          name: 'Searched',
          category: 'Ecommerce',
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send viewList event if noConflict setting is true', function (done) {
        criteo.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Searched',
          category: 'Ecommerce',
          listing: {
            items: [{
              id: '123'
            }]
          },
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });
    });

    describe('#onViewedProductDetail', function () {
      it('should send viewItem event if user visits product detail page', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], { event: 'viewItem', item: '123' });
            done();
          }
        });
      });

      it('should not send viewItem event if product ID is not defined', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send viewItem event if noConflict option is true', function (done) {
        criteo.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });
    });

    describe('#onViewedCart', function () {
      it('should send viewBasket event if user visits cart page', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          category: 'Ecommerce',
          cart: {
            lineItems: [{
              product: {
                id: '123',
                unitSalePrice: 100
              },
              quantity: 1
            }, {
              product: {
                id: '234',
                unitPrice: 100,
                unitSalePrice: 50
              },
              quantity: 2
            }, {
              product: {
                id: '345',
                unitPrice: 30
              }
            }, {
              product: {
                id: '456'
              }
            }, {
              product: {}
            }]
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], { event: 'viewBasket', item: [{ id: '123', price: 100, quantity: 1 }, { id: '234', price: 50, quantity: 2 }, { id: '345', price: 30, quantity: 1 }, { id: '456', price: 0, quantity: 1 }] });
            done();
          }
        });
      });

      it('should not send viewBasket event if cart object is not defined', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          category: 'Ecommerce',
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send viewBasket event if cart is empty', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          category: 'Ecommerce',
          cart: {
            lineItems: []
          },
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send viewBasket event if noConflict option is true', function (done) {
        criteo.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Cart',
          category: 'Ecommerce',
          cart: {
            lineItems: [{
              product: {
                id: '123',
                unitSalePrice: 100
              },
              quantity: 1
            }]
          },
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });
    });

    describe('#onCompletedTransaction', function () {
      var lineItems = [{
        product: {
          id: '123',
          unitSalePrice: 100
        },
        quantity: 1
      }, {
        product: {
          id: '234',
          unitPrice: 100,
          unitSalePrice: 50
        },
        quantity: 2
      }, {
        product: {
          id: '345',
          unitPrice: 30
        }
      }, {
        product: {
          id: '456'
        }
      }, {
        product: {}
      }];

      it('should send trackTransaction event if transaction is completed (new_customer = 1)', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            isFirst: true,
            lineItems: lineItems
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], {
              event: 'trackTransaction',
              id: '123',
              new_customer: 1,
              deduplication: 0,
              item: [{ id: '123', price: 100, quantity: 1 }, { id: '234', price: 50, quantity: 2 }, { id: '345', price: 30, quantity: 1 }, { id: '456', price: 0, quantity: 1 }]
            });
            done();
          }
        });
      });

      it('should send trackTransaction event if transaction is completed (new_customer = 0)', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            isFirst: false,
            lineItems: lineItems
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], {
              event: 'trackTransaction',
              id: '123',
              new_customer: 0,
              deduplication: 0,
              item: [{ id: '123', price: 100, quantity: 1 }, { id: '234', price: 50, quantity: 2 }, { id: '345', price: 30, quantity: 1 }, { id: '456', price: 0, quantity: 1 }]
            });
            done();
          }
        });
      });

      it('should send trackTransaction event if transaction is completed (deduplication = 1)', function (done) {
        criteo.setOption('deduplication', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], {
              event: 'trackTransaction',
              id: '123',
              new_customer: 0,
              deduplication: 1,
              item: [{ id: '123', price: 100, quantity: 1 }, { id: '234', price: 50, quantity: 2 }, { id: '345', price: 30, quantity: 1 }, { id: '456', price: 0, quantity: 1 }]
            });
            done();
          }
        });
      });

      it('should send trackTransaction event if transaction is completed (deduplication = 1)', function (done) {
        window.digitalData.context = {
          campaign: {
            source: 'CriTeO'
          }
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], {
              event: 'trackTransaction',
              id: '123',
              new_customer: 0,
              deduplication: 1,
              item: [{ id: '123', price: 100, quantity: 1 }, { id: '234', price: 50, quantity: 2 }, { id: '345', price: 30, quantity: 1 }, { id: '456', price: 0, quantity: 1 }]
            });
            done();
          }
        });
      });

      it('should send trackTransaction event if transaction is completed (deduplication = 0)', function (done) {
        criteo.setOption('deduplication', false);
        window.digitalData.context = {
          campaign: {
            name: 'CriTeO'
          }
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], {
              event: 'trackTransaction',
              id: '123',
              new_customer: 0,
              deduplication: 0,
              item: [{ id: '123', price: 100, quantity: 1 }, { id: '234', price: 50, quantity: 2 }, { id: '345', price: 30, quantity: 1 }, { id: '456', price: 0, quantity: 1 }]
            });
            done();
          }
        });
      });

      it('should not send trackTransaction event if transaction object is not defined', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send trackTransaction event if transaction object has no LineItems', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            lineItems: []
          },
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send trackTransaction event if noConflict option is true', function (done) {
        criteo.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: function callback() {
            _assert2['default'].ok(!window.criteo_q[2]);
            done();
          }
        });
      });
    });

    describe('#onSubscribed', function () {
      it('should set email if user email was acquired', function (done) {
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], { event: 'setEmail', email: 'test@driveback.ru' });
            done();
          }
        });
      });

      it('should set email if user email was acquired and noConflict option is true', function (done) {
        criteo.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.criteo_q[2], { event: 'setEmail', email: 'test@driveback.ru' });
            done();
          }
        });
      });
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/integrations/Criteo.js":117,"./../reset.js":152,"assert":1,"sinon":64}],140:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _Driveback = require('./../../src/integrations/Driveback.js');

var _Driveback2 = _interopRequireDefault(_Driveback);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('Integrations: Driveback', function () {
  var driveback = void 0;
  var options = {
    websiteToken: 'aba543e1-1413-5f77-a8c7-aaf6979208a3'
  };

  beforeEach(function () {
    driveback = new _Driveback2['default'](window.digitalData, options);
    _ddManager2['default'].addIntegration('Driveback', driveback);
  });

  afterEach(function () {
    driveback.reset();
    _ddManager2['default'].reset();
    (0, _reset2['default'])();
  });

  describe('#constructor', function () {

    it('should create Driveback integrations with proper options and tags', function () {
      _assert2['default'].equal(options.websiteToken, driveback.getOption('websiteToken'));
      _assert2['default'].equal('script', driveback.getTag().type);
      _assert2['default'].ok(driveback.getTag().attr.src.indexOf('driveback.ru') > 0);
    });
  });

  describe('#load', function () {

    it('should load', function (done) {
      _assert2['default'].ok(!driveback.isLoaded());
      _ddManager2['default'].once('load', function () {
        _assert2['default'].ok(driveback.isLoaded());
        done();
      });
      _ddManager2['default'].initialize();
    });

    it('should not load if Driveback is already loaded', function (done) {
      var originalIsLoaded = driveback.isLoaded;
      driveback.isLoaded = function () {
        return true;
      };
      _assert2['default'].ok(driveback.isLoaded());
      _ddManager2['default'].once('ready', function () {
        _assert2['default'].ok(!originalIsLoaded());
        done();
      });
      _ddManager2['default'].initialize();
    });
  });

  describe('after loading', function () {
    beforeEach(function (done) {
      _ddManager2['default'].once('load', done);
      _ddManager2['default'].initialize();
    });

    it('should initialize all global variables', function () {
      _assert2['default'].ok(window.DrivebackNamespace);
      _assert2['default'].ok(window.DriveBack);
      _assert2['default'].ok(window.Driveback);
      _assert2['default'].ok(Array.isArray(DrivebackOnLoad));
      _assert2['default'].ok(typeof window.DrivebackLoaderAsyncInit === 'function');
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/integrations/Driveback.js":118,"./../reset.js":152,"assert":1}],141:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _reset = require('./../reset');

var _reset2 = _interopRequireDefault(_reset);

var _Emarsys = require('./../../src/integrations/Emarsys');

var _Emarsys2 = _interopRequireDefault(_Emarsys);

var _ddManager = require('./../../src/ddManager');

var _ddManager2 = _interopRequireDefault(_ddManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function viewedPage(callback) {
  var page = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  window.digitalData.events.push({
    name: 'Viewed Page',
    category: 'Content',
    page: page,
    callback: callback
  });
}

function viewedPageOfType(type, callback) {
  viewedPage(callback, { type: type });
}

function viewedProductCategory(category, callback) {
  window.digitalData.events.push({
    name: 'Viewed Product Category',
    category: 'Ecommerce',
    listing: { category: category },
    callback: callback
  });
}

function searched(query, callback) {
  window.digitalData.events.push({
    name: 'Searched',
    category: 'Content',
    listing: { query: query },
    callback: callback
  });
}

function viewedProductDetail(productId, callback) {
  window.digitalData.events.push({
    name: 'Viewed Product Detail',
    category: 'Ecommerce',
    product: {
      id: productId
    },
    callback: callback
  });
}

function completedTransaction(transaction, callback) {
  window.digitalData.events.push({
    name: 'Completed Transaction',
    category: 'Ecommerce',
    transaction: transaction,
    callback: callback
  });
}

describe('Integrations: Emarsys', function () {

  var emarsys = void 0;
  var options = {
    merchantId: '123'
  };

  beforeEach(function () {
    window.digitalData = {
      website: {},
      page: {},
      user: {},
      events: []
    };
    emarsys = new _Emarsys2['default'](window.digitalData, options);
    _ddManager2['default'].addIntegration('Emarsys', emarsys);
  });

  afterEach(function () {
    emarsys.reset();
    _ddManager2['default'].reset();
    (0, _reset2['default'])();
  });

  describe('before loading', function () {
    beforeEach(function () {
      _sinon2['default'].stub(emarsys, 'load');
    });

    afterEach(function () {
      emarsys.load.restore();
    });

    describe('#constructor', function () {
      it('should add proper tags and options', function () {
        _assert2['default'].equal(options.merchantId, emarsys.getOption('merchantId'));
        _assert2['default'].equal('script', emarsys.getTag().type);
        _assert2['default'].equal(emarsys.getTag().attr.src, '//recommender.scarabresearch.com/js/' + options.merchantId + '/scarab-v2.js');
      });
    });

    describe('#initialize', function () {
      it('should initialize emarsys queue object', function () {
        _ddManager2['default'].initialize();
        _assert2['default'].ok(window.ScarabQueue);
        _assert2['default'].ok(window.ScarabQueue.push);
      });

      it('should call tags load after initialization', function () {
        _ddManager2['default'].initialize();
        _assert2['default'].ok(emarsys.load.calledOnce);
      });
    });
  });

  describe('loading', function () {
    beforeEach(function () {
      _sinon2['default'].stub(emarsys, 'load', function () {
        window.ScarabQueue = {
          push: function push() {}
        };
        emarsys.onLoad();
      });
    });

    afterEach(function () {
      emarsys.load.restore();
    });

    it('should load', function (done) {
      _assert2['default'].ok(!emarsys.isLoaded());
      _ddManager2['default'].once('load', function () {
        _assert2['default'].ok(emarsys.isLoaded());
        done();
      });
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });
  });

  describe('after loading', function () {
    beforeEach(function (done) {
      _sinon2['default'].stub(emarsys, 'load', function () {
        _sinon2['default'].spy(window.ScarabQueue, 'push');
        emarsys.onLoad();
      });
      _ddManager2['default'].once('ready', done);
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });

    afterEach(function () {
      emarsys.load.restore();
      window.ScarabQueue.push.restore();
    });

    describe('#onViewedPage', function () {
      it('should send email if user.email is defined', function (done) {
        window.digitalData.user = {
          email: 'test@driveback.ru'
        };
        viewedPage(function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['setEmail', 'test@driveback.ru']));
          done();
        });
      });

      it('should not send email if user.email is not defined', function (done) {
        viewedPage(function () {
          _assert2['default'].ok(!window.ScarabQueue.push.calledWith(['setEmail', _sinon2['default'].match.any]));
          done();
        });
      });

      it('should send customerId if user.userId is defined', function (done) {
        window.digitalData.user = {
          userId: '123'
        };
        viewedPage(function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['setCustomerId', '123']));
          done();
        });
      });

      it('should not send customerId if user.email is defined', function (done) {
        window.digitalData.user = {
          userId: '123',
          email: 'test@driveback.ru'
        };
        viewedPage(function () {
          _assert2['default'].ok(!window.ScarabQueue.push.calledWith(['setCustomerId', _sinon2['default'].match.any]));
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['setEmail', 'test@driveback.ru']));
          done();
        });
      });

      it('should always send cart even if cart is empty', function (done) {
        viewedPage(function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['cart', []]));
          done();
        });
      });

      it('should send cart info', function (done) {
        window.digitalData.cart = {
          lineItems: [{
            product: {
              id: '123',
              unitSalePrice: 100
            },
            quantity: 2,
            subtotal: 180
          }, {
            product: {
              id: '234',
              unitSalePrice: 100
            },
            quantity: 2
          }]
        };
        viewedPage(function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['cart', [{
            item: '123',
            price: 180,
            quantity: 2
          }, {
            item: '234',
            price: 200,
            quantity: 2
          }]]));
          done();
        });
      });

      it('should not send "go" for page.type = product', function (done) {
        viewedPageOfType('product', function () {
          _assert2['default'].ok(!window.ScarabQueue.push.calledWith(['go']));
          done();
        });
      });

      it('should not send "go" for page.type = category', function (done) {
        viewedPageOfType('category', function () {
          _assert2['default'].ok(!window.ScarabQueue.push.calledWith(['go']));
          done();
        });
      });

      it('should not send "go" for page.type = search', function (done) {
        viewedPageOfType('search', function () {
          _assert2['default'].ok(!window.ScarabQueue.push.calledWith(['go']));
          done();
        });
      });

      it('should not send "go" for page.type = confirmation', function (done) {
        viewedPageOfType('confirmation', function () {
          _assert2['default'].ok(!window.ScarabQueue.push.calledWith(['go']));
          done();
        });
      });

      it('should send "go" for any other page', function (done) {
        viewedPageOfType('home', function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['go']));
          done();
        });
      });
    });

    describe('#onViewedProductCategory', function () {
      it('should send category with default separator', function (done) {
        viewedProductCategory(['Category', 'Subcategory 1', 'Subcategory 2'], function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['category', 'Category > Subcategory 1 > Subcategory 2']));
          done();
        });
      });

      it('should send "category" with custom separator', function (done) {
        emarsys.setOption('categorySeparator', ' / ');
        viewedProductCategory(['Category', 'Subcategory 1', 'Subcategory 2'], function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['category', 'Category / Subcategory 1 / Subcategory 2']));
          done();
        });
      });

      it('should send "category" without separator', function (done) {
        emarsys.setOption('categorySeparator', ' / ');
        viewedProductCategory('Category 1', function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['category', 'Category 1']));
          done();
        });
      });

      it('should send "go"', function (done) {
        viewedProductCategory(['Category', 'Subcategory 1', 'Subcategory 2'], function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['go']));
          done();
        });
      });
    });

    describe('#onViewedProductDetail', function () {
      it('should send "view"', function (done) {
        viewedProductDetail('123', function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['view', '123']));
          done();
        });
      });

      it('should send "go"', function (done) {
        viewedProductDetail('123', function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['view', '123']));
          done();
        });
      });
    });

    describe('#onSearched', function () {
      it('should send "searchTerm"', function (done) {
        searched('test query', function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['searchTerm', 'test query']));
          done();
        });
      });

      it('should send "go"', function (done) {
        searched('test query', function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['go']));
          done();
        });
      });
    });

    describe('#onCompletedTransaction', function () {
      it('should send "purchase" and "go"', function (done) {
        completedTransaction({
          orderId: '123',
          lineItems: [{
            product: {
              id: '123',
              unitSalePrice: 100
            },
            quantity: 2,
            subtotal: 180
          }, {
            product: {
              id: '234',
              unitSalePrice: 100
            },
            quantity: 2
          }]
        }, function () {
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['purchase', {
            orderId: '123',
            items: [{
              item: '123',
              price: 180,
              quantity: 2
            }, {
              item: '234',
              price: 200,
              quantity: 2
            }]
          }]));
          _assert2['default'].ok(window.ScarabQueue.push.calledWith(['go']));
          done();
        });
      });
    });
  });
});

},{"./../../src/ddManager":100,"./../../src/integrations/Emarsys":119,"./../reset":152,"assert":1,"sinon":64}],142:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _FacebookPixel = require('./../../src/integrations/FacebookPixel.js');

var _FacebookPixel2 = _interopRequireDefault(_FacebookPixel);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('Integrations: FacebookPixel', function () {
  var fbPixel = void 0;
  var options = {
    pixelId: '946986105422948'
  };

  before(function () {
    fbPixel = new _FacebookPixel2['default'](window.digitalData, options);
    _ddManager2['default'].addIntegration('Facebook Pixel', fbPixel);
  });

  after(function () {
    fbPixel.reset();
    _ddManager2['default'].reset();
    (0, _reset2['default'])();
  });

  describe('#constructor', function () {

    it('should create Facebook Pixel integrations with proper options and tags', function () {
      _assert2['default'].equal(options.pixelId, fbPixel.getOption('pixelId'));
      _assert2['default'].equal('script', fbPixel.getTag().type);
    });
  });

  describe('#load', function () {

    it('should load', function (done) {
      _assert2['default'].ok(!fbPixel.isLoaded());
      _ddManager2['default'].once('load', function () {
        _assert2['default'].ok(fbPixel.isLoaded());
        done();
      });
      _ddManager2['default'].initialize();
    });
  });

  describe('after loading', function () {

    before(function (done) {
      if (!_ddManager2['default'].isReady()) {
        _ddManager2['default'].once('ready', done);
        _ddManager2['default'].initialize();
      } else {
        done();
      }
    });

    beforeEach(function () {
      _sinon2['default'].spy(window, 'fbq');
    });

    afterEach(function () {
      window.fbq.restore();
    });

    it('should initialize fbq object', function () {
      var fbq = window.fbq;

      _assert2['default'].ok(fbq);
      _assert2['default'].ok(typeof fbq === 'function');
    });

    describe('#onViewedPage', function () {

      it('should call fbq track PageView', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'home'
          },
          callback: function callback() {
            _assert2['default'].ok(window.fbq.calledWith('track', 'PageView'));
            done();
          }
        });
      });
    });

    describe('#onViewedProductCategory', function () {

      beforeEach(function () {
        _sinon2['default'].spy(fbPixel, 'onViewedProductCategory');
      });

      afterEach(function () {
        fbPixel.onViewedProductCategory.restore();
      });

      it('should call fbq track ViewContent', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          listing: {
            categoryId: '123'
          },
          callback: function callback() {
            _assert2['default'].ok(window.fbq.calledWith('track', 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product_group'
            }), 'fbq("track", "ViewContent") was not called');
            var pageArg = fbPixel.onViewedProductCategory.getCall(0).args[0];
            _assert2['default'].ok(pageArg.categoryId, 'page.categoryId is not defined');
            done();
          }
        });
      });
    });

    describe('#onViewedProductDetail', function () {

      beforeEach(function () {
        _sinon2['default'].spy(fbPixel, 'onViewedProductDetail');
      });

      afterEach(function () {
        fbPixel.onViewedProductDetail.restore();
      });

      it('should call fbq track ViewContent', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            name: 'Test Product',
            category: 'Category 1',
            currency: 'USD',
            unitSalePrice: 10000
          },
          callback: function callback() {
            _assert2['default'].ok(window.fbq.calledWith('track', 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1',
              currency: 'USD',
              value: 10000
            }), 'fbq("track", "ViewContent") was not called');
            var productArg = fbPixel.onViewedProductDetail.getCall(0).args[0];
            _assert2['default'].ok(productArg.id, 'product.id is not defined');
            _assert2['default'].ok(productArg.name, 'product.name is not defined');
            _assert2['default'].ok(productArg.category, 'product.category is not defined');
            _assert2['default'].ok(productArg.unitSalePrice, 'product.unitSalePrice is not defined');
            done();
          }
        });
      });
    });

    describe('#onAddedProduct', function () {

      beforeEach(function () {
        _sinon2['default'].spy(fbPixel, 'onAddedProduct');
      });

      afterEach(function () {
        fbPixel.onAddedProduct.restore();
      });

      it('should call fbq track AddToCart', function (done) {
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '123',
            name: 'Test Product',
            category: 'Category 1',
            currency: 'USD',
            unitSalePrice: 10000
          },
          quantity: 2,
          callback: function callback() {
            _assert2['default'].ok(window.fbq.calledWith('track', 'AddToCart', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1',
              currency: 'USD',
              value: 20000
            }), 'fbq("track", "AddToCart") was not called');
            var productArg = fbPixel.onAddedProduct.getCall(0).args[0];
            var quantityArg = fbPixel.onAddedProduct.getCall(0).args[1];
            _assert2['default'].ok(productArg.id, 'product.id is not defined');
            _assert2['default'].ok(productArg.name, 'product.name is not defined');
            _assert2['default'].ok(productArg.category, 'product.category is not defined');
            _assert2['default'].ok(productArg.currency, 'product.currency is not defined');
            _assert2['default'].ok(productArg.unitSalePrice, 'product.unitSalePrice is not defined');
            _assert2['default'].ok(quantityArg === 2);
            done();
          }
        });

        it('should call fbq track ViewContent even without quantity param', function (done) {
          window.digitalData.events.push({
            name: 'Added Product',
            category: 'Ecommerce',
            product: {
              id: '123',
              name: 'Test Product',
              category: 'Category 1',
              currency: 'USD',
              unitSalePrice: 10000
            },
            callback: function callback() {
              _assert2['default'].ok(window.fbq.calledWith('track', 'AddToCart', {
                content_ids: ['123'],
                content_type: 'product',
                content_name: 'Test Product',
                content_category: 'Category 1',
                currency: 'USD',
                value: 10000
              }), 'fbq("track", "AddToCart") was not called');
              var productArg = fbPixel.onAddedProduct.getCall(0).args[0];
              var quantityArg = fbPixel.onAddedProduct.getCall(0).args[1];
              _assert2['default'].ok(productArg.id, 'product.id is not defined');
              _assert2['default'].ok(productArg.name, 'product.name is not defined');
              _assert2['default'].ok(productArg.category, 'product.category is not defined');
              _assert2['default'].ok(productArg.currency, 'product.currency is not defined');
              _assert2['default'].ok(productArg.unitSalePrice, 'product.unitSalePrice is not defined');
              _assert2['default'].ok(!quantityArg);
              done();
            }
          });
        });
      });
    });

    describe('#onCompletedTransaction', function () {

      beforeEach(function () {
        _sinon2['default'].spy(fbPixel, 'onCompletedTransaction');
      });

      afterEach(function () {
        fbPixel.onCompletedTransaction.restore();
      });

      it('should call fbq track Purchase', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            total: 20000,
            currency: 'USD',
            lineItems: [{
              product: {
                id: '123',
                name: 'Test Product',
                category: 'Category 1',
                currency: 'USD',
                unitSalePrice: 10000
              },
              quantity: 1,
              subtotal: 10000
            }, {
              product: {
                id: '234',
                name: 'Test Product 2',
                category: 'Category 1',
                currency: 'USD',
                unitSalePrice: 5000
              },
              quantity: 2,
              subtotal: 10000
            }]
          },
          callback: function callback() {
            _assert2['default'].ok(window.fbq.calledWith('track', 'Purchase', {
              content_ids: ['123', '234'],
              content_type: 'product',
              currency: 'USD',
              value: 20000
            }), 'fbq("track", "Purchase") was not called');
            var transactionArg = fbPixel.onCompletedTransaction.getCall(0).args[0];
            _assert2['default'].ok(transactionArg.orderId, 'transaction.orderId is not defined');
            done();
          }
        });
      });

      it('should call fbq track Purchase even if transaction.total and transaction.currency is not defined', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: [{
              product: {
                id: '123',
                name: 'Test Product',
                category: 'Category 1',
                currency: 'USD',
                unitSalePrice: 10000
              },
              quantity: 1,
              subtotal: 10000,
              currency: 'USD'
            }, {
              product: {
                id: '234',
                name: 'Test Product 2',
                category: 'Category 1',
                currency: 'USD',
                unitSalePrice: 5000
              },
              quantity: 2,
              subtotal: 10000,
              currency: 'USD'
            }]
          },
          callback: function callback() {
            _assert2['default'].ok(window.fbq.calledWith('track', 'Purchase', {
              content_ids: ['123', '234'],
              content_type: 'product',
              currency: 'USD',
              value: 20000
            }), 'fbq("track", "Purchase") was not called');
            var transactionArg = fbPixel.onCompletedTransaction.getCall(0).args[0];
            _assert2['default'].ok(transactionArg.orderId, 'transaction.orderId is not defined');
            done();
          }
        });
      });

      it('should call fbq track Purchase even if lineItem.subtotal and lineItem.currency is not defined', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            currency: 'USD',
            lineItems: [{
              product: {
                id: '123',
                name: 'Test Product',
                category: 'Category 1',
                currency: 'USD',
                unitSalePrice: 10000
              },
              quantity: 1
            }, {
              product: {
                id: '234',
                name: 'Test Product 2',
                category: 'Category 1',
                currency: 'USD',
                unitSalePrice: 5000
              },
              quantity: 2
            }]
          },
          callback: function callback() {
            _assert2['default'].ok(window.fbq.calledWith('track', 'Purchase', {
              content_ids: ['123', '234'],
              content_type: 'product',
              currency: 'USD',
              value: 20000
            }), 'fbq("track", "Purchase") was not called');
            var transactionArg = fbPixel.onCompletedTransaction.getCall(0).args[0];
            _assert2['default'].ok(transactionArg.orderId, 'transaction.orderId is not defined');
            done();
          }
        });
      });
    });

    describe('#onCustomEvent', function () {
      it('should call fbq track for custom event', function (done) {
        window.digitalData.events.push({
          name: 'Downloaded Tutorial',
          callback: function callback() {
            _assert2['default'].ok(window.fbq.calledWith('trackCustom', 'Downloaded Tutorial'), 'fbq("track", "Downloaded Tutorial") was not called');
            done();
          }
        });
      });
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/integrations/FacebookPixel.js":120,"./../reset.js":152,"assert":1,"sinon":64}],143:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _after = require('./../../src/functions/after.js');

var _after2 = _interopRequireDefault(_after);

var _argumentsToArray = require('./../functions/argumentsToArray.js');

var _argumentsToArray2 = _interopRequireDefault(_argumentsToArray);

var _GoogleAnalytics = require('./../../src/integrations/GoogleAnalytics.js');

var _GoogleAnalytics2 = _interopRequireDefault(_GoogleAnalytics);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('Integrations: GoogleAnalytics', function () {

  describe('Universal', function () {
    var ga = void 0;
    var options = {
      trackingId: 'UA-51485228-7',
      anonymizeIp: true,
      domain: 'auto',
      siteSpeedSampleRate: 42,
      namespace: false
    };

    beforeEach(function () {
      window.digitalData = {
        events: []
      };
      ga = new _GoogleAnalytics2['default'](window.digitalData, options);
      _ddManager2['default'].addIntegration('Google Analytics', ga);
    });

    afterEach(function () {
      ga.reset();
      _ddManager2['default'].reset();
      (0, _reset2['default'])();
    });

    describe('before loading', function () {
      beforeEach(function () {
        _sinon2['default'].stub(ga, 'load');
      });

      afterEach(function () {
        ga.load.restore();
      });

      describe('#initialize', function () {
        it('should require \'displayfeatures\' if .doubleClick option is `true`', function () {
          ga.setOption('doubleClick', true);
          _ddManager2['default'].initialize({
            autoEvents: false
          });
          _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.q[1]), ['require', 'displayfeatures']);
        });

        it('should require "linkid.js" if enhanced link attribution is `true`', function () {
          ga.setOption('enhancedLinkAttribution', true);
          _ddManager2['default'].initialize({
            autoEvents: false
          });
          _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.q[1]), ['require', 'linkid', 'linkid.js']);
        });

        it('should create window.GoogleAnalyticsObject', function () {
          _assert2['default'].ok(!window.GoogleAnalyticsObject);
          _ddManager2['default'].initialize({
            autoEvents: false
          });
          _assert2['default'].equal(window.GoogleAnalyticsObject, 'ga');
        });

        it('should create window.ga', function () {
          _assert2['default'].ok(!window.ga);
          _ddManager2['default'].initialize({
            autoEvents: false
          });
          _assert2['default'].equal(_typeof(window.ga), 'function');
        });

        it('should create window.ga.l', function () {
          _assert2['default'].ok(!window.ga);
          _ddManager2['default'].initialize({
            autoEvents: false
          });
          _assert2['default'].equal(_typeof(window.ga.l), 'number');
        });

        it('should call window.ga.create with options', function () {
          _ddManager2['default'].initialize({
            autoEvents: false
          });
          _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.q[0]), ['create', options.trackingId, {
            cookieDomain: 'none',
            siteSpeedSampleRate: options.siteSpeedSampleRate,
            allowLinker: true,
            name: undefined
          }]);
        });

        it('should anonymize the ip', function () {
          _ddManager2['default'].initialize({
            autoEvents: false
          });
          _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.q[1]), ['set', 'anonymizeIp', true]);
        });

        it('should call #load', function () {
          _ddManager2['default'].initialize({
            autoEvents: false
          });
          _assert2['default'].ok(ga.load.calledOnce);
        });

        it('should not send universal user id by default', function () {
          window.digitalData.user = {
            id: 'baz'
          };
          _ddManager2['default'].initialize({
            autoEvents: false
          });
          _assert2['default'].notDeepEqual((0, _argumentsToArray2['default'])(window.ga.q[1]), ['set', 'userId', 'baz']);
        });

        it('should send universal user id if sendUserId option is true and user.id is truthy', function () {
          window.digitalData.user = {
            id: 'baz'
          };
          ga.setOption('sendUserId', true);
          _ddManager2['default'].initialize({
            autoEvents: false
          });
          _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.q[1]), ['set', 'userId', 'baz']);
        });

        it('should map custom dimensions & metrics using DDL data', function () {
          ga.setOption('metrics', {
            metric1: 'user.firstName',
            metric2: 'user.lastName',
            metric3: 'user.isSubscribed'
          });
          ga.setOption('dimensions', {
            dimension2: 'user.age',
            dimension3: 'user.hasTransacted'
          });
          window.digitalData.user = {
            firstName: 'John',
            lastName: 'Doe',
            age: 20,
            isSubscribed: true,
            hasTransacted: false
          };
          _ddManager2['default'].initialize({
            autoEvents: false
          });

          _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.q[2]), ['set', {
            metric1: 'John',
            metric2: 'Doe',
            metric3: 'true',
            dimension2: 20,
            dimension3: 'false'
          }]);
        });

        it('should not set metrics, dimensions & content groupings if there is no data in DDL', function () {
          ga.setOption('metrics', {
            metric1: 'something'
          });
          ga.setOption('dimensions', {
            dimension3: 'industry'
          });
          ga.setOption('contentGroupings', {
            contentGrouping1: 'foo'
          });
          _ddManager2['default'].initialize({
            autoEvents: false
          });
          _assert2['default'].deepEqual(window.ga.q[3], undefined);
        });
      });
    });

    describe('loading', function () {
      it('should load', function (done) {
        _assert2['default'].ok(!ga.isLoaded());
        _ddManager2['default'].once('load', function () {
          _assert2['default'].ok(ga.isLoaded());
          done();
        });
        _ddManager2['default'].initialize({
          autoEvents: false
        });
      });
    });

    describe('after loading', function () {
      beforeEach(function (done) {
        _ddManager2['default'].once('ready', done);
        _ddManager2['default'].initialize({
          autoEvents: false
        });
      });

      describe('#enrichDigitalData', function () {
        it('should add clientId', function (done) {
          ga.on('enrich', function () {
            _assert2['default'].ok(window.digitalData.integrations.googleAnalytics);
            _assert2['default'].ok(window.digitalData.integrations.googleAnalytics.clientId);
            done();
          });
        });
      });

      describe('#page', function () {
        beforeEach(function () {
          _sinon2['default'].stub(window, 'ga');
        });

        afterEach(function () {
          window.ga.restore();
        });

        it('should send a page view', function (done) {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {},
            callback: function callback() {
              _assert2['default'].ok(window.ga.calledWith('send', 'pageview', {
                page: window.location.pathname,
                title: document.title,
                location: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search
              }));
              done();
            }
          });
        });

        it('should omit location on subsequent page views', function (done) {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {},
            callback: function callback() {
              _assert2['default'].ok(window.ga.calledWith('send', 'pageview', {
                page: window.location.pathname,
                title: document.title,
                location: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search
              }));

              window.digitalData.events.push({
                name: 'Viewed Page',
                page: {},
                callback: function callback() {
                  _assert2['default'].ok(window.ga.calledWith('send', 'pageview', {
                    page: window.location.pathname,
                    title: document.title
                  }));
                  done();
                }
              });
            }
          });
        });

        it('should set the tracker\'s page object', function (done) {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {},
            callback: function callback() {
              window.ga.calledWith('set', {
                page: window.location.pathname,
                title: document.title
              });
              done();
            }
          });
        });

        it('should send a page view with properties', function (done) {
          digitalData.events.push({
            name: 'Viewed Page',
            page: {
              path: '/path',
              name: 'page name',
              url: 'url'
            },
            callback: function callback() {
              window.ga.calledWith('send', 'pageview', {
                page: '/path',
                title: 'page name',
                location: 'url'
              });
              done();
            }
          });
        });

        it('should send the query if its included', function (done) {
          ga.setOption('includeSearch', true);
          digitalData.events.push({
            name: 'Viewed Page',
            page: {
              name: 'page name',
              path: '/path',
              queryString: '?q=1',
              url: 'url'
            },
            callback: function callback() {
              window.ga.calledWith('send', 'pageview', {
                page: '/path?q=1',
                title: 'page name',
                location: 'url'
              });
              done();
            }
          });
        });

        it('should map custom dimensions, metrics & content groupings using event properties', function (done) {
          ga.setOption('metrics', {
            metric1: 'page.score',
            metric2: 'timestamp' // timestamp is added for every event inside EventManager
          });
          ga.setOption('dimensions', {
            dimension1: 'page.author',
            dimension2: 'page.postType'
          });
          ga.setOption('contentGroupings', {
            contentGrouping1: 'page.section'
          });
          window.digitalData.events.push({
            name: 'Custom Event',
            page: {
              score: 21,
              author: 'Author',
              postType: 'blog',
              section: 'News'
            },
            callback: function callback() {
              _assert2['default'].ok(window.ga.calledWith('set', {
                metric1: 21,
                metric2: _sinon2['default'].match.any, // timestamp is added for every event inside EventManager
                dimension1: 'Author',
                dimension2: 'blog',
                contentGrouping1: 'News'
              }));
              done();
            }
          });
        });
      });

      describe('#track', function () {
        beforeEach(function () {
          _sinon2['default'].stub(window, 'ga');
        });

        it('should send an event', function () {
          window.digitalData.events.push({
            callback: function callback() {
              _assert2['default'].ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'event',
                eventLabel: undefined,
                eventValue: 0,
                nonInteraction: false
              }));
            }
          });
        });

        it('should send a category property', function () {
          window.digitalData.events.push({
            category: 'category',
            callback: function callback() {
              _assert2['default'].ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'category',
                eventAction: 'event',
                eventLabel: undefined,
                eventValue: 0,
                nonInteraction: false
              }));
            }
          });
        });

        it('should send a label property', function () {
          window.digitalData.events.push({
            name: "event",
            label: 'label',
            callback: function callback() {
              _assert2['default'].ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'event',
                eventLabel: 'label',
                eventValue: 0,
                nonInteraction: false
              }));
            }
          });
        });

        it('should send a rounded value property', function () {
          window.digitalData.events.push({
            value: 1.1,
            callback: function callback() {
              _assert2['default'].ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'event',
                eventLabel: undefined,
                eventValue: 1,
                nonInteraction: false
              }));
            }
          });
        });

        it('should send a non-interaction property', function () {
          window.digitalData.events.push({
            nonInteraction: 1,
            callback: function callback() {
              _assert2['default'].ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'event',
                eventLabel: undefined,
                eventValue: 0,
                nonInteraction: true
              }));
            }
          });
        });

        it('should map custom dimensions & metrics', function () {
          ga.setOption('metrics', {
            metric1: 'loadTime',
            metric2: 'levelAchieved'
          });
          ga.setOption('dimensions', {
            dimension2: 'referrer'
          });

          window.digitalData.events.push({
            name: 'Level Unlocked',
            loadTime: '100',
            levelAchieved: '5',
            referrer: 'Google',
            callback: function callback() {
              _assert2['default'].ok(window.ga.calledWith('set', {
                metric1: '100',
                metric2: '5',
                dimension2: 'Google'
              }));
            }
          });
        });
      });

      describe('ecommerce', function () {

        beforeEach(function () {
          _sinon2['default'].stub(window, 'ga');
        });

        it('should require ecommerce.js', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: 'e213e4da'
            },
            callback: function callback() {
              _assert2['default'].ok(window.ga.calledWith('require', 'ecommerce'));
            }
          });
        });

        it('should send simple ecommerce data', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '7306cc06'
            },
            callback: function callback() {
              _assert2['default'].ok(window.ga.args.length === 3);
              _assert2['default'].ok(window.ga.args[1][0] === 'ecommerce:addTransaction');
              _assert2['default'].ok(window.ga.args[2][0] === 'ecommerce:send');
            }
          });
        });

        it('should send ecommerce data', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '780bc55',
              total: 99.99,
              shippingCost: 13.99,
              tax: 20.99,
              currency: 'USD',
              lineItems: [{
                product: {
                  unitPrice: 24.75,
                  unitSalePrice: 24.75,
                  name: 'my product',
                  skuCode: 'p-298'
                },
                quantity: 1
              }, {
                product: {
                  unitPrice: 24.75,
                  unitSalePrice: 24.75,
                  name: 'other product',
                  skuCode: 'p-299'
                },
                quantity: 3
              }]
            },
            callback: function callback() {
              _assert2['default'].deepEqual(window.ga.args[1], ['ecommerce:addTransaction', {
                id: '780bc55',
                affiliation: undefined,
                shipping: 13.99,
                tax: 20.99,
                revenue: 99.99,
                currency: 'USD'
              }]);

              _assert2['default'].deepEqual(window.ga.args[2], ['ecommerce:addItem', {
                id: '780bc55',
                category: undefined,
                name: 'my product',
                price: 24.75,
                quantity: 1,
                sku: 'p-298',
                currency: 'USD'
              }]);

              _assert2['default'].deepEqual(window.ga.args[3], ['ecommerce:addItem', {
                id: '780bc55',
                category: undefined,
                name: 'other product',
                price: 24.75,
                sku: 'p-299',
                quantity: 3,
                currency: 'USD'
              }]);

              _assert2['default'].deepEqual(window.ga.args[4], ['ecommerce:send']);
            }
          });
        });

        it('should fallback to revenue', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '5d4c7cb5',
              shippingCost: 13.99,
              tax: 20.99,
              total: 99.9,
              currency: 'USD',
              lineItems: []
            },
            callback: function callback() {
              _assert2['default'].deepEqual(window.ga.args[1], ['ecommerce:addTransaction', {
                id: '5d4c7cb5',
                affiliation: undefined,
                shipping: 13.99,
                tax: 20.99,
                revenue: 99.9,
                currency: 'USD'
              }]);
            }
          });
        });

        it('should pass custom currency', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '5d4c7cb5',
              total: 99.9,
              shippingCost: 13.99,
              tax: 20.99,
              currency: 'EUR',
              lineItems: [],
              callback: function callback() {
                _assert2['default'].deepEqual(window.ga.args[1], ['ecommerce:addTransaction', {
                  id: '5d4c7cb5',
                  revenue: 99.9,
                  shipping: 13.99,
                  affiliation: undefined,
                  tax: 20.99,
                  currency: 'EUR'
                }]);
              }
            }
          });
        });
      });
    });
  });

  describe('Universal Enhanced Ecommerce', function () {
    var ga = void 0;
    var options = {
      enhancedEcommerce: true,
      trackingId: 'UA-51485228-7',
      anonymizeIp: true,
      domain: 'none',
      defaultCurrency: 'USD',
      siteSpeedSampleRate: 42,
      namespace: false,
      productDimensions: {
        'dimension10': 'stock'
      },
      productMetrics: {
        'metric10': 'weight'
      }
    };

    beforeEach(function () {
      window.digitalData = {
        events: []
      };
      ga = new _GoogleAnalytics2['default'](window.digitalData, options);
      _ddManager2['default'].addIntegration('Google Analytics', ga);
    });

    afterEach(function () {
      ga.reset();
      _ddManager2['default'].reset();
      (0, _reset2['default'])();
    });

    describe('after loading', function () {
      beforeEach(function (done) {
        _ddManager2['default'].once('ready', done);
        _ddManager2['default'].initialize({
          autoEvents: false
        });
      });

      describe('enhanced ecommerce', function () {
        beforeEach(function () {
          _sinon2['default'].stub(window, 'ga');
        });

        it('should require ec.js', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: 'ee099bf7'
            },
            callback: function callback() {
              _assert2['default'].ok(window.ga.args.length > 0);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[0]), ['require', 'ec']);
            }
          });
        });

        it('should not require ec if .enhancedEcommerceLoaded is true', function () {
          ga.enhancedEcommerceLoaded = true;
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: 'ee099bf7'
            },
            callback: function callback() {
              _assert2['default'].ok(window.ga.args.length > 0);
              _assert2['default'].notDeepEqual((0, _argumentsToArray2['default'])(window.ga.args[0]), ['require', 'ec']);
            }
          });
        });

        it('should set currency for ec.js to default', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: 'ee099bf7'
            },
            callback: function callback() {
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'USD']);
            }
          });
        });

        it('should set currency for ec.js to custom currency', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: 'ee099bf7',
              currency: 'EUR'
            },
            callback: function callback() {
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'EUR']);
            }
          });
        });

        it('should send added product data', function () {
          window.digitalData.events.push({
            name: 'Added Product',
            category: 'Ecommerce',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298'
            },
            quantity: 1,
            callback: function callback() {
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:setAction', 'add', {}]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Added Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send added product data with custom dimensions and metrics', function () {
          window.digitalData.events.push({
            name: 'Added Product',
            category: 'Ecommerce',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
              stock: 25,
              weight: 100
            },
            quantity: 1,
            callback: function callback() {
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:setAction', 'add', {}]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Added Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send added product data from digital data layer', function () {
          window.digitalData.product = {
            id: 'p-298',
            currency: 'CAD',
            unitPrice: 24.75,
            name: 'my product',
            category: 'cat 1',
            skuCode: 'p-298'
          };
          window.digitalData.events.push({
            name: 'Added Product',
            category: 'Ecommerce',
            product: 'p-298',
            quantity: 1,
            callback: function callback() {
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:setAction', 'add', {}]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Added Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send send label tracking enhanced ecommerce events with Univeral Analytics', function () {
          window.digitalData.events.push({
            name: 'Added Product',
            category: 'Ecommerce',
            label: 'sample label',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298'
            },
            quantity: 1,
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 5);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:setAction', 'add', {}]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Added Product', 'sample label', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send removed product data', function () {
          window.digitalData.events.push({
            name: 'Removed Product',
            category: 'Ecommerce',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298'
            },
            quantity: 1,
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 5);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:setAction', 'remove', {}]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Removed Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send removed product data with custom dimensions and metrics', function () {
          window.digitalData.events.push({
            name: 'Removed Product',
            category: 'Ecommerce',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
              stock: 25,
              weight: 100
            },
            quantity: 1,
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 5);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:setAction', 'remove', {}]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Removed Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed product detail data', function () {
          window.digitalData.events.push({
            name: 'Viewed Product Detail',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298'
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 5);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:setAction', 'detail', {}]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Viewed Product Detail', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed product detail data with custom dimensions and metrics', function () {
          window.digitalData.events.push({
            name: 'Viewed Product Detail',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
              stock: 25,
              weight: 100
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 5);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:setAction', 'detail', {}]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Viewed Product Detail', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send clicked product data with custom dimensions and metrics', function () {
          window.digitalData.events.push({
            name: 'Clicked Product',
            listItem: {
              product: {
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-298',
                listName: 'search results',
                stock: 25,
                weight: 100
              },
              listName: 'search results'
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 5);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:setAction', 'click', {
                list: 'search results'
              }]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Clicked Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send clicked product data with data from DDL', function () {
          window.digitalData.listing = {
            listName: 'search results',
            items: [{
              id: 'p-298',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298'
            }]
          };
          window.digitalData.events.push({
            name: 'Clicked Product',
            listItem: {
              product: 'p-298',
              listName: 'search results'
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 5);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                position: 1
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:setAction', 'click', {
                list: 'search results'
              }]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Clicked Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed product data with custom dimensions and metrics', function () {
          window.digitalData.events.push({
            name: 'Viewed Product',
            category: 'Ecommerce',
            listItem: {
              product: {
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-298',
                stock: 25,
                weight: 100
              },
              listName: 'search results',
              position: 2
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 4);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addImpression', {
                id: 'p-298',
                name: 'my product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2,
                dimension10: 25,
                metric10: 100
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed product data array', function () {
          window.digitalData.events.push({
            name: 'Viewed Product',
            category: 'Ecommerce',
            listItems: [{
              product: {
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-298'
              },
              listName: 'search results',
              position: 2
            }, {
              product: {
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-299'
              },
              listName: 'search results',
              position: 2
            }],
            listName: 'search results',
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 6);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addImpression', {
                id: 'p-298',
                name: 'my product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[3]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[4]), ['ec:addImpression', {
                id: 'p-299',
                name: 'my product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2
              }]);
              _assert2['default'].deepEqual(window.ga.args[5], ['send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed product data from DDL', function () {
          window.digitalData.listing = {
            listName: 'search results',
            items: [{
              id: 'p-298',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298'
            }, {
              id: 'p-299',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my other product',
              category: 'cat 1',
              skuCode: 'p-298'
            }]
          };
          window.digitalData.events.push({
            name: 'Viewed Product',
            category: 'Ecommerce',
            listItem: {
              product: 'p-299',
              listName: 'search results'
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 4);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addImpression', {
                id: 'p-299',
                name: 'my other product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed product data from DDL', function () {
          window.digitalData.listing = {
            listName: 'search results',
            items: [{
              id: 'p-298',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298'
            }, {
              id: 'p-299',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my other product',
              category: 'cat 1',
              skuCode: 'p-299'
            }]
          };
          window.digitalData.events.push({
            name: 'Viewed Product',
            category: 'Ecommerce',
            listItems: [{
              product: 'p-298',
              listName: 'search results'
            }, {
              product: 'p-299',
              listName: 'search results'
            }],
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 6);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addImpression', {
                id: 'p-298',
                name: 'my product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 1
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[3]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[4]), ['ec:addImpression', {
                id: 'p-299',
                name: 'my other product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2
              }]);
              _assert2['default'].deepEqual(window.ga.args[5], ['send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed promotion data', function () {
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaign: {
              id: 'PROMO_1234',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1'
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 4);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'USD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed promotion data array', function () {
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaigns: [{
              id: 'PROMO_1234',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1'
            }, {
              id: 'PROMO_2345',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1'
            }],
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 5);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'USD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[3]), ['ec:addPromo', {
                id: 'PROMO_2345',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed promotion data from DDL', function () {
          window.digitalData.campaigns = [{
            id: 'PROMO_1234',
            name: 'Summer Sale',
            design: 'summer_banner2',
            position: 'banner_slot1'
          }];
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaign: 'PROMO_1234',
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 4);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'USD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed promotion data from DDL', function () {
          window.digitalData.campaigns = [{
            id: 'PROMO_1234',
            name: 'Summer Sale',
            design: 'summer_banner2',
            position: 'banner_slot1'
          }, {
            id: 'PROMO_2345',
            name: 'Summer Sale',
            design: 'summer_banner2',
            position: 'banner_slot1'
          }];
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaigns: ['PROMO_1234', 'PROMO_2345'],
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 5);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'USD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[3]), ['ec:addPromo', {
                id: 'PROMO_2345',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send clicked promotion data', function () {
          window.digitalData.events.push({
            name: 'Clicked Campaign',
            category: 'Promo',
            campaign: {
              id: 'PROMO_1234',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1'
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 5);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'USD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:setAction', 'promo_click', {}]);
              _assert2['default'].deepEqual(window.ga.args[4], ['send', 'event', 'Promo', 'Clicked Campaign', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send started order data with custom dimensions and metrics', function () {
          window.digitalData.cart = {
            currency: 'CAD',
            lineItems: [{
              product: {
                id: 'p-298',
                unitPrice: 24.75,
                name: 'my product',
                skuCode: 'p-298',
                stock: 25,
                weight: 100
              },
              quantity: 1
            }, {
              product: {
                id: 'p-299',
                unitPrice: 24.75,
                name: 'other product',
                skuCode: 'p-299',
                stock: 30,
                weight: 200
              },
              quantity: 3
            }]
          };
          window.digitalData.events.push({
            name: 'Viewed Checkout Step',
            step: 1,
            paymentMethod: 'Visa',
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 6);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: undefined,
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[3]), ['ec:addProduct', {
                id: 'p-299',
                name: 'other product',
                category: undefined,
                quantity: 3,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 30,
                metric10: 200
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[4]), ['ec:setAction', 'checkout', {
                step: 1,
                option: 'Visa'
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[5]), ['send', 'event', 'Ecommerce', 'Viewed Checkout Step', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send completed checkout step data', function () {
          window.digitalData.cart = {
            currency: 'CAD',
            lineItems: [{
              product: {
                id: 'p-298',
                unitPrice: 24.75,
                name: 'my product',
                skuCode: 'p-298',
                stock: 25,
                weight: 100
              },
              quantity: 1
            }, {
              product: {
                id: 'p-299',
                unitPrice: 24.75,
                name: 'other product',
                skuCode: 'p-299',
                stock: 30,
                weight: 200
              },
              quantity: 3
            }]
          };
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            step: 2,
            shippingMethod: 'FedEx',
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 4);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:setAction', 'checkout_option', {
                step: 2,
                option: 'FedEx'
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[3]), ['send', 'event', 'Ecommerce', 'Completed Checkout Step', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send completed checkout step data with all options', function () {
          window.digitalData.cart = {
            currency: 'CAD',
            lineItems: [{
              product: {
                id: 'p-298',
                unitPrice: 24.75,
                name: 'my product',
                skuCode: 'p-298'
              },
              quantity: 1
            }, {
              product: {
                id: 'p-299',
                unitPrice: 24.75,
                name: 'other product',
                skuCode: 'p-299'
              },
              quantity: 3
            }]
          };
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            step: 2,
            paymentMethod: 'Visa',
            shippingMethod: 'FedEx',
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 4);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:setAction', 'checkout_option', {
                step: 2,
                option: 'Visa, FedEx'
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[3]), ['send', 'event', 'Ecommerce', 'Completed Checkout Step', { nonInteraction: 1 }]);
            }
          });
        });

        it('should not send completed checkout step data without a step', function () {
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            paymentMethod: 'Visa',
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 0);
            }
          });
        });

        it('should not send completed checkout step data without an option', function () {
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            step: 2,
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 0);
            }
          });
        });

        it('should send simple completed order data', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '7306cc06'
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 4);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:setAction', 'purchase', {
                id: '7306cc06',
                affiliation: undefined,
                revenue: 0.0,
                tax: undefined,
                shipping: undefined,
                coupon: undefined
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[3]), ['send', 'event', 'Ecommerce', 'Completed Transaction', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send completed order data with custom dimensions and metrics', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '780bc55',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              vouchers: ['coupon'],
              affiliation: 'affiliation',
              lineItems: [{
                product: {
                  id: 'p-298',
                  unitPrice: 24.75,
                  name: 'my product',
                  category: 'cat 1',
                  skuCode: 'p-298',
                  stock: 25,
                  weight: 100
                },
                quantity: 1
              }, {
                product: {
                  unitSalePrice: 24.75,
                  name: 'other product',
                  category: 'cat 2',
                  skuCode: 'p-299',
                  currency: 'EUR',
                  stock: 30,
                  weight: 200
                },
                quantity: 3
              }]

            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 6);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[3]), ['ec:addProduct', {
                id: 'p-299',
                name: 'other product',
                category: 'cat 2',
                quantity: 3,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'EUR',
                dimension10: 30,
                metric10: 200
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[4]), ['ec:setAction', 'purchase', {
                id: '780bc55',
                affiliation: 'affiliation',
                revenue: 99.9,
                tax: 20.99,
                shipping: 13.99,
                coupon: 'coupon'
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[5]), ['send', 'event', 'Ecommerce', 'Completed Transaction', { nonInteraction: 1 }]);
            }
          });
        });

        it('should add coupon to product level in completed order', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '780bc55',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              vouchers: ['coupon'],
              affiliation: 'affiliation',
              lineItems: [{
                product: {
                  id: 'p-298',
                  unitPrice: 24.75,
                  name: 'my product',
                  category: 'cat 1',
                  skuCode: 'p-298',
                  voucher: 'promo'
                },
                quantity: 1
              }, {
                product: {
                  unitSalePrice: 24.75,
                  name: 'other product',
                  category: 'cat 2',
                  skuCode: 'p-299',
                  currency: 'EUR'
                },
                quantity: 3
              }]

            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 6);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[1]), ['set', '&cu', 'CAD']);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                coupon: 'promo'
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[3]), ['ec:addProduct', {
                id: 'p-299',
                name: 'other product',
                category: 'cat 2',
                quantity: 3,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'EUR'
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[4]), ['ec:setAction', 'purchase', {
                id: '780bc55',
                affiliation: 'affiliation',
                revenue: 99.9,
                tax: 20.99,
                shipping: 13.99,
                coupon: 'coupon'
              }]);
              _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.args[5]), ['send', 'event', 'Ecommerce', 'Completed Transaction', { nonInteraction: 1 }]);
            }
          });
        });

        it('completed order should fallback to revenue', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '5d4c7cb5',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              lineItems: []
            },
            callback: function callback() {
              _assert2['default'].deepEqual(window.ga.args[2], ['ec:setAction', 'purchase', {
                id: '5d4c7cb5',
                affiliation: undefined,
                revenue: 99.9,
                tax: 20.99,
                shipping: 13.99,
                coupon: undefined
              }]);
            }
          });
        });

        it('should send full refunded order data', function () {
          window.digitalData.events.push({
            name: 'Refunded Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '780bc55',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              lineItems: []
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 4);
              _assert2['default'].deepEqual(window.ga.args[2], ['ec:setAction', 'refund', {
                id: '780bc55'
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['send', 'event', 'Ecommerce', 'Refunded Transaction', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send partial refunded order data', function () {
          window.digitalData.events.push({
            name: 'Refunded Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '780bc55',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              lineItems: [{
                product: {
                  skuCode: 'p-298'
                },
                quanity: 1
              }, {
                product: {
                  skuCode: 'p-299'
                },
                quantity: 2
              }]
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 6);
              _assert2['default'].deepEqual(window.ga.args[2], ['ec:addProduct', {
                id: 'p-298',
                name: undefined,
                category: undefined,
                price: undefined,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }]);
              _assert2['default'].deepEqual(window.ga.args[3], ['ec:addProduct', {
                id: 'p-299',
                name: undefined,
                category: undefined,
                quantity: 2,
                price: undefined,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }]);
              _assert2['default'].deepEqual(window.ga.args[4], ['ec:setAction', 'refund', {
                id: '780bc55'
              }]);
              _assert2['default'].deepEqual(window.ga.args[5], ['send', 'event', 'Ecommerce', 'Refunded Transaction', { nonInteraction: 1 }]);
            }
          });
        });
      });
    });
  });

  describe('Universal with noConflict', function () {

    var ga = void 0;
    var options = {
      trackingId: 'UA-51485228-7',
      domain: 'none',
      defaultCurrency: 'USD',
      siteSpeedSampleRate: 42,
      namespace: 'ddl',
      noConflict: true
    };

    function loadGA(callback) {
      //load GA
      (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;i[r] = i[r] || function () {
          (i[r].q = i[r].q || []).push(arguments);
        }, i[r].l = 1 * new Date();a = s.createElement(o), m = s.getElementsByTagName(o)[0];a.async = 1;a.src = g;m.parentNode.insertBefore(a, m);
      })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

      window.ga('create', 'UA-51485228-7', {
        // Fall back on default to protect against empty string
        cookieDomain: 'auto',
        name: 'gtm.123'
      });
      window.ga('send', 'pageview');

      window.ga(function () {
        callback();
      });
    }

    beforeEach(function () {
      window.digitalData = {
        events: []
      };
      ga = new _GoogleAnalytics2['default'](window.digitalData, options);
      _ddManager2['default'].addIntegration('Google Analytics', ga);
    });

    afterEach(function () {
      ga.reset();
      _ddManager2['default'].reset();
      (0, _reset2['default'])();
    });

    describe('after loading', function () {
      beforeEach(function (done) {
        loadGA(function () {
          _ddManager2['default'].once('ready', done);
          _ddManager2['default'].initialize({
            autoEvents: false
          });
        });
      });

      describe('enhanced ecommerce', function () {

        beforeEach(function () {
          _sinon2['default'].spy(window, 'ga');
        });

        afterEach(function () {
          window.ga.restore();
        });

        it('should use custom namespace in requests', function (done) {
          window.digitalData.events.push({
            name: 'Test',
            category: 'Test',
            callback: function callback() {
              _assert2['default'].equal(2, window.ga.getAll().length);
              _assert2['default'].ok(window.ga.calledOnce);
              done();
            }
          });
        });

        it('should not track View Page semantic event', function (done) {
          window.digitalData.events.push({
            name: 'Viewed Page',
            category: 'Content',
            callback: function callback() {
              _assert2['default'].ok(!window.ga.called);
              done();
            }
          });
        });

        it('should not track simple ecommerce data', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '7306cc06'
            },
            callback: function callback() {
              _assert2['default'].equal(window.ga.args.length, 1);
            }
          });
        });
      });
    });
  });

  describe('Universal with filterEvents', function () {

    var ga = void 0;
    var options = {
      enhancedEcommerce: true,
      trackingId: 'UA-51485228-7',
      domain: 'none',
      defaultCurrency: 'USD',
      siteSpeedSampleRate: 42,
      namespace: 'ddl',
      filterEvents: ['Completed Transaction']
    };

    beforeEach(function () {
      window.digitalData = {
        events: []
      };
      ga = new _GoogleAnalytics2['default'](window.digitalData, options);
      _ddManager2['default'].addIntegration('Google Analytics', ga);
    });

    afterEach(function () {
      ga.reset();
      _ddManager2['default'].reset();
      (0, _reset2['default'])();
    });

    describe('after loading', function () {
      beforeEach(function (done) {
        _ddManager2['default'].once('ready', done);
        _ddManager2['default'].initialize({
          autoEvents: false
        });
      });

      describe('enhanced ecommerce', function () {

        beforeEach(function () {
          _sinon2['default'].spy(window, 'ga');
        });

        afterEach(function () {
          window.ga.restore();
        });

        it('should not track View Page semantic event', function (done) {
          window.digitalData.events.push({
            name: 'Viewed Page',
            category: 'Content',
            callback: function callback() {
              _assert2['default'].ok(!window.ga.called);
              done();
            }
          });
        });

        it('should not track simple ecommerce data', function (done) {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '7306cc06'
            },
            callback: function callback() {
              _assert2['default'].ok(!window.ga.called);
              done();
            }
          });
        });
      });
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/functions/after.js":101,"./../../src/integrations/GoogleAnalytics.js":121,"./../functions/argumentsToArray.js":137,"./../reset.js":152,"assert":1,"sinon":64}],144:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _GoogleTagManager = require('./../../src/integrations/GoogleTagManager.js');

var _GoogleTagManager2 = _interopRequireDefault(_GoogleTagManager);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('Integrations: GoogleTagManager', function () {
  describe('using containerID', function () {

    var gtm = void 0;
    var options = {
      containerId: 'GTM-M9CMLZ'
    };

    beforeEach(function () {
      gtm = new _GoogleTagManager2['default'](window.digitalData, options);
      _ddManager2['default'].addIntegration('Google Tag Manager', gtm);
    });

    afterEach(function () {
      gtm.reset();
      _ddManager2['default'].reset();
      (0, _reset2['default'])();
    });

    describe('#constructor', function () {

      it('should create GTM integrations with proper options and tags', function () {
        _assert2['default'].equal(options.containerId, gtm.getOption('containerId'));
        _assert2['default'].equal('script', gtm.getTag().type);
        _assert2['default'].ok(gtm.getTag().attr.src.indexOf(options.containerId) > 0);
      });
    });

    describe('#load', function () {

      it('should load', function (done) {
        _assert2['default'].ok(!gtm.isLoaded());
        _ddManager2['default'].once('load', function () {
          _assert2['default'].ok(gtm.isLoaded());
          done();
        });
        _ddManager2['default'].initialize();
      });

      it('should not load if gtm is already loaded', function (done) {
        var originalIsLoaded = gtm.isLoaded;
        gtm.isLoaded = function () {
          return true;
        };
        _assert2['default'].ok(gtm.isLoaded());
        _ddManager2['default'].once('ready', function () {
          _assert2['default'].ok(!originalIsLoaded());
          done();
        });
        _ddManager2['default'].initialize();
      });
    });

    describe('after loading', function () {
      beforeEach(function (done) {
        _ddManager2['default'].once('ready', done);
        _ddManager2['default'].initialize();
      });

      it('should update dataLayer', function () {
        var dl = window.dataLayer;

        _assert2['default'].ok(dl);
        _assert2['default'].ok(dl[0].event === 'gtm.js');
        _assert2['default'].ok(typeof dl[0]['gtm.start'] === 'number');
      });

      describe('#trackEvent', function () {

        beforeEach(function () {
          window.dataLayer = [];
        });

        it('should send event', function () {
          window.digitalData.events.push({
            name: 'some-event',
            category: 'some-category'
          });

          var dl = window.dataLayer;

          _assert2['default'].ok(dl[0].event === 'some-event');
          _assert2['default'].ok(dl[0].eventCategory === 'some-category');
        });

        it('should send event with additional parameters', function () {
          window.digitalData.events.push({
            name: 'some-event',
            category: 'some-category',
            additionalParam: true
          });

          var dl = window.dataLayer;

          _assert2['default'].ok(dl[0].event === 'some-event');
          _assert2['default'].ok(dl[0].additionalParam === true);
        });
      });
    });
  });

  describe('using existing GTM', function () {

    var gtm = void 0;

    beforeEach(function () {
      window.dataLayer = [];
      window.dataLayer.push = function () {
        window.dataLayer.prototype.apply(this, arguments);
      };
      gtm = new _GoogleTagManager2['default'](window.digitalData, {
        noConflict: true
      });
      _ddManager2['default'].addIntegration('Google Tag Manager', gtm);
    });

    afterEach(function () {
      gtm.reset();
      _ddManager2['default'].reset();
      (0, _reset2['default'])();
    });

    describe('after loading', function () {
      beforeEach(function (done) {
        _ddManager2['default'].once('ready', done);
        _ddManager2['default'].initialize();
      });

      describe('#trackEvent', function () {

        beforeEach(function () {
          window.dataLayer = [];
        });

        it('should send event with additional parameters to existing GTM', function () {
          window.digitalData.events.push({
            name: 'some-event',
            category: 'some-category',
            additionalParam: true
          });

          var dl = window.dataLayer;

          _assert2['default'].ok(dl[0].event === 'some-event');
          _assert2['default'].ok(dl[0].additionalParam === true);
        });
      });
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/integrations/GoogleTagManager.js":122,"./../reset.js":152,"assert":1}],145:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _MyTarget = require('./../../src/integrations/MyTarget.js');

var _MyTarget2 = _interopRequireDefault(_MyTarget);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('Integrations: MyTarget', function () {

  var myTarget = void 0;
  var options = {
    counterId: '123'
  };

  beforeEach(function () {
    window.digitalData = {
      website: {},
      page: {},
      user: {},
      events: []
    };
    myTarget = new _MyTarget2['default'](window.digitalData, options);
    _ddManager2['default'].addIntegration('MyTarget', myTarget);
  });

  afterEach(function () {
    myTarget.reset();
    _ddManager2['default'].reset();
    (0, _reset2['default'])();
  });

  describe('before loading', function () {
    beforeEach(function () {
      _sinon2['default'].stub(myTarget, 'load');
    });

    afterEach(function () {
      myTarget.load.restore();
    });

    describe('#constructor', function () {
      it('should add proper tags and options', function () {
        _assert2['default'].equal(options.counterId, myTarget.getOption('counterId'));
        _assert2['default'].equal(options.listProperty, myTarget.getOption('listProperty'));
        _assert2['default'].deepEqual(options.listPropertyMapping, myTarget.getOption('listPropertyMapping'));
        _assert2['default'].equal('script', myTarget.getTag().type);
        _assert2['default'].equal(myTarget.getTag().attr.src, '//top-fwz1.mail.ru/js/code.js');
      });
    });

    describe('#getList', function () {
      it('should return default list', function () {
        _assert2['default'].equal(myTarget.getList(), '1');
      });

      it('should return defined list', function () {
        myTarget.setOption('list', '5');
        _assert2['default'].equal(myTarget.getList(), '5');
      });

      it('should return list defined in DDL', function () {
        window.digitalData.page.list = '5';
        myTarget.setOption('listProperty', 'page.list');
        _assert2['default'].equal(myTarget.getList(), '5');
      });

      it('should return list defined in DDL using mapping', function () {
        window.digitalData.website.region = 'New York';
        myTarget.setOption('listProperty', 'website.region');
        myTarget.setOption('listPropertyMapping', {
          'New York': '5'
        });
        _assert2['default'].equal(myTarget.getList(), '5');
      });
    });

    describe('#initialize', function () {
      it('should initialize mytarget queue object', function () {
        _ddManager2['default'].initialize();
        _assert2['default'].ok(window._tmr);
        _assert2['default'].ok(window._tmr.push);
      });

      it('should call tags load after initialization', function () {
        _ddManager2['default'].initialize();
        _assert2['default'].ok(myTarget.load.calledOnce);
      });
    });
  });

  describe('loading', function () {
    beforeEach(function () {
      _sinon2['default'].stub(myTarget, 'load', function () {
        window._tmr = {
          push: function push() {},
          unload: function unload() {}
        };
        myTarget.onLoad();
      });
    });

    afterEach(function () {
      myTarget.load.restore();
    });

    it('should load', function (done) {
      _assert2['default'].ok(!myTarget.isLoaded());
      _ddManager2['default'].once('load', function () {
        _assert2['default'].ok(myTarget.isLoaded());
        done();
      });
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });
  });

  describe('after loading', function () {
    beforeEach(function (done) {
      _sinon2['default'].stub(myTarget, 'load', function () {
        myTarget.onLoad();
      });
      _ddManager2['default'].once('ready', done);
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });

    afterEach(function () {
      myTarget.load.restore();
    });

    describe('#onViewedPage', function () {
      it('should send pageView for every "Viewed Page" event', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {},
          callback: function callback() {
            _assert2['default'].equal(window._tmr[0].id, myTarget.getOption('counterId'));
            _assert2['default'].equal(window._tmr[0].type, 'pageView');
            done();
          }
        });
      });

      it('should not send pageView event if noConflict setting is true', function (done) {
        myTarget.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'home'
          },
          callback: function callback() {
            _assert2['default'].equal(window._tmr.length, 0);
            done();
          }
        });
      });
    });

    describe('#onViewedHome', function () {
      it('should send viewHome event if user visits home page', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'home'
          },
          callback: function callback() {
            _assert2['default'].equal(window._tmr.length, 2);
            _assert2['default'].deepEqual(window._tmr[1], {
              type: 'itemView',
              productid: '',
              pagetype: 'home',
              totalvalue: '',
              list: myTarget.getList()
            });
            done();
          }
        });
      });
    });

    describe('#onViewedProductCategory', function () {
      it('should send itemView event for every "Viewed Product Category" event', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Content',
          callback: function callback() {
            _assert2['default'].deepEqual(window._tmr[0], {
              type: 'itemView',
              productid: '',
              pagetype: 'category',
              totalvalue: '',
              list: myTarget.getList()
            });
            done();
          }
        });
      });

      it('should not send itemView event if noConflict setting is true', function (done) {
        myTarget.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Content',
          callback: function callback() {
            _assert2['default'].equal(window._tmr.length, 0);
            done();
          }
        });
      });
    });

    describe('#onViewedProductDetail', function () {
      it('should send itemView event for every "Viewed Product Detail" event', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitSalePrice: 150
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window._tmr[0], {
              type: 'itemView',
              productid: '123',
              pagetype: 'product',
              totalvalue: 150,
              list: myTarget.getList()
            });
            done();
          }
        });
      });

      it('should not send itemView event if noConflict option is true', function (done) {
        myTarget.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: function callback() {
            _assert2['default'].equal(window._tmr.length, 0);
            done();
          }
        });
      });
    });

    describe('#onViewedCart', function () {
      it('should send itemView event if user visits cart page', function (done) {
        window.digitalData.cart = {
          lineItems: [{
            product: {
              id: '123',
              unitSalePrice: 100
            },
            quantity: 1
          }, {
            product: {
              id: '234',
              unitPrice: 100,
              unitSalePrice: 50
            },
            quantity: 2
          }, {
            product: {
              id: '345',
              unitPrice: 30
            }
          }, {
            product: {
              id: '456'
            }
          }, {
            product: {}
          }],
          total: 230
        };
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'cart'
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window._tmr[1], {
              type: 'itemView',
              productid: ['123', '234', '345', '456'],
              pagetype: 'cart',
              totalvalue: 230,
              list: myTarget.getList()
            });
            done();
          }
        });
      });

      it('should not send itemView event if noConflict option is true', function (done) {
        myTarget.setOption('noConflict', true);
        window.digitalData.cart = {
          lineItems: [{
            product: {
              id: '123',
              unitSalePrice: 100
            },
            quantity: 1
          }]
        };
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'cart'
          },
          callback: function callback() {
            _assert2['default'].equal(window._tmr.length, 0);
            done();
          }
        });
      });
    });

    describe('#onCompletedTransaction', function () {
      var lineItems = [{
        product: {
          id: '123',
          unitSalePrice: 100
        },
        quantity: 1
      }, {
        product: {
          id: '234',
          unitPrice: 100,
          unitSalePrice: 50
        },
        quantity: 2
      }, {
        product: {
          id: '345',
          unitPrice: 30
        }
      }, {
        product: {
          id: '456'
        }
      }, {
        product: {}
      }];

      it('should send itemView event if transaction is completed', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            isFirst: true,
            lineItems: lineItems,
            total: 230
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window._tmr[0], {
              type: 'itemView',
              productid: ['123', '234', '345', '456'],
              pagetype: 'purchase',
              totalvalue: 230,
              list: myTarget.getList()
            });
            done();
          }
        });
      });

      it('should not send trackTransaction event if noConflict option is true', function (done) {
        myTarget.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: function callback() {
            _assert2['default'].equal(window._tmr.length, 0);
            done();
          }
        });
      });
    });

    describe('#onCustomEvent', function () {
      it('should send reachGoal event for any other DDL event', function (done) {
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window._tmr[0], {
              id: myTarget.getOption('counterId'),
              type: 'reachGoal',
              goal: 'Subscribed'
            });
            done();
          }
        });
      });

      it('should send reachGoal event for any other DDL event event if noConflict option is true', function (done) {
        myTarget.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window._tmr[0], {
              id: myTarget.getOption('counterId'),
              type: 'reachGoal',
              goal: 'Subscribed'
            });
            done();
          }
        });
      });
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/integrations/MyTarget.js":123,"./../reset.js":152,"assert":1,"sinon":64}],146:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _argumentsToArray = require('./../functions/argumentsToArray.js');

var _argumentsToArray2 = _interopRequireDefault(_argumentsToArray);

var _GoogleAnalytics = require('./../../src/integrations/GoogleAnalytics.js');

var _GoogleAnalytics2 = _interopRequireDefault(_GoogleAnalytics);

var _OWOXBIStreaming = require('./../../src/integrations/OWOXBIStreaming.js');

var _OWOXBIStreaming2 = _interopRequireDefault(_OWOXBIStreaming);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('Integrations: OWOXBIStreaming', function () {

  describe('OWOXBIStreaming', function () {
    var ga = void 0;
    var owox = void 0;
    var options = {
      trackingId: 'UA-51485228-7',
      domain: 'auto'
    };

    beforeEach(function () {
      window.digitalData = {
        events: []
      };
      ga = new _GoogleAnalytics2['default'](window.digitalData, options);
      owox = new _OWOXBIStreaming2['default'](window.digitalData, {
        'sessionIdDimension': 'sessionId'
      });

      // reset in case GA was loaded
      // from previous tests asyncronously
      ga.reset();
      owox.reset();

      // OWOX should depend on Google Analtics, so this order is for reason
      // to test that everything works well even if OWOX BI is added before GA
      // TODO: change order and make sure everything works
      _ddManager2['default'].addIntegration('Google Analytics', ga);
      _ddManager2['default'].addIntegration('OWOX BI Streaming', owox);
    });

    afterEach(function () {
      ga.reset();
      owox.reset();
      _ddManager2['default'].reset();
      (0, _reset2['default'])();
    });

    describe('before loading', function () {
      beforeEach(function () {
        _sinon2['default'].stub(ga, 'load');
        _sinon2['default'].stub(owox, 'load');
      });

      afterEach(function () {
        ga.load.restore();
        owox.load.restore();
      });

      describe('#initialize', function () {

        it('should require Google Analytics OWOXBIStreaming plugin', function () {
          ga.setOption('sessionIdDimension', 'SessionId');
          _ddManager2['default'].initialize();
          _ddManager2['default'].on('ready', function () {
            _assert2['default'].deepEqual((0, _argumentsToArray2['default'])(window.ga.q[2]), ['ddl.require', 'OWOXBIStreaming', {
              'sessionIdDimension': 'sessionId'
            }]);
            _assert2['default'].deepEqual([window.ga.q[3][0], window.ga.q[3][1]], ['provide', 'OWOXBIStreaming']);
          });
        });
      });
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/integrations/GoogleAnalytics.js":121,"./../../src/integrations/OWOXBIStreaming.js":124,"./../functions/argumentsToArray.js":137,"./../reset.js":152,"assert":1,"sinon":64}],147:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _deleteProperty = require('./../../src/functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _RetailRocket = require('./../../src/integrations/RetailRocket.js');

var _RetailRocket2 = _interopRequireDefault(_RetailRocket);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('Integrations: RetailRocket', function () {
  // this var will be reused in all Retail Rocket tests
  // as Retail Rocket throws error when loaded few times
  var retailRocket = void 0;
  var stubsPrepared = false;

  var options = {
    partnerId: '567c343e6c7d3d14101afee5',
    userIdProperty: 'user.email'
  };

  beforeEach(function () {
    window.digitalData = {
      user: {},
      events: []
    };
    retailRocket = new _RetailRocket2['default'](window.digitalData, options);
    _ddManager2['default'].addIntegration('Retail Rocket', retailRocket);
  });

  afterEach(function () {
    retailRocket.reset();
    _ddManager2['default'].reset();
    (0, _reset2['default'])();

    // stubs for callbacks (hack)
    window.rrApi = {};
    window.rrApi.pageViewCompleted = function () {};
    window.rrApi.setEmailCompleted = function () {};
  });

  describe('before loading', function () {
    beforeEach(function () {
      _sinon2['default'].stub(retailRocket, 'load');
    });

    afterEach(function () {
      retailRocket.load.restore();
    });

    describe('#constructor', function () {

      it('should create Retail Rocket integrations with proper options and tags', function () {
        _assert2['default'].equal(options.partnerId, retailRocket.getOption('partnerId'));
        _assert2['default'].equal('script', retailRocket.getTag().type);
        _assert2['default'].ok(retailRocket.getTag().attr.src.indexOf('retailrocket.ru') > 0);
      });
    });

    describe('#initialize', function () {
      it('should initialize all methods', function () {
        _ddManager2['default'].initialize();
        _assert2['default'].ok(window.rrPartnerId, 'window.rrPartnerId is not defined');
        _assert2['default'].ok(window.rrApi, 'window.rrApi is not defined');
        _assert2['default'].ok(window.rrApiOnReady, 'window.rrApiOnReady is not defined');
        _assert2['default'].ok(typeof window.rrApi.addToBasket === 'function', 'window.rrApi.addToBasket is not a function');
        _assert2['default'].ok(typeof window.rrApi.order === 'function', 'window.rrApi.order is not a function');
        _assert2['default'].ok(typeof window.rrApi.categoryView === 'function', 'window.rrApi.categoryView is not a function');
        _assert2['default'].ok(typeof window.rrApi.view === 'function', 'window.rrApi.view is not a function');
        _assert2['default'].ok(typeof window.rrApi.recomMouseDown === 'function', 'window.rrApi.recomMouseDown is not a function');
        _assert2['default'].ok(typeof window.rrApi.recomAddToCart === 'function', 'window.rrApi.recomAddToCart is not a function');
      });

      it('should set window.rrPartnerUserId if possible', function () {
        window.digitalData.user.email = 'test@test.com';
        _ddManager2['default'].initialize();
        _assert2['default'].equal(window.rrPartnerUserId, 'test@test.com');
      });
    });
  });

  describe('after loading', function () {

    var prepareStubs = function prepareStubs() {
      window.rrApiOnReady.push = function (fn) {
        fn();
      };
      _sinon2['default'].stub(window.rrApi, 'addToBasket');
      _sinon2['default'].stub(window.rrApi, 'view');
      _sinon2['default'].stub(window.rrApi, 'categoryView');
      _sinon2['default'].stub(window.rrApi, 'order');
      _sinon2['default'].stub(window.rrApi, 'pageView');
      _sinon2['default'].stub(window.rrApi, 'search');
      _sinon2['default'].stub(window.rrApi, 'recomMouseDown');
      window.rrApi.setEmail = function () {};
      stubsPrepared = true;
    };

    var restoreStubs = function restoreStubs() {
      window.rrApi.addToBasket.restore();
      window.rrApi.view.restore();
      window.rrApi.categoryView.restore();
      window.rrApi.order.restore();
      window.rrApi.pageView.restore();
      window.rrApi.search.restore();
      window.rrApi.recomMouseDown.restore();
    };

    beforeEach(function (done) {
      _sinon2['default'].stub(retailRocket, 'load', function () {
        rrApi._initialize = function () {};
        retailRocket.onLoad();
      });

      _ddManager2['default'].once('ready', done);
      _ddManager2['default'].initialize();
      prepareStubs();
    });

    afterEach(function () {
      restoreStubs();
    });

    describe('#onViewedProductCategory', function () {

      it('should track "Viewed Product Category" with categoryId param', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          listing: {
            categoryId: '28'
          },
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.categoryView.calledOnce);
            done();
          }
        });
      });

      it('should throw validation error for "Viewed Product Category" event', function (done) {
        window.digitalData.page = {};
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          callback: function callback(results, errors) {
            _assert2['default'].ok(errors.length > 0);
            _assert2['default'].ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Viewed Product Category" if noConflict option is true', function (done) {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          listing: {
            categoryId: '28'
          },
          callback: function callback() {
            _assert2['default'].ok(!window.rrApi.categoryView.called);
            done();
          }
        });
      });
    });

    describe('#onViewedProductDetail', function () {

      it('should track "Viewed Product Detail" with product.id param', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '327'
          },
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.view.calledOnce);
            done();
          }
        });
      });

      it('should track "Viewed Product Detail" event with product param', function (done) {
        window.digitalData.page = {
          type: 'product'
        };
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: '327',
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.view.calledOnce);
            done();
          }
        });
      });

      it('should throw validation error for "Viewed Product Detail" event', function (done) {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          callback: function callback(results, errors) {
            _assert2['default'].ok(errors.length > 0);
            _assert2['default'].ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Viewed Product Detail" if noConflict option is true', function (done) {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '327'
          },
          callback: function callback() {
            _assert2['default'].ok(!window.rrApi.view.called);
            done();
          }
        });
      });
    });

    describe('#onAddedProduct', function () {

      it('should track "Added Product" with product.id param', function (done) {
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '327'
          },
          quantity: 1,
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.addToBasket.calledOnce);
            done();
          }
        });
      });

      it('should track "Added Product" event by product id', function (done) {
        window.digitalData.page = {
          type: 'product'
        };
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: '327',
          quantity: 1,
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.addToBasket.calledOnce);
            done();
          }
        });
      });

      it('should throw validation error for "Added Product" event', function (done) {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          callback: function callback(results, errors) {
            _assert2['default'].ok(errors.length > 0);
            _assert2['default'].ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Added Product" if noConflict option is true', function (done) {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '327'
          },
          quantity: 1,
          callback: function callback() {
            _assert2['default'].ok(!window.rrApi.addToBasket.called);
            done();
          }
        });
      });
    });

    describe('#onClickedProduct', function () {

      it('should track "Clicked Product" with product.id param', function (done) {
        retailRocket.setOption('listMethods', {
          recom1: 'Related'
        });
        window.digitalData.events.push({
          name: 'Clicked Product',
          category: 'Ecommerce',
          listItem: {
            product: {
              id: '327'
            },
            listName: 'recom1'
          },
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.recomMouseDown.calledWith('327', 'Related'));
            done();
          }
        });
      });

      it('should track "Clicked Product" event by product id', function (done) {
        retailRocket.setOption('listMethods', {
          recom1: 'Related'
        });
        window.digitalData.page = {
          type: 'product'
        };
        window.digitalData.recommendation = [{
          listName: 'recom1',
          items: [{
            id: '327'
          }]
        }];
        window.digitalData.events.push({
          name: 'Clicked Product',
          category: 'Ecommerce',
          listItem: {
            product: '327'
          },
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.recomMouseDown.calledWith('327', 'Related'));
            done();
          }
        });
      });

      it('should throw validation error for "Clicked Product" event', function (done) {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Clicked Product',
          category: 'Ecommerce',
          callback: function callback(results, errors) {
            _assert2['default'].ok(errors.length > 0);
            _assert2['default'].ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Clicked Product" event if listName is not defined for product', function (done) {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Clicked Product',
          category: 'Ecommerce',
          listItem: {
            product: {
              id: '327'
            }
          },
          callback: function callback(results, errors) {
            _assert2['default'].ok(!window.rrApi.recomMouseDown.called);
            done();
          }
        });
      });

      it('should not track "Clicked Product" event if list recommendation method is not defined for product', function (done) {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Clicked Product',
          category: 'Ecommerce',
          listItem: {
            product: {
              id: '327'
            },
            listName: 'recom1'
          },
          callback: function callback(results, errors) {
            _assert2['default'].ok(!window.rrApi.recomMouseDown.called);
            done();
          }
        });
      });

      it('should not track "Clicked Product" if noConflict option is true', function (done) {
        retailRocket.setOption('noConflict', true);
        retailRocket.setOption('listMethods', {
          recom1: 'Related'
        });
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '327',
            listName: 'recom1'
          },
          quantity: 1,
          callback: function callback() {
            _assert2['default'].ok(!window.rrApi.recomMouseDown.called);
            done();
          }
        });
      });
    });

    describe('#onCompletedTransaction', function () {

      it('should track "Completed Transaction" with transaction param', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: [{
              product: {
                id: '327',
                unitSalePrice: 245
              },
              quantity: 1
            }, {
              product: {
                id: '328',
                unitSalePrice: 245
              },
              quantity: 2
            }]
          },
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.order.calledOnce);
            done();
          }
        });
      });

      it('should track "Completed Transaction" with transaction param and product.unitPrice instead of product.unitSalePrice', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: [{
              product: {
                id: '327',
                unitPrice: 245
              },
              quantity: 1
            }, {
              product: {
                id: '328',
                unitPrice: 245
              },
              quantity: 2
            }]
          },
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.order.calledOnce);
            done();
          }
        });
      });

      it('should throw validation error for "Completed Transaction" event when missing transaction param', function (done) {
        (0, _deleteProperty2['default'])(window.digitalData, 'transaction');
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: function callback(results, errors) {
            _assert2['default'].ok(errors.length > 0);
            _assert2['default'].ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should throw validation error for "Completed Transaction" event when missing lineItems params', function (done) {
        window.digitalData.transaction = {
          orderId: '123'
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: function callback(results, errors) {
            _assert2['default'].ok(errors.length > 0);
            _assert2['default'].ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should throw validation error for "Completed Transaction" event when missing product.id params', function (done) {
        window.digitalData.transaction = {
          orderId: '123',
          lineItems: [{
            product: {}
          }, {
            product: {}
          }]
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: function callback(results, errors) {
            _assert2['default'].ok(errors.length > 0, 'There was no errors');
            _assert2['default'].ok(errors[0].code === 'validation_error', 'Error code is not correct');
            done();
          }
        });
      });

      it('should throw validation error for "Completed Transaction" event when missing lineItem quantity params', function (done) {
        window.digitalData.transaction = {
          orderId: '123',
          lineItems: [{
            product: {
              id: '327',
              unitSalePrice: 245
            }
          }, {
            product: {
              id: '328',
              unitSalePrice: 245
            }
          }]
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: function callback(results, errors) {
            _assert2['default'].ok(errors.length > 0, 'There was no errors');
            _assert2['default'].ok(errors[0].code === 'validation_error', 'Error code is not correct');
            done();
          }
        });
      });

      it('should throw validation error for "Completed Transaction" event when missing product.unitSalePrice params', function (done) {
        window.digitalData.transaction = {
          orderId: '123',
          lineItems: [{
            product: {
              id: '327'
            },
            quantity: 1
          }, {
            product: {
              id: '328'
            },
            quantity: 2
          }]
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: function callback(results, errors) {
            _assert2['default'].ok(errors.length > 0);
            _assert2['default'].ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Completed Transaction" if noConflict option is true', function (done) {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: [{
              product: {
                id: '327',
                unitSalePrice: 245
              },
              quantity: 1
            }, {
              product: {
                id: '328',
                unitSalePrice: 245
              },
              quantity: 2
            }]
          },
          callback: function callback() {
            _assert2['default'].ok(!window.rrApi.order.called);
            done();
          }
        });
      });
    });

    describe('#onSubscribed', function () {

      beforeEach(function () {
        _sinon2['default'].stub(window.rrApi, 'setEmail');
      });

      afterEach(function () {
        window.rrApi.setEmail.restore();
      });

      it('should track "Subscribed" with user.email param', function (done) {
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.setEmail.calledOnce);
            done();
          }
        });
      });

      it('should track "Subscribed" with user.email param and other custom params', function (done) {
        retailRocket.setOption('customVariables', {
          param1: 'eventParam1',
          param2: 'eventParam2',
          param3: 'user.firstName'
        });
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John Dow'
          },
          eventParam1: 'test1',
          eventParam2: true,
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.setEmail.calledWith('test@driveback.ru', {
              param1: 'test1',
              param2: 'true',
              param3: 'John Dow'
            }));
            done();
          }
        });
      });

      it('should track "Subscribed" event with user.email param  if noConflict is true', function (done) {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.setEmail.calledOnce);
            done();
          }
        });
      });

      it('should track "Subscribed" event with user.email param and other customs if noConflict is true', function (done) {
        retailRocket.setOption('noConflict', true);
        retailRocket.setOption('customVariables', {
          param1: 'eventParam1',
          param2: 'eventParam2',
          param3: 'user.firstName'
        });
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John Dow'
          },
          eventParam1: 'test1',
          eventParam2: true,
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.setEmail.calledWith('test@driveback.ru', {
              param1: 'test1',
              param2: 'true',
              param3: 'John Dow'
            }));
            done();
          }
        });
      });

      it('should throw validation error for "Subscribed" event', function (done) {
        window.digitalData.user = {};
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          callback: function callback(results, errors) {
            _assert2['default'].ok(errors.length > 0);
            _assert2['default'].ok(errors[0].code === 'validation_error');
            _assert2['default'].ok(!window.rrApi.setEmail.called);
            done();
          }
        });
      });

      it('should track email if user.email is set and user.isSubscribed is TRUE', function () {
        window.digitalData.user = {
          email: 'test@driveback.ru',
          isSubscribed: true
        };
        retailRocket.setOption('trackAllEmails', false);
        retailRocket.trackEmail();
        _assert2['default'].ok(window.rrApi.setEmail.calledOnce);
      });

      it('should NOT track email if user.email is set and user.isSubscribed is FALSE', function () {
        window.digitalData.user = {
          email: 'test@driveback.ru',
          isSubscribed: false
        };
        retailRocket.setOption('trackAllEmails', false);
        retailRocket.trackEmail();
        _assert2['default'].ok(!window.rrApi.setEmail.called);
      });

      it('should track email if user.email is set and user.isSubscribed is FALSE if trackAllEmail option is TRUE', function () {
        window.digitalData.user = {
          email: 'test@driveback.ru',
          isSubscribed: false
        };
        retailRocket.setOption('trackAllEmails', true);
        retailRocket.trackEmail();
        _assert2['default'].ok(window.rrApi.setEmail.calledOnce);
      });

      it('should update user.email if rr_setemail is set', function () {
        window.digitalData.user = {};

        _sinon2['default'].stub(retailRocket, 'getQueryString', function () {
          return '?rr_setemail=test@driveback.ru';
        });

        retailRocket.setOption('trackAllEmails', false);
        retailRocket.trackEmail();

        _assert2['default'].ok(window.digitalData.user.email === 'test@driveback.ru');
        retailRocket.getQueryString.restore();
      });

      it('should track email anytime user.email updated if trackAllEmails is TRUE', function (done) {
        retailRocket.setOption('trackAllEmails', true);
        window.digitalData.user = {
          email: 'test@driveback.ru'
        };

        // wait 101 while DDL changes listener will update to new state
        setTimeout(function () {
          _assert2['default'].ok(window.rrApi.setEmail.calledOnce);
          done();
        }, 101);
      });

      it('should NOT track email anytime user.email updated if trackAllEmails is FALSE', function (done) {
        retailRocket.setOption('trackAllEmails', false);
        window.digitalData.user = {
          email: 'test@driveback.ru'
        };

        setTimeout(function () {
          _assert2['default'].ok(!window.rrApi.setEmail.called);
          done();
        }, 101);
      });
    });

    describe('#onSearched', function () {

      it('should track "Searched" with query param', function (done) {
        window.digitalData.events.push({
          name: 'Searched',
          category: 'Content',
          listing: {
            query: 'Test query'
          },
          callback: function callback() {
            _assert2['default'].ok(window.rrApi.search.calledWith('Test query'));
            done();
          }
        });
      });

      it('should throw validation error for "Searched" event', function (done) {
        window.digitalData.events.push({
          name: 'Searched',
          category: 'Content',
          callback: function callback(results, errors) {
            _assert2['default'].ok(errors.length > 0);
            _assert2['default'].ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Searched" if noConflict option is true', function (done) {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Searched',
          category: 'Content',
          listing: {
            query: 'Test query'
          },
          callback: function callback() {
            _assert2['default'].ok(!window.rrApi.search.called);
            done();
          }
        });
      });
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/functions/deleteProperty.js":102,"./../../src/integrations/RetailRocket.js":125,"./../reset.js":152,"assert":1,"sinon":64}],148:[function(require,module,exports){
'use strict';

var _SegmentStream = require('./../../src/integrations/SegmentStream.js');

var _SegmentStream2 = _interopRequireDefault(_SegmentStream);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('SegmentStream', function () {

  var _ss = void 0;
  var options = {
    sessionLength: 60
  };

  beforeEach(function () {
    window.digitalData = {
      events: []
    };
    window.localStorage.clear(); // just to be sure
    _ss = new _SegmentStream2['default'](window.digitalData, options);
    _ddManager2['default'].addIntegration('SegmentStream', _ss);
  });

  afterEach(function () {
    _ss.reset();
    _ddManager2['default'].reset();
    (0, _reset2['default'])();
  });

  describe('before loading', function () {
    beforeEach(function () {
      _sinon2['default'].stub(_ss, 'load');
    });

    afterEach(function () {
      _ss.load.restore();
    });

    describe('#initialize', function () {

      it('it should initialize all stub functions`', function () {
        _ddManager2['default'].initialize({
          autoEvents: false
        });
        _ddManager2['default'].on('ready', function () {
          _assert2['default'].ok(window.ssApi.initialize);
          _assert2['default'].ok(window.ssApi.getData);
          _assert2['default'].ok(window.ssApi.getAnonymousId);
          _assert2['default'].ok(window.ssApi.track);
          _assert2['default'].ok(window.ssApi.pushOnReady);
          _assert2['default'].equal(window.ssApi[0][0], 'initialize');
          _assert2['default'].equal(window.ssApi[1][0], 'pushOnReady');
        });
      });
    });
  });

  describe('after loading', function () {
    beforeEach(function (done) {
      window.digitalData.user = {
        test: 'test',
        lifetimeVisitCount: 5
      };
      _ddManager2['default'].once('load', done);
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });

    describe('#enrichDigitalData', function () {

      it('should enrich digitalData.user', function () {
        _assert2['default'].equal(window.digitalData.user.test, 'test');
        _assert2['default'].equal(window.digitalData.user.lifetimeVisitCount, 5);
        _assert2['default'].equal(window.digitalData.user.ssAttributes.lifetimeVisitCount, 0);
        _assert2['default'].ok(window.digitalData.user.ssAttributes.firstVisit !== undefined);
        _assert2['default'].ok(window.digitalData.user.anonymousId);
      });

      it('should track Viewed Page semantic event', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          callback: function callback() {
            _assert2['default'].equal(window.digitalData.user.ssAttributes.lifetimeVisitCount, 1);
            done();
          }
        });
      });

      it('should track Viewed Product Detail semantic event', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitSalePrice: 100
          },
          callback: function callback() {
            _assert2['default'].equal(window.digitalData.user.ssAttributes.viewedProductsCount, 1);
            _assert2['default'].equal(window.digitalData.user.ssAttributes.lifetimeViewedProductsCount, 1);
            _assert2['default'].equal(window.digitalData.user.ssAttributes.lifetimeAverageViewedProductsPrice, 100);
            _assert2['default'].equal(window.digitalData.user.ssAttributes.averageViewedProductsPrice, 100);
            done();
          }
        });
      });

      it('should track Added Product semantic event', function (done) {
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitSalePrice: 100
          },
          callback: function callback() {
            _assert2['default'].equal(window.digitalData.user.ssAttributes.everAddedToCart, true);
            _assert2['default'].equal(window.digitalData.user.ssAttributes.addedToCart, true);
            done();
          }
        });
      });
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/integrations/SegmentStream.js":126,"./../reset.js":152,"assert":1,"sinon":64}],149:[function(require,module,exports){
'use strict';

var _SendPulse = require('./../../src/integrations/SendPulse.js');

var _SendPulse2 = _interopRequireDefault(_SendPulse);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _after = require('./../../src/functions/after.js');

var _after2 = _interopRequireDefault(_after);

var _deleteProperty = require('./../../src/functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('SendPulse', function () {

  var _sp = void 0;
  var options = {
    pushScriptUrl: '//cdn.sendpulse.com/js/push/e3f319c5d3eb82e6edce82a263b937d0_0.js'
  };

  beforeEach(function () {
    window.digitalData = {
      events: []
    };
    _sp = new _SendPulse2['default'](window.digitalData, options);
    _ddManager2['default'].addIntegration('SendPulse', _sp);
  });

  afterEach(function () {
    _sp.reset();
    _ddManager2['default'].reset();
    (0, _reset2['default'])();
  });

  describe('after loading', function () {

    beforeEach(function (done) {
      window.digitalData.user = {
        test: 'test',
        obj: {
          param1: 'test',
          param2: 'test'
        }
      };

      _sinon2['default'].stub(_sp, 'load', function (callback) {
        window.oSpP = {
          detectSite: function detectSite() {
            return true;
          },
          detectOs: function detectOs() {
            return 'Mac OS X';
          },
          detectBrowser: function detectBrowser() {
            return {
              name: 'Firefox',
              version: 44
            };
          },
          getDbValue: function getDbValue(param1, param2, callback) {
            setTimeout(function () {
              callback({
                target: {
                  result: {
                    type: 'SubscriptionId',
                    value: "v1/gAAAAABW9rF70jehdBnhO...O1DEYc0qZud-g-FdaW73j__"
                  }
                }
              });
            }, 0);
          },
          storeSubscription: function storeSubscription() {},
          push: function push(key, value) {},
          showPopUp: function showPopUp() {},
          startSubscription: function startSubscription() {},
          isServiceWorkerChromeSupported: function isServiceWorkerChromeSupported() {}
        };
        _sinon2['default'].stub(window.oSpP, 'push');
        callback();
      });

      _ddManager2['default'].once('ready', done);
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });

    afterEach(function () {
      _sp.load.restore();
    });

    describe('#enrichDigitalData', function () {

      it('should enrich digitalData.user', function () {
        _sp.on('enrich', function () {
          _assert2['default'].ok(window.digitalData.user.pushNotifications);
        });
      });

      it('should not support push notifications for IE and Edge', function () {
        _sp.on('enrich', function () {
          window.oSpP.detectBrowser = function () {
            return {
              name: 'Edge',
              version: '25.10'
            };
          };
          _assert2['default'].ok(!_sp.checkPushNotificationsSupport());
        });
      });
    });

    describe('digitalData changes', function () {

      afterEach(function () {
        window.oSpP.push.restore();
      });

      it('should add additional params to SendPulse once integration is initialized', function () {
        _sp.once('enrich', function () {
          _assert2['default'].ok(window.oSpP.push.calledWith('test', 'test'));
        });
      });

      it('should add additional params to SendPulse if user is subscribed', function (done) {
        _sp.once('enrich', function () {
          window.digitalData.user.city = 'New York';
          window.digitalData.user.isBoolean = true;
          window.digitalData.user.test = 'test';

          window.oSpP.push.restore();
          _sinon2['default'].spy(window.oSpP, 'push');
          setTimeout(function () {
            _assert2['default'].ok(window.oSpP.push.calledWith('city', 'New York'));
            _assert2['default'].ok(window.oSpP.push.calledWith('isBoolean', 'true'));
            _assert2['default'].ok(!window.oSpP.push.calledWith('test', 'test'));
            done();
          }, 101);
        });
      });

      it('should not add additional params to SendPulse if user is not subscribed', function (done) {
        _sp.once('enrich', function () {
          window.digitalData.user.pushNotifications.isSubscribed = false;
          window.oSpP.push.restore();
          _sinon2['default'].spy(window.oSpP, 'push');
          window.digitalData.user.city = 'New York';
          setTimeout(function () {
            _assert2['default'].ok(!window.oSpP.push.called);
            done();
          }, 100);
        });
      });
    });

    describe('oSpP.storeSubscription', function () {

      it('should send user attributes if any', function () {
        _sp.once('enrich', function () {
          window.digitalData.user.test = 'test';
          //sinon.spy(window.oSpP, 'push');
          window.oSpP.storeSubscription('DUMMY');
          _assert2['default'].ok(window.oSpP.push.calledWith('test', 'test'));
        });
      });
    });

    describe('#trackEvent', function () {

      it('should call oSpP.showPopUp', function (done) {
        _sinon2['default'].spy(window.oSpP, 'showPopUp');
        window.digitalData.events.push({
          name: 'Agreed to Receive Push Notifications',
          callback: function callback() {
            _assert2['default'].ok(window.oSpP.showPopUp.calledOnce);
            window.oSpP.showPopUp.restore();
            done();
          }
        });
      });

      it('should call oSpP.startSubscription', function (done) {
        window.oSpP.detectBrowser = function () {
          return {
            name: 'Safari',
            version: '9.0.3'
          };
        };
        window.oSpP.isSafariNotificationSupported = function () {
          return true;
        };
        _sinon2['default'].spy(window.oSpP, 'startSubscription');
        window.digitalData.events.push({
          name: 'Agreed to Receive Push Notifications',
          callback: function callback() {
            _assert2['default'].ok(window.oSpP.startSubscription.calledOnce);
            window.oSpP.startSubscription.restore();
            done();
          }
        });
      });

      it('should call oSpP.startSubscription for https website', function (done) {
        _sinon2['default'].stub(_sp, 'isHttps', function () {
          return true;
        });
        window.oSpP.isServiceWorkerChromeSupported = function () {
          return true;
        };
        _sinon2['default'].spy(window.oSpP, 'startSubscription');
        window.digitalData.events.push({
          name: 'Agreed to Receive Push Notifications',
          callback: function callback() {
            _assert2['default'].ok(window.oSpP.startSubscription.calledOnce);
            window.oSpP.startSubscription.restore();
            done();
          }
        });
        _sp.isHttps.restore();
      });
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/functions/after.js":101,"./../../src/functions/deleteProperty.js":102,"./../../src/integrations/SendPulse.js":127,"./../reset.js":152,"assert":1,"sinon":64}],150:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _Vkontakte = require('./../../src/integrations/Vkontakte.js');

var _Vkontakte2 = _interopRequireDefault(_Vkontakte);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('Integrations: Vkontakte', function () {

  var vk = void 0;
  var options = {
    eventPixels: {
      'Viewed Product Detail': '//vk.com/rtrg?r=Ug6K6tdSZ*shxgTtjsI9bzDBp1ShCs3q3RdXVNHK1asqy2mLKDvJxuvWw8M7hqktulxtbSlnJsT7*/7Jf5MzEfqO3K5TF9z2zwlFLTuWCy3PiRkO9Ga1I6yOoseM*lfVbhVlQRoHjI5Bt66fOiB1TZLJEZ5nGwFALsuVd5WmSrk-'
    }
  };

  beforeEach(function () {
    window.digitalData = {
      page: {},
      user: {},
      events: []
    };
    vk = new _Vkontakte2['default'](window.digitalData, options);
    _ddManager2['default'].addIntegration('Vkontakte', vk);
  });

  afterEach(function () {
    vk.reset();
    _ddManager2['default'].reset();
    (0, _reset2['default'])();
  });

  describe('before loading', function () {

    describe('#constructor', function () {
      it('should add proper options', function () {
        _assert2['default'].equal(options.eventPixels, vk.getOption('eventPixels'));
      });
    });

    describe('#initialize', function () {
      it('should call ready after initialization', function () {
        _sinon2['default'].stub(vk, 'onLoad');
        _ddManager2['default'].initialize();
        _assert2['default'].ok(vk.onLoad.calledOnce);
        vk.onLoad.restore();
      });
    });
  });

  describe('loading', function () {
    it('should load', function (done) {
      _assert2['default'].ok(!vk.isLoaded());
      _ddManager2['default'].once('load', function () {
        _assert2['default'].ok(vk.isLoaded());
        done();
      });
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });
  });

  describe('after loading', function () {
    beforeEach(function (done) {
      _sinon2['default'].spy(vk, 'addPixel');
      _ddManager2['default'].once('ready', done);
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });

    afterEach(function () {
      vk.addPixel.restore();
    });

    describe('#onAnyEvent', function () {
      it('should add pixel to the page', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          page: {},
          callback: function callback() {
            _assert2['default'].ok(vk.addPixel.called);
            done();
          }
        });
      });

      it('should not add pixel to the page', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product',
          category: 'Ecommerce',
          page: {},
          callback: function callback() {
            _assert2['default'].ok(!vk.addPixel.called);
            done();
          }
        });
      });
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/integrations/Vkontakte.js":128,"./../reset.js":152,"assert":1,"sinon":64}],151:[function(require,module,exports){
'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _reset = require('./../reset.js');

var _reset2 = _interopRequireDefault(_reset);

var _YandexMetrica = require('./../../src/integrations/YandexMetrica.js');

var _YandexMetrica2 = _interopRequireDefault(_YandexMetrica);

var _ddManager = require('./../../src/ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

describe('Integrations: Yandex Metrica', function () {

  var ym = void 0;
  var options = {
    counterId: '37510050',
    clickmap: true,
    webvisor: true,
    trackLinks: false,
    trackHash: true,
    purchaseGoalId: '20185850',
    goals: {
      'Test Event': 'GOAL1'
    },
    noConflict: false
  };

  beforeEach(function () {
    window.digitalData = {
      page: {},
      user: {},
      events: []
    };
    ym = new _YandexMetrica2['default'](window.digitalData, options);
    _ddManager2['default'].addIntegration('YandexMetrica', ym);
  });

  afterEach(function () {
    ym.reset();
    _ddManager2['default'].reset();
    (0, _reset2['default'])();
  });

  describe('before loading', function () {
    beforeEach(function () {
      _sinon2['default'].stub(ym, 'load');
    });

    afterEach(function () {
      ym.load.restore();
    });

    describe('#constructor', function () {
      it('should add proper tags and options', function () {
        _assert2['default'].equal(options.counterId, ym.getOption('counterId'));
        _assert2['default'].equal(options.clickmap, ym.getOption('clickmap'));
        _assert2['default'].equal(options.webvisor, ym.getOption('webvisor'));
        _assert2['default'].equal(options.trackLinks, ym.getOption('trackLinks'));
        _assert2['default'].equal(options.trackHash, ym.getOption('trackHash'));
        _assert2['default'].equal(options.purchaseGoalId, ym.getOption('purchaseGoalId'));
        _assert2['default'].deepEqual(options.goals, ym.getOption('goals'));
        _assert2['default'].equal('script', ym.getTag().type);
        _assert2['default'].equal(ym.getTag().attr.src, '//mc.yandex.ru/metrika/watch.js');
      });
    });

    describe('#initialize', function () {
      it('should initialize yandex metrica queue object', function () {
        _ddManager2['default'].initialize();
        _assert2['default'].ok(window.yandex_metrika_callbacks);
        _assert2['default'].ok(window.yandex_metrika_callbacks.push);
        _assert2['default'].ok(window.yandex_metrika_callbacks.length, 1);
      });

      it('should call tags load after initialization', function () {
        _ddManager2['default'].initialize();
        _assert2['default'].ok(ym.load.calledOnce);
      });
    });
  });

  describe('loading', function () {
    beforeEach(function () {
      _sinon2['default'].stub(ym, 'load', function () {
        window.Ya = {};
        window.Ya.Metrika = function (options) {
          _assert2['default'].equal(options.id, ym.getOption('counterId'));
          _assert2['default'].equal(options.clickmap, ym.getOption('clickmap'));
          _assert2['default'].equal(options.webvisor, ym.getOption('webvisor'));
          _assert2['default'].equal(options.trackLinks, ym.getOption('trackLinks'));
          _assert2['default'].equal(options.trackHash, ym.getOption('trackHash'));
        };
        window.yandex_metrika_callbacks.pop()();
        ym.onLoad();
      });
    });

    afterEach(function () {
      ym.load.restore();
    });

    it('should load', function (done) {
      _assert2['default'].ok(!ym.isLoaded());
      _ddManager2['default'].once('load', function () {
        _assert2['default'].ok(ym.isLoaded());
        done();
      });
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });
  });

  describe('after loading', function () {
    beforeEach(function (done) {
      _sinon2['default'].stub(ym, 'load', function () {
        window.Ya = {};
        window.Ya.Metrika = function () {
          this.reachGoal = function () {};
        };
        window.yandex_metrika_callbacks.pop()();
        ym.onLoad();
      });
      _ddManager2['default'].once('ready', done);
      _ddManager2['default'].initialize({
        autoEvents: false
      });
    });

    afterEach(function () {
      ym.load.restore();
    });

    describe('#onViewedProductDetail', function () {
      it('should push product detail into dataLayer', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            name: 'Test Product',
            manufacturer: 'Test Brand',
            category: 'Category 1',
            subcategory: 'Subcategory 1',
            voucher: 'VOUCHER1',
            unitSalePrice: 1500,
            variant: 'Variant 1'
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.dataLayer[0], {
              ecommerce: {
                detail: {
                  products: [{
                    id: '123',
                    name: 'Test Product',
                    price: 1500,
                    brand: 'Test Brand',
                    category: 'Category 1/Subcategory 1',
                    coupon: 'VOUCHER1',
                    variant: 'Variant 1'
                  }]
                }
              }
            });
            done();
          }
        });
      });

      it('should not push product detail into dataLayer if product ID or product name is not defined', function (done) {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            price: 1500
          },
          callback: function callback() {
            _assert2['default'].ok(!window.dataLayer[0]);
            done();
          }
        });
      });

      it('should not push product detail into dataLayer event if noConflict option is true', function (done) {
        ym.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: function callback() {
            _assert2['default'].ok(!window.dataLayer[0]);
            done();
          }
        });
      });
    });

    describe('#onAddedProduct', function () {
      it('should push added product into dataLayer', function (done) {
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '123',
            name: 'Test Product',
            manufacturer: 'Test Brand',
            category: 'Category 1',
            subcategory: 'Subcategory 1',
            voucher: 'VOUCHER1',
            unitSalePrice: 1500,
            variant: 'Variant 1'
          },
          quantity: 3,
          callback: function callback() {
            _assert2['default'].deepEqual(window.dataLayer[0], {
              ecommerce: {
                add: {
                  products: [{
                    id: '123',
                    name: 'Test Product',
                    price: 1500,
                    brand: 'Test Brand',
                    category: 'Category 1/Subcategory 1',
                    coupon: 'VOUCHER1',
                    variant: 'Variant 1',
                    quantity: 3
                  }]
                }
              }
            });
            done();
          }
        });
      });

      it('should not push added product into dataLayer if product ID or product name is not defined', function (done) {
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            price: 1500
          },
          callback: function callback() {
            _assert2['default'].ok(!window.dataLayer[0]);
            done();
          }
        });
      });

      it('should not push added product into dataLayer event if noConflict option is true', function (done) {
        ym.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: function callback() {
            _assert2['default'].ok(!window.dataLayer[0]);
            done();
          }
        });
      });
    });

    describe('#onRemovedProduct', function () {
      it('should push removed product into dataLayer', function (done) {
        window.digitalData.events.push({
          name: 'Removed Product',
          category: 'Ecommerce',
          product: {
            id: '123',
            name: 'Test Product',
            manufacturer: 'Test Brand',
            category: 'Category 1',
            subcategory: 'Subcategory 1',
            voucher: 'VOUCHER1',
            unitSalePrice: 1500,
            variant: 'Variant 1'
          },
          quantity: 3,
          callback: function callback() {
            _assert2['default'].deepEqual(window.dataLayer[0], {
              ecommerce: {
                remove: {
                  products: [{
                    id: '123',
                    name: 'Test Product',
                    category: 'Category 1/Subcategory 1',
                    quantity: 3
                  }]
                }
              }
            });
            done();
          }
        });
      });

      it('should not push removed product into dataLayer if product ID or product name is not defined', function (done) {
        window.digitalData.events.push({
          name: 'Removed Product',
          category: 'Ecommerce',
          product: {
            price: 1500
          },
          callback: function callback() {
            _assert2['default'].ok(!window.dataLayer[0]);
            done();
          }
        });
      });

      it('should not push removed product into dataLayer event if noConflict option is true', function (done) {
        ym.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Removed Product',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: function callback() {
            _assert2['default'].ok(!window.dataLayer[0]);
            done();
          }
        });
      });
    });

    describe('#onCompletedTransaction', function () {
      var lineItems = [{
        product: {
          id: '123',
          unitSalePrice: 100
        },
        quantity: 1
      }, {
        product: {
          id: '234',
          unitPrice: 100,
          unitSalePrice: 50
        },
        quantity: 2
      }, {
        product: {
          name: 'Test Product',
          unitPrice: 30
        }
      }, {
        product: {
          unitPrice: 30
        }
      }, {
        product: {}
      }];

      it('should push purchase information into dataLayer', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            vouchers: ['VOUCHER1'],
            lineItems: lineItems,
            total: 1500
          },
          callback: function callback() {
            _assert2['default'].deepEqual(window.dataLayer[0], {
              ecommerce: {
                purchase: {
                  actionField: {
                    id: '123',
                    goal_id: options.purchaseGoalId,
                    coupon: 'VOUCHER1',
                    revenue: 1500
                  },
                  products: [{
                    id: '123',
                    price: 100,
                    quantity: 1
                  }, {
                    id: '234',
                    price: 50,
                    quantity: 2
                  }, {
                    name: 'Test Product',
                    price: 30,
                    quantity: 1
                  }]
                }
              }
            });
            done();
          }
        });
      });

      it('should not purchase information into dataLayer if transaction object is not defined', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: function callback() {
            _assert2['default'].ok(!window.dataLayer[0]);
            done();
          }
        });
      });

      it('should not purchase information into dataLayer if transaction object is no orderId', function (done) {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            lineItems: [{
              product: {
                id: '123',
                unitSalePrice: 100
              },
              quantity: 1
            }]
          },
          callback: function callback() {
            _assert2['default'].ok(!window.dataLayer[0]);
            done();
          }
        });
      });

      it('should not send trackTransaction event if noConflict option is true', function (done) {
        ym.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: function callback() {
            _assert2['default'].ok(!window.dataLayer[0]);
            done();
          }
        });
      });
    });

    describe('Custom Goal', function () {
      it('should track custom event as a goal', function (done) {
        _sinon2['default'].stub(ym.yaCounter, 'reachGoal');
        window.digitalData.events.push({
          name: 'Test Event',
          callback: function callback() {
            _assert2['default'].ok(ym.yaCounter.reachGoal.calledWith('GOAL1'));
            done();
          }
        });
      });

      it('should not track custom event as a goal', function (done) {
        _sinon2['default'].stub(ym.yaCounter, 'reachGoal');
        window.digitalData.events.push({
          name: 'Test Event 2',
          callback: function callback() {
            _assert2['default'].ok(!ym.yaCounter.reachGoal.called);
            done();
          }
        });
      });
    });
  });
});

},{"./../../src/ddManager.js":100,"./../../src/integrations/YandexMetrica.js":129,"./../reset.js":152,"assert":1,"sinon":64}],152:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = reset;
function reset() {
  window.digitalData = {};
  window.ddListener = undefined;
  window.ddManager = undefined;
}

},{}],153:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function () {
  // Create a queue, but don't obliterate an existing one!
  var ddManager = window.ddManager = window.ddManager || [];
  var ddListener = window.ddListener = window.ddListener || [];
  var digitalData = window.digitalData = window.digitalData || {};
  digitalData.events = digitalData.events || [];

  // If the real ddManager is already on the page return.
  if (ddManager.initialize) return;

  // If the snippet was invoked already show an error.
  if (ddManager.invoked) {
    if (window.console && console.error) {
      console.error('Digital Data Manager snippet included twice.');
    }
    return;
  }
  // Invoked flag, to make sure the snippet
  // is never invoked twice.
  ddManager.invoked = true;

  // A list of the methods in Analytics.js to stub.
  ddManager.methods = ['initialize', 'addIntegration', 'on', 'once', 'off'];

  // Define a factory to create stubs. These are placeholders
  // for methods in Digital Data Manager so that you never have to wait
  // for it to load to actually record data. The `method` is
  // stored as the first argument, so we can replay the data.
  ddManager.factory = function (method) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(method);
      ddManager.push(args);
      return ddManager;
    };
  };

  // For each of our methods, generate a queueing stub.
  for (var i = 0; i < ddManager.methods.length; i++) {
    var key = ddManager.methods[i];
    ddManager[key] = ddManager.factory(key);
  }
};

},{}]},{},[138])
//# sourceMappingURL=dd-manager-test.js.map
