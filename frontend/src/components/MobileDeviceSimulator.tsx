"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  X,
  Layers,
  Sparkles,
  Wifi,
  Battery,
  Maximize2,
} from "lucide-react";
import { api } from "@/services/api";

export interface DeviceSpec {
  id: string;
  name: string;
  brand: "Apple iOS" | "Google Android" | "Foldable & Duo";
  width: number;
  height: number;
  aspectRatio: string;
  screenSize: string;
  cameraType: "dynamic-island" | "notch" | "punch-hole" | "bezel" | "duo-hinge" | "tablet";
  cornerRoundness: string;
  description: string;
}

export const POPULAR_DEVICES: DeviceSpec[] = [
  // 🍏 Apple iOS
  {
    id: "iphone-16-pro-max",
    name: "iPhone 16 / 15 Pro Max",
    brand: "Apple iOS",
    width: 430,
    height: 932,
    aspectRatio: "19.5:9",
    screenSize: '6.9"',
    cameraType: "dynamic-island",
    cornerRoundness: "rounded-[52px]",
    description: "Màn hình flagship Apple lớn nhất thị trường hiện nay",
  },
  {
    id: "iphone-15",
    name: "iPhone 16 / 15 / 14 Pro",
    brand: "Apple iOS",
    width: 393,
    height: 852,
    aspectRatio: "19.5:9",
    screenSize: '6.1"',
    cameraType: "dynamic-island",
    cornerRoundness: "rounded-[48px]",
    description: "Chuẩn kích thước iPhone phổ biến nhất hiện nay",
  },
  {
    id: "iphone-13",
    name: "iPhone 14 / 13 / 12 (Notch)",
    brand: "Apple iOS",
    width: 390,
    height: 844,
    aspectRatio: "19.5:9",
    screenSize: '6.1"',
    cameraType: "notch",
    cornerRoundness: "rounded-[44px]",
    description: "Tai thỏ truyền thống của dòng iPhone 12/13/14",
  },
  {
    id: "iphone-se",
    name: "iPhone SE (Gen 3) / iPhone 8",
    brand: "Apple iOS",
    width: 375,
    height: 667,
    aspectRatio: "16:9",
    screenSize: '4.7"',
    cameraType: "bezel",
    cornerRoundness: "rounded-[36px]",
    description: "Tỉ lệ 16:9 cổ điển với viền trên dưới & nút Home",
  },
  {
    id: "ipad-mini",
    name: "iPad Mini (Gen 6)",
    brand: "Apple iOS",
    width: 768,
    height: 1024,
    aspectRatio: "4:3",
    screenSize: '8.3"',
    cameraType: "tablet",
    cornerRoundness: "rounded-[32px]",
    description: "Tablet iPad cỡ nhỏ",
  },

  // 🤖 Google Android
  {
    id: "galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    brand: "Google Android",
    width: 412,
    height: 915,
    aspectRatio: "20:9",
    screenSize: '6.8"',
    cameraType: "punch-hole",
    cornerRoundness: "rounded-[24px]", // Bo góc vuông đặc trưng của dòng Ultra Note
    description: "Flagship Android hàng đầu với góc vuông nam tính",
  },
  {
    id: "pixel-9-pro",
    name: "Google Pixel 9 / 8 Pro",
    brand: "Google Android",
    width: 412,
    height: 892,
    aspectRatio: "20:9",
    screenSize: '6.7"',
    cameraType: "punch-hole",
    cornerRoundness: "rounded-[44px]",
    description: "Chuẩn hiển thị Google Pixel thuần khiết",
  },
  {
    id: "xiaomi-14",
    name: "Xiaomi 14 / Redmi Note",
    brand: "Google Android",
    width: 393,
    height: 873,
    aspectRatio: "20:9",
    screenSize: '6.36"',
    cameraType: "punch-hole",
    cornerRoundness: "rounded-[38px]",
    description: "Dòng điện thoại Xiaomi / Redmi rất phổ biến tại VN",
  },
  {
    id: "android-standard",
    name: "Android Phổ Thông (Galaxy A, Oppo)",
    brand: "Google Android",
    width: 360,
    height: 800,
    aspectRatio: "20:9",
    screenSize: '6.5"',
    cameraType: "punch-hole",
    cornerRoundness: "rounded-[36px]",
    description: "Kích thước Viewport phổ biến nhất trên Android toàn cầu",
  },
  {
    id: "android-compact",
    name: "Android Compact Giá Rẻ",
    brand: "Google Android",
    width: 360,
    height: 640,
    aspectRatio: "16:9",
    screenSize: '5.0"',
    cameraType: "bezel",
    cornerRoundness: "rounded-[28px]",
    description: "Màn hình 16:9 nhỏ gọn của các máy Android đời cũ/giá rẻ",
  },

  // 🔄 Foldables & Dual-Screen
  {
    id: "z-fold-outer",
    name: "Galaxy Z Fold 5 (Màn hình ngoài)",
    brand: "Foldable & Duo",
    width: 344,
    height: 904,
    aspectRatio: "23.1:9",
    screenSize: '6.2"',
    cameraType: "punch-hole",
    cornerRoundness: "rounded-[38px]",
    description: "Tỉ lệ siêu hẹp và dài — Thử thách khắc nghiệt cho UI",
  },
  {
    id: "z-fold-inner",
    name: "Galaxy Z Fold 5 (Màn hình mở gập)",
    brand: "Foldable & Duo",
    width: 768,
    height: 904,
    aspectRatio: "10.6:9",
    screenSize: '7.6"',
    cameraType: "punch-hole",
    cornerRoundness: "rounded-[32px]",
    description: "Màn hình vuông lớn khi mở gập của dòng Galaxy Z Fold",
  },
  {
    id: "z-flip",
    name: "Galaxy Z Flip 5 (Mở dọc)",
    brand: "Foldable & Duo",
    width: 412,
    height: 1004,
    aspectRatio: "22:9",
    screenSize: '6.7"',
    cameraType: "punch-hole",
    cornerRoundness: "rounded-[40px]",
    description: "Màn hình gập vỏ sò tỉ lệ siêu dài 22:9",
  },
  {
    id: "surface-duo",
    name: "Surface Duo / iPhone Duo (Màn hình kép)",
    brand: "Foldable & Duo",
    width: 1114,
    height: 720,
    aspectRatio: "2x 3:2",
    screenSize: '8.1"',
    cameraType: "duo-hinge",
    cornerRoundness: "rounded-[28px]",
    description: "2 màn hình độc lập phân tách bởi bản lề ở giữa",
  },
];

interface MobileDeviceSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDeviceSimulator: React.FC<MobileDeviceSimulatorProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceSpec>(POPULAR_DEVICES[0]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [scale, setScale] = useState<number>(0.75);
  const [activeTab, setActiveTab] = useState<"simulator" | "qrcode">("simulator");
  const [brandFilter, setBrandFilter] = useState<string>("ALL");
  const [networkInfo, setNetworkInfo] = useState<{
    local_ip: string;
    mobile_url: string;
  }>({
    local_ip: "localhost",
    mobile_url: "http://localhost:3000",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getNetworkInfo().then((res) => {
        setNetworkInfo({
          local_ip: res.local_ip,
          mobile_url: res.mobile_url,
        });
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentWidth = isLandscape ? selectedDevice.height : selectedDevice.width;
  const currentHeight = isLandscape ? selectedDevice.width : selectedDevice.height;

  const filteredDevices =
    brandFilter === "ALL"
      ? POPULAR_DEVICES
      : POPULAR_DEVICES.filter((d) => d.brand === brandFilter);

  const copyUrl = () => {
    navigator.clipboard.writeText(networkInfo.mobile_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    networkInfo.mobile_url
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f172a]/90 backdrop-blur-md text-white select-none">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-white/10 bg-[#1e293b]/90 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b57d0] text-white shadow-sm">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight">
                Mobile Display Simulator
              </h2>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                iOS &amp; Android &amp; Duo
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Kiểm tra tỷ lệ và trải nghiệm responsive trên tất cả dòng máy
            </p>
          </div>
        </div>

        {/* View mode Tab: Simulator vs QR Connect */}
        <div className="flex items-center gap-1 rounded-full bg-slate-800 p-1 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
              activeTab === "simulator"
                ? "bg-[#0b57d0] text-white font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Khung Giả Lập</span>
          </button>
          <button
            onClick={() => setActiveTab("qrcode")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
              activeTab === "qrcode"
                ? "bg-emerald-600 text-white font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Quét QR trên ĐT thật</span>
          </button>
        </div>

        {/* Actions & Close */}
        <div className="flex items-center gap-2">
          {activeTab === "simulator" && (
            <>
              {/* Rotate button */}
              <button
                onClick={() => setIsLandscape(!isLandscape)}
                title="Xoay dọc / xoay ngang màn hình"
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  isLandscape
                    ? "bg-amber-500/20 border-amber-400 text-amber-300"
                    : "border-white/10 hover:bg-white/10 text-slate-300"
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isLandscape ? "Ngang (Landscape)" : "Dọc (Portrait)"}</span>
              </button>

              {/* Zoom Scales */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-full px-2 py-1 border border-white/10 text-xs text-slate-300">
                <button
                  onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                  title="Thu nhỏ"
                  className="p-1 hover:text-white"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-[11px] w-9 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale(Math.min(1.0, scale + 0.1))}
                  title="Phóng to"
                  className="p-1 hover:text-white"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      {activeTab === "simulator" ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Device Selection Drawer */}
          <div className="w-full md:w-80 border-r border-white/10 bg-[#1e293b]/70 flex flex-col shrink-0">
            {/* Category Filter Tabs */}
            <div className="flex border-b border-white/10 p-2 gap-1 text-[11px] font-medium overflow-x-auto">
              <button
                onClick={() => setBrandFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  brandFilter === "ALL" ? "bg-white/20 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Tất cả ({POPULAR_DEVICES.length})
              </button>
              <button
                onClick={() => setBrandFilter("Apple iOS")}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  brandFilter === "Apple iOS" ? "bg-[#0b57d0] text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                🍏 Apple iOS
              </button>
              <button
                onClick={() => setBrandFilter("Google Android")}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  brandFilter === "Google Android" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                🤖 Android
              </button>
              <button
                onClick={() => setBrandFilter("Foldable & Duo")}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  brandFilter === "Foldable & Duo" ? "bg-amber-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                🔄 Fold &amp; Duo
              </button>
            </div>

            {/* Device list */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
              {filteredDevices.map((dev) => {
                const isSelected = selectedDevice.id === dev.id;
                return (
                  <div
                    key={dev.id}
                    onClick={() => setSelectedDevice(dev)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#0b57d0]/30 border border-[#0b57d0] text-white"
                        : "hover:bg-white/5 text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{dev.name}</span>
                      <span className="text-[10px] font-mono rounded bg-white/10 px-1.5 py-0.5 text-slate-300">
                        {dev.aspectRatio}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{dev.width} × {dev.height} px ({dev.screenSize})</span>
                      <span className="text-[10px] text-slate-500">{dev.brand}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                      {dev.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Current Spec Summary Footer */}
            <div className="p-3 border-t border-white/10 bg-slate-900/60 text-xs space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Thiết bị đang xem:</span>
                <strong className="text-white">{selectedDevice.name}</strong>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Kích thước Viewport:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {currentWidth} × {currentHeight} px
                </span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Tỉ lệ hiển thị:</span>
                <span className="font-mono text-amber-300">{selectedDevice.aspectRatio}</span>
              </div>
            </div>
          </div>

          {/* Center Stage: Phone Frame Render */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#0b0f19] relative">
            {/* The Outer Device Shell */}
            <div
              style={{
                width: `${currentWidth * scale + 24}px`,
                height: `${currentHeight * scale + 24}px`,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              className={`relative bg-neutral-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-[6px] border-neutral-700/80 p-2 flex flex-col overflow-hidden ${selectedDevice.cornerRoundness}`}
            >
              {/* Device Screen Area */}
              <div
                style={{
                  width: `${currentWidth * scale}px`,
                  height: `${currentHeight * scale}px`,
                }}
                className="relative bg-white rounded-[inherit] overflow-hidden flex flex-col shadow-inner"
              >
                {/* Simulated Mobile Status Bar */}
                <div className="h-6 w-full bg-white text-black flex items-center justify-between px-4 text-[10px] font-semibold shrink-0 select-none z-20 border-b border-gray-100">
                  <span>9:41</span>

                  {/* Cutout: Dynamic Island or Notch or Punch hole */}
                  {selectedDevice.cameraType === "dynamic-island" && (
                    <div className="h-4 w-24 bg-black rounded-full mx-auto" />
                  )}
                  {selectedDevice.cameraType === "notch" && (
                    <div className="h-4 w-32 bg-black rounded-b-xl mx-auto -mt-1" />
                  )}
                  {selectedDevice.cameraType === "punch-hole" && (
                    <div className="h-3 w-3 bg-black rounded-full mx-auto" />
                  )}

                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Wifi className="h-3 w-3" />
                    <span className="text-[9px] font-bold">5G</span>
                    <Battery className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Surface Duo Central Hinge (if duo device) */}
                {selectedDevice.cameraType === "duo-hinge" && (
                  <div
                    style={{ left: `${(currentWidth * scale) / 2 - 8}px` }}
                    className="absolute top-0 bottom-0 w-4 bg-neutral-900 border-x border-neutral-700 z-30 shadow-xl pointer-events-none flex items-center justify-center"
                  >
                    <div className="h-24 w-1 bg-neutral-600 rounded-full" />
                  </div>
                )}

                {/* Scaled Web Content IFrame */}
                <div className="flex-1 w-full h-full relative overflow-hidden bg-[#f8fafd]">
                  <iframe
                    src="/"
                    title="Chronomind Mobile View"
                    style={{
                      width: `${currentWidth}px`,
                      height: `${currentHeight}px`,
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                    }}
                    className="border-none absolute top-0 left-0"
                  />
                </div>

                {/* Home Indicator Bar (iOS style) */}
                <div className="h-4 w-full bg-white flex items-center justify-center shrink-0 z-20">
                  <div className="h-1 w-28 bg-gray-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: CONNECT REAL PHONE VIA WI-FI & QR CODE */
        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          <div className="max-w-xl w-full bg-[#1e293b] rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <QrCode className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-white">
                Mở Chronomind Trực Tiếp Trên Điện Thoại Thật
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                Không cần cài app! Chỉ cần điện thoại của bạn kết nối cùng mạng Wi-Fi với máy tính này là có thể truy cập mượt mà.
              </p>
            </div>

            {/* QR Code Canvas Card */}
            <div className="bg-white p-5 rounded-2xl inline-block shadow-lg mx-auto">
              <img
                src={qrImageUrl}
                alt="QR Code to connect mobile"
                className="w-48 h-48 mx-auto"
              />
              <span className="text-[11px] font-semibold text-gray-500 mt-2 block">
                Quét bằng Camera iPhone / Android
              </span>
            </div>

            {/* URL Box & Copy */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-3 rounded-xl border border-white/10 max-w-md mx-auto">
              <span className="font-mono text-xs text-emerald-400 truncate pl-1">
                {networkInfo.mobile_url}
              </span>
              <button
                onClick={copyUrl}
                className="flex items-center gap-1 text-xs font-semibold bg-[#0b57d0] hover:bg-[#0842a0] text-white px-3 py-1.5 rounded-lg transition-all shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Đã chép" : "Sao chép Link"}</span>
              </button>
            </div>

            {/* Tips for Native App Experience (PWA) */}
            <div className="text-left bg-slate-800/60 rounded-2xl p-4 border border-white/5 space-y-2 text-xs text-slate-300">
              <strong className="text-white block font-semibold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Mẹo dùng như ứng dụng Native toàn màn hình:</span>
              </strong>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                <li>
                  <strong className="text-slate-200">Trên iPhone (Safari):</strong> Bấm nút <em>Chia sẻ (Biểu tượng mũi tên lên)</em> &gt; chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.
                </li>
                <li>
                  <strong className="text-slate-200">Trên Android (Chrome):</strong> Bấm vào <em>Menu 3 chấm</em> ở góc trên &gt; chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
