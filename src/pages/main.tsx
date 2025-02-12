"use client";
import BlocklyComponent from '@/blockly';
import { xmlToLua } from '@/blockly/utils/xml';
import FlowPanel from '@/components/flow-panel';
import { Edge, Edges } from '@/edges';
import { useGlobalState } from '@/hooks/useGlobalStore';
import { installAPM, installPackage, parseOutupt, runLua } from '@/lib/aos';
import { getNodesOrdered } from '@/lib/utils';
import { customNodes, Node, Nodes, NodeSizes, TNodes } from '@/nodes';
import { addEdge, Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState, useNodesData, NodeChange, EdgeChange, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useActiveAddress } from 'arweave-wallet-kit';
import { BoxIcon } from 'lucide-react';
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { data as HandlerAddDataType, embedHandler } from '@/nodes/handler-add';
import { data as AOSendDataType, embedSendFunction } from '@/nodes/ao-send';
import { data as AOFunctionDataType, embedFunction } from "@/nodes/function"
import { data as InstallPackageDataType, embedInstallPackageFunction } from "@/nodes/install-package"
import { data as TransferDataType, embedTransferFunction } from '@/nodes/transfer';
import { toast } from 'sonner';

const defaults = {
  nodes: [
    { id: "start", position: { x: 50, y: 50 }, data: {}, type: "start" },
    { id: "add", position: { x: 200, y: 100 }, data: {}, type: "add" },
  ]
}
const ignoreChangesForNodes = ["start"]

export default function Main({ heightPerc }: { heightPerc?: number }) {
  return <ReactFlowProvider>
    <Flow heightPerc={heightPerc} />
  </ReactFlowProvider>
}

function Flow({ heightPerc }: { heightPerc?: number }) {
  const globals = useGlobalState()
  const address = useActiveAddress()
  const { setCenter, setViewport } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(defaults.nodes);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Generate edges whenever nodes change
  useEffect(() => {
    const newEdges: Edge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const source = nodes[i].id;
      const target = nodes[i + 1].id;
      const edgeType = target === "add" ? "dashed" : "default";
      newEdges.push({
        id: `${source}-${target}`,
        source,
        target,
        type: edgeType
      });
    }
    setEdges(newEdges);
  }, [nodes]);

  useEffect(() => {
    globals.setActiveProcess("")
    globals.setActiveNode(undefined)
    if (globals.nodebarOpen)
      globals.toggleNodebar()
  }, [address])

  useEffect(() => {
    const storedData = localStorage.getItem(`${globals.activeProcess}-flow`);
    if (storedData) {
      const { nodes } = JSON.parse(storedData);
      setNodes(nodes);
    } else {
      setNodes(defaults.nodes);
    }

    const { width, height } = document.querySelector('.react-flow')?.getBoundingClientRect() || { width: 0, height: 0 };
    setCenter(width / 2, height / 2, { duration: 500, zoom: 1 });

    globals.resetNodes()
  }, [globals.activeProcess]);

  useEffect(() => {
    if (!globals.activeProcess) return;
    if (nodes !== defaults.nodes) {
      const data = { nodes };
      localStorage.setItem(`${globals.activeProcess}-flow`, JSON.stringify(data));
    }
  }, [nodes, globals.activeProcess]);

  useEffect(() => {
    function onUpdateNodesEvent(e: CustomEvent) {
      const { nodes } = e.detail;
      setNodes(nodes)
    }

    function onAddNodeEvent(e: CustomEvent) {
      const type = e.detail.type;
      let newId = "";
      setNodes(nodes => {
        newId = `node-${nodes.length + 1}`;
        const lastNode = nodes.pop();
        if (!lastNode) return [...nodes];

        const lastNodeSize = NodeSizes[lastNode.type as TNodes];
        const currentNodeSize = NodeSizes[type as TNodes];

        if (lastNode.type === "add") {
          globals.setActiveNode({ id: newId, position: { x: lastNode.position.x, y: lastNode.position.y }, type: type, data: {} });
          nodes.push({ id: newId, position: { x: lastNode.position.x, y: lastNode.position.y }, type: type, data: {} });
        } else {
          globals.setActiveNode({ id: newId, position: { x: lastNode.position.x + lastNodeSize.width + 100, y: lastNode.position.y + 50 }, type: type, data: {} });
          nodes.push({ id: newId, position: { x: lastNode.position.x + lastNodeSize.width + 100, y: lastNode.position.y + 50 }, type: type, data: {} });
        }
        nodes.push({ id: "add", position: { x: lastNode.position.x + lastNodeSize.width + 200, y: lastNode.position.y }, data: {}, type: "add" });

        return [...nodes];
      });
    }

    function onUpdateNodeDataEvent(e: CustomEvent) {
      const detail = e.detail;
      console.log(detail)
      setNodes(nodes => {
        const nodeIndex = nodes.findIndex(node => node.id == detail.id);
        console.log(nodeIndex)
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
          } else {
            return node
          }
        })
      })
    }

    window.addEventListener("add-node", onAddNodeEvent as EventListener);
    window.addEventListener("update-node-data", onUpdateNodeDataEvent as EventListener)
    window.addEventListener("save-blocks", onBlocklySaveEvent as EventListener)
    window.addEventListener("update-nodes", onUpdateNodesEvent as EventListener)

    return () => {
      window.removeEventListener("add-node", onAddNodeEvent as EventListener);
      window.removeEventListener("update-node-data", onUpdateNodeDataEvent as EventListener)
      window.removeEventListener("save-blocks", onBlocklySaveEvent as EventListener)
      window.removeEventListener("update-nodes", onUpdateNodesEvent as EventListener)
    }
  }, [globals.activeNode])

  useEffect(() => {
    function onImportTemplate(e: CustomEvent) {
      const { nodes: templateNodes } = e.detail;
      setNodes(templateNodes);
      toast.success("Imported Template", { style: { backgroundColor: "white" } })
    }

    window.addEventListener("import-template", onImportTemplate as EventListener);
    return () => {
      window.removeEventListener("import-template", onImportTemplate as EventListener);
    }
  }, []);

  async function justRunCode(code: string) {
    try {
      const result = await runLua(code, globals.activeProcess)
      if (result.Error) {
        return false
      } else {
        return true
      }
    } catch (e: any) {
      console.log(e)
      return false
    }
  }

  async function runCodeAndAddOutput(node: Node, code: string) {
    try {
      const result = await runLua(code, globals.activeProcess)
      if (result.Error) {
        globals.addErrorNode(node)
        globals.addOutput({ type: "error", message: `${result.Error}`, preMessage: `[${node.id}]` })
        return false
      } else {
        globals.addSuccessNode(node)
        globals.addOutput({ type: "output", message: `${parseOutupt(result) || "[no data returned]"}`, preMessage: `[${node.id}] [${result.id}] ` })
        return true
      }
    } catch (e: any) {
      console.log(e)
      globals.addErrorNode(node)
      globals.addOutput({ type: "error", message: `${e.message}`, preMessage: `[${node.id}]` })
      return false
    }
  }

  async function onNodeClick(e: any, node: Node) {
    if (globals.flowIsRunning) return

    if (node.type === "start") {
      if (globals.nodebarOpen)
        globals.toggleNodebar()
      globals.setActiveNode(undefined)
      // iterate over nodes and run them one by one
      const list = getNodesOrdered(nodes, edges)
      globals.setFlowIsRunning(true)
      globals.resetNodes()
      if (globals.consoleRef?.current?.isCollapsed())
        globals.consoleRef?.current?.resize(25);
      for (const node of list) {
        globals.addRunningNode(node)
        try {
          switch (node.type) {
            case "handler-add": {
              const handlerData = node.data as HandlerAddDataType
              const code = embedHandler(handlerData.handlerName, handlerData.actionValue, handlerData.blocklyXml)
              await runCodeAndAddOutput(node, code)
            } break;
            case "ao-send": {
              const sendData = node.data as AOSendDataType
              const code = embedSendFunction(sendData)
              await runCodeAndAddOutput(node, code)
            } break;
            case "function": {
              const funcData = node.data as AOFunctionDataType
              const code = embedFunction(funcData.functionName, funcData.blocklyXml, funcData.runOnAdd)
              await runCodeAndAddOutput(node, code)
            } break;
            case "install-package": {
              const installData = node.data as InstallPackageDataType
              const res = await installAPM(globals.activeProcess)
              console.log(res)
              const code = embedInstallPackageFunction(installData.installedPackages)
              let tries = 0
              while (true) {
                const done = await justRunCode(code)
                if (done) {
                  globals.addSuccessNode(node)
                  globals.addOutput({ type: "output", message: `installed packages`, preMessage: `[${node.id}]` })
                  break;
                } else {
                  tries++
                  if (tries > 5) {
                    globals.addErrorNode(node)
                    globals.addOutput({ type: "error", message: `failed to install packages`, preMessage: `[${node.id}]` })
                    break;
                  }
                }
              }
            } break;
            case "transfer": {
              const transferData = node.data as TransferDataType
              const code = embedTransferFunction(transferData.token, transferData.tokenType, transferData.quantity, transferData.denomination, transferData.quantityType, transferData.to, transferData.toType)
              await runCodeAndAddOutput(node, code)
            } break;
            default: {
              globals.addRunningNode(node)
              globals.addOutput({ type: "warning", message: `unknown node type (check main.tsx)`, preMessage: `[${node.id}]` })
            }
          }
        } catch (e: any) {
          console.log(e)
          globals.addErrorNode(node)
          globals.addOutput({ type: "error", message: `${e.message}`, preMessage: `[${node.id}]` })
          globals.setFlowIsRunning(false)
        }
      }

      globals.setFlowIsRunning(false)
    }
    else if (node.type === "add") {
      if (!globals.nodebarOpen)
        globals.toggleNodebar()
      globals.setActiveNode(undefined)
    }
    else if (Object.keys(customNodes).includes(node.type)) {
      setCenter(node.position.x + 200, node.position.y + 200, { duration: 500, zoom: 1 });
      if (!globals.nodebarOpen)
        globals.toggleNodebar()
      globals.setActiveNode(node)
    }
    else {
      globals.setActiveNode(undefined)
    }
  }

  return (
    <div className="w-full h-[calc(100%-20px)]">
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
        style={{ height: `calc(calc(100vh-20px)-${heightPerc}%) !important` }}
        nodeTypes={Nodes as any}
        edgeTypes={Edges}
        nodes={globals.activeProcess ? nodes :
          [{ id: "no-prc-message", position: { x: 50, y: 50 }, data: { label: "Please select a process to start", muted: true, italic: true }, type: "annotation" }]}
        edges={edges}
        onNodeClick={onNodeClick as any}
        onNodesChange={(e: NodeChange[]) => {
          // prevent deletion
          const e_ = e.filter(e__ => e__.type !== "remove").filter(e__ => !ignoreChangesForNodes.includes((e__ as any).id))
          onNodesChange(e_ as any)
        }}
        onPaneClick={() => {
          globals.setActiveNode(undefined)
          if (globals.nodebarOpen)
            globals.toggleNodebar()
        }}
      >
        {/* <FlowPanel /> */}
        <Background variant={BackgroundVariant.Dots} bgColor="#f2f2f2" />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
