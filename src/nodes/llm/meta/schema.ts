import { z } from "zod";
import { Brain } from "lucide-react";
import {
  BaseNode,
  NodeCategory,
  NodeData,
  NodeInitOptions,
  InputType,
  DebugLog,
  NodeRole,
} from "@/types/nodes";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { handleVectorStore } from "@/lib/llm";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { createDebugLog } from "@/lib/debug";

interface ExtendedNodeData extends NodeData {
  _debugLogs?: DebugLog[];
}

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
        { label: "Llama 2 70B", value: "llama2:70b-chat" },
        { label: "Llama 2 13B", value: "llama2:13b-chat" },
        { label: "Llama 2 7B", value: "llama2:7b-chat" },
        { label: "CodeLlama 34B", value: "codellama:34b-instruct" },
        { label: "CodeLlama 13B", value: "codellama:13b-instruct" },
        { label: "CodeLlama 7B", value: "codellama:7b-instruct" },
      ],
      default: "llama2:7b-chat",
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
    const model = nodeData.parameters.model || "llama2:7b-chat";
    const temperature = nodeData.parameters.temperature || 0.7;
    const baseUrl = options.credentials?.OLLAMA_URL || "http://localhost:11434";
    console.log({ baseUrl });

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
    console.log("Meta execute called with inputs:", inputs);
    // // Get the prompt from inputs or parameters
    const updatedNodeData = { ...nodeData } as ExtendedNodeData;
    const debugLogs: DebugLog[] = [];
    const promptText = inputs?.prompt || nodeData?.parameters?.prompt || "";

    debugLogs.push(createDebugLog("input", "Initial Prompt", promptText));
    // Build the complete prompt template based on available inputs
    let template = "{input}";
    const inputValues: Record<string, string> = {
      input: promptText,
    };

    if (inputs?.vectorstore) {
      console.log("Processing vectorstore input");
      const vectorStoreResponse = await handleVectorStore({
        llm: instance as unknown as BaseLanguageModel<any, any>,
        vectorStoreInput: inputs.vectorstore,
        userPrompt: promptText,
        debugLogs: [],
      });

      template = vectorStoreResponse.template;
      Object.assign(inputValues, vectorStoreResponse.inputValues);
      debugLogs.push(...vectorStoreResponse.debugLogs);
    }

    // Add context if available
    if (inputs?.context) {
      template = `Additional Context:\n{context}\n\n${template}`;
      inputValues.context = inputs.context;
    }

    // Add memory if available
    if (inputs?.memory) {
      template = `Conversation History:\n{memory}\n\n${template}`;
      inputValues.memory = inputs.memory;
    }

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const formattedPrompt = await promptTemplate.format(inputValues);

    debugLogs.push(
      createDebugLog("intermediate", "Final Formatted Prompt", formattedPrompt)
    );

    const response = await instance.invoke(formattedPrompt);

    return response.content as string;
  },
};
