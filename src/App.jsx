import { useEffect, useRef, useState } from "react";

export default function App() {
  const iframeRef = useRef(null);
  const [payload, setPayload] = useState(null);
  const [logs, setLogs] = useState([]);

  const log = (msg) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev,
    ]);
  };

  useEffect(() => {
    const onMessage = (event) => {
      // 🔐 In production, lock this down
      // if (event.origin !== "https://kyc.levidyo.com") return;

      const data = event.data;
      if (!data) return;

      if (data.type === "createDocument") {
        log("Received createDocument from iframe");

        setPayload(data.payload || {});

        // ✅ ACK IMMEDIATELY
        try {
          event.source.postMessage(
            { type: "createDocumentAck" },
            event.origin || "*"
          );
          log("Sent ACK to iframe");
        } catch (e) {
          log("ACK failed: " + e.message);
        }

        // ⏳ Simulate backend processing
        log("Simulating backend upload (2s)");
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
            log("Sent success response to iframe");
          } catch (err) {
            log("Response postMessage failed: " + err.message);
          }
        }, 2000);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div style={styles.body}>
      <h1>Parent Window (React KYC Receiver)</h1>
      <p>
        This React app embeds the KYC iframe and simulates backend handling.
      </p>

      <iframe
        ref={iframeRef}
        src="https://kyc.levidyo.com"
        title="KYC iframe"
        allow="camera; microphone"
        style={styles.iframe}
      />

      <div style={styles.panel}>
        <h3>Received payload preview</h3>

        <div style={styles.row}>
          <Preview label="Front" src={payload?.documentFrontImage} />
          <Preview label="Back" src={payload?.documentBackImage} />
          <Preview label="Other" src={payload?.documentOtherImage} />
        </div>

        <h4>Last raw payload</h4>
        <pre style={styles.pre}>
          {payload ? JSON.stringify(payload, null, 2) : "No message yet."}
        </pre>

        <h4>Logs</h4>
        <div>
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Preview({ label, src }) {
  if (!src) return <div style={styles.empty}>{label}: none</div>;
  return <img src={src} alt={label} style={styles.preview} />;
}

const styles = {
  body: {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Arial',
    background: "#f7fafc",
    padding: 16,
  },
  iframe: {
    width: "100%",
    height: "90dvh",
    border: "2px solid #cbd5e1",
    borderRadius: 8,
  },
  panel: {
    background: "#fff",
    padding: 12,
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginTop: 12,
  },
  row: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  preview: {
    width: 160,
    border: "1px solid #e2e8f0",
    borderRadius: 6,
  },
  empty: {
    width: 160,
    height: 120,
    border: "1px dashed #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
  },
  pre: {
    background: "#0f172a",
    color: "#e6edf3",
    padding: 8,
    borderRadius: 6,
    overflow: "auto",
    maxHeight: 160,
  },
};
