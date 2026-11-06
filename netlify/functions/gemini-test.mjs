
export default async (request) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  if (request.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "ready",
        message: "CreatorSpark AI endpoint is running.",
      }),
      { status: 200, headers }
    );
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed." }),
      { status: 405, headers }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "The server API key is not configured.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const body = await request.json();
    const prompt = body?.prompt;

    if (
      typeof prompt !== "string" ||
      prompt.trim().length === 0 ||
      prompt.length > 4000
    ) {
      return new Response(
        JSON.stringify({
          error: "Enter a prompt of 1–4000 characters.",
        }),
        { status: 400, headers }
      );
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt.trim() }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 800,
          },
        }),
      }
    );

    const result = await response.json();

if (!response.ok) {
  const details = await response.text();

  console.error("Gemini API error:", response.status, details);

  return new Response(
    JSON.stringify({
      error: "Gemini API request failed.",
      status: response.status,
      details: details
    }),
    {
      status: 502,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

    const text = (result.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      return new Response(
        JSON.stringify({
          error: "The AI returned no text. Please try again.",
        }),
        { status: 502, headers }
      );
    }

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("CreatorSpark function error:", error.message);

    return new Response(
      JSON.stringify({
        error: "The request could not be processed.",
      }),
      { status: 500, headers }
    );
  }
};
