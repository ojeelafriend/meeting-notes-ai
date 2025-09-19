import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import { promptHelp } from "./promptHelp";
import { Response } from "express";
dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribe = async (paths: string[], stream: boolean = false) => {
  try {
    if (!stream) {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(paths[0]),
        model: "gpt-4o-mini-transcribe",
        prompt: "You are a helpful assistant that transcribes audio to text.", // opcional, suele no hacer falta
        response_format: "text",
        language: "es",
      });

      return { transcription, error: null };
    }

    let chunkText = "";

    const tasks = paths.map(async (filePath) => {
      const chunks = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "gpt-4o-mini-transcribe",
        prompt: "You are a helpful assistant that transcribes audio to text.", // opcional, suele no hacer falta
        response_format: "text",
        language: "es",
      });

      chunkText = chunkText + " " + chunks;
    });

    await Promise.all(tasks);

    return { transcription: chunkText, error: null };
  } catch (error: any) {
    return { transcription: "", error: error?.message ?? String(error) };
  }
};

export const summarize = async (text: string, res: Response) => {
  try {
    const chunks = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `${promptHelp(text)}` }],
      response_format: { type: "text" },
      stream: true,
    });

    let summary = "";
    for await (const chunk of chunks) {
      summary += chunk.choices[0].delta.content;

      if (chunk.choices[0].finish_reason === "stop") {
        res.write(
          `data: ${JSON.stringify({
            type: "done",
            text: "",
            isFinal: true,
          })}\n\n`
        );
      }

      res.write(
        `data: ${JSON.stringify({
          type: "summary",
          text: summary,
          isFinal: false,
        })}\n\n`
      );
    }

    return { summary, error: null };
  } catch (error) {
    return { summary: null, error: error };
  }
};
