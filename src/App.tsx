import OwnerDemo from "./pages/owner-demo";
import BuyerDemo from "./pages/buyer-demo";

function App() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <OwnerDemo />
      <BuyerDemo />
    </div>
  );
}

export default App;