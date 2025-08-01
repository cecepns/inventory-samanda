import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { reportAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [stockReport, setStockReport] = useState([]);
  const [stockInReport, setStockInReport] = useState([]);
  const [stockOutReport, setStockOutReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    if (activeTab === 'stock') {
      fetchStockReport();
    } else if (activeTab === 'stock-in') {
      fetchStockInReport();
    } else if (activeTab === 'stock-out') {
      fetchStockOutReport();
    }
  }, [activeTab]);

  const fetchStockReport = async () => {
    setLoading(true);
    try {
      const response = await reportAPI.getStockReport();
      setStockReport(response.data.data);
    } catch (error) {
      console.error('Error fetching stock report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockInReport = async () => {
    setLoading(true);
    try {
      const response = await reportAPI.getStockInReport(dateRange.start_date, dateRange.end_date);
      setStockInReport(response.data.data);
    } catch (error) {
      console.error('Error fetching stock in report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockOutReport = async () => {
    setLoading(true);
    try {
      const response = await reportAPI.getStockOutReport(dateRange.start_date, dateRange.end_date);
      setStockOutReport(response.data.data);
    } catch (error) {
      console.error('Error fetching stock out report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const applyDateFilter = () => {
    if (activeTab === 'stock-in') {
      fetchStockInReport();
    } else if (activeTab === 'stock-out') {
      fetchStockOutReport();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const generatePDF = (reportType, data) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Toko Samanda', 20, 20);
    doc.setFontSize(14);
    
    let title = '';
    let columns = [];
    let rows = [];
    
    if (reportType === 'stock') {
      title = 'Laporan Persediaan Barang';
      columns = ['Nama Produk', 'SKU', 'Kategori', 'Stok'];
      rows = data.map(item => [
        item.name,
        item.sku,
        item.category_name || '-',
        `${item.current_stock} unit`
      ]);
    } else if (reportType === 'stock-in') {
      title = 'Laporan Barang Masuk';
      if (dateRange.start_date && dateRange.end_date) {
        title += ` (${dateRange.start_date} - ${dateRange.end_date})`;
      }
      columns = ['Tanggal', 'Produk', 'SKU', 'Jumlah', 'Harga', 'Subtotal', 'Supplier'];
      rows = data.map(item => [
        new Date(item.purchase_date).toLocaleDateString('id-ID'),
        item.product_name,
        item.sku,
        item.quantity,
        formatCurrency(item.unit_price),
        formatCurrency(item.subtotal),
        item.supplier_name || '-'
      ]);
    } else if (reportType === 'stock-out') {
      title = 'Laporan Barang Keluar';
      if (dateRange.start_date && dateRange.end_date) {
        title += ` (${dateRange.start_date} - ${dateRange.end_date})`;
      }
      columns = ['Tanggal', 'Produk', 'SKU', 'Jumlah', 'Harga', 'Subtotal', 'Pelanggan'];
      rows = data.map(item => [
        new Date(item.sale_date).toLocaleDateString('id-ID'),
        item.product_name,
        item.sku,
        item.quantity,
        formatCurrency(item.unit_price),
        formatCurrency(item.subtotal),
        item.customer_name || '-'
      ]);
    }
    
    doc.text(title, 20, 35);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 20, 45);
    
    // Table
    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 55,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255
      }
    });
    
    // Save
    doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const tabs = [
    { id: 'stock', label: 'Persediaan Barang', icon: Package },
    { id: 'stock-in', label: 'Barang Masuk', icon: TrendingUp },
    { id: 'stock-out', label: 'Barang Keluar', icon: TrendingDown }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Laporan</h1>
            <p className="text-gray-600">Laporan persediaan dan transaksi barang</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Filter for Stock In/Out */}
      {(activeTab === 'stock-in' || activeTab === 'stock-out') && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                name="start_date"
                value={dateRange.start_date}
                onChange={handleDateRangeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                name="end_date"
                value={dateRange.end_date}
                onChange={handleDateRangeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={applyDateFilter}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h2>
            <button
              onClick={() => {
                if (activeTab === 'stock') generatePDF('stock', stockReport);
                else if (activeTab === 'stock-in') generatePDF('stock-in', stockInReport);
                else if (activeTab === 'stock-out') generatePDF('stock-out', stockOutReport);
              }}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <LoadingSpinner size="large" />
          ) : (
            <div className="overflow-x-auto">
              {activeTab === 'stock' && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama Produk</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Kategori</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Stok</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Batch Tertua</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Batch Terbaru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockReport.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.category_name || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.current_stock === 0 
                              ? 'bg-red-100 text-red-800' 
                              : item.current_stock < 10
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.current_stock} unit
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.oldest_batch_date ? new Date(item.oldest_batch_date).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.newest_batch_date ? new Date(item.newest_batch_date).toLocaleDateString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'stock-in' && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produk</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Jumlah</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Harga</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Subtotal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockInReport.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(item.purchase_date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">{item.product_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium text-right">{formatCurrency(item.subtotal)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.supplier_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'stock-out' && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produk</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Jumlah</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Harga</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Subtotal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pelanggan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockOutReport.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(item.sale_date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">{item.product_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium text-right">{formatCurrency(item.subtotal)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.customer_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;