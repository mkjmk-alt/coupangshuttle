import json
import os
import shutil

BASE_FILE = 'public/data/shuttle_base.json'
UPDATE_FILE = 'public/data/shuttle_update.json'
MANUAL_FILE = 'public/data/shuttle_manual.json'
OUTPUT_FILE = 'public/data/shuttle_data.json'
META_FILE = 'public/data/shuttle_meta.json'

def load_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_stop_key(stop):
    # Unique key for a stop within a route
    return f"{stop.get('Order')}_{stop.get('Name')}"

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
        
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    # 다음 업데이트에서 "공식 변경"과 "수동 보정"을 정확히 구분할 수 있도록
    # 이번 공식 추출본을 새로운 비교 기준으로 보관한다.
    shutil.copy2(UPDATE_FILE, BASE_FILE)
    
    # Update shuttle_meta.json with the current automatic-deployment timestamp.
    # Preserve the latest manual-change timestamp so the two histories remain separate.
    import datetime
    kst = datetime.timezone(datetime.timedelta(hours=9))
    timestamp = datetime.datetime.now(kst).strftime("%Y-%m-%d %H:%M")
    try:
        metadata = load_json(META_FILE)
        if not isinstance(metadata, dict):
            metadata = {}
        metadata["lastUpdated"] = timestamp
        metadata["lastAutoDeploy"] = timestamp
        metadata.setdefault("lastManualChange", None)
        with open(META_FILE, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        print(f"Metadata timestamp updated to: {timestamp}")
    except Exception as e:
        print(f"Failed to update metadata timestamp: {e}")
        
    print(f"Merge successful! Saved to {OUTPUT_FILE}")
    print(f"Official baseline updated: {BASE_FILE}")

if __name__ == "__main__":
    merge_data()
