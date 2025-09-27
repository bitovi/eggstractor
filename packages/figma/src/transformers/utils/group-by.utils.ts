export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (groups, item) => {
      const k = key(item);
      if (!groups[k]) groups[k] = [];
      groups[k].push(item);
      return groups;
    },
    {} as Record<string, T[]>,
  );
}
