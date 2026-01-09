//import dotenv from "dotenv";
//dotenv.config();
import OpenAI from "openai";
import fs from "fs";
import formidable from "formidable";

// Disable Vercel's default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = new formidable.IncomingForm({ multiples: false });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: "Form parse failed" });

      const prompt = fields.prompt;
      const imageFile = files.image;

      if (!prompt || !imageFile) {
        return res.status(400).json({ error: "Prompt and image required" });
      }

      const imagePath = imageFile.filepath || imageFile.path;
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString("base64");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a professional camel beauty judge.
Return ONLY valid JSON.
No markdown, no code fences.
Consider: head, neck, body/hump/limbs, body size.
            `,
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
        max_tokens: 300,
      });

      // Delete uploaded image
      fs.unlinkSync(imageFile.path);

      const content = response.choices[0].message.content;

      const cleaned = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const result = JSON.parse(cleaned);
      res.status(200).json(result);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Camel analysis failed" });
  }
}
