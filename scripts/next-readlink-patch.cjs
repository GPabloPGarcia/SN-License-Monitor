const fs = require("node:fs");

function normalizeReadlinkError(error) {
  if (error && error.code === "EISDIR") {
    error.code = "EINVAL";
  }

  return error;
}

const readlinkSync = fs.readlinkSync;
fs.readlinkSync = function patchedReadlinkSync(...args) {
  try {
    return readlinkSync.apply(this, args);
  } catch (error) {
    throw normalizeReadlinkError(error);
  }
};

const readlink = fs.readlink;
fs.readlink = function patchedReadlink(...args) {
  const callback = args.at(-1);

  if (typeof callback === "function") {
    args[args.length - 1] = function patchedReadlinkCallback(error, ...rest) {
      callback(normalizeReadlinkError(error), ...rest);
    };
  }

  return readlink.apply(this, args);
};

if (fs.promises?.readlink) {
  const promisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function patchedPromisesReadlink(...args) {
    try {
      return await promisesReadlink.apply(this, args);
    } catch (error) {
      throw normalizeReadlinkError(error);
    }
  };
}
