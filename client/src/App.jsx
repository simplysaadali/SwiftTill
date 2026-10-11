import { useEffect, useState } from "react";
import axios from "axios";
import Receipt from "./Receipt.jsx";

const money = (n) => `$${Number(n).toFixed(2)}`;

export default function App() {
  const [form, setForm] = useState({ name: "", price: "", quantity: "1" });
  const [cart, setCart] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const price = parseFloat(form.price);
  const qty = parseInt(form.quantity, 10);
  const linePreview = price >= 0 && qty >= 1 ? price * qty : 0;
  const grandTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const loadOrders = () =>
    axios.get("/api/orders").then((r) => setOrders(r.data)).catch(() => {});

  useEffect(() => { loadOrders(); }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addItem = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !(price >= 0) || !(qty >= 1)) {
      setError("Enter an item name, a price, and a quantity of at least 1.");
      return;
    }
    setError("");
    setCart([...cart, { id: Date.now(), name: form.name.trim(), price, quantity: qty }]);
    setForm({ name: "", price: "", quantity: "1" });
  };

  const removeItem = (id) => setCart(cart.filter((i) => i.id !== id));

  const checkout = async () => {
    try {
      const { data } = await axios.post("/api/orders", { items: cart });
      setReceipt(data);
      setCart([]);
      loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Could not place the order.");
    }
  };

  return (
    <div className="app">
      <header className="top">
        <h1>SwiftTill</h1>
        <span>Point of sale</span>
      </header>

      <main className="grid">
        <section className="panel entry">
          <h2>Add an item</h2>
          <form onSubmit={addItem}>
            <label>
              Item name
              <input name="name" value={form.name} onChange={change} placeholder="Espresso" />
            </label>
            <div className="row">
              <label>
                Price
                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={change} placeholder="0.00" />
              </label>
              <label>
                Quantity
                <input name="quantity" type="number" min="1" step="1" value={form.quantity} onChange={change} />
              </label>
            </div>
            <div className="preview">
              <span>Item total</span>
              <strong>{money(linePreview)}</strong>
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn primary" type="submit">Add to order</button>
          </form>
        </section>

        <section className="panel cart">
          <h2>Current order</h2>
          {cart.length === 0 ? (
            <p className="empty">No items yet. Add one on the left to start an order.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th><th /></tr>
              </thead>
              <tbody>
                {cart.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td className="num">{money(i.price)}</td>
                    <td className="num">{i.quantity}</td>
                    <td className="num">{money(i.price * i.quantity)}</td>
                    <td><button className="link" onClick={() => removeItem(i.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="grand">
            <span>Grand total</span>
            <strong>{money(grandTotal)}</strong>
          </div>
          <button className="btn accent" disabled={!cart.length} onClick={checkout}>
            Place order and print receipt
          </button>
        </section>
      </main>

      {orders.length > 0 && (
        <section className="panel history">
          <h2>Recent orders</h2>
          <ul>
            {orders.map((o) => (
              <li key={o._id}>
                <span className="mono">{o.receiptNo}</span>
                <span>{new Date(o.createdAt).toLocaleString()}</span>
                <span className="mono">{money(o.grandTotal)}</span>
                <button className="link" onClick={() => setReceipt(o)}>View receipt</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {receipt && <Receipt order={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
