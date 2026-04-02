import { useState } from "react";
import OwnerDemo from "./pages/owner-demo";
import BuyerDemo from "./pages/buyer-demo";

function App() {
  const [messageKit, setMessageKit] = useState<unknown | null>(null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <OwnerDemo
        messageKit={messageKit}
        setMessageKit={setMessageKit}
      />
      <BuyerDemo
        messageKit={messageKit}
      />
    </div>
  );
}

export default App;