export function handleError(func: () => any) {
  try {
    return func();
  } catch (e) {
    return { error: e.toString() };
  }
}
