function parseSortValue(value: string): number | null {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;

  const parsedDate = Date.parse(value);
  return Number.isNaN(parsedDate) ? null : parsedDate;
}

export function sortByDate<T>(
  items: T[],
  getValue: (item: T) => string | undefined,
): T[] {
  return [...items].sort((left, right) => {
    const leftValue = getValue(left);
    const rightValue = getValue(right);

    if (!leftValue && !rightValue) return 0;
    if (!leftValue) return 1;
    if (!rightValue) return -1;

    const leftParsed = parseSortValue(leftValue);
    const rightParsed = parseSortValue(rightValue);

    if (leftParsed !== null && rightParsed !== null) return leftParsed - rightParsed;
    if (leftParsed !== null) return -1;
    if (rightParsed !== null) return 1;
    return leftValue.localeCompare(rightValue);
  });
}
