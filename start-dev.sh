#!/usr/bin/env bash
echo "==================================================="
echo "  CHRONOMIND - AI Dynamic Project & Deadline Planner"
echo "==================================================="
echo ""

# 1. Kiểm tra cập nhật từ GitHub
echo "[1/3] Đang kiểm tra bản cập nhật từ GitHub..."
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

# 2. Khởi động Backend
echo "[2/3] Khởi động Backend (FastAPI tại http://localhost:8000)..."
(cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000) &

# 3. Khởi động Frontend
echo "[3/3] Khởi động Frontend (Next.js tại http://localhost:3000)..."
(cd frontend && npm run dev) &

echo ""
echo "==================================================="
echo "  CHRONOMIND ĐÃ KHỞI CHẠY HOÀN TẤT!"
echo "  - Giao diện Web: http://localhost:3000"
echo "  - Swagger API Docs: http://localhost:8000/docs"
echo "==================================================="
echo ""
wait
