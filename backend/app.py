from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import json
import pandas as pd
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. LOAD PRODUCTION ARTIFACTS
# ==========================================
with open('production_avm.pkl', 'rb') as f:
    artifacts = pickle.load(f)
with open('comps_db.json', 'r') as f:
    comps_db = json.load(f)

model = artifacts['model']
explainer = artifacts['explainer']
features = artifacts['features']
neighborhood_baselines = artifacts['neighborhood_baselines']

# GROQ LLM SETUP
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1" 
)

# ==========================================
# 2. SCHEMA
# ==========================================
class PropertyInput(BaseModel):
    neighborhood: str
    sqft: int
    beds: int
    baths: float
    condition: int

# ==========================================
# 3. ENDPOINT
# ==========================================
@app.post("/api/valuation")
async def get_valuation(data: PropertyInput):
    # Neighborhood Validation
    if data.neighborhood not in neighborhood_baselines:
        return {
            "status": "error",
            "message": f"Unknown neighborhood: '{data.neighborhood}'. Please select a valid market."
        }
        
    price_per_sqft = neighborhood_baselines[data.neighborhood]
    baseline_price = data.sqft * price_per_sqft
    
    input_df = pd.DataFrame([[data.sqft, data.beds, data.baths, data.condition, baseline_price]], columns=features)
    
    variance = float(model.predict(input_df)[0])
    final_value = round(baseline_price + variance, -3)

    # SHAP Failsafe
    try:
        shap_vals = explainer(input_df).values[0]
    except TypeError:
        shap_vals = explainer.shap_values(input_df)[0]
        
    attributions = {}
    for i in range(len(features)):
        val = round(float(shap_vals[i]) / 500) * 500
        if abs(val) < 500:
            val = 0
        attributions[features[i]] = val

    # Return Top Comps
    local_comps = [c for c in comps_db if c['neighborhood'] == data.neighborhood]
    local_comps.sort(key=lambda x: abs(x['sqft'] - data.sqft))
    top_comps = local_comps[:3]
    
    # ==========================================
    # Step D: Dynamic SHAP to LLM Translation (THIS WAS MISSING!)
    # ==========================================
    label_map = {
        'sqft': 'Square Footage',
        'beds': 'Bedroom Count',
        'baths': 'Bathroom Count',
        'condition': 'Property Condition'
    }
    
    sorted_attrs = sorted(
        [(k, v) for k, v in attributions.items() if k != 'baseline_price' and v != 0],
        key=lambda item: abs(item[1]),
        reverse=True
    )
    
    # Define the variables here so the prompt can use them!
    driver_1 = sorted_attrs[0] if len(sorted_attrs) > 0 else ("None", 0)
    driver_2 = sorted_attrs[1] if len(sorted_attrs) > 1 else ("None", 0)
    
    label_1 = label_map.get(driver_1[0], driver_1[0])
    label_2 = label_map.get(driver_2[0], driver_2[0])
    
    prompt = f"""
    You are a real estate expert explaining a home valuation report to a homeowner.
    Neighborhood: {data.neighborhood}
    Estimated Total Value: ${final_value:,.0f}
    Local Market Baseline: ${baseline_price:,.0f}
    
    Top Market Drivers Implicated by the Model:
    - {label_1}: {'Added' if driver_1[1] > 0 else 'Subtracted'} ${abs(driver_1[1]):,.0f}
    - {label_2}: {'Added' if driver_2[1] > 0 else 'Subtracted'} ${abs(driver_2[1]):,.0f}
    
    Rules for Writing:
    - Write exactly natural, fluid sentences. Do not use bullet points or lists. Keep word limit in check don't type out paragraphs but also don't be too short so as nothing proper is conveyed
    - Explain that homes in this neighborhood typically start at the baseline price.
    - Clearly connect how their specific {label_1.lower()} and {label_2.lower()} adjusted that number up or down to reach the final estimate.
    - Tone: Professional, clear, and reassuring. Use conversational, plain English.
    - Dont use over the top words and sound like a phd scholar for example look at this line : "So, in essence, the unique characteristics of your home have adjusted the baseline price upward, resulting in a higher estimated value that reflects the desirable features of your property." This sounds so unnatural 
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        narrative = response.choices[0].message.content
    except Exception as e:
        print(f"⚠️ LLM Error: {e}")
        action_1 = "increased" if driver_1[1] > 0 else "decreased"
        action_2 = "increased" if driver_2[1] > 0 else "decreased"
        narrative = f"Homes in your neighborhood typically sell for around ${baseline_price:,.0f}. Your {label_1.lower()} {action_1} the value, and your {label_2.lower()} {action_2} it relative to nearby comparable homes. This results in an estimated market value of approximately ${final_value:,.0f}."

    # Step E: Return Payload
    return {
        "status": "success",
        "valuation": final_value,
        "baseline_price": round(baseline_price, -3),
        "attributions": attributions,
        "narrative": narrative,
        "top_comps": top_comps
    }