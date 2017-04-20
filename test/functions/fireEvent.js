export default function fireEvent(el, etype){
  if (el.fireEvent) {
    console.warn('1');
    el.fireEvent('on' + etype);
  } else {
    let event;
    if (document.createEvent) {
      console.warn('2');
      event = document.createEvent("HTMLEvents");
      event.initEvent(etype, true, true);
    } else {
      console.warn('3');
      event = document.createEventObject();
      event.eventType = etype;
    }
    event.eventName = etype;

    if (el.dispatchEvent) {
      console.warn('4');
      el.dispatchEvent(event);
    } else {
      console.warn('5');
      el.fireEvent(`on${etype}`, event);
    }
  }
}
