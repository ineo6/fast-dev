import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ipcRenderer } from "electron";
import { baiduAnalyticsRenderer } from "../../common/bridge/tongji/analysis.js";

export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    console.log("location", location);

    baiduAnalyticsRenderer(
      ipcRenderer,
      "b5c803909a507c386524b8d8cd517434",
      _hmt => {
        _hmt.push(["_trackPageview", location.pathname]);
      }
    );
  }, [location]);
}
