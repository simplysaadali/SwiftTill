import { useEffect, useState } from "react";
import api from "./api.js";
import Auth from "./Auth.jsx";
import Receipt from "./Receipt.jsx";

const money = (n) => `$${Number(n).toFixed(2)}`;

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authStatus, setAuthStatus] = useState("checking");
  const [form, setForm] = useState({ name: "", price: "", quantity: "1" });
  const [inventoryForm, setInventoryForm] = useState({ name: "", price: "" });
  const [cart, setCart] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState("billing");
  const [error, setError] = useState("");
  const [inventoryError, setInventoryError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [inventoryDeleteError, setInventoryDeleteError] = useState("");

  const price = parseFloat(form.price);
  const qty = parseInt(form.quantity, 10);
  const linePreview = price >= 0 && qty >= 1 ? price * qty : 0;
  const grandTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const loadOrders = () =>
    api.get("/api/orders").then((r) => setOrders(r.data)).catch(() => {});

  const loadItems = () =>
    api.get("/api/items").then((r) => setItems(r.data)).catch(() => {});

  useEffect(() => {
    if (!localStorage.getItem("swifttill_token")) {
      setAuthStatus("ready");
      return;
    }
    api.get("/api/auth/me")
      .then(({ data }) => setAuthUser(data.user))
      .catch(() => localStorage.removeItem("swifttill_token"))
      .finally(() => setAuthStatus("ready"));
  }, []);

  useEffect(() => {
    if (!authUser) return;
    setOrders([]);
    setItems([]);
    setCart([]);
    setReceipt(null);
    loadOrders();
    loadItems();
  }, [authUser]);

  const change = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const match = items.find((item) => item.name.toLowerCase() === value.trim().toLowerCase());
      setForm((current) => ({ ...current, name: value, price: match ? String(match.price) : "" }));
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveInventoryItem = async (name, itemPrice) => {
    const { data: savedItem } = await api.post("/api/items", { name, price: itemPrice });
    setItems((current) => [
      ...current.filter((item) => item._id !== savedItem._id),
      savedItem,
    ].sort((a, b) => a.name.localeCompare(b.name)));
    return savedItem;
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !(price >= 0) || !(qty >= 1)) {
      setError("Enter an item name, a price, and a quantity of at least 1.");
      return;
    }
    try {
      const savedItem = await saveInventoryItem(form.name.trim(), price);
      setError("");
      setCart((current) => [...current, {
        id: Date.now(), name: savedItem.name, price: savedItem.price, quantity: qty,
      }]);
      setForm({ name: "", price: "", quantity: "1" });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the inventory item.");
    }
  };

  const addInventoryItem = async (e) => {
    e.preventDefault();
    const itemPrice = Number(inventoryForm.price);
    if (!inventoryForm.name.trim() || !Number.isFinite(itemPrice) || itemPrice < 0) {
      setInventoryError("Enter an item name and a valid price.");
      return;
    }
    try {
      await saveInventoryItem(inventoryForm.name.trim(), itemPrice);
      setInventoryForm({ name: "", price: "" });
      setInventoryError("");
    } catch (err) {
      setInventoryError(err.response?.data?.message || "Could not save the inventory item.");
    }
  };

  const deleteInventoryItem = async (item) => {
    if (!window.confirm(`Delete ${item.name} from inventory?`)) return;
    try {
      await api.delete(`/api/items/${item._id}`);
      setItems((current) => current.filter((entry) => entry._id !== item._id));
      setInventoryDeleteError("");
    } catch (err) {
      setInventoryDeleteError(err.response?.data?.message || "Could not delete the inventory item.");
    }
  };

  const deleteOrder = async (order) => {
    if (!window.confirm(`Delete receipt ${order.receiptNo}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/orders/${order._id}`);
      setOrders((current) => current.filter((entry) => entry._id !== order._id));
      setReceipt((current) => current?._id === order._id ? null : current);
      setHistoryError("");
    } catch (err) {
      setHistoryError(err.response?.data?.message || "Could not delete the receipt.");
    }
  };

  const removeItem = (id) => setCart(cart.filter((i) => i.id !== id));

  const checkout = async () => {
    try {
      const { data } = await api.post("/api/orders", { items: cart });
      setReceipt(data);
      setCart([]);
      loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Could not place the order.");
    }
  };

  if (authStatus === "checking") return <div className="auth-loading" aria-label="Checking your session" />;
  if (!authUser) return <Auth onAuthenticated={(user) => { setAuthUser(user); setAuthStatus("ready"); }} />;

  const signOut = () => {
    localStorage.removeItem("swifttill_token");
    setAuthUser(null);
    setPage("billing");
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><h1>SwiftTill</h1><span>Point of sale</span></div>
        <nav aria-label="Main navigation">
          <button className={page === "billing" ? "nav-button active" : "nav-button"} onClick={() => setPage("billing")}>Billing</button>
          <button className={page === "inventory" ? "nav-button active" : "nav-button"} onClick={() => setPage("inventory")}>Inventory <span>{items.length}</span></button>
        </nav>
      </aside>

      <div className="workspace">
        <header className="top">
          <h2>{page === "billing" ? "Billing" : "Inventory"}</h2>
          <span>{page === "billing" ? "Create a customer order" : `${items.length} items in catalog`}</span>
          <div className="account-menu"><span>{authUser.name || "Account"}</span><button className="action-button" onClick={signOut}>Sign out</button></div>
        </header>

        {page === "billing" ? <main className="grid">
        <section className="panel entry">
          <h2>Add an item</h2>
          <form onSubmit={addItem}>
            <label>
              Item name
              <input name="name" value={form.name} onChange={change} placeholder="Espresso" list="inventory-items" autoComplete="off" />
              <datalist id="inventory-items">
                {items.map((item) => <option key={item._id} value={item.name} />)}
              </datalist>
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
      </main> : (
        <main className="inventory-layout">
          <section className="panel inventory-add">
            <h2>Add inventory item</h2>
            <form onSubmit={addInventoryItem}>
              <label>
                Item name
                <input
                  value={inventoryForm.name}
                  onChange={(e) => setInventoryForm((current) => ({ ...current, name: e.target.value }))}
                  placeholder="Espresso"
                />
              </label>
              <label>
                Unit price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={inventoryForm.price}
                  onChange={(e) => setInventoryForm((current) => ({ ...current, price: e.target.value }))}
                  placeholder="0.00"
                />
              </label>
              {inventoryError && <p className="error">{inventoryError}</p>}
              <button className="btn primary" type="submit">Add to inventory</button>
            </form>
          </section>
          <section className="panel inventory-list">
            <h2>Available items</h2>
            {inventoryDeleteError && <p className="error">{inventoryDeleteError}</p>}
            {items.length === 0 ? (
              <p className="empty">No items in inventory yet.</p>
            ) : (
              <table>
                <thead><tr><th>Item</th><th>Unit price</th><th className="actions-heading">Action</th></tr></thead>
                <tbody>{items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td className="num">{money(item.price)}</td>
                    <td className="actions-cell"><button className="action-button danger" onClick={() => deleteInventoryItem(item)}>Delete</button></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </section>
        </main>
      )}

      {page === "billing" && orders.length > 0 && (
        <section className="panel history">
          <h2>Recent orders</h2>
          {historyError && <p className="error">{historyError}</p>}
          <ul>
            {orders.map((o) => (
              <li key={o._id}>
                <span className="mono">{o.receiptNo}</span>
                <span>{new Date(o.createdAt).toLocaleString()}</span>
                <span className="mono">{money(o.grandTotal)}</span>
                <div className="history-actions">
                  <button className="action-button" onClick={() => setReceipt(o)}>View receipt</button>
                  <button className="action-button danger" onClick={() => deleteOrder(o)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {receipt && <Receipt order={receipt} onClose={() => setReceipt(null)} />}
      </div>
    </div>
  );
}
