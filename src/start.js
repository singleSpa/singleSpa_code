import { reroute } from "./navigation/reroute.js";
import { formatErrorMessage } from "./applications/app-errors.js";
import { setUrlRerouteOnly } from "./navigation/navigation-events.js";
import { isInBrowser } from "./utils/runtime-environment.js";

let started = false;

/**
 * https://zh-hans.single-spa.js.org/docs/api#start
 * 调用start之前，应用会被加载，但不会初始化、挂载和卸载，有了start可以更好的控制应用的性能
 * 必须在你single spa的配置中调用！在调用 start 之前, 应用会被加载,
 * 但不会初始化，挂载或卸载。
 * start 的原因是让你更好的控制你单页应用的性能。
 * 举个栗子，你想立即声明已经注册过的应用（开始下载那些激活应用的代码），
 * 但是实际上直到初始化AJAX（或许去获取用户的登录信息）请求完成之前不会挂载它们 。
 * @param {*} opts
 */
export function start(opts) {
  started = true;
  if (opts && opts.urlRerouteOnly) {
    setUrlRerouteOnly(opts.urlRerouteOnly);
  }
  if (isInBrowser) {
    reroute(); // 启动应用
  }
}

export function isStarted() {
  return started;
}

if (isInBrowser) {
  // registerApplication之后如果一直没有调用start，则在5000ms后给出警告提示
  setTimeout(() => {
    if (!started) {
      console.warn(
        formatErrorMessage(
          1,
          __DEV__ &&
            `singleSpa.start() has not been called, 5000ms after single-spa was loaded. Before start() is called, apps can be declared and loaded, but not bootstrapped or mounted.`
        )
      );
    }
  }, 5000);
}
