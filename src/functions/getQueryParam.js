export default function getQueryParam(name, queryString) {
  if (!queryString) {
    queryString = location.search;
  }
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(queryString);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};
