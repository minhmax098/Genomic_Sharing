// import OwnerDemo from "./pages/owner-demo";
// import BuyerDemo from "./pages/buyer-demo";

// function App() {
//   return (
//     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
//       <OwnerDemo />
//       <BuyerDemo />
//     </div>
//   );
// }

// export default App;
import { useState } from "react";
import OwnerDemo from "./pages/owner-demo";
import BuyerDemo from "./pages/buyer-demo";
import { getContractAddresses } from "./lib/blockchain";
import "./styles/app.css";

type TabKey = "admin" | "owner" | "buyer";

function AdminOverview() {
  const { GDMREGISTRY_ADDRESS, SGDNFT_ADDRESS } = getContractAddresses();

  return (
    <div className="demo-page">
      <div className="demo-header">
        <div>
          <p className="section-tag">Admin dashboard</p>
          <h2>System overview for genomic data sharing</h2>
          <p className="section-copy">
            Manage the demo environment, review contract endpoints, and monitor
            the overall Owner → Buyer access flow.
          </p>
        </div>
        <div className="pill success">Network: Sepolia</div>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <span>Active network</span>
          <strong>Ethereum Sepolia</strong>
        </div>
        <div className="info-card">
          <span>GDMRegistry</span>
          <strong className="mono-text">{GDMREGISTRY_ADDRESS}</strong>
        </div>
        <div className="info-card">
          <span>SGDNFT</span>
          <strong className="mono-text">{SGDNFT_ADDRESS}</strong>
        </div>
      </div>

      <div className="demo-grid">
        <section className="card">
          <h3>Role responsibilities</h3>
          <div className="feature-grid admin-grid">
            <div className="feature-card">
              <h4>Admin</h4>
              <p>
                Deploy contracts, configure addresses, and keep the demo network
                and backend ready.
              </p>
            </div>

            <div className="feature-card">
              <h4>Owner</h4>
              <p>
                Connect wallet, prepare TACo encryption, and upload encrypted
                payload for a specific token.
              </p>
            </div>

            <div className="feature-card">
              <h4>Buyer</h4>
              <p>
                Check public record, purchase full access, load encrypted data,
                and decrypt only if access condition is satisfied.
              </p>
            </div>
          </div>
        </section>

        <aside className="card">
          <h3>Suggested admin workflow</h3>
          <ol className="flow-list">
            <li>Deploy and verify GDMRegistry + SGDNFT contracts</li>
            <li>Set contract addresses in the frontend environment</li>
            <li>Run backend server for temporary messageKit storage</li>
            <li>Test Owner encryption flow with a demo token ID</li>
            <li>Validate Buyer purchase and TACo decryption flow</li>
          </ol>

          <div className="mini-note">
            This Admin tab is currently an overview panel. Later you can add:
            minting, registry updates, access logs, token metadata management,
            and demo reset actions.
          </div>
        </aside>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("admin");

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-badge">SG</div>
            <div>
              <div className="brand-title">Secure Genomic Data</div>
              <div className="brand-subtitle">Blockchain Demo Platform</div>
            </div>
          </div>

          <nav className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
            >
              Admin
            </button>
            <button
              className={`nav-tab ${activeTab === "owner" ? "active" : ""}`}
              onClick={() => setActiveTab("owner")}
            >
              Owner
            </button>
            <button
              className={`nav-tab ${activeTab === "buyer" ? "active" : ""}`}
              onClick={() => setActiveTab("buyer")}
            >
              Buyer
            </button>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-kicker">Secure sharing for genomic data</p>
            <h1 className="hero-title">
              Trust Management for Genomic Data Sharing using Blockchain and
              Smart Contracts
            </h1>
            <p className="hero-text">
              A cleaner web UI inspired by ThingSpeak, redesigned for Admin,
              Owner, and Buyer workflows with TACo encryption, NFT-based access,
              and on-chain purchase validation.
            </p>

            <div className="hero-actions">
              <button className="primary-btn" onClick={() => setActiveTab("owner")}>
                Open Owner Flow
              </button>
              <button className="ghost-btn" onClick={() => setActiveTab("buyer")}>
                Open Buyer Flow
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-dashboard">
              <div className="dashboard-card bars">
                <span>Ownership Events</span>
              </div>
              <div className="dashboard-card lines">
                <span>Access Requests</span>
              </div>
              <div className="dashboard-card grid">
                <span>TACo Decryption</span>
              </div>
              <div className="dashboard-card split">
                <span>Buyer Activity</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="workspace">
        <div className="feature-grid top-feature-grid">
          <div className="feature-card">
            <h4>Role-based navigation</h4>
            <p>
              Separate Admin, Owner, and Buyer tabs so the demo is easier to
              present to your professor.
            </p>
          </div>

          <div className="feature-card">
            <h4>Cleaner dashboard layout</h4>
            <p>
              Cards, spacing, status pills, and grouped actions make the flow
              much easier to read.
            </p>
          </div>

          <div className="feature-card">
            <h4>Same backend logic</h4>
            <p>
              Contract calls, wallet connect, purchase, server fetch, and TACo
              encryption/decryption remain unchanged.
            </p>
          </div>
        </div>

        <section className="panel-surface">
          {activeTab === "admin" && <AdminOverview />}
          {activeTab === "owner" && <OwnerDemo />}
          {activeTab === "buyer" && <BuyerDemo />}
        </section>
      </main>
    </div>
  );
}

export default App;