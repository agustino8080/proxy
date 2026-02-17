export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "Falta parámetro 'url'" });
  }

  try {
    const response = await fetch(targetUrl);
    const data = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: "Error al conectar con el destino" });
  }
}
