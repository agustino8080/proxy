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
    const text = await response.text();

    // Configuramos cabeceras de CORS para el navegador
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", contentType);

    // Si es una lista de reproducción (m3u8), reescribimos los enlaces internos
    if (contentType.includes("mpegurl") || contentType.includes("application/x-mpegURL") || targetUrl.includes(".m3u8")) {
      
      // Obtenemos la URL base para resolver rutas relativas
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
      const proxyPrefix = `https://${req.headers.host}/api/proxy?url=`;

      // Esta lógica busca líneas que no empiezan con # (enlaces) y les pone el proxy
      const proxiedText = text.split("\n").map(line => {
        line = line.trim();
        if (line === "" || line.startsWith("#")) return line;

        // Si la línea ya es una URL absoluta (http...)
        if (line.startsWith("http")) {
          return proxyPrefix + encodeURIComponent(line);
        }
        
        // Si es una ruta relativa, la convertimos en absoluta y luego le ponemos el proxy
        return proxyPrefix + encodeURIComponent(baseUrl + line);
      }).join("\n");

      return res.status(200).send(proxiedText);
    }

    // Si no es un m3u8 (es un segmento .ts), lo enviamos tal cual
    res.status(200).send(text);

  } catch (error) {
    res.status(500).json({ error: "Error al conectar", detail: error.message });
  }
}
