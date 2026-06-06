import { useState } from 'react';

export default function ValuationEngine({ onSubmit, isLoading }) {
  // Defaulting to an Ames neighborhood so testing is frictionless
  const [formData, setFormData] = useState({
    neighborhood: 'CollgCr', 
    sqft: 2000,
    beds: 3,
    baths: 2.0,
    condition: 3
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'neighborhood' ? value : Number(value)
    }));
  };

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} 
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Neighborhood</label>
          <select 
            name="neighborhood" 
            value={formData.neighborhood} 
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {/* A few real Ames neighborhoods that exist in our dataset */}
            <option value="CollgCr">College Creek</option>
            <option value="NridgHt">Northridge Heights</option>
            <option value="OldTown">Old Town</option>
            <option value="Edwards">Edwards</option>
            <option value="Somerset">Somerset</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Square Footage</label>
          <input 
            type="number" name="sqft" value={formData.sqft} onChange={handleChange} required
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Bedrooms</label>
          <input 
            type="number" name="beds" value={formData.beds} onChange={handleChange} required min="1"
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Bathrooms</label>
          <input 
            type="number" name="baths" value={formData.baths} onChange={handleChange} required step="0.5" min="1"
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

      </div>

      <div className="space-y-2 pt-2">
        <label className="text-sm font-semibold text-slate-700 flex justify-between">
          <span>Property Condition</span>
          <span className="text-blue-600">{formData.condition} / 5</span>
        </label>
        <input 
          type="range" name="condition" min="1" max="5" value={formData.condition} onChange={handleChange}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>Needs Work (1)</span>
          <span>Pristine (5)</span>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-md disabled:bg-slate-300"
      >
        {isLoading ? 'Analyzing Market Data...' : 'Get Transparent Valuation'}
      </button>
    </form>
  );
}