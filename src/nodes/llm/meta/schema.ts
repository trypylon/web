import { z } from "zod";
import { Brain } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeInitOptions,
  InputType,
  NodeRole,
} from "@/types/nodes";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { PromptTemplate } from "@langchain/core/prompts";

export const MetaNode: BaseNode = {
  id: "meta",
  type: "Meta",
  category: NodeCategory.LLM,
  name: "Meta",
  description: "Meta's language models like Llama 2 and CodeLlama",
  icon: Brain,
  version: "1.0.0",
  role: NodeRole.EXECUTOR,
  parameters: [
    {
      name: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "Llama 2 70B", value: "llama2:70b" },
        { label: "Llama 2 13B", value: "llama2:13b" },
        { label: "Llama 2 7B", value: "llama2:7b" },
        { label: "CodeLlama 34B", value: "codellama:34b" },
        { label: "CodeLlama 13B", value: "codellama:13b" },
        { label: "CodeLlama 7B", value: "codellama:7b" },
      ],
      default: "llama2:7b",
      description: "The Meta model to use",
    },
    {
      name: "temperature",
      label: "Temperature",
      type: "number",
      default: 0.7,
      optional: true,
      description: "Controls randomness (0-1)",
      validation: z.number().min(0).max(1),
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
      name: "ollamaUrl",
      required: false,
      description: "Your Ollama API URL (defaults to http://localhost:11434)",
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
    },
  },
  outputs: [
    {
      type: "text",
      schema: z.string(),
    },
  ],

  async initialize(nodeData: NodeData, options: NodeInitOptions) {
    const model = nodeData.parameters.model || "llama2:7b";
    const temperature = nodeData.parameters.temperature || 0.7;
    const baseUrl = options.credentials?.OLLAMA_URL || "http://localhost:11434";

    return new ChatOllama({
      model,
      temperature,
      baseUrl,
      maxRetries: 3,
    });
  },

  async execute(
    instance: ChatOllama,
    nodeData?: NodeData,
    inputs?: Record<InputType, string>
  ) {
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
