export default async function handler(req, res) {
  if (req.method === 'GET') {
    const backendUrl = process.env.APP_SCRIPT_URL;
    if (!backendUrl) {
      return res.status(500).json({ status: "error", message: "APP_SCRIPT_URL is not defined in the server environment" });
    }

    try {
      const response = await fetch(backendUrl);
      const data = await response.json();
      res.json(data);
    } catch (e) {
      console.error("Proxy error:", e);
      res.status(500).json({ status: "error", message: "Failed to fetch assets" });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
