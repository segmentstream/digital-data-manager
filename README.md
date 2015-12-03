#Digital Data Manager

[![Build Status](https://travis-ci.org/driveback/digital-data-manager.svg?branch=master)](https://travis-ci.org/driveback/digital-data-manager)

The hassle-free way to integrate Digital Data Layer on your website.

##Installation

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
<script src="dd-manager.js"></script>
```

##Event tracking

###Listening and reacting to events

```javascript
window.ddListener.push(['on', 'event', function(event) {
  if (event.action === 'Subscribed') {
     console.log('event fired!');
  }
}]);
```

###Firing events
```javascript
window.digitalData.events.push({
   'category': 'Email',
   'action': 'Subscribed'
});
```
