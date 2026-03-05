export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#faf9f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "22px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.03em", marginBottom: "20px" }}>
          Pari<span style={{ color: "#2d6a4f" }}>chaya</span>
        </p>
        <div
          style={{
            width: "20px",
            height: "20px",
            border: "2px solid #e5e3de",
            borderTopColor: "#2d6a4f",
            borderRadius: "50%",
            margin: "0 auto",
            animation: "spin 0.65s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
