const money = (n) => `$${Number(n).toFixed(2)}`;

export default function Receipt({ order, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="receipt-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="receipt" id="receipt">
          <h3>Till</h3>
          <p className="center small">Thank you for your purchase</p>
          <div className="meta">
            <span>Receipt {order.receiptNo}</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {order.items.map((i, idx) => (
                <tr key={idx}>
                  <td>{i.name}</td>
                  <td className="num">{i.quantity}</td>
                  <td className="num">{money(i.price)}</td>
                  <td className="num">{money(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="sum">
            <span>Total</span>
            <strong>{money(order.grandTotal)}</strong>
          </div>
        </div>
        <div className="actions no-print">
          <button className="btn primary" onClick={() => window.print()}>Print receipt</button>
          <button className="btn ghost" onClick={onClose}>Start new order</button>
        </div>
      </div>
    </div>
  );
}
