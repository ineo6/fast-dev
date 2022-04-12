export type ContentWidth = "Fluid" | "Fixed";

export interface RenderSetting {
  headerRender?: false;
  footerRender?: false;
  menuRender?: false;
  menuHeaderRender?: false;
}
export interface PureSettings {
  /**
   * 设置为 false，在 layout 中只展示 pageName，而不是 pageName - title
   *
   * @name Layout 的 title，也会显示在浏览器标签上
   */
  title?: string | false;
  /** @name 主色，需要配合 umi 使用 */
  primaryColor?: string;
  config: Config;
}

export interface Config {}

export type ProSettings = PureSettings & RenderSetting;

const defaultSettings: ProSettings = {
  primaryColor: "#1890ff",
  config: {
    server: {
      enabled: false
    },
    proxy: {
      enabled: false
    },
    plugin: {
      node: {}
    }
  }
};

export default defaultSettings;
