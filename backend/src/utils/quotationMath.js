/**
 * Helper to calculate line amounts and grand total for quotation items.
 *
 * Rules:
 * Base Amount = Quantity * Unit Price
 * Discount Amount = Base Amount * (Discount % / 100)
 * Amount After Discount = Base Amount - Discount Amount
 * GST Amount = Amount After Discount * (GST % / 100)
 * Line Amount = Amount After Discount + GST Amount
 * Grand Total = SUM(Line Amount)
 */

function calculateQuotationItem(item) {
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unit_price);
  const discountPercent = Number(item.discount_percent || 0);
  const gstPercent = Number(item.gst_percent || 18);

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  if (unitPrice < 0) {
    throw new Error('Unit price cannot be negative');
  }
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }
  if (gstPercent < 0 || gstPercent > 100) {
    throw new Error('GST percentage must be between 0 and 100');
  }

  const baseAmount = quantity * unitPrice;
  const discountAmount = baseAmount * (discountPercent / 100);
  const amountAfterDiscount = baseAmount - discountAmount;
  const gstAmount = amountAfterDiscount * (gstPercent / 100);
  const lineAmount = Number((amountAfterDiscount + gstAmount).toFixed(2));

  return {
    product_id: Number(item.product_id),
    quantity,
    unit_price: unitPrice,
    discount_percent: discountPercent,
    gst_percent: gstPercent,
    line_amount: lineAmount,
  };
}

function calculateQuotationGrandTotal(calculatedItems) {
  const total = calculatedItems.reduce((acc, curr) => acc + curr.line_amount, 0);
  return Number(total.toFixed(2));
}

module.exports = {
  calculateQuotationItem,
  calculateQuotationGrandTotal,
};
