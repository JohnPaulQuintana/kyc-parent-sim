import { useEffect, useRef, useState } from "react";
import { X, CheckCircle, AlertCircle, Clock, Copy, Download } from "lucide-react";

export default function App() {
  const iframeRef = useRef(null);
  const [payload, setPayload] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("preview");
  const [processing, setProcessing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const showToast = (message, type = "info") => {
    setNotification({ message, type });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const log = (msg, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp,
      message: msg,
      type
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const handleCopyJson = () => {
    if (payload) {
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      showToast("JSON copied to clipboard", "success");
    }
  };

  const handleDownloadImages = () => {
    // Implement image download logic here
    showToast("Images download initiated", "info");
  };

  useEffect(() => {
    const onMessage = (event) => {
      // 🔐 In production, lock this down
      // if (event.origin !== "https://kyc.levidyo.com") return;

      const data = event.data;
      if (!data) return;

      if (data.type === "createDocument") {
        log("Received createDocument from iframe", "success");
        setPayload(data.payload || {});
        setProcessing(true);

        // ✅ ACK IMMEDIATELY
        try {
          event.source.postMessage(
            { type: "createDocumentAck" },
            event.origin || "*"
          );
          log("Sent ACK to iframe", "info");
          showToast("Document received, processing...", "info");
        } catch (e) {
          log("ACK failed: " + e.message, "error");
          showToast("ACK failed", "error");
        }

        // ⏳ Simulate backend processing
        log("Simulating backend upload (2s)", "info");
        setTimeout(() => {
          try {
            event.source.postMessage(
              {
                type: "createDocumentResponse",
                status: "success",
                message: "Documents uploaded and queued for review",
                referenceId: "REF-" + Date.now(),
              },
              event.origin || "*"
            );
            log("Sent success response to iframe", "success");
            showToast("Document processed successfully", "success");
            setProcessing(false);
          } catch (err) {
            log("Response postMessage failed: " + err.message, "error");
            showToast("Response failed", "error");
            setProcessing(false);
          }
        }, 2000);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div style={styles.body}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.brand}>
            <div style={styles.logo}>KYC</div>
            <div>
              <h1 style={styles.title}>KYC Verification Portal</h1>
              <p style={styles.subtitle}>Secure document verification system</p>
            </div>
          </div>
          <div style={styles.status}>
            <div style={styles.statusItem}>
              <div style={styles.statusLabel}>Status</div>
              <div style={{
                ...styles.statusBadge,
                background: processing ? "#f59e0b" : "#10b981"
              }}>
                {processing ? "Processing" : "Ready"}
              </div>
            </div>
            {payload?.referenceId && (
              <div style={styles.statusItem}>
                <div style={styles.statusLabel}>Reference ID</div>
                <code style={styles.referenceId}>{payload.referenceId}</code>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {showNotification && (
        <div style={{
          ...styles.notification,
          background: notification.type === "error" ? "#ef4444" : 
                     notification.type === "success" ? "#10b981" : "#3b82f6"
        }}>
          <div style={styles.notificationContent}>
            {notification.type === "success" && <CheckCircle size={20} />}
            {notification.type === "error" && <AlertCircle size={20} />}
            {notification.type === "info" && <Clock size={20} />}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setShowNotification(false)}
            style={styles.notificationClose}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <main style={styles.main}>
        {/* Iframe Section */}
        <section style={styles.iframeSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>KYC Verification Interface</h2>
            <div style={styles.iframeControls}>
              <span style={styles.domainBadge}>
                <span style={styles.domainDot} />
                https://kyc.levidyo.com
              </span>
            </div>
          </div>
          <iframe
            ref={iframeRef}
            src="https://kyc.levidyo.com"
            title="KYC iframe"
            allow="camera; microphone"
            style={styles.iframe}
          />
        </section>

        {/* Results Panel */}
        <section style={styles.resultsPanel}>
          <div style={styles.tabs}>
            <button
              onClick={() => setActiveTab("preview")}
              style={{
                ...styles.tab,
                ...(activeTab === "preview" ? styles.tabActive : {})
              }}
            >
              Document Preview
            </button>
            <button
              onClick={() => setActiveTab("payload")}
              style={{
                ...styles.tab,
                ...(activeTab === "payload" ? styles.tabActive : {})
              }}
            >
              Raw Payload
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              style={{
                ...styles.tab,
                ...(activeTab === "logs" ? styles.tabActive : {})
              }}
            >
              System Logs
            </button>
          </div>

          <div style={styles.tabContent}>
            {activeTab === "preview" && (
              <div>
                <div style={styles.previewHeader}>
                  <h3 style={styles.previewTitle}>Captured Documents</h3>
                  <div style={styles.previewActions}>
                    <button 
                      onClick={handleDownloadImages}
                      style={styles.iconButton}
                      title="Download all images"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                <div style={styles.previewGrid}>
                  <PreviewCard 
                    label="Front" 
                    src={payload?.documentFrontImage}
                    status={payload?.documentFrontImage ? "Captured" : "Pending"}
                  />
                  <PreviewCard 
                    label="Back" 
                    src={payload?.documentBackImage}
                    status={payload?.documentBackImage ? "Captured" : "Pending"}
                  />
                  <PreviewCard 
                    label="Other" 
                    src={payload?.documentOtherImage}
                    status={payload?.documentOtherImage ? "Captured" : "Pending"}
                  />
                </div>
              </div>
            )}

            {activeTab === "payload" && (
              <div>
                <div style={styles.payloadHeader}>
                  <h3 style={styles.payloadTitle}>Raw JSON Payload</h3>
                  <button 
                    onClick={handleCopyJson}
                    style={styles.copyButton}
                  >
                    <Copy size={16} />
                    Copy JSON
                  </button>
                </div>
                <div style={styles.codeBlock}>
                  <pre style={styles.pre}>
                    {payload ? JSON.stringify(payload, null, 2) : "No payload received yet."}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === "logs" && (
              <div>
                <div style={styles.logsHeader}>
                  <h3 style={styles.logsTitle}>System Logs</h3>
                  <div style={styles.logStats}>
                    <span style={styles.logStat}>
                      Total: {logs.length}
                    </span>
                    <span style={styles.logStat}>
                      Errors: {logs.filter(l => l.type === "error").length}
                    </span>
                  </div>
                </div>
                <div style={styles.logsContainer}>
                  {logs.length === 0 ? (
                    <div style={styles.emptyLogs}>No logs available</div>
                  ) : (
                    logs.map((log) => (
                      <div 
                        key={log.id} 
                        style={{
                          ...styles.logEntry,
                          borderLeftColor: 
                            log.type === "error" ? "#ef4444" :
                            log.type === "success" ? "#10b981" : "#3b82f6"
                        }}
                      >
                        <div style={styles.logTimestamp}>
                          {log.timestamp}
                        </div>
                        <div style={styles.logMessage}>
                          {log.message}
                        </div>
                        <div style={styles.logType}>
                          {log.type}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function PreviewCard({ label, src, status }) {
  return (
    <div style={styles.previewCard}>
      <div style={styles.previewCardHeader}>
        <span style={styles.previewCardLabel}>{label}</span>
        <span style={{
          ...styles.previewCardStatus,
          color: src ? "#10b981" : "#94a3b8"
        }}>
          {status}
        </span>
      </div>
      <div style={styles.previewCardContent}>
        {src ? (
          <img 
            src={src} 
            alt={label} 
            style={styles.previewImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTRmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NDc0OGIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+";
            }}
          />
        ) : (
          <div style={styles.emptyPreview}>
            <div style={styles.emptyPreviewIcon}>📄</div>
            <span style={styles.emptyPreviewText}>No image</span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  body: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: "#0f172a",
    color: "#f1f5f9",
    minHeight: "100vh",
    margin: 0,
    padding: 0,
  },
  header: {
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    padding: "16px 24px",
  },
  headerContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logo: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
    color: "#fff",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    margin: 0,
    color: "#f8fafc",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: "4px 0 0 0",
  },
  status: {
    display: "flex",
    gap: "24px",
    alignItems: "center",
  },
  statusItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statusLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
  },
  referenceId: {
    background: "#334155",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "monospace",
    color: "#cbd5e1",
  },
  notification: {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 16px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    zIndex: 1000,
    animation: "slideIn 0.3s ease-out",
    maxWidth: "400px",
  },
  notificationContent: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  notificationClose: {
    background: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  iframeSection: {
    background: "#1e293b",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #334155",
  },
  sectionHeader: {
    padding: "16px 24px",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    color: "#f8fafc",
  },
  iframeControls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  domainBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    background: "#334155",
    borderRadius: "20px",
    fontSize: "14px",
    color: "#cbd5e1",
  },
  domainDot: {
    width: "8px",
    height: "8px",
    background: "#10b981",
    borderRadius: "50%",
  },
  iframe: {
    width: "100%",
    height: "calc(100vh - 240px)",
    minHeight: "600px",
    border: "none",
    display: "block",
  },
  resultsPanel: {
    background: "#1e293b",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #334155",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #334155",
    padding: "0 24px",
  },
  tab: {
    padding: "16px 24px",
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    position: "relative",
    transition: "color 0.2s",
  },
  tabActive: {
    color: "#3b82f6",
  },
  tabContent: {
    padding: "24px",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  previewTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    color: "#f8fafc",
  },
  previewActions: {
    display: "flex",
    gap: "8px",
  },
  iconButton: {
    padding: "8px",
    background: "#334155",
    border: "none",
    borderRadius: "6px",
    color: "#cbd5e1",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  previewCard: {
    background: "#0f172a",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #334155",
  },
  previewCardHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewCardLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#f8fafc",
  },
  previewCardStatus: {
    fontSize: "12px",
    fontWeight: "500",
  },
  previewCardContent: {
    padding: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "200px",
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: "200px",
    borderRadius: "4px",
    objectFit: "contain",
  },
  emptyPreview: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    color: "#64748b",
  },
  emptyPreviewIcon: {
    fontSize: "32px",
  },
  emptyPreviewText: {
    fontSize: "14px",
  },
  payloadHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  payloadTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    color: "#f8fafc",
  },
  copyButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  codeBlock: {
    background: "#0f172a",
    borderRadius: "8px",
    overflow: "hidden",
  },
  pre: {
    margin: 0,
    padding: "20px",
    fontSize: "13px",
    lineHeight: "1.5",
    color: "#e2e8f0",
    fontFamily: "Monaco, 'Courier New', monospace",
    overflow: "auto",
    maxHeight: "400px",
  },
  logsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  logsTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    color: "#f8fafc",
  },
  logStats: {
    display: "flex",
    gap: "16px",
  },
  logStat: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  logsContainer: {
    background: "#0f172a",
    borderRadius: "8px",
    border: "1px solid #334155",
    overflow: "hidden",
    maxHeight: "400px",
    overflowY: "auto",
  },
  emptyLogs: {
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },
  logEntry: {
    padding: "12px 16px",
    borderBottom: "1px solid #1e293b",
    borderLeft: "3px solid",
    display: "grid",
    gridTemplateColumns: "120px 1fr 80px",
    gap: "16px",
    alignItems: "center",
    fontSize: "13px",
  },
  logTimestamp: {
    color: "#94a3b8",
    fontFamily: "monospace",
  },
  logMessage: {
    color: "#e2e8f0",
  },
  logType: {
    textAlign: "right",
    textTransform: "uppercase",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.05em",
  },
};

// Add this to your CSS or create a style tag
const globalStyles = `
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
`;