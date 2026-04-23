import LlamaCloud from "@llamaindex/llama-cloud";
import dotenv from "dotenv";

dotenv.config();

export const client = new LlamaCloud({
    token: process.env.LLAMA_CLOUD_API_KEY
});