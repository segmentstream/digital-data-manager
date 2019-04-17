# Digital Data Manager

[![Build Status](https://travis-ci.org/driveback/digital-data-manager.svg?branch=master)](https://travis-ci.org/driveback/digital-data-manager)

Digital Data Manager is an open source library which provides the hassle-free way to integrate Digital Data Layer on your website, collect customer data with one API and send it to hundreds of tools for analytics, marketing, and data warehousing. More info at [https://docs.ddmanager.ru/](https://docs.ddmanager.ru/).

## Defining Digital Data Layer
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

## Sync Installation
```html
<script type="text/javascript" src="segmentstream.js"></script>
<script type="text/javascript">
  ddManager.initialize();
</script>
```

## Async Installation

```html
<script type="text/javascript">
(function(h,d){d=d||"cdn.segmentstream.com";var a=window.segmentstream=window.segmentstream||[];window.ddListener=window.ddListener||[];var b=window.digitalData=window.digitalData||{};b.events=b.events||[];b.changes=b.changes||[];if(!a.initialize)if(a.invoked)window.console&&console.error&&console.error("SegmentStream snippet included twice.");else{a.invoked=!0;a.methods="initialize addIntegration persist unpersist on once off getConsent setConsent".split(" ");a.factory=function(k){return function(){var c=
Array.prototype.slice.call(arguments);c.unshift(k);a.push(c);return a}};for(b=0;b<a.methods.length;b++){var f=a.methods[b];a[f]=a.factory(f)}a.load=function(a){var c=document.createElement("script");c.type="text/javascript";c.charset="utf-8";c.async=!0;c.src=a;a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(c,a)};a.loadProject=function(b){var c=window.location.search;if(0<=c.indexOf("segmentstream_test_mode=1"))try{var e=!0;window.localStorage.setItem("_segmentstream_test_mode",
"1")}catch(g){}else if(0<=c.indexOf("segmentstream_test_mode=0"))try{e=!1,window.localStorage.removeItem("_segmentstream_test_mode")}catch(g){}else try{e="1"===window.localStorage.getItem("_segmentstream_test_mode")}catch(g){}e?a.load(window.SEGMENTSTREAM_TESTMODE_INIT_URL||"https://api.segmentstream.com/v1/project/"+b+".js"):a.load(window.SEGMENTSTREAM_INIT_URL||"https://"+d+"/project/"+b+".js")};a.CDN_DOMAIN=d;a.SNIPPET_VERSION="1.0.12";a.loadProject(h)}})("<PROJECT_ID>","<CDN_DOMAIN>");
</script>
```


## Initialization With Integrations
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

**Note.** You can even remove you GTM or Google Analytics tags from the code. Digital Data Manager will load them automatically.

## Event tracking

### Listening and reacting to events

```javascript
window.ddListener.push(['on', 'event', function(event) {
  if (event.name === 'Subscribed') {
     console.log('event fired!');
  }
}]);
```

### Firing events
```javascript
window.digitalData.events.push({
   'category': 'Email',
   'name': 'Subscribed'
});
```

## Changes tracking

### Listening and reacting to changes inside DDL

```javascript
window.ddListener.push(['on', 'change', function(newValue, previousValue) {
  console.log(newValue);
  console.log(previousValue);
}]);
```

### Listening and reacting to changes of specific key inside DDL

```javascript
window.ddListener.push(['on', 'change:user.returning', function(newValue, previousValue) {
  console.log(newValue);
  console.log(previousValue);
}]);
```

### Listening and reacting to changes of key property inside DDL

```javascript
window.ddListener.push(['on', 'change:cart.items.length', function(newValue, previousValue) {
  console.log(newValue);
  console.log(previousValue);
}]);
```

### Firing changes to DDL

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

## Learn more at these links
- [DigitalData Documentation](https://ddmanager.readme.io)
- [Driveback Blog](http://blog.driveback.ru)

## License

The Digital Data Manager is licensed under the MIT license. See [License File](LICENSE.txt) for more information.
