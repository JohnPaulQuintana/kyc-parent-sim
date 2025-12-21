import { useEffect, useRef, useState } from "react";
import { X, CheckCircle, AlertCircle, Clock, Copy, Download, Menu, Maximize2, Minimize2 } from "lucide-react";

export default function App() {
  const iframeRef = useRef(null);
  const [payload, setPayload] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("preview");
  const [processing, setProcessing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

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
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  const handleCopyJson = () => {
    if (payload) {
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      showToast("JSON copied to clipboard", "success");
    }
  };

  const handleDownloadImages = () => {
    showToast("Images download initiated", "info");
  };

  const toggleIframeFullscreen = () => {
    setIsIframeFullscreen(!isIframeFullscreen);
  };

  const getResponsiveStyle = (mobile, tablet, desktop) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  useEffect(() => {
    const onMessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === "createDocument") {
        log("Received createDocument from iframe", "success");
        setPayload(data.payload || {});
        setProcessing(true);

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
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={styles.mobileMenuButton}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            <div style={styles.logo}>KYC</div>
            <div>
              <h1 style={styles.title}>KYC Verification Portal</h1>
              <p style={styles.subtitle}>Secure document verification system</p>
            </div>
          </div>
          
          {/* Mobile menu overlay */}
          {isMobileMenuOpen && (
            <div style={styles.mobileMenuOverlay}>
              <div style={styles.mobileMenuContent}>
                <div style={styles.mobileMenuHeader}>
                  <h3>Navigation</h3>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={styles.mobileMenuClose}
                  >
                    <X size={24} />
                  </button>
                </div>
                <div style={styles.mobileMenuItems}>
                  <button 
                    onClick={() => { setActiveTab("preview"); setIsMobileMenuOpen(false); }}
                    style={styles.mobileMenuItem}
                  >
                    Document Preview
                  </button>
                  <button 
                    onClick={() => { setActiveTab("payload"); setIsMobileMenuOpen(false); }}
                    style={styles.mobileMenuItem}
                  >
                    Raw Payload
                  </button>
                  <button 
                    onClick={() => { setActiveTab("logs"); setIsMobileMenuOpen(false); }}
                    style={styles.mobileMenuItem}
                  >
                    System Logs
                  </button>
                </div>
              </div>
            </div>
          )}

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
            {payload?.referenceId && !isMobile && (
              <div style={styles.statusItem}>
                <div style={styles.statusLabel}>Reference ID</div>
                <code style={styles.referenceId}>{payload.referenceId}</code>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Toast - Responsive positioning */}
      {showNotification && (
        <div 
          style={{
            ...styles.notification,
            background: notification.type === "error" ? "#ef4444" : 
                       notification.type === "success" ? "#10b981" : "#3b82f6",
            top: isMobile ? "80px" : "20px",
            right: isMobile ? "10px" : "20px",
            left: isMobile ? "10px" : "auto",
            maxWidth: isMobile ? "calc(100% - 20px)" : "400px"
          }}
        >
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
        <section style={{
          ...styles.iframeSection,
          display: isIframeFullscreen && isMobile ? 'none' : 'block'
        }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>KYC Verification Interface</h2>
            <div style={styles.iframeControls}>
              {!isMobile && (
                <span style={styles.domainBadge}>
                  <span style={styles.domainDot} />
                  https://kyc.levidyo.com
                </span>
              )}
              <button 
                onClick={toggleIframeFullscreen}
                style={styles.fullscreenButton}
                title={isIframeFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isIframeFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>
          <iframe
            ref={iframeRef}
            src="https://kyc.levidyo.com"
            title="KYC iframe"
            allow="camera; microphone"
            style={{
              ...styles.iframe,
              height: isIframeFullscreen 
                ? isMobile ? "calc(100vh - 120px)" : "calc(100vh - 160px)"
                : getResponsiveStyle("400px", "500px", "calc(100vh - 240px)")
            }}
          />
          {isMobile && (
            <div style={styles.mobileDomain}>
              <span style={styles.domainDot} />
              https://kyc.levidyo.com
            </div>
          )}
        </section>

        {/* Results Panel - Hidden in fullscreen mobile mode */}
        {(!isIframeFullscreen || !isMobile) && (
          <section style={styles.resultsPanel}>
            {/* Desktop Tabs / Mobile Select */}
            {!isMobile ? (
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
            ) : (
              <div style={styles.mobileTabSelect}>
                <select 
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  style={styles.mobileSelect}
                >
                  <option value="preview">Document Preview</option>
                  <option value="payload">Raw Payload</option>
                  <option value="logs">System Logs</option>
                </select>
              </div>
            )}

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
                  <div style={{
                    ...styles.previewGrid,
                    gridTemplateColumns: getResponsiveStyle(
                      "1fr",
                      "repeat(2, 1fr)",
                      "repeat(auto-fill, minmax(280px, 1fr))"
                    )
                  }}>
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
                      {!isMobile && "Copy JSON"}
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
                              log.type === "success" ? "#10b981" : "#3b82f6",
                            gridTemplateColumns: isMobile ? "1fr" : "120px 1fr 80px",
                            gap: isMobile ? "8px" : "16px",
                            padding: isMobile ? "8px 12px" : "12px 16px"
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
        )}
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
    padding: "12px 16px",
    '@media (minWidth: 768px)': {
      padding: "16px 24px",
    },
  },
  headerContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    '@media (minWidth: 768px)': {
      gap: "16px",
    },
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    '@media (minWidth: 768px)': {
      gap: "16px",
    },
  },
  mobileMenuButton: {
    display: "block",
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "6px",
    '@media (minWidth: 768px)': {
      display: "none",
    },
  },
  mobileMenuOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.95)",
    zIndex: 1000,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "80px",
  },
  mobileMenuContent: {
    background: "#1e293b",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "400px",
    border: "1px solid #334155",
    overflow: "hidden",
  },
  mobileMenuHeader: {
    padding: "16px",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mobileMenuClose: {
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    cursor: "pointer",
    padding: "4px",
  },
  mobileMenuItems: {
    display: "flex",
    flexDirection: "column",
  },
  mobileMenuItem: {
    padding: "16px",
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    textAlign: "left",
    fontSize: "16px",
    cursor: "pointer",
    borderBottom: "1px solid #334155",
    '&:last-child': {
      borderBottom: "none",
    },
    '&:hover': {
      background: "#334155",
    },
  },
  logo: {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#fff",
    '@media (minWidth: 768px)': {
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      fontSize: "20px",
    },
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    color: "#f8fafc",
    '@media (minWidth: 768px)': {
      fontSize: "20px",
    },
  },
  subtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "2px 0 0 0",
    '@media (minWidth: 768px)': {
      fontSize: "14px",
      margin: "4px 0 0 0",
    },
  },
  status: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    '@media (minWidth: 768px)': {
      gap: "24px",
    },
  },
  statusItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statusLabel: {
    fontSize: "10px",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    '@media (minWidth: 768px)': {
      fontSize: "12px",
    },
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#fff",
    '@media (minWidth: 768px)': {
      padding: "6px 12px",
      fontSize: "14px",
    },
  },
  referenceId: {
    background: "#334155",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontFamily: "monospace",
    color: "#cbd5e1",
    '@media (minWidth: 768px)': {
      padding: "6px 12px",
      fontSize: "14px",
    },
  },
  notification: {
    position: "fixed",
    padding: "12px 16px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    zIndex: 1000,
    animation: "slideIn 0.3s ease-out",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  notificationContent: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
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
    flexShrink: 0,
  },
  main: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    '@media (minWidth: 768px)': {
      padding: "24px",
      gap: "24px",
    },
  },
  iframeSection: {
    background: "#1e293b",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #334155",
    '@media (minWidth: 768px)': {
      borderRadius: "12px",
    },
  },
  sectionHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    '@media (minWidth: 768px)': {
      padding: "16px 24px",
    },
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    color: "#f8fafc",
    '@media (minWidth: 768px)': {
      fontSize: "18px",
    },
  },
  iframeControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    '@media (minWidth: 768px)': {
      gap: "12px",
    },
  },
  domainBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    background: "#334155",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#cbd5e1",
    '@media (minWidth: 768px)': {
      padding: "6px 12px",
      fontSize: "14px",
      gap: "8px",
    },
  },
  domainDot: {
    width: "6px",
    height: "6px",
    background: "#10b981",
    borderRadius: "50%",
    '@media (minWidth: 768px)': {
      width: "8px",
      height: "8px",
    },
  },
  mobileDomain: {
    padding: "8px 16px",
    background: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#cbd5e1",
  },
  fullscreenButton: {
    background: "#334155",
    border: "none",
    color: "#cbd5e1",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    '@media (minWidth: 768px)': {
      padding: "8px",
    },
  },
  iframe: {
    width: "100%",
    border: "none",
    display: "block",
  },
  resultsPanel: {
    background: "#1e293b",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #334155",
    '@media (minWidth: 768px)': {
      borderRadius: "12px",
    },
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #334155",
    padding: "0 16px",
    overflowX: "auto",
    '@media (minWidth: 768px)': {
      padding: "0 24px",
    },
  },
  tab: {
    padding: "12px 16px",
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    position: "relative",
    transition: "color 0.2s",
    whiteSpace: "nowrap",
    '@media (minWidth: 768px)': {
      padding: "16px 24px",
    },
  },
  tabActive: {
    color: "#3b82f6",
    '&::after': {
      content: '""',
      position: "absolute",
      bottom: "-1px",
      left: 0,
      right: 0,
      height: "2px",
      background: "#3b82f6",
    },
  },
  mobileTabSelect: {
    padding: "12px 16px",
    borderBottom: "1px solid #334155",
  },
  mobileSelect: {
    width: "100%",
    padding: "10px 12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#f1f5f9",
    fontSize: "14px",
    cursor: "pointer",
  },
  tabContent: {
    padding: "16px",
    '@media (minWidth: 768px)': {
      padding: "24px",
    },
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    '@media (minWidth: 768px)': {
      marginBottom: "24px",
    },
  },
  previewTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    color: "#f8fafc",
    '@media (minWidth: 768px)': {
      fontSize: "18px",
    },
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
    gap: "16px",
    '@media (minWidth: 768px)': {
      gap: "20px",
    },
  },
  previewCard: {
    background: "#0f172a",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #334155",
  },
  previewCardHeader: {
    padding: "10px 12px",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    '@media (minWidth: 768px)': {
      padding: "12px 16px",
    },
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
    padding: "12px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "150px",
    '@media (minWidth: 768px)': {
      padding: "16px",
      minHeight: "200px",
    },
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: "150px",
    borderRadius: "4px",
    objectFit: "contain",
    '@media (minWidth: 768px)': {
      maxHeight: "200px",
    },
  },
  emptyPreview: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
  },
  emptyPreviewIcon: {
    fontSize: "24px",
    '@media (minWidth: 768px)': {
      fontSize: "32px",
    },
  },
  emptyPreviewText: {
    fontSize: "12px",
    '@media (minWidth: 768px)': {
      fontSize: "14px",
    },
  },
  payloadHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    flexWrap: "wrap",
    gap: "8px",
    '@media (minWidth: 768px)': {
      marginBottom: "16px",
    },
  },
  payloadTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    color: "#f8fafc",
    '@media (minWidth: 768px)': {
      fontSize: "18px",
    },
  },
  copyButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
    whiteSpace: "nowrap",
    '@media (minWidth: 768px)': {
      padding: "8px 16px",
    },
  },
  codeBlock: {
    background: "#0f172a",
    borderRadius: "8px",
    overflow: "hidden",
  },
  pre: {
    margin: 0,
    padding: "16px",
    fontSize: "12px",
    lineHeight: "1.5",
    color: "#e2e8f0",
    fontFamily: "Monaco, 'Courier New', monospace",
    overflow: "auto",
    maxHeight: "400px",
    '@media (minWidth: 768px)': {
      padding: "20px",
      fontSize: "13px",
    },
  },
  logsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    flexWrap: "wrap",
    gap: "8px",
    '@media (minWidth: 768px)': {
      marginBottom: "16px",
    },
  },
  logsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    color: "#f8fafc",
    '@media (minWidth: 768px)': {
      fontSize: "18px",
    },
  },
  logStats: {
    display: "flex",
    gap: "12px",
    '@media (minWidth: 768px)': {
      gap: "16px",
    },
  },
  logStat: {
    fontSize: "12px",
    color: "#94a3b8",
    '@media (minWidth: 768px)': {
      fontSize: "14px",
    },
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
    padding: "32px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
    '@media (minWidth: 768px)': {
      padding: "40px",
    },
  },
  logEntry: {
    borderBottom: "1px solid #1e293b",
    borderLeft: "3px solid",
    display: "grid",
    alignItems: "center",
    fontSize: "12px",
    '@media (minWidth: 768px)': {
      fontSize: "13px",
    },
  },
  logTimestamp: {
    color: "#94a3b8",
    fontFamily: "monospace",
    fontSize: "11px",
    '@media (minWidth: 768px)': {
      fontSize: "12px",
    },
  },
  logMessage: {
    color: "#e2e8f0",
    wordBreak: "break-word",
  },
  logType: {
    textTransform: "uppercase",
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "0.05em",
    '@media (minWidth: 768px)': {
      fontSize: "11px",
      textAlign: "right",
    },
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

@media (max-width: 768px) {
  @keyframes slideIn {
    from {
      transform: translateX(0) translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0) translateY(0);
      opacity: 1;
    }
  }
}
`;