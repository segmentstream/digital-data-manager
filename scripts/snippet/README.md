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
<script type="text/javascript" src="dd-manager.js"></script>
<script type="text/javascript">
  ddManager.initialize();
</script>
```

## Async Installation

```html
<script type="text/javascript">
SNIPPET_PLACEHOLDER
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
