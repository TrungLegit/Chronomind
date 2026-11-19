#!/usr/bin/env bash
# Chuyển về đúng thư mục chứa script
cd "$(dirname "$0")"

echo "==================================================="
echo "  CHRONOMIND - AI Dynamic Project & Deadline Planner"
echo "==================================================="
echo ""

# 1. Kiểm tra cập nhật từ GitHub
echo "[1/4] Đang kiểm tra bản cập nhật từ GitHub..."
if git fetch origin main --quiet 2>/dev/null; then
    BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo "0")
    if [ "$BEHIND" -gt 0 ]; then
        echo ""
        echo "**********************************************************"
        echo "  [THÔNG BÁO] Phát hiện có $BEHIND bản cập nhật mới trên GitHub!"
        echo "**********************************************************"
        echo ""
        read -p "Bạn có muốn tự động cập nhật (git pull) ngay không? [Y/n]: " PULL_CHOICE
        PULL_CHOICE=${PULL_CHOICE:-Y}
        if [[ "$PULL_CHOICE" =~ ^[Yy]$ ]]; then
            echo ""
            echo "[Update] Đang tải mã nguồn mới nhất về..."
            git pull origin main
            echo "[OK] Cập nhật hoàn tất!"
            echo ""
        else
            echo "[Skip] Bỏ qua cập nhật. Khởi chạy phiên bản hiện tại..."
            echo ""
        fi
    else
        echo "[OK] Bạn đang ở phiên bản mới nhất trên GitHub."
        echo ""
    fi
else
    echo "[Notice] Không thể kết nối đến GitHub (Chế độ Offline). Tiếp tục khởi chạy local..."
    echo ""
fi

# 2. Kiểm tra file cấu hình .env
if [ ! -f "backend/.env" ]; then
    echo "[Setup] Đang tạo file cấu hình backend/.env từ .env.example..."
    cp backend/.env.example backend/.env
fi

# 3. Khởi động Backend
echo "[2/4] Khởi động Backend (FastAPI tại http://localhost:8000)..."
(cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

# 4. Khởi động Frontend
echo "[3/4] Khởi động Frontend (Next.js tại http://localhost:3000)..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# 5. Tự động mở trình duyệt
echo "[4/4] Đang mở trình duyệt Web..."
sleep 3
if which xdg-open > /dev/null; then
    xdg-open http://localhost:3000 &
elif which open > /dev/null; then
    open http://localhost:3000 &
fi

echo ""
echo "==================================================="
echo "  CHRONOMIND ĐÃ KHỞI CHẠY HOÀN TẤT!"
echo "  - Giao diện Web: http://localhost:3000"
echo "  - Swagger API Docs: http://localhost:8000/docs"
echo "==================================================="
echo "Nhấn Ctrl+C để dừng cả 2 máy chủ."
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
