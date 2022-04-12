import { createContext } from "react";
import { PureSettings } from "./defaultSettings";

export type RouteContextType = {
  prefixCls?: string;
  siderWidth?: number;
  isChildrenLayout?: boolean;
  hasFooterToolbar?: boolean;
  hasFooter?: boolean;
  setHasFooterToolbar?: React.Dispatch<React.SetStateAction<boolean>>;
  pageTitleInfo?: {
    title: string;
    id: string;
    pageName: string;
  };
} & Partial<PureSettings>;

const routeContext: React.Context<RouteContextType> = createContext({});

export default routeContext;
