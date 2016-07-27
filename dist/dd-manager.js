(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.setImmediate(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
        if (typeof arguments[1] === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var hasError = false;

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            if (hasError) return;
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    hasError = true;

                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has nonexistent dependency in ' + requires.join(', '));
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
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

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
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
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback.apply(null, [null].concat(args));
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                while(!q.paused && workers < q.concurrency && q.tasks.length){

                    var tasks = q.payload ?
                        q.tasks.splice(0, q.payload) :
                        q.tasks.splice(0, q.tasks.length);

                    var data = _map(tasks, function (task) {
                        return task.data;
                    });

                    if (q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);
                    var cb = only_once(_next(q, tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        var has = Object.prototype.hasOwnProperty;
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (has.call(memo, key)) {   
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (has.call(queues, key)) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
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
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define === 'function' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":58}],2:[function(require,module,exports){
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
},{"./_is-object":26}],7:[function(require,module,exports){
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
},{"./_to-index":42,"./_to-iobject":44,"./_to-length":45}],8:[function(require,module,exports){
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
},{"./_a-function":5,"./_invoke":23,"./_is-object":26}],9:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],10:[function(require,module,exports){
var core = module.exports = {version: '2.4.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],11:[function(require,module,exports){
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
},{"./_a-function":5}],12:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],13:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_fails":17}],14:[function(require,module,exports){
var isObject = require('./_is-object')
  , document = require('./_global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./_global":18,"./_is-object":26}],15:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');
},{}],16:[function(require,module,exports){
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
},{"./_core":10,"./_ctx":11,"./_global":18,"./_hide":20,"./_redefine":36}],17:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],18:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],19:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],20:[function(require,module,exports){
var dP         = require('./_object-dp')
  , createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./_descriptors":13,"./_object-dp":29,"./_property-desc":35}],21:[function(require,module,exports){
module.exports = require('./_global').document && document.documentElement;
},{"./_global":18}],22:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function(){
  return Object.defineProperty(require('./_dom-create')('div'), 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_descriptors":13,"./_dom-create":14,"./_fails":17}],23:[function(require,module,exports){
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
},{}],24:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./_cof":9}],25:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg){
  return cof(arg) == 'Array';
};
},{"./_cof":9}],26:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],27:[function(require,module,exports){
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
},{"./_fails":17,"./_iobject":24,"./_object-gops":31,"./_object-keys":33,"./_object-pie":34,"./_to-object":46}],28:[function(require,module,exports){
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

},{"./_an-object":6,"./_dom-create":14,"./_enum-bug-keys":15,"./_html":21,"./_object-dps":30,"./_shared-key":37}],29:[function(require,module,exports){
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
},{"./_an-object":6,"./_descriptors":13,"./_ie8-dom-define":22,"./_to-primitive":47}],30:[function(require,module,exports){
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
},{"./_an-object":6,"./_descriptors":13,"./_object-dp":29,"./_object-keys":33}],31:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;
},{}],32:[function(require,module,exports){
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
},{"./_array-includes":7,"./_has":19,"./_shared-key":37,"./_to-iobject":44}],33:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys       = require('./_object-keys-internal')
  , enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O){
  return $keys(O, enumBugKeys);
};
},{"./_enum-bug-keys":15,"./_object-keys-internal":32}],34:[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;
},{}],35:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],36:[function(require,module,exports){
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
},{"./_core":10,"./_global":18,"./_has":19,"./_hide":20,"./_uid":48}],37:[function(require,module,exports){
var shared = require('./_shared')('keys')
  , uid    = require('./_uid');
module.exports = function(key){
  return shared[key] || (shared[key] = uid(key));
};
},{"./_shared":38,"./_uid":48}],38:[function(require,module,exports){
var global = require('./_global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./_global":18}],39:[function(require,module,exports){
var fails = require('./_fails');

module.exports = function(method, arg){
  return !!method && fails(function(){
    arg ? method.call(null, function(){}, 1) : method.call(null);
  });
};
},{"./_fails":17}],40:[function(require,module,exports){
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
},{"./_defined":12,"./_export":16,"./_fails":17,"./_string-ws":41}],41:[function(require,module,exports){
module.exports = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';
},{}],42:[function(require,module,exports){
var toInteger = require('./_to-integer')
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};
},{"./_to-integer":43}],43:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],44:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject')
  , defined = require('./_defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./_defined":12,"./_iobject":24}],45:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./_to-integer":43}],46:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./_defined":12}],47:[function(require,module,exports){
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
},{"./_is-object":26}],48:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],49:[function(require,module,exports){
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
},{"./_array-includes":7,"./_export":16,"./_strict-method":39}],50:[function(require,module,exports){
// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
var $export = require('./_export');

$export($export.S, 'Array', {isArray: require('./_is-array')});
},{"./_export":16,"./_is-array":25}],51:[function(require,module,exports){
// 19.2.3.2 / 15.3.4.5 Function.prototype.bind(thisArg, args...)
var $export = require('./_export');

$export($export.P, 'Function', {bind: require('./_bind')});
},{"./_bind":8,"./_export":16}],52:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./_export');

$export($export.S + $export.F, 'Object', {assign: require('./_object-assign')});
},{"./_export":16,"./_object-assign":27}],53:[function(require,module,exports){
var $export = require('./_export')
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export($export.S, 'Object', {create: require('./_object-create')});
},{"./_export":16,"./_object-create":28}],54:[function(require,module,exports){
'use strict';
// 21.1.3.25 String.prototype.trim()
require('./_string-trim')('trim', function($trim){
  return function trim(){
    return $trim(this, 3);
  };
});
},{"./_string-trim":40}],55:[function(require,module,exports){

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

},{"./debug":56}],56:[function(require,module,exports){

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

},{"ms":57}],57:[function(require,module,exports){
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

},{}],58:[function(require,module,exports){
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

},{}],59:[function(require,module,exports){
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

},{"./DOMComponentsTracking.js":61,"./functions/semver":81,"component-type":4}],60:[function(require,module,exports){
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

},{"./functions/getProperty.js":72,"component-clone":2}],61:[function(require,module,exports){
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

},{}],62:[function(require,module,exports){
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

},{"./functions/htmlGlobals.js":74}],63:[function(require,module,exports){
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

},{"./DDHelper.js":60,"component-type":4}],64:[function(require,module,exports){
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

  EventManager.prototype.fireEvent = function fireEvent(event) {
    var _this2 = this;

    var eventCallback = void 0;
    event.time = new Date().getTime();

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

    _callbacks[type] = _callbacks[type] || [];
    if (key) {
      _callbacks[type].push({
        key: key,
        handler: handler
      });
    } else {
      _callbacks[type].push({
        handler: handler
      });
    }
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
  };

  return EventManager;
}();

exports['default'] = EventManager;

},{"./DDHelper.js":60,"./EventDataEnricher.js":63,"./functions/after.js":68,"./functions/deleteProperty.js":69,"./functions/jsonIsEqual.js":75,"./functions/noop.js":79,"./functions/size.js":82,"async":1,"component-clone":2,"debug":55}],65:[function(require,module,exports){
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
    _this.ready = _this.ready.bind(_this);
    return _this;
  }

  Integration.prototype.initialize = function initialize() {
    var ready = this.ready;
    _async2['default'].nextTick(ready);
  };

  Integration.prototype.load = function load(tagName, callback) {
    // Argument shuffling
    if (typeof tagName === 'function') {
      callback = tagName;tagName = null;
    }

    // Default arguments
    tagName = tagName || 'library';

    var tag = this.tags[tagName];
    if (!tag) throw new Error((0, _format2['default'])('tag "%s" not defined.', tagName));
    callback = callback || _noop2['default'];

    var el = void 0;
    var attr = tag.attr;
    switch (tag.type) {
      case 'img':
        attr.width = 1;
        attr.height = 1;
        el = (0, _loadPixel2['default'])(attr, callback);
        break;
      case 'script':
        el = (0, _loadScript2['default'])(attr, function (err) {
          if (!err) return callback();
          (0, _debug2['default'])('error loading "%s" error="%s"', tagName, err);
        });
        // TODO: hack until refactoring load-script
        (0, _deleteProperty2['default'])(attr, 'src');
        (0, _each2['default'])(attr, function (key, value) {
          el.setAttribute(key, value);
        });
        break;
      case 'iframe':
        el = (0, _loadIframe2['default'])(attr, callback);
        break;
      default:
      // No default case
    }

    return el;
  };

  Integration.prototype.isLoaded = function isLoaded() {
    return false;
  };

  Integration.prototype.ready = function ready() {
    this.emit('ready');
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

  Integration.prototype.enrichDigitalData = function enrichDigitalData(done) {
    // abstract
    done();
  };

  Integration.prototype.trackEvent = function trackEvent() {
    // abstract
  };

  return Integration;
}(_componentEmitter2['default']);

exports['default'] = Integration;

},{"./DDHelper.js":60,"./functions/deleteProperty.js":69,"./functions/each.js":70,"./functions/format.js":71,"./functions/loadIframe.js":76,"./functions/loadPixel.js":77,"./functions/loadScript.js":78,"./functions/noop.js":79,"async":1,"component-emitter":3,"debug":55}],66:[function(require,module,exports){
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

},{"./integrations/Criteo.js":85,"./integrations/Driveback.js":86,"./integrations/Emarsys.js":87,"./integrations/FacebookPixel.js":88,"./integrations/GoogleAnalytics.js":89,"./integrations/GoogleTagManager.js":90,"./integrations/MyTarget.js":91,"./integrations/OWOXBIStreaming.js":92,"./integrations/RetailRocket.js":93,"./integrations/SegmentStream.js":94,"./integrations/SendPulse.js":95,"./integrations/Vkontakte.js":96,"./integrations/YandexMetrica.js":97}],67:[function(require,module,exports){
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
var _isInitialized = false;

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
  if (!_digitalData.page.type || _digitalData.page.type !== 'confirmation') {
    _digitalData.cart = _digitalData.cart || {};
  }

  if (Array.isArray(window[_ddListenerNamespace])) {
    _ddListener = window[_ddListenerNamespace];
  } else {
    window[_ddListenerNamespace] = _ddListener;
  }
}

function _initializeIntegrations(settings, onReady) {
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

      var ready = (0, _after2['default'])((0, _size2['default'])(_integrations), onReady);

      if ((0, _size2['default'])(_integrations) > 0) {
        (0, _each2['default'])(_integrations, function (name, integration) {
          if (!integration.isLoaded() || integration.getOption('noConflict')) {
            integration.once('ready', function () {
              integration.enrichDigitalData(function () {
                _eventManager.addCallback(['on', 'event', function (event) {
                  return integration.trackEvent(event);
                }], true);
                ready();
              });
            });
            integration.initialize();
          } else {
            ready();
          }
        });
      } else {
        ready();
      }
    })();
  }
}

ddManager = {

  VERSION: '1.1.1',

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
      sessionLength: 3600
    }, settings);

    if (_isInitialized) {
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

    _initializeIntegrations(settings, function () {
      _isReady = true;
      ddManager.emit('ready');
    });

    _eventManager.initialize();

    _isInitialized = true;
    ddManager.emit('initialize', settings);
  },

  isInitialized: function isInitialized() {
    return _isInitialized;
  },

  isReady: function isReady() {
    return _isReady;
  },

  addIntegration: function addIntegration(name, integration) {
    if (_isInitialized) {
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
    _isInitialized = false;
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
  } else if (event === 'initialize') {
    if (_isInitialized) {
      handler();
      return;
    }
  }

  originalOn.call(ddManager, event, handler);
};

exports['default'] = ddManager;

},{"./AutoEvents.js":59,"./DDHelper.js":60,"./DigitalDataEnricher.js":62,"./EventManager.js":64,"./Integration.js":65,"./functions/after.js":68,"./functions/each.js":70,"./functions/size.js":82,"async":1,"component-clone":2,"component-emitter":3}],68:[function(require,module,exports){
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

},{}],69:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj, prop) {
  try {
    delete obj[prop];
  } catch (e) {
    obj[prop] = undefined;
  }
};

},{}],70:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj, fn) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      fn(key, obj[key]);
    }
  }
};

},{}],71:[function(require,module,exports){
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

},{}],72:[function(require,module,exports){
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

},{}],73:[function(require,module,exports){
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

},{}],74:[function(require,module,exports){
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

},{}],75:[function(require,module,exports){
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

},{}],76:[function(require,module,exports){
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

},{"./scriptOnLoad.js":80,"async":1}],77:[function(require,module,exports){
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

},{}],78:[function(require,module,exports){
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

},{"./scriptOnLoad.js":80,"async":1}],79:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function () {};

},{}],80:[function(require,module,exports){
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

},{}],81:[function(require,module,exports){
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

},{}],82:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj) {
  var size = 0;
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

},{}],83:[function(require,module,exports){
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

},{"debug":55}],84:[function(require,module,exports){
'use strict';

require('./polyfill.js');

var _ddManager = require('./ddManager.js');

var _ddManager2 = _interopRequireDefault(_ddManager);

var _availableIntegrations = require('./availableIntegrations.js');

var _availableIntegrations2 = _interopRequireDefault(_availableIntegrations);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

_ddManager2['default'].setAvailableIntegrations(_availableIntegrations2['default']);
_ddManager2['default'].processEarlyStubCalls();

window.ddManager = _ddManager2['default'];

},{"./availableIntegrations.js":66,"./ddManager.js":67,"./polyfill.js":98}],85:[function(require,module,exports){
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
      this.load(this.ready);
    } else {
      this.ready();
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

},{"./../Integration.js":65,"./../functions/deleteProperty":69,"./../functions/semver":81}],86:[function(require,module,exports){
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
      this.load(this.ready);
    } else {
      this.ready();
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

},{"./../Integration.js":65,"./../functions/deleteProperty.js":69,"./../functions/noop.js":79}],87:[function(require,module,exports){
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
      this.load(this.ready);
    } else {
      this.ready();
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

},{"./../Integration.js":65,"./../functions/deleteProperty.js":69}],88:[function(require,module,exports){
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
      this.load(this.ready);
      window.fbq('init', this.getOption('pixelId'));
    } else {
      this.ready();
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

},{"./../Integration.js":65,"./../functions/deleteProperty.js":69,"component-type":4}],89:[function(require,module,exports){
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

var _componentType = require('component-type');

var _componentType2 = _interopRequireDefault(_componentType);

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
  if (!voucher) {
    if (Array.isArray(transaction.promotions)) {
      voucher = transaction.promotions[0];
    } else {
      voucher = transaction.promotion;
    }
  }
  return voucher;
}

function getCheckoutOptions(event) {
  var optionNames = ['paymentMethod', 'shippingMethod'];
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

    if (event[optionName]) {
      options.push(event[optionName]);
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
      namespace: 'ddl',
      noConflict: false,
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
        this.ready();
      } else {
        this.load(this.ready);
      }
    } else {
      this.ready();
    }
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
    source = source || this.digitalData;
    var settings = Object.assign(Object.assign(this.getOption('metrics'), this.getOption('dimensions')), this.getOption('contentGroupings'));
    var custom = {};
    (0, _each2['default'])(settings, function (key, value) {
      var dimensionVal = (0, _getProperty2['default'])(source, value);
      if (dimensionVal !== undefined) {
        if ((0, _componentType2['default'])(dimensionVal) === 'boolean') dimensionVal = dimensionVal.toString();
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

    this.ga.apply(this, cleanedArgs);
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
      if (event.name === 'Viewed Product') {
        this.onViewedProduct(event);
      } else if (event.name === 'Clicked Product') {
        this.onClickedProduct(event);
      } else if (event.name === 'Viewed Product Detail') {
        this.onViewedProductDetail(event);
      } else if (event.name === 'Added Product') {
        this.onAddedProduct(event);
      } else if (event.name === 'Removed Product') {
        this.onRemovedProduct(event);
      } else if (event.name === 'Completed Transaction') {
        this.onCompletedTransactionEnhanced(event);
      } else if (event.name === 'Refunded Transaction') {
        this.onRefundedTransaction(event);
      } else if (event.name === 'Viewed Product Category') {
        this.onViewedProductCategory(event);
      } else if (event.name === 'Viewed Campaign') {
        this.onViewedCampaign(event);
      } else if (event.name === 'Clicked Campaign') {
        this.onClickedCampaign(event);
      } else if (event.name === 'Viewed Checkout Step') {
        this.onViewedCheckoutStep(event);
      } else if (event.name === 'Completed Checkout Step') {
        this.onCompletedCheckoutStep(event);
      } else {
        this.onCustomEvent(event);
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
      this.ga('ec:addImpression', {
        id: product.id || product.skuCode,
        name: product.name,
        list: listItem.listName,
        category: product.category,
        brand: product.brand || product.manufacturer,
        price: product.unitSalePrice || product.unitPrice,
        currency: product.currency || this.getOption('defaultCurrency'),
        variant: product.variant,
        position: listItem.position
      });
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
    var _this2 = this;

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
        _this2.ga('ecommerce:addItem', {
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
    var _this3 = this;

    var transaction = event.transaction;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    this.loadEnhancedEcommerce(transaction.currency);

    (0, _each2['default'])(transaction.lineItems, function (key, lineItem) {
      var product = lineItem.product;
      if (product) {
        product.currency = product.currency || transaction.currency || _this3.getOption('defaultCurrency');
        _this3.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
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
    var _this5 = this;

    var cartOrTransaction = this.get('cart') || this.get('transaction');

    this.loadEnhancedEcommerce(cartOrTransaction.currency);

    (0, _each2['default'])(cartOrTransaction.lineItems, function (key, lineItem) {
      var product = lineItem.product;
      if (product) {
        product.currency = product.currency || cartOrTransaction.currency || _this5.getOption('defaultCurrency');
        _this5.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    this.ga('ec:setAction', 'checkout', {
      step: event.step || 1,
      option: getCheckoutOptions(event) || undefined
    });

    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onCompletedCheckoutStep = function onCompletedCheckoutStep(event) {
    var cartOrTransaction = this.get('cart') || this.get('transaction');
    var options = getCheckoutOptions(event);

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
    // custom dimensions & metrics
    var source = (0, _componentClone2['default'])(event);
    (0, _deleteProperty2['default'])(source, 'name');
    (0, _deleteProperty2['default'])(source, 'category');
    var custom = this.getCustomDimensions(source);
    if ((0, _size2['default'])(custom)) this.ga('set', custom);

    var payload = {
      eventAction: event.name || 'event',
      eventCategory: event.category || 'All',
      eventLabel: event.label,
      eventValue: Math.round(event.value) || 0,
      nonInteraction: !!event.nonInteraction
    };

    this.ga('send', 'event', payload);
  };

  GoogleAnalytics.prototype.enhancedEcommerceTrackProduct = function enhancedEcommerceTrackProduct(product, quantity, position) {
    var gaProduct = {
      id: product.id || product.skuCode,
      name: product.name,
      category: product.category,
      price: product.unitSalePrice || product.unitPrice,
      brand: product.brand || product.manufacturer,
      variant: product.variant,
      currency: product.currency
    };
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

},{"./../Integration.js":65,"./../functions/deleteProperty.js":69,"./../functions/each.js":70,"./../functions/getProperty.js":72,"./../functions/size.js":82,"component-clone":2,"component-type":4}],90:[function(require,module,exports){
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
      this.load(this.ready);
    } else {
      this.ready();
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

},{"./../Integration.js":65,"./../functions/deleteProperty.js":69}],91:[function(require,module,exports){
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
      this.load(this.ready);
    } else {
      this.ready();
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

},{"./../Integration.js":65,"./../functions/deleteProperty.js":69}],92:[function(require,module,exports){
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
    this.ready();
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

},{"./../Integration.js":65}],93:[function(require,module,exports){
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

      this.load(this.ready);
    } else {
      this.ready();
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

},{"./../../src/functions/getProperty":72,"./../Integration.js":65,"./../functions/deleteProperty":69,"./../functions/each":70,"./../functions/format":71,"./../functions/getQueryParam":73,"./../functions/throwError":83,"component-clone":2,"component-type":4}],94:[function(require,module,exports){
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
      _this2.ready();
    });
    this.load();
  };

  SegmentStream.prototype.isLoaded = function isLoaded() {
    return !!(window.ssApi && window.ssApi.initialize);
  };

  SegmentStream.prototype.reset = function reset() {
    (0, _deleteProperty2['default'])(window, 'ssApi');
    localStorage.clear();
  };

  SegmentStream.prototype.enrichDigitalData = function enrichDigitalData(done) {
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
    done();
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
    window.ssApi.track('Viewed Page');
    this.enrichDigitalData();
  };

  SegmentStream.prototype.onViewedProductDetail = function onViewedProductDetail(event) {
    window.ssApi.track('Viewed Product Detail', {
      price: event.product.unitSalePrice || event.product.unitPrice || 0
    });
    this.enrichDigitalData();
  };

  SegmentStream.prototype.onAddedProduct = function onAddedProduct(event) {
    window.ssApi.track('Added Product', {
      price: event.product.unitSalePrice || event.product.unitPrice || 0
    });
    this.enrichDigitalData();
  };

  return SegmentStream;
}(_Integration3['default']);

exports['default'] = SegmentStream;

},{"./../Integration.js":65,"./../functions/deleteProperty.js":69,"./../functions/each.js":70}],95:[function(require,module,exports){
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
      _this2.ready();
    });
  };

  SendPulse.prototype.enrichDigitalData = function enrichDigitalData(done) {
    var _this3 = this;

    var pushNotification = this.digitalData.user.pushNotifications = {};
    try {
      pushNotification.isSupported = this.checkPushNotificationsSupport();
      this.getPushSubscriptionInfo(function (subscriptionInfo) {
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
        done();
      });
    } catch (e) {
      pushNotification.isSupported = false;
      done();
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

},{"./../Integration.js":65,"./../functions/deleteProperty.js":69,"./../functions/each.js":70,"component-type":4}],96:[function(require,module,exports){
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
    this.ready();
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

},{"./../Integration.js":65}],97:[function(require,module,exports){
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
      this.load(this.ready);
    } else {
      this.ready();
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

},{"./../Integration.js":65,"./../functions/deleteProperty.js":69}],98:[function(require,module,exports){
'use strict';

require('core-js/modules/es6.object.create');

require('core-js/modules/es6.array.is-array');

require('core-js/modules/es6.array.index-of');

require('core-js/modules/es6.function.bind');

require('core-js/modules/es6.object.assign');

require('core-js/modules/es6.string.trim');

require('core-js/modules/_has');

},{"core-js/modules/_has":19,"core-js/modules/es6.array.index-of":49,"core-js/modules/es6.array.is-array":50,"core-js/modules/es6.function.bind":51,"core-js/modules/es6.object.assign":52,"core-js/modules/es6.object.create":53,"core-js/modules/es6.string.trim":54}]},{},[84]);
