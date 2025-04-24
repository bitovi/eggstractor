import { toKebabCase } from "./string.utils";

export function groupBy<T>(
  arr: T[],
  key: (item: T) => string
): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const rawKey = key(item);
    const k = toKebabCase(rawKey); // 💡 Apply camelCase here
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}
