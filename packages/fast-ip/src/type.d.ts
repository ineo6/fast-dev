export interface IDnsMap {
  [key: string]: any;
}

export interface IConfig {
  notify: Function;
  dnsMap: IDnsMap;
  enabled: Boolean;
  interval?: number;
}
