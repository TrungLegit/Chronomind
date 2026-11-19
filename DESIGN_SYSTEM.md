# CHRONOMIND DESIGN SYSTEM SPECIFICATION (v2.0)
> **Chuẩn thiết kế Giao diện Kỹ thuật Tối giản, Sắc sảo (Precision Engineering Aesthetic)**  
> *Được trích xuất từ nghiên cứu chuyên sâu: **Origin UI**, **GitHub Primer Primitives**, và **Tremor Labs**.*

---

## 1. Triết lý Thiết kế (Design Philosophy)

Mục tiêu của Chronomind là một công cụ lập kế hoạch kỹ thuật cho kỹ sư, nhà nghiên cứu và người xây dựng sản phẩm (Builders). Giao diện phải toát lên cảm giác **đo đạc chính xác, mật độ thông tin cao, sắc bén và tin cậy**, dứt khoát xóa bỏ hoàn toàn cảm giác "AI Vibe-coding" (vốn lạm dụng gradient tím/hồng, bo góc bong bóng và các khối thẻ sáo rỗng).

### Đối chiếu Vibe:
| Đặc tính | ❌ AI Vibe-Coding (Cũ / Tránh) | ✅ Precision Engineering (Mới / Chuẩn) |
|---|---|---|
| **Màu nền (Surface)** | Đen bệt (`#000`) hoặc xám tím đục | Phân tầng sắc độ lạnh trung tính (`#090d16` -> `#0e131f` -> `#161c2d`) |
| **Đường viền (Border)** | Mờ nhạt hoặc phát sáng neon (`box-shadow`) | Đường viền tóc 1px sắc mảnh (`hairline border`), độ mờ 8% - 15% |
| **Bo góc (Radius)** | Bo tròn quá đà (`rounded-2xl`, `rounded-3xl`) | Bo góc vi cơ học chuẩn (`rounded-md: 6px`, `rounded-lg: 8px`) |
| **Typography** | Font to, khoảng cách thưa, lạm dụng gradient | Phân cấp chặt chẽ, tiêu đề tracking âm (`-0.02em`), số liệu `tabular-nums` |
| **Bố cục (Layout)** | 3 thẻ đều nhau kèm emoji chung chung | Bố cục bất đối xứng công thái học (Bàn làm việc chính 70% + Thanh kiểm soát 30%) |

---

## 2. Bảng Màu & Hệ Thống Design Tokens (Primer & Origin UI Inspired)

### 2.1. Canvas & Surface Layers (Lớp nền theo độ sâu không gian)
Hệ thống sử dụng nguyên lý tương phản bề mặt của **GitHub Primer**, dùng độ sáng tối và viền hairline thay vì dùng bóng đổ dày:

```css
/* Nền chính toàn trang (Base Canvas) */
--canvas-default: #080b11;      /* Đen xanh ánh phiến thạch siêu sâu */
--canvas-subtle:  #0d111a;      /* Bề mặt panel, thanh bên, thanh điều hướng */
--canvas-inset:   #121824;      /* Khối chứa dữ liệu, ô nhập liệu, bảng WBS */
--canvas-elevated:#182030;      /* Popover, Modal dialog, Tooltip menu */

/* Viền phân tách (Hairline Borders) */
--border-default: rgba(255, 255, 255, 0.08); /* Viền chuẩn các thẻ & khung */
--border-subtle:  rgba(255, 255, 255, 0.04); /* Viền ngăn cách giữa các dòng */
--border-active:  rgba(255, 255, 255, 0.18); /* Trạng thái hover / focus */
--border-accent:  #2563eb;                    /* Đường biên kích hoạt chính */
```

### 2.2. Foreground & Typography (Độ tương phản chữ đạt chuẩn WCAG AAA)
```css
--fg-default:     #f1f5f9;      /* Chữ chính, tiêu đề (Slate 100) */
--fg-muted:       #94a3b8;      /* Nhãn thông số, mô tả phụ (Slate 400) */
--fg-subtle:      #64748b;      /* Placeholder, timestamp, icon phụ (Slate 500) */
--fg-disabled:    #334155;      /* Thành phần vô hiệu hóa */
```

### 2.3. Semantic Accents (Màu chức năng kiểm soát - Không dùng màu chói)
Các màu chức năng được áp dụng theo phong cách của **Tremor**: nền trong suốt nhẹ (alpha 8-12%) kết hợp viền mảnh và chữ tương phản cao:

```css
/* Thành công / Đã hoàn thành (Done / Active) */
--accent-success-bg:     rgba(16, 185, 129, 0.08);
--accent-success-border: rgba(16, 185, 129, 0.20);
--accent-success-fg:     #34d399;

/* Cảnh báo / Trễ hạn / Cần chú ý (Warning / Delayed) */
--accent-warning-bg:     rgba(245, 158, 11, 0.08);
--accent-warning-border: rgba(245, 158, 11, 0.22);
--accent-warning-fg:     #fbbf24;

/* Nguy hiểm / Lỗi nghiêm trọng (Critical / Blocked) */
--accent-danger-bg:      rgba(244, 63, 94, 0.08);
--accent-danger-border:  rgba(244, 63, 94, 0.22);
--accent-danger-fg:      #fb7185;

/* Nhận diện kỹ thuật / Milestone (Accent Blue) */
--accent-primary-bg:     #1d4ed8;
--accent-primary-hover:  #2563eb;
--accent-primary-fg:     #ffffff;
```

---

## 3. Quy Chuẩn Kích Thước & Tỷ Lệ (Spacing, Radius & Typography)

### 3.1. Tỷ lệ Bo góc (`border-radius`)
* **`rounded-md` (6px):** Dùng cho Button, Input, Select, Checkbox, Tag status, Badge.
* **`rounded-lg` (8px):** Dùng cho Card, Panel, Dialog popup, Accordion container.
* **Tuyệt đối cấm:** `rounded-2xl` (16px), `rounded-3xl` (24px) hoặc `rounded-full` trên các khối layout chính.

### 3.2. Typography & Font Pairing
* **Primary Sans (Geist Sans / Inter):** 
  - Tiêu đề Dashboard: `text-xl` hoặc `text-2xl font-semibold tracking-tight` (chữ đứng đắn, không in hoa bừa bãi).
  - Tiêu đề mục / Thẻ: `text-sm font-medium text-slate-100`.
  - Body text: `text-xs text-slate-400 leading-relaxed`.
  - Sub-labels / Metadata header: `text-[10px] font-semibold uppercase tracking-widest text-slate-500`.
* **Technical Mono (Geist Mono / JetBrains Mono):**
  - Bắt buộc áp dụng cho: Số giờ (`12.5h`), ngày tháng (`2026-11-20`), tỷ lệ phần trăm (`64%`), điểm số (`7.2/10`), Task ID (`#TSK-01`), và phím tắt (`⌘K`).
  - Sử dụng class `tabular-nums font-mono` để các con số thẳng hàng khi nhảy dữ liệu.

---

## 4. Các Quy Tắc Cấm (Anti-Patterns / Prohibitions)

1. **CẤM Gradient sặc sỡ:** Không sử dụng `bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500` trên button, text hoặc viền thẻ. Button chính chỉ dùng màu đơn sắc vững chãi (`bg-blue-600 hover:bg-blue-500`).
2. **CẤM Card đồng dạng sáo rỗng:** Không dựng 3-4 card có kích thước bằng nhau chằn chặn chỉ để đặt 1 emoji to đùng và vài dòng chữ ngắn ngủi ("Feature 1", "Feature 2", "Feature 3"). Mọi khối giao diện phải chứa dữ liệu thực thi có giá trị.
3. **CẤM Bóng đổ nhòe (Fuzzy Drop-Shadows):** Không dùng `shadow-2xl shadow-indigo-500/30`. Chỉ sử dụng viền mảnh `1px border border-white/[0.08]` và vi bóng siêu nhỏ `shadow-xs shadow-black/40` của Origin UI.
4. **CẤM Padding lãng phí:** Không dùng `p-8` hay `py-16` cho các container kỹ thuật. Chiều cao của input/button chuẩn mực là `h-8` (32px) hoặc `h-9` (36px); padding thẻ chuẩn là `p-4` hoặc `p-5`.

---

## 5. Code Snippets Chuẩn (Production-Ready Templates)

### 5.1. Origin UI Standard Input & Button
```tsx
// Ô nhập liệu kỹ thuật (Technical Form Input)
<div className="relative">
  <input
    type="text"
    placeholder="Nhập mục tiêu dự án..."
    className="h-9 w-full rounded-md border border-white/[0.08] bg-[#121824] px-3 text-xs text-slate-100 placeholder:text-slate-500 shadow-xs transition-colors focus:border-blue-500/80 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
  />
  <kbd className="pointer-events-none absolute right-2.5 top-2 inline-flex h-5 items-center rounded border border-white/[0.08] bg-white/[0.03] px-1.5 font-mono text-[10px] text-slate-400">
    ⌘K
  </kbd>
</div>

// Nút bấm thực thi chính (Primary Action Button)
<button className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-3.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-50">
  <Play className="h-3.5 w-3.5 fill-current" />
  <span>Kick-off Dự Án</span>
</button>
```

### 5.2. Tremor-style Metric & WBS Phase Card
```tsx
// Thẻ chỉ số & Phân cấp dữ liệu (Tremor Metric Card)
<div className="rounded-lg border border-white/[0.08] bg-[#0d111a] p-4">
  <div className="flex items-center justify-between">
    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
      Độ khó kỹ thuật (AI Feasibility)
    </span>
    <span className="inline-flex items-center rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber-400">
      HIGH RISK
    </span>
  </div>
  <div className="mt-2 flex items-baseline gap-2">
    <span className="font-mono text-2xl font-bold tracking-tight text-slate-100 tabular-nums">
      7.5
    </span>
    <span className="font-mono text-xs text-slate-500">/ 10.0</span>
  </div>
  <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
    Điểm nghẽn nằm ở khâu giao tiếp bus I2C và chu kỳ re-spin PCB 7 ngày.
  </p>
</div>
```

### 5.3. Primer Asymmetric Workbench Layout (70/30 Grid)
```tsx
// Bố cục phân chia màn hình làm việc: Không chia 3 card đều nhau
<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
  {/* Khu vực thao tác chính (Roadmap & WBS Timeline) - Chiếm 8 cột (67%) */}
  <section className="lg:col-span-8 rounded-lg border border-white/[0.08] bg-[#0d111a] p-5">
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
      <h3 className="text-sm font-medium text-slate-100">Work Breakdown Structure (WBS)</h3>
      <span className="font-mono text-xs text-slate-400 tabular-nums">14 / 22 Tasks Done</span>
    </div>
    {/* Danh sách Task dense & hairline border ở đây */}
  </section>

  {/* Thanh thanh tra kỹ thuật (Inspector & Side Controls) - Chiếm 4 cột (33%) */}
  <aside className="lg:col-span-4 space-y-4">
    {/* Box Checklist chuẩn bị tiền dự án */}
    <div className="rounded-lg border border-white/[0.08] bg-[#0d111a] p-4">
      <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Checklist Chuẩn Bị
      </h4>
      {/* Items */}
    </div>
  </aside>
</div>
```

---

## 6. Hướng Dẫn Áp Dụng Tiếp Theo Cho Frontend Chronomind

Khi được phê duyệt:
1. Cập nhật `frontend/src/app/globals.css` để đưa toàn bộ bảng màu Surface/Border của Primer vào theme.
2. Tinh chỉnh `ProjectWizardModal`, `Navbar`, `TimelineRoadmap` và `FeasibilityCard` theo chuẩn viền mảnh 1px (`border-white/[0.08]`), bo góc `rounded-md`/`rounded-lg`, loại bỏ toàn bộ gradient tím/hồng.
3. Chuyển đổi toàn bộ hiển thị số giờ, ngày tháng, điểm số sang font đơn cách `font-mono tabular-nums`.
