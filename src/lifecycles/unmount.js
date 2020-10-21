import {
  UNMOUNTING,
  NOT_MOUNTED,
  MOUNTED,
  SKIP_BECAUSE_BROKEN,
} from "../applications/app.helpers.js";
import { handleAppError, transformErr } from "../applications/app-errors.js";
import { reasonableTime } from "../applications/timeouts.js";

/**
 * 执行了状态上的更改
 * 执行unmount生命周期函数
 * @param {*} appOrParcel => app
 * @param {*} hardFail => 索引
 */
export function toUnmountPromise(appOrParcel, hardFail) {
  return Promise.resolve().then(() => {
    // 只卸载已挂载的应用
    if (appOrParcel.status !== MOUNTED) {
      return appOrParcel;
    }
    // 更改状态
    appOrParcel.status = UNMOUNTING;

    // 有关parcels的一些处理，没使用过parcels，所以unmountChildrenParcels = []
    const unmountChildrenParcels = Object.keys(
      appOrParcel.parcels
    ).map((parcelId) => appOrParcel.parcels[parcelId].unmountThisParcel());

    let parcelError;

    return (
      Promise.all(unmountChildrenParcels)
        // 在合理的时间范围内执行unmount生命周期函数
        /**
         * then的第二个参数和catch捕获错误信息的时候会就近原则，
         * 如果是promise内部报错，reject抛出错误后，
         * then的第二个参数和catch方法都存在的情况下，
         * 只有then的第二个参数能捕获到，如果then的第二个参数不存在，
         * 则catch方法会捕获到
         *
         * 即：如果unmountAppOrParcel报错了，那就再执行一次 unmountAppOrParcel
         */
        .then(unmountAppOrParcel, (parcelError) => {
          // There is a parcel unmount error
          return unmountAppOrParcel().then(() => {
            // Unmounting the app/parcel succeeded, but unmounting its children parcels did not
            const parentError = Error(parcelError.message);
            if (hardFail) {
              throw transformErr(parentError, appOrParcel, SKIP_BECAUSE_BROKEN);
            } else {
              handleAppError(parentError, appOrParcel, SKIP_BECAUSE_BROKEN);
            }
          });
        })
        .then(() => appOrParcel)
    );

    // 这里执行了，reasonableTime，我们已经看过这个函数了，其实就是修改生命周期的对应的props的
    // 修改完props最终再来一个 NOT_MOUNTED
    function unmountAppOrParcel() {
      // We always try to unmount the appOrParcel, even if the children parcels failed to unmount.
      return reasonableTime(appOrParcel, "unmount")
        .then(() => {
          // The appOrParcel needs to stay in a broken status if its children parcels fail to unmount
          if (!parcelError) {
            appOrParcel.status = NOT_MOUNTED;
          }
        })
        .catch((err) => {
          if (hardFail) {
            throw transformErr(err, appOrParcel, SKIP_BECAUSE_BROKEN);
          } else {
            handleAppError(err, appOrParcel, SKIP_BECAUSE_BROKEN);
          }
        });
    }
  });
}
