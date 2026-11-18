
"use strict";

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/models"
    );

    if (!response.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Could not retrieve AI models."
        })
      };
    }

    const result = await response.json();

    const models = (result.data || [])
      .filter((model) => {
        const id = String(model.id || "").toLowerCase();
        const name = String(model.name || "").toLowerCase();

        // Exclude Gemini and Google models.
        if (
          id.includes("gemini") ||
          name.includes("gemini") ||
          id.includes("google/") ||
          name.includes("google")
        ) {
          return false;
        }

        // Show free models only.
        const isFree =
          id.endsWith(":free") ||
          (
            Number(model.pricing?.prompt) === 0 &&
            Number(model.pricing?.completion) === 0
          );

        return isFree;
      })
      .map((model) => ({
        id: model.id,
        name: model.name,
        context_length: model.context_length,
        pricing: model.pricing
      }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        provider: "OpenRouter",
        models
      })
    };

  } catch (error) {
    console.error("Model catalogue error:", error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Unable to load AI models."
      })
    };
  }
};
