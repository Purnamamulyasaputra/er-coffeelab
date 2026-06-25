"use client"

import * as React from "react"

export function formatMoney(amount: number) {
  return "Rp " + Number(amount).toLocaleString("id-ID")
}

export function ReceiptPrint({
  transaction,
  branchName,
  cashierName,
  receiptId
}: {
  transaction: any,
  branchName: string,
  cashierName: string,
  receiptId: string
}) {
  if (!transaction) return null;

  const date = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div
      id={receiptId}
      className="absolute top-[-9999px] left-[-9999px] w-[340px] bg-white text-black font-sans text-[14px] leading-tight p-6 print:absolute print:top-0 print:left-0 print:m-0 print:p-2 print:w-[80mm] print:block"
      style={{
        boxSizing: 'border-box'
      }}
    >
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold mb-1">ER COFFEELAB</h1>
        <p className="text-[10px] uppercase">{branchName || 'Cabang Utama'}</p>
      </div>

      <div className="mb-3 border-b border-black border-dashed pb-3">
        <div className="flex justify-between">
          <span>Tgl:</span>
          <span>{date}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>{cashierName || 'Admin'}</span>
        </div>
        <div className="flex justify-between">
          <span>Tipe:</span>
          <span>{transaction.orderType === 'DINE_IN' ? 'DINE-IN' : 'TAKE-AWAY'}</span>
        </div>
        {transaction.orderType === 'DINE_IN' && transaction.tableNumber && (
          <div className="flex justify-between">
            <span>Meja:</span>
            <span>{transaction.tableNumber}</span>
          </div>
        )}
      </div>

      <div className="mb-3 border-b border-black border-dashed pb-2">
        {transaction.items && transaction.items.map((item: any, i: number) => (
          <div key={i} className="mb-2">
            <div className="font-semibold">{item.productName || item.product_name}</div>
            <div className="flex justify-between text-[11px]">
              <span>{item.quantity} x {formatMoney(item.unitPrice || item.price || item.subtotal / item.quantity)}</span>
              <span>{formatMoney(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3 border-b border-black border-dashed pb-2 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatMoney(transaction.subtotal)}</span>
        </div>
        {transaction.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Diskon:</span>
            <span>-{formatMoney(transaction.discountAmount)}</span>
          </div>
        )}
        {transaction.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Pajak (Tax):</span>
            <span>{formatMoney(transaction.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-[14px] font-bold mt-3 pt-1 border-t border-dashed border-black">
          <span>TOTAL:</span>
          <span>{formatMoney(transaction.totalAmount || transaction.grand_total)}</span>
        </div>
      </div>

      <div className="mb-4 text-[11px] space-y-1">
        <div className="flex justify-between">
          <span>Bayar via {
            !transaction.paymentMethod || transaction.paymentMethod === 'CASH' ? 'Tunai' :
            transaction.paymentMethod === 'QRIS' ? 'QRIS' :
            transaction.paymentMethod.includes('_VA') ? `Virtual Account (${transaction.paymentMethod.replace('_VA', '')})` :
            ['OVO', 'DANA', 'SHOPEEPAY', 'LINKAJA'].includes(transaction.paymentMethod) ? `E-Wallet (${transaction.paymentMethod})` :
            transaction.paymentMethod.replace(/_/g, ' ')
          }:</span>
          <span>{formatMoney(transaction.cashAmount || transaction.totalAmount || transaction.grand_total)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Kembali:</span>
          <span>{formatMoney(Math.max(0, transaction.cashAmount - (transaction.totalAmount || transaction.grand_total)))}</span>
        </div>
      </div>

      <div className="text-center text-[10px] mt-6">
        <p>Terima kasih atas kunjungannya!</p>
        <p>Silakan datang kembali</p>
      </div>
    </div>
  )
}
