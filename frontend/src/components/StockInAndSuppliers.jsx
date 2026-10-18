import React, { useState, useEffect } from 'react';

export default function StockInAndSuppliers() {
  const [subTab, setSubTab] = useState('stock-in');
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockInHistory, setStockInHistory] = useState([]);

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [stockInItems, setStockInItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    unitId: 1,
    unitName: '',
    quantity: '',
    purchaseCostUsd: '',
    totalCostUsd: 0
  });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [supRes, prodRes, stkRes] = await Promise.all([
        fetch('http://localhost:5000/api/suppliers'),
        fetch('http://localhost:5000/api/products'),
        fetch('http://localhost:5000/api/stock-in')
      ]);
      if (supRes.ok) setSuppliers(await supRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (stkRes.ok) setStockInHistory(await stkRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectProduct = (productId) => {
    const prod = products.find((p) => p.id === parseInt(productId));
    if (!prod) return;
    setCurrentItem({
      productId: prod.id,
      productName: prod.name_kh,
      unitId: prod.base_unit_id,
      unitName: prod.base_unit_name || 'ឯកតា',
      quantity: 1,
      purchaseCostUsd: prod.cost_price_usd,
      totalCostUsd: Number(prod.cost_price_usd)
    });
  };

  const addItem = () => {
    if (!currentItem.productId || !currentItem.quantity || !currentItem.purchaseCostUsd) return;
    setStockInItems([...stockInItems, currentItem]);
    setCurrentItem({ productId: '', unitId: 1, unitName: '', quantity: '', purchaseCostUsd: '', totalCostUsd: 0 });
  };

  const handleSubmitStockIn = async (e) => {
    e.preventDefault();
    if (stockInItems.length === 0) return alert('សូមបន្ថែមមុខទំនិញចូលបញ្ជី!');
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: selectedSupplierId || null, items: stockInItems, notes })
      });
      if (res.ok) {
        alert('បានកត់ត្រានាំចូលស្តុក និងបូកស្តុកជោគជ័យ!');
        setStockInItems([]);
        setNotes('');
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800">🚚 នាំទំនិញចូលស្តុក & អ្នកផ្គត់ផ្គង់ (Stock In & Suppliers)</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">កត់ត្រាទិញចូល និងបូកស្តុកស្វ័យប្រវត្តិ</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSubTab('stock-in')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'stock-in' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>📥 នាំចូល</button>
          <button onClick={() => setSubTab('suppliers')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subTab === 'suppliers' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>🏢 អ្នកផ្គត់ផ្គង់</button>
        </div>
      </div>

      {subTab === 'stock-in' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-bold text-sm">➕ បញ្ចូលការនាំចូល</h3>
            <div>
              <label className="block text-xs font-bold mb-1">អ្នកផ្គត់ផ្គង់</label>
              <select value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white">
                <option value="">-- ជ្រើសរើស Supplier --</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">ទំនិញ</label>
              <select value={currentItem.productId} onChange={(e) => handleSelectProduct(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white">
                <option value="">-- ជ្រើសរើសទំនិញ --</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name_kh} (សល់ {p.stock_quantity})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold mb-1">ចំនួន</label>
                <input type="number" value={currentItem.quantity} onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value, totalCostUsd: e.target.value * currentItem.purchaseCostUsd })} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">ថ្លៃដើម ($)</label>
                <input type="number" value={currentItem.purchaseCostUsd} onChange={(e) => setCurrentItem({ ...currentItem, purchaseCostUsd: e.target.value, totalCostUsd: currentItem.quantity * e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
              </div>
            </div>
            <button onClick={addItem} className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">➕ បញ្ចូលទៅបញ្ជី</button>
          </div>

          <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm pb-2 border-b">📋 បញ្ជីទំនិញនាំចូល ({stockInItems.length} មុខ)</h3>
              <table className="w-full text-left text-xs mt-3">
                <thead><tr className="border-b text-gray-400"><th>ទំនិញ</th><th className="text-center">ចំនួន</th><th className="text-right">ថ្លៃដើម ($)</th><th className="text-right">សរុប ($)</th></tr></thead>
                <tbody>
                  {stockInItems.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 font-bold">{item.productName}</td>
                      <td className="py-2 text-center">{item.quantity} {item.unitName}</td>
                      <td className="py-2 text-right">${Number(item.purchaseCostUsd).toFixed(2)}</td>
                      <td className="py-2 text-right font-black">${Number(item.totalCostUsd).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={handleSubmitStockIn} disabled={submitting || stockInItems.length === 0} className="w-full mt-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs disabled:opacity-50">
              💾 កត់ត្រានាំចូល & បូកស្តុក
            </button>
          </div>
        </div>
      )}
    </div>
  );
}