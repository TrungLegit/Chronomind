#!/usr/bin/env bash
# Chuyển về đúng thư mục chứa script
cd "$(dirname "$0")"

echo "=================================================================="
echo "  CHRONOMIND - AI Dynamic Project & Deadline Planner"
echo "=================================================================="
echo ""

# 1. Kiểm tra môi trường hệ thống
echo "[1/5] Kiểm tra môi trường hệ thống (Python & Node.js)..."
if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
    echo "[LỖI] Không tìm thấy Python 3 trên hệ thống! Vui lòng cài đặt Python 3.10+."
    exit 1
fi

PYTHON_CMD="python3"
if ! command -v python3 &>/dev/null; then
    PYTHON_CMD="python"
fi

if ! command -v npm &>/dev/null; then
    echo "[LỖI] Không tìm thấy Node.js / npm trên hệ thống! Vui lòng cài đặt Node.js."
    exit 1
fi
echo "[OK] Python và Node.js đã sẵn sàng."
echo ""

# 2. Kiểm tra cập nhật từ GitHub
echo "[2/5] Kiểm tra cập nhật từ GitHub..."
if command -v git &>/dev/null; then
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
        echo "[Notice] Không thể kết nối đến GitHub (Chế độ Offline). Tiếp tục..."
        echo ""
    fi
fi

# 3. Tự động khởi tạo Backend venv nếu máy mới
if [ ! -f "backend/.env" ]; then
    echo "[Setup] Tạo file cấu hình backend/.env từ .env.example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
    else
        touch backend/.env
    fi
fi

if [ ! -d "backend/venv" ]; then
    echo ""
    echo "=========================================================="
    echo "  [LẦN ĐẦU CHẠY] Phát hiện chưa có môi trường Backend venv!"
    echo "  Đang tự động khởi tạo Python Virtual Environment..."
    echo "=========================================================="
    $PYTHON_CMD -m venv backend/venv
    if [ $? -ne 0 ]; then
        echo "[LỖI] Không thể tạo virtualenv. Vui lòng kiểm tra lại Python."
        exit 1
    fi
    echo "[Setup] Đang cài đặt thư viện backend (requirements.txt)..."
    ./backend/venv/bin/pip install --upgrade pip --quiet
    ./backend/venv/bin/pip install --prefer-binary -r backend/requirements.txt
    if [ $? -ne 0 ]; then
        echo "[LỖI] Cài đặt dependencies backend thất bại."
        exit 1
    fi
    echo "[OK] Đã cài đặt xong môi trường Backend!"
    echo ""
fi

# 4. Tự động chạy npm install nếu máy mới
if [ ! -d "frontend/node_modules" ]; then
    echo ""
    echo "=========================================================="
    echo "  [LẦN ĐẦU CHẠY] Phát hiện chưa có thư viện Frontend (node_modules)!"
    echo "  Đang tự động chạy 'npm install'..."
    echo "=========================================================="
    (cd frontend && npm install)
    if [ $? -ne 0 ]; then
        echo "[LỖI] npm install thất bại. Vui lòng kiểm tra kết nối mạng."
        exit 1
    fi
    echo "[OK] Đã cài đặt xong thư viện Frontend!"
    echo ""
fi

# 5. Lấy địa chỉ IP nội bộ
LOCAL_IP="localhost"
if command -v ip &>/dev/null; then
    LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}')
elif command -v ifconfig &>/dev/null; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
fi
LOCAL_IP=${LOCAL_IP:-localhost}

# 6. Khởi động Backend & Frontend
echo "[3/5] Khởi động Backend (FastAPI tại http://0.0.0.0:8000)..."
(cd backend && ./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
BACKEND_PID=$!

echo "[4/5] Khởi động Frontend (Next.js tại http://0.0.0.0:3000)..."
(cd frontend && npm run dev -- -H 0.0.0.0 -p 3000) &
FRONTEND_PID=$!

# 7. Tự động mở trình duyệt
echo "[5/5] Đang mở trình duyệt Web..."
sleep 3
if which xdg-open > /dev/null; then
    xdg-open http://localhost:3000 &
elif which open > /dev/null; then
    open http://localhost:3000 &
fi

echo ""
echo "=================================================================="
echo "  CHRONOMIND ĐÃ KHỞI CHẠY THÀNH CÔNG!"
echo "=================================================================="
echo "  * Trên Máy tính này:       http://localhost:3000"
if [ "$LOCAL_IP" != "localhost" ]; then
echo "  * Trên Điện thoại (Wi-Fi): http://$LOCAL_IP:3000"
fi
echo "  * Swagger API Docs:        http://localhost:8000/docs"
echo "=================================================================="
echo "Nhấn Ctrl+C để dừng cả 2 máy chủ."
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
