import React, { useState } from "react";
import { useHistory } from "react-router-dom"; 

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const history = useHistory(); 
  const handleLogin = () => {
    if (username === "user" && password === "password") {
      // Save login state (Optional)
      localStorage.setItem("isLoggedIn", true);
      history.push("/dashboard"); 
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={styles.input}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />
      <button onClick={handleLogin} style={styles.button}>
        Login
      </button>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "100px auto",
    padding: "30px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    marginBottom: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#1e90ff",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
  },
  error: {
    color: "red",
    marginTop: "10px",
  },
};

export default Login;
