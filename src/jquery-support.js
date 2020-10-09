import { routingEventsListeningTo } from "./navigation/navigation-events.js";

let hasInitialized = false;

/**
 * jQuery使用 event delegation
 * 所以 single-spa 必须给每个jQuery版本一个patch（补丁）。
 * single-spa 会试着自动寻找 window.jQuery 或 window.$。
 * 如果页面中有多个版本的jQuery存在或jQuery被绑定到多个全局变量，请调用这个的方法。
 * @param jQuery
 */
export function ensureJQuerySupport(jQuery = window.jQuery) {
  if (!jQuery) {
    if (window.$ && window.$.fn && window.$.fn.jquery) {
      jQuery = window.$;
    }
  }

  if (jQuery && !hasInitialized) {
    const originalJQueryOn = jQuery.fn.on;
    const originalJQueryOff = jQuery.fn.off;

    jQuery.fn.on = function (eventString, fn) {
      return captureRoutingEvents.call(
        this,
        originalJQueryOn,
        window.addEventListener,
        eventString,
        fn,
        arguments
      );
    };

    jQuery.fn.off = function (eventString, fn) {
      return captureRoutingEvents.call(
        this,
        originalJQueryOff,
        window.removeEventListener,
        eventString,
        fn,
        arguments
      );
    };

    hasInitialized = true;
  }
}

function captureRoutingEvents(
  originalJQueryFunction,
  nativeFunctionToCall,
  eventString,
  fn,
  originalArgs
) {
  if (typeof eventString !== "string") {
    return originalJQueryFunction.apply(this, originalArgs);
  }

  const eventNames = eventString.split(/\s+/);
  eventNames.forEach((eventName) => {
    if (routingEventsListeningTo.indexOf(eventName) >= 0) {
      nativeFunctionToCall(eventName, fn);
      eventString = eventString.replace(eventName, "");
    }
  });

  if (eventString.trim() === "") {
    return this;
  } else {
    return originalJQueryFunction.apply(this, originalArgs);
  }
}
