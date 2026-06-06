import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Home, ArrowRight, Activity, MapPin } from 'lucide-react';

const labelMap = {
  sqft: "Square Footage",
  beds: "Bedroom Count",
  baths: "Bathroom Count",
  condition: "Property Condition",
};

export default function SellerFunnel({ data, onReset }) {
  const { valuation, baseline_price, attributions, narrative, top_comps } = data;
  const [displayValue, setDisplayValue] = useState(0);

  // Animated Reveal
  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const increment = valuation / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= valuation) {
        setDisplayValue(valuation);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [valuation]);

  const sortedAttributions = Object.entries(attributions)
    .filter(([key, val]) => val !== 0 && key !== 'baseline_price') 
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12 transition-opacity duration-700 opacity-100">
      
      {/* 2-COLUMN ENTERPRISE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-8 flex flex-col justify-between">
          
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Estimated Market Value
            </p>
            <h2 className="text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tighter mb-6">
              ${displayValue.toLocaleString()}
            </h2>
            
            <div className="bg-blue-50/50 border-l-4 border-blue-500 p-5 rounded-r-xl">
              <p className="text-slate-700 text-lg leading-relaxed font-medium">
                {narrative}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-full">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Home className="w-5 h-5 text-blue-600" />
              Recent Comparable Sales
            </h3>
            <div className="space-y-4">
              {top_comps.map((comp, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 rounded-2xl">
                  <div>
                    <p className="font-bold text-slate-900 text-xl">${comp.price.toLocaleString()}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {comp.neighborhood} • {comp.sqft} sqft • {comp.beds} bed
                    </p>
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Sold
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="space-y-8 flex flex-col justify-between">

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            
            {/* 1. Visually Separated Anchor */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 text-center shadow-inner">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                Neighborhood Baseline
              </p>
              <p className="text-4xl font-extrabold text-slate-900">
                ${baseline_price.toLocaleString()}
              </p>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3 flex justify-between items-end">
              <span>Property Adjustments</span>
            </h3>
            
            <div className="space-y-6">
              {sortedAttributions.map(([feature, value]) => {
                const isPositive = value > 0;
                const humanLabel = labelMap[feature] || feature;
                const maxVal = Math.max(...sortedAttributions.map(a => Math.abs(a[1])));
                const barWidth = Math.min((Math.abs(value) / maxVal) * 100, 100); 

                return (
                  <div key={feature} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <span className="font-semibold text-slate-700 text-sm md:text-base">{humanLabel}</span>
                      </div>
                      <span className={`font-extrabold text-lg ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? '+' : '-'}${Math.abs(value).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full ${isPositive ? 'bg-emerald-400' : 'bg-rose-400'}`} 
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-10 shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full"></div>
            
            <h3 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight relative z-10">
              Ready to see what buyers will pay?
            </h3>
            <p className="text-slate-400 text-lg mb-8 relative z-10">
              Algorithms are a great start, but local expertise closes the deal. Lock in a verified appraisal today.
            </p>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl py-6 px-8 rounded-2xl transition-all shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] flex items-center justify-center gap-3 relative z-10">
              List With a Snaphomz Agent
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

        </div>
      </div>

      <div className="text-center pt-8">
        <button onClick={onReset} className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider">
          Evaluate Another Property
        </button>
      </div>

    </div>
  );
}