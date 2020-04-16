import * as fs from "fs";

interface HeapNode {
  callFrame: {
    functionName: string;
    scriptId: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
  selfSize: number;
  id: number;
  children: Array<HeapNode>;
}

interface HeapProfile {
  head: HeapNode;
  samples: Array<{
    size: number;
    nodeId: number;
    ordinal: number;
  }>;
}

export function calculateFullHeapSize(heap: HeapNode): number {
  return (
    heap.selfSize +
    heap.children.reduce((acc, child) => acc + calculateFullHeapSize(child), 0)
  );
}

export function getUsedMemoryOfHeapFile(fullFilepath: string): number {
  const heapProfile: HeapProfile = JSON.parse(
    fs.readFileSync(fullFilepath, "utf8")
  );

  return calculateFullHeapSize(heapProfile.head);
}
