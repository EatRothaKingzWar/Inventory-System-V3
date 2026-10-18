import React from 'react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: '📊 ផ្ទាំងសង្ខេប (Dashboard)' },
    { id: 'pos', label: '🛒 កន្លែងលក់ (POS Sales)' },
    { id: 'products', label: '📦 ទំនិញ (Products & SKU)' },
    { id: 'stock-in', label: '🚚 នាំចូល & Suppliers' },
    { id: 'adjustments', label: '⚖️ កែតម្រូវ & ចលនាស្តុក' },
    { id: 'reports', label: '📈 របាយការណ៍ & ចំណេញខាត' },
    { id: 'permissions', label: '🔐 កំណត់សិទ្ធិ (Tick Box)' }
  ];

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center py-2.5 md:h-16 gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white px-2.5 py-1 rounded-lg font-black text-lg tracking-wider">
            POS
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white">ដេប៉ូគ្រឿងសំណង់ ហេង ហេង</h1>
            <p className="text-[10px] text-slate-400">Inventory Management System V3 (Neon PostgreSQL)</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
