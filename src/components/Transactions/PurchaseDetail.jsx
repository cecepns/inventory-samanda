import React from 'react';
import { Calendar, User, Building, FileText } from 'lucide-react';

const PurchaseDetail = ({ purchase, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Pembelian #{purchase.id}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">Tanggal:</span>
            <span className="font-medium">{new Date(purchase.purchase_date).toLocaleDateString('id-ID')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">Supplier:</span>
            <span className="font-medium">{purchase.supplier_name || 'Tanpa Supplier'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">User:</span>
            <span className="font-medium">{purchase.user_name}</span>
          </div>
        </div>
        {purchase.notes && (
          <div className="mt-3 flex items-start space-x-2">
            <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <span className="text-gray-600 text-sm">Catatan:</span>
              <p className="text-sm font-medium">{purchase.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Detail Item</h4>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produk</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Jumlah</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Harga Satuan</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchase.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800 font-medium">{item.product_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 font-medium text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-800">Total Pembelian:</span>
          <span className="text-xl font-bold text-green-600">{formatCurrency(purchase.total_amount)}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};

export default PurchaseDetail;