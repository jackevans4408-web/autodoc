import requests

def get_recalls(year: str, make: str, model: str):
    try:
        url = f"https://api.nhtsa.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        recalls = data.get("results", [])
        
        if not recalls:
            return None
        
        recall_summary = []
        for recall in recalls[:3]:
            summary = {
                "campaign": recall.get("NHTSACampaignNumber", "N/A"),
                "component": recall.get("Component", "N/A"),
                "summary": recall.get("Summary", "N/A"),
                "consequence": recall.get("Consequence", "N/A"),
                "remedy": recall.get("Remedy", "N/A")
            }
            recall_summary.append(summary)
        
        return recall_summary
    
    except Exception as e:
        print(f"NHTSA API error: {e}")
        return None

def format_recalls_for_claude(recalls):
    if not recalls:
        return "No active recalls found for this vehicle."
    
    formatted = f"⚠️ ACTIVE RECALLS FOUND ({len(recalls)} recall(s)):\n\n"
    for i, recall in enumerate(recalls, 1):
        formatted += f"Recall #{i} - Campaign: {recall['campaign']}\n"
        formatted += f"Component: {recall['component']}\n"
        formatted += f"Issue: {recall['summary']}\n"
        formatted += f"Risk: {recall['consequence']}\n"
        formatted += f"Fix: {recall['remedy']}\n\n"
    
    return formatted