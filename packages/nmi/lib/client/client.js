(() => {
  // client/client.ts
  function getSocketHost() {
    const url = location;
    const host = url.host;
    const isHttps = url.protocol === "https";
    return `${isHttps ? "wss" : "ws"}://${host}`;
  }
  if ("WebSocket" in window) {
    const socket = new WebSocket(getSocketHost(), "nmi-hmr");
    let pingTimer = null;
    socket.addEventListener("message", async ({ data }) => {
      data = JSON.parse(data);
      if (data.type === "connected") {
        console.log("[nmi] connected");
        pingTimer = setInterval(() => socket.send("ping"), 3e4);
      }
      if (data.type === "reload")
        window.location.reload();
    });
    async function waitForSuccessFulPing(ms = 1e3) {
      while (true) {
        try {
          await fetch("/__nmi_ping");
          break;
        } catch (e) {
          await new Promise((resolve) => setTimeout(resolve, ms));
        }
      }
    }
    socket.addEventListener("close", async () => {
      if (pingTimer)
        clearInterval(pingTimer);
      console.log("[nmi] dev server disconnected. Polling for restart");
      await waitForSuccessFulPing();
      location.reload();
    });
  }
})();
