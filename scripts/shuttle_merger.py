import datetime
import json
import os
import shutil
import uuid

BASE_FILE = 'public/data/shuttle_base.json'
UPDATE_FILE = 'public/data/shuttle_update.json'
MANUAL_FILE = 'public/data/shuttle_manual.json'
OUTPUT_FILE = 'public/data/shuttle_data.json'
META_FILE = 'public/data/shuttle_meta.json'
CHANGELOG_FILE = 'public/data/shuttle_changelog.json'
MAX_CHANGE_LOG_ENTRIES = 100

def load_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_stop_key(stop):
    # Unique key for a stop within a route
    return f"{stop.get('Order')}_{stop.get('Name')}"

def empty_change_stats():
    return {
        "centersAdded": 0,
        "centersRemoved": 0,
        "centersChanged": 0,
        "routesAdded": 0,
        "routesRemoved": 0,
        "routesChanged": 0,
        "stopsAdded": 0,
        "stopsRemoved": 0,
        "stopsChanged": 0,
    }

def count_stop_changes(before_stops, after_stops, stats):
    before_by_key = {get_stop_key(stop): stop for stop in before_stops}
    after_by_key = {get_stop_key(stop): stop for stop in after_stops}

    for key in set(before_by_key) | set(after_by_key):
        before_stop = before_by_key.get(key)
        after_stop = after_by_key.get(key)
        if before_stop is None:
            stats["stopsAdded"] += 1
        elif after_stop is None:
            stats["stopsRemoved"] += 1
        elif before_stop != after_stop:
            stats["stopsChanged"] += 1

def summarize_data_changes(before, after):
    stats = empty_change_stats()
    affected_centers = set()
    affected_routes = []

    for fc in set(before) | set(after):
        before_fc = before.get(fc)
        after_fc = after.get(fc)

        if before_fc is None:
            stats["centersAdded"] += 1
            affected_centers.add(fc)
        elif after_fc is None:
            stats["centersRemoved"] += 1
            affected_centers.add(fc)
        elif before_fc.get("center", {}) != after_fc.get("center", {}):
            stats["centersChanged"] += 1
            affected_centers.add(fc)

        before_shifts = (before_fc or {}).get("shifts", {})
        after_shifts = (after_fc or {}).get("shifts", {})
        for shift in set(before_shifts) | set(after_shifts):
            before_routes = before_shifts.get(shift, {})
            after_routes = after_shifts.get(shift, {})

            for route in set(before_routes) | set(after_routes):
                before_exists = route in before_routes
                after_exists = route in after_routes
                before_stops = before_routes.get(route, [])
                after_stops = after_routes.get(route, [])
                change = None

                if not before_exists and after_exists:
                    stats["routesAdded"] += 1
                    change = "added"
                elif before_exists and not after_exists:
                    stats["routesRemoved"] += 1
                    change = "removed"
                elif before_stops != after_stops:
                    stats["routesChanged"] += 1
                    change = "changed"

                if change:
                    affected_centers.add(fc)
                    if len(affected_routes) < 100:
                        affected_routes.append({
                            "fc": fc,
                            "shift": shift,
                            "route": route,
                            "change": change,
                        })
                    count_stop_changes(before_stops, after_stops, stats)

    center_count = (
        stats["centersAdded"]
        + stats["centersRemoved"]
        + stats["centersChanged"]
    )
    route_count = (
        stats["routesAdded"]
        + stats["routesRemoved"]
        + stats["routesChanged"]
    )
    stop_count = (
        stats["stopsAdded"]
        + stats["stopsRemoved"]
        + stats["stopsChanged"]
    )
    summary_parts = []
    if center_count:
        summary_parts.append(f"센터 {center_count}개")
    if route_count:
        summary_parts.append(f"노선 {route_count}개")
    if stop_count:
        summary_parts.append(f"정류장 {stop_count}개")

    return {
        "stats": stats,
        "affectedCenters": sorted(affected_centers),
        "affectedRoutes": affected_routes,
        "summary": (
            f"{' · '.join(summary_parts)} 변경"
            if summary_parts
            else "데이터 변경 없음"
        ),
    }

def append_change_log(timestamp, before, after):
    changes = summarize_data_changes(before, after)
    change_log = load_json(CHANGELOG_FILE)
    if not isinstance(change_log, dict):
        change_log = {}
    entries = change_log.get("entries", [])
    if not isinstance(entries, list):
        entries = []

    entry = {
        "id": str(uuid.uuid4()),
        "timestamp": timestamp,
        "source": "automatic",
        "action": "auto_deploy",
        "summary": changes["summary"],
        "stats": changes["stats"],
        "affectedCenters": changes["affectedCenters"],
        "affectedRoutes": changes["affectedRoutes"],
    }
    change_log["entries"] = [entry, *entries][:MAX_CHANGE_LOG_ENTRIES]

    with open(CHANGELOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(change_log, f, ensure_ascii=False, indent=2)

    return entry

def merge_stops(base_stops, update_stops, manual_stops):
    base_dict = {get_stop_key(s): s for s in base_stops}
    manual_dict = {get_stop_key(s): s for s in manual_stops}
    
    final_stops = []
    for stop in update_stops:
        key = get_stop_key(stop)
        base_match = base_dict.get(key)
        manual_match = manual_dict.get(key)
        
        # If stop changed officially, take official update
        if base_match != stop:
            final_stops.append(stop)
        # If stop official data is same, take manual override if exists
        elif manual_match:
            final_stops.append(manual_match)
        # Otherwise use current official stop
        else:
            final_stops.append(stop)
            
    return final_stops

def merge_data():
    base = load_json(BASE_FILE)
    update = load_json(UPDATE_FILE)
    manual = load_json(MANUAL_FILE)
    current = load_json(OUTPUT_FILE)
    
    if not update:
        print("Update file is empty or missing. Aborting.")
        return
        
    final_data = {}
    
    for fc_code, update_fc in update.items():
        base_fc = base.get(fc_code, {})
        manual_fc = manual.get(fc_code, {})
        
        # Center info
        update_center = update_fc.get('center', {})
        base_center = base_fc.get('center', {})
        manual_center = manual_fc.get('center', {})
        
        final_center = update_center if update_center != base_center else (manual_center or update_center)
        
        final_shifts = {}
        update_shifts = update_fc.get('shifts', {})
        base_shifts = base_fc.get('shifts', {})
        manual_shifts = manual_fc.get('shifts', {})
        
        for shift_name, update_routes in update_shifts.items():
            final_routes = {}
            base_routes = base_shifts.get(shift_name, {})
            manual_routes = manual_shifts.get(shift_name, {})
            
            for route_name, update_stops in update_routes.items():
                base_stops = base_routes.get(route_name, [])
                manual_stops = manual_routes.get(route_name, [])
                
                final_routes[route_name] = merge_stops(base_stops, update_stops, manual_stops)
                
            final_shifts[shift_name] = final_routes
            
        final_data[fc_code] = {
            "code": fc_code,
            "center": final_center,
            "shifts": final_shifts
        }
        
    kst = datetime.timezone(datetime.timedelta(hours=9))
    timestamp = datetime.datetime.now(kst).strftime("%Y-%m-%d %H:%M")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    change_log_entry = append_change_log(timestamp, current, final_data)
    print(f"Change log recorded: {change_log_entry['summary']}")

    # 다음 업데이트에서 "공식 변경"과 "수동 보정"을 정확히 구분할 수 있도록
    # 이번 공식 추출본을 새로운 비교 기준으로 보관한다.
    shutil.copy2(UPDATE_FILE, BASE_FILE)
    
    # Update shuttle_meta.json with the current automatic-deployment timestamp.
    # Preserve the latest manual-change timestamp so the two histories remain separate.
    metadata = load_json(META_FILE)
    if not isinstance(metadata, dict):
        metadata = {}
    metadata["lastUpdated"] = timestamp
    metadata["lastAutoDeploy"] = timestamp
    metadata.setdefault("lastManualChange", None)
    with open(META_FILE, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    print(f"Metadata timestamp updated to: {timestamp}")
        
    print(f"Merge successful! Saved to {OUTPUT_FILE}")
    print(f"Official baseline updated: {BASE_FILE}")

if __name__ == "__main__":
    merge_data()
