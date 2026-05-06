import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = [
  "חלב ומוצריו","ירקות","פירות","בשר ודגים","מאפים","דגנים וקטניות",
  "שתייה","ניקיון","טיפוח אישי","שימורים ויבשים","תבלינים","קפה ותה","קפואים",
];
const UNITS = ['ק"ג', "יחידות", "בקבוקים", "ליטר", "גרם", "חבילות", "שקית", "קופסה", "גלילים"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "missing query" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `אתה עוזר ישראלי שעוזר להוסיף מוצרי מכולת לרשימת קניות.
על סמך שם המוצר שהמשתמש כתב, החזר הצעת מוצר עם שם תקני בעברית, קטגוריה מתאימה,
כמות סבירה ויחידת מידה.
הקטגוריות האפשריות: ${CATEGORIES.join(", ")}.
היחידות האפשריות: ${UNITS.join(", ")}.
חובה לבחור קטגוריה ויחידה רק מהרשימות האלה.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_product",
            description: "החזר הצעת מוצר",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "שם המוצר בעברית" },
                category: { type: "string", enum: CATEGORIES },
                default_quantity: { type: "number", description: "כמות (יכולה להיות עשרונית)" },
                unit: { type: "string", enum: UNITS },
              },
              required: ["name", "category", "default_quantity", "unit"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_product" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב בעוד רגע" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נגמרו הקרדיטים של AI" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("no tool call");
    const args = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
