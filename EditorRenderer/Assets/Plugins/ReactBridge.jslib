mergeInto(LibraryManager.library, {
  SendObjectSelected: function(ptr) {
    var objectName = UTF8ToString(ptr);
    var event = new CustomEvent('unityObjectSelected', { detail: objectName });
    window.dispatchEvent(event);
  },
  SendObjectTransformChanged: function(ptr) {
    var payload = UTF8ToString(ptr);
    var detail = payload;
    try {
      detail = JSON.parse(payload);
    } catch (e) {
      // Keep raw string as fallback for malformed payloads.
    }
    var event = new CustomEvent('unityObjectTransformChanged', { detail: detail });
    window.dispatchEvent(event);
  },
  SendShowMessage: function(ptr) {
    var msg = UTF8ToString(ptr);
    var event = new CustomEvent('unityShowMessage', { detail: msg });
    window.dispatchEvent(event);
  },
  SendGotoSceneRequested: function(ptr) {
    var sceneName = UTF8ToString(ptr);
    var event = new CustomEvent('unityGotoSceneRequested', { detail: sceneName });
    window.dispatchEvent(event);
  }
});
