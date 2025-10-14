export const isObject = (value: unknown): value is object => {
  return typeof value === "object";
};

type Primitive = number | string | boolean | bigint | symbol;

export const isPrimitive = (value: unknown): value is Primitive => {
  const type = typeof value;
  return (
    type === "string" ||
    type === "number" ||
    type === "boolean" ||
    type === "bigint" ||
    type === "symbol"
  );
};
