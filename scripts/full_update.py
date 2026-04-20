import os
import shutil
import glob
import subprocess
import time
from datetime import datetime

# 설정 (경로 수정)
SOURCE_BASE_DIR = r"c:\Users\JEONG\.gemini\antigravity\scratch\CoupangShuttleTool"
TARGET_DIR = r"c:\Users\JEONG\.gemini\antigravity\scratch\coupang-shuttle-map-migration-test"
PUBLIC_DATA_DIR = os.path.join(TARGET_DIR, "public", "data")

def get_latest_shuttle_json():
    """CoupangShuttleTool 내의 날짜 폴더 중 가장 최신 shuttle_data.json을 찾음"""
    # 날짜 형식의 폴더들 찾기 (예: 20260420_2030)
    folders = glob.glob(os.path.join(SOURCE_BASE_DIR, "20*_*"))
    if not folders:
        return None
    
    latest_folder = max(folders, key=os.path.getmtime)
    
    # shuttle_data_*.json 패턴으로 파일 찾기
    json_files = glob.glob(os.path.join(latest_folder, "shuttle_data_*.json"))
    
    if json_files:
        # 그 중 가장 최근 파일을 반환
        return max(json_files, key=os.path.getmtime)
    return None

def run_command(cmd, cwd=None):
    print(f"Executing: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    print(result.stdout)
    return True

def main():
    print(f"--- Shuttle Data Auto Update Started ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ---")
    
    # 1. 최신 원본 찾기
    source_json = get_latest_shuttle_json()
    if not source_json:
        print("❌ CoupangShuttleTool에서 최신 shuttle_data.json을 찾을 수 없습니다.")
        return

    print(f"📂 최신 원본 발견: {source_json}")
    
    # 2. shuttle_update.json으로 복사
    update_path = os.path.join(PUBLIC_DATA_DIR, "shuttle_update.json")
    shutil.copy2(source_json, update_path)
    print(f"✅ {update_path} 복사 완료")
    
    # 3. 데이터 병합 (merger 실행)
    print("🔄 데이터 병합 중...")
    if not run_command("python scripts/shuttle_merger.py", cwd=TARGET_DIR):
        print("❌ 병합 실패")
        return
    
    # 4. Git Push
    print("🚀 GitHub 업로드 중...")
    
    # 변경 사항이 있는지 먼저 확인
    status = subprocess.run("git status --porcelain public/data/", shell=True, cwd=TARGET_DIR, capture_output=True, text=True)
    if not status.stdout.strip():
        print("ℹ️ 변경된 데이터가 없습니다. 업로드를 건너뜁니다.")
    else:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        commands = [
            "git add public/data/*.json",
            f'git commit -m "📝 Auto-update shuttle data: {timestamp}"',
            "git push origin main"
        ]
        
        for cmd in commands:
            if not run_command(cmd, cwd=TARGET_DIR):
                # 'nothing to commit' 메시지인 경우 에러가 아님
                break
    
    print("✨ 모든 작업이 완료되었습니다! 잠시 후 사이트에서 확인하세요.")

if __name__ == "__main__":
    main()
