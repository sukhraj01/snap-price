import pandas as pd
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import xgboost as xgb
import shap
import pickle
import json

# ==========================================
# STEP 1: FETCH & PREPARE REAL DATASET
# ==========================================
print("Downloading real public housing dataset (Ames)...")
housing = fetch_openml(name="house_prices", as_frame=True, parser='auto')
df = housing.frame

# Extract features, including the REAL neighborhood
data = pd.DataFrame({
    'sqft': df['GrLivArea'],
    'beds': df['BedroomAbvGr'],
    'baths': df['FullBath'],
    'condition': df['OverallCond'], 
    'neighborhood': df['Neighborhood'], # The actual location data
    'price': df['SalePrice']
}).dropna()

# Normalize condition from a 1-10 scale down to our UI's 1-5 scale
data['condition'] = (data['condition'] / 2).apply(lambda x: int(max(1, round(x))))

# ==========================================
# STEP 2: CALCULATE LOCAL MARKET BASELINES (MEDIAN)
# ==========================================
data['price_per_sqft'] = data['price'] / data['sqft']

# Use MEDIAN to protect against luxury outliers (Fixing Problem 3)
neighborhood_baselines = data.groupby('neighborhood')['price_per_sqft'].median().to_dict()
data['baseline_price'] = data['sqft'] * data['neighborhood'].map(neighborhood_baselines)

# ==========================================
# STEP 3: TRAIN THE VARIANCE ENGINE
# ==========================================
data['variance'] = data['price'] - data['baseline_price']

# Provide baseline_price to XGBoost so it understands market context (Fixing Problem 1)
X = data[['sqft', 'beds', 'baths', 'condition', 'baseline_price']]
y = data['variance']

# Add Train/Test Split to validate performance (Fixing Problem 5)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training XGBoost Variance Engine...")
model = xgb.XGBRegressor(n_estimators=120, max_depth=4, learning_rate=0.08, random_state=42)
model.fit(X_train, y_train)

# Print metrics to defend the model during the pitch
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f"Model Performance Metrics -> MAE: ${mae:,.0f} | R²: {r2:.3f}")

# Initialize SHAP Explainer
explainer = shap.TreeExplainer(model)

# ==========================================
# STEP 4: EXPORT ARTIFACTS
# ==========================================
with open('production_avm.pkl', 'wb') as f:
    pickle.dump({
        'model': model,
        'explainer': explainer,
        'features': list(X.columns),
        'neighborhood_baselines': neighborhood_baselines
    }, f)

# Save ALL comps instead of just 30 to prevent sparse lookups (Fixing Problem 4)
comps = data[['neighborhood', 'sqft', 'beds', 'baths', 'condition', 'price']].to_dict(orient='records')
with open('comps_db.json', 'w') as f:
    json.dump(comps, f)

print(f"✅ Success! Saved {len(comps)} real comps and production artifacts.")