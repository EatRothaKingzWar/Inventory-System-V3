import React, { useState, useEffect } from 'react';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:5000/api/dashboard/stats');
      if (!res.ok) throw new Error('មិនអាចទាញយកទិន្នន័យពី Server បានទេ');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        <span className="ml-3 text-gray-600 font-bold">កំពុងទាញយកទិន្នន័យ Dashboard...</span>
      </div>
    );
  }

  const pStats = stats?.productStats || {};
  const tSales = stats?.todaySales || {};
  const mSales = stats?.monthlySales || {};
  const lowStock = stats?.lowStockItems || [];
  const recSales = stats?.recentTransactions || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800">📊 ផ្ទាំងសង្ខេបប្រតិបត្តិការ (Dashboard)</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            ទិដ្ឋភាពទូទៅនៃស្តុកគ្រឿងសំណង់ ការលក់ប្រចាំថ្ងៃ និងទំនិញដែលត្រូវការនាំចូលបន្ថែម
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('pos')}
            className="px-4 py-2 bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:bg-blue-700 transition"
          >
            🛒 បើកកន្លែងលក់ POS
          </button>
          <button
            onClick={fetchDashboardStats}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchDashboardStats} className="font-bold underline text-xs">សាកល្បងឡើងវិញ</button>
        </div>
      )}

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">ការលក់ថ្ងៃនេះ (Today Sales)</p>
          <h3 className="text-2xl font-black text-gray-800 mt-1">
            ${Number(tSales.today_sales_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            ៛ {Number(tSales.today_sales_khr || 0).toLocaleString()} ({tSales.today_orders_count || 0} វិក្កយបត្រ)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">ការលក់ខែនេះ (Monthly Sales)</p>
          <h3 className="text-2xl font-black text-gray-800 mt-1">
            ${Number(mSales.monthly_sales_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            ៛ {Number(mSales.monthly_sales_khr || 0).toLocaleString()} ({mSales.monthly_orders_count || 0} វិក្កយបត្រ)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">តម្លៃស្តុកសរុប (Stock Valuation)</p>
          <h3 className="text-2xl font-black text-gray-800 mt-1">
            ${Number(pStats.total_stock_value_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {Number(pStats.total_stock_quantity || 0).toLocaleString()} ឯកតា ({pStats.total_products || 0} មុខទំនិញ)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">ជិតអស់ពីស្តុក (Low Stock Alert)</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">
            {stats?.lowStockCount || 0} <span className="text-sm font-normal text-gray-500">មុខទំនិញ</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">ស្តុកនៅសល់ ≤ ចំនួនដាស់តឿន</p>
        </div>
      </div>

      {/* Two Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-black text-gray-800 text-sm">⚠️ ទំនិញជិតអស់ពីស្តុក (Low Stock Alert)</h3>
            <button onClick={() => onNavigate('stock-in')} className="text-xs font-bold text-blue-600 hover:underline">+ នាំចូល</button>
          </div>
          <div className="p-4 overflow-x-auto">
            {lowStock.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">✅ មិនមានទំនិញជិតអស់ពីស្តុកទេ</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-gray-400 font-bold">
                    <th className="pb-2">កូដ</th>
                    <th className="pb-2">ឈ្មោះទំនិញ</th>
                    <th className="pb-2 text-center">ស្តុកសល់</th>
                    <th className="pb-2 text-center">ដាស់តឿន</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStock.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 font-bold text-gray-700">{item.code}</td>
                      <td className="py-2 font-bold text-gray-800">{item.name_kh}</td>
                      <td className="py-2 text-center font-black text-red-600">{Number(item.stock_quantity)} {item.unit_name}</td>
                      <td className="py-2 text-center text-gray-500">{Number(item.min_stock_alert)} {item.unit_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-black text-gray-800 text-sm">🧾 ប្រតិបត្តិការលក់ថ្មីៗ</h3>
            <button onClick={() => onNavigate('reports')} className="text-xs font-bold text-blue-600 hover:underline">របាយការណ៍ &rarr;</button>
          </div>
          <div className="p-4 overflow-x-auto">
            {recSales.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">មិនទាន់មានប្រតិបត្តិការលក់នៅឡើយទេ</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-gray-400 font-bold">
                    <th className="pb-2">វិក្កយបត្រ</th>
                    <th className="pb-2">អតិថិជន</th>
                    <th className="pb-2 text-right">ទឹកប្រាក់ ($)</th>
                    <th className="pb-2 text-center">ស្ថានភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recSales.map((sale, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-bold text-blue-600">{sale.invoice_no}</td>
                      <td className="py-2 text-gray-800">{sale.customer_name}</td>
                      <td className="py-2 text-right font-black">${Number(sale.total_amount_usd).toFixed(2)}</td>
                      <td className="py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.payment_type === 'CREDIT' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {sale.payment_type === 'CREDIT' ? 'ជំពាក់' : 'រួចរាល់'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}