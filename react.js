// BlockchainWallet 컴포넌트 수정
const BlockchainWallet = () => {
  // 13개 노드 상태 관리
  const [nodes, setNodes] = useState([
    { id: 1, host: '51.158.253.120', port: 300, connected: true, balance: 1000.0 },
    { id: 2, host: '51.158.253.120', port: 3001, connected: true, balance: 1000.0 },
    { id: 3, host: '51.158.253.120', port: 3002, connected: true, balance: 1000.0 },
    { id: 4, host: '51.158.253.120', port: 3003, connected: true, balance: 1000.0 },
    { id: 5, host: '51.158.253.120', port: 3004, connected: true, balance: 1000.0 },
    { id: 6, host: '51.158.253.120', port: 3005, connected: true, balance: 1000.0 },
    { id: 7, host: '51.158.253.120', port: 3006, connected: true, balance: 1000.0 },
    { id: 8, host: '51.158.253.120', port: 3007, connected: true, balance: 1000.0 },
    { id: 9, host: '51.158.253.120', port: 3008, connected: true, balance: 1000.0 },
    { id: 10, host: '51.158.253.120', port: 3009, connected: true, balance: 1000.0 },
    { id: 11, host: '51.158.253.120', port: 3010, connected: true, balance: 1000.0 },
    { id: 12, host: '51.158.253.120', port: 3011, connected: true, balance: 1000.0 },
    { id: 13, host: '51.158.253.120', port: 3012, connected: true, balance: 1000.0 }
  ]);

  // 노드 선택 상태
  const [selectedNode, setSelectedNode] = useState(1);

  // 전송 모달에 노드 선택기 추가
  const renderNodeSelector = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Select Node
      </label>
      <select 
        value={selectedNode}
        onChange={(e) => setSelectedNode(parseInt(e.target.value))}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
      >
        {nodes.map(node => (
          <option key={node.id} value={node.id}>
            Node {node.id} ({node.host}:{node.port})
          </option>
        ))}
      </select>
    </div>
  );

  // 노드 상태 표시 추가
  const renderNodeStatuses = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {nodes.map(node => (
        <div key={node.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Node {node.id}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              node.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {node.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {node.host}:{node.port}
          </p>
          <p className="text-sm font-medium mt-2">
            Balance: {node.balance.toFixed(8)} BTC
          </p>
        </div>
      ))}
    </div>
  );

  // 트랜잭션 처리 수정
  const handleTransaction = async (sourceNodeId, targetNodeId, amount) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    const targetNode = nodes.find(n => n.id === targetNodeId);
    
    if (!sourceNode || !targetNode) {
      addAlert('Invalid nodes selected');
      return false;
    }

    if (sourceNode.balance < amount) {
      addAlert('Insufficient balance');
      return false;
    }

    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === sourceNodeId) {
        return { ...node, balance: node.balance - amount };
      }
      if (node.id === targetNodeId) {
        return { ...node, balance: node.balance + amount };
      }
      return node;
    }));

    return true;
  };

  // 기존 JSX에 노드 상태 표시 추가
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 기존 헤더 */}
      <header>...</header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* 노드 상태 표시 */}
        {renderNodeStatuses()}

        {/* 기존 컨텐츠 */}
        ...

        {/* 전송 모달 수정 */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Transfer BTC</h3>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  {renderNodeSelector()}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Target Node
                    </label>
                    <select
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    >
                      <option value="">Select Target Node</option>
                      {nodes
                        .filter(n => n.id !== selectedNode)
                        .map(node => (
                          <option key={node.id} value={node.id}>
                            Node {node.id} ({node.host}:{node.port})
                          </option>
                        ))}
                    </select>
                  </div>
                  {/* 기존 금액 입력 필드 */}
                  ...
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};