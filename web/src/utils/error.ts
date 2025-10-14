import {AxiosError} from "axios";
import {isObject, isPrimitive} from "./typeGuards";

export const getErrorMessage = (err: unknown) => {
  return err instanceof AxiosError
    ? getErrorMessageFromResponse(err)
    : getErrorMessageFromObject(err);
};

const getErrorMessageFromObject = (err: unknown) => {
  return err && isObject(err) && "message" in err
    ? err.message
    : isPrimitive(err)
    ? err
    : "unknown";
};
const getErrorMessageFromResponse = (error: AxiosError) => {
  return error.cause || error.message;
};
