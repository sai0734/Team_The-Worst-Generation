import sys
from pathlib import Path

# main.py / app 패키지는 ai-server 루트에서 절대 임포트("from app.routers import ...")를
# 쓰므로, 테스트 실행 시에도 그 루트가 sys.path에 있어야 한다.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
