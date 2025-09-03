import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import { promptHelp } from "./promptHelp";
dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribe = async (file: Express.Multer.File) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(file.path),
      model: "whisper-1",
      prompt: "You are a helpful assistant that transcribes audio to text.",
      response_format: "text",
      language: "es",
    });

    return { transcription, error: null };
  } catch (error) {
    return { transcription: null, error: error };
  }
};

export const summarize = async (text: string) => {
  try {
    const summary = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `${promptHelp(text)}` }],
      response_format: { type: "text" },
    });
    return { summary: summary.choices[0].message.content, error: null };
  } catch (error) {
    return { summary: null, error: error };
  }
};
