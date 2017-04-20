export default function fireEvent(el, etype){
  let event;
  if (document.createEvent) {
    event = document.createEvent("HTMLEvents");
    event.initEvent(etype, true, true);
  } else {
    event = document.createEventObject();
    event.eventType = etype;
  }
  event.eventName = etype;

  if (el.dispatchEvent) {
    el.dispatchEvent(event);
  } else {
    el.fireEvent(`on${etype}`, event);
  }
}
