import { Node, Edge } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { InputType } from "@/types/nodes";

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: "Basic" | "Advanced";
  nodes: Node[];
  edges: Edge[];
}

// Helper to create unique IDs for template nodes
function createTemplateIds(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  const idMap = new Map<string, string>();

  const newNodes = nodes.map((node) => {
    const newId = `node-${uuidv4()}`;
    idMap.set(node.id, newId);
    return { ...node, id: newId };
  });

  const newEdges = edges.map((edge) => ({
    ...edge,
    id: `edge-${uuidv4()}`,
    source: idMap.get(edge.source) || edge.source,
    target: idMap.get(edge.target) || edge.target,
  }));

  return { nodes: newNodes, edges: newEdges };
}

export const templates: FlowTemplate[] = [
  {
    id: "philosophical-haiku",
    name: "Philosophical Haiku",
    description: "Generate a philosophical haiku using OpenAI and Anthropic models",
    category: "Basic",
    ...createTemplateIds(
      [
        {
          id: "node-1",
          type: "custom",
          position: { x: 100, y: 200 },
          data: {
            type: "OpenAI",
            label: "First Line",
            parameters: {
              model: "gpt-4o-mini",
              prompt: "Write the first sentence/line of a philosophical haiku that explores the nature of existence, consciousness, or reality. Ensure it follows the traditional 5-syllable format.",
            },
          },
        },
        {
          id: "node-2",
          type: "custom",
          position: { x: 700, y: 200 },
          data: {
            type: "Anthropic",
            label: "Complete Haiku",
            parameters: {
              model: "claude-3-5-sonnet-latest",
              prompt: "Complete this philosophical haiku by adding two more lines. The second line should be 7 syllables, and the final line should be 5 syllables. Maintain the philosophical theme and depth of the first line while creating a cohesive whole.",
            },
          },
        },
      ],
      [
        {
          id: "edge-1",
          source: "node-1",
          target: "node-2",
          sourceHandle: null,
          targetHandle: InputType.CONTEXT,
          type: "default",
        },
      ]
    ),
  },
  {
    id: "basic-conversation",
    name: "Basic Conversation",
    description:
      "Simple example showing how to use different language models in sequence",
    category: "Basic",
    ...createTemplateIds(
      [
        {
          id: "node-1",
          type: "custom",
          position: { x: 100, y: 200 },
          data: {
            type: "OpenAI",
            label: "Initial Question",
            parameters: {
              model: "gpt-4o-mini",
              prompt:
                "Ask a thought-provoking question about technology and its impact on society.",
            },
          },
        },
        {
          id: "node-2",
          type: "custom",
          position: { x: 400, y: 200 },
          data: {
            type: "Anthropic",
            label: "Detailed Response",
            parameters: {
              model: "claude-3-5-sonnet",
              prompt:
                "Provide a detailed, nuanced response to the question, considering multiple perspectives and citing relevant research or examples.",
            },
          },
        },
      ],
      [
        {
          id: "edge-1",
          source: "node-1",
          target: "node-2",
          type: "default",
        },
      ]
    ),
  },
  {
    id: "story-generation",
    name: "Story Generation",
    description:
      "Generate a philosophical story using a chain of language models",
    category: "Advanced",
    ...createTemplateIds(
      [
        {
          id: "node-1",
          type: "custom",
          position: { x: 100, y: 200 },
          data: {
            type: "OpenAI",
            label: "Story Beginning",
            parameters: {
              model: "gpt-4o-mini",
              prompt:
                "Write the first sentence of a deep philosophical story about the nature of consciousness and free will.",
            },
          },
        },
        {
          id: "node-2",
          type: "custom",
          position: { x: 400, y: 200 },
          data: {
            type: "OpenAI",
            label: "Story Middle",
            parameters: {
              model: "gpt-4o-mini",
              prompt:
                "Based on the previous sentence, write the next two sentences that explore the philosophical implications deeper.",
            },
          },
        },
        {
          id: "node-3",
          type: "custom",
          position: { x: 700, y: 200 },
          data: {
            type: "OpenAI",
            label: "Story Ending",
            parameters: {
              model: "gpt-4o-mini",
              prompt:
                "Write a powerful final sentence that brings the philosophical story to a thought-provoking conclusion.",
            },
          },
        },
      ],
      [
        {
          id: "edge-1",
          source: "node-1",
          target: "node-2",
          type: "default",
        },
        {
          id: "edge-2",
          source: "node-2",
          target: "node-3",
          type: "default",
        },
      ]
    ),
  },
];