let errorTrackingEnabled = false;

export function enableErrorTracking(digitalData) {
  if (errorTrackingEnabled) return;

  const originalWindowErrorCallback = window.onerror;

  window.onerror = (errorMessage, url, lineNumber, columnNumber, errorObject) => {
    // In case the "errorObject" is available, use its data, else fallback
    // on the default "errorMessage" provided:
    let exceptionDescription = errorMessage;
    if (errorObject && typeof errorObject.message !== 'undefined') {
      exceptionDescription = errorObject.message;
    }

    // Format the message to log to Analytics (might also use "errorObject.stack" if defined):
    exceptionDescription += ' @ ' + url + ':' + lineNumber + ':' + columnNumber;

    digitalData.events.push({
      name: 'Exception',
      category: 'JS Errors',
      exception: {
        message: errorMessage,
        description: exceptionDescription,
        lineNumber,
        columnNumber,
        isFatal: true,
      },
    });

    // If the previous "window.onerror" callback can be called, pass it the data:
    if (typeof originalWindowErrorCallback === 'function') {
      return originalWindowErrorCallback(errorMessage, url, lineNumber, columnNumber, errorObject);
    }
    // Otherwise, Let the default handler run:
    return false;
  };

  errorTrackingEnabled = true;
}
