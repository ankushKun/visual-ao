"use client";
import BlocklyComponent from '@/blockly';
import FlowPanel from '@/components/panel';
import { Edge, Edges } from '@/edges';
import { useGlobalState } from '@/hooks/useGlobalStore';
import { Node, Nodes, NodeSizes, TNodes } from '@/nodes';
import { data } from '@/nodes/handler-add';
import { addEdge, Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState, useNodesData, NodeChange, EdgeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BoxIcon } from 'lucide-react';
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';

const defaults = {
  nodes: [
    { id: "start", position: { x: 50, y: 50 }, data: {}, type: "start" },
    { id: "add", position: { x: 200, y: 100 }, data: {}, type: "add" },
  ],
  edges: [
    { id: "start-add", source: "start", target: "add", type: "dashed" },
  ]
}
const ignoreChangesForNodes = ["start"]

export default function Home() {
  const globals = useGlobalState()

  const [nodes, setNodes, onNodesChange] = useNodesState(defaults.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaults.edges);

  useEffect(() => {
    const storedData = localStorage.getItem(`${globals.activeProcess}-flow`);
    if (storedData) {
      const { nodes, edges } = JSON.parse(storedData);
      setNodes(nodes);
      setEdges(edges);
    } else {
      setNodes(defaults.nodes);
      setEdges(defaults.edges);
    }
  }, [globals.activeProcess]);

  useEffect(() => {
    if (!globals.activeProcess) return;
    if (nodes !== defaults.nodes || edges !== defaults.edges) {
      const data = { nodes, edges };
      localStorage.setItem(`${globals.activeProcess}-flow`, JSON.stringify(data));
    }
  }, [nodes, edges, globals.activeProcess]);

  useEffect(() => {
    function onAddNodeEvent(e: CustomEvent) {
      const type = e.detail.type;
      let newId = "";
      setEdges(edges => {
        setNodes(nodes => {
          newId = `node-${nodes.length + 1}`;
          const lastNode = nodes.pop();
          if (!lastNode) return [...nodes];

          const lastNodeSize = NodeSizes[lastNode.type as TNodes];
          const currentNodeSize = NodeSizes[type as TNodes];

          if (lastNode.type === "add") {
            nodes.push({ id: newId, position: { x: lastNode.position.x, y: lastNode.position.y }, type: type, data: {} });
          } else {
            nodes.push({ id: newId, position: { x: lastNode.position.x + lastNodeSize.width + 100, y: lastNode.position.y + 50 }, type: type, data: {} });
          }
          nodes.push({ id: "add", position: { x: lastNode.position.x + lastNodeSize.width + 200, y: lastNode.position.y }, data: {}, type: "add" });
          return [...nodes];
        })
        const lastEdge = edges.pop(); // edge from the add node
        const edge1Id = `${lastEdge?.source}-${newId}`;
        const edge2Id = `${newId}-add`;
        edges.push({ id: edge1Id, source: lastEdge?.source as string, target: newId, type: "default" });
        edges.push({ id: edge2Id, source: newId, target: "add", type: "dashed" });
        return [...edges];
      })
      globals.toggleNodebar()
    }

    function onUpdateNodeDataEvent(e: CustomEvent) {
      const detail = e.detail;
      setNodes(nodes => {
        const nodeIndex = nodes.findIndex(node => node.id === detail.id);
        if (nodeIndex === -1) return [...nodes];
        nodes[nodeIndex].data = detail.data;
        return [...nodes];
      })
    }

    function onBlocklySaveEvent(e: CustomEvent) {
      const xml = e.detail.xml;
      if (!globals.activeNode) return console.log(globals.activeNode);

      console.log("saving blocks")
      setNodes(nodes => {
        return nodes.map(node => {
          if (node.id == globals.activeNode?.id) {
            const node_ = { ...node, data: { ...node.data, blocklyXml: xml } } as Node
            globals.setActiveNode(node_)
            console.log("node updated", node_)
            return node_
          }
          return node
        })
      })
    }

    window.addEventListener("add-node", onAddNodeEvent as EventListener);
    window.addEventListener("update-node-data", onUpdateNodeDataEvent as EventListener)
    window.addEventListener("save-blocks", onBlocklySaveEvent as EventListener)

    return () => {
      window.removeEventListener("add-node", onAddNodeEvent as EventListener);
      window.removeEventListener("update-node-data", onUpdateNodeDataEvent as EventListener)
      window.removeEventListener("save-blocks", onBlocklySaveEvent as EventListener)
    }
  }, [globals.activeNode])

  function onNodeClick(e: any, node: Node) {
    switch (node.type) {
      case "add":
        if (!globals.nodebarOpen)
          globals.toggleNodebar()
        globals.setActiveNode(undefined)
        break;
      case "start":
        if (globals.nodebarOpen)
          globals.toggleNodebar()
        globals.setActiveNode(undefined)
        break;
      case "handler-add":
        if (!globals.nodebarOpen)
          globals.toggleNodebar()
        globals.setActiveNode(node)
        break;
      default:
        globals.setActiveNode(undefined)


    }
  }

  return (
    <div className="h-screen w-full">
      <div className="h-5 flex items-center px-1 border-b text-xs">
        {globals.activeProcess && <>
          <BoxIcon size={14} className='mr-1' strokeWidth={1.2} />{globals.activeProcess}
          {globals.activeNode && <>
            <div className='px-1.5 text-base'>/</div>
            <div>{globals.activeNode?.id}</div>
            {
              globals.editingNode && <>
                <div className='px-1.5 text-base'>/</div>
                <div>block editor</div>
              </>
            }
          </>}
        </>}
      </div>
      {globals.editingNode && <div className='absolute left-0 top-0 w-screen h-screen bg-black/60 z-50 flex flex-col items-center justify-center'>
        <BlocklyComponent />
      </div>
      }

      <ReactFlow
        className='!h-[calc(100vh-20px)]'
        nodeTypes={Nodes as any}
        edgeTypes={Edges}
        nodes={globals.activeProcess ? nodes :
          [{ id: "no-prc-message", position: { x: 50, y: 50 }, data: { label: "Please select a process to start", muted: true, italic: true }, type: "annotation" }]}
        edges={edges}
        onNodesChange={(e: NodeChange[]) => {
          // prevent deletion
          const e_ = e.filter(e__ => e__.type !== "remove").filter(e__ => !ignoreChangesForNodes.includes((e__ as any).id))
          onNodesChange(e_ as any)
        }}
        onEdgesChange={(e: EdgeChange[]) => {
          // prevent deletion
          const e_ = e.filter(e__ => e__.type !== "remove")
          onEdgesChange(e_ as any)
        }}
        onNodeClick={onNodeClick as any}
        onPaneClick={() => {
          globals.setActiveNode(undefined)
          if (globals.nodebarOpen)
            globals.toggleNodebar()
        }}
      >
        {/* <FlowPanel /> */}
        <Background variant={BackgroundVariant.Dots} bgColor="#fef9f2" />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
