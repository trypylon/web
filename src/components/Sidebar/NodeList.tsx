import { nodeRegistry } from "@/nodes/registry";
import { NodeCategory } from "./NodeCategory";

export function NodeList() {
  return (
    <div className="space-y-6 p-4">
      {Object.entries(nodeRegistry.folders).map(([key, folder]) => (
        <NodeCategory key={key} name={folder.name} nodes={folder.nodes} />
      ))}
    </div>
  );
}
