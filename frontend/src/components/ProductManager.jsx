import React, { useState, useEffect } from 'react';

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    nameKh: '',
    category: 'ស៊ីម៉ងត៍',
    brand: '',
    modelType: '',
    size: '',
    color: '',
    baseUnitId: 1,
    costPriceUsd: '',
    sellPriceUsd: '',
    stockQuantity: '',
    minStockAlert: '10',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = ['ស៊ីម៉ងត៍', 'ដែក', 'ថ្ម និងខ្សាច់', 'ឥដ្ឋ និងការ៉ូ', 'ថ្នាំពណ៌', 'បំពង់ទឹក និងគ្រឿងត', 'សម្ភារៈអគ្គិសនី', 'ឧបករណ៍ជាង'];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (lowStockFilter) params.append('lowStockOnly', 'true');

      const res = await fetch(`http://localhost:5000/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitTypes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/unit-types');
      if (res.ok) {
        const data = await res.json();
        setUnitTypes(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchUnitTypes();
  }, [categoryFilter, lowStockFilter]);

  const openAddModal = () => {
    setEditProduct(null);
    setFormData({
      code: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: '',
      nameKh: '',
      category: 'ស៊ីម៉ងត៍',
      brand: '',
      modelType: '',
      size: '',
      color: '',
      baseUnitId: unitTypes[0]?.id || 1,
      costPriceUsd: '',
      sellPriceUsd: '',
      stockQuantity: '0',
      minStockAlert: '10',
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditProduct(p);
    setFormData({
      code: p.code || '',
      barcode: p.barcode || '',
      nameKh: p.name_kh || '',
      category: p.category || 'ស៊ីម៉ងត៍',
      brand: p.brand || '',
      modelType: p.model_type || '',
      size: p.size || '',
      color: p.color || '',
      baseUnitId: p.base_unit_id || 1,
      costPriceUsd: p.cost_price_usd || '',
      sellPriceUsd: p.sell_price_usd || '',
      stockQuantity: p.stock_quantity || '0',
      minStockAlert: p.min_stock_alert || '10',
      description: p.description || ''
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editProduct ? `http://localhost:5000/api/products/${editProduct.id}` : 'http://localhost:5000/api/products';
      const method = editProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchProducts();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/products/${id}/toggle-status`, { method: 'PATCH' });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800">📦 គ្រប់គ្រងមុខទំនិញ (Products & SKU)</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">កត់ត្រាតម្លៃដើម តម្លៃលក់ ម៉ាក ទំហំ និងកម្រិតដាស់តឿនស្តុក</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:bg-blue-700 transition"
        >
          ➕ បន្ថែមទំនិញថ្មី
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-[260px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ស្វែងរកតាមឈ្មោះ ឬកូដ..."
            className="flex-1 px-3 py-2 text-xs border rounded-xl outline-none"
          />
          <button onClick={fetchProducts} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">ស្វែងរក</button>
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs border rounded-xl outline-none font-bold"
          >
            <option value="">-- គ្រប់ប្រភេទ --</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs font-bold bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
            <input type="checkbox" checked={lowStockFilter} onChange={(e) => setLowStockFilter(e.target.checked)} />
            ⚠️ តែជិតអស់
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-gray-500 font-bold">
                <th className="py-3 px-4">កូដ</th>
                <th className="py-3 px-4">ឈ្មោះទំនិញ</th>
                <th className="py-3 px-4">ប្រភេទ</th>
                <th className="py-3 px-4 text-center">ឯកតា</th>
                <th className="py-3 px-4 text-right">តម្លៃដើម ($)</th>
                <th className="py-3 px-4 text-right">តម្លៃលក់ ($)</th>
                <th className="py-3 px-4 text-center">ស្តុក</th>
                <th className="py-3 px-4 text-center">ស្ថានភាព</th>
                <th className="py-3 px-4 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const isLow = Number(p.stock_quantity) <= Number(p.min_stock_alert);
                return (
                  <tr key={p.id} className={!p.is_active ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'}>
                    <td className="py-3 px-4 font-mono font-bold text-gray-700">{p.code}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{p.name_kh}</td>
                    <td className="py-3 px-4 text-gray-600">{p.category || '-'}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-700">{p.base_unit_name}</td>
                    <td className="py-3 px-4 text-right font-medium">${Number(p.cost_price_usd).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-black text-blue-700">${Number(p.sell_price_usd).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                        {Number(p.stock_quantity)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => handleToggleStatus(p.id)} className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100">
                        {p.is_active ? 'ដំណើរការ' : 'ផ្អាក'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => openEditModal(p)} className="px-2 py-1 bg-blue-50 text-blue-700 font-bold rounded">✏️ កែ</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6">
            <h3 className="font-black text-gray-800 pb-3 border-b">{editProduct ? '✏️ កែប្រែទំនិញ' : '➕ បន្ថែមទំនិញថ្មី'}</h3>
            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">កូដទំនិញ *</label>
                  <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">បារកូដ</label>
                  <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">ឈ្មោះទំនិញ *</label>
                  <input type="text" required value={formData.nameKh} onChange={(e) => setFormData({ ...formData, nameKh: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ប្រភេទ *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white">
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ឯកតាមូលដ្ឋាន *</label>
                  <select value={formData.baseUnitId} onChange={(e) => setFormData({ ...formData, baseUnitId: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white">
                    {unitTypes.map((u) => <option key={u.id} value={u.id}>{u.name_kh}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">តម្លៃដើម ($) *</label>
                  <input type="number" step="0.0001" required value={formData.costPriceUsd} onChange={(e) => setFormData({ ...formData, costPriceUsd: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">តម្លៃលក់ ($) *</label>
                  <input type="number" step="0.0001" required value={formData.sellPriceUsd} onChange={(e) => setFormData({ ...formData, sellPriceUsd: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs text-blue-700 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ចំនួនស្តុកដំបូង</label>
                  <input type="number" step="0.01" value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">កម្រិតដាស់តឿន</label>
                  <input type="number" step="0.01" value={formData.minStockAlert} onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })} className="w-full px-3 py-1.5 border rounded-lg text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold">បោះបង់</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">💾 រក្សាទុក</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}