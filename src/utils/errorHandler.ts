export function handleError(func: () => any) {
  try {
    return func();
  } catch (e) {
    return { error: e.toString() };
  }
}

export function getStatus(payload: any) {
  return payload.error === undefined ? 200 : 400;
}
