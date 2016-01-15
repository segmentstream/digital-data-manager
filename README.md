#Digital Data Manager

[![Build Status](https://travis-ci.org/driveback/digital-data-manager.svg?branch=master)](https://travis-ci.org/driveback/digital-data-manager)

The hassle-free way to integrate Digital Data Layer on your website.

##Defining Digital Data Layer
```html
<script type="text/javascript">
window.digitalData = {
  page: {
    type: "home"
  },
  user: {
    userId: "1232321",
    name: "John Dow"
  },
  events: []
}
</script>
```

##Sync Installation
```html
<script type="text/javascript" src="dd-manager.js"></script>
<script type="text/javascript">
  ddManager.initialize();
</script>
```

##Async Installation
```html
<script type="text/javascript">
(function(){var a=window.ddManager=window.ddManager||[];window.ddListener=window.ddListener||[];var b=window.digitalData=window.digitalData||{};b.events=b.events||[];if(!a.initialize)if(a.invoked)window.console&&console.error&&console.error("Digital Data Manager snippet included twice.");else for(a.invoked=!0,a.methods=["initialize","addIntegration","on","once","off"],a.factory=function(b){return function(){var c=Array.prototype.slice.call(arguments);c.unshift(b);a.push(c);return a}},b=0;b<a.methods.length;b++){var c=
a.methods[b];a[c]=a.factory(c)}})();
</script>
<script type="text/javascript" async src="dd-manager.js"></script>
<script type="text/javascript">
  ddManager.initialize();
</script>
```

##Async Installation (not minified)

```html
<script type="text/javascript">
(function () {
  // Create a queue, but don't obliterate an existing one!
  var ddManager = window.ddManager = window.ddManager || [];
  var ddListener = window.ddListener = window.ddListener || [];
  var digitalData = window.digitalData =  window.digitalData || {};
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

  // A list of the methods in ddManager to stub.
  ddManager.methods = [
    'initialize',
    'addIntegration',
    'on',
    'once',
    'off'
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
}());
</script>
<script type="text/javascript" async src="dd-manager.js"></script>
<script type="text/javascript">
  ddManager.initialize();
</script>
```


##Initialization With Integrations
```javascript
ddManager.initialize({
  'integrations': {
    'Google Tag Manager': {
      'containerId': 'XXX'
    },
    'Google Analytics': {
      'trackingId': 'XXX'
    }
  }
});
```

**Note.**You can even remove you GTM or Google Analytics tags from the code. Digital Data Manager will load them automatically.

##Event tracking

###Listening and reacting to events

```javascript
window.ddListener.push(['on', 'event', function(event) {
  if (event.name === 'Subscribed') {
     console.log('event fired!');
  }
}]);
```

###Firing events
```javascript
window.digitalData.events.push({
   'category': 'Email',
   'name': 'Subscribed'
});
```

##Changes tracking

###Listening and reacting to changes inside DDL

```javascript
window.ddListener.push(['on', 'change', function(newValue, previousValue) {
  console.log(newValue);
  console.log(previousValue);
}]);
```

###Listening and reacting to changes of specific key inside DDL

```javascript
window.ddListener.push(['on', 'change:user.returning', function(newValue, previousValue) {
  console.log(newValue);
  console.log(previousValue);
}]);
```

###Listening and reacting to changes of key property inside DDL

```javascript
window.ddListener.push(['on', 'change:cart.items.length', function(newValue, previousValue) {
  console.log(newValue);
  console.log(previousValue);
}]);
```

###Firing changes to DDL

```javascript
// user status changed to "returning"
ddManager.once('ready', function() {
  digitalData.user.returning = true;
});
```

```javascript
// new product was added to cart
ddManager.once('ready', function() {
  digitalData.cart.items.push({
    "id": 123,
    "name": "Product 1"
  });
});
```

## Learn more at these links (in Russian)
- [Digital Data Layer Website](https://www.data-layer.net)
- [Driveback Blog](http://blog.driveback.ru)

## License

The Digital Data Manager is licensed under the MIT license. See [License File](LICENSE.txt) for more information.
