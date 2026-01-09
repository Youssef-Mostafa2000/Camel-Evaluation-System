import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    const imageFile = req.file;

    if (!prompt || !imageFile) {
      return res.status(400).json({ error: "Image and prompt are required" });
    }

    // Convert image to base64
    const imageBuffer = fs.readFileSync(imageFile.path);
    const imageBase64 = imageBuffer.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional camel beauty judge.

            Rules:
            - Respond ONLY in valid JSON
            - Score out of 100
            - No explanations outside JSON
            - Keep results objective
            - Consider : 1- head beauty
                         2- neck beauty 
                         3- body, hump and limbs beauty 
                         4- body size beauty`,
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
      max_completion_tokens: 300,
    });

    // Delete uploaded image
    fs.unlinkSync(imageFile.path);

    const result = JSON.parse(response.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ChatGPT request failed" });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port : ${PORT}`);
});
