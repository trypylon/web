import { BaseNode } from "@/types/nodes";
import { OpenAINode } from "./llm/openai/schema";
import { AnthropicNode } from "./llm/anthropic/schema";
import { MetaNode } from "./llm/meta/schema";
import { PineconeVectorStoreNode } from "./vectorstore/pinecone/schema";
import { Bot } from "lucide-react"; // Default icon
import { QdrantVectorStoreNode } from "./vectorstore/qdrant/schema";

// Add nodes here to register them in the system
export const registeredNodes: BaseNode[] = [
  OpenAINode,
  AnthropicNode,
  MetaNode,
  PineconeVectorStoreNode,
  QdrantVectorStoreNode,
];

// Helper to get node by type
export function getNodeByType(type: string): BaseNode | undefined {
  return registeredNodes.find((node) => node.type === type);
}

// Helper to get node icon
export function getNodeIcon(node: BaseNode) {
  try {
    // Try to import SVG from the node's directory
    const icon = require(`${node.id}/icon.svg`).default;
    return icon;
  } catch {
    // Fallback to the node's specified icon or default Bot icon
    return node.icon || Bot;
  }
}

// Generate folder structure for sidebar
export function generateNodeRegistry() {
  const registry = {
    name: "Nodes",
    folders: {} as Record<string, any>,
  };

  registeredNodes.forEach((node) => {
    const category = node.category.toLowerCase();

    // Create category folder if it doesn't exist
    if (!registry.folders[category]) {
      registry.folders[category] = {
        name: getCategoryName(category),
        nodes: [],
      };
    }

    // Add node to category folder with its icon
    registry.folders[category].nodes.push({
      ...node,
      icon: getNodeIcon(node),
    });
  });

  return registry;
}

// Helper functions to format names
function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    llm: "Language Models",
    vectorstore: "Vector Stores",
    memory: "Memory",
    tools: "Tools",
    output: "Output",
  };
  return names[category] || category;
}
