
"use strict";

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const defaultModel = process.env.OPENROUTER_MODEL;

    if (!apiKey || !defaultModel) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          error: "AI provider is not configured yet."
        })
      };
    }

    const data = JSON.parse(event.body || "{}");
    const message = data.message;
    const model = data.model || defaultModel;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 12000
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Enter a valid message."
        })
      };
    }

    // Strictly exclude Gemini and Google models.
    if (/gemini|google/i.test(model)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "This model is not allowed in CRIST AI."
        })
      };
    }

    const roles = {
      CEO: "You are the CRIST AI CEO specialist. Focus on business strategy and executive decisions.",
      CTO: "You are the CRIST AI CTO specialist. Focus on technology and system architecture.",
      CFO: "You are the CRIST AI CFO specialist. Focus on budgets and financial planning. Never invent financial data.",
      COO: "You are the CRIST AI COO specialist. Focus on operations and execution planning.",
      CMO: "You are the CRIST AI CMO specialist. Focus on branding and marketing.",
      CPO: "You are the CRIST AI CPO specialist. Focus on product strategy.",
      CISO: "You are the CRIST AI CISO specialist. Focus on cybersecurity and risk prevention.",
      CHRO: "You are the CRIST AI CHRO specialist. Focus on hiring and team planning.",
      RESEARCH: "You are the CRIST AI Research Director. Separate verified facts from assumptions.",
      DEVELOPER: "You are the CRIST AI Developer Director. Write accurate, maintainable software.",
      AUTOMOTIVE: "You are the CRIST AI Automotive Researcher. Clearly distinguish concepts from validated engineering.",
      BUSINESS: "You are the CRIST AI Business Development specialist.",
      LEGAL: "You are the CRIST AI Legal Research Assistant. Provide information, not professional legal advice.",
      INVESTOR: "You are the CRIST AI Investor Relations specialist. Never invent funding or investor commitments.",
      DATA: "You are the CRIST AI Data Intelligence specialist. Never fabricate data.",
      CHIEF_OF_STAFF: "You are the CRIST AI Chief of Staff. Coordinate priorities and executive planning."
    };

    const role = String(data.role || "CEO").toUpperCase();
    const specialist = roles[role] || roles.CEO;

    const systemPrompt = `
You are CRIST AI TITAN X, an executive intelligence assistant
created for CRIST Motors.

${specialist}

The founder remains in control.
Never claim an external action has been completed unless it really has.
Never invent research, citations, funding, partnerships or technical validation.
Never execute external actions from a chat response.
Clearly explain uncertainty.

CRIST Motors is currently at concept-development stage.
Its flagship concept is CRIST GT-01.
CRIST AI and CRIST Chip are proposed concepts, not validated products.
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.URL || "https://netlify.app",
          "X-Title": "CRIST AI TITAN X"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: message.trim()
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("AI provider error:", response.status);

      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "AI provider request failed. Check provider settings."
        })
      };
    }

    const reply =
      result.choices?.[0]?.message?.content;

    if (!reply) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "The AI provider returned no response."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply,
        model: result.model || model,
        provider: "OpenRouter"
      })
    };

  } catch (error) {
    console.error("CRIST AI error:", error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal CRIST AI server error."
      })
    };
  }
};
