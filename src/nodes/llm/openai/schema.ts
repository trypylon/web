import { z } from "zod";
import { Bot } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeInitOptions,
  InputType,
} from "@/types/nodes";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

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
    prompt: {
      required: false,
      description: "Dynamic prompt to override the default prompt",
    },
    context: {
      required: false,
      description: "Additional context to be injected into the prompt",
    },
    memory: {
      required: false,
      description: "Chat history or memory from previous interactions",
    },
    vectorstore: {
      required: false,
      description: "Retrieved documents from a vector store for RAG",
    }
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

  async execute(instance: ChatOpenAI, nodeData?: NodeData, inputs?: Record<InputType, string>) {
    // Get the prompt from inputs or parameters
    const promptText = inputs?.prompt || nodeData?.parameters?.prompt || "";
    const context = inputs?.context || "";
    const memory = inputs?.memory || "";
    const vectorstore = inputs?.vectorstore || "";

    // Build the complete prompt template based on available inputs
    let template = "{prompt}";
    const templateVars: Record<string, string> = { prompt: promptText };

    if (context) {
      template = "Context:\n{context}\n\nPrompt: {prompt}";
      templateVars.context = context;
    }

    if (memory) {
      template = "Previous Conversation:\n{memory}\n\n" + template;
      templateVars.memory = memory;
    }

    if (vectorstore) {
      template = "Retrieved Documents:\n{vectorstore}\n\n" + template;
      templateVars.vectorstore = vectorstore;
    }

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const formattedPrompt = await promptTemplate.format(templateVars);
    const response = await instance.invoke(formattedPrompt);
    
    return response.content as string;
  },
};