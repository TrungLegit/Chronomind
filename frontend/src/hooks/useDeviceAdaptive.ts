"use client";

import { useState, useEffect } from "react";

export type DeviceType = "mobile-standard" | "fold-narrow" | "fold-unfolded" | "dual-screen" | "tablet" | "desktop";

export interface DeviceAdaptiveState {
  deviceType: DeviceType;
  isMobile: boolean;
  isFoldNarrow: boolean;
  isFoldUnfolded: boolean;
  isDualScreen: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  aspectRatio: number;
}

export const useDeviceAdaptive = (): DeviceAdaptiveState => {
  const [state, setState] = useState<DeviceAdaptiveState>({
    deviceType: "desktop",
    isMobile: false,
    isFoldNarrow: false,
    isFoldUnfolded: false,
    isDualScreen: false,
    isDesktop: true,
    screenWidth: typeof window !== "undefined" ? window.innerWidth : 1280,
    screenHeight: typeof window !== "undefined" ? window.innerHeight : 800,
    aspectRatio: 1.6,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = width / (height || 1);

      // Check CSS dual-screen spanning API (Surface Duo / Fold spanning)
      const isWindowSegments = typeof (window as any).getWindowSegments === "function";
      const hasDualSegments = isWindowSegments && (window as any).getWindowSegments().length === 2;

      let type: DeviceType = "desktop";

      if (hasDualSegments || (width >= 1050 && width <= 1130 && ratio >= 1.4 && ratio <= 1.65)) {
        // Dual screen (e.g. Surface Duo 1114x720)
        type = "dual-screen";
      } else if (width < 380 && height >= 680) {
        // Galaxy Z Fold outer cover screen (very narrow 23:9 or 21:9 aspect ratio, e.g. 344x904)
        type = "fold-narrow";
      } else if (width >= 640 && width <= 960 && ratio >= 0.75 && ratio <= 1.35) {
        // Galaxy Z Fold inner unfolded screen (nearly square ~10:9 / 4:3, e.g. 768x904)
        type = "fold-unfolded";
      } else if (width < 640) {
        // Standard iPhone / Android phone
        type = "mobile-standard";
      } else if (width >= 640 && width < 1024) {
        type = "tablet";
      } else {
        type = "desktop";
      }

      setState({
        deviceType: type,
        isMobile: type === "mobile-standard" || type === "fold-narrow",
        isFoldNarrow: type === "fold-narrow",
        isFoldUnfolded: type === "fold-unfolded",
        isDualScreen: type === "dual-screen",
        isDesktop: type === "desktop" || type === "tablet",
        screenWidth: width,
        screenHeight: height,
        aspectRatio: ratio,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return state;
};
