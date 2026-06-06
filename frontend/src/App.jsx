import { useState } from 'react';
import ValuationEngine from './components/ValuationEngine';
import SellerFunnel from './components/SellerFunnel';

function App() {
  const [valuationData, setValuationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchValuation = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.status === 'error') {
        setError(data.message);
      } else {
        setValuationData(data);
      }
    } catch (err) {
      setError("Unable to connect to the valuation engine. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 font-sans">
      <div className="max-w-7xl w-full bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold tracking-tight">SnapPrice</h1>
          <p className="text-slate-400 mt-1">Transparent valuation. Real market data.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Flow Control: Show Form OR Show Results */}
          {!valuationData ? (
            <ValuationEngine onSubmit={fetchValuation} isLoading={loading} />
          ) : (
            <SellerFunnel data={valuationData} onReset={() => setValuationData(null)} />
          )}
        </div>
        
      </div>
    </div>
  );
}

export default App;