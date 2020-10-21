import { handleAppError } from "./app-errors.js";

// App statuses，相当于一个状态机，有以下12个状态码
// 没有加载过
export const NOT_LOADED = "NOT_LOADED";
// 加载源代码
export const LOADING_SOURCE_CODE = "LOADING_SOURCE_CODE";
// 没有启动
export const NOT_BOOTSTRAPPED = "NOT_BOOTSTRAPPED";
// 启动中
export const BOOTSTRAPPING = "BOOTSTRAPPING";
// 没有挂载
export const NOT_MOUNTED = "NOT_MOUNTED";
// 挂载中
export const MOUNTING = "MOUNTING";
// 挂载完毕
export const MOUNTED = "MOUNTED";
// 更新中
export const UPDATING = "UPDATING";
// 卸载中 UNMOUNTIN
export const UNMOUNTING = "UNMOUNTING";
// 没有加载中
export const UNLOADING = "UNLOADING";
// 加载失败
export const LOAD_ERROR = "LOAD_ERROR";
// 运行出错
export const SKIP_BECAUSE_BROKEN = "SKIP_BECAUSE_BROKEN";

// 当前应用是否已经挂载
export function isActive(app) {
  return app.status === MOUNTED;
}

// 返回boolean值，应用是否应该被激活
export function shouldBeActive(app) {
  try {
    return app.activeWhen(window.location);
  } catch (err) {
    handleAppError(err, app, SKIP_BECAUSE_BROKEN);
    return false;
  }
}

export function toName(app) {
  return app.name;
}

export function isParcel(appOrParcel) {
  return Boolean(appOrParcel.unmountThisParcel);
}

export function objectType(appOrParcel) {
  return isParcel(appOrParcel) ? "parcel" : "application";
}
