// frontend/src/components/admin/inbound_orders/AddBarcode.jsx
import React from 'react';
import JsBarcode from 'jsbarcode';

const AddBarcode = ({ partNumber, isDarkMode }) => {
  const generateBarcode = (partNumber) => {
    if (!partNumber) return null;
    
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, partNumber, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 12,
        background: isDarkMode ? '#1f2937' : '#ffffff',
        lineColor: isDarkMode ? '#ffffff' : '#000000'
      });
      return canvas.toDataURL();
    } catch (error) {
      console.error('Barcode generation failed:', error);
      return null;
    }
  };

  const barcodeDataURL = generateBarcode(partNumber);

  if (!barcodeDataURL) {
    return <span className="text-gray-500">No barcode</span>;
  }

  return (
    <div className="flex flex-col items-center">
      <img 
        src={barcodeDataURL} 
        alt={`Barcode for ${partNumber}`}
        className="h-12 w-full object-contain"
      />
      <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
        {partNumber}
      </span>
    </div>
  );
};

export default AddBarcode;