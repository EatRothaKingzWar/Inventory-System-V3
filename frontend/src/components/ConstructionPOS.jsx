import React, { useState, useEffect } from 'react';

export default function ConstructionPOS({ onPrintRequest }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  
  // ព័ត៌មានអតិថិជនលម្អិត (អាចវាយបញ្ចូលផ្ទាល់ ឬរើសពី Dropdown)
  const [customerName, setCustomerName] = useState('អតិថិជនទូទៅ');
  const [customerPhone, setCustomerPhone] = useState('');
  const [projectSite, setProjectSite] = useState('');
  const [driverName, setDriverName] = useState('');
  const [notes, setNotes] = useState('');

  const [paymentType, setPaymentType] = useState('CASH');
  const [serverError, setServerError] = useState(false);
  
  const exchangeRate = 4100;
  const [receivedUsd, setReceivedUsd] = useState('');
  const [receivedKhr, setReceivedKhr] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      setServerError(false);
      let res = await fetch('http://localhost:5000/api/pos/products');
      if (!res.ok) {
        res = await fetch('http://localhost:5000/api/products');
      }
      const data = await res.json();
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setServerError(true);
    }
  };

  const fetchCustomers = async () => {
    try {
      let res = await fetch('http://localhost:5000/api/customers');
      if (!res.ok) {
        res = await fetch('http://localhost:5000/api/debts');
      }
      const data = await res.json();
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const handleCustomerSelect = (customerId) => {
    setSelectedCustomer(customerId);
    const found = customers.find((c) => c.id === Number(customerId));
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone || '');
      setProjectSite(found.project_site || found.address || '');
    } else {
      setCustomerName('អតិថិជនទូទៅ');
      setCustomerPhone('');
      setProjectSite('');
    }
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.productId === product.id && item.unitName === product.base_unit_name);
    if (existing) {
      handleQtyChange(cart.indexOf(existing), existing.quantity + 1);
    } else {
      const availableUnits = [
        { unit_name: product.base_unit_name, conversion_factor: 1, sell_price_usd: product.sell_price_usd }
      ];

      if (product.alternative_units && Array.isArray(product.alternative_units)) {
        product.alternative_units.forEach((u) => {
          if (!availableUnits.some((au) => au.unit_name === u.unit_name)) {
            availableUnits.push(u);
          }
        });
      }

      setCart([
        ...cart,
        {
          productId: product.id,
          nameKh: product.name_kh,
          unitName: product.base_unit_name,
          conversionFactor: 1,
          quantity: 1,
          costPriceUsd: Number(product.cost_price_usd),
          unitPriceUsd: Number(product.sell_price_usd),
          totalUsd: Number(product.sell_price_usd),
          availableUnits
        }
      ]);
    }
  };

  const handleUnitChange = (index, selectedUnitName) => {
    const item = cart[index];
    const unitObj = item.availableUnits.find((u) => u.unit_name === selectedUnitName);
    if (!unitObj) return;

    const newUnitPrice = Number(unitObj.sell_price_usd);
    const updated = [...cart];
    updated[index] = {
      ...item,
      unitName: unitObj.unit_name,
      conversionFactor: unitObj.conversion_factor,
      unitPriceUsd: newUnitPrice,
      totalUsd: item.quantity * newUnitPrice
    };
    setCart(updated);
  };

  const handleQtyChange = (index, qty) => {
    const quantity = Math.max(0.1, Number(qty));
    const updated = [...cart];
    updated[index].quantity = quantity;
    updated[index].totalUsd = quantity * updated[index].unitPriceUsd;
    setCart(updated);
  };

  const removeItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalUsd = cart.reduce((sum, item) => sum + item.totalUsd, 0);
  const totalKhr = Math.round(totalUsd * exchangeRate);

  const totalReceivedUsd = Number(receivedUsd || 0) + (Number(receivedKhr || 0) / exchangeRate);
  const changeUsd = paymentType !== 'CREDIT' && totalReceivedUsd > totalUsd ? totalReceivedUsd - totalUsd : 0;
  const changeKhr = Math.round(changeUsd * exchangeRate);
  const remainingDebtUsd = paymentType === 'CREDIT' ? Math.max(0, totalUsd - totalReceivedUsd) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('សូមជ្រើសរើសទំនិញជាមុនសិន!');
    if (paymentType === 'CREDIT' && !customerName) {
      return alert('សូមវាយបញ្ចូលឈ្មោះអតិថិជន/ការដ្ឋាន សម្រាប់ការលក់ជំពាក់!');
    }

    const payload = {
      customerId: selectedCustomer || null,
      userId: 1,
      items: cart,
      exchangeRate,
      subtotalUsd: totalUsd,
      totalUsd,
      receivedUsd: Number(receivedUsd || 0),
      receivedKhr: Number(receivedKhr || 0),
      paymentType,
      driverName: driverName || 'ឡានក្រុមហ៊ុន',
      siteReceiverName: projectSite || 'មិនបានបញ្ជាក់',
      notes
    };

    try {
      const res = await fetch('http://localhost:5000/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        if (onPrintRequest) {
          onPrintRequest({
            sale: {
              ...data.sale,
              customer_name: customerName,
              customer_phone: customerPhone,
              site_receiver_name: projectSite,
              driver_name: driverName || 'ឡានក្រុមហ៊ុន'
            },
            items: cart,
            customer: {
              id: selectedCustomer,
              name: customerName,
              phone: customerPhone,
              project_site: projectSite
            }
          });
        }
        setCart([]);
        setReceivedUsd('');
        setReceivedKhr('');
        fetchProducts();
      } else {
        alert(data.error || 'មានបញ្ហាក្នុងការលក់!');
      }
    } catch (err) {
      alert('Network Error! សូមពិនិត្យមើល Backend Server (Port 5000)');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex justify-between items-center">
          <span>⚠️ <strong>មិនអាចភ្ជាប់ទៅកាន់ Backend Server បានឡើយ!</strong> សូមប្រាកដថាបានដំណើរការ <code className="bg-red-100 px-2 py-0.5 rounded font-mono font-bold">node backend/server.js</code> លើ Port 5000</span>
          <button onClick={fetchProducts} className="px-3 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700">សាកល្បងឡើងវិញ</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ផ្នែកខាងឆ្វេង៖ បញ្ជីទំនិញគ្រឿងសំណង់ */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">ទំនិញគ្រឿងសំណង់ (Stock Products)</h3>
            <span className="text-xs text-gray-500 font-semibold">{products.length} មុខទំនិញក្នុងស្តុក</span>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <span className="text-3xl block mb-2">📦</span>
              <p className="font-bold text-sm text-gray-600">មិនទាន់មានទំនិញបង្ហាញឡើយ</p>
              <button onClick={fetchProducts} className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow">
                🔄 ផ្ទុកទិន្នន័យឡើងវិញ (Reload)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="border border-gray-200 hover:border-blue-500 hover:shadow-md p-3.5 rounded-xl cursor-pointer transition flex flex-col justify-between bg-white"
                >
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{p.category}</span>
                    <h4 className="font-bold text-gray-800 text-sm mt-1">{p.name_kh}</h4>
                    <div className="text-xs text-gray-500 mt-1">
                      ស្តុក: <span className="font-semibold text-gray-700">{p.stock_quantity} {p.base_unit_name}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-blue-600 font-extrabold text-base">${Number(p.sell_price_usd).toFixed(2)}</span>
                    <span className="text-xs text-gray-400">/{p.base_unit_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ផ្នែកខាងស្តាំ៖ កន្ត្រកលក់ POS & គិតលុយពីរប្រព័ន្ធ */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-xl font-bold text-gray-800 mb-3">វិក្កយបត្រលក់ (Order Cart)</h3>

          {/* ផ្នែកវាយបញ្ចូលព័ត៌មានអតិថិជន លេខទូរស័ព្ទ និងទីតាំងការដ្ឋាន */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 space-y-2 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">ជ្រើសរើសអតិថិជនចាស់ (ឬវាយឈ្មោះថ្មីខាងក្រោម)៖</label>
              <select
                value={selectedCustomer}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-blue-500 bg-white"
              >
                <option value="">-- អតិថិជនទូទៅ (វាយឈ្មោះផ្ទាល់) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} {c.project_site ? `- ${c.project_site}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
              <div>
                <label className="font-bold text-gray-700 block mb-0.5">ឈ្មោះអតិថិជន *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ឧ. មេការ សុខា"
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-xs font-bold bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-0.5">លេខទូរស័ព្ទ</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="ឧ. 012 888 999"
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-xs font-mono bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-gray-700 block mb-0.5">ទីតាំងការដ្ឋានសំណង់ *</label>
                <input
                  type="text"
                  value={projectSite}
                  onChange={(e) => setProjectSite(e.target.value)}
                  placeholder="ឧ. បុរីពិភពថ្មី កំបូល"
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-xs bg-white font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-0.5">អ្នកដឹកជញ្ជូន</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="ឧ. ឡានលេខ 3A-8899"
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* បញ្ជីទំនិញក្នុងកន្ត្រក */}
          <div className="flex-1 overflow-y-auto max-h-56 border border-gray-100 rounded-lg p-2 mb-3 divide-y divide-gray-100">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">មិនទាន់មានទំនិញក្នុងកន្ត្រកឡើយ</div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-xs truncate">{item.nameKh}</div>
                    <div className="text-[10px] text-gray-500">${item.unitPriceUsd.toFixed(2)} / {item.unitName}</div>
                  </div>

                  <select
                    value={item.unitName}
                    onChange={(e) => handleUnitChange(idx, e.target.value)}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-50 font-bold"
                  >
                    {item.availableUnits.map((u, uIdx) => (
                      <option key={uIdx} value={u.unit_name}>
                        {u.unit_name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => handleQtyChange(idx, e.target.value)}
                    className="w-14 border border-gray-300 rounded p-1 text-xs text-center font-bold"
                  />

                  <div className="font-black text-gray-800 text-xs w-16 text-right">${item.totalUsd.toFixed(2)}</div>
                  <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 text-sm font-bold ml-1">×</button>
                </div>
              ))
            )}
          </div>

          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 mb-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-xs font-bold">សរុបជាដុល្លារ ($):</span>
              <span className="text-2xl font-black text-blue-700">${totalUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-200">
              <span className="text-gray-500 text-xs">សរុបជារៀល (៛ 4,100):</span>
              <span className="text-base font-bold text-emerald-700">{totalKhr.toLocaleString()} ៛</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {['CASH', 'BANK_TRANSFER', 'CREDIT'].map((type) => (
              <button
                key={type}
                onClick={() => setPaymentType(type)}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  paymentType === type
                    ? type === 'CREDIT'
                      ? 'bg-amber-600 text-white border-amber-600 shadow'
                      : 'bg-blue-600 text-white border-blue-600 shadow'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type === 'CASH' ? 'សាច់ប្រាក់' : type === 'BANK_TRANSFER' ? 'វេរធនាគារ (KHQR)' : 'ជំពាក់ (Credit)'}
              </button>
            ))}
          </div>

          {paymentType !== 'BANK_TRANSFER' && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[11px] text-gray-500 font-bold block mb-0.5">ទទួលជា ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={receivedUsd}
                  onChange={(e) => setReceivedUsd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 font-bold block mb-0.5">ទទួលជា (៛)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={receivedKhr}
                  onChange={(e) => setReceivedKhr(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-xs font-bold"
                />
              </div>
            </div>
          )}

          {paymentType === 'CREDIT' ? (
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-800 text-xs font-semibold mb-3 flex justify-between">
              <span>ទឹកប្រាក់ជំពាក់លើវិក្កយបត្រនេះ:</span>
              <span className="font-black text-sm">${remainingDebtUsd.toFixed(2)}</span>
            </div>
          ) : (
            <div className="bg-green-50 p-2.5 rounded-lg border border-green-200 text-green-800 text-xs font-semibold mb-3 flex justify-between">
              <span>លុយអាប់ (Change):</span>
              <span className="font-bold text-xs">${changeUsd.toFixed(2)} ({changeKhr.toLocaleString()} ៛)</span>
            </div>
          )}

          <button
            onClick={handleCheckout}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md transition ${
              paymentType === 'CREDIT' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            គិតលុយ & ចេញវិក្កយបត្រ (Pay & Print)
          </button>
        </div>
      </div>
    </div>
  );
}