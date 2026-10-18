import React, { useState, useEffect } from 'react';

export default function StockAdjustmentAndHistory() {
  const [subTab, setSubTab] = useState('adjustment');
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [movements, setMovements] = useState([]);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('DECREASE');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Damaged products');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    try {
      const [pRes, aRes, mRes] = await Promise.all([
        fetch('http://localhost:5000/api/products'),
        fetch('http://localhost:5000/api/stock-adjustments'),
        fetch('http://localhost:5000/api/stock-movements')
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (aRes.ok) setAdjustments(await aRes.json());
      if (mRes.ok) setMovements(await mRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !quantity) return alert('សូមបំពេញព័ត៌មានឱ្យបានគ្រប់គ្រាន់!');
    try {
      const res = await fetch('http://localhost:5000/api/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId, adjustmentType, quantity: parseFloat(quantity), reason, notes })
      });
      if (res.ok) {
        alert('បានកែតម្រូវស្តុកជោគជ័យ!');
        setQuantity('');
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800">⚖️ កែតម្រូវស្តុក & ប្រវត្តិចលនា (Adjustments & History)</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">កត់ត្រាទំនិញខូច បាត់ ប្រើផ្ទៃក្នុង និងតាមដានចលនាស្តុក</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSubTab('adjustment')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'adjustment' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>⚖️ កែតម្រូវ</button>
          <button onClick={() => setSubTab('history')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>📊 ប្រវត្តិចលនា</button>
        </div>
      </div>

      {subTab === 'adjustment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-sm pb-2 border-b">✏️ កែតម្រូវចំនួនស្តុក</h3>
            <form onSubmit={handleAdjustStock} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">ទំនិញ *</label>
                <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white">
                  <option value="">-- ជ្រើសរើសទំនិញ --</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name_kh} (សល់ {p.stock_quantity})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setAdjustmentType('DECREASE')} className={`py-1.5 text-xs font-bold rounded-lg ${adjustmentType === 'DECREASE' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>➖ ដកស្តុក</button>
                <button type="button" onClick={() => setAdjustmentType('INCREASE')} className={`py-1.5 text-xs font-bold rounded-lg ${adjustmentType === 'INCREASE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'}`}>➕ បូកស្តុក</button>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">ចំនួន</label>
                <input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">មូលហេតុ</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white">
                  <option value="Damaged products">ទំនិញខូចខាត (Damaged)</option>
                  <option value="Lost products">ទំនិញបាត់បង់ (Lost)</option>
                  <option value="Internal company usage">ប្រើផ្ទៃក្នុង (Internal)</option>
                  <option value="Stock counting differences">រាប់លើសខ្វះ (Count diff)</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">💾 រក្សាទុកការកែតម្រូវ</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <h3 className="font-bold text-sm pb-2 border-b">📋 បញ្ជីកែតម្រូវកន្លងមក</h3>
            <table className="w-full text-left text-xs mt-3">
              <thead><tr className="border-b text-gray-400"><th>កូដ</th><th>ទំនិញ</th><th className="text-center">ចំនួន</th><th>មូលហេតុ</th></tr></thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="py-2 text-blue-600 font-mono">{a.adjustment_number}</td>
                    <td className="py-2 font-bold">{a.product_name}</td>
                    <td className="py-2 text-center font-bold">{a.adjustment_type === 'INCREASE' ? '+' : '-'}{a.quantity}</td>
                    <td className="py-2 text-gray-500">{a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'history' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <h3 className="font-bold text-sm pb-2 border-b">📊 តាមដានគ្រប់ចលនាស្តុក (Stock Movement History)</h3>
          <table className="w-full text-left text-xs mt-3">
            <thead><tr className="border-b text-gray-400"><th>កាលបរិច្ឆេទ</th><th>ទំនិញ</th><th className="text-center">ប្រភេទចលនា</th><th className="text-center">ចំនួន</th><th className="text-center">ស្តុកនៅសល់</th></tr></thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="py-2 text-gray-400 font-mono">{new Date(m.created_at).toLocaleString('km-KH')}</td>
                  <td className="py-2 font-bold">{m.product_name}</td>
                  <td className="py-2 text-center"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100">{m.transaction_type}</span></td>
                  <td className={`py-2 text-center font-bold ${Number(m.quantity) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{m.quantity}</td>
                  <td className="py-2 text-center font-black">{m.balance_after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}