import { z } from 'zod';
import { MessageSquare } from 'lucide-react';
import { BaseNode, NodeCategory, NodeData, NodeInitOptions, InputType } from '@/types/nodes';
import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";

export const AnthropicNode: BaseNode = {
  id: 'anthropic',
  type: 'Anthropic',
  category: NodeCategory.LLM,
  name: 'Anthropic',
  description: 'Anthropic language models like Claude',
  icon: MessageSquare,
  version: '1.0.0',
  parameters: [
    {
      name: 'model',
      label: 'Model',
      type: 'select',
      options: [
        { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-latest' },
        { label: 'Claude 3 Opus', value: 'claude-3-opus' },
        { label: 'Claude 2.1', value: 'claude-2.1' }
      ],
      default: 'claude-3-5-sonnet-latest',
      description: 'The Anthropic model to use'
    },
    {
      name: 'temperature',
      label: 'Temperature',
      type: 'number',
      default: 0.7,
      optional: true,
      description: 'Controls randomness (0-1)',
      validation: z.number().min(0).max(1)
    },
    {
      name: 'prompt',
      label: 'System Prompt',
      type: 'string',
      description: 'The system prompt that guides the model behavior',
      validation: z.string().min(1)
    }
  ],
  credentials: [
    {
      name: 'anthropicApiKey',
      required: true,
      description: 'Your Anthropic API key'
    }
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
  },
  outputs: [
    {
      type: 'text',
      schema: z.string()
    }
  ],

  async initialize(nodeData: NodeData, options: NodeInitOptions) {
    const model = nodeData.parameters.model || 'claude-3-5-sonnet-latest';
    const temperature = nodeData.parameters.temperature || 0.7;

    return new ChatAnthropic({
      modelName: model,
      temperature,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 3,
      maxConcurrency: 1,
      clientOptions: {
        defaultHeaders: {
          "anthropic-dangerous-direct-browser-access": "true",
        },
      },
    });
  },

  async execute(instance: ChatAnthropic, nodeData?: NodeData, inputs?: Record<InputType, string>) {
    // Get the prompt from inputs or parameters
    const promptText = inputs?.prompt || nodeData?.parameters?.prompt || "";
    const context = inputs?.context || "";

    // Create a prompt template that includes context if available
    const template = context 
      ? `Context: {context}\n\nPrompt: {prompt}`
      : "{prompt}";

    const promptTemplate = PromptTemplate.fromTemplate(template);
    
    // Format the prompt with the variables
    const formattedPrompt = await promptTemplate.format({
      prompt: promptText,
      context: context,
    });

    const response = await instance.invoke(formattedPrompt);
    return response.content as string;
  }
};