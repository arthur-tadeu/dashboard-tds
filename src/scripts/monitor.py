import urllib.request
import urllib.error
import json
import os
from datetime import datetime, timedelta

# Professional setup: Use environment variables for sensitive info
API_KEY = os.getenv("ROBOFLOW_API_KEY", "UK9bpk6c1x3CdSRFqxmQ")
WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "arthur-tadeu-s-workspace")

def get_roboflow_stats(days_back=180):
    """
    Fetches labeling statistics from Roboflow API.
    """
    hoje = datetime.now()
    inicio = (hoje - timedelta(days=days_back)).strftime("%Y-%m-%d")
    fim = hoje.strftime("%Y-%m-%d")

    url = f"https://api.roboflow.com/{WORKSPACE}/stats?api_key={API_KEY}&startDate={inicio}&endDate={fim}"
    
    print("-" * 50)
    print(" Roboflow Monitor - TDS25 Team Data Extraction")
    print("-" * 50)
    print(f"Workspace : {WORKSPACE}")
    print(f"Period    : {inicio} to {fim}")
    print("-" * 50 + "\n")

    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())
            return data
    except urllib.error.HTTPError as e:
        print(f"API Error (HTTP {e.code}): {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Unexpected error: {e}")
    return None

def process_stats(data):
    """
    Processes and prints the fetched data.
    """
    if not data:
        return

    metadata_users = {u['id']: u.get('displayName', u.get('email')) for u in data.get('labelers', [])}
    stats = data.get('data', [])
    
    if not stats:
        print("No labeling data found for this period.")
        return

    print(f"{'User':<25} | {'Project':<15} | {'Labeled Images':<15}")
    print("-" * 60)
    
    for stat in stats:
        user_name = metadata_users.get(stat['labelerId'], stat['labelerId'])
        images_done = stat.get('imagesLabeled', 0)
        project = stat.get('projectId', 'General')
        
        print(f"{user_name:<25} | {project:<15} | {images_done:<15}")

if __name__ == "__main__":
    roboflow_data = get_roboflow_stats()
    process_stats(roboflow_data)
