export default async function handler(req, res) {
  if (req.method === 'POST') {
    const backendUrl = process.env.APP_SCRIPT_URL;
    if (!backendUrl) {
      return res.status(500).json({ status: "error", message: "APP_SCRIPT_URL is not defined in the server environment" });
    }

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        body: JSON.stringify(req.body),
      });

      const data = await response.json().catch(() => ({ status: 'success', message: 'Request sent (parsing error)' }));
      res.json(data);
    } catch (e) {
      console.error("Proxy error:", e);
      res.status(500).json({ status: "error", message: "Failed to fetch from Google Apps Script" });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
