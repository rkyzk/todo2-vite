import { atom } from "recoil";
import { Breakpoints } from "../types/Breakpoints";

export const breakpointsState = atom<Breakpoints>({
  key: "breakpointsState",
  default: {
    base: "0em", // 0px
    sm: "38em", // ~480px. em is a relative unit and is dependant on the font-size.
    md: "48em", // ~768px
    lg: "62em", // ~992px
    xl: "80em", // ~1280px
  },
});
