import {
  UPDATING,
  MOUNTED,
  SKIP_BECAUSE_BROKEN,
  toName,
} from "../applications/app.helpers.js";
import {
  transformErr,
  formatErrorMessage,
} from "../applications/app-errors.js";
import { reasonableTime } from "../applications/timeouts.js";

/**
 * 这里的做两件事
 * 1是状态流转，从 MOUNTED -> UPDATING -> MOUNTED
 * 2是更新数据，找到当前app,然后给当前应用的 update 生命周期传递数据
 * @param parcel
 * @returns {Promise<T>}
 */
export function toUpdatePromise(parcel) {
  return Promise.resolve().then(() => {
    if (parcel.status !== MOUNTED) {
      throw Error(
        formatErrorMessage(
          32,
          __DEV__ &&
            `Cannot update parcel '${toName(
              parcel
            )}' because it is not mounted`,
          toName(parcel)
        )
      );
    }

    parcel.status = UPDATING;

    return reasonableTime(parcel, "update")
      .then(() => {
        parcel.status = MOUNTED;
        return parcel;
      })
      .catch((err) => {
        throw transformErr(err, parcel, SKIP_BECAUSE_BROKEN);
      });
  });
}
