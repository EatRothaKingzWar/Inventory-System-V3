import React, { useState } from 'react';

// ============================================================================
// មុខងារ៖ ការបោះពុម្ពវិក្កយបត្រ (Print Options)
// ១. វិក្កយបត្រតូច 80mm (Thermal POS Receipt)
// ២. ប័ណ្ណដឹកជញ្ជូន និងវិក្កយបត្រធំ A4 មាន ៣ កន្លែងចុះហត្ថលេខា
// អាចវាយបញ្ចូល ឬកែប្រែ៖ ឈ្មោះអតិថិជន, លេខទូរស័ព្ទ, ទីតាំងការដ្ឋាន, និងឈ្មោះអ្នកដឹក
// ============================================================================

export default function PrintInvoice({ data, type: initialType = 'A4', onClose }) {
  const { sale, items, customer } = data || {};

  // State សម្រាប់ជ្រើសរើសទម្រង់ព្រីន (80mm ឬ A4)
  const [currentType, setCurrentType] = useState(initialType);

  // State សម្រាប់ព័ត៌មានអតិថិជន និងការដ្ឋាន (អាចវាយបញ្ចូល ឬកែប្រែភ្លាមៗ)
  const [customerName, setCustomerName] = useState(customer?.name || sale?.customer_name || 'អតិថិជនទូទៅ');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || sale?.customer_phone || '');
  const [customerAddress, setCustomerAddress] = useState(customer?.project_site || customer?.address || sale?.site_receiver_name || 'ការដ្ឋានទូទៅ');
  const [driverName, setDriverName] = useState(sale?.driver_name || 'ឡានក្រុមហ៊ុន');

  const handlePrint = () => {
    window.print();
  };

  if (!sale) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 relative my-auto max-h-[95vh] overflow-y-auto">
        
        {/* ================================================================= */}
        {/* របារបញ្ជាខាងលើ (Control Header - បាត់ពេល Print) */}
        {/* ================================================================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-4 border-b border-gray-200 print:hidden">
          {/* ប៊ូតុងប្តូរទម្រង់ព្រីន (80mm vs A4) */}
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            <button
              onClick={() => setCurrentType('80MM')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                currentType === '80MM'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              🧾 វិក្កយបត្រតូច 80mm
            </button>
            <button
              onClick={() => setCurrentType('A4')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                currentType === 'A4'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              📄 ប័ណ្ណដឹកជញ្ជូនធំ A4 (៣ ហត្ថលេខា)
            </button>
          </div>

          {/* ប៊ូតុង Action (Print & Close) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              <span>🖨️ ចុចបោះពុម្ព (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs sm:text-sm transition"
            >
              ✕ បិទ
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ប្រអប់វាយបញ្ចូលព័ត៌មានអតិថិជន (Edit Details - បាត់ពេល Print) */}
        {/* ================================================================= */}
        <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 mb-5 print:hidden">
          <div className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1.5">
            <span>✏️ អ្នកអាចវាយបញ្ចូល ឬកែសម្រួលព័ត៌មានអតិថិជន និងទីតាំងនៅទីនេះភ្លាមៗ៖</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-0.5">ឈ្មោះអតិថិជន *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="ឧ. មេការ សុខា"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-0.5">លេខទូរស័ព្ទ</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="ឧ. 012 888 999"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-0.5">ការដ្ឋានសំណង់ / ទីតាំងដឹក *</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="ឧ. បុរីពិភពថ្មី កំបូល ប្លុក B"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-0.5">អ្នកដឹកជញ្ជូន</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="ឧ. ឡានលេខ 3A-8899"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ជម្រើសទី ១៖ វិក្កយបត្រតូច 80mm (Thermal POS Receipt) */}
        {/* ================================================================= */}
        {currentType === '80MM' && (
          <div className="w-full max-w-[80mm] mx-auto p-4 bg-white text-gray-900 font-mono text-xs leading-relaxed border border-dashed border-gray-300 rounded-lg shadow-inner print:border-none print:shadow-none print:p-0 print:w-[80mm]">
            <div className="text-center pb-2.5 border-b border-dashed border-gray-400">
              <h2 className="font-black text-sm">ដេប៉ូគ្រឿងសំណង់ ហេង ហេង</h2>
              <p className="text-[10px] text-gray-600">ផ្គត់ផ្គង់ដែក ស៊ីម៉ងត៍ ថ្ម ខ្សាច់ ថ្នាំពណ៌</p>
              <p className="text-[10px] text-gray-600">ផ្លូវជាតិលេខ ៣ សង្កាត់ចោមចៅ រាជធានីភ្នំពេញ</p>
              <p className="text-[10px] font-bold mt-0.5">ទូរស័ព្ទ៖ 012 345 678 / 097 999 8888</p>
              <div className="inline-block mt-1.5 px-2 py-0.5 border border-gray-800 text-[10px] font-black uppercase">
                វិក្កយបត្រលក់ / RECEIPT
              </div>
            </div>

            <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>លេខវិក្កយបត្រ:</span>
                <span className="font-bold">{sale.invoice_no}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>កាលបរិច្ឆេទ:</span>
                <span>{new Date(sale.created_at || Date.now()).toLocaleDateString('km-KH')}</span>
              </div>
              <div className="flex justify-between">
                <span>អតិថិជន:</span>
                <span className="font-bold">{customerName}</span>
              </div>
              {customerPhone && (
                <div className="flex justify-between text-gray-600">
                  <span>ទូរស័ព្ទ:</span>
                  <span>{customerPhone}</span>
                </div>
              )}
              {customerAddress && (
                <div className="flex justify-between text-gray-600">
                  <span>ទីតាំង/ការដ្ឋាន:</span>
                  <span className="font-medium text-right max-w-[130px] truncate">{customerAddress}</span>
                </div>
              )}
            </div>

            <table className="w-full my-2 text-[11px]">
              <thead>
                <tr className="border-b border-gray-400 text-gray-600 font-bold">
                  <th className="text-left py-1">ទំនិញ</th>
                  <th className="text-center py-1">ចំនួន</th>
                  <th className="text-right py-1">តម្លៃ</th>
                  <th className="text-right py-1">សរុប</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dotted divide-gray-300">
                {items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1 pr-1">
                      <div className="font-bold leading-tight">{item.nameKh}</div>
                      <div className="text-[9px] text-gray-500 font-sans">{item.unitName}</div>
                    </td>
                    <td className="text-center py-1 font-bold">{item.quantity}</td>
                    <td className="text-right py-1">${item.unitPriceUsd.toFixed(2)}</td>
                    <td className="text-right py-1 font-bold">${item.totalUsd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between font-black text-sm">
                <span>សរុបជាដុល្លារ ($):</span>
                <span>${Number(sale.total_amount_usd).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700 font-bold">
                <span>សរុបជារៀល (៛ 4,100):</span>
                <span>{Number(sale.total_amount_khr).toLocaleString()} ៛</span>
              </div>
              <div className="flex justify-between text-gray-600 border-t border-dotted border-gray-300 pt-1">
                <span>ប្រាក់ទទួលជាក់ស្តែង:</span>
                <span>${sale.received_usd || 0} / {Number(sale.received_khr || 0).toLocaleString()} ៛</span>
              </div>
              {sale.payment_type === 'CREDIT' ? (
                <div className="flex justify-between font-black text-red-600 border-t border-dashed border-gray-400 pt-1 text-xs">
                  <span>នៅជំពាក់ (Credit):</span>
                  <span>${Number(sale.debt_amount_usd).toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between font-bold text-emerald-700 border-t border-dotted border-gray-300 pt-1">
                  <span>លុយអាប់ (Change):</span>
                  <span>${sale.change_usd || 0} ({Number(sale.change_khr || 0).toLocaleString()} ៛)</span>
                </div>
              )}
            </div>

            <div className="text-center text-[10px] mt-4 pt-2 border-t border-dashed border-gray-400 text-gray-500">
              សូមអរគុណ! ទំនិញទិញហើយមិនអាចប្តូរយកប្រាក់វិញបានឡើយ!
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ជម្រើសទី ២៖ វិក្កយបត្រ & ប័ណ្ណដឹកជញ្ជូនធំ A4 (៣ ហត្ថលេខា) */}
        {/* ================================================================= */}
        {currentType === 'A4' && (
          <div className="p-6 sm:p-8 bg-white border border-gray-200 rounded-xl text-gray-900 print:border-none print:p-0">
            <div className="flex justify-between items-start pb-4 border-b-2 border-blue-600">
              <div>
                <h1 className="text-2xl font-black text-blue-900 tracking-tight">ដេប៉ូគ្រឿងសំណង់ ហេង ហេង</h1>
                <p className="text-xs text-gray-600 mt-1">ផ្គត់ផ្គង់ដែក ស៊ីម៉ងត៍ ថ្ម ខ្សាច់ ថ្នាំពណ៌ និងសម្ភារសំណង់គ្រប់ប្រភេទ</p>
                <p className="text-xs text-gray-600">អាសយដ្ឋាន៖ ផ្លូវជាតិលេខ ៣ សង្កាត់ចោមចៅ ខណ្ឌពោធិ៍សែនជ័យ រាជធានីភ្នំពេញ</p>
                <p className="text-xs font-bold text-gray-800 mt-0.5">ទូរស័ព្ទ៖ 012 345 678 / 097 999 8888</p>
              </div>
              <div className="text-right">
                <div className="bg-blue-50 text-blue-900 font-black px-3 py-1 rounded-lg inline-block text-xs sm:text-sm mb-1.5 border border-blue-200">
                  វិក្កយបត្រ & ប័ណ្ណដឹកជញ្ជូន (INVOICE & DELIVERY)
                </div>
                <div className="text-xs text-gray-500">លេខវិក្កយបត្រ: <span className="font-mono font-bold text-gray-900">{sale.invoice_no}</span></div>
                <div className="text-xs text-gray-500">កាលបរិច្ឆេទ: <span className="font-medium text-gray-800">{new Date(sale.created_at || Date.now()).toLocaleDateString('km-KH')}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 p-4 bg-slate-50 rounded-xl text-xs border border-slate-100">
              <div className="space-y-1">
                <span className="font-bold text-gray-500 block uppercase tracking-wider text-[10px]">ព័ត៌មានអតិថិជន / ក្រុមហ៊ុនម៉ៅការ:</span>
                <div className="text-sm font-black text-gray-900">{customerName}</div>
                {customerPhone && <div className="text-gray-700 font-mono">លេខទូរស័ព្ទ: <strong>{customerPhone}</strong></div>}
              </div>
              <div className="space-y-1">
                <span className="font-bold text-gray-500 block uppercase tracking-wider text-[10px]">ការដ្ឋានសំណង់គោលដៅ / ទីតាំងដឹក:</span>
                <div className="text-sm font-black text-gray-900">{customerAddress}</div>
                <div className="text-gray-700">អ្នកដឹកជញ្ជូន: <strong>{driverName}</strong></div>
              </div>
            </div>

            <table className="w-full my-4 border-collapse text-xs">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-2.5 border border-blue-900 text-center w-12 font-bold">ល.រ</th>
                  <th className="p-2.5 border border-blue-900 text-left font-bold">បរិយាយមុខទំនិញ</th>
                  <th className="p-2.5 border border-blue-900 text-center w-20 font-bold">ឯកតា</th>
                  <th className="p-2.5 border border-blue-900 text-center w-20 font-bold">បរិមាណ</th>
                  <th className="p-2.5 border border-blue-900 text-right w-24 font-bold">តម្លៃឯកតា ($)</th>
                  <th className="p-2.5 border border-blue-900 text-right w-28 font-bold">ថ្លៃសរុប ($)</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50/50">
                    <td className="p-2.5 text-center border-x border-gray-200 font-bold text-gray-500">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-gray-900 border-x border-gray-200">{item.nameKh}</td>
                    <td className="p-2.5 text-center border-x border-gray-200 font-semibold text-gray-700">{item.unitName}</td>
                    <td className="p-2.5 text-center border-x border-gray-200 font-black text-blue-700">{item.quantity}</td>
                    <td className="p-2.5 text-right border-x border-gray-200 font-mono">${item.unitPriceUsd.toFixed(2)}</td>
                    <td className="p-2.5 text-right border-x border-gray-200 font-mono font-black text-gray-900">${item.totalUsd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end my-4">
              <div className="w-80 space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between font-black text-sm">
                  <span className="text-gray-800">សរុបជាដុល្លារ ($):</span>
                  <span className="text-blue-700">${Number(sale.total_amount_usd).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-bold">
                  <span>សរុបជារៀល (៛ 4,100):</span>
                  <span>{Number(sale.total_amount_khr).toLocaleString()} ៛</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5">
                  <span className="text-gray-600">វិធីទូទាត់:</span>
                  <span className="font-bold text-gray-800">{sale.payment_type}</span>
                </div>
                {sale.payment_type === 'CREDIT' && (
                  <div className="flex justify-between font-black text-red-600 pt-1.5 border-t border-gray-200 text-sm">
                    <span>នៅជំពាក់ (Credit):</span>
                    <span>${Number(sale.debt_amount_usd).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-10 pb-4 text-center text-xs">
              <div>
                <p className="font-bold text-gray-800">អ្នកចេញទំនិញ</p>
                <p className="text-[10px] text-gray-500">(Warehouse / Store Issuer)</p>
                <div className="h-16"></div>
                <p className="border-t border-gray-400 pt-1 font-semibold text-gray-700">ឈ្មោះ និងហត្ថលេខា</p>
              </div>

              <div>
                <p className="font-bold text-gray-800">អ្នកដឹកជញ្ជូន</p>
                <p className="text-[10px] text-gray-500">(Driver / Delivery Person)</p>
                <div className="h-16"></div>
                <p className="border-t border-gray-400 pt-1 font-semibold text-gray-700">{driverName}</p>
              </div>

              <div>
                <p className="font-bold text-gray-800">មេការទទួលទំនិញ</p>
                <p className="text-[10px] text-gray-500">(Site Foreman / Receiver)</p>
                <div className="h-16"></div>
                <p className="border-t border-gray-400 pt-1 font-semibold text-gray-700">ឈ្មោះ និងហត្ថលេខា</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}