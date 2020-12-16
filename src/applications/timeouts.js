import { assign } from "../utils/assign";
import { getProps } from "../lifecycles/prop.helpers";
import { objectType, toName } from "./app.helpers";
import { formatErrorMessage } from "./app-errors";
import Root from "../../examples/micro-frontend/packages/app1/src/root.component";

const defaultWarningMillis = 1000;

const globalTimeoutConfig = {
  /**
   * 这个生命周期函数会在应用第一次挂载前执行一次。
   */
  bootstrap: {
    millis: 4000,
    dieOnTimeout: false,
    warningMillis: defaultWarningMillis,
  },
  /**
   * 每当应用的activity function返回真值，但该应用处于未挂载状态时，挂载的生命周期函数就会被调用。
   * 调用时，函数会根据URL来确定当前被激活的路由，创建DOM元素、监听DOM事件等以向用户呈现渲染的内容。
   * 任何子路由的改变（如hashchange或popstate等）不会再次触发mount，需要各应用自行处理。
   */
  mount: {
    millis: 3000,
    dieOnTimeout: false,
    warningMillis: defaultWarningMillis,
  },
  /**
   * 每当应用的activity function返回假值，但该应用已挂载时，卸载的生命周期函数就会被调用。
   * 卸载函数被调用时，会清理在挂载应用时被创建的DOM元素、事件监听、内存、全局变量和消息订阅等。
   */
  unmount: {
    millis: 3000,
    dieOnTimeout: false,
    warningMillis: defaultWarningMillis,
  },
  /**
   * “移除”生命周期函数的实现是可选的，它只有在unloadApplication被调用时才会触发。
   * 如果一个已注册的应用没有实现这个生命周期函数，则假设这个应用无需被移除。
   * 移除的目的是各应用在移除之前执行部分逻辑，一旦应用被移除，
   * 它的状态将会变成NOT_LOADED，下次激活时会被重新初始化。
   * 移除函数的设计动机是对所有注册的应用实现“热下载”，不过在其他场景中也非常有用，
   * 比如想要重新初始化一个应用，且在重新初始化之前执行一些逻辑操作时。
   */
  unload: {
    millis: 3000,
    dieOnTimeout: false,
    warningMillis: defaultWarningMillis,
  },
  update: {
    millis: 3000,
    dieOnTimeout: false,
    warningMillis: defaultWarningMillis,
  },
};

// 全局配置初始化超时时间。
export function setBootstrapMaxTime(time, dieOnTimeout, warningMillis) {
  if (typeof time !== "number" || time <= 0) {
    throw Error(
      formatErrorMessage(
        16,
        __DEV__ &&
          `bootstrap max time must be a positive integer number of milliseconds`
      )
    );
  }

  globalTimeoutConfig.bootstrap = {
    millis: time,
    dieOnTimeout,
    warningMillis: warningMillis || defaultWarningMillis,
  };
}

// 全局配置挂载超时时间。
export function setMountMaxTime(time, dieOnTimeout, warningMillis) {
  if (typeof time !== "number" || time <= 0) {
    throw Error(
      formatErrorMessage(
        17,
        __DEV__ &&
          `mount max time must be a positive integer number of milliseconds`
      )
    );
  }

  globalTimeoutConfig.mount = {
    millis: time,
    dieOnTimeout,
    warningMillis: warningMillis || defaultWarningMillis,
  };
}

// 全局配置卸载超时时间。
export function setUnmountMaxTime(time, dieOnTimeout, warningMillis) {
  if (typeof time !== "number" || time <= 0) {
    throw Error(
      formatErrorMessage(
        18,
        __DEV__ &&
          `unmount max time must be a positive integer number of milliseconds`
      )
    );
  }

  globalTimeoutConfig.unmount = {
    millis: time,
    dieOnTimeout,
    warningMillis: warningMillis || defaultWarningMillis,
  };
}

// 全局配置移除超时时间。
export function setUnloadMaxTime(time, dieOnTimeout, warningMillis) {
  if (typeof time !== "number" || time <= 0) {
    throw Error(
      formatErrorMessage(
        19,
        __DEV__ &&
          `unload max time must be a positive integer number of milliseconds`
      )
    );
  }

  globalTimeoutConfig.unload = {
    millis: time,
    dieOnTimeout,
    warningMillis: warningMillis || defaultWarningMillis,
  };
}

/**
 * 合理的时间，即生命周期函数合理的执行时间
 * 在合理的时间内执行生命周期函数，并将函数的执行结果resolve出去
 * @param {*} appOrParcel => app
 * @param {*} lifecycle => 生命周期函数名
 */
export function reasonableTime(appOrParcel, lifecycle) {
  // 应用的超时配置
  const timeoutConfig = appOrParcel.timeouts[lifecycle];
  // 超时警告
  const warningPeriod = timeoutConfig.warningMillis;
  const type = objectType(appOrParcel);

  return new Promise((resolve, reject) => {
    let finished = false;
    let errored = false;

    // 是在执行生命周期函数时像子应用传递的props，所以之前执行loadApp传递props不会到子应用，
    // 子应用里一般会注册生命周期函数，并传递props，这里就是传递props的地方。
    // 子应用的写法大致如下:
    // const reactLifecycles = singleSpaReact({
    //   React,
    //   ReactDOM,
    //   rootComponent: Root,
    //   domElementGetter
    // });
    //
    // export function bootstrap(props) {
    //   return reactLifecycles.bootstrap(props);
    // }
    //
    // export function mount(props) {
    //   return reactLifecycles.mount(props);
    // }
    //
    // export function unmount(props) {
    //   return reactLifecycles.unmount(props);
    // }
    /**
     * 通过getProps(appOrParcel)处理后，子应用的结构props大致如下
     * const props = {
     * mainStore: Store {Symbol(mobx did run lazy initializers): true, Symbol(mobx administration): ObservableObjectAdministration, changeState: ƒ}
     * mountParcel: ƒ ()
     * name: "app1"
     * singleSpa: {…}
     * } =  getProps(appOrParcel)
     * @type {{singleSpa: {}, name: string}}
     *
     */

    appOrParcel[lifecycle](getProps(appOrParcel))
      .then((val) => {
        finished = true;
        resolve(val);
      })
      .catch((val) => {
        finished = true;
        reject(val);
      });

    // 超时的一些提示信息
    setTimeout(() => maybeTimingOut(1), warningPeriod);
    setTimeout(() => maybeTimingOut(true), timeoutConfig.millis);

    const errMsg = formatErrorMessage(
      31,
      __DEV__ &&
        `Lifecycle function ${lifecycle} for ${type} ${toName(
          appOrParcel
        )} lifecycle did not resolve or reject for ${timeoutConfig.millis} ms.`,
      lifecycle,
      type,
      toName(appOrParcel),
      timeoutConfig.millis
    );

    function maybeTimingOut(shouldError) {
      // 既没有then，也没有catch说明是可能超时了
      if (!finished) {
        if (shouldError === true) {
          errored = true;
          if (timeoutConfig.dieOnTimeout) {
            reject(Error(errMsg));
          } else {
            console.error(errMsg);
            //don't resolve or reject, we're waiting this one out
          }
        } else if (!errored) {
          const numWarnings = shouldError;
          const numMillis = numWarnings * warningPeriod;
          console.warn(errMsg);
          if (numMillis + warningPeriod < timeoutConfig.millis) {
            setTimeout(() => maybeTimingOut(numWarnings + 1), warningPeriod);
          }
        }
      }
    }
  });
}

export function ensureValidAppTimeouts(timeouts) {
  const result = {};

  for (let key in globalTimeoutConfig) {
    result[key] = assign(
      {},
      globalTimeoutConfig[key],
      (timeouts && timeouts[key]) || {}
    );
  }

  return result;
}
