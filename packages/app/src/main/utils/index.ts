export function generateHTTPProxyUrl(httpPort: number) {
  return `http://127.0.0.1:${httpPort}`;
}

export function generateSocksProxyUrl(socksPort: number) {
  return `socks5://127.0.0.1:${socksPort}`;
}
