(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.async = global.async || {})));
}(this, function (exports) { 'use strict';

    /**
     * This method returns the first argument it receives.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'a': 1 };
     *
     * console.log(_.identity(object) === object);
     * // => true
     */
    function identity(value) {
      return value;
    }

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
      switch (args.length) {
        case 0: return func.call(thisArg);
        case 1: return func.call(thisArg, args[0]);
        case 2: return func.call(thisArg, args[0], args[1]);
        case 3: return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max;

    /**
     * A specialized version of `baseRest` which transforms the rest array.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @param {Function} transform The rest array transform.
     * @returns {Function} Returns the new function.
     */
    function overRest(func, start, transform) {
      start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            array = Array(length);

        while (++index < length) {
          array[index] = args[start + index];
        }
        index = -1;
        var otherArgs = Array(start + 1);
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = transform(array);
        return apply(func, this, otherArgs);
      };
    }

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
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
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
      return value != null && (type == 'object' || type == 'function');
    }

    var funcTag = '[object Function]';
    var genTag = '[object GeneratorFunction]';
    var proxyTag = '[object Proxy]';
    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto$1.toString;

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
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
      // in Safari 9 which returns 'object' for typed array and other constructors.
      var tag = isObject(value) ? objectToString.call(value) : '';
      return tag == funcTag || tag == genTag || tag == proxyTag;
    }

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || Function('return this')();

    /** Used to detect overreaching core-js shims. */
    var coreJsData = root['__core-js_shared__'];

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    /** Used for built-in method references. */
    var funcProto$1 = Function.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString$1 = funcProto$1.toString;

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to process.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString$1.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used for built-in method references. */
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }

    /**
     * Gets the value at `key` of `object`.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function getValue(object, key) {
      return object == null ? undefined : object[key];
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : undefined;
    }

    var defineProperty = (function() {
      try {
        var func = getNative(Object, 'defineProperty');
        func({}, '', {});
        return func;
      } catch (e) {}
    }());

    /**
     * The base implementation of `setToString` without support for hot loop shorting.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var baseSetToString = !defineProperty ? identity : function(func, string) {
      return defineProperty(func, 'toString', {
        'configurable': true,
        'enumerable': false,
        'value': constant(string),
        'writable': true
      });
    };

    /** Used to detect hot functions by number of calls within a span of milliseconds. */
    var HOT_COUNT = 500;
    var HOT_SPAN = 16;
    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeNow = Date.now;

    /**
     * Creates a function that'll short out and invoke `identity` instead
     * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
     * milliseconds.
     *
     * @private
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new shortable function.
     */
    function shortOut(func) {
      var count = 0,
          lastCalled = 0;

      return function() {
        var stamp = nativeNow(),
            remaining = HOT_SPAN - (stamp - lastCalled);

        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return arguments[0];
          }
        } else {
          count = 0;
        }
        return func.apply(undefined, arguments);
      };
    }

    /**
     * Sets the `toString` method of `func` to return `string`.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var setToString = shortOut(baseSetToString);

    /**
     * The base implementation of `_.rest` which doesn't validate or coerce arguments.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     */
    function baseRest(func, start) {
      return setToString(overRest(func, start, identity), func + '');
    }

    function initialParams (fn) {
        return baseRest(function (args /*..., callback*/) {
            var callback = args.pop();
            fn.call(this, args, callback);
        });
    }

    function applyEach$1(eachfn) {
        return baseRest(function (fns, args) {
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

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
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
      return value != null && isLength(value.length) && !isFunction(value);
    }

    /**
     * This method returns `undefined`.
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
      return value != null && typeof value == 'object';
    }

    /** `Object#toString` result references. */
    var argsTag = '[object Arguments]';

    /** Used for built-in method references. */
    var objectProto$4 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$1 = objectProto$4.toString;

    /**
     * The base implementation of `_.isArguments`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     */
    function baseIsArguments(value) {
      return isObjectLike(value) && objectToString$1.call(value) == argsTag;
    }

    /** Used for built-in method references. */
    var objectProto$3 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

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
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty$2.call(value, 'callee') &&
        !propertyIsEnumerable.call(value, 'callee');
    };

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array, else `false`.
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

    /**
     * This method returns `false`.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {boolean} Returns `false`.
     * @example
     *
     * _.times(2, _.stubFalse);
     * // => [false, false]
     */
    function stubFalse() {
      return false;
    }

    /** Detect free variable `exports`. */
    var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports = freeModule && freeModule.exports === freeExports;

    /** Built-in value references. */
    var Buffer = moduleExports ? root.Buffer : undefined;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

    /**
     * Checks if `value` is a buffer.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
     * @example
     *
     * _.isBuffer(new Buffer(2));
     * // => true
     *
     * _.isBuffer(new Uint8Array(2));
     * // => false
     */
    var isBuffer = nativeIsBuffer || stubFalse;

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

    var argsTag$1 = '[object Arguments]';
    var arrayTag = '[object Array]';
    var boolTag = '[object Boolean]';
    var dateTag = '[object Date]';
    var errorTag = '[object Error]';
    var funcTag$1 = '[object Function]';
    var mapTag = '[object Map]';
    var numberTag = '[object Number]';
    var objectTag = '[object Object]';
    var regexpTag = '[object RegExp]';
    var setTag = '[object Set]';
    var stringTag = '[object String]';
    var weakMapTag = '[object WeakMap]';
    var arrayBufferTag = '[object ArrayBuffer]';
    var dataViewTag = '[object DataView]';
    var float32Tag = '[object Float32Array]';
    var float64Tag = '[object Float64Array]';
    var int8Tag = '[object Int8Array]';
    var int16Tag = '[object Int16Array]';
    var int32Tag = '[object Int32Array]';
    var uint8Tag = '[object Uint8Array]';
    var uint8ClampedTag = '[object Uint8ClampedArray]';
    var uint16Tag = '[object Uint16Array]';
    var uint32Tag = '[object Uint32Array]';
    /** Used to identify `toStringTag` values of typed arrays. */
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
    typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
    typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
    typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
    typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
    typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
    typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
    typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
    typedArrayTags[mapTag] = typedArrayTags[numberTag] =
    typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
    typedArrayTags[setTag] = typedArrayTags[stringTag] =
    typedArrayTags[weakMapTag] = false;

    /** Used for built-in method references. */
    var objectProto$5 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$2 = objectProto$5.toString;

    /**
     * The base implementation of `_.isTypedArray` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     */
    function baseIsTypedArray(value) {
      return isObjectLike(value) &&
        isLength(value.length) && !!typedArrayTags[objectToString$2.call(value)];
    }

    /**
     * The base implementation of `_.unary` without support for storing metadata.
     *
     * @private
     * @param {Function} func The function to cap arguments for.
     * @returns {Function} Returns the new capped function.
     */
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }

    /** Detect free variable `exports`. */
    var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

    /** Detect free variable `process` from Node.js. */
    var freeProcess = moduleExports$1 && freeGlobal.process;

    /** Used to access faster Node.js helpers. */
    var nodeUtil = (function() {
      try {
        return freeProcess && freeProcess.binding('util');
      } catch (e) {}
    }());

    /* Node.js helper references. */
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

    /** Used for built-in method references. */
    var objectProto$2 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

    /**
     * Creates an array of the enumerable property names of the array-like `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @param {boolean} inherited Specify returning inherited property names.
     * @returns {Array} Returns the array of property names.
     */
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value),
          isArg = !isArr && isArguments(value),
          isBuff = !isArr && !isArg && isBuffer(value),
          isType = !isArr && !isArg && !isBuff && isTypedArray(value),
          skipIndexes = isArr || isArg || isBuff || isType,
          result = skipIndexes ? baseTimes(value.length, String) : [],
          length = result.length;

      for (var key in value) {
        if ((inherited || hasOwnProperty$1.call(value, key)) &&
            !(skipIndexes && (
               // Safari 9 has enumerable `arguments.length` in strict mode.
               key == 'length' ||
               // Node.js 0.10 has enumerable non-index properties on buffers.
               (isBuff && (key == 'offset' || key == 'parent')) ||
               // PhantomJS 2 has enumerable non-index properties on typed arrays.
               (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
               // Skip index properties.
               isIndex(key, length)
            ))) {
          result.push(key);
        }
      }
      return result;
    }

    /** Used for built-in method references. */
    var objectProto$7 = Object.prototype;

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$7;

      return value === proto;
    }

    /**
     * Creates a unary function that invokes `func` with its argument transformed.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {Function} transform The argument transform.
     * @returns {Function} Returns the new function.
     */
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeKeys = overArg(Object.keys, Object);

    /** Used for built-in method references. */
    var objectProto$6 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$3 = objectProto$6.hasOwnProperty;

    /**
     * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty$3.call(object, key) && key != 'constructor') {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
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
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
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

    // eachOf implementation optimized for array-likes
    function eachOfArrayLike(coll, iteratee, callback) {
        callback = once(callback || noop);
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
     * argument, `fns`, then it will return a function which lets you pass in the
     * arguments as if it were a single function call. If more arguments are
     * provided, `callback` is required while `args` is still optional.
     *
     * @name applyEach
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Array|Iterable|Object} fns - A collection of asynchronous functions
     * to all call with the same arguments
     * @param {...*} [args] - any number of separate arguments to pass to the
     * function.
     * @param {Function} [callback] - the final argument should be the callback,
     * called when all functions have completed processing.
     * @returns {Function} - If only the first argument, `fns`, is provided, it will
     * return a function which lets you pass in the arguments as if it were a single
     * function call. The signature is `(..args, callback)`. If invoked with any
     * arguments, `callback` is required.
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
    var apply$1 = baseRest(function (fn, args) {
        return baseRest(function (callArgs) {
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
     * The base implementation of `_.findIndex` and `_.findLastIndex` without
     * support for iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} predicate The function invoked per iteration.
     * @param {number} fromIndex The index to search from.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length,
          index = fromIndex + (fromRight ? 1 : -1);

      while ((fromRight ? index-- : ++index < length)) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `_.isNaN` without support for number objects.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
     */
    function baseIsNaN(value) {
      return value !== value;
    }

    /**
     * A specialized version of `_.indexOf` which performs strict equality
     * comparisons of values, i.e. `===`.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function strictIndexOf(array, value, fromIndex) {
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
     * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseIndexOf(array, value, fromIndex) {
      return value === value
        ? strictIndexOf(array, value, fromIndex)
        : baseFindIndex(array, baseIsNaN, fromIndex);
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

            var taskCallback = onlyOnce(baseRest(function (err, args) {
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

    /** Built-in value references. */
    var Symbol$1 = root.Symbol;

    /** `Object#toString` result references. */
    var symbolTag = '[object Symbol]';

    /** Used for built-in method references. */
    var objectProto$8 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$3 = objectProto$8.toString;

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
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
        (isObjectLike(value) && objectToString$3.call(value) == symbolTag);
    }

    /** Used as references for various `Number` constants. */
    var INFINITY = 1 / 0;

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
      if (isArray(value)) {
        // Recursively convert values (susceptible to call stack limits).
        return arrayMap(value, baseToString) + '';
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : '';
      }
      var result = (value + '');
      return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
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

    /**
     * Converts an ASCII `string` to an array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the converted array.
     */
    function asciiToArray(string) {
      return string.split('');
    }

    /** Used to compose unicode character classes. */
    var rsAstralRange = '\\ud800-\\udfff';
    var rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23';
    var rsComboSymbolsRange = '\\u20d0-\\u20f0';
    var rsVarRange = '\\ufe0e\\ufe0f';
    /** Used to compose unicode capture groups. */
    var rsZWJ = '\\u200d';

    /** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
    var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboMarksRange + rsComboSymbolsRange + rsVarRange + ']');

    /**
     * Checks if `string` contains Unicode symbols.
     *
     * @private
     * @param {string} string The string to inspect.
     * @returns {boolean} Returns `true` if a symbol is found, else `false`.
     */
    function hasUnicode(string) {
      return reHasUnicode.test(string);
    }

    /** Used to compose unicode character classes. */
    var rsAstralRange$1 = '\\ud800-\\udfff';
    var rsComboMarksRange$1 = '\\u0300-\\u036f\\ufe20-\\ufe23';
    var rsComboSymbolsRange$1 = '\\u20d0-\\u20f0';
    var rsVarRange$1 = '\\ufe0e\\ufe0f';
    var rsAstral = '[' + rsAstralRange$1 + ']';
    var rsCombo = '[' + rsComboMarksRange$1 + rsComboSymbolsRange$1 + ']';
    var rsFitz = '\\ud83c[\\udffb-\\udfff]';
    var rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')';
    var rsNonAstral = '[^' + rsAstralRange$1 + ']';
    var rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}';
    var rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]';
    var rsZWJ$1 = '\\u200d';
    var reOptMod = rsModifier + '?';
    var rsOptVar = '[' + rsVarRange$1 + ']?';
    var rsOptJoin = '(?:' + rsZWJ$1 + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*';
    var rsSeq = rsOptVar + reOptMod + rsOptJoin;
    var rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';
    /** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
    var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

    /**
     * Converts a Unicode `string` to an array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the converted array.
     */
    function unicodeToArray(string) {
      return string.match(reUnicode) || [];
    }

    /**
     * Converts `string` to an array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the converted array.
     */
    function stringToArray(string) {
      return hasUnicode(string)
        ? unicodeToArray(string)
        : asciiToArray(string);
    }

    /**
     * Converts `value` to a string. An empty string is returned for `null`
     * and `undefined` values. The sign of `-0` is preserved.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
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
    var reTrim = /^\s+|\s+$/g;

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
        return string.replace(reTrim, '');
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
        return baseRest(function (fn, args) {
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

            for (var i = 0, l = data.length; i < l; i++) {
                var item = {
                    data: data[i],
                    callback: callback || noop
                };

                if (insertAtFront) {
                    q._tasks.unshift(item);
                } else {
                    q._tasks.push(item);
                }
            }
            setImmediate$1(q.process);
        }

        function _next(tasks) {
            return baseRest(function (args) {
                workers -= 1;

                for (var i = 0, l = tasks.length; i < l; i++) {
                    var task = tasks[i];
                    var index = baseIndexOf(workersList, task, 0);
                    if (index >= 0) {
                        workersList.splice(index);
                    }

                    task.callback.apply(task, args);

                    if (args[0] != null) {
                        q.error(args[0], task.data);
                    }
                }

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
    var seq = baseRest(function seq(functions) {
        return baseRest(function (args) {
            var that = this;

            var cb = args[args.length - 1];
            if (typeof cb == 'function') {
                args.pop();
            } else {
                cb = noop;
            }

            reduce(functions, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([baseRest(function (err, nextargs) {
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
    var compose = baseRest(function (args) {
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
    var constant$1 = baseRest(function (values) {
        var args = [null].concat(values);
        return initialParams(function (ignoredArgs, callback) {
            return callback.apply(this, args);
        });
    });

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
        return baseRest(function (fn, args) {
            fn.apply(null, args.concat([baseRest(function (err, args) {
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

        var next = baseRest(function (err, args) {
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
     * execution of `iteratee`. Invoked with the non-error callback results of 
     * `iteratee`.
     * @param {Function} [callback] - A callback which is called after the test
     * function has failed and repeated execution of `iteratee` has stopped.
     * `callback` will be passed an error and any arguments passed to the final
     * `iteratee`'s callback. Invoked with (err, [results]);
     */
    function doWhilst(iteratee, test, callback) {
        callback = onlyOnce(callback || noop);
        var next = baseRest(function (err, args) {
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
     * @param {Array|Iterable|Object} coll - A collection to iterate over.
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
                fn.apply(null, args.concat([baseRest(function (args) {
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
            task(baseRest(function (err, args) {
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

            for (var i = 0, l = data.length; i < l; i++) {
                var item = {
                    data: data[i],
                    priority: priority,
                    callback: callback
                };

                if (nextNode) {
                    q._tasks.insertBefore(nextNode, item);
                } else {
                    q._tasks.push(item);
                }
            }
            setImmediate$1(q.process);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    }

    /**
     * Runs the `tasks` array of functions in parallel, without waiting until the
     * previous function has completed. Once any of the `tasks` complete or pass an
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
        for (var i = 0, l = tasks.length; i < l; i++) {
            tasks[i](callback);
        }
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
            args.push(baseRest(function callback(err, cbArgs) {
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
     * * `errorFilter` - An optional synchronous function that is invoked on
     *   erroneous result. If it returns `true` the retry attempts will continue;
     *   if the function returns `false` the retry flow is aborted with the current
     *   attempt's error and result being returned to the final callback.
     *   Invoked with (err).
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
     * // try calling apiMethod only when error condition satisfies, all other
     * // errors will abort the retry control flow and return to final callback
     * async.retry({
     *   errorFilter: function(err) {
     *     return err.message === 'Temporary error'; // only retry on a specific error
     *   }
     * }, apiMethod, function(err, result) {
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
     *
     */
    function retry(opts, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var options = {
            times: DEFAULT_TIMES,
            intervalFunc: constant(DEFAULT_INTERVAL)
        };

        function parseTimes(acc, t) {
            if (typeof t === 'object') {
                acc.times = +t.times || DEFAULT_TIMES;

                acc.intervalFunc = typeof t.interval === 'function' ? t.interval : constant(+t.interval || DEFAULT_INTERVAL);

                acc.errorFilter = t.errorFilter;
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
                if (err && attempt++ < options.times && (typeof options.errorFilter != 'function' || options.errorFilter(err))) {
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
     * the control flow functions. Invoke this function with the same
     * parameters as you would `asyncFunc`.
     * @example
     *
     * function myFunction(foo, callback) {
     *     doAsyncTask(foo, function(err, data) {
     *         // handle errors
     *         if (err) return callback(err);
     *
     *         // do some stuff ...
     *
     *         // return processed data
     *         return callback(null, data);
     *     });
     * }
     *
     * var wrapped = async.timeout(myFunction, 1000);
     *
     * // call `wrapped` as you would `myFunction`
     * wrapped({ bar: 'bar' }, function(err, data) {
     *     // if `myFunction` takes < 1000 ms to execute, `err`
     *     // and `data` will have their expected values
     *
     *     // else `err` will be an Error with the code 'ETIMEDOUT'
     * });
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
     * coerce arguments.
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
     * Repeatedly call `iteratee`, while `test` returns `true`. Calls `callback` when
     * stopped, or an error occurs.
     *
     * @name whilst
     * @static
     * @memberOf module:ControlFlow
     * @method
     * @category Control Flow
     * @param {Function} test - synchronous truth test to perform before each
     * execution of `iteratee`. Invoked with ().
     * @param {Function} iteratee - A function which is called each time `test` passes.
     * The function is passed a `callback(err)`, which must be called once it has
     * completed with an optional `err` argument. Invoked with (callback).
     * @param {Function} [callback] - A callback which is called after the test
     * function has failed and repeated execution of `iteratee` has stopped. `callback`
     * will be passed an error and any arguments passed to the final `iteratee`'s
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
        var next = baseRest(function (err, args) {
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

            var taskCallback = onlyOnce(baseRest(function (err, args) {
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
      constant: constant$1,
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
    exports.constant = constant$1;
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
},{"_process":69}],2:[function(require,module,exports){
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

},{"component-type":4,"type":4}],3:[function(require,module,exports){

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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],6:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./_is-object":29}],7:[function(require,module,exports){
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
},{"./_to-index":45,"./_to-iobject":47,"./_to-length":48}],8:[function(require,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx      = require('./_ctx')
  , IObject  = require('./_iobject')
  , toObject = require('./_to-object')
  , toLength = require('./_to-length')
  , asc      = require('./_array-species-create');
module.exports = function(TYPE, $create){
  var IS_MAP        = TYPE == 1
    , IS_FILTER     = TYPE == 2
    , IS_SOME       = TYPE == 3
    , IS_EVERY      = TYPE == 4
    , IS_FIND_INDEX = TYPE == 6
    , NO_HOLES      = TYPE == 5 || IS_FIND_INDEX
    , create        = $create || asc;
  return function($this, callbackfn, that){
    var O      = toObject($this)
      , self   = IObject(O)
      , f      = ctx(callbackfn, that, 3)
      , length = toLength(self.length)
      , index  = 0
      , result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined
      , val, res;
    for(;length > index; index++)if(NO_HOLES || index in self){
      val = self[index];
      res = f(val, index, O);
      if(TYPE){
        if(IS_MAP)result[index] = res;            // map
        else if(res)switch(TYPE){
          case 3: return true;                    // some
          case 5: return val;                     // find
          case 6: return index;                   // findIndex
          case 2: result.push(val);               // filter
        } else if(IS_EVERY)return false;          // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};
},{"./_array-species-create":10,"./_ctx":14,"./_iobject":27,"./_to-length":48,"./_to-object":49}],9:[function(require,module,exports){
var isObject = require('./_is-object')
  , isArray  = require('./_is-array')
  , SPECIES  = require('./_wks')('species');

module.exports = function(original){
  var C;
  if(isArray(original)){
    C = original.constructor;
    // cross-realm fallback
    if(typeof C == 'function' && (C === Array || isArray(C.prototype)))C = undefined;
    if(isObject(C)){
      C = C[SPECIES];
      if(C === null)C = undefined;
    }
  } return C === undefined ? Array : C;
};
},{"./_is-array":28,"./_is-object":29,"./_wks":52}],10:[function(require,module,exports){
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var speciesConstructor = require('./_array-species-constructor');

module.exports = function(original, length){
  return new (speciesConstructor(original))(length);
};
},{"./_array-species-constructor":9}],11:[function(require,module,exports){
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
},{"./_a-function":5,"./_invoke":26,"./_is-object":29}],12:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],13:[function(require,module,exports){
var core = module.exports = {version: '2.4.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],14:[function(require,module,exports){
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
},{"./_a-function":5}],15:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],16:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_fails":20}],17:[function(require,module,exports){
var isObject = require('./_is-object')
  , document = require('./_global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./_global":21,"./_is-object":29}],18:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');
},{}],19:[function(require,module,exports){
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
},{"./_core":13,"./_ctx":14,"./_global":21,"./_hide":23,"./_redefine":39}],20:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],21:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],22:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],23:[function(require,module,exports){
var dP         = require('./_object-dp')
  , createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./_descriptors":16,"./_object-dp":32,"./_property-desc":38}],24:[function(require,module,exports){
module.exports = require('./_global').document && document.documentElement;
},{"./_global":21}],25:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function(){
  return Object.defineProperty(require('./_dom-create')('div'), 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_descriptors":16,"./_dom-create":17,"./_fails":20}],26:[function(require,module,exports){
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
},{}],27:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./_cof":12}],28:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg){
  return cof(arg) == 'Array';
};
},{"./_cof":12}],29:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],30:[function(require,module,exports){
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
},{"./_fails":20,"./_iobject":27,"./_object-gops":34,"./_object-keys":36,"./_object-pie":37,"./_to-object":49}],31:[function(require,module,exports){
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

},{"./_an-object":6,"./_dom-create":17,"./_enum-bug-keys":18,"./_html":24,"./_object-dps":33,"./_shared-key":40}],32:[function(require,module,exports){
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
},{"./_an-object":6,"./_descriptors":16,"./_ie8-dom-define":25,"./_to-primitive":50}],33:[function(require,module,exports){
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
},{"./_an-object":6,"./_descriptors":16,"./_object-dp":32,"./_object-keys":36}],34:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;
},{}],35:[function(require,module,exports){
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
},{"./_array-includes":7,"./_has":22,"./_shared-key":40,"./_to-iobject":47}],36:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys       = require('./_object-keys-internal')
  , enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O){
  return $keys(O, enumBugKeys);
};
},{"./_enum-bug-keys":18,"./_object-keys-internal":35}],37:[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;
},{}],38:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],39:[function(require,module,exports){
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
},{"./_core":13,"./_global":21,"./_has":22,"./_hide":23,"./_uid":51}],40:[function(require,module,exports){
var shared = require('./_shared')('keys')
  , uid    = require('./_uid');
module.exports = function(key){
  return shared[key] || (shared[key] = uid(key));
};
},{"./_shared":41,"./_uid":51}],41:[function(require,module,exports){
var global = require('./_global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./_global":21}],42:[function(require,module,exports){
var fails = require('./_fails');

module.exports = function(method, arg){
  return !!method && fails(function(){
    arg ? method.call(null, function(){}, 1) : method.call(null);
  });
};
},{"./_fails":20}],43:[function(require,module,exports){
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
},{"./_defined":15,"./_export":19,"./_fails":20,"./_string-ws":44}],44:[function(require,module,exports){
module.exports = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';
},{}],45:[function(require,module,exports){
var toInteger = require('./_to-integer')
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};
},{"./_to-integer":46}],46:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],47:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject')
  , defined = require('./_defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./_defined":15,"./_iobject":27}],48:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./_to-integer":46}],49:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./_defined":15}],50:[function(require,module,exports){
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
},{"./_is-object":29}],51:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],52:[function(require,module,exports){
var store      = require('./_shared')('wks')
  , uid        = require('./_uid')
  , Symbol     = require('./_global').Symbol
  , USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function(name){
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;
},{"./_global":21,"./_shared":41,"./_uid":51}],53:[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $filter = require('./_array-methods')(2);

$export($export.P + $export.F * !require('./_strict-method')([].filter, true), 'Array', {
  // 22.1.3.7 / 15.4.4.20 Array.prototype.filter(callbackfn [, thisArg])
  filter: function filter(callbackfn /* , thisArg */){
    return $filter(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":8,"./_export":19,"./_strict-method":42}],54:[function(require,module,exports){
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
},{"./_array-includes":7,"./_export":19,"./_strict-method":42}],55:[function(require,module,exports){
// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
var $export = require('./_export');

$export($export.S, 'Array', {isArray: require('./_is-array')});
},{"./_export":19,"./_is-array":28}],56:[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $map    = require('./_array-methods')(1);

$export($export.P + $export.F * !require('./_strict-method')([].map, true), 'Array', {
  // 22.1.3.15 / 15.4.4.19 Array.prototype.map(callbackfn [, thisArg])
  map: function map(callbackfn /* , thisArg */){
    return $map(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":8,"./_export":19,"./_strict-method":42}],57:[function(require,module,exports){
// 20.3.3.1 / 15.9.4.4 Date.now()
var $export = require('./_export');

$export($export.S, 'Date', {now: function(){ return new Date().getTime(); }});
},{"./_export":19}],58:[function(require,module,exports){
'use strict';
// 20.3.4.36 / 15.9.5.43 Date.prototype.toISOString()
var $export = require('./_export')
  , fails   = require('./_fails')
  , getTime = Date.prototype.getTime;

var lz = function(num){
  return num > 9 ? num : '0' + num;
};

// PhantomJS / old WebKit has a broken implementations
$export($export.P + $export.F * (fails(function(){
  return new Date(-5e13 - 1).toISOString() != '0385-07-25T07:06:39.999Z';
}) || !fails(function(){
  new Date(NaN).toISOString();
})), 'Date', {
  toISOString: function toISOString(){
    if(!isFinite(getTime.call(this)))throw RangeError('Invalid time value');
    var d = this
      , y = d.getUTCFullYear()
      , m = d.getUTCMilliseconds()
      , s = y < 0 ? '-' : y > 9999 ? '+' : '';
    return s + ('00000' + Math.abs(y)).slice(s ? -6 : -4) +
      '-' + lz(d.getUTCMonth() + 1) + '-' + lz(d.getUTCDate()) +
      'T' + lz(d.getUTCHours()) + ':' + lz(d.getUTCMinutes()) +
      ':' + lz(d.getUTCSeconds()) + '.' + (m > 99 ? m : '0' + lz(m)) + 'Z';
  }
});
},{"./_export":19,"./_fails":20}],59:[function(require,module,exports){
// 19.2.3.2 / 15.3.4.5 Function.prototype.bind(thisArg, args...)
var $export = require('./_export');

$export($export.P, 'Function', {bind: require('./_bind')});
},{"./_bind":11,"./_export":19}],60:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./_export');

$export($export.S + $export.F, 'Object', {assign: require('./_object-assign')});
},{"./_export":19,"./_object-assign":30}],61:[function(require,module,exports){
var $export = require('./_export')
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export($export.S, 'Object', {create: require('./_object-create')});
},{"./_export":19,"./_object-create":31}],62:[function(require,module,exports){
'use strict';
// 21.1.3.25 String.prototype.trim()
require('./_string-trim')('trim', function($trim){
  return function trim(){
    return $trim(this, 3);
  };
});
},{"./_string-trim":43}],63:[function(require,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory();
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define([], factory);
	}
	else {
		// Global (browser)
		root.CryptoJS = factory();
	}
}(this, function () {

	/**
	 * CryptoJS core components.
	 */
	var CryptoJS = CryptoJS || (function (Math, undefined) {
	    /*
	     * Local polyfil of Object.create
	     */
	    var create = Object.create || (function () {
	        function F() {};

	        return function (obj) {
	            var subtype;

	            F.prototype = obj;

	            subtype = new F();

	            F.prototype = null;

	            return subtype;
	        };
	    }())

	    /**
	     * CryptoJS namespace.
	     */
	    var C = {};

	    /**
	     * Library namespace.
	     */
	    var C_lib = C.lib = {};

	    /**
	     * Base object for prototypal inheritance.
	     */
	    var Base = C_lib.Base = (function () {


	        return {
	            /**
	             * Creates a new object that inherits from this object.
	             *
	             * @param {Object} overrides Properties to copy into the new object.
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         field: 'value',
	             *
	             *         method: function () {
	             *         }
	             *     });
	             */
	            extend: function (overrides) {
	                // Spawn
	                var subtype = create(this);

	                // Augment
	                if (overrides) {
	                    subtype.mixIn(overrides);
	                }

	                // Create default initializer
	                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
	                    subtype.init = function () {
	                        subtype.$super.init.apply(this, arguments);
	                    };
	                }

	                // Initializer's prototype is the subtype object
	                subtype.init.prototype = subtype;

	                // Reference supertype
	                subtype.$super = this;

	                return subtype;
	            },

	            /**
	             * Extends this object and runs the init method.
	             * Arguments to create() will be passed to init().
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var instance = MyType.create();
	             */
	            create: function () {
	                var instance = this.extend();
	                instance.init.apply(instance, arguments);

	                return instance;
	            },

	            /**
	             * Initializes a newly created object.
	             * Override this method to add some logic when your objects are created.
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         init: function () {
	             *             // ...
	             *         }
	             *     });
	             */
	            init: function () {
	            },

	            /**
	             * Copies properties into this object.
	             *
	             * @param {Object} properties The properties to mix in.
	             *
	             * @example
	             *
	             *     MyType.mixIn({
	             *         field: 'value'
	             *     });
	             */
	            mixIn: function (properties) {
	                for (var propertyName in properties) {
	                    if (properties.hasOwnProperty(propertyName)) {
	                        this[propertyName] = properties[propertyName];
	                    }
	                }

	                // IE won't copy toString using the loop above
	                if (properties.hasOwnProperty('toString')) {
	                    this.toString = properties.toString;
	                }
	            },

	            /**
	             * Creates a copy of this object.
	             *
	             * @return {Object} The clone.
	             *
	             * @example
	             *
	             *     var clone = instance.clone();
	             */
	            clone: function () {
	                return this.init.prototype.extend(this);
	            }
	        };
	    }());

	    /**
	     * An array of 32-bit words.
	     *
	     * @property {Array} words The array of 32-bit words.
	     * @property {number} sigBytes The number of significant bytes in this word array.
	     */
	    var WordArray = C_lib.WordArray = Base.extend({
	        /**
	         * Initializes a newly created word array.
	         *
	         * @param {Array} words (Optional) An array of 32-bit words.
	         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.create();
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
	         */
	        init: function (words, sigBytes) {
	            words = this.words = words || [];

	            if (sigBytes != undefined) {
	                this.sigBytes = sigBytes;
	            } else {
	                this.sigBytes = words.length * 4;
	            }
	        },

	        /**
	         * Converts this word array to a string.
	         *
	         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
	         *
	         * @return {string} The stringified word array.
	         *
	         * @example
	         *
	         *     var string = wordArray + '';
	         *     var string = wordArray.toString();
	         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
	         */
	        toString: function (encoder) {
	            return (encoder || Hex).stringify(this);
	        },

	        /**
	         * Concatenates a word array to this word array.
	         *
	         * @param {WordArray} wordArray The word array to append.
	         *
	         * @return {WordArray} This word array.
	         *
	         * @example
	         *
	         *     wordArray1.concat(wordArray2);
	         */
	        concat: function (wordArray) {
	            // Shortcuts
	            var thisWords = this.words;
	            var thatWords = wordArray.words;
	            var thisSigBytes = this.sigBytes;
	            var thatSigBytes = wordArray.sigBytes;

	            // Clamp excess bits
	            this.clamp();

	            // Concat
	            if (thisSigBytes % 4) {
	                // Copy one byte at a time
	                for (var i = 0; i < thatSigBytes; i++) {
	                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
	                }
	            } else {
	                // Copy one word at a time
	                for (var i = 0; i < thatSigBytes; i += 4) {
	                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
	                }
	            }
	            this.sigBytes += thatSigBytes;

	            // Chainable
	            return this;
	        },

	        /**
	         * Removes insignificant bits.
	         *
	         * @example
	         *
	         *     wordArray.clamp();
	         */
	        clamp: function () {
	            // Shortcuts
	            var words = this.words;
	            var sigBytes = this.sigBytes;

	            // Clamp
	            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
	            words.length = Math.ceil(sigBytes / 4);
	        },

	        /**
	         * Creates a copy of this word array.
	         *
	         * @return {WordArray} The clone.
	         *
	         * @example
	         *
	         *     var clone = wordArray.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone.words = this.words.slice(0);

	            return clone;
	        },

	        /**
	         * Creates a word array filled with random bytes.
	         *
	         * @param {number} nBytes The number of random bytes to generate.
	         *
	         * @return {WordArray} The random word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.random(16);
	         */
	        random: function (nBytes) {
	            var words = [];

	            var r = (function (m_w) {
	                var m_w = m_w;
	                var m_z = 0x3ade68b1;
	                var mask = 0xffffffff;

	                return function () {
	                    m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
	                    m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
	                    var result = ((m_z << 0x10) + m_w) & mask;
	                    result /= 0x100000000;
	                    result += 0.5;
	                    return result * (Math.random() > .5 ? 1 : -1);
	                }
	            });

	            for (var i = 0, rcache; i < nBytes; i += 4) {
	                var _r = r((rcache || Math.random()) * 0x100000000);

	                rcache = _r() * 0x3ade67b7;
	                words.push((_r() * 0x100000000) | 0);
	            }

	            return new WordArray.init(words, nBytes);
	        }
	    });

	    /**
	     * Encoder namespace.
	     */
	    var C_enc = C.enc = {};

	    /**
	     * Hex encoding strategy.
	     */
	    var Hex = C_enc.Hex = {
	        /**
	         * Converts a word array to a hex string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The hex string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var hexChars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                hexChars.push((bite >>> 4).toString(16));
	                hexChars.push((bite & 0x0f).toString(16));
	            }

	            return hexChars.join('');
	        },

	        /**
	         * Converts a hex string to a word array.
	         *
	         * @param {string} hexStr The hex string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
	         */
	        parse: function (hexStr) {
	            // Shortcut
	            var hexStrLength = hexStr.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < hexStrLength; i += 2) {
	                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
	            }

	            return new WordArray.init(words, hexStrLength / 2);
	        }
	    };

	    /**
	     * Latin1 encoding strategy.
	     */
	    var Latin1 = C_enc.Latin1 = {
	        /**
	         * Converts a word array to a Latin1 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The Latin1 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var latin1Chars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                latin1Chars.push(String.fromCharCode(bite));
	            }

	            return latin1Chars.join('');
	        },

	        /**
	         * Converts a Latin1 string to a word array.
	         *
	         * @param {string} latin1Str The Latin1 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
	         */
	        parse: function (latin1Str) {
	            // Shortcut
	            var latin1StrLength = latin1Str.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < latin1StrLength; i++) {
	                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
	            }

	            return new WordArray.init(words, latin1StrLength);
	        }
	    };

	    /**
	     * UTF-8 encoding strategy.
	     */
	    var Utf8 = C_enc.Utf8 = {
	        /**
	         * Converts a word array to a UTF-8 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The UTF-8 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            try {
	                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
	            } catch (e) {
	                throw new Error('Malformed UTF-8 data');
	            }
	        },

	        /**
	         * Converts a UTF-8 string to a word array.
	         *
	         * @param {string} utf8Str The UTF-8 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
	         */
	        parse: function (utf8Str) {
	            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
	        }
	    };

	    /**
	     * Abstract buffered block algorithm template.
	     *
	     * The property blockSize must be implemented in a concrete subtype.
	     *
	     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
	     */
	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
	        /**
	         * Resets this block algorithm's data buffer to its initial state.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm.reset();
	         */
	        reset: function () {
	            // Initial values
	            this._data = new WordArray.init();
	            this._nDataBytes = 0;
	        },

	        /**
	         * Adds new data to this block algorithm's buffer.
	         *
	         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm._append('data');
	         *     bufferedBlockAlgorithm._append(wordArray);
	         */
	        _append: function (data) {
	            // Convert string to WordArray, else assume WordArray already
	            if (typeof data == 'string') {
	                data = Utf8.parse(data);
	            }

	            // Append
	            this._data.concat(data);
	            this._nDataBytes += data.sigBytes;
	        },

	        /**
	         * Processes available data blocks.
	         *
	         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
	         *
	         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
	         *
	         * @return {WordArray} The processed data.
	         *
	         * @example
	         *
	         *     var processedData = bufferedBlockAlgorithm._process();
	         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
	         */
	        _process: function (doFlush) {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;
	            var dataSigBytes = data.sigBytes;
	            var blockSize = this.blockSize;
	            var blockSizeBytes = blockSize * 4;

	            // Count blocks ready
	            var nBlocksReady = dataSigBytes / blockSizeBytes;
	            if (doFlush) {
	                // Round up to include partial blocks
	                nBlocksReady = Math.ceil(nBlocksReady);
	            } else {
	                // Round down to include only full blocks,
	                // less the number of blocks that must remain in the buffer
	                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
	            }

	            // Count words ready
	            var nWordsReady = nBlocksReady * blockSize;

	            // Count bytes ready
	            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

	            // Process blocks
	            if (nWordsReady) {
	                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
	                    // Perform concrete-algorithm logic
	                    this._doProcessBlock(dataWords, offset);
	                }

	                // Remove processed words
	                var processedWords = dataWords.splice(0, nWordsReady);
	                data.sigBytes -= nBytesReady;
	            }

	            // Return processed words
	            return new WordArray.init(processedWords, nBytesReady);
	        },

	        /**
	         * Creates a copy of this object.
	         *
	         * @return {Object} The clone.
	         *
	         * @example
	         *
	         *     var clone = bufferedBlockAlgorithm.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone._data = this._data.clone();

	            return clone;
	        },

	        _minBufferSize: 0
	    });

	    /**
	     * Abstract hasher template.
	     *
	     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
	     */
	    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
	        /**
	         * Configuration options.
	         */
	        cfg: Base.extend(),

	        /**
	         * Initializes a newly created hasher.
	         *
	         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
	         *
	         * @example
	         *
	         *     var hasher = CryptoJS.algo.SHA256.create();
	         */
	        init: function (cfg) {
	            // Apply config defaults
	            this.cfg = this.cfg.extend(cfg);

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this hasher to its initial state.
	         *
	         * @example
	         *
	         *     hasher.reset();
	         */
	        reset: function () {
	            // Reset data buffer
	            BufferedBlockAlgorithm.reset.call(this);

	            // Perform concrete-hasher logic
	            this._doReset();
	        },

	        /**
	         * Updates this hasher with a message.
	         *
	         * @param {WordArray|string} messageUpdate The message to append.
	         *
	         * @return {Hasher} This hasher.
	         *
	         * @example
	         *
	         *     hasher.update('message');
	         *     hasher.update(wordArray);
	         */
	        update: function (messageUpdate) {
	            // Append
	            this._append(messageUpdate);

	            // Update the hash
	            this._process();

	            // Chainable
	            return this;
	        },

	        /**
	         * Finalizes the hash computation.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
	         *
	         * @return {WordArray} The hash.
	         *
	         * @example
	         *
	         *     var hash = hasher.finalize();
	         *     var hash = hasher.finalize('message');
	         *     var hash = hasher.finalize(wordArray);
	         */
	        finalize: function (messageUpdate) {
	            // Final message update
	            if (messageUpdate) {
	                this._append(messageUpdate);
	            }

	            // Perform concrete-hasher logic
	            var hash = this._doFinalize();

	            return hash;
	        },

	        blockSize: 512/32,

	        /**
	         * Creates a shortcut function to a hasher's object interface.
	         *
	         * @param {Hasher} hasher The hasher to create a helper for.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
	         */
	        _createHelper: function (hasher) {
	            return function (message, cfg) {
	                return new hasher.init(cfg).finalize(message);
	            };
	        },

	        /**
	         * Creates a shortcut function to the HMAC's object interface.
	         *
	         * @param {Hasher} hasher The hasher to use in this HMAC helper.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
	         */
	        _createHmacHelper: function (hasher) {
	            return function (message, key) {
	                return new C_algo.HMAC.init(hasher, key).finalize(message);
	            };
	        }
	    });

	    /**
	     * Algorithm namespace.
	     */
	    var C_algo = C.algo = {};

	    return C;
	}(Math));


	return CryptoJS;

}));
},{}],64:[function(require,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(require("./core"));
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define(["./core"], factory);
	}
	else {
		// Global (browser)
		factory(root.CryptoJS);
	}
}(this, function (CryptoJS) {

	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Initialization and round constants tables
	    var H = [];
	    var K = [];

	    // Compute constants
	    (function () {
	        function isPrime(n) {
	            var sqrtN = Math.sqrt(n);
	            for (var factor = 2; factor <= sqrtN; factor++) {
	                if (!(n % factor)) {
	                    return false;
	                }
	            }

	            return true;
	        }

	        function getFractionalBits(n) {
	            return ((n - (n | 0)) * 0x100000000) | 0;
	        }

	        var n = 2;
	        var nPrime = 0;
	        while (nPrime < 64) {
	            if (isPrime(n)) {
	                if (nPrime < 8) {
	                    H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
	                }
	                K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

	                nPrime++;
	            }

	            n++;
	        }
	    }());

	    // Reusable object
	    var W = [];

	    /**
	     * SHA-256 hash algorithm.
	     */
	    var SHA256 = C_algo.SHA256 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init(H.slice(0));
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcut
	            var H = this._hash.words;

	            // Working variables
	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];
	            var e = H[4];
	            var f = H[5];
	            var g = H[6];
	            var h = H[7];

	            // Computation
	            for (var i = 0; i < 64; i++) {
	                if (i < 16) {
	                    W[i] = M[offset + i] | 0;
	                } else {
	                    var gamma0x = W[i - 15];
	                    var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
	                                  ((gamma0x << 14) | (gamma0x >>> 18)) ^
	                                   (gamma0x >>> 3);

	                    var gamma1x = W[i - 2];
	                    var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
	                                  ((gamma1x << 13) | (gamma1x >>> 19)) ^
	                                   (gamma1x >>> 10);

	                    W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
	                }

	                var ch  = (e & f) ^ (~e & g);
	                var maj = (a & b) ^ (a & c) ^ (b & c);

	                var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
	                var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

	                var t1 = h + sigma1 + ch + K[i] + W[i];
	                var t2 = sigma0 + maj;

	                h = g;
	                g = f;
	                f = e;
	                e = (d + t1) | 0;
	                d = c;
	                c = b;
	                b = a;
	                a = (t1 + t2) | 0;
	            }

	            // Intermediate hash value
	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	            H[4] = (H[4] + e) | 0;
	            H[5] = (H[5] + f) | 0;
	            H[6] = (H[6] + g) | 0;
	            H[7] = (H[7] + h) | 0;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            // Hash final blocks
	            this._process();

	            // Return final computed hash
	            return this._hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA256('message');
	     *     var hash = CryptoJS.SHA256(wordArray);
	     */
	    C.SHA256 = Hasher._createHelper(SHA256);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA256(message, key);
	     */
	    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
	}(Math));


	return CryptoJS.SHA256;

}));
},{"./core":63}],65:[function(require,module,exports){
(function (process){

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
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && 'WebkitAppearance' in document.documentElement.style) ||
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
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
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
    return exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (typeof process !== 'undefined' && 'env' in process) {
    return process.env.DEBUG;
  }
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

}).call(this,require('_process'))
},{"./debug":66,"_process":69}],66:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug.debug = debug;
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

    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

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

    // apply env-specific formatting
    args = exports.formatArgs.apply(self, args);

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
    namespaces = split[i].replace(/[\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*?');
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

},{"ms":68}],67:[function(require,module,exports){
(function(root, factory) {

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = factory(root, exports);
    }
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], function(exports) {
      root.Lockr = factory(root, exports);
    });
  } else {
    root.Lockr = factory(root, {});
  }

}(this, function(root, Lockr) {
  'use strict';

  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(elt /*, from*/)
    {
      var len = this.length >>> 0;

      var from = Number(arguments[1]) || 0;
      from = (from < 0)
      ? Math.ceil(from)
      : Math.floor(from);
      if (from < 0)
        from += len;

      for (; from < len; from++)
      {
        if (from in this &&
            this[from] === elt)
          return from;
      }
      return -1;
    };
  }

  Lockr.prefix = "";

  Lockr._getPrefixedKey = function(key, options) {
    options = options || {};

    if (options.noPrefix) {
      return key;
    } else {
      return this.prefix + key;
    }

  };

  Lockr.set = function (key, value, options) {
    var query_key = this._getPrefixedKey(key, options);

    try {
      localStorage.setItem(query_key, JSON.stringify({"data": value}));
    } catch (e) {
      if (console) console.warn("Lockr didn't successfully save the '{"+ key +": "+ value +"}' pair, because the localStorage is full.");
    }
  };

  Lockr.get = function (key, missing, options) {
    var query_key = this._getPrefixedKey(key, options),
        value;

    try {
      value = JSON.parse(localStorage.getItem(query_key));
    } catch (e) {
        try {
            if(localStorage[query_key]) {
                value = JSON.parse('{"data":"' + localStorage.getItem(query_key) + '"}');
            } else{
                value = null;
            }
        } catch (e) {
            if (console) console.warn("Lockr could not load the item with key " + key);
        }
    }
    if(value === null) {
      return missing;
    } else if (typeof value.data !== 'undefined') {
      return value.data;
    } else {
      return missing;
    }
  };

  Lockr.sadd = function(key, value, options) {
    var query_key = this._getPrefixedKey(key, options),
        json;

    var values = Lockr.smembers(key);

    if (values.indexOf(value) > -1) {
      return null;
    }

    try {
      values.push(value);
      json = JSON.stringify({"data": values});
      localStorage.setItem(query_key, json);
    } catch (e) {
      console.log(e);
      if (console) console.warn("Lockr didn't successfully add the "+ value +" to "+ key +" set, because the localStorage is full.");
    }
  };

  Lockr.smembers = function(key, options) {
    var query_key = this._getPrefixedKey(key, options),
        value;

    try {
      value = JSON.parse(localStorage.getItem(query_key));
    } catch (e) {
      value = null;
    }

    if (value === null)
      return [];
    else
      return (value.data || []);
  };

  Lockr.sismember = function(key, value, options) {
    var query_key = this._getPrefixedKey(key, options);

    return Lockr.smembers(key).indexOf(value) > -1;
  };

  Lockr.getAll = function () {
    var keys = Object.keys(localStorage);

    return keys.map(function (key) {
      return Lockr.get(key);
    });
  };

  Lockr.srem = function(key, value, options) {
    var query_key = this._getPrefixedKey(key, options),
        json,
        index;

    var values = Lockr.smembers(key, value);

    index = values.indexOf(value);

    if (index > -1)
      values.splice(index, 1);

    json = JSON.stringify({"data": values});

    try {
      localStorage.setItem(query_key, json);
    } catch (e) {
      if (console) console.warn("Lockr couldn't remove the "+ value +" from the set "+ key);
    }
  };

  Lockr.rm =  function (key) {
    localStorage.removeItem(key);
  };

  Lockr.flush = function () {
    localStorage.clear();
  };
  return Lockr;

}));

},{}],68:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000
var m = s * 60
var h = m * 60
var d = h * 24
var y = d * 365.25

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {}
  var type = typeof val
  if (type === 'string' && val.length > 0) {
    return parse(val)
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ?
			fmtLong(val) :
			fmtShort(val)
  }
  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val))
}

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str)
  if (str.length > 10000) {
    return
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str)
  if (!match) {
    return
  }
  var n = parseFloat(match[1])
  var type = (match[2] || 'ms').toLowerCase()
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y
    case 'days':
    case 'day':
    case 'd':
      return n * d
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n
    default:
      return undefined
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd'
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h'
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm'
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's'
  }
  return ms + 'ms'
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms'
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name
  }
  return Math.ceil(ms / n) + ' ' + name + 's'
}

},{}],69:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
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
    var timeout = runTimeout(cleanUpNextTick);
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
    runClearTimeout(timeout);
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
        runTimeout(drainQueue);
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

},{}],70:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _dotProp = require('./functions/dotProp');

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
    var value = (0, _dotProp.getProp)(digitalData, key);
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

  DDHelper.getListItem = function getListItem(id, digitalData, listId) {
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

          if (listing.items && listing.items.length && (!listId || listId === listing.listId)) {
            for (var i = 0, length = listing.items.length; i < length; i++) {
              if (listing.items[i].id && String(listing.items[i].id) === String(id)) {
                var product = (0, _componentClone2['default'])(listing.items[i]);
                listingItem.product = product;
                listingItem.position = i + 1;
                listingItem.listId = listId || listing.listId;
                listingItem.listName = listing.listName;
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

},{"./functions/dotProp":83,"component-clone":2}],71:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _dotProp = require('./functions/dotProp');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var keyPersistedKeys = '_persistedKeys';
var keyLastEventTimestamp = '_lastEventTimestamp';

var DDStorage = function () {
  function DDStorage(digitalData, storage) {
    _classCallCheck(this, DDStorage);

    this.digitalData = digitalData;
    this.storage = storage;
  }

  DDStorage.prototype.persist = function persist(key, exp) {
    var value = (0, _dotProp.getProp)(this.digitalData, key);
    if (value !== undefined) {
      var persistedKeys = this.getPersistedKeys();
      if (persistedKeys.indexOf(key) < 0) {
        persistedKeys.push(key);
        this.storage.set(keyPersistedKeys, persistedKeys);
      }
      return this.storage.set(key, value, exp);
    }
  };

  DDStorage.prototype.getPersistedKeys = function getPersistedKeys() {
    var persistedKeys = this.storage.get(keyPersistedKeys) || [];
    return persistedKeys;
  };

  DDStorage.prototype.removePersistedKey = function removePersistedKey(key) {
    var persistedKeys = this.getPersistedKeys();
    var index = persistedKeys.indexOf(key);
    if (index > -1) {
      persistedKeys.splice(index, 1);
    }
    this.updatePersistedKeys(persistedKeys);
  };

  DDStorage.prototype.getLastEventTimestamp = function getLastEventTimestamp() {
    return this.storage.get(keyLastEventTimestamp);
  };

  DDStorage.prototype.setLastEventTimestamp = function setLastEventTimestamp(timestamp) {
    return this.storage.set(keyLastEventTimestamp, timestamp);
  };

  DDStorage.prototype.updatePersistedKeys = function updatePersistedKeys(persistedKeys) {
    this.storage.set(keyPersistedKeys, persistedKeys);
  };

  DDStorage.prototype.get = function get(key) {
    var value = this.storage.get(key);
    if (value === undefined) {
      this.removePersistedKey(key);
    }
    return value;
  };

  DDStorage.prototype.unpersist = function unpersist(key) {
    this.removePersistedKey(key);
    return this.storage.remove(key);
  };

  DDStorage.prototype.clear = function clear() {
    var persistedKeys = this.getPersistedKeys();
    for (var _iterator = persistedKeys, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var key = _ref;

      this.storage.remove(key);
    }
    this.storage.remove(keyPersistedKeys);
    this.storage.remove(keyLastEventTimestamp);
  };

  return DDStorage;
}();

exports['default'] = DDStorage;

},{"./functions/dotProp":83}],72:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _htmlGlobals = require('./functions/htmlGlobals.js');

var _htmlGlobals2 = _interopRequireDefault(_htmlGlobals);

var _semver = require('./functions/semver.js');

var _semver2 = _interopRequireDefault(_semver);

var _dotProp = require('./functions/dotProp');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * fields which will be overriden even
 * if server returned other values in DDL
 */
var ddStorageForcedFields = ['user.isSubscribed', 'user.hasTransacted', 'user.everLoggedIn', 'user.isReturning'];

/**
 * this fields are always persisted if were set in DDL
 */
var ddStorageAlwaysPersistedFields = ['user.email', 'user.lastTransactionDate'];

function isForcedField(field) {
  return ddStorageForcedFields.indexOf(field) >= 0;
}

function isAlwaysPersistedField(field) {
  return ddStorageAlwaysPersistedFields.indexOf(field) >= 0;
}

var DigitalDataEnricher = function () {
  function DigitalDataEnricher(digitalData, ddListener, ddStorage, options) {
    _classCallCheck(this, DigitalDataEnricher);

    this.digitalData = digitalData;
    this.ddListener = ddListener;
    this.ddStorage = ddStorage;
    this.options = Object.assign({
      sessionLength: 3600
    }, options);
  }

  DigitalDataEnricher.prototype.setDigitalData = function setDigitalData(digitalData) {
    this.digitalData = digitalData;
  };

  DigitalDataEnricher.prototype.setDDListener = function setDDListener(ddListener) {
    this.ddListener = ddListener;
  };

  DigitalDataEnricher.prototype.setDDStorage = function setDDStorage(ddStorage) {
    this.ddStorage = ddStorage;
  };

  DigitalDataEnricher.prototype.setOption = function setOption(key, value) {
    this.options[key] = value;
  };

  DigitalDataEnricher.prototype.enrichDigitalData = function enrichDigitalData() {
    // define required digitalData structure
    this.enrichStructure();

    // fire session started event if this is new session
    this.fireSessionStarted();

    // persist some default behaviours
    this.persistUserData();

    // enrich with default context data
    this.enrichPageData();
    this.enrichTransactionData();
    this.enrichContextData();
    this.enrichLegacyVersions();

    // should be after all default enrichments
    this.enrichDDStorageData();

    // enrich required fields if still not defined
    this.enrichDefaultUserData();
    this.enrichIsReturningStatus();

    // when all enrichments are done
    this.listenToUserDataChanges();
    this.listenToEvents();

    this.ddStorage.setLastEventTimestamp(Date.now());
  };

  DigitalDataEnricher.prototype.listenToEvents = function listenToEvents() {
    var _this = this;

    // enrich Completed Transction event with "transaction.isFirst"
    this.ddListener.push(['on', 'beforeEvent', function (event) {
      if (event.name === 'Completed Transction') {
        var transaction = event.transaction;
        var user = _this.digitalData.user;
        if (transaction.isFirst === undefined) {
          transaction.isFirst = !user.hasTransacted;
        }
      }
    }]);

    // enrich DDL based on semantic events
    this.ddListener.push(['on', 'event', function (event) {
      _this.enrichIsReturningStatus();
      _this.ddStorage.setLastEventTimestamp(Date.now());

      if (event.name === 'Subscribed') {
        var email = (0, _dotProp.getProp)(event, 'user.email');
        _this.enrichHasSubscribed(email);
      } else if (event.name === 'Completed Transaction') {
        _this.enrichHasTransacted();
      }
    }]);
  };

  DigitalDataEnricher.prototype.listenToUserDataChanges = function listenToUserDataChanges() {
    var _this2 = this;

    this.ddListener.push(['on', 'change:user', function () {
      _this2.persistUserData();
    }]);
  };

  DigitalDataEnricher.prototype.fireSessionStarted = function fireSessionStarted() {
    var lastEventTimestamp = this.ddStorage.getLastEventTimestamp();
    if (!lastEventTimestamp || Date.now() - lastEventTimestamp > this.options.sessionLength * 1000) {
      this.digitalData.events.push({
        name: 'Session Started',
        includeIntegrations: [] });
    }
  };

  DigitalDataEnricher.prototype.enrichDefaultUserData = function enrichDefaultUserData() {
    var user = this.digitalData.user;

    if (user.isReturning === undefined) {
      user.isReturning = false;
    }

    if (user.isLoggedIn !== undefined && user.everLoggedIn === undefined) {
      user.everLoggedIn = false;
    }
  };

  DigitalDataEnricher.prototype.persistUserData = function persistUserData() {
    var user = this.digitalData.user;

    // persist user.everLoggedIn
    if (user.isLoggedIn && !user.everLoggedIn) {
      user.everLoggedIn = true;
      this.ddStorage.persist('user.everLoggedIn');
    }
    // persist user.email
    if (user.email) {
      this.ddStorage.persist('user.email');
    }
    // persist user.isSubscribed
    if (user.isSubscribed) {
      this.ddStorage.persist('user.isSubscribed');
    }
    // persist user.hasTransacted
    if (user.hasTransacted) {
      this.ddStorage.persist('user.hasTransacted');
    }
    // persist user.lastTransactionDate
    if (user.lastTransactionDate) {
      this.ddStorage.persist('user.lastTransactionDate');
    }
  };

  DigitalDataEnricher.prototype.enrichIsReturningStatus = function enrichIsReturningStatus() {
    var lastEventTimestamp = this.ddStorage.getLastEventTimestamp();
    var user = this.digitalData.user;
    if (!user.isReturning && lastEventTimestamp && Date.now() - lastEventTimestamp > this.options.sessionLength * 1000) {
      this.digitalData.user.isReturning = true;
      this.ddStorage.persist('user.isReturning');
    }
  };

  DigitalDataEnricher.prototype.enrichHasSubscribed = function enrichHasSubscribed(email) {
    var user = this.digitalData.user;
    if (!user.isSubscribed) {
      user.isSubscribed = true;
      this.ddStorage.persist('user.isSubscribed');
    }
    if (!user.email && email) {
      user.email = email;
      this.ddStorage.persist('user.email');
    }
  };

  DigitalDataEnricher.prototype.enrichHasTransacted = function enrichHasTransacted() {
    var user = this.digitalData.user;
    if (!user.hasTransacted) {
      user.hasTransacted = true;
      this.ddStorage.persist('user.hasTransacted');
    }
    if (!user.lastTransactionDate) {
      user.lastTransactionDate = new Date().toISOString();
      this.ddStorage.persist('user.lastTransactionDate');
    }
  };

  DigitalDataEnricher.prototype.enrichStructure = function enrichStructure() {
    this.digitalData.website = this.digitalData.website || {};
    this.digitalData.page = this.digitalData.page || {};
    this.digitalData.user = this.digitalData.user || {};
    this.digitalData.context = this.digitalData.context || {};
    this.digitalData.integrations = this.digitalData.integrations || {};
    if (!this.digitalData.page.type || this.digitalData.page.type !== 'confirmation') {
      this.digitalData.cart = this.digitalData.cart || {};
    } else {
      this.digitalData.transaction = this.digitalData.transaction || {};
    }
    this.digitalData.events = this.digitalData.events || [];
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

  DigitalDataEnricher.prototype.enrichTransactionData = function enrichTransactionData() {
    var page = this.digitalData.page;
    var user = this.digitalData.user;
    var transaction = this.digitalData.transaction;

    if (page.type === 'confirmation' && transaction && !transaction.isReturning) {
      // check if never transacted before
      if (transaction.isFirst === undefined) {
        transaction.isFirst = !user.hasTransacted;
      }
      this.enrichHasTransacted();
    }
  };

  DigitalDataEnricher.prototype.enrichContextData = function enrichContextData() {
    var context = this.digitalData.context;
    context.userAgent = this.getHtmlGlobals().getNavigator().userAgent;
  };

  DigitalDataEnricher.prototype.enrichDDStorageData = function enrichDDStorageData() {
    var persistedKeys = this.ddStorage.getPersistedKeys();
    for (var _iterator = persistedKeys, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var key = _ref;

      var value = this.ddStorage.get(key);
      if (value === undefined) {
        continue;
      }
      if ((0, _dotProp.getProp)(this.digitalData, key) === undefined || isForcedField(key)) {
        (0, _dotProp.setProp)(this.digitalData, key, value);
      } else if (!isAlwaysPersistedField(key)) {
        // remove persistance if server defined it's own value
        this.ddStorage.unpersist(key);
      }
    }
  };

  DigitalDataEnricher.prototype.enrichLegacyVersions = function enrichLegacyVersions() {
    var _this3 = this;

    // compatibility with version <1.1.1
    if (this.digitalData.version && _semver2['default'].cmp(this.digitalData.version, '1.1.1') < 0) {
      // enrich listing.listId
      var listing = this.digitalData.listing;
      if (listing && listing.listName && !listing.listId) {
        listing.listId = listing.listName;
      }
      // enrich recommendation[].listId
      var recommendations = this.digitalData.recommendation || [];
      if (!Array.isArray(recommendations)) {
        recommendations = [recommendations];
      }
      for (var _iterator2 = recommendations, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref2;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref2 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref2 = _i2.value;
        }

        var recommendation = _ref2;

        if (recommendation && recommendation.listName && !recommendation.listId) {
          recommendation.listId = recommendation.listName;
        }
      }
    }

    // compatibility with version <1.1.0
    if (this.digitalData.version && _semver2['default'].cmp(this.digitalData.version, '1.1.0') < 0) {
      // enrich listing.categoryId
      var page = this.digitalData.page;
      if (page.type === 'category' && page.categoryId) {
        var _listing = this.digitalData.listing = this.digitalData.listing || {};
        _listing.categoryId = page.categoryId;
        this.ddListener.push(['on', 'change:page.categoryId', function () {
          _this3.digitalData.listing.categoryId = _this3.digitalData.page.categoryId;
        }]);
      }
    }
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

},{"./functions/dotProp":83,"./functions/htmlGlobals.js":87,"./functions/semver.js":94}],73:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _componentType = require('component-type');

var _componentType2 = _interopRequireDefault(_componentType);

var _componentClone = require('component-clone');

var _componentClone2 = _interopRequireDefault(_componentClone);

var _DDHelper = require('./DDHelper.js');

var _DDHelper2 = _interopRequireDefault(_DDHelper);

var _dotProp = require('./functions/dotProp');

var _dotProp2 = _interopRequireDefault(_dotProp);

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

  EventDataEnricher.enrichCommonData = function enrichCommonData(event, digitalData) {
    var enrichableVars = ['product', 'listItem', 'listItems', 'campaign', 'campaigns'];

    for (var _iterator = enrichableVars, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var enrichableVar = _ref;

      if (event[enrichableVar]) {
        var enricherMethod = EventDataEnricher[enrichableVar];
        var eventVar = event[enrichableVar];
        event[enrichableVar] = enricherMethod(eventVar, digitalData);
      }
    }

    // enrich digitalData version
    if (!event.version && digitalData.version) {
      event.version = digitalData.version;
    }

    return event;
  };

  EventDataEnricher.enrichIntegrationData = function enrichIntegrationData(event, digitalData, integration) {
    var enrichedEvent = (0, _componentClone2['default'])(event);
    var enrichableProps = integration.getEnrichableEventProps(event);
    for (var _iterator2 = enrichableProps, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var prop = _ref2;

      if (!_dotProp2['default'].getProp(event, prop)) {
        var ddlPropValue = _dotProp2['default'].getProp(digitalData, prop);
        if (ddlPropValue !== undefined) {
          _dotProp2['default'].setProp(enrichedEvent, prop, ddlPropValue);
        }
      }
    }
    integration.overrideEvent(enrichedEvent);
    return enrichedEvent;
  };

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
      var ddlListItem = _DDHelper2['default'].getListItem(productId, digitalData, _listItem.listId);
      if (ddlListItem) {
        _listItem.product = Object.assign(ddlListItem.product, _listItem.product);
        _listItem = Object.assign(ddlListItem, _listItem);
      }
    }

    return _listItem;
  };

  EventDataEnricher.listItems = function listItems(_listItems, digitalData) {
    var result = [];
    for (var _iterator3 = _listItems, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
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

      var enrichedListItem = EventDataEnricher.listItem(listItem, digitalData);
      result.push(enrichedListItem);
    }
    return result;
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
    for (var _iterator4 = _campaigns, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
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

      result.push(EventDataEnricher.campaign(campaign, digitalData));
    }
    return result;
  };

  return EventDataEnricher;
}();

exports['default'] = EventDataEnricher;

},{"./DDHelper.js":70,"./functions/dotProp":83,"component-clone":2,"component-type":4}],74:[function(require,module,exports){
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
      var handler = callbackInfo[2];
      if (callbackInfo[1] !== 'beforeEvent') {
        // make handler async if it is not before-handler
        handler = _async2['default'].asyncify(callbackInfo[2]);
      }
      this.on(callbackInfo[1], handler, processPastEvents);
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
          var previousKeyValue = _DDHelper2['default'].get(key, previousValue);
          if (!(0, _jsonIsEqual2['default'])(newKeyValue, previousKeyValue)) {
            callback.handler(newKeyValue, previousKeyValue, _callbackOnComplete);
          }
        } else {
          callback.handler(newValue, previousValue, _callbackOnComplete);
        }
      }
    }
  };

  EventManager.prototype.beforeFireEvent = function beforeFireEvent(event) {
    if (!_callbacks.beforeEvent) {
      return true;
    }

    var beforeEventCallback = void 0;
    var result = void 0;
    for (var _iterator3 = _callbacks.beforeEvent, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        beforeEventCallback = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        beforeEventCallback = _i3.value;
      }

      result = beforeEventCallback.handler(event);
      if (result === false) {
        return false;
      }
    }
    return true;
  };

  EventManager.prototype.fireEvent = function fireEvent(event) {
    var _this2 = this;

    var eventCallback = void 0;
    event.timestamp = Date.now();

    if (!this.beforeFireEvent(event)) {
      return false;
    }

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

        for (var _iterator4 = _callbacks.event, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
          if (_isArray4) {
            if (_i4 >= _iterator4.length) break;
            eventCallback = _iterator4[_i4++];
          } else {
            _i4 = _iterator4.next();
            if (_i4.done) break;
            eventCallback = _i4.value;
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
    var _eventInfo$split = eventInfo.split(':'),
        type = _eventInfo$split[0],
        key = _eventInfo$split[1];

    if (type === 'view') {
      _viewabilityTracker.addTracker(key, handler);
      return; // delegate view tracking to ViewabilityTracker
    }

    _callbacks[type] = _callbacks[type] || [];
    _callbacks[type].push({
      key: key,
      handler: handler
    });
    if (_isInitialized && type === 'event' && processPastEvents) {
      this.applyCallbackForPastEvents(handler);
    }
  };

  EventManager.prototype.applyCallbackForPastEvents = function applyCallbackForPastEvents(handler) {
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
    for (var _iterator6 = events, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
      if (_isArray6) {
        if (_i6 >= _iterator6.length) break;
        event = _iterator6[_i6++];
      } else {
        _i6 = _iterator6.next();
        if (_i6.done) break;
        event = _i6.value;
      }

      if (!event.hasFired) {
        this.fireEvent(event);
      }
    }
  };

  EventManager.prototype.addEarlyCallbacks = function addEarlyCallbacks() {
    var callbackInfo = void 0;
    for (var _iterator7 = _ddListener, _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : _iterator7[Symbol.iterator]();;) {
      if (_isArray7) {
        if (_i7 >= _iterator7.length) break;
        callbackInfo = _iterator7[_i7++];
      } else {
        _i7 = _iterator7.next();
        if (_i7.done) break;
        callbackInfo = _i7.value;
      }

      this.addCallback(callbackInfo);
    }
  };

  EventManager.prototype.enrichEventWithData = function enrichEventWithData(event) {
    return _EventDataEnricher2['default'].enrichCommonData(event, _digitalData);
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

},{"./DDHelper.js":70,"./EventDataEnricher.js":73,"./functions/after.js":81,"./functions/deleteProperty.js":82,"./functions/jsonIsEqual.js":88,"./functions/noop.js":92,"./functions/size.js":95,"async":1,"component-clone":2,"debug":65}],75:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
    if (options && options.overrideFunctions) {
      _this.defineOverrideFunctions(options.overrideFunctions);
    }
    _this.digitalData = digitalData;
    _this.tags = tags || {};
    _this.onLoad = _this.onLoad.bind(_this);
    _this._isEnriched = false;
    return _this;
  }

  Integration.prototype.defineOverrideFunctions = function defineOverrideFunctions(overrideFunctions) {
    if (overrideFunctions.event) {
      this.overrideEvent = overrideFunctions.event.bind(this);
    }
    if (overrideFunctions.product) {
      this.overrideProduct = overrideFunctions.product.bind(this);
    }
  };

  Integration.prototype.overrideProduct = function overrideProduct(product) {
    // abstract
  };

  Integration.prototype.overrideEvent = function overrideEvent(event) {
    // abstract
  };

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

  Integration.prototype.reset = function reset() {
    // abstract
  };

  Integration.prototype.onEnrich = function onEnrich() {
    this._isEnriched = true;
    this.emit('enrich');
  };

  Integration.prototype.enrichDigitalData = function enrichDigitalData() {
    // abstract
  };

  Integration.prototype.getEnrichableEventProps = function getEnrichableEventProps() {
    return [];
  };

  Integration.prototype.isEnriched = function isEnriched() {
    return this._isEnriched;
  };

  Integration.prototype.setDDManager = function setDDManager(ddManager) {
    this.ddManager = ddManager;
  };

  Integration.prototype.trackEvent = function trackEvent() {
    // abstract
  };

  return Integration;
}(_componentEmitter2['default']);

exports['default'] = Integration;

},{"./functions/deleteProperty.js":82,"./functions/each.js":84,"./functions/format.js":85,"./functions/loadIframe.js":89,"./functions/loadPixel.js":90,"./functions/loadScript.js":91,"./functions/noop.js":92,"async":1,"component-emitter":3,"debug":65}],76:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _lockr = require('lockr');

var _lockr2 = _interopRequireDefault(_lockr);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Storage = function () {
  function Storage() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Storage);

    this.options = Object.assign({
      prefix: 'ddl:'
    }, options);
  }

  Storage.prototype.set = function set(key, val, exp) {
    key = this.getOption('prefix') + key;
    if (exp !== undefined) {
      _lockr2['default'].set(key, {
        val: val,
        exp: exp * 1000,
        time: Date.now()
      });
    } else {
      _lockr2['default'].set(key, val);
    }
  };

  Storage.prototype.get = function get(key) {
    key = this.getOption('prefix') + key;
    var info = _lockr2['default'].get(key);
    if (info !== undefined) {
      if (info.val !== undefined && info.exp && info.time) {
        if (Date.now() - info.time > info.exp) {
          _lockr2['default'].rm(key);
          return undefined;
        }
        return info.val;
      }
    }
    return info;
  };

  Storage.prototype.remove = function remove(key) {
    key = this.getOption('prefix') + key;
    return _lockr2['default'].rm(key);
  };

  Storage.prototype.isEnabled = function isEnabled() {
    return _lockr2['default'].enabled;
  };

  Storage.prototype.getOption = function getOption(name) {
    return this.options[name];
  };

  return Storage;
}();

exports['default'] = Storage;

},{"lockr":67}],77:[function(require,module,exports){
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

},{"./functions/noop.js":92}],78:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _GoogleAnalytics = require('./integrations/GoogleAnalytics.js');

var _GoogleAnalytics2 = _interopRequireDefault(_GoogleAnalytics);

var _GoogleTagManager = require('./integrations/GoogleTagManager.js');

var _GoogleTagManager2 = _interopRequireDefault(_GoogleTagManager);

var _GoogleAdWords = require('./integrations/GoogleAdWords.js');

var _GoogleAdWords2 = _interopRequireDefault(_GoogleAdWords);

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

var _Sociomantic = require('./integrations/Sociomantic.js');

var _Sociomantic2 = _interopRequireDefault(_Sociomantic);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var integrations = {
  'Google Analytics': _GoogleAnalytics2['default'],
  'Google Tag Manager': _GoogleTagManager2['default'],
  'Google AdWords': _GoogleAdWords2['default'],
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
  'Emarsys': _Emarsys2['default'],
  'Sociomantic': _Sociomantic2['default']
};

exports['default'] = integrations;

},{"./integrations/Criteo.js":97,"./integrations/Driveback.js":98,"./integrations/Emarsys.js":99,"./integrations/FacebookPixel.js":100,"./integrations/GoogleAdWords.js":101,"./integrations/GoogleAnalytics.js":102,"./integrations/GoogleTagManager.js":103,"./integrations/MyTarget.js":104,"./integrations/OWOXBIStreaming.js":105,"./integrations/RetailRocket.js":106,"./integrations/SegmentStream.js":107,"./integrations/SendPulse.js":108,"./integrations/Sociomantic.js":109,"./integrations/Vkontakte.js":110,"./integrations/YandexMetrica.js":111}],79:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var _componentClone = require('component-clone');

var _componentClone2 = _interopRequireDefault(_componentClone);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _size = require('./functions/size');

var _size2 = _interopRequireDefault(_size);

var _after = require('./functions/after');

var _after2 = _interopRequireDefault(_after);

var _each = require('./functions/each');

var _each2 = _interopRequireDefault(_each);

var _componentEmitter = require('component-emitter');

var _componentEmitter2 = _interopRequireDefault(_componentEmitter);

var _Integration = require('./Integration');

var _Integration2 = _interopRequireDefault(_Integration);

var _EventManager = require('./EventManager');

var _EventManager2 = _interopRequireDefault(_EventManager);

var _EventDataEnricher = require('./EventDataEnricher');

var _EventDataEnricher2 = _interopRequireDefault(_EventDataEnricher);

var _ViewabilityTracker = require('./ViewabilityTracker');

var _ViewabilityTracker2 = _interopRequireDefault(_ViewabilityTracker);

var _DDHelper = require('./DDHelper');

var _DDHelper2 = _interopRequireDefault(_DDHelper);

var _DigitalDataEnricher = require('./DigitalDataEnricher');

var _DigitalDataEnricher2 = _interopRequireDefault(_DigitalDataEnricher);

var _Storage = require('./Storage');

var _Storage2 = _interopRequireDefault(_Storage);

var _DDStorage = require('./DDStorage');

var _DDStorage2 = _interopRequireDefault(_DDStorage);

var _testMode = require('./testMode');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var ddManager = void 0;

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
 * @type {DigitalDataEnricher}
 * @private
 */
var _digitalDataEnricher = void 0;

/**
 * @type {Storage}
 * @private
 */
var _storage = void 0;

/**
 * @type {DDStorage}
 * @private
 */
var _ddStorage = void 0;

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
  if (_typeof(window.digitalData) === 'object') {
    _digitalData = window.digitalData;
  } else {
    window.digitalData = _digitalData;
  }

  if (Array.isArray(window.ddListener)) {
    _ddListener = window.ddListener;
  } else {
    window.ddListener = _ddListener;
  }
}

function _addIntegrations(integrationSettings) {
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
}

function _addIntegrationsEventTracking() {
  _eventManager.addCallback(['on', 'event', function (event) {
    (0, _each2['default'])(_integrations, function (integrationName, integration) {
      // TODO: add EventValidator library
      var trackEvent = false;
      var ex = event.excludeIntegrations;
      var inc = event.includeIntegrations;
      if (ex && inc) {
        return; // TODO: error
      }
      if (ex && !Array.isArray(ex) || inc && !Array.isArray(inc)) {
        return; // TODO: error
      }

      if (inc) {
        if (inc.indexOf(integrationName) >= 0) {
          trackEvent = true;
        } else {
          trackEvent = false;
        }
      } else if (ex) {
        if (ex.indexOf(integrationName) < 0) {
          trackEvent = true;
        } else {
          trackEvent = false;
        }
      } else {
        trackEvent = true;
      }
      if (trackEvent) {
        // important! cloned object is returned (not link)
        var enrichedEvent = _EventDataEnricher2['default'].enrichIntegrationData(event, _digitalData, integration);
        if ((0, _testMode.isTestMode)()) {
          (0, _testMode.logEnrichedIntegrationEvent)(enrichedEvent, integrationName);
        }
        integration.trackEvent(enrichedEvent);
      }
    });
  }], true);
}

function _initializeIntegrations(settings) {
  var version = settings.version;
  var onLoad = function onLoad() {
    _isLoaded = true;
    ddManager.emit('load');
  };

  if (settings && (typeof settings === 'undefined' ? 'undefined' : _typeof(settings)) === 'object') {
    (function () {
      // add integrations
      var integrationSettings = settings.integrations;
      _addIntegrations(integrationSettings);

      // initialize and load integrations
      var loaded = (0, _after2['default'])((0, _size2['default'])(_integrations), onLoad);
      if ((0, _size2['default'])(_integrations) > 0) {
        (0, _each2['default'])(_integrations, function (name, integration) {
          if (!integration.isLoaded() || integration.getOption('noConflict')) {
            integration.once('load', loaded);
            integration.initialize(version);
          } else {
            loaded();
          }
        });
      } else {
        loaded();
      }

      // add event tracking
      _addIntegrationsEventTracking();
    })();
  }
}

ddManager = {

  VERSION: '1.2.10',

  setAvailableIntegrations: function setAvailableIntegrations(availableIntegrations) {
    _availableIntegrations = availableIntegrations;
  },

  processEarlyStubCalls: function processEarlyStubCalls(earlyStubsQueue) {
    var earlyStubCalls = earlyStubsQueue || [];
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
   */
  initialize: function initialize(settings) {
    settings = Object.assign({
      domain: null,
      websiteMaxWidth: 'auto',
      sessionLength: 3600
    }, settings);

    if (_isReady) {
      throw new Error('ddManager is already initialized');
    }

    _prepareGlobals();

    _storage = new _Storage2['default']();
    _ddStorage = new _DDStorage2['default'](_digitalData, _storage);

    // initialize digital data enricher
    _digitalDataEnricher = new _DigitalDataEnricher2['default'](_digitalData, _ddListener, _ddStorage, {
      sessionLength: settings.sessionLength
    });
    _digitalDataEnricher.enrichDigitalData();

    // initialize event manager
    _eventManager = new _EventManager2['default'](_digitalData, _ddListener);
    _eventManager.setViewabilityTracker(new _ViewabilityTracker2['default']({
      websiteMaxWidth: settings.websiteMaxWidth
    }));

    _initializeIntegrations(settings);

    _eventManager.initialize();

    _isReady = true;
    ddManager.emit('ready');

    if ((0, _testMode.isTestMode)()) {
      (0, _testMode.showTestModeOverlay)();
    }
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
    integration.setDDManager(ddManager);
  },

  getIntegration: function getIntegration(name) {
    return _integrations[name];
  },

  get: function get(key) {
    return _DDHelper2['default'].get(key, _digitalData);
  },

  persist: function persist(key, exp) {
    return _ddStorage.persist(key, exp);
  },

  unpersist: function unpersist(key) {
    return _ddStorage.unpersist(key);
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
    if (_ddStorage) {
      _ddStorage.clear();
    }

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

},{"./DDHelper":70,"./DDStorage":71,"./DigitalDataEnricher":72,"./EventDataEnricher":73,"./EventManager":74,"./Integration":75,"./Storage":76,"./ViewabilityTracker":77,"./functions/after":81,"./functions/each":84,"./functions/size":95,"./testMode":113,"async":1,"component-clone":2,"component-emitter":3}],80:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var VIEWED_PAGE = exports.VIEWED_PAGE = 'Viewed Page';
var VIEWED_PRODUCT_DETAIL = exports.VIEWED_PRODUCT_DETAIL = 'Viewed Product Detail';
var VIEWED_PRODUCT_CATEGORY = exports.VIEWED_PRODUCT_CATEGORY = 'Viewed Product Category';
var SEARCHED_PRODUCTS = exports.SEARCHED_PRODUCTS = 'Searched Products';
var VIEWED_CART = exports.VIEWED_CART = 'Viewed Cart';
var COMPLETED_TRANSACTION = exports.COMPLETED_TRANSACTION = 'Completed Transaction';
var VIEWED_CHECKOUT_STEP = exports.VIEWED_CHECKOUT_STEP = 'Viewed Checkout Step';
var COMPLETED_CHECKOUT_STEP = exports.COMPLETED_CHECKOUT_STEP = 'Completed Checkout Step';
var REFUNDED_TRANSACTION = exports.REFUNDED_TRANSACTION = 'Refunded Transaction';
var VIEWED_PRODUCT = exports.VIEWED_PRODUCT = 'Viewed Product';
var CLICKED_PRODUCT = exports.CLICKED_PRODUCT = 'Clicked Product';
var ADDED_PRODUCT = exports.ADDED_PRODUCT = 'Added Product';
var REMOVED_PRODUCT = exports.REMOVED_PRODUCT = 'Removed Product';
var VIEWED_CAMPAIGN = exports.VIEWED_CAMPAIGN = 'Viewed Campaign';
var CLICKED_CAMPAIGN = exports.CLICKED_CAMPAIGN = 'Clicked Campaign';

},{}],81:[function(require,module,exports){
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

},{}],82:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj, prop) {
  try {
    delete obj[prop];
  } catch (e) {
    obj[prop] = undefined;
  }
};

},{}],83:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

exports.getProp = getProp;
exports.setProp = setProp;
function _keyToArray(key) {
  key = key.trim();
  if (key === '') {
    return [];
  }
  key = key.replace(/\[(\w+)\]/g, '.$1');
  key = key.replace(/^\./, '');
  return key.split('.');
}

function getProp(obj, prop) {
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
}

function setProp(obj, prop, value) {
  if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object' || typeof prop !== 'string') {
    return;
  }
  var keyParts = _keyToArray(prop);
  for (var i = 0; i < keyParts.length; i++) {
    var p = keyParts[i];
    if (_typeof(obj[p]) !== 'object') {
      obj[p] = {};
    }
    if (i === keyParts.length - 1) {
      obj[p] = value;
    }
    obj = obj[p];
  }
}

exports['default'] = { getProp: getProp, setProp: setProp };

},{}],84:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj, fn) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      fn(key, obj[key]);
    }
  }
};

},{}],85:[function(require,module,exports){
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

},{}],86:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = getVarValue;

var _dotProp = require('./dotProp');

function getVarValue(variable, source) {
  if (variable.type === 'constant') {
    return variable.value;
  }
  return (0, _dotProp.getProp)(source, variable.value);
}

},{"./dotProp":83}],87:[function(require,module,exports){
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

},{}],88:[function(require,module,exports){
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

},{}],89:[function(require,module,exports){
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

},{"./scriptOnLoad.js":93,"async":1}],90:[function(require,module,exports){
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

},{}],91:[function(require,module,exports){
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

},{"./scriptOnLoad.js":93,"async":1}],92:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function () {};

},{}],93:[function(require,module,exports){
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

},{}],94:[function(require,module,exports){
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

},{}],95:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj) {
  var size = 0;
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

},{}],96:[function(require,module,exports){
'use strict';

require('./polyfill.js');

var _ddManager = require('./ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

var _availableIntegrations = require('./availableIntegrations.js');

var _availableIntegrations2 = _interopRequireDefault(_availableIntegrations);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var earlyStubsQueue = window.ddManager;
window.ddManager = _ddManager2['default'];

_ddManager2['default'].setAvailableIntegrations(_availableIntegrations2['default']);
_ddManager2['default'].processEarlyStubCalls(earlyStubsQueue);

},{"./availableIntegrations.js":78,"./ddManager.js":79,"./polyfill.js":112}],97:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _dotProp = require('./../functions/dotProp');

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
      noConflict: false,
      userSegmentVar: undefined
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

  Criteo.prototype.getEnrichableEventProps = function getEnrichableEventProps(event) {
    var enrichableProps = [];
    switch (event.name) {
      case 'Viewed Page':
        enrichableProps = ['website.type', 'user.email', 'page.type'];
        break;
      case 'Viewed Product Detail':
        enrichableProps = ['product.id'];
        break;
      case 'Viewed Product Category':
      case 'Searched Products':
        enrichableProps = ['listing.items'];
        break;
      case 'Viewed Cart':
        enrichableProps = ['cart'];
        break;
      case 'Completed Transaction':
        enrichableProps = ['context.campaign', 'transaction'];
        break;
      default:
      // do nothing
    }

    var userSegmentVar = this.getOption('userSegmentVar');
    if (userSegmentVar) {
      enrichableProps.push(userSegmentVar);
    }

    return enrichableProps;
  };

  Criteo.prototype.getUserSegment = function getUserSegment(event) {
    var userSegmentVar = this.getOption('userSegmentVar');
    var userSegment = void 0;
    if (userSegmentVar) {
      userSegment = (0, _dotProp.getProp)(event, userSegmentVar);
    }
    return userSegment;
  };

  Criteo.prototype.pushCriteoQueue = function pushCriteoQueue(criteoEvent, userSegment) {
    if (criteoEvent) {
      if (userSegment) {
        criteoEvent.user_segment = userSegment;
      }
      this.criteo_q.push(criteoEvent);
    }

    // final push to criteo in signle hit
    if (this.criteo_q.length === 1) {
      window.criteo_q.push(this.criteo_q[0]);
    } else {
      window.criteo_q.push(this.criteo_q);
    }
    this.criteo_q = [];
  };

  Criteo.prototype.initialize = function initialize() {
    window.criteo_q = window.criteo_q || [];
    this.criteo_q = [];
    if (this.getOption('account') && !this.getOption('noConflict')) {
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
      'Searched Products': 'onViewedProductListing',
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
    var siteType = void 0;
    if (event.version && page && _semver2['default'].cmp(event.version, '1.1.0') < 0) {
      siteType = page.siteType;
    } else if (event.website) {
      siteType = event.website.type;
    }

    if (siteType) {
      siteType = siteType.toLocaleLowerCase();
    }

    if (['desktop', 'tablet', 'mobile'].indexOf(siteType) < 0) {
      siteType = 'desktop';
    }

    this.criteo_q.push({
      event: 'setAccount',
      account: this.getOption('account')
    });
    this.criteo_q.push({
      event: 'setSiteType',
      type: siteType.charAt(0) });

    if (event.user && event.user.email) {
      this.criteo_q.push({
        event: 'setEmail',
        email: event.user.email
      });
    }

    if (page) {
      if (page.type === 'home') {
        this.onViewedHome(event);
      } else if (!page.type || ['category', 'product', 'search', 'cart', 'confirmation'].indexOf(page.type) < 0) {
        this.pushCriteoQueue();
      }
    } else {
      this.pushCriteoQueue();
    }
  };

  Criteo.prototype.onViewedHome = function onViewedHome(event) {
    var criteoEvent = {
      event: 'viewHome'
    };
    this.pushCriteoQueue(criteoEvent, this.getUserSegment(event));
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
      this.pushCriteoQueue({
        event: 'viewList',
        item: productIds
      }, this.getUserSegment(event));
    }
  };

  Criteo.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var product = event.product;
    var productId = void 0;
    if (product) {
      productId = product.id || product.skuCode;
    }
    if (productId) {
      this.pushCriteoQueue({
        event: 'viewItem',
        item: productId
      }, this.getUserSegment(event));
    }
  };

  Criteo.prototype.onViewedCart = function onViewedCart(event) {
    var cart = event.cart;
    if (cart && cart.lineItems && cart.lineItems.length > 0) {
      var products = lineItemsToCriteoItems(cart.lineItems);
      if (products.length > 0) {
        this.pushCriteoQueue({
          event: 'viewBasket',
          item: products
        }, this.getUserSegment(event));
      }
    }
  };

  Criteo.prototype.onCompletedTransaction = function onCompletedTransaction(event) {
    var transaction = event.transaction;
    if (transaction && transaction.lineItems && transaction.lineItems.length > 0) {
      var products = lineItemsToCriteoItems(transaction.lineItems);
      if (products.length > 0) {
        var deduplication = 0;
        var context = event.context;
        if (context && context.campaign && context.campaign.source && context.campaign.source.toLocaleLowerCase().indexOf('criteo') >= 0) {
          deduplication = 1;
        }
        this.pushCriteoQueue({
          event: 'trackTransaction',
          id: transaction.orderId,
          new_customer: transaction.isFirst ? 1 : 0,
          deduplication: deduplication,
          item: products
        }, this.getUserSegment(event));
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

},{"./../Integration.js":75,"./../functions/deleteProperty":82,"./../functions/dotProp":83,"./../functions/semver":94}],98:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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

},{"./../Integration.js":75,"./../functions/deleteProperty.js":82,"./../functions/noop.js":92}],99:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
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

function mapLineItems(lineItems, overrideProduct) {
  return lineItems.map(function (lineItem) {
    var product = lineItem.product;
    overrideProduct(product);
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

  Emarsys.prototype.getEnrichableEventProps = function getEnrichableEventProps(event) {
    var enrichableProps = [];
    switch (event.name) {
      case 'Viewed Page':
        enrichableProps = ['page.type', 'user.email', 'user.userId', 'cart'];
        break;
      case 'Viewed Product Detail':
        enrichableProps = ['product.id', 'product.skuCode'];
        break;
      case 'Viewed Product Category':
        enrichableProps = ['listing.category'];
        break;
      case 'Searched Products':
        enrichableProps = ['listing.query'];
        break;
      case 'Completed Transaction':
        enrichableProps = ['transaction'];
        break;
      default:
      // do nothing
    }

    return enrichableProps;
  };

  Emarsys.prototype.isLoaded = function isLoaded() {
    return (typeof ScarabQueue === 'undefined' ? 'undefined' : _typeof(ScarabQueue)) === 'object';
  };

  Emarsys.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'ScarabQueue');
  };

  Emarsys.prototype.enrichDigitalData = function enrichDigitalData() {
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
  };

  Emarsys.prototype.trackEvent = function trackEvent(event) {
    var methods = {
      'Viewed Page': 'onViewedPage',
      'Searched Products': 'onSearchedProducts',
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

  Emarsys.prototype.onViewedPage = function onViewedPage(event) {
    var user = event.user || {};
    var cart = event.cart || {};
    var page = event.page;

    if (user.email) {
      window.ScarabQueue.push(['setEmail', user.email]);
    } else if (user.userId) {
      window.ScarabQueue.push(['setCustomerId', user.userId]);
    }
    if (cart.lineItems && cart.lineItems.length > 0) {
      window.ScarabQueue.push(['cart', mapLineItems(cart.lineItems, this.overrideProduct)]);
    } else {
      window.ScarabQueue.push(['cart', []]);
    }

    // product, category, search and confirmation pages are tracked separately
    if (['product', 'category', 'search', 'confirmation'].indexOf(page.type) < 0) {
      go();
    }
  };

  Emarsys.prototype.onViewedProductCategory = function onViewedProductCategory(event) {
    var listing = event.listing || {};
    var category = listing.category;
    if (listing.category) {
      if (Array.isArray(listing.category)) {
        category = category.join(this.getOption('categorySeparator'));
      }
      window.ScarabQueue.push(['category', category]);
    }
    go();
  };

  Emarsys.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var product = event.product || {};
    this.overrideProduct(product);
    if (product.id || product.skuCode) {
      window.ScarabQueue.push(['view', product.id || product.skuCode]);
    }
    go();
  };

  Emarsys.prototype.onSearchedProducts = function onSearchedProducts(event) {
    var listing = event.listing || {};
    if (listing.query) {
      window.ScarabQueue.push(['searchTerm', listing.query]);
    }
    go();
  };

  Emarsys.prototype.onCompletedTransaction = function onCompletedTransaction(event) {
    var transaction = event.transaction || {};
    if (transaction.orderId && transaction.lineItems) {
      window.ScarabQueue.push(['purchase', {
        orderId: transaction.orderId,
        items: mapLineItems(transaction.lineItems, this.overrideProduct)
      }]);
    }
    go();
  };

  return Emarsys;
}(_Integration3['default']);

exports['default'] = Emarsys;

},{"./../Integration.js":75,"./../functions/deleteProperty.js":82}],100:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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

function getProductCategory(product) {
  var category = product.category;
  if (Array.isArray(category)) {
    category = category.join('/');
  } else if (category && product.subcategory) {
    category = category + '/' + product.subcategory;
  }
  return category;
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

  FacebookPixel.prototype.getEnrichableEventProps = function getEnrichableEventProps(event) {
    var enrichableProps = [];
    switch (event.name) {
      case 'Viewed Product Detail':
        enrichableProps = ['product'];
        break;
      case 'Completed Transaction':
        enrichableProps = ['transaction'];
        break;
      default:
      // do nothing
    }

    return enrichableProps;
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
    var category = getProductCategory(product);
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id || product.skuCode || ''],
      content_type: 'product',
      content_name: product.name || '',
      content_category: category || ''
    });
  };

  FacebookPixel.prototype.onAddedProduct = function onAddedProduct(product, quantity) {
    if (product && (0, _componentType2['default'])(product) === 'object') {
      var category = getProductCategory(product);
      quantity = quantity || 1;
      window.fbq('track', 'AddToCart', {
        content_ids: [product.id || product.skuCode || ''],
        content_type: 'product',
        content_name: product.name || '',
        content_category: category || ''
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

},{"./../Integration.js":75,"./../functions/deleteProperty.js":82,"component-type":4}],101:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
  lineItems = lineItems || [];
  var productIds = lineItems.filter(function (lineItem) {
    return !!(lineItem.product.id || lineItem.product.skuCode);
  }).map(function (lineItem) {
    return lineItem.product.id || lineItem.product.skuCode;
  });
  return productIds;
}

function mapPageType(pageType) {
  var map = {
    home: 'home',
    search: 'searchresults'
  };
  if (map[pageType]) {
    return map[pageType];
  }
  return 'other';
}

var GoogleAdWords = function (_Integration) {
  _inherits(GoogleAdWords, _Integration);

  function GoogleAdWords(digitalData, options) {
    _classCallCheck(this, GoogleAdWords);

    var optionsWithDefaults = Object.assign({
      conversionId: '',
      remarketingOnly: false
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.addTag({
      type: 'script',
      attr: {
        src: '//www.googleadservices.com/pagead/conversion_async.js'
      }
    });
    return _this;
  }

  GoogleAdWords.prototype.getEnrichableEventProps = function getEnrichableEventProps(event) {
    var enrichableProps = [];
    switch (event.name) {
      case 'Viewed Page':
        enrichableProps = ['page.type'];
        break;
      case 'Viewed Product Detail':
        enrichableProps = ['product'];
        break;
      case 'Viewed Product Category':
        enrichableProps = ['listing.category'];
        break;
      case 'Viewed Cart':
        enrichableProps = ['cart'];
        break;
      case 'Completed Transaction':
        enrichableProps = ['transaction'];
        break;
      default:
      // do nothing
    }

    return enrichableProps;
  };

  GoogleAdWords.prototype.initialize = function initialize() {
    var _this2 = this;

    this.asyncQueue = [];

    // emulate async queue for Google AdWords sync script
    var invervalCounter = 0;
    var invervalId = setInterval(function () {
      invervalCounter++;
      if (_this2.isLoaded()) {
        _this2.flushQueue();
        clearInterval(invervalId);
      } else if (invervalCounter > 10) {
        clearInterval(invervalId);
      }
    }, 100);

    if (!this.getOption('noConflict')) {
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  };

  GoogleAdWords.prototype.isLoaded = function isLoaded() {
    return !!window.google_trackConversion;
  };

  GoogleAdWords.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'google_trackConversion');
  };

  GoogleAdWords.prototype.trackEvent = function trackEvent(event) {
    var methods = {
      'Viewed Page': 'onViewedPage',
      'Viewed Product Category': 'onViewedProductCategory',
      'Viewed Product Detail': 'onViewedProductDetail',
      'Completed Transaction': 'onCompletedTransaction',
      'Viewed Cart': 'onViewedCart'
    };

    var method = methods[event.name];
    if (method && this.getOption('conversionId')) {
      this[method](event);
    }
  };

  GoogleAdWords.prototype.trackConversion = function trackConversion(params) {
    var trackConversionEvent = {
      google_conversion_id: this.getOption('conversionId'),
      google_custom_params: params,
      google_remarketing_only: this.getOption('remarketingOnly')
    };
    if (this.isLoaded()) {
      window.google_trackConversion(trackConversionEvent);
    } else {
      this.asyncQueue.push(trackConversionEvent);
    }
  };

  GoogleAdWords.prototype.flushQueue = function flushQueue() {
    var trackConversionEvent = this.asyncQueue.shift();
    while (trackConversionEvent) {
      window.google_trackConversion(trackConversionEvent);
      trackConversionEvent = this.asyncQueue.shift();
    }
  };

  GoogleAdWords.prototype.onViewedPage = function onViewedPage(event) {
    var page = event.page;
    // product, category, cart, checkout and confirmation pages are tracked separately
    if (['product', 'category', 'cart', 'checkout', 'confirmation'].indexOf(page.type) < 0) {
      this.trackConversion({
        ecomm_prodid: '',
        ecomm_pagetype: mapPageType(page.type),
        ecomm_totalvalue: ''
      });
    }
  };

  GoogleAdWords.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var product = event.product;
    if (!product) {
      return;
    }
    var category = product.category;
    if (Array.isArray(category)) {
      category = category.join('/');
    } else if (category && product.subcategory) {
      // legacy DDL support
      category = category + '/' + product.subcategory;
    }

    this.trackConversion({
      ecomm_prodid: product.id || product.skuCode || undefined,
      ecomm_pagetype: 'product',
      ecomm_totalvalue: product.unitSalePrice || product.unitPrice || '',
      ecomm_category: category
    });
  };

  GoogleAdWords.prototype.onViewedProductCategory = function onViewedProductCategory(event) {
    var listing = event.listing;
    if (!listing) {
      return;
    }

    var category = listing.category;
    if (Array.isArray(category)) {
      category = category.join('/');
    }

    this.trackConversion({
      ecomm_prodid: '',
      ecomm_pagetype: 'category',
      ecomm_totalvalue: '',
      ecomm_category: category
    });
  };

  GoogleAdWords.prototype.onViewedCart = function onViewedCart(event) {
    var cart = event.cart;
    if (!cart) {
      return;
    }

    this.trackConversion({
      ecomm_prodid: lineItemsToProductIds(cart.lineItems),
      ecomm_pagetype: 'cart',
      ecomm_totalvalue: cart.subtotal || cart.total || ''
    });
  };

  GoogleAdWords.prototype.onCompletedTransaction = function onCompletedTransaction(event) {
    var transaction = event.transaction;
    if (!transaction) {
      return;
    }
    this.trackConversion({
      ecomm_prodid: lineItemsToProductIds(transaction.lineItems),
      ecomm_pagetype: 'purchase',
      ecomm_totalvalue: transaction.subtotal || transaction.total || ''
    });
  };

  return GoogleAdWords;
}(_Integration3['default']);

exports['default'] = GoogleAdWords;

},{"./../Integration.js":75,"./../functions/deleteProperty.js":82}],102:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _dotProp = require('./../functions/dotProp');

var _each = require('./../functions/each.js');

var _each2 = _interopRequireDefault(_each);

var _size = require('./../functions/size.js');

var _size2 = _interopRequireDefault(_size);

var _componentClone = require('component-clone');

var _componentClone2 = _interopRequireDefault(_componentClone);

var _events = require('./../events');

var _variableTypes = require('./../variableTypes');

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

    var optionValue = (0, _dotProp.getProp)(event, optionName);
    if (optionValue) {
      options.push(optionValue);
    }
  }
  return options.join(', ');
}

function getProductCategory(product) {
  var category = product.category;
  if (Array.isArray(category)) {
    category = category.join('/');
  } else if (category && product.subcategory) {
    category = category + '/' + product.subcategory;
  }
  return category;
}

var GoogleAnalytics = function (_Integration) {
  _inherits(GoogleAnalytics, _Integration);

  function GoogleAnalytics(digitalData, options) {
    _classCallCheck(this, GoogleAnalytics);

    var optionsWithDefaults = Object.assign({
      trackingId: '',
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
      contentGroupings: {}, // legacy version
      contentGroups: {},
      productDimensions: {},
      productMetrics: {},
      namespace: undefined,
      noConflict: false,
      checkoutOptions: ['option', 'paymentMethod', 'shippingMethod']
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

  GoogleAnalytics.prototype.getEnrichableEventProps = function getEnrichableEventProps(event) {
    var enrichableProps = [];
    switch (event.name) {
      case _events.VIEWED_PAGE:
        enrichableProps = ['user.userId', 'website.currency', 'page'];
        var enrichableDimensionsProps = this.getEnrichableDimensionsProps();
        for (var _iterator2 = enrichableDimensionsProps, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          var _ref2;

          if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            _ref2 = _iterator2[_i2++];
          } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            _ref2 = _i2.value;
          }

          var enrichableDimensionsProp = _ref2;

          enrichableProps.push(enrichableDimensionsProp);
        }
        break;
      case _events.VIEWED_PRODUCT_DETAIL:
        enrichableProps = ['product'];
        break;
      case _events.VIEWED_CHECKOUT_STEP:
        enrichableProps = ['cart', 'transaction'];
        break;
      case _events.COMPLETED_TRANSACTION:
      case _events.REFUNDED_TRANSACTION:
        enrichableProps = ['transaction'];
        break;
      default:
      // do nothing
    }

    return enrichableProps;
  };

  GoogleAnalytics.prototype.initialize = function initialize(version) {
    this.initVersion = version;

    // support of legacy version
    if (!this.initVersion && !this.getOption('namespace') && this.getOption('namespace') !== false) {
      this.setOption('namespace', 'ddl');
    }

    this.prepareCustomDimensions();

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
      _Integration.prototype.onLoad.call(this);
    }
    this.enrichDigitalData();
  };

  GoogleAnalytics.prototype.prepareCustomDimensions = function prepareCustomDimensions() {
    var _this2 = this;

    this.enrichableDimensionsProps = [];
    this.productLevelDimensions = {};
    this.hitLevelDimentsions = {};

    var settings = Object.assign(this.getOption('metrics'), this.getOption('dimensions'), this.getOption('contentGroups'));

    if (!this.initVersion) {
      settings = Object.assign(settings, this.getOption('contentGroupings'));
      (0, _each2['default'])(settings, function (key, value) {
        _this2.enrichableDimensionsProps.push(value);
        _this2.hitLevelDimentsions[key] = value;
      });
      var productSettings = Object.assign(this.getOption('productMetrics'), this.getOption('productDimensions'));
      (0, _each2['default'])(productSettings, function (key, value) {
        _this2.productLevelDimensions[key] = value;
      });
    } else {
      (0, _each2['default'])(settings, function (key, variable) {
        if (variable.type === _variableTypes.PRODUCT_VAR) {
          _this2.productLevelDimensions[key] = variable.value;
        } else {
          if (variable.type === _variableTypes.DIGITALDATA_VAR) {
            _this2.enrichableDimensionsProps.push(variable.value);
            _this2.hitLevelDimentsions[key] = variable.value;
          } else if (variable.type === _variableTypes.EVENT_VAR) {
            _this2.hitLevelDimentsions[key] = variable.value;
          }
        }
      });
    }
  };

  GoogleAnalytics.prototype.getEnrichableDimensionsProps = function getEnrichableDimensionsProps() {
    return this.enrichableDimensionsProps;
  };

  GoogleAnalytics.prototype.getProductLevelDimensions = function getProductLevelDimensions() {
    return this.productLevelDimensions;
  };

  GoogleAnalytics.prototype.getHitLevelDimensions = function getHitLevelDimensions() {
    return this.hitLevelDimentsions;
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

    // anonymize after initializing, otherwise a warning is shown
    // in google analytics debugger
    if (this.getOption('anonymizeIp')) this.ga('set', 'anonymizeIp', true);
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
    var productScope = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var settings = void 0;
    if (productScope) {
      settings = this.getProductLevelDimensions();
    } else {
      settings = this.getHitLevelDimensions();
    }
    var custom = {};
    (0, _each2['default'])(settings, function (key, value) {
      var dimensionVal = (0, _dotProp.getProp)(source, value);
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
    this.setEventCustomDimensions(event);

    if (this.getPageview()) {
      this.flushPageview();
    } else {
      // Send a custom non-interaction event to ensure all EE data is pushed.
      // Without doing this we'd need to require page display after setting EE data.
      var cleanedArgs = [];
      var args = ['send', 'event', event.category || 'Ecommerce', event.action || event.name || 'not defined', event.label, {
        nonInteraction: 1
      }];

      for (var _iterator3 = args, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref3;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref3 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref3 = _i3.value;
        }

        var arg = _ref3;

        if (arg !== undefined) {
          cleanedArgs.push(arg);
        }
      }

      this.ga.apply(this, cleanedArgs);
    }
  };

  GoogleAnalytics.prototype.enrichDigitalData = function enrichDigitalData() {
    var _this3 = this;

    window.ga(function (tracker) {
      var trackerName = _this3.getOption('namespace');
      tracker = tracker || window.ga.getByName(trackerName);
      if (tracker) {
        _this3.digitalData.integrations.googleAnalytics = {
          clientId: tracker.get('clientId')
        };
      }
      _this3.onEnrich();
    });
  };

  GoogleAnalytics.prototype.isPageviewDelayed = function isPageviewDelayed(pageType) {
    if (!this.getOption('enhancedEcommerce')) {
      return false;
    }
    var map = {
      'category': _events.VIEWED_PRODUCT_CATEGORY,
      'product': _events.VIEWED_PRODUCT_DETAIL,
      'cart': [_events.VIEWED_CART, _events.VIEWED_CHECKOUT_STEP],
      'confirmation': _events.COMPLETED_TRANSACTION,
      'search': _events.SEARCHED_PRODUCTS,
      'checkout': _events.VIEWED_CHECKOUT_STEP
    };

    var eventNames = map[pageType];
    if (!eventNames) {
      return false;
    }

    if (!Array.isArray(eventNames)) {
      eventNames = [eventNames];
    }

    return true;
  };

  GoogleAnalytics.prototype.trackEvent = function trackEvent(event) {
    if (event.name === _events.VIEWED_PAGE) {
      if (!this.getOption('noConflict')) {
        this.onViewedPage(event);
      }
    } else if (this.getOption('enhancedEcommerce')) {
      var _methods;

      var methods = (_methods = {}, _methods[_events.VIEWED_PRODUCT] = this.onViewedProduct, _methods[_events.CLICKED_PRODUCT] = this.onClickedProduct, _methods[_events.VIEWED_PRODUCT_DETAIL] = this.onViewedProductDetail, _methods[_events.ADDED_PRODUCT] = this.onAddedProduct, _methods[_events.REMOVED_PRODUCT] = this.onRemovedProduct, _methods[_events.COMPLETED_TRANSACTION] = this.onCompletedTransactionEnhanced, _methods[_events.REFUNDED_TRANSACTION] = this.onRefundedTransaction, _methods[_events.VIEWED_CAMPAIGN] = this.onViewedCampaign, _methods[_events.CLICKED_CAMPAIGN] = this.onClickedCampaign, _methods[_events.VIEWED_CHECKOUT_STEP] = this.onViewedCheckoutStep, _methods[_events.COMPLETED_CHECKOUT_STEP] = this.onCompletedCheckoutStep, _methods[_events.VIEWED_PRODUCT_CATEGORY] = this.onViewedProductCategory, _methods[_events.VIEWED_CART] = this.onViewedCart, _methods[_events.SEARCHED_PRODUCTS] = this.onSearchedProducts, _methods);
      var method = methods[event.name];
      if (method) {
        method.bind(this)(event);
      } else {
        this.onCustomEvent(event);
      }
    } else {
      if (event.name === _events.COMPLETED_TRANSACTION && !this.getOption('noConflict')) {
        this.onCompletedTransaction(event);
      } else {
        if ([_events.VIEWED_PRODUCT_DETAIL, _events.VIEWED_PRODUCT_CATEGORY, _events.SEARCHED_PRODUCTS, _events.COMPLETED_TRANSACTION, _events.VIEWED_CART].indexOf(event.name) < 0) {
          this.onCustomEvent(event);
        }
      }
    }
  };

  GoogleAnalytics.prototype.setPageview = function setPageview(pageview) {
    this.pageview = pageview;
  };

  GoogleAnalytics.prototype.getPageview = function getPageview() {
    return this.pageview;
  };

  GoogleAnalytics.prototype.flushPageview = function flushPageview() {
    this.ga('send', 'pageview', this.pageview);
    this.pageCalled = true;
    this.pageview = null;
  };

  GoogleAnalytics.prototype.onViewedPage = function onViewedPage(event) {
    var _this4 = this;

    // send global id
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

    if (this.pageCalled) {
      (0, _deleteProperty2['default'])(pageview, 'location');
    }
    this.setPageview(pageview);

    // set
    if (this.getOption('sendUserId')) {
      var userId = (0, _dotProp.getProp)(event, 'user.userId');
      if (userId) {
        this.ga('set', 'userId', userId);
      }
    }

    // set
    if (this.getOption('enhancedEcommerce')) {
      var currency = (0, _dotProp.getProp)(event, 'website.currency');
      this.loadEnhancedEcommerce(currency);
    }

    // set
    this.ga('set', {
      page: pagePath,
      title: pageTitle
    });

    // send
    this.setEventCustomDimensions(event);

    if (!this.isPageviewDelayed(page.type)) {
      this.flushPageview();
    } else {
      setTimeout(function () {
        if (_this4.isLoaded() && _this4.getPageview()) {
          _this4.flushPageview(); // flush anyway in 100ms
        }
      }, 100);
    }
  };

  GoogleAnalytics.prototype.onViewedProduct = function onViewedProduct(event) {
    var listItems = event.listItems;
    if ((!listItems || !Array.isArray(listItems)) && event.listItem) {
      listItems = [event.listItem];
    }

    for (var _iterator4 = listItems, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
      var _ref4;

      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        _ref4 = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        _ref4 = _i4.value;
      }

      var listItem = _ref4;

      var product = listItem.product;
      if (!product.id && !product.skuCode && !product.name) {
        continue;
      }

      var custom = this.getCustomDimensions(product, true);
      var gaProduct = Object.assign({
        id: product.id || product.skuCode,
        name: product.name,
        list: listItem.listName,
        category: getProductCategory(product),
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
    this.enhancedEcommerceProductAction(event, 'click', {
      list: event.listItem.listName
    });
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    this.enhancedEcommerceProductAction(event, 'detail');
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onAddedProduct = function onAddedProduct(event) {
    this.enhancedEcommerceProductAction(event, 'add');
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onRemovedProduct = function onRemovedProduct(event) {
    this.enhancedEcommerceProductAction(event, 'remove');
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onCompletedTransaction = function onCompletedTransaction(event) {
    var _this5 = this;

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
        _this5.ga('ecommerce:addItem', {
          id: product.id,
          category: getProductCategory(product),
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
    var _this6 = this;

    var transaction = event.transaction;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    (0, _each2['default'])(transaction.lineItems, function (key, lineItem) {
      var product = lineItem.product;
      if (product) {
        product.currency = product.currency || transaction.currency || _this6.getOption('defaultCurrency');
        _this6.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
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
    var _this7 = this;

    var transaction = event.transaction;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    (0, _each2['default'])(transaction.lineItems, function (key, lineItem) {
      var product = lineItem.product;
      if (product) {
        product.currency = product.currency || transaction.currency || _this7.getOption('defaultCurrency');
        _this7.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
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

    for (var _iterator5 = campaigns, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
      var _ref5;

      if (_isArray5) {
        if (_i5 >= _iterator5.length) break;
        _ref5 = _iterator5[_i5++];
      } else {
        _i5 = _iterator5.next();
        if (_i5.done) break;
        _ref5 = _i5.value;
      }

      var campaign = _ref5;

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
    var _this8 = this;

    var cartOrTransaction = (0, _dotProp.getProp)(event, 'cart') || (0, _dotProp.getProp)(event, 'transaction');

    (0, _each2['default'])(cartOrTransaction.lineItems, function (key, lineItem) {
      var product = lineItem.product;
      if (product) {
        product.currency = product.currency || cartOrTransaction.currency || _this8.getOption('defaultCurrency');
        _this8.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    this.ga('ec:setAction', 'checkout', {
      step: event.step || 1,
      option: getCheckoutOptions(event, this.getOption('checkoutOptions')) || undefined
    });

    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onCompletedCheckoutStep = function onCompletedCheckoutStep(event) {
    var options = getCheckoutOptions(event, this.getOption('checkoutOptions'));
    if (!event.step || !options) {
      return;
    }

    this.ga('ec:setAction', 'checkout_option', {
      step: event.step,
      option: options
    });

    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onViewedProductCategory = function onViewedProductCategory(event) {
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onViewedCart = function onViewedCart(event) {
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onSearchedProducts = function onSearchedProducts(event) {
    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onCustomEvent = function onCustomEvent(event) {
    var payload = {
      eventAction: event.action || event.name || 'event',
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
    for (var _i6 = 0; _i6 < _arr.length; _i6++) {
      var prop = _arr[_i6];
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
      category: getProductCategory(product),
      price: product.unitSalePrice || product.unitPrice,
      brand: product.brand || product.manufacturer,
      variant: product.variant,
      currency: product.currency
    }, custom);
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

},{"./../Integration.js":75,"./../events":80,"./../functions/deleteProperty.js":82,"./../functions/dotProp":83,"./../functions/each.js":84,"./../functions/size.js":95,"./../variableTypes":114,"component-clone":2}],103:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
    window.dataLayer = window.dataLayer || [];
    this.ddManager.on('ready', function () {
      window.dataLayer.push({ event: 'DDManager Ready' });
    });
    this.ddManager.on('load', function () {
      window.dataLayer.push({ event: 'DDManager Loaded' });
    });
    if (this.getOption('containerId') && this.getOption('noConflict') === false) {
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
    var dlEvent = Object.assign({}, event);
    var name = dlEvent.name;
    var category = dlEvent.category;
    (0, _deleteProperty2['default'])(dlEvent, 'name');
    (0, _deleteProperty2['default'])(dlEvent, 'category');
    dlEvent.event = name;
    dlEvent.eventCategory = category;
    window.dataLayer.push(dlEvent);
  };

  return GoogleTagManager;
}(_Integration3['default']);

exports['default'] = GoogleTagManager;

},{"./../Integration.js":75,"./../functions/deleteProperty.js":82}],104:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _getVarValue = require('./../functions/getVarValue');

var _getVarValue2 = _interopRequireDefault(_getVarValue);

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
      listVar: {
        'type': 'constant',
        'value': '1'
      },
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

  MyTarget.prototype.getEnrichableEventProps = function getEnrichableEventProps(event) {
    var enrichableProps = [];
    switch (event.name) {
      case 'Viewed Page':
        enrichableProps = ['page.type'];
        break;
      case 'Viewed Product Detail':
        enrichableProps = ['product'];
        break;
      case 'Viewed Cart':
        enrichableProps = ['cart'];
        break;
      case 'Completed Transaction':
        enrichableProps = ['transaction'];
        break;
      default:
      // do nothing
    }

    var listVar = this.getOption('listVar');
    if (listVar.type === 'digitalData') {
      enrichableProps.push(listVar.value);
    }
    return enrichableProps;
  };

  MyTarget.prototype.isLoaded = function isLoaded() {
    return !!(window._tmr && window._tmr.unload);
  };

  MyTarget.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, '_tmr');
  };

  MyTarget.prototype.getList = function getList(event) {
    var listVar = this.getOption('listVar');
    var list = void 0;
    if (listVar) {
      list = (0, _getVarValue2['default'])(listVar, event);
    }
    return list;
  };

  MyTarget.prototype.trackEvent = function trackEvent(event) {
    var methods = {
      'Viewed Page': 'onViewedPage',
      'Viewed Product Category': 'onViewedProductCategory',
      'Viewed Product Detail': 'onViewedProductDetail',
      'Viewed Cart': 'onViewedCart',
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
        this.onViewedHome(event);
      } else if (['product', 'category', 'checkout', 'confirmation', 'cart'].indexOf(page.type) < 0) {
        this.onViewedOtherPage(event);
      }
    }
  };

  MyTarget.prototype.onViewedHome = function onViewedHome(event) {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'home',
      totalvalue: '',
      list: this.getList(event)
    });
  };

  MyTarget.prototype.onViewedProductCategory = function onViewedProductCategory(event) {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'category',
      totalvalue: '',
      list: this.getList(event)
    });
  };

  MyTarget.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var product = event.product;
    window._tmr.push({
      type: 'itemView',
      productid: product.id || '',
      pagetype: 'product',
      totalvalue: product.unitSalePrice || product.unitPrice || '',
      list: this.getList(event)
    });
  };

  MyTarget.prototype.onViewedCart = function onViewedCart(event) {
    var cart = event.cart;
    var productIds = void 0;

    if (cart.lineItems || cart.lineItems.length > 0) {
      productIds = lineItemsToProductIds(cart.lineItems);
    }

    window._tmr.push({
      type: 'itemView',
      productid: productIds || '',
      pagetype: 'cart',
      totalvalue: cart.total || cart.subtotal || '',
      list: this.getList(event)
    });
  };

  MyTarget.prototype.onViewedOtherPage = function onViewedOtherPage(event) {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'other',
      totalvalue: '',
      list: this.getList(event)
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
      list: this.getList(event)
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

},{"./../Integration":75,"./../functions/deleteProperty":82,"./../functions/getVarValue":86}],105:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
      namespace: undefined,
      sessionIdDimension: undefined
    }, options);

    return _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));
  }

  OWOXBIStreaming.prototype.initialize = function initialize(version) {
    this.initVersion = version;

    // support of legacy version
    if (!this.initVersion && !this.getOption('namespace') && this.getOption('namespace') !== false) {
      this.setOption('namespace', 'ddl');
    }

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

},{"./../Integration.js":75}],106:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _dotProp = require('./../functions/dotProp');

var _getVarValue = require('./../functions/getVarValue');

var _getVarValue2 = _interopRequireDefault(_getVarValue);

var _each = require('./../functions/each');

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

  RetailRocket.prototype.getEnrichableEventProps = function getEnrichableEventProps(event) {
    var enrichableProps = [];
    switch (event.name) {
      case 'Viewed Page':
        enrichableProps = ['user.email', 'user.isSubscribed'];
        break;
      case 'Viewed Product Detail':
        enrichableProps = ['product.id'];
        break;
      case 'Viewed Product Category':
        enrichableProps = ['listing.categoryId'];
        break;
      case 'Searched Products':
        enrichableProps = ['listing.query'];
        break;
      case 'Completed Transaction':
        enrichableProps = ['transaction'];
        break;
      default:
      // do nothing
    }

    if (['Viewed Page', 'Subscribed'].indexOf(event.name) >= 0) {
      var settings = this.getOption('customVariables');
      (0, _each2['default'])(settings, function (key, variable) {
        if (variable.type === 'digitalData') {
          enrichableProps.push(variable.value);
        }
      });
    }

    return enrichableProps;
  };

  RetailRocket.prototype.initialize = function initialize() {
    if (this.getOption('partnerId')) {
      window.rrPartnerId = this.getOption('partnerId');
      var userId = (0, _dotProp.getProp)(this.digitalData, this.getOption('userIdProperty'));
      if (userId) {
        window.rrPartnerUserId = userId;
      }
      window.rrApi = {};
      window.rrApiOnReady = window.rrApiOnReady || [];
      window.rrApi.pageView = window.rrApi.addToBasket = window.rrApi.order = window.rrApi.categoryView = window.rrApi.setEmail = window.rrApi.view = window.rrApi.recomMouseDown = window.rrApi.recomAddToCart = window.rrApi.search = function () {};

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
      if (event.name === 'Viewed Page') {
        this.onViewedPage(event);
      } else if (event.name === 'Viewed Product Category') {
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
        this.onSubscribed(event);
      } else if (event.name === 'Searched Products') {
        this.onSearched(event.listing);
      }
    } else {
      if (event.name === 'Subscribed') {
        this.onSubscribed(event);
      }
    }
  };

  RetailRocket.prototype.onViewedPage = function onViewedPage(event) {
    var user = event.user;
    if (user && user.email) {
      if (this.getOption('trackAllEmails') === true || user.isSubscribed === true) {
        this.onSubscribed(event);
      }
    }
  };

  RetailRocket.prototype.onViewedProductCategory = function onViewedProductCategory(listing) {
    listing = listing || {};
    var categoryId = listing.categoryId;
    if (!categoryId) {
      return;
    }
    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.categoryView(categoryId);
      } catch (e) {
        // do nothing
      }
    });
  };

  RetailRocket.prototype.onViewedProductDetail = function onViewedProductDetail(product) {
    var productId = this.getProductId(product);
    if (!productId) {
      return;
    }
    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.view(productId);
      } catch (e) {
        // do nothing
      }
    });
  };

  RetailRocket.prototype.onAddedProduct = function onAddedProduct(product) {
    var productId = this.getProductId(product);
    if (!productId) {
      return;
    }
    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.addToBasket(productId);
      } catch (e) {
        // do nothing
      }
    });
  };

  RetailRocket.prototype.onClickedProduct = function onClickedProduct(listItem) {
    if (!listItem) {
      return;
    }
    var productId = this.getProductId(listItem.product);
    if (!productId) {
      return;
    }
    var listId = listItem.listId;
    if (!listId) {
      return;
    }
    var methodName = this.getOption('listMethods')[listId];
    if (!methodName) {
      return;
    }
    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.recomMouseDown(productId, methodName);
      } catch (e) {
        // do nothing
      }
    });
  };

  RetailRocket.prototype.onCompletedTransaction = function onCompletedTransaction(transaction) {
    transaction = transaction || {};
    if (!this.validateTransaction(transaction)) {
      return;
    }

    var areLineItemsValid = true;
    var items = [];
    var lineItems = transaction.lineItems;
    for (var i = 0, length = lineItems.length; i < length; i++) {
      if (!this.validateTransactionLineItem(lineItems[i])) {
        areLineItemsValid = false;
        break;
      }
      var product = lineItems[i].product;
      this.overrideProduct(product);
      items.push({
        id: product.id,
        qnt: lineItems[i].quantity,
        price: product.unitSalePrice || product.unitPrice
      });
    }

    if (!areLineItemsValid) {
      return;
    }

    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.order({
          transaction: transaction.orderId,
          items: items
        });
      } catch (e) {
        // do nothing
      }
    });
  };

  RetailRocket.prototype.onSubscribed = function onSubscribed(event) {
    var user = event.user || {};
    if (!user.email) {
      return;
    }

    var rrCustoms = {};
    var settings = this.getOption('customVariables');
    (0, _each2['default'])(settings, function (key, variable) {
      var rrCustom = void 0;
      if ((0, _componentType2['default'])(variable) === 'string') {
        // TODO: remove backward compatibility in later versions
        rrCustom = (0, _dotProp.getProp)(event, variable);
      } else {
        rrCustom = (0, _getVarValue2['default'])(variable, event);
      }
      if (rrCustom !== undefined) {
        if ((0, _componentType2['default'])(rrCustom) === 'boolean') rrCustom = rrCustom.toString();
        rrCustoms[key] = rrCustom;
      }
    });

    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.setEmail(user.email, rrCustoms);
      } catch (e) {
        // do nothing
      }
    });
  };

  RetailRocket.prototype.onSearched = function onSearched(listing) {
    listing = listing || {};
    if (!listing.query) {
      return;
    }
    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.search(listing.query);
      } catch (e) {
        // do nothing
      }
    });
  };

  RetailRocket.prototype.validateTransaction = function validateTransaction(transaction) {
    var isValid = true;
    if (!transaction.orderId) {
      isValid = false;
    }

    var lineItems = transaction.lineItems;
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      isValid = false;
    }

    return isValid;
  };

  RetailRocket.prototype.validateLineItem = function validateLineItem(lineItem) {
    var isValid = true;
    if (!lineItem.product) {
      isValid = false;
    }

    return isValid;
  };

  RetailRocket.prototype.validateTransactionLineItem = function validateTransactionLineItem(lineItem) {
    var isValid = this.validateLineItem(lineItem);

    var product = lineItem.product;
    this.overrideProduct(product);
    if (!product.id) {
      isValid = false;
    }
    if (!product.unitSalePrice && !product.unitPrice) {
      isValid = false;
    }
    if (!lineItem.quantity) {
      isValid = false;
    }

    return isValid;
  };

  RetailRocket.prototype.getProductId = function getProductId(product) {
    product = product || {};
    this.overrideProduct(product);
    var productId = product.id;

    return productId;
  };

  return RetailRocket;
}(_Integration3['default']);

exports['default'] = RetailRocket;

},{"./../Integration.js":75,"./../functions/deleteProperty":82,"./../functions/dotProp":83,"./../functions/each":84,"./../functions/getVarValue":86,"component-type":4}],107:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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

  SegmentStream.prototype.getEnrichableEventProps = function getEnrichableEventProps(event) {
    var enrichableProps = [];
    switch (event.name) {
      case 'Viewed Product Detail':
        enrichableProps = ['product'];
        break;
      default:
      // do nothing
    }
    return enrichableProps;
  };

  SegmentStream.prototype.initialize = function initialize() {
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
    this.load(this.onLoad);
    this.enrichDigitalData();
  };

  SegmentStream.prototype.isLoaded = function isLoaded() {
    return !!(window.ssApi && window.ssApi.initialize);
  };

  SegmentStream.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'ssApi');
    localStorage.clear();
  };

  SegmentStream.prototype.enrichDigitalData = function enrichDigitalData() {
    var _this2 = this;

    function lowercaseFirstLetter(string) {
      return string.charAt(0).toLowerCase() + string.slice(1);
    }

    window.ssApi.pushOnReady(function () {
      var attributes = window.ssApi.getData().attributes;
      var ssAttributes = {};
      (0, _each2['default'])(attributes, function (name, value) {
        var key = lowercaseFirstLetter(name);
        ssAttributes[key] = value;
      });

      _this2.digitalData.user.anonymousId = window.ssApi.getAnonymousId();
      _this2.digitalData.user.ssAttributes = ssAttributes;
      _this2.onEnrich();
    });
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
    var _this3 = this;

    window.ssApi.pushOnReady(function () {
      window.ssApi.track('Viewed Page');
      _this3.enrichDigitalData();
    });
  };

  SegmentStream.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var _this4 = this;

    window.ssApi.pushOnReady(function () {
      window.ssApi.track('Viewed Product Detail', {
        price: event.product.unitSalePrice || event.product.unitPrice || 0
      });
      _this4.enrichDigitalData();
    });
  };

  SegmentStream.prototype.onAddedProduct = function onAddedProduct(event) {
    var _this5 = this;

    window.ssApi.pushOnReady(function () {
      window.ssApi.track('Added Product', {
        price: event.product.unitSalePrice || event.product.unitPrice || 0
      });
      _this5.enrichDigitalData();
    });
  };

  return SegmentStream;
}(_Integration3['default']);

exports['default'] = SegmentStream;

},{"./../Integration.js":75,"./../functions/deleteProperty.js":82,"./../functions/each.js":84}],108:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _dotProp = require('./../functions/dotProp');

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
      pushSubscriptionTriggerEvent: 'Agreed to Receive Push Notifications',
      userVariables: []
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
          _this2.sendUserAttributes(_this2.digitalData);
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
    if (this.digitalData.user.pushNotifications.isSubscribed) {
      this.sendUserAttributes(this.digitalData);
    }
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

  SendPulse.prototype.sendUserAttributes = function sendUserAttributes(digitalData) {
    var userVariables = this.getOption('userVariables');
    for (var _iterator = userVariables, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var userVar = _ref;

      var value = void 0;
      if (userVar.indexOf('.') < 0) {
        // legacy version
        value = (0, _dotProp.getProp)(digitalData.user, userVar);
      } else {
        value = (0, _dotProp.getProp)(digitalData, userVar);
      }
      if (value !== undefined && (0, _componentType2['default'])(value) !== 'object') {
        window.oSpP.push(userVar, String(value));
      }
    }
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

},{"./../Integration.js":75,"./../functions/deleteProperty.js":82,"./../functions/dotProp":83,"component-type":4}],109:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.__esModule = true;

var _sha = require('crypto-js/sha256');

var _sha2 = _interopRequireDefault(_sha);

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _events = require('./../events');

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

function lineItemsToSociomanticsItems(lineItems) {
  var products = [];
  for (var i = 0, length = lineItems.length; i < length; i++) {
    var lineItem = lineItems[i];
    if (lineItem && lineItem.product) {
      var productId = lineItem.product.id || lineItem.product.skuCode;
      if (productId) {
        var product = {
          identifier: String(productId),
          amount: lineItem.product.unitSalePrice || lineItem.product.unitPrice || 0,
          quantity: lineItem.quantity || 1,
          currency: lineItem.product.currency || ''
        };
        products.push(product);
      }
    }
  }
  return products;
}

function deleteEmptyProperties(objName) {
  var keys = Object.keys(window[objName]);
  keys.map(function (key) {
    if (window[objName][key] === '') {
      (0, _deleteProperty2['default'])(window[objName], key);
    }
  });
}

var Sociomantic = function (_Integration) {
  _inherits(Sociomantic, _Integration);

  function Sociomantic(digitalData, options) {
    _classCallCheck(this, Sociomantic);

    var optionsWithDefaults = Object.assign({
      region: '',
      advertiserToken: '',
      prefix: ''
    }, options);

    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    var region = _this.getOption('region') || '';
    var regionPrefix = region ? region + '-' : '';
    var advertiserToken = _this.getOption('advertiserToken');
    var src = '//' + regionPrefix + 'sonar.sociomantic.com/js/2010-07-01/adpan/' + advertiserToken;

    _this.addTag({
      type: 'script',
      attr: {
        type: 'text/javascript',
        async: true,
        src: src
      }
    });

    _this._isLoaded = false;
    _this.trackingScriptCalled = false;
    return _this;
  }

  Sociomantic.prototype.initialize = function initialize() {
    this._isLoaded = true;
    this.onLoad();
  };

  Sociomantic.prototype.isLoaded = function isLoaded() {
    var advertiserToken = this.getOption('advertiserToken');
    return window.sociomantic && window.sociomantic.sonar && window.sociomantic.sonar.adv[advertiserToken];
  };

  Sociomantic.prototype.loadTrackingScript = function loadTrackingScript() {
    var advertiserToken = this.getOption('advertiserToken');
    if (this.isLoaded()) {
      window.sociomantic.sonar.adv[advertiserToken].track();
    } else {
      this.load();
    }
    this.trackingScriptCalled = true;
  };

  Sociomantic.prototype.clearTrackingObjects = function clearTrackingObjects() {
    var advertiserToken = this.getOption('advertiserToken');
    if (this.isLoaded()) {
      window.sociomantic.sonar.adv[advertiserToken].clear();
    }
    this.trackingScriptCalled = false;
  };

  Sociomantic.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'sociomantic');
  };

  Sociomantic.prototype.getEnrichableEventProps = function getEnrichableEventProps(event) {
    var enrichableProps = [];
    switch (event.name) {
      case _events.VIEWED_PAGE:
        enrichableProps = ['page.type', 'user.userId', 'user.email'];
        break;
      case _events.VIEWED_PRODUCT_DETAIL:
        enrichableProps = ['product'];
        break;
      case _events.VIEWED_PRODUCT_CATEGORY:
        enrichableProps = ['listing.category'];
        break;
      case _events.VIEWED_CART:
        enrichableProps = ['cart.lineItems'];
        break;
      case _events.SEARCHED_PRODUCTS:
        enrichableProps = ['listing.category'];
        break;
      case _events.COMPLETED_TRANSACTION:
        enrichableProps = ['transaction'];
        break;
      default:
      // do nothing
    }

    return enrichableProps;
  };

  Sociomantic.prototype.trackEvent = function trackEvent(event) {
    var _methods;

    var methods = (_methods = {}, _methods[_events.VIEWED_PAGE] = 'onViewedPage', _methods[_events.VIEWED_PRODUCT_DETAIL] = 'onViewedProductDetail', _methods[_events.VIEWED_PRODUCT_CATEGORY] = 'onViewedProductListing', _methods[_events.VIEWED_CART] = 'onViewedCart', _methods[_events.COMPLETED_TRANSACTION] = 'onCompletedTransaction', _methods[_events.SEARCHED_PRODUCTS] = 'onViewedProductListing', _methods);

    var method = methods[event.name];
    if (method) {
      if (this.trackingScriptCalled) {
        this.clearTrackingObjects();
      }
      this[method](event);
    }
  };

  Sociomantic.prototype.onViewedPage = function onViewedPage(event) {
    var _this2 = this;

    var prefix = this.getOption('prefix');
    var trackingObjectCustomerName = prefix + 'customer';
    var user = event.user;
    var page = event.page;
    var specialPages = ['product', 'category', 'cart', 'search', 'confirmation'];

    if (user && (user.userId || user.email)) {
      var userId = void 0;
      var userEmailHash = void 0;
      if (user.userId) {
        userId = String(user.userId);
      }
      if (user.email) {
        userEmailHash = (0, _sha2['default'])(user.email).toString();
      }
      window[trackingObjectCustomerName] = {
        identifier: userId || '',
        mhash: userEmailHash || ''
      };
      deleteEmptyProperties(trackingObjectCustomerName);
    }

    if (page && specialPages.indexOf(page.type) < 0) {
      this.loadTrackingScript();
    } else {
      setTimeout(function () {
        if (!_this2.trackingScriptCalled) {
          _this2.loadTrackingScript();
        }
      }, 100);
    }
  };

  Sociomantic.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    var prefix = this.getOption('prefix');
    var trackingObjectName = prefix + 'product';
    var product = event.product;

    if (product && (product.id || product.skuCode)) {
      var productId = void 0;
      var productSkuCode = void 0;
      if (product.id) {
        productId = String(product.id);
      }
      if (product.skuCode) {
        productSkuCode = String(product.skuCode);
      }
      window[trackingObjectName] = {
        identifier: productId || productSkuCode
      };
      this.loadTrackingScript();
    }
  };

  Sociomantic.prototype.onViewedProductListing = function onViewedProductListing(event) {
    var prefix = this.getOption('prefix');
    var trackingObjectName = prefix + 'product';
    var listing = event.listing;

    if (listing && listing.category && listing.category.length) {
      window[trackingObjectName] = {
        category: listing.category
      };
      this.loadTrackingScript();
    }
  };

  Sociomantic.prototype.onViewedCart = function onViewedCart(event) {
    var prefix = this.getOption('prefix');
    var trackingObjectBasketName = prefix + 'basket';
    var cart = event.cart;

    if (cart && cart.lineItems) {
      var products = lineItemsToSociomanticsItems(cart.lineItems);
      if (products.length) {
        window[trackingObjectBasketName] = {
          products: products
        };
        this.loadTrackingScript();
      }
    }
  };

  Sociomantic.prototype.onCompletedTransaction = function onCompletedTransaction(event) {
    var prefix = this.getOption('prefix');
    var trackingObjectBasketName = prefix + 'basket';
    var transaction = event.transaction;

    if (transaction && transaction.lineItems) {
      var products = lineItemsToSociomanticsItems(transaction.lineItems);
      if (products.length) {
        var transactionOrderId = void 0;
        if (transaction.orderId) {
          transactionOrderId = String(transaction.orderId);
        }
        window[trackingObjectBasketName] = {
          products: products,
          transaction: transactionOrderId || '',
          amount: transaction.total || '',
          currency: transaction.currency || ''
        };
        deleteEmptyProperties(trackingObjectBasketName);
      }
    }

    this.loadTrackingScript();
  };

  return Sociomantic;
}(_Integration3['default']);

exports['default'] = Sociomantic;

},{"./../Integration.js":75,"./../events":80,"./../functions/deleteProperty.js":82,"crypto-js/sha256":64}],110:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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

},{"./../Integration.js":75}],111:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
  var category = product.category;
  if (Array.isArray(category)) {
    category = category.join('/');
  } else if (category && product.subcategory) {
    category = category + '/' + product.subcategory;
  }
  return category;
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

    // use custom dataLayer name to avoid conflicts
    var _this = _possibleConstructorReturn(this, _Integration.call(this, digitalData, optionsWithDefaults));

    _this.dataLayerName = 'yandexDL';

    _this.addTag({
      type: 'script',
      attr: {
        src: '//mc.yandex.ru/metrika/watch.js'
      }
    });
    return _this;
  }

  YandexMetrica.prototype.getEnrichableEventProps = function getEnrichableEventProps(event) {
    var enrichableProps = [];
    switch (event.name) {
      case 'Viewed Product Detail':
        enrichableProps = ['product'];
        break;
      case 'Completed Transaction':
        enrichableProps = ['transaction'];
        break;
      default:
      // do nothing
    }
    return enrichableProps;
  };

  YandexMetrica.prototype.initialize = function initialize() {
    var _this2 = this;

    var id = this.getOption('counterId');

    window.yandex_metrika_callbacks = window.yandex_metrika_callbacks || [];
    this.dataLayer = window[this.dataLayerName] = window[this.dataLayerName] || [];
    if (!this.getOption('noConflict') && id) {
      window.yandex_metrika_callbacks.push(function () {
        _this2.yaCounter = window['yaCounter' + id] = new window.Ya.Metrika({
          id: id,
          clickmap: _this2.getOption('clickmap'),
          webvisor: _this2.getOption('webvisor'),
          trackLinks: _this2.getOption('trackLinks'),
          trackHash: _this2.getOption('trackHash'),
          ecommerce: _this2.dataLayerName
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
    (0, _deleteProperty2['default'])(window, this.dataLayerName);
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

},{"./../Integration.js":75,"./../functions/deleteProperty.js":82}],112:[function(require,module,exports){
'use strict';

require('core-js/modules/es6.object.create');

require('core-js/modules/es6.array.is-array');

require('core-js/modules/es6.array.index-of');

require('core-js/modules/es6.array.filter');

require('core-js/modules/es6.array.map');

require('core-js/modules/es6.function.bind');

require('core-js/modules/es6.object.assign');

require('core-js/modules/es6.string.trim');

require('core-js/modules/es6.date.to-iso-string');

require('core-js/modules/es6.date.now');

},{"core-js/modules/es6.array.filter":53,"core-js/modules/es6.array.index-of":54,"core-js/modules/es6.array.is-array":55,"core-js/modules/es6.array.map":56,"core-js/modules/es6.date.now":57,"core-js/modules/es6.date.to-iso-string":58,"core-js/modules/es6.function.bind":59,"core-js/modules/es6.object.assign":60,"core-js/modules/es6.object.create":61,"core-js/modules/es6.string.trim":62}],113:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.isTestMode = isTestMode;
exports.showTestModeOverlay = showTestModeOverlay;
exports.logEnrichedIntegrationEvent = logEnrichedIntegrationEvent;

var _noop = require('./functions/noop');

var _noop2 = _interopRequireDefault(_noop);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function isTestMode() {
  return window.localStorage.getItem('_ddm_test_mode') === '1';
}

function showTestModeOverlay() {
  var css = ['position: fixed', 'width: 100%', 'bottom: 0', 'font-size: 15px', "font-family: 'Helvetica Neue',Helvetica, Arial", 'text-align: center', 'background-color: #1392e0', 'opacity: 0.5', 'color: #FFF !important', 'padding: 5px 0', 'z-index: 2147483646', 'line-height: 15px', '-webkit-transform: translate3d(0,0,0)'];
  var overlayDiv = document.createElement('div');
  overlayDiv.innerHTML = '<a style="color: #fff;" href="#" onclick="window.localStorage.removeItem(\'_ddm_test_mode\');location.reload();return false;">Выйти из превью</a>';

  overlayDiv.style.cssText = css.join(';');
  document.body.appendChild(overlayDiv);
}

function logEnrichedIntegrationEvent(event, integrationName) {
  window.console.log = window.console.log || _noop2['default'];
  var browserSupportsGroups = !!window.console.group;

  function log(message) {
    window.console.log(message);
  }

  function group(message) {
    if (browserSupportsGroups) {
      window.console.group(message);
    } else {
      log(message);
    }
  }

  function groupEnd() {
    if (browserSupportsGroups) window.console.groupEnd();
  }

  group(event.name + ' -> ' + integrationName);
  log(event);
  groupEnd();
}

exports['default'] = { isTestMode: isTestMode, showTestModeOverlay: showTestModeOverlay };

},{"./functions/noop":92}],114:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var CONSTANT_VAR = exports.CONSTANT_VAR = 'constant';
var DIGITALDATA_VAR = exports.DIGITALDATA_VAR = 'digitalData';
var EVENT_VAR = exports.EVENT_VAR = 'event';
var PRODUCT_VAR = exports.PRODUCT_VAR = 'product';

},{}]},{},[96]);
