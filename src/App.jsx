import { useEffect, useRef, useState } from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Copy,
  Download,
  Menu,
  Maximize2,
  Minimize2,
} from "lucide-react";

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
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      type,
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

  const toggleIframeFullscreen = () =>
    setIsIframeFullscreen(!isIframeFullscreen);

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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-inter">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded bg-transparent text-slate-300"
            >
              <Menu size={24} />
            </button>

            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
              KYC
            </div>

            <div>
              <h1 className="text-base md:text-lg font-semibold">
                KYC Verification Portal
              </h1>
              <p className="text-sm text-slate-400">
                Secure document verification system
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex gap-4 items-center hidden">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-slate-400">
                Status
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  processing ? "bg-amber-500" : "bg-emerald-500"
                }`}
              >
                {processing ? "Processing" : "Ready"}
              </span>
            </div>

            {payload?.referenceId && !isMobile && (
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider text-slate-400">
                  Reference ID
                </span>
                <code className="bg-slate-700 text-slate-300 px-3 py-1 rounded font-mono text-sm">
                  {payload.referenceId}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/95 z-50 flex justify-center pt-20">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-11/12 max-w-sm overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold">Navigation</h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded text-slate-300"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex flex-col">
                {["preview", "payload", "logs"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left p-4 text-slate-300 hover:bg-slate-700 border-b border-slate-700 last:border-b-0"
                  >
                    {tab === "preview"
                      ? "Document Preview"
                      : tab === "payload"
                      ? "Raw Payload"
                      : "System Logs"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Notification */}
      {showNotification && (
        <div
          className={`fixed z-50 top-5 right-5 md:right-5 left-5 md:left-auto max-w-xs p-3 rounded-lg flex justify-between items-center shadow-lg animate-slide-in
          ${
            notification.type === "error"
              ? "bg-red-500"
              : notification.type === "success"
              ? "bg-emerald-500"
              : "bg-blue-500"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" && <CheckCircle size={20} />}
            {notification.type === "error" && <AlertCircle size={20} />}
            {notification.type === "info" && <Clock size={20} />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setShowNotification(false)} className="p-1">
            <X size={16} />
          </button>
        </div>
      )}

      <main className="w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Iframe Section */}
        <section className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
          <div className="p-4 md:p-6 border-b border-slate-700 flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-white font-semibold text-lg md:text-xl">
              KYC Verification Interface
            </h2>
            {!isMobile && (
              <span className="flex items-center gap-2 px-2 py-1 bg-slate-700 rounded-full text-slate-300 text-sm md:text-base">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                https://tiger07.live
              </span>
            )}
          </div>
          <iframe
            ref={iframeRef}
            src="https://tiger07.live"
            title="KYC iframe"
            allow="camera; microphone"
            className="w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] border-none"
          />
          {isMobile && (
            <div className="flex items-center justify-center gap-2 p-2 bg-slate-700 text-slate-300 text-sm">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              https://tiger07.live
            </div>
          )}
        </section>

        {/* Results Panel */}
        {(!isIframeFullscreen || !isMobile) && (
          <section className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            {/* Tabs */}
            {!isMobile ? (
              <div className="flex border-b border-slate-700 overflow-x-auto">
                {["preview", "payload", "logs"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-slate-400"
                    }`}
                  >
                    {tab === "preview"
                      ? "Document Preview"
                      : tab === "payload"
                      ? "Raw Payload"
                      : "System Logs"}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 border-b border-slate-700">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
                >
                  <option value="preview">Document Preview</option>
                  <option value="payload">Raw Payload</option>
                  <option value="logs">System Logs</option>
                </select>
              </div>
            )}

            {/* Tab content */}
            <div className="p-4 md:p-6">
              {activeTab === "preview" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">
                      Captured Documents
                    </h3>
                    {/* <button
                      onClick={handleDownloadImages}
                      className="p-2 bg-slate-700 rounded flex items-center justify-center"
                    >
                      <Download size={16} />
                    </button> */}
                  </div>
                  <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
                    {["Front", "Back", "Other"].map((label, idx) => (
                      <PreviewCard
                        key={label}
                        label={label}
                        src={
                          idx === 0
                            ? payload?.documentFrontImage
                            : idx === 1
                            ? payload?.documentBackImage
                            : payload?.documentOtherImage
                        }
                        status={
                          idx === 0
                            ? payload?.documentFrontImage
                            : idx === 1
                            ? payload?.documentBackImage
                            : payload?.documentOtherImage
                            ? "Captured"
                            : "Pending"
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "payload" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Raw JSON Payload</h3>
                    <button
                      onClick={handleCopyJson}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 rounded"
                    >
                      <Copy size={16} /> {!isMobile && "Copy JSON"}
                    </button>
                  </div>
                  <div className="bg-slate-900 rounded overflow-auto max-h-96 p-4">
                    <pre className="text-sm font-mono">
                      {payload
                        ? JSON.stringify(payload, null, 2)
                        : "No payload received yet."}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <div>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h3 className="font-semibold text-lg">System Logs</h3>
                    <div className="flex gap-4 text-sm text-slate-400">
                      <span>Total: {logs.length}</span>
                      <span>
                        Errors: {logs.filter((l) => l.type === "error").length}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded overflow-auto max-h-96">
                    {logs.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        No logs available
                      </div>
                    ) : (
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className={`border-l-4 border-${
                            log.type === "error"
                              ? "red-500"
                              : log.type === "success"
                              ? "emerald-500"
                              : "blue-500"
                          } p-3 grid grid-cols-[120px_1fr_80px] gap-4 items-center text-sm`}
                        >
                          <div className="font-mono text-slate-400">
                            {log.timestamp}
                          </div>
                          <div className="text-slate-100 break-words">
                            {log.message}
                          </div>
                          <div className="uppercase font-semibold text-xs text-slate-300">
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
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-3 border-b border-slate-700">
        <span className="font-semibold">{label}</span>
        <span
          className={`${
            src ? "text-emerald-500" : "text-slate-400"
          } font-medium text-sm`}
        >
          {status}
        </span>
      </div>
      <div className="p-4 flex justify-center items-center min-h-[150px]">
        {src ? (
          <img
            src={src}
            alt={label}
            className="max-w-full max-h-40 md:max-h-52 object-contain rounded"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTRmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NDc0OGIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+";
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="text-2xl md:text-3xl">📄</div>
            <span className="text-sm md:text-base">No image</span>
          </div>
        )}
      </div>
    </div>
  );
}
