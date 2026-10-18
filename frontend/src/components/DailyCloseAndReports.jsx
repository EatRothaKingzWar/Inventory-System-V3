import React, { useState, useEffect } from 'react';

// ============================================================================
// មុខងារទី ៥៖ របាយការណ៍ហិរញ្ញវត្ថុ, តម្លៃស្តុក & បម្រុងទុកទិន្នន័យ (Proposal ផ្នែកទី 10, 11, 12, 16)
// - Monthly Sales Report, Gross Profit (Revenue - COGS)
// - Stock Report & Stock Valuation (Total Stock Value)
// - Daily Cash Close
// - Database Backup (One-click JSON snapshot download)
// ============================================================================

export default function DailyCloseAndReports() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'profit', 'stock-valuation', 'debts'
  const [dailyData, setDailyData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [stockValuation, setStockValuation] = useState(null);
  const [debts, setDebts] = useState([]);

  // Form Daily Close
  const [actualUsd, setActualUsd] = useState('');
  const [actualKhr, setActualKhr] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  // Form Debt Payment
  const [selectedDebtCustomer, setSelectedDebtCustomer] = useState(null);
  const [payAmountUsd, setPayAmountUsd] = useState('');
  const [payAmountKhr, setPayAmountKhr] = useState('');

  useEffect(() => {
    fetchDailySummary();
    fetchProfitReport();
    fetchStockValuation();
    fetchDebts();
  }, []);

  const fetchDailySummary = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/cash-register/current');
      const data = await res.json();
      setDailyData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfitReport = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reports/profit');
      const data = await res.json();
      setProfitData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockValuation = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reports/stock');
      const data = await res.json();
      setStockValuation(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDebts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/debts');
      const data = await res.json();
      setDebts(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDailyCloseSubmit = async () => {
    if (!actualUsd && !actualKhr) {
      return alert('សូមបញ្ចូលចំនួនប្រាក់ជាក់ស្តែងដែលបានរាប់ក្នុងថត!');
    }
    try {
      const res = await fetch('http://localhost:5000/api/cash-register/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualCashUsd: Number(actualUsd || 0),
          actualCashKhr: Number(actualKhr || 0),
          closingNotes
        })
      });
      if (res.ok) {
        alert('បិទបញ្ជីលុយប្រចាំថ្ងៃជោគជ័យ!');
        fetchDailySummary();
      }
    } catch (err) {
      alert('Error closing cash register');
    }
  };

  const handleRecordDebtPayment = async () => {
    if (!selectedDebtCustomer) return;
    try {
      const res = await fetch('http://localhost:5000/api/debts/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedDebtCustomer.id,
          amountUsd: Number(payAmountUsd || 0),
          amountKhr: Number(payAmountKhr || 0),
          note: 'សងលុយថ្លៃគ្រឿងសំណង់'
        })
      });
      if (res.ok) {
        alert('បានកត់ត្រាការសងលុយជោគជ័យ!');
        setSelectedDebtCustomer(null);
        setPayAmountUsd('');
        setPayAmountKhr('');
        fetchDebts();
      }
    } catch (err) {
      alert('Error recording debt payment');
    }
  };

  // Download Database Backup
  const handleDownloadBackup = () => {
    window.open('http://localhost:5000/api/backup/export', '_blank');
  };

  // Export Excel
  const handleExportExcel = () => {
    window.open('http://localhost:5000/api/reports/export-excel', '_blank');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-800">របាយការណ៍ហិរញ្ញវត្ថុ, តម្លៃស្តុក & ចំណេញដុល</h2>
          <p className="text-xs text-gray-500">Gross Profit (Revenue - COGS), តម្លៃស្តុកសរុប (Stock Value) និងបម្រុងទុកទិន្នន័យ</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadBackup}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm text-xs flex items-center gap-1.5 transition"
          >
            <span>💾</span>
            <span>ទាញយក Backup</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm text-xs flex items-center gap-1.5 transition"
          >
            <span>📊</span>
            <span>ទាញយក Excel</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'daily', label: 'បិទបញ្ជីលុយប្រចាំថ្ងៃ (Daily Close)' },
          { id: 'profit', label: 'ចំណេញដុល (Gross Profit = Rev - COGS)' },
          { id: 'stock-valuation', label: 'របាយការណ៍តម្លៃស្តុក (Stock Value)' },
          { id: 'debts', label: 'បញ្ជីអតិថិជនជំពាក់ (Debts)' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DAILY CASH CLOSE */}
      {activeTab === 'daily' && dailyData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-3">
            <h3 className="font-bold text-gray-800 text-sm mb-2">សរុបលក់ថ្ងៃនេះ (System Calculation)</h3>
            <div className="flex justify-between py-1.5 border-b border-gray-200 text-xs">
              <span className="text-gray-600">លក់សាច់ប្រាក់ដុល្លារ ($):</span>
              <span className="font-bold text-gray-800">${Number(dailyData.sales.total_cash_usd).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200 text-xs">
              <span className="text-gray-600">លក់សាច់ប្រាក់រៀល (៛):</span>
              <span className="font-bold text-gray-800">{Number(dailyData.sales.total_cash_khr).toLocaleString()} ៛</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200 text-xs">
              <span className="text-gray-600">លក់តាមធនាគារ (KHQR/Bank):</span>
              <span className="font-bold text-blue-600">${Number(dailyData.sales.total_bank_usd).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200 text-xs">
              <span className="text-gray-600">លក់ជំពាក់ (Credit):</span>
              <span className="font-bold text-amber-600">${Number(dailyData.sales.total_credit_usd).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded">
              <span>លុយប្រមូលបានពីការទារបំណុល:</span>
              <span>${Number(dailyData.debtCollected.collected_usd).toFixed(2)}</span>
            </div>
          </div>

          <div className="border border-gray-200 p-5 rounded-xl space-y-3">
            <h3 className="font-bold text-gray-800 text-sm">រាប់លុយបិទបញ្ជី (End of Day Count)</h3>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">លុយដុល្លាររាប់ជាក់ស្តែង ($)</label>
              <input
                type="number"
                placeholder="0.00"
                value={actualUsd}
                onChange={(e) => setActualUsd(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">លុយរៀលរាប់ជាក់ស្តែង (៛)</label>
              <input
                type="number"
                placeholder="0"
                value={actualKhr}
                onChange={(e) => setActualKhr(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">កំណត់សម្គាល់បិទវេន</label>
              <textarea
                rows="2"
                placeholder="ចំណាំ..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-xs"
              ></textarea>
            </div>
            <button
              onClick={handleDailyCloseSubmit}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow text-xs"
            >
              បញ្ជាក់ការបិទបញ្ជីលុយ
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: GROSS PROFIT (Rev - COGS) */}
      {activeTab === 'profit' && profitData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <span className="text-xs font-bold text-blue-700 block mb-1">ចំណូលលក់សរុប (Sales Revenue)</span>
              <span className="text-2xl font-black text-blue-900">${Number(profitData.summary?.total_revenue_usd || 0).toFixed(2)}</span>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
              <span className="text-xs font-bold text-orange-700 block mb-1">ថ្លៃដើមទំនិញលក់ (Cost of Goods Sold - COGS)</span>
              <span className="text-2xl font-black text-orange-900">${Number(profitData.summary?.total_cogs_usd || 0).toFixed(2)}</span>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <span className="text-xs font-bold text-emerald-700 block mb-1">ប្រាក់ចំណេញដុល (Gross Profit)</span>
              <span className="text-2xl font-black text-emerald-900">${Number(profitData.summary?.gross_profit_usd || 0).toFixed(2)}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-1">= Revenue - COGS</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <h4 className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-800">
              ចំណេញដុលតាមមុខទំនិញនីមួយៗ (Sales & Profit by Product)
            </h4>
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-2.5">កូដ</th>
                  <th className="p-2.5">ឈ្មោះទំនិញ</th>
                  <th className="p-2.5 text-center">ចំនួនលក់ដាច់</th>
                  <th className="p-2.5 text-right">ចំណូលសរុប ($)</th>
                  <th className="p-2.5 text-right">ចំណេញដុល ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profitData.salesByProduct?.map((sp, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2.5 font-mono text-gray-600">{sp.product_code}</td>
                    <td className="p-2.5 font-bold text-gray-800">{sp.product_name}</td>
                    <td className="p-2.5 text-center font-bold text-blue-600">{sp.quantity_sold}</td>
                    <td className="p-2.5 text-right font-semibold">${Number(sp.total_revenue).toFixed(2)}</td>
                    <td className="p-2.5 text-right font-black text-emerald-700">${Number(sp.product_gross_profit).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK VALUATION */}
      {activeTab === 'stock-valuation' && stockValuation && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <span className="text-xs font-bold text-indigo-700 block mb-1">តម្លៃស្តុកសរុប (Total Stock Valuation)</span>
              <span className="text-2xl font-black text-indigo-900">${Number(stockValuation.summary?.total_valuation_usd || 0).toFixed(2)}</span>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <span className="text-xs font-bold text-blue-700 block mb-1">បរិមាណស្តុកសរុប (Total Units in Stock)</span>
              <span className="text-2xl font-black text-blue-900">{Number(stockValuation.summary?.total_units || 0).toLocaleString()}</span>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <span className="text-xs font-bold text-amber-700 block mb-1">ទំនិញជិតអស់ពីស្តុក (Low Stock Alert)</span>
              <span className="text-2xl font-black text-amber-900">{stockValuation.summary?.total_low_stock_items || 0} មុខ</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-2.5">កូដ</th>
                  <th className="p-2.5">ឈ្មោះទំនិញ</th>
                  <th className="p-2.5">ប្រភេទ & ម៉ាក</th>
                  <th className="p-2.5 text-center">ស្តុកនៅសល់</th>
                  <th className="p-2.5 text-right">ថ្លៃដើម ($)</th>
                  <th className="p-2.5 text-right">តម្លៃស្តុកសរុប ($)</th>
                  <th className="p-2.5 text-center">ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockValuation.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-2.5 font-mono text-gray-600">{item.code}</td>
                    <td className="p-2.5 font-bold text-gray-800">{item.name_kh}</td>
                    <td className="p-2.5 text-gray-600">{item.category} {item.brand ? `(${item.brand})` : ''}</td>
                    <td className="p-2.5 text-center font-bold">{item.stock_quantity} {item.unit_name}</td>
                    <td className="p-2.5 text-right">${Number(item.cost_price_usd).toFixed(2)}</td>
                    <td className="p-2.5 text-right font-black text-indigo-700">${Number(item.stock_value_usd).toFixed(2)}</td>
                    <td className="p-2.5 text-center">
                      {item.is_low_stock ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">ជិតអស់ស្តុក</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">គ្រប់គ្រាន់</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DEBTS */}
      {activeTab === 'debts' && (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
              <tr>
                <th className="p-3">ឈ្មោះអតិថិជន</th>
                <th className="p-3">លេខទូរស័ព្ទ</th>
                <th className="p-3">ការដ្ឋាន</th>
                <th className="p-3">ទឹកប្រាក់ជំពាក់ ($)</th>
                <th className="p-3">គិតជារៀល (៛ 4,100)</th>
                <th className="p-3 text-center">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {debts.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="p-3 font-bold text-gray-800">{d.name}</td>
                  <td className="p-3 text-gray-600">{d.phone || '-'}</td>
                  <td className="p-3 text-gray-600">{d.project_site || '-'}</td>
                  <td className="p-3 font-black text-red-600">${Number(d.current_debt_usd).toFixed(2)}</td>
                  <td className="p-3 text-gray-600 font-semibold">{Number(d.current_debt_khr).toLocaleString()} ៛</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedDebtCustomer(d);
                        setPayAmountUsd(d.current_debt_usd);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow"
                    >
                      កត់ត្រាសងលុយ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal សងលុយជំពាក់ */}
      {selectedDebtCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl text-xs">
            <h3 className="text-base font-bold text-gray-800 mb-2">កត់ត្រាសងលុយជំពាក់</h3>
            <p className="text-gray-500 mb-4">
              អតិថិជន៖ <span className="font-bold text-gray-800">{selectedDebtCustomer.name}</span> (ជំពាក់សរុប: ${selectedDebtCustomer.current_debt_usd})
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">ចំនួនទឹកប្រាក់សងជាដុល្លារ ($)</label>
                <input
                  type="number"
                  value={payAmountUsd}
                  onChange={(e) => setPayAmountUsd(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">ឬ សងជាប្រាក់រៀល (៛)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={payAmountKhr}
                  onChange={(e) => setPayAmountKhr(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedDebtCustomer(null)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-bold"
              >
                បោះបង់
              </button>
              <button
                onClick={handleRecordDebtPayment}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow"
              >
                រក្សាទុក
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
