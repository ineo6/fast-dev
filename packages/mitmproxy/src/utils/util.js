export function fireError(e) {
  if (process.send) {
    process.send({ type: "error", event: e });
  }
}

export function fireStatus(status) {
  if (process.send) {
    process.send({ type: "status", event: status });
  }
}
