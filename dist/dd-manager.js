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
        if (!callback) {
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
                    throw new Error('Has inexistant dependency');
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
                    callback(null);
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
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    while(workers < q.concurrency && q.tasks.length){
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
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
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
},{"_process":49}],2:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],3:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":2,"ieee754":46,"is-array":47}],4:[function(require,module,exports){
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
        if (obj.hasOwnProperty(key)) {
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

},{"component-type":6,"type":6}],5:[function(require,module,exports){

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

},{}],6:[function(require,module,exports){
(function (Buffer){
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

  if (typeof Buffer != 'undefined' && Buffer.isBuffer(val)) return 'buffer';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};

}).call(this,require("buffer").Buffer)
},{"buffer":3}],7:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],8:[function(require,module,exports){
var isObject = require('./$.is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./$.is-object":27}],9:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./$.to-iobject')
  , toLength  = require('./$.to-length')
  , toIndex   = require('./$.to-index');
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
      if(O[index] === el)return IS_INCLUDES || index;
    } return !IS_INCLUDES && -1;
  };
};
},{"./$.to-index":34,"./$.to-iobject":36,"./$.to-length":37}],10:[function(require,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx      = require('./$.ctx')
  , IObject  = require('./$.iobject')
  , toObject = require('./$.to-object')
  , toLength = require('./$.to-length')
  , asc      = require('./$.array-species-create');
module.exports = function(TYPE){
  var IS_MAP        = TYPE == 1
    , IS_FILTER     = TYPE == 2
    , IS_SOME       = TYPE == 3
    , IS_EVERY      = TYPE == 4
    , IS_FIND_INDEX = TYPE == 6
    , NO_HOLES      = TYPE == 5 || IS_FIND_INDEX;
  return function($this, callbackfn, that){
    var O      = toObject($this)
      , self   = IObject(O)
      , f      = ctx(callbackfn, that, 3)
      , length = toLength(self.length)
      , index  = 0
      , result = IS_MAP ? asc($this, length) : IS_FILTER ? asc($this, 0) : undefined
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
},{"./$.array-species-create":11,"./$.ctx":14,"./$.iobject":25,"./$.to-length":37,"./$.to-object":38}],11:[function(require,module,exports){
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var isObject = require('./$.is-object')
  , isArray  = require('./$.is-array')
  , SPECIES  = require('./$.wks')('species');
module.exports = function(original, length){
  var C;
  if(isArray(original)){
    C = original.constructor;
    // cross-realm fallback
    if(typeof C == 'function' && (C === Array || isArray(C.prototype)))C = undefined;
    if(isObject(C)){
      C = C[SPECIES];
      if(C === null)C = undefined;
    }
  } return new (C === undefined ? Array : C)(length);
};
},{"./$.is-array":26,"./$.is-object":27,"./$.wks":40}],12:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],13:[function(require,module,exports){
var core = module.exports = {version: '1.2.6'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],14:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./$.a-function');
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
},{"./$.a-function":7}],15:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],16:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./$.fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./$.fails":19}],17:[function(require,module,exports){
var isObject = require('./$.is-object')
  , document = require('./$.global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./$.global":20,"./$.is-object":27}],18:[function(require,module,exports){
var global    = require('./$.global')
  , core      = require('./$.core')
  , hide      = require('./$.hide')
  , redefine  = require('./$.redefine')
  , ctx       = require('./$.ctx')
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
    own = !IS_FORCED && target && key in target;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if(target && !own)redefine(target, key, out);
    // export
    if(exports[key] != out)hide(exports, key, exp);
    if(IS_PROTO && expProto[key] != out)expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;  // forced
$export.G = 2;  // global
$export.S = 4;  // static
$export.P = 8;  // proto
$export.B = 16; // bind
$export.W = 32; // wrap
module.exports = $export;
},{"./$.core":13,"./$.ctx":14,"./$.global":20,"./$.hide":22,"./$.redefine":31}],19:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],20:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],21:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],22:[function(require,module,exports){
var $          = require('./$')
  , createDesc = require('./$.property-desc');
module.exports = require('./$.descriptors') ? function(object, key, value){
  return $.setDesc(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./$":28,"./$.descriptors":16,"./$.property-desc":30}],23:[function(require,module,exports){
module.exports = require('./$.global').document && document.documentElement;
},{"./$.global":20}],24:[function(require,module,exports){
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
var cof = require('./$.cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":12}],26:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./$.cof');
module.exports = Array.isArray || function(arg){
  return cof(arg) == 'Array';
};
},{"./$.cof":12}],27:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],28:[function(require,module,exports){
var $Object = Object;
module.exports = {
  create:     $Object.create,
  getProto:   $Object.getPrototypeOf,
  isEnum:     {}.propertyIsEnumerable,
  getDesc:    $Object.getOwnPropertyDescriptor,
  setDesc:    $Object.defineProperty,
  setDescs:   $Object.defineProperties,
  getKeys:    $Object.keys,
  getNames:   $Object.getOwnPropertyNames,
  getSymbols: $Object.getOwnPropertySymbols,
  each:       [].forEach
};
},{}],29:[function(require,module,exports){
// 19.1.2.1 Object.assign(target, source, ...)
var $        = require('./$')
  , toObject = require('./$.to-object')
  , IObject  = require('./$.iobject');

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = require('./$.fails')(function(){
  var a = Object.assign
    , A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return a({}, A)[S] != 7 || Object.keys(a({}, B)).join('') != K;
}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
  var T     = toObject(target)
    , $$    = arguments
    , $$len = $$.length
    , index = 1
    , getKeys    = $.getKeys
    , getSymbols = $.getSymbols
    , isEnum     = $.isEnum;
  while($$len > index){
    var S      = IObject($$[index++])
      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
  }
  return T;
} : Object.assign;
},{"./$":28,"./$.fails":19,"./$.iobject":25,"./$.to-object":38}],30:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],31:[function(require,module,exports){
// add fake Function#toString
// for correct work wrapped methods / constructors with methods like LoDash isNative
var global    = require('./$.global')
  , hide      = require('./$.hide')
  , SRC       = require('./$.uid')('src')
  , TO_STRING = 'toString'
  , $toString = Function[TO_STRING]
  , TPL       = ('' + $toString).split(TO_STRING);

require('./$.core').inspectSource = function(it){
  return $toString.call(it);
};

(module.exports = function(O, key, val, safe){
  if(typeof val == 'function'){
    val.hasOwnProperty(SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
    val.hasOwnProperty('name') || hide(val, 'name', key);
  }
  if(O === global){
    O[key] = val;
  } else {
    if(!safe)delete O[key];
    hide(O, key, val);
  }
})(Function.prototype, TO_STRING, function toString(){
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});
},{"./$.core":13,"./$.global":20,"./$.hide":22,"./$.uid":39}],32:[function(require,module,exports){
var global = require('./$.global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./$.global":20}],33:[function(require,module,exports){
var $export = require('./$.export')
  , defined = require('./$.defined')
  , fails   = require('./$.fails')
  , spaces  = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
      '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF'
  , space   = '[' + spaces + ']'
  , non     = '\u200b\u0085'
  , ltrim   = RegExp('^' + space + space + '*')
  , rtrim   = RegExp(space + space + '*$');

var exporter = function(KEY, exec){
  var exp  = {};
  exp[KEY] = exec(trim);
  $export($export.P + $export.F * fails(function(){
    return !!spaces[KEY]() || non[KEY]() != non;
  }), 'String', exp);
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
},{"./$.defined":15,"./$.export":18,"./$.fails":19}],34:[function(require,module,exports){
var toInteger = require('./$.to-integer')
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};
},{"./$.to-integer":35}],35:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],36:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./$.iobject')
  , defined = require('./$.defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./$.defined":15,"./$.iobject":25}],37:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./$.to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./$.to-integer":35}],38:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./$.defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./$.defined":15}],39:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],40:[function(require,module,exports){
var store  = require('./$.shared')('wks')
  , uid    = require('./$.uid')
  , Symbol = require('./$.global').Symbol;
module.exports = function(name){
  return store[name] || (store[name] =
    Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
};
},{"./$.global":20,"./$.shared":32,"./$.uid":39}],41:[function(require,module,exports){
'use strict';
var $                 = require('./$')
  , $export           = require('./$.export')
  , DESCRIPTORS       = require('./$.descriptors')
  , createDesc        = require('./$.property-desc')
  , html              = require('./$.html')
  , cel               = require('./$.dom-create')
  , has               = require('./$.has')
  , cof               = require('./$.cof')
  , invoke            = require('./$.invoke')
  , fails             = require('./$.fails')
  , anObject          = require('./$.an-object')
  , aFunction         = require('./$.a-function')
  , isObject          = require('./$.is-object')
  , toObject          = require('./$.to-object')
  , toIObject         = require('./$.to-iobject')
  , toInteger         = require('./$.to-integer')
  , toIndex           = require('./$.to-index')
  , toLength          = require('./$.to-length')
  , IObject           = require('./$.iobject')
  , IE_PROTO          = require('./$.uid')('__proto__')
  , createArrayMethod = require('./$.array-methods')
  , arrayIndexOf      = require('./$.array-includes')(false)
  , ObjectProto       = Object.prototype
  , ArrayProto        = Array.prototype
  , arraySlice        = ArrayProto.slice
  , arrayJoin         = ArrayProto.join
  , defineProperty    = $.setDesc
  , getOwnDescriptor  = $.getDesc
  , defineProperties  = $.setDescs
  , factories         = {}
  , IE8_DOM_DEFINE;

if(!DESCRIPTORS){
  IE8_DOM_DEFINE = !fails(function(){
    return defineProperty(cel('div'), 'a', {get: function(){ return 7; }}).a != 7;
  });
  $.setDesc = function(O, P, Attributes){
    if(IE8_DOM_DEFINE)try {
      return defineProperty(O, P, Attributes);
    } catch(e){ /* empty */ }
    if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
    if('value' in Attributes)anObject(O)[P] = Attributes.value;
    return O;
  };
  $.getDesc = function(O, P){
    if(IE8_DOM_DEFINE)try {
      return getOwnDescriptor(O, P);
    } catch(e){ /* empty */ }
    if(has(O, P))return createDesc(!ObjectProto.propertyIsEnumerable.call(O, P), O[P]);
  };
  $.setDescs = defineProperties = function(O, Properties){
    anObject(O);
    var keys   = $.getKeys(Properties)
      , length = keys.length
      , i = 0
      , P;
    while(length > i)$.setDesc(O, P = keys[i++], Properties[P]);
    return O;
  };
}
$export($export.S + $export.F * !DESCRIPTORS, 'Object', {
  // 19.1.2.6 / 15.2.3.3 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $.getDesc,
  // 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
  defineProperty: $.setDesc,
  // 19.1.2.3 / 15.2.3.7 Object.defineProperties(O, Properties)
  defineProperties: defineProperties
});

  // IE 8- don't enum bug keys
var keys1 = ('constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,' +
            'toLocaleString,toString,valueOf').split(',')
  // Additional keys for getOwnPropertyNames
  , keys2 = keys1.concat('length', 'prototype')
  , keysLen1 = keys1.length;

// Create object with `null` prototype: use iframe Object with cleared prototype
var createDict = function(){
  // Thrash, waste and sodomy: IE GC bug
  var iframe = cel('iframe')
    , i      = keysLen1
    , gt     = '>'
    , iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write('<script>document.F=Object</script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while(i--)delete createDict.prototype[keys1[i]];
  return createDict();
};
var createGetKeys = function(names, length){
  return function(object){
    var O      = toIObject(object)
      , i      = 0
      , result = []
      , key;
    for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
    // Don't enum bug & hidden keys
    while(length > i)if(has(O, key = names[i++])){
      ~arrayIndexOf(result, key) || result.push(key);
    }
    return result;
  };
};
var Empty = function(){};
$export($export.S, 'Object', {
  // 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
  getPrototypeOf: $.getProto = $.getProto || function(O){
    O = toObject(O);
    if(has(O, IE_PROTO))return O[IE_PROTO];
    if(typeof O.constructor == 'function' && O instanceof O.constructor){
      return O.constructor.prototype;
    } return O instanceof Object ? ObjectProto : null;
  },
  // 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $.getNames = $.getNames || createGetKeys(keys2, keys2.length, true),
  // 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
  create: $.create = $.create || function(O, /*?*/Properties){
    var result;
    if(O !== null){
      Empty.prototype = anObject(O);
      result = new Empty();
      Empty.prototype = null;
      // add "__proto__" for Object.getPrototypeOf shim
      result[IE_PROTO] = O;
    } else result = createDict();
    return Properties === undefined ? result : defineProperties(result, Properties);
  },
  // 19.1.2.14 / 15.2.3.14 Object.keys(O)
  keys: $.getKeys = $.getKeys || createGetKeys(keys1, keysLen1, false)
});

var construct = function(F, len, args){
  if(!(len in factories)){
    for(var n = [], i = 0; i < len; i++)n[i] = 'a[' + i + ']';
    factories[len] = Function('F,a', 'return new F(' + n.join(',') + ')');
  }
  return factories[len](F, args);
};

// 19.2.3.2 / 15.3.4.5 Function.prototype.bind(thisArg, args...)
$export($export.P, 'Function', {
  bind: function bind(that /*, args... */){
    var fn       = aFunction(this)
      , partArgs = arraySlice.call(arguments, 1);
    var bound = function(/* args... */){
      var args = partArgs.concat(arraySlice.call(arguments));
      return this instanceof bound ? construct(fn, args.length, args) : invoke(fn, args, that);
    };
    if(isObject(fn.prototype))bound.prototype = fn.prototype;
    return bound;
  }
});

// fallback for not array-like ES3 strings and DOM objects
$export($export.P + $export.F * fails(function(){
  if(html)arraySlice.call(html);
}), 'Array', {
  slice: function(begin, end){
    var len   = toLength(this.length)
      , klass = cof(this);
    end = end === undefined ? len : end;
    if(klass == 'Array')return arraySlice.call(this, begin, end);
    var start  = toIndex(begin, len)
      , upTo   = toIndex(end, len)
      , size   = toLength(upTo - start)
      , cloned = Array(size)
      , i      = 0;
    for(; i < size; i++)cloned[i] = klass == 'String'
      ? this.charAt(start + i)
      : this[start + i];
    return cloned;
  }
});
$export($export.P + $export.F * (IObject != Object), 'Array', {
  join: function join(separator){
    return arrayJoin.call(IObject(this), separator === undefined ? ',' : separator);
  }
});

// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
$export($export.S, 'Array', {isArray: require('./$.is-array')});

var createArrayReduce = function(isRight){
  return function(callbackfn, memo){
    aFunction(callbackfn);
    var O      = IObject(this)
      , length = toLength(O.length)
      , index  = isRight ? length - 1 : 0
      , i      = isRight ? -1 : 1;
    if(arguments.length < 2)for(;;){
      if(index in O){
        memo = O[index];
        index += i;
        break;
      }
      index += i;
      if(isRight ? index < 0 : length <= index){
        throw TypeError('Reduce of empty array with no initial value');
      }
    }
    for(;isRight ? index >= 0 : length > index; index += i)if(index in O){
      memo = callbackfn(memo, O[index], index, this);
    }
    return memo;
  };
};

var methodize = function($fn){
  return function(arg1/*, arg2 = undefined */){
    return $fn(this, arg1, arguments[1]);
  };
};

$export($export.P, 'Array', {
  // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
  forEach: $.each = $.each || methodize(createArrayMethod(0)),
  // 22.1.3.15 / 15.4.4.19 Array.prototype.map(callbackfn [, thisArg])
  map: methodize(createArrayMethod(1)),
  // 22.1.3.7 / 15.4.4.20 Array.prototype.filter(callbackfn [, thisArg])
  filter: methodize(createArrayMethod(2)),
  // 22.1.3.23 / 15.4.4.17 Array.prototype.some(callbackfn [, thisArg])
  some: methodize(createArrayMethod(3)),
  // 22.1.3.5 / 15.4.4.16 Array.prototype.every(callbackfn [, thisArg])
  every: methodize(createArrayMethod(4)),
  // 22.1.3.18 / 15.4.4.21 Array.prototype.reduce(callbackfn [, initialValue])
  reduce: createArrayReduce(false),
  // 22.1.3.19 / 15.4.4.22 Array.prototype.reduceRight(callbackfn [, initialValue])
  reduceRight: createArrayReduce(true),
  // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
  indexOf: methodize(arrayIndexOf),
  // 22.1.3.14 / 15.4.4.15 Array.prototype.lastIndexOf(searchElement [, fromIndex])
  lastIndexOf: function(el, fromIndex /* = @[*-1] */){
    var O      = toIObject(this)
      , length = toLength(O.length)
      , index  = length - 1;
    if(arguments.length > 1)index = Math.min(index, toInteger(fromIndex));
    if(index < 0)index = toLength(length + index);
    for(;index >= 0; index--)if(index in O)if(O[index] === el)return index;
    return -1;
  }
});

// 20.3.3.1 / 15.9.4.4 Date.now()
$export($export.S, 'Date', {now: function(){ return +new Date; }});

var lz = function(num){
  return num > 9 ? num : '0' + num;
};

// 20.3.4.36 / 15.9.5.43 Date.prototype.toISOString()
// PhantomJS / old WebKit has a broken implementations
$export($export.P + $export.F * (fails(function(){
  return new Date(-5e13 - 1).toISOString() != '0385-07-25T07:06:39.999Z';
}) || !fails(function(){
  new Date(NaN).toISOString();
})), 'Date', {
  toISOString: function toISOString(){
    if(!isFinite(this))throw RangeError('Invalid time value');
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
},{"./$":28,"./$.a-function":7,"./$.an-object":8,"./$.array-includes":9,"./$.array-methods":10,"./$.cof":12,"./$.descriptors":16,"./$.dom-create":17,"./$.export":18,"./$.fails":19,"./$.has":21,"./$.html":23,"./$.invoke":24,"./$.iobject":25,"./$.is-array":26,"./$.is-object":27,"./$.property-desc":30,"./$.to-index":34,"./$.to-integer":35,"./$.to-iobject":36,"./$.to-length":37,"./$.to-object":38,"./$.uid":39}],42:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./$.export');

$export($export.S + $export.F, 'Object', {assign: require('./$.object-assign')});
},{"./$.export":18,"./$.object-assign":29}],43:[function(require,module,exports){
'use strict';
// 21.1.3.25 String.prototype.trim()
require('./$.string-trim')('trim', function($trim){
  return function trim(){
    return $trim(this, 3);
  };
});
},{"./$.string-trim":33}],44:[function(require,module,exports){

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

},{"./debug":45}],45:[function(require,module,exports){

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

},{"ms":48}],46:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],47:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
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
    var timeout = setTimeout(cleanUpNextTick);
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
    clearTimeout(timeout);
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
        setTimeout(drainQueue, 0);
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

},{}],50:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _DOMComponentsTracking = require('./DOMComponentsTracking.js');

var _DOMComponentsTracking2 = _interopRequireDefault(_DOMComponentsTracking);

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

var AutoEvents = (function () {
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
      this.fireCompletedTransaction();

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

  AutoEvents.prototype.onPageChange = function onPageChange(newPage, oldPage) {
    if (String(newPage.pageId) !== String(oldPage.pageId) || newPage.url !== oldPage.url || newPage.type !== oldPage.type || newPage.breadcrumb !== oldPage.breadcrumb || String(newPage.categoryId) !== String(oldPage.categoryId)) {
      this.fireViewedPage();
      this.fireViewedProductCategory();
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
      page: page
    });
  };

  AutoEvents.prototype.fireViewedProductCategory = function fireViewedProductCategory(page) {
    page = page || this.digitalData.page || {};
    if (page.type !== 'category') {
      return;
    }
    this.digitalData.events.push({
      enrichEventData: false,
      name: 'Viewed Product Category',
      category: 'Ecommerce',
      page: page
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
      product: product
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

  return AutoEvents;
})();

exports['default'] = AutoEvents;

},{"./DOMComponentsTracking.js":52,"component-type":6}],51:[function(require,module,exports){
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

var DDHelper = (function () {
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
                product.position = product.position || i + 1;
                if (listing.listName) product.listName = product.listName || listing.listName;
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

  DDHelper.getCampaign = function getCampaign(id, digitalData) {
    if (digitalData.campaigns && digitalData.campaigns.length) {
      for (var _iterator3 = digitalData.campaigns, _isArray3 = Array.isArray(_iterator3), _i4 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref3;

        if (_isArray3) {
          if (_i4 >= _iterator3.length) break;
          _ref3 = _iterator3[_i4++];
        } else {
          _i4 = _iterator3.next();
          if (_i4.done) break;
          _ref3 = _i4.value;
        }

        var campaign = _ref3;

        if (campaign.id && String(campaign.id) === String(id)) {
          return (0, _componentClone2['default'])(campaign);
        }
      }
    }
  };

  return DDHelper;
})();

exports['default'] = DDHelper;

},{"./functions/getProperty.js":63,"component-clone":4}],52:[function(require,module,exports){
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
 * - data-ddl-viewed-product="<product_id>"
 * - data-ddl-viewed-campaign="<campaign_id>"
 * - data-ddl-clicked-product="<product_id>"
 * - data-ddl-clicked-campaign="<campaign_id>"
 *
 * If any DOM components are added to the page dynamically
 * corresponding digitalData variable should be updated:
 * digitalData.list, digitalData.recommendation or digitalData.campaigns
 */

var DOMComponentsTracking = (function () {
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
          self.fireClickedProduct(id);
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

    var _loop = function _loop(type) {
      var newViewedComponentIds = [];
      var $components = _this4.$digitalDataComponents[type];
      $components.each(function (index, el) {
        // eslint-disable-line no-loop-func
        var $el = window.jQuery(el);
        var id = $el.data('ddl-viewed-' + type);
        if (_this4.viewedComponentIds[type].indexOf(id) < 0 && _this4.isVisible($el)) {
          _this4.viewedComponentIds[type].push(id);
          newViewedComponentIds.push(id);
        }
      });

      if (newViewedComponentIds.length > 0) {
        if (type === 'product') {
          _this4.fireViewedProduct(newViewedComponentIds);
        } else if (type === 'campaign') {
          _this4.fireViewedCampaign(newViewedComponentIds);
        }
      }
    };

    var _arr3 = ['campaign', 'product'];

    for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
      var type = _arr3[_i3];
      _loop(type);
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

  DOMComponentsTracking.prototype.fireViewedProduct = function fireViewedProduct(productIds) {
    window.digitalData.events.push({
      name: 'Viewed Product',
      category: 'Ecommerce',
      product: productIds
    });
  };

  DOMComponentsTracking.prototype.fireViewedCampaign = function fireViewedCampaign(campaignIds) {
    window.digitalData.events.push({
      name: 'Viewed Campaign',
      category: 'Promo',
      campaign: campaignIds
    });
  };

  DOMComponentsTracking.prototype.fireClickedProduct = function fireClickedProduct(productId) {
    window.digitalData.events.push({
      name: 'Clicked Product',
      category: 'Ecommerce',
      product: productId
    });
  };

  DOMComponentsTracking.prototype.fireClickedCampaign = function fireClickedCampaign(campaignId) {
    window.digitalData.events.push({
      name: 'Clicked Campaign',
      category: 'Promo',
      campaign: campaignId
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
    return obj.find('[data-' + name + ']');
  };

  DOMComponentsTracking.prototype.getDataAttrSelector = function getDataAttrSelector(name) {
    return '[data-' + name + ']';
  };

  return DOMComponentsTracking;
})();

exports['default'] = DOMComponentsTracking;

},{}],53:[function(require,module,exports){
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

var DigitalDataEnricher = (function () {
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
})();

exports['default'] = DigitalDataEnricher;

},{"./functions/htmlGlobals.js":65}],54:[function(require,module,exports){
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

var EventDataEnricher = (function () {
  function EventDataEnricher() {
    _classCallCheck(this, EventDataEnricher);
  }

  EventDataEnricher.product = function product(productArr, digitalData) {
    productArr = productArr || [];
    var productId = undefined;
    var returnArray = true;
    if (!Array.isArray(productArr)) {
      returnArray = false;
      productArr = [productArr];
    }

    var result = [];
    for (var _iterator = productArr, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var _product = _ref;

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
      result.push(_product);
    }

    if (!returnArray) {
      return result.pop();
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

  EventDataEnricher.campaign = function campaign(campaignArr, digitalData) {
    campaignArr = campaignArr || [];
    var campaignId = undefined;
    var returnArray = true;
    if (!Array.isArray(campaignArr)) {
      returnArray = false;
      campaignArr = [campaignArr];
    }

    var result = [];
    for (var _iterator2 = campaignArr, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var _campaign = _ref2;

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
      result.push(_campaign);
    }

    if (!returnArray) {
      return result.pop();
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
})();

exports['default'] = EventDataEnricher;

},{"./DDHelper.js":51,"component-type":6}],55:[function(require,module,exports){
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
var _checkForChangesIntervalId = undefined;
var _autoEvents = undefined;
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

var EventManager = (function () {
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
      _this.checkForChanges();
    }, 100);

    _isInitialized = true;
  };

  EventManager.prototype.setAutoEvents = function setAutoEvents(autoEvents) {
    _autoEvents = autoEvents;
    _autoEvents.setDigitalData(_digitalData);
    _autoEvents.setDDListener(_ddListener);
  };

  EventManager.prototype.checkForChanges = function checkForChanges() {
    if (_callbacks.change && _callbacks.change.length > 0) {
      var digitalDataWithoutEvents = _getCopyWithoutEvents(_digitalData);
      if (!(0, _jsonIsEqual2['default'])(_previousDigitalData, digitalDataWithoutEvents)) {
        var previousDigitalDataWithoutEvents = _getCopyWithoutEvents(_previousDigitalData);
        _previousDigitalData = (0, _componentClone2['default'])(digitalDataWithoutEvents);
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

  EventManager.prototype.fireChange = function fireChange(newValue, previousValue) {
    var changeCallback = undefined;
    if (_callbacks.change) {
      for (var _iterator = _callbacks.change, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        if (_isArray) {
          if (_i >= _iterator.length) break;
          changeCallback = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          changeCallback = _i.value;
        }

        if (changeCallback.key) {
          var key = changeCallback.key;
          var newKeyValue = _DDHelper2['default'].get(key, newValue);
          var previousKeyValue = _DDHelper2['default'].get(key, previousValue);
          if (!(0, _jsonIsEqual2['default'])(newKeyValue, previousKeyValue)) {
            changeCallback.handler(newKeyValue, previousKeyValue, _callbackOnComplete);
          }
        } else {
          changeCallback.handler(newValue, previousValue, _callbackOnComplete);
        }
      }
    }
  };

  EventManager.prototype.fireEvent = function fireEvent(event) {
    var _this2 = this;

    var eventCallback = undefined;
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

        for (var _iterator2 = _callbacks.event, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            eventCallback = _iterator2[_i2++];
          } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            eventCallback = _i2.value;
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
    var event = undefined;
    for (var _iterator3 = events, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        event = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        event = _i3.value;
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
    var event = undefined;
    for (var _iterator4 = events, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        event = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        event = _i4.value;
      }

      if (!event.hasFired) {
        this.fireEvent(event);
      }
    }
  };

  EventManager.prototype.addEarlyCallbacks = function addEarlyCallbacks() {
    var callbackInfo = undefined;
    for (var _iterator5 = _ddListener, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
      if (_isArray5) {
        if (_i5 >= _iterator5.length) break;
        callbackInfo = _iterator5[_i5++];
      } else {
        _i5 = _iterator5.next();
        if (_i5.done) break;
        callbackInfo = _i5.value;
      }

      this.addCallback(callbackInfo);
    }
  };

  EventManager.prototype.enrichEventWithData = function enrichEventWithData(event) {
    var enrichableVars = ['product', 'transaction', 'campaign', 'user', 'page'];

    for (var _iterator6 = enrichableVars, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
      var _ref;

      if (_isArray6) {
        if (_i6 >= _iterator6.length) break;
        _ref = _iterator6[_i6++];
      } else {
        _i6 = _iterator6.next();
        if (_i6.done) break;
        _ref = _i6.value;
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
  };

  return EventManager;
})();

exports['default'] = EventManager;

},{"./DDHelper.js":51,"./EventDataEnricher.js":54,"./functions/after.js":59,"./functions/deleteProperty.js":60,"./functions/jsonIsEqual.js":66,"./functions/noop.js":70,"./functions/size.js":72,"async":1,"component-clone":4,"debug":44}],56:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

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

var Integration = (function (_EventEmitter) {
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

    var el = undefined;
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
})(_componentEmitter2['default']);

exports['default'] = Integration;

},{"./DDHelper.js":51,"./functions/deleteProperty.js":60,"./functions/each.js":61,"./functions/format.js":62,"./functions/loadIframe.js":67,"./functions/loadPixel.js":68,"./functions/loadScript.js":69,"./functions/noop.js":70,"async":1,"component-emitter":5,"debug":44}],57:[function(require,module,exports){
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
  'myTarget': _MyTarget2['default']
};

exports['default'] = integrations;

},{"./integrations/Criteo.js":75,"./integrations/Driveback.js":76,"./integrations/FacebookPixel.js":77,"./integrations/GoogleAnalytics.js":78,"./integrations/GoogleTagManager.js":79,"./integrations/MyTarget.js":80,"./integrations/OWOXBIStreaming.js":81,"./integrations/RetailRocket.js":82,"./integrations/SegmentStream.js":83,"./integrations/SendPulse.js":84}],58:[function(require,module,exports){
'use strict';

function _typeof2(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

exports.__esModule = true;

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

function _typeof(obj) {
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj === 'undefined' ? 'undefined' : _typeof2(obj);
}

var ddManager = undefined;

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
var _availableIntegrations = undefined;

/**
 * @type {EventManager}
 * @private
 */
var _eventManager = undefined;

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
              var integration = new _availableIntegrations[name](_digitalData, (0, _componentClone2['default'])(options));
              ddManager.addIntegration(name, integration);
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
                  integration.trackEvent(event);
                }]);
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

  VERSION: '1.0.14',

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
      _eventManager.initialize();
      _isReady = true;
      ddManager.emit('ready');
    });

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

},{"./AutoEvents.js":50,"./DDHelper.js":51,"./DigitalDataEnricher.js":53,"./EventManager.js":55,"./Integration.js":56,"./functions/after.js":59,"./functions/each.js":61,"./functions/size.js":72,"async":1,"component-clone":4,"component-emitter":5}],59:[function(require,module,exports){
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

},{}],60:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj, prop) {
  try {
    delete obj[prop];
  } catch (e) {
    obj[prop] = undefined;
  }
};

},{}],61:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj, fn) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      fn(key, obj[key]);
    }
  }
};

},{}],62:[function(require,module,exports){
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

},{}],63:[function(require,module,exports){
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

},{}],64:[function(require,module,exports){
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

},{}],65:[function(require,module,exports){
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

},{}],66:[function(require,module,exports){
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

},{}],67:[function(require,module,exports){
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

},{"./scriptOnLoad.js":71,"async":1}],68:[function(require,module,exports){
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

},{}],69:[function(require,module,exports){
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

},{"./scriptOnLoad.js":71,"async":1}],70:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function () {};

},{}],71:[function(require,module,exports){
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

},{}],72:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (obj) {
  var size = 0;
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

},{}],73:[function(require,module,exports){
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

},{"debug":44}],74:[function(require,module,exports){
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

},{"./availableIntegrations.js":57,"./ddManager.js":58,"./polyfill.js":85}],75:[function(require,module,exports){
'use strict';

function _typeof2(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _typeof(obj) {
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj === 'undefined' ? 'undefined' : _typeof2(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof2(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof2(superClass)));
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

var Criteo = (function (_Integration) {
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
      var siteType = ['desktop', 'tablet', 'mobile'].indexOf(this.digitalData.page.siteType) >= 0 ? this.digitalData.page.siteType.toLocaleLowerCase() : 'desktop';

      window.criteo_q.push({
        event: 'setAccount',
        account: this.getOption('account')
      }, {
        event: 'setSiteType',
        type: siteType.charAt(0) });

      // "d", "m", "t"
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
      } else if (page.type === 'cart') {
        this.onViewedCart();
      }
    }

    var listing = this.digitalData.listing;
    if (listing && listing.items && listing.items.length) {
      this.onViewedProductListing();
    }
  };

  Criteo.prototype.onViewedHome = function onViewedHome() {
    window.criteo_q.push({
      event: 'viewHome'
    });
  };

  Criteo.prototype.onViewedProductListing = function onViewedProductListing() {
    var items = this.digitalData.listing.items;
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
    var productId = undefined;
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

  Criteo.prototype.onViewedCart = function onViewedCart() {
    var cart = this.digitalData.cart;
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
          if (context.campaign && context.campaign.name && context.campaign.name.toLocaleLowerCase() === 'criteo') {
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
})(_Integration3['default']);

exports['default'] = Criteo;

},{"./../Integration.js":56,"./../functions/deleteProperty.js":60}],76:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

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

var Driveback = (function (_Integration) {
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
})(_Integration3['default']);

exports['default'] = Driveback;

},{"./../Integration.js":56,"./../functions/deleteProperty.js":60,"./../functions/noop.js":70}],77:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

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

var FacebookPixel = (function (_Integration) {
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
      this.onViewedProductCategory(event.page);
    } else if (event.name === 'Viewed Product Detail') {
      this.onViewedProductDetail(event.product);
    } else if (event.name === 'Added Product') {
      this.onAddedProduct(event.product, event.quantity);
    } else if (event.name === 'Completed Transaction') {
      this.onCompletedTransaction(event.transaction);
    }
  };

  FacebookPixel.prototype.onViewedPage = function onViewedPage() {
    window.fbq('track', 'PageView');
  };

  FacebookPixel.prototype.onViewedProductCategory = function onViewedProductCategory(page) {
    window.fbq('track', 'ViewContent', {
      content_ids: [page.categoryId || ''],
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

  return FacebookPixel;
})(_Integration3['default']);

exports['default'] = FacebookPixel;

},{"./../Integration.js":56,"./../functions/deleteProperty.js":60,"component-type":6}],78:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

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
  var voucher = undefined;
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

var GoogleAnalytics = (function (_Integration) {
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
    var campaign = this.get('context.campaign') || {};
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

    if (campaign.name) pageview.campaignName = campaign.name;
    if (campaign.source) pageview.campaignSource = campaign.source;
    if (campaign.medium) pageview.campaignMedium = campaign.medium;
    if (campaign.content) pageview.campaignContent = campaign.content;
    if (campaign.term) pageview.campaignKeyword = campaign.term;

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
    var products = event.product;
    if (!Array.isArray(products)) {
      products = [products];
    }

    for (var _iterator3 = products, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref3;

      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        _ref3 = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        _ref3 = _i3.value;
      }

      var product = _ref3;

      if (!product.id && !product.skuCode && !product.name) {
        continue;
      }
      this.loadEnhancedEcommerce(product.currency);
      this.ga('ec:addImpression', {
        id: product.id || product.skuCode,
        name: product.name,
        list: product.listName,
        category: product.category,
        brand: product.brand || product.manufacturer,
        price: product.unitSalePrice || product.unitPrice,
        currency: product.currency || this.getOption('defaultCurrency'),
        variant: product.variant,
        position: product.position
      });
    }

    this.pushEnhancedEcommerce(event);
  };

  GoogleAnalytics.prototype.onClickedProduct = function onClickedProduct(event) {
    var product = event.product;
    this.loadEnhancedEcommerce(product.currency);
    this.enhancedEcommerceProductAction(event, 'click', {
      list: product.listName
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
    var campaigns = event.campaign;
    if (!Array.isArray(campaigns)) {
      campaigns = [campaigns];
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
    var campaign = this.get('context.campaign') || {};

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

    if (campaign.name) payload.campaignName = campaign.name;
    if (campaign.source) payload.campaignSource = campaign.source;
    if (campaign.medium) payload.campaignMedium = campaign.medium;
    if (campaign.content) payload.campaignContent = campaign.content;
    if (campaign.term) payload.campaignKeyword = campaign.term;

    this.ga('send', 'event', payload);
  };

  GoogleAnalytics.prototype.enhancedEcommerceTrackProduct = function enhancedEcommerceTrackProduct(product, quantity) {
    var gaProduct = {
      id: product.id || product.skuCode,
      name: product.name,
      category: product.category,
      quantity: quantity,
      price: product.unitSalePrice || product.unitPrice,
      brand: product.brand || product.manufacturer,
      variant: product.variant,
      currency: product.currency
    };
    // append coupon if it set
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#measuring-transactions
    if (product.voucher) gaProduct.coupon = product.voucher;
    this.ga('ec:addProduct', gaProduct);
  };

  GoogleAnalytics.prototype.enhancedEcommerceProductAction = function enhancedEcommerceProductAction(event, action, data) {
    this.enhancedEcommerceTrackProduct(event.product, event.quantity);
    this.ga('ec:setAction', action, data || {});
  };

  return GoogleAnalytics;
})(_Integration3['default']);

exports['default'] = GoogleAnalytics;

},{"./../Integration.js":56,"./../functions/deleteProperty.js":60,"./../functions/each.js":61,"./../functions/getProperty.js":63,"./../functions/size.js":72,"component-clone":4,"component-type":6}],79:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

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

var GoogleTagManager = (function (_Integration) {
  _inherits(GoogleTagManager, _Integration);

  function GoogleTagManager(digitalData, options) {
    _classCallCheck(this, GoogleTagManager);

    var optionsWithDefaults = Object.assign({
      containerId: null
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
    if (this.getOption('containerId')) {
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
})(_Integration3['default']);

exports['default'] = GoogleTagManager;

},{"./../Integration.js":56,"./../functions/deleteProperty.js":60}],80:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

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

var MyTarget = (function (_Integration) {
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
    var productIds = undefined;

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
    var productIds = undefined;

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
})(_Integration3['default']);

exports['default'] = MyTarget;

},{"./../Integration.js":56,"./../functions/deleteProperty.js":60}],81:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

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

var OWOXBIStreaming = (function (_Integration) {
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
            g = (function () {
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
        })();h.set('sendHitTask', function (a) {
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
})(_Integration3['default']);

exports['default'] = OWOXBIStreaming;

},{"./../Integration.js":56}],82:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

exports.__esModule = true;

var _Integration2 = require('./../Integration.js');

var _Integration3 = _interopRequireDefault(_Integration2);

var _deleteProperty = require('./../functions/deleteProperty.js');

var _deleteProperty2 = _interopRequireDefault(_deleteProperty);

var _getProperty = require('./../../src/functions/getProperty.js');

var _getProperty2 = _interopRequireDefault(_getProperty);

var _throwError = require('./../functions/throwError.js');

var _throwError2 = _interopRequireDefault(_throwError);

var _componentType = require('component-type');

var _componentType2 = _interopRequireDefault(_componentType);

var _format = require('./../functions/format.js');

var _format2 = _interopRequireDefault(_format);

var _getQueryParam = require('./../functions/getQueryParam.js');

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

var RetailRocket = (function (_Integration) {
  _inherits(RetailRocket, _Integration);

  function RetailRocket(digitalData, options) {
    _classCallCheck(this, RetailRocket);

    var optionsWithDefaults = Object.assign({
      partnerId: '',
      userIdProperty: 'user.userId',
      trackProducts: true, // legacy setting, use noConflict instead
      noConflict: false,
      trackAllEmails: false
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
      window.rrApi.pageView = window.rrApi.addToBasket = window.rrApi.order = window.rrApi.categoryView = window.rrApi.setEmail = window.rrApi.view = window.rrApi.recomMouseDown = window.rrApi.recomAddToCart = function () {};

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
    (0, _deleteProperty2['default'])(window, 'rcApi');
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
        this.onViewedProductCategory(event.page);
      } else if (event.name === 'Added Product') {
        this.onAddedProduct(event.product);
      } else if (event.name === 'Viewed Product Detail') {
        this.onViewedProductDetail(event.product);
      } else if (event.name === 'Completed Transaction') {
        this.onCompletedTransaction(event.transaction);
      } else if (event.name === 'Subscribed') {
        this.onSubscribed(event.user);
      }
    } else {
      if (event.name === 'Subscribed') {
        this.onSubscribed(event.user);
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

  RetailRocket.prototype.onViewedProductCategory = function onViewedProductCategory(page) {
    var _this3 = this;

    page = page || {};
    var categoryId = page.categoryId;
    if (!categoryId) {
      this.onValidationError('page.categoryId');
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

  RetailRocket.prototype.onCompletedTransaction = function onCompletedTransaction(transaction) {
    var _this6 = this;

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
        _this6.onError(e);
      }
    });
  };

  RetailRocket.prototype.onSubscribed = function onSubscribed(user) {
    var _this7 = this;

    user = user || {};
    if (!user.email) {
      this.onValidationError('user.email');
      return;
    }
    window.rrApiOnReady.push(function () {
      try {
        window.rrApi.setEmail(user.email);
      } catch (e) {
        _this7.onError(e);
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
    var productId = undefined;
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
})(_Integration3['default']);

exports['default'] = RetailRocket;

},{"./../../src/functions/getProperty.js":63,"./../Integration.js":56,"./../functions/deleteProperty.js":60,"./../functions/format.js":62,"./../functions/getQueryParam.js":64,"./../functions/throwError.js":73,"component-type":6}],83:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

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

var SegmentStream = (function (_Integration) {
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
})(_Integration3['default']);

exports['default'] = SegmentStream;

},{"./../Integration.js":56,"./../functions/deleteProperty.js":60,"./../functions/each.js":61}],84:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

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

var SendPulse = (function (_Integration) {
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

    window.ddListener.push(['on', 'change:user', function (user) {
      if (user.pushNotifications.isSubscribed) {
        _this2.sendUserAttributes(user);
      }
    }]);
    this.load(function () {
      var original = window.oSpP.storeSubscription;
      window.oSpP.storeSubscription = function (value) {
        original(value);
        if (value !== 'DENY') {
          _this2.sendUserAttributes(_this2.digitalData.user);
        }
      };
      _this2.ready();
    });
  };

  SendPulse.prototype.enrichDigitalData = function enrichDigitalData(done) {
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
        done();
      });
    } catch (e) {
      pushNotification.isSupported = false;
      done();
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

  SendPulse.prototype.sendUserAttributes = function sendUserAttributes(user) {
    (0, _each2['default'])(user, function (key, value) {
      if ((0, _componentType2['default'])(value) !== 'object') {
        window.oSpP.push(key, value);
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
})(_Integration3['default']);

exports['default'] = SendPulse;

},{"./../Integration.js":56,"./../functions/deleteProperty.js":60,"./../functions/each.js":61,"component-type":6}],85:[function(require,module,exports){
'use strict';

require('core-js/modules/es5');

require('core-js/modules/es6.object.assign');

require('core-js/modules/es6.string.trim');

},{"core-js/modules/es5":41,"core-js/modules/es6.object.assign":42,"core-js/modules/es6.string.trim":43}]},{},[74]);
