import React from "react";
import io from "socket.io-client";
import axios from "axios";
import "./Chat.css"


let socket;

export default function Chat() {
  const [token, setToken] = React.useState(null);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [state, setState] = React.useState({
    username: "",
    password: "",
    room: "",
    message: "",
    messages: [],
  });

  const [joined, setJoined] = React.useState(false);

  React.useEffect(() => {
    if (token) {
      socket = io("http://localhost:3000", {
        auth: { token }
      });

      socket.on("connect", () => {
        console.log("✅ Socket connected");
      });

      socket.on("RECEIVE_MESSAGE", (data) => {
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, data],
        }));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [token]);

  const register = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/register", {
        username: state.username,
        password: state.password,
      });
      alert("Registration successful! Please login.");
      setIsRegistering(false);
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/login", {
        username: state.username,
        password: state.password,
      });
      setToken(res.data.token);
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (state.room) {
      socket.emit("JOIN_ROOM", state.room);
      setJoined(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (state.message && state.room) {
      socket.emit("SEND_MESSAGE", {
        room: state.room,
        message: state.message,
      });
      setState((prev) => ({ ...prev, message: "" }));
    }
  };

  if (!token) {
    return (
      <div className="container mt-5" style={{ maxWidth: 400 }}>
        <h3>{isRegistering ? "Register" : "Login"}</h3>
        <form onSubmit={isRegistering ? register : login}>
          <input
            className="form-control mb-2"
            type="text"
            placeholder="Username"
            value={state.username}
            onChange={(e) =>
              setState((prev) => ({ ...prev, username: e.target.value }))
            }
            required
          />
          <input
            className="form-control mb-2"
            type="password"
            placeholder="Password"
            value={state.password}
            onChange={(e) =>
              setState((prev) => ({ ...prev, password: e.target.value }))
            }
            required
          />
          <button className="btn btn-primary w-100" type="submit">
            {isRegistering ? "Register" : "Login"}
          </button>
        </form>
        <button
          className="btn btn-link mt-2"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? "Already have an account? Login" : "New user? Register"}
        </button>
      </div>
    );
  }


  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4>Chat App (with Auth)</h4>
            </div>
            <div className="card-body">
              {!joined ? (
                <form onSubmit={joinRoom}>
                  <input
                    type="text"
                    className="form-control mb-3"
                    placeholder="Enter room name"
                    value={state.room}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, room: e.target.value }))
                    }
                    required
                  />
                  <button className="btn btn-success w-100">Join Room</button>
                </form>
              ) : (
                <>
                  <h6>
                    <strong>Room:</strong> {state.room}
                  </h6>
                  <div
                    className="border p-2 mb-3 bg-light rounded"
                    style={{ height: 300, overflowY: "scroll" }}
                  >
                    {state.messages.map((msg, index) => (
                      <div key={index}>
                        <strong>{msg.username}</strong>: {msg.message}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={sendMessage} className="d-flex gap-2">
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Message"
                      value={state.message}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      required
                    />
                    <button className="btn btn-primary">Send</button>
                  </form>
                </>
              )}
            </div>
            <div className="card-footer text-muted text-center">
              Logged in as <strong>{state.username}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
