import { warn } from '@segmentstream/utils/safeConsole'
import Integration from '../Integration'

class Renta extends Integration {
  // constructor(digitalData, options) {
  //   super(digitalData, options);
  // }

  initialize () {
    if (!window.ga) {
      warn('Google Analytics integration should be initialized before Renta integration')
      return false
    }

    window.ga('require', 'RentaStreaming');

    /* eslint-disable */
    (function(){var trackerData=function(tracker,f){var sendHitTask=tracker.get("sendHitTask"),sender=function(){function ajaxRequest(payload){var success=!1,request;try{window.XMLHttpRequest&&"withCredentials"in(request=new XMLHttpRequest)&&(request.open("POST",url(),!0),a.setRequestHeader("Content-Type","text/plain"),request.send(payload),success=!0)}catch(ex){}return success}function domainRequest(payload){var success=!1,request;try{window.XDomainRequest&&(request=new XDomainRequest,request.open("POST",url(!1,location.protocol.slice(0,-1))),setTimeout(function(){request.send(payload)},0),success=!0)}catch(ex){}return success}function imageRequest(payload){var image,success=!1;try{image=document.createElement("img"),image.src=url(!0)+"?"+payload,success=!0}catch(ex){}return success}function beaconRequest(payload){var success;try{success=navigator.sendBeacon&&navigator.sendBeacon(url(),payload)}catch(ex){}return success}function url(c,protocol){var endpoint;protocol||(protocol="https");endpoint=protocol+"://"+domain+"/collect";c||(endpoint+="?tid="+encodeURIComponent(tracker.get("trackingId")));return endpoint}var domain=f&&f.domain?f.domain:"stream.renta.im";return{send:function(payload){return imageRequest(payload)||beaconRequest(payload)||ajaxRequest(payload)||domainRequest(payload)}}}();tracker.set("sendHitTask",function(data){sendHitTask(data);sender.send(data.get("hitPayload"))})},googleAnalyticsObj=window[window.GoogleAnalyticsObject||"ga"];googleAnalyticsObj&&googleAnalyticsObj("provide","RentaStreaming",trackerData)})();
    /* eslint-enable */

    this._loaded = true
    return true
  }

  isLoaded () {
    return !!this._loaded
  }
}

export default Renta
