import { z } from "zod";
import { Bot } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeInitOptions,
} from "@/types/nodes";
import { ChatOpenAI } from "@langchain/openai";

export const OpenAINode: BaseNode = {
  id: "openai",
  type: "OpenAI",
  category: NodeCategory.LLM,
  name: "OpenAI",
  description: "OpenAI language models like GPT-4 and GPT-3.5",
  icon: Bot,
  version: "1.0.0",
  parameters: [
    {
      name: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "GPT-4o-Mini", value: "gpt-4o-mini" },
        { label: "GPT-4", value: "gpt-4" },
        { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
        { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
      ],
      default: "gpt-4o-mini",
      description: "The OpenAI model to use",
    },
    {
      name: "temperature",
      label: "Temperature",
      type: "number",
      default: 0.7,
      optional: true,
      description: "Controls randomness (0-2)",
      validation: z.number().min(0).max(2),
    },
    {
      name: "prompt",
      label: "System Prompt",
      type: "string",
      description: "The system prompt that guides the model behavior",
      validation: z.string().min(1),
    },
  ],
  credentials: [
    {
      name: "openaiApiKey",
      required: true,
      description: "Your OpenAI API key",
    },
  ],
  inputs: {
    min: 0,
    max: 1,
    types: ["text"],
  },
  outputs: [
    {
      type: "text",
      schema: z.string(),
    },
  ],

  async initialize(nodeData: NodeData, options: NodeInitOptions) {
    const model = nodeData.parameters.model || "gpt-4";
    const temperature = nodeData.parameters.temperature || 0.7;

    return new ChatOpenAI({
      modelName: model,
      temperature,
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      maxConcurrency: 1,
    });
  },

  async execute(instance: ChatOpenAI, nodeData?: NodeData) {
    const prompt = nodeData?.parameters?.prompt || "";
    const response = await instance.invoke(prompt);
    return response.content as string;
  },
};
