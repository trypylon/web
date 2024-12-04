import { z } from "zod";
import { MessageSquare } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeInitOptions,
  InputType,
  NodeRole,
} from "@/types/nodes";
import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";

export const AnthropicNode: BaseNode = {
  id: "anthropic",
  type: "Anthropic",
  category: NodeCategory.LLM,
  name: "Anthropic",
  description: "Anthropic language models like Claude",
  icon: MessageSquare,
  version: "1.0.0",
  role: NodeRole.EXECUTOR,
  parameters: [
    {
      name: "model",
      label: "Model",
      type: "select",
      options: [
        { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-latest" },
        { label: "Claude 3 Opus", value: "claude-3-opus" },
        { label: "Claude 2.1", value: "claude-2.1" },
      ],
      default: "claude-3-5-sonnet-latest",
      description: "The Anthropic model to use",
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
      name: "anthropicApiKey",
      required: true,
      description: "Your Anthropic API key",
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
    vectorstore: {
      required: false,
      description: "Retrieved documents from a vector store for RAG",
      isAdvanced: true,
    },
    memory: {
      required: false,
      description: "Chat history or memory from previous interactions",
    },
  },
  outputs: [
    {
      type: "text",
      schema: z.string(),
    },
  ],

  async initialize(nodeData: NodeData, options: NodeInitOptions) {
    const model = nodeData.parameters.model || "claude-3-5-sonnet-latest";
    const temperature = nodeData.parameters.temperature || 0.7;

    return new ChatAnthropic({
      modelName: model,
      temperature,
      anthropicApiKey:
        options.credentials?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
      maxRetries: 3,
      maxConcurrency: 1,
      clientOptions: {
        defaultHeaders: {
          "anthropic-dangerous-direct-browser-access": "true",
        },
      },
    });
  },

  async execute(
    instance: ChatAnthropic,
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
