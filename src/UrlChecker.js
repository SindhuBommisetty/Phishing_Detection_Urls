import React, { useState, useEffect } from "react";

// Optional: Lottie for animated detective (if needed)
// import Lottie from 'react-lottie';
// import detectiveAnimation from './path/to/detective-animation.json'; 

const UrlChecker = () => {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [safeUrl, setSafeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false); // To toggle comment box visibility
  const [suspiciousCount, setSuspiciousCount] = useState({}); // Track suspicious URL count

  useEffect(() => {
    // Load URL history and suspicious data from localStorage
    const savedHistory = JSON.parse(localStorage.getItem("urlHistory")) || [];
    setHistory(savedHistory);
    const savedSuspiciousCount = JSON.parse(localStorage.getItem("suspiciousCount")) || {};
    setSuspiciousCount(savedSuspiciousCount);
  }, []);

  const handleCheckUrl = async () => {
    if (!url.trim()) {
      setResult("Please enter a URL.");
      setSafeUrl("");
      return;
    }

    setLoading(true);
    setResult("");
    setSafeUrl("");

    // Check if the URL has been marked suspicious more than 5 times
    if (suspiciousCount[url] && suspiciousCount[url] >= 5) {
      setResult("Suspicious Link (User Feedback)");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/predict-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.result || "Unknown Result");
        setSafeUrl(data.safe_url || "");
      } else {
        setResult(data.error || "Error in response");
      }

      // Save the URL and result in history
      const newHistory = [...history, { url, result: data.result, timestamp: new Date().toLocaleString() }];
      setHistory(newHistory);
      localStorage.setItem("urlHistory", JSON.stringify(newHistory));

    } catch (error) {
      console.error("Request failed:", error);
      setResult("Backend error. Please try again.");
    }

    setLoading(false);
  };

  const handleCommentButtonClick = () => {
    setShowCommentBox(!showCommentBox);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      alert("Please enter a comment.");
      return;
    }

    // Keyword extraction logic using NLP (could use an API for NLP or regex)
    const suspiciousKeywords = ["spam", "fake", "suspicious"];
    const isSuspicious = suspiciousKeywords.some(keyword => comment.toLowerCase().includes(keyword));

    // If suspicious, increase the count
    if (isSuspicious) {
      const updatedCount = suspiciousCount[url] ? suspiciousCount[url] + 1 : 1;
      setSuspiciousCount((prevCount) => {
        const updatedCounts = { ...prevCount, [url]: updatedCount };
        localStorage.setItem("suspiciousCount", JSON.stringify(updatedCounts));
        return updatedCounts;
      });

      if (updatedCount >= 5) {
        alert("This URL has been marked suspicious more than 5 times and will be considered suspicious automatically in the future.");
      }
    }

    // Store the comment for the URL
    const newHistory = [...history, { url, comment, timestamp: new Date().toLocaleString() }];
    setHistory(newHistory);
    localStorage.setItem("urlHistory", JSON.stringify(newHistory));

    setComment("");
    alert("Comment submitted successfully!");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("urlHistory");
  };

  return (
    <div style={styles.pageBackground}>
      <div style={styles.container}>
        <h2 style={styles.title}>🌐 Smart URL Checker</h2>

        <div style={styles.mascotContainer}>
          {/* Optional: Use Lottie for animated mascot */}
          {/* <Lottie options={{ animationData: detectiveAnimation, loop: true, autoplay: true }} /> */}
          <span style={styles.mascot}>🕵️‍♂️</span>
        </div>

        <input
          type="text"
          placeholder="Paste your URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={styles.input}
        />

        <button
          onClick={handleCheckUrl}
          style={styles.button}
          disabled={loading}
        >
          {loading ? "Checking..." : "🚀 Check URL"}
        </button>

        {result && (
          <div style={{ marginTop: "20px" }}>
            <p
              style={{
                ...styles.result,
                color: result === "Suspicious Link" ? "#e74c3c" : "#2ecc71",
              }}
            >
              {result}
            </p>

            {result === "Suspicious Link" && safeUrl && (
              <p style={styles.safeUrl}>
                🔗 Redirect to:{" "}
                <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                  {safeUrl}
                </a>
              </p>
            )}
          </div>
        )}

        {/* Comment Button and Section */}
        <div style={styles.commentSection}>
          <button
            onClick={handleCommentButtonClick}
            style={styles.commentButton}
          >
            💬 Leave a Comment
          </button>

          {showCommentBox && (
            <form onSubmit={handleCommentSubmit}>
              <textarea
                placeholder="Type your comment here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={styles.textarea}
              />
              <button type="submit" style={styles.commentButton}>
                Submit Comment
              </button>
            </form>
          )}
        </div>

        <div style={styles.history}>
          <h3>🔍 Check History</h3>
          {history.length === 0 ? (
            <p>No URL checks yet.</p>
          ) : (
            <ul>
              {history.slice(0, 5).map((item, index) => (
                <li key={index}>
                  <strong>{item.url}</strong> - {item.result} <br />
                  <small>{item.timestamp}</small>
                  {item.comment && (
                    <p style={{ fontStyle: "italic", color: "#777" }}>Comment: {item.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <button onClick={clearHistory} style={styles.clearButton}>Clear History</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageBackground: {
    minHeight: "100vh",
    width: "100%",
    backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiG1wPH8MBzoHuweEwyLix2NPznUnkv_rldg&s')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Segoe UI, sans-serif",
    padding: "40px 20px",
  },
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.3)", // semi-transparent white
    color: "#333",
    maxWidth: "520px",
    width: "100%",
    padding: "30px",
    borderRadius: "14px",
    textAlign: "center",
    boxShadow: "0 0 25px rgba(0, 0, 0, 0.25)",
    backdropFilter: "blur(12px)", // stronger blur for better glassmorphism effect
  },
  
  mascotContainer: {
    marginBottom: "20px",
  },
  mascot: {
    fontSize: "40px",
    animation: "pulse 1.5s infinite",
  },
  input: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    marginBottom: "20px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    outline: "none",
    transition: "box-shadow 0.3s",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
  },
  button: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    background: "linear-gradient(135deg, #1e90ff, #6a11cb)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background 0.3s ease",
    fontWeight: "bold",
  },
  result: {
    fontSize: "20px",
    fontWeight: "bold",
    marginTop: "10px",
  },
  safeUrl: {
    fontSize: "16px",
    marginTop: "10px",
    color: "#333",
  },
  history: {
    marginTop: "30px",
    textAlign: "left",
  },
  clearButton: {
    marginTop: "10px",
    padding: "8px 12px",
    background: "#f8f9fa",
    borderRadius: "5px",
    border: "1px solid #ccc",
    cursor: "pointer",
  },
  commentSection: {
    marginTop: "30px",
  },
  textarea: {
    width: "100%",
    height: "100px",
    padding: "10px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    resize: "none",
  },
  commentButton: {
    marginTop: "10px",
    padding: "10px 20px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
};

export default UrlChecker;
