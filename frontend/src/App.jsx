import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ConstructionPOS from './components/ConstructionPOS';
import ProductManager from './components/ProductManager';
import StockInAndSuppliers from './components/StockInAndSuppliers';
import StockAdjustmentAndHistory from './components/StockAdjustmentAndHistory';
import DailyCloseAndReports from './components/DailyCloseAndReports';
import RolePermissionManager from './components/RolePermissionManager';
import PrintInvoice from './components/PrintInvoice';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  
  const [printData, setPrintData] = useState(null);
  const [printType, setPrintType] = useState('A4');

  const handleOpenPrint = (data) => {
    setPrintData(data);
    setPrintType('A4');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && <Dashboard onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'pos' && <ConstructionPOS onPrintRequest={handleOpenPrint} />}
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'stock-in' && <StockInAndSuppliers />}
        {activeTab === 'adjustments' && <StockAdjustmentAndHistory />}
        {activeTab === 'reports' && <DailyCloseAndReports />}
        {activeTab === 'permissions' && <RolePermissionManager />}
      </main>

      {/* ផ្ទាំង Popup សម្រាប់ព្រីនវិក្កយបត្រ */}
      {printData && (
        <PrintInvoice
          data={printData}
          type={printType}
          onClose={() => setPrintData(null)}
        />
      )}

      <footer className="bg-white border-t border-gray-200 py-3.5 text-center text-xs text-gray-500 print:hidden mt-auto">
        ប្រព័ន្ធគ្រប់គ្រងការលក់ និងស្តុកគ្រឿងសំណង់ | Inventory System V3 &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}