import glob
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime


TARGET_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SOURCE_DIR = os.path.abspath(
    os.path.join(TARGET_DIR, "..", "CoupangShuttleTool")
)
SOURCE_BASE_DIR = os.environ.get(
    "COUPANG_SHUTTLE_SOURCE_DIR",
    DEFAULT_SOURCE_DIR,
)
PUBLIC_DATA_DIR = os.path.join(TARGET_DIR, "public", "data")
DEPLOY_FILES = [
    "public/data/shuttle_base.json",
    "public/data/shuttle_data.json",
    "public/data/shuttle_meta.json",
    "public/data/shuttle_update.json",
]


class UpdateError(RuntimeError):
    pass


def get_latest_shuttle_json():
    """Find the newest extracted map JSON in CoupangShuttleTool."""
    folders = glob.glob(os.path.join(SOURCE_BASE_DIR, "20*_*"))
    if not folders:
        return None

    candidates = []
    for folder in folders:
        candidates.extend(
            glob.glob(os.path.join(folder, "shuttle_data_*.json"))
        )
    if not candidates:
        return None
    return max(candidates, key=os.path.getmtime)


def run_command(args, cwd=TARGET_DIR, check=True):
    print(f"Executing: {subprocess.list2cmdline(args)}", flush=True)
    result = subprocess.run(
        args,
        cwd=cwd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.stdout.strip():
        print(result.stdout.strip(), flush=True)
    if result.stderr.strip():
        print(result.stderr.strip(), flush=True)
    if check and result.returncode != 0:
        raise UpdateError(
            f"명령이 실패했습니다({result.returncode}): "
            f"{subprocess.list2cmdline(args)}"
        )
    return result


def validate_metadata():
    meta_path = os.path.join(PUBLIC_DATA_DIR, "shuttle_meta.json")
    try:
        with open(meta_path, "r", encoding="utf-8") as meta_file:
            last_updated = json.load(meta_file).get("lastUpdated")
    except (OSError, ValueError) as exc:
        raise UpdateError(f"메타데이터를 읽을 수 없습니다: {exc}") from exc

    if not last_updated:
        raise UpdateError("shuttle_meta.json에 lastUpdated가 없습니다.")
    return last_updated


def main():
    started_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"--- Shuttle Data Auto Update Started ({started_at}) ---", flush=True)

    try:
        source_json = get_latest_shuttle_json()
        if not source_json:
            raise UpdateError(
                "CoupangShuttleTool에서 최신 shuttle_data_*.json을 "
                "찾을 수 없습니다."
            )
        print(f"Latest source: {source_json}", flush=True)

        update_path = os.path.join(PUBLIC_DATA_DIR, "shuttle_update.json")
        shutil.copy2(source_json, update_path)
        print(f"Copied update data: {update_path}", flush=True)

        merger_path = os.path.join(TARGET_DIR, "scripts", "shuttle_merger.py")
        run_command([sys.executable, merger_path])
        last_updated = validate_metadata()
        print(f"Metadata timestamp: {last_updated}", flush=True)

        status = run_command(
            ["git", "status", "--porcelain", "--", *DEPLOY_FILES],
        )
        if not status.stdout.strip():
            commit_sha = run_command(
                ["git", "rev-parse", "HEAD"],
            ).stdout.strip()
            print("No deployable data changes were found.", flush=True)
            print(f"DEPLOY_COMMIT_SHA={commit_sha}", flush=True)
            return 0

        run_command(["git", "add", "--", *DEPLOY_FILES])
        staged = run_command(
            ["git", "diff", "--cached", "--quiet", "--", *DEPLOY_FILES],
            check=False,
        )
        if staged.returncode not in (0, 1):
            raise UpdateError("스테이징된 변경 사항을 확인할 수 없습니다.")
        if staged.returncode == 0:
            raise UpdateError("커밋할 데이터 변경 사항이 없습니다.")

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        run_command(
            [
                "git",
                "commit",
                "--only",
                "-m",
                f"Auto-update shuttle data: {timestamp}",
                "--",
                *DEPLOY_FILES,
            ],
        )
        commit_sha = run_command(
            ["git", "rev-parse", "HEAD"],
        ).stdout.strip()
        run_command(["git", "push", "origin", "main"])

        print(f"DEPLOY_COMMIT_SHA={commit_sha}", flush=True)
        print(
            "GitHub push completed. Waiting for the caller to verify "
            "Cloudflare Pages.",
            flush=True,
        )
        return 0
    except (OSError, shutil.Error, UpdateError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
