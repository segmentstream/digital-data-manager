export default function () {
  // Create a queue, but don't obliterate an existing one!
  var ddManager = window.ddManager = window.ddManager || [];
  var ddListener = window.ddListener = window.ddListener || [];
  var digitalData = window.digitalData =  window.digitalData || {};
  digitalData.events = digitalData.events || [];

  // If the real ddManager is already on the page return.
  if (ddManager.init) return;

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
  ddManager.methods = [
    'initialize',
    'addIntegration'
  ];

  // Define a factory to create stubs. These are placeholders
  // for methods in Digital Data Manager so that you never have to wait
  // for it to load to actually record data. The `method` is
  // stored as the first argument, so we can replay the data.
  ddManager.factory = function(method){
    return function(){
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
}
