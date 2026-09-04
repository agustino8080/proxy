export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "Falta parámetro 'url'" });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": targetUrl
      }
    });

    const contentType = response.headers.get("content-type") || "";
    
    // Configuramos cabeceras de CORS para el navegador
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", contentType);

    // CASO 1: Es una lista de canales o de reproducción (.m3u8 / .m3u)
    if (contentType.includes("mpegurl") || contentType.includes("application/x-mpegURL") || targetUrl.includes(".m3u8") || targetUrl.includes(".m3u")) {
      const text = await response.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
      const proxyPrefix = `https://${req.headers.host}/api/proxy?url=`;

      const proxiedText = text.split("\n").map(line => {
        line = line.trim();
        if (line === "" || line.startsWith("#")) return line;

        // Convertir rutas relativas a absolutas antes de poner el proxy
        let absoluteUrl = line.startsWith("http") ? line : baseUrl + line;
        return proxyPrefix + encodeURIComponent(absoluteUrl);
      }).join("\n");

      return res.status(200).send(proxiedText);
    } 
    
    // CASO 2: Es un fragmento de video (.ts, .mp4, etc.)
    // IMPORTANTE: Leemos como ArrayBuffer para no corromper el video
    else {
      const buffer = await response.arrayBuffer();
      return res.status(200).send(Buffer.from(buffer));
    }

  } catch (error) {
    res.status(500).json({ error: "Error de conexión", detail: error.message });
  }
}
