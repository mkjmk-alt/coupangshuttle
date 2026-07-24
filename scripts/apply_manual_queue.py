import datetime
import json
import os
import sys
import uuid
from pathlib import Path


MAX_CHANGE_LOG_ENTRIES = 100
MAX_STOP_CHANGES = 500


def load_json(path, fallback):
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path, value):
    temp_path = path.with_suffix(path.suffix + ".tmp")
    with temp_path.open("w", encoding="utf-8", newline="\n") as file:
        json.dump(value, file, ensure_ascii=False, indent=2)
        file.write("\n")
    os.replace(temp_path, path)


def route_stops(data, fc, shift, route):
    return (
        data.get(fc, {})
        .get("shifts", {})
        .get(shift, {})
        .get(route, [])
    )


def set_route_stops(data, fc, shift, route, stops):
    fc_data = data.setdefault(fc, {"code": fc, "center": {}, "shifts": {}})
    shifts = fc_data.setdefault("shifts", {})
    routes = shifts.setdefault(shift, {})
    routes[route] = stops


def stop_key(stop):
    return f"{stop.get('Order', '')}\0{stop.get('Name', '')}"


def changed_fields(before, after):
    fields = set((before or {}).keys()) | set((after or {}).keys())
    return sorted(
        field
        for field in fields
        if (before or {}).get(field) != (after or {}).get(field)
    )


def compare_stops(fc, shift, route, before_stops, after_stops):
    before_by_key = {stop_key(stop): stop for stop in before_stops}
    after_by_key = {stop_key(stop): stop for stop in after_stops}
    changes = []

    for key in before_by_key.keys() | after_by_key.keys():
        before = before_by_key.get(key)
        after = after_by_key.get(key)
        if before == after:
            continue
        if before is None:
            change = "added"
        elif after is None:
            change = "removed"
        else:
            change = "changed"
        changes.append({
            "fc": fc,
            "shift": shift,
            "route": route,
            "change": change,
            "changedFields": changed_fields(before, after),
            "before": before,
            "after": after,
        })

    return sorted(
        changes,
        key=lambda item: int(
            (item.get("after") or item.get("before") or {}).get("Order", 10**9)
        ),
    )


def build_change_log_entry(timestamp, route_changes, stop_changes):
    stats = {
        "centersAdded": 0,
        "centersRemoved": 0,
        "centersChanged": 0,
        "routesAdded": sum(change["change"] == "added" for change in route_changes),
        "routesRemoved": sum(change["change"] == "removed" for change in route_changes),
        "routesChanged": sum(change["change"] == "changed" for change in route_changes),
        "stopsAdded": sum(change["change"] == "added" for change in stop_changes),
        "stopsRemoved": sum(change["change"] == "removed" for change in stop_changes),
        "stopsChanged": sum(change["change"] == "changed" for change in stop_changes),
    }
    route_count = stats["routesAdded"] + stats["routesRemoved"] + stats["routesChanged"]
    stop_count = stats["stopsAdded"] + stats["stopsRemoved"] + stats["stopsChanged"]
    summary_parts = []
    if route_count:
        summary_parts.append(f"노선 {route_count}개")
    if stop_count:
        summary_parts.append(f"정류장 {stop_count}개")

    entry = {
        "id": str(uuid.uuid4()),
        "timestamp": timestamp,
        "source": "manual",
        "action": "manual_save",
        "summary": (
            f"{' · '.join(summary_parts)} 변경"
            if summary_parts
            else "데이터 변경 없음"
        ),
        "stats": stats,
        "affectedCenters": sorted({change["fc"] for change in route_changes}),
        "affectedRoutes": route_changes[:100],
    }
    if stop_changes:
        entry["stopChanges"] = stop_changes[:MAX_STOP_CHANGES]
    return entry


def apply_queue(root):
    queue_dir = root / "manual_queue"
    queue_files = sorted(queue_dir.glob("*.json")) if queue_dir.exists() else []
    if not queue_files:
        print("No manual editor queue files found.")
        return 0

    data_path = root / "public/data/shuttle_data.json"
    manual_path = root / "public/data/shuttle_manual.json"
    meta_path = root / "public/data/shuttle_meta.json"
    changelog_path = root / "public/data/shuttle_changelog.json"

    data = load_json(data_path, {})
    manual = load_json(manual_path, {})
    metadata = load_json(meta_path, {})
    change_log = load_json(changelog_path, {"entries": []})
    existing_entries = change_log.get("entries", [])
    if not isinstance(existing_entries, list):
        existing_entries = []

    new_entries = []
    latest_timestamp = None

    for queue_file in queue_files:
        payload = load_json(queue_file, {})
        changes = payload.get("changes")
        timestamp = payload.get("timestamp")
        if not isinstance(changes, list) or not changes:
            raise ValueError(f"Invalid queue changes: {queue_file.name}")
        if not isinstance(timestamp, str) or not timestamp:
            timestamp = datetime.datetime.now(
                datetime.timezone(datetime.timedelta(hours=9))
            ).strftime("%Y-%m-%d %H:%M")

        route_changes = []
        stop_changes = []
        for patch in changes:
            if not isinstance(patch, dict):
                raise ValueError(f"Invalid route patch: {queue_file.name}")
            fc = patch.get("fc")
            shift = patch.get("shift")
            route = patch.get("route")
            if not all(isinstance(value, str) and value for value in (fc, shift, route)):
                raise ValueError(f"Invalid route identity: {queue_file.name}")

            before_stops = route_stops(data, fc, shift, route)
            if patch.get("source") == "manual":
                after_stops = route_stops(manual, fc, shift, route)
            else:
                after_stops = patch.get("stops")
            if not isinstance(after_stops, list):
                raise ValueError(f"Invalid route stops: {queue_file.name}")
            if before_stops == after_stops:
                continue

            route_change = (
                "added"
                if not before_stops and after_stops
                else "removed"
                if before_stops and not after_stops
                else "changed"
            )
            route_changes.append({
                "fc": fc,
                "shift": shift,
                "route": route,
                "change": route_change,
            })
            stop_changes.extend(
                compare_stops(fc, shift, route, before_stops, after_stops)
            )
            set_route_stops(data, fc, shift, route, after_stops)
            set_route_stops(manual, fc, shift, route, after_stops)

        if route_changes:
            new_entries.append(
                build_change_log_entry(timestamp, route_changes, stop_changes)
            )
            latest_timestamp = timestamp
        queue_file.unlink()

    if new_entries:
        previous_last_updated = metadata.get("lastUpdated")
        metadata["lastUpdated"] = latest_timestamp
        metadata.setdefault(
            "lastAutoDeploy",
            previous_last_updated,
        )
        metadata["lastManualChange"] = latest_timestamp
        change_log["entries"] = [
            *reversed(new_entries),
            *existing_entries,
        ][:MAX_CHANGE_LOG_ENTRIES]
        write_json(data_path, data)
        write_json(manual_path, manual)
        write_json(meta_path, metadata)
        write_json(changelog_path, change_log)

    print(
        f"Processed {len(queue_files)} queue file(s), "
        f"created {len(new_entries)} change log entry(ies)."
    )
    return len(new_entries)


if __name__ == "__main__":
    project_root = (
        Path(sys.argv[1]).resolve()
        if len(sys.argv) > 1
        else Path(__file__).resolve().parents[1]
    )
    apply_queue(project_root)
