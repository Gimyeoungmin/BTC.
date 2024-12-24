import React, { useState } from 'react';
import { X } from 'lucide-react';

// Node configuration
const NODE_CONFIG = Array.from({ length: 13 }, (_, i) => ({
  id: i + 1,
  host: '51.158.253.120',
  port: i === 0 ? 300 : 3000 + i,
  name: `Node ${i + 1}`,
  initialBalance: 1000.00000000
}));

const BlockchainWallet = () => {
  const [nodes, setNodes] = useState(NODE_CONFIG.map(node => ({
    ...node,
    connected: true,
    balance: node.initialBalance,
    pendingBalance: 0,
    transactions: [],
    address: `bc1${Math.random().toString(36).substring(2, 15)}` // Simulated BTC address
  })));

  const [selectedNode, setSelectedNode] = useState(1);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [btcAddress, setBtcAddress] = useState('');
  const [isExternalTransfer, setIsExternalTransfer] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const addAlert = (message, type = 'info') => {
    const newAlert = {
      id: Date.now(),
      message,
      type
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  const formatBTC = (value) => {
    return Number(value).toFixed(8);
  };

  const handleNodeConnectionToggle = (nodeId) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, connected: !node.connected }
        : node
    ));
    const node = nodes.find(n => n.id === nodeId);
    addAlert(`Node ${nodeId} ${node.connected ? 'disconnected' : 'connected'}`);
  };

  const validateBtcAddress = (address) => {
    // Basic BTC address validation
    const regex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[ac-hj-np-zAC-HJ-NP-Z02-9]{11,71}$/;
    return regex.test(address);
  };

  const handleRealBtcTransfer = async (sourceNode, amount, address) => {
    try {
      // Here you would integrate with a real BTC wallet/node API
      console.log(`Initiating real BTC transfer of ${amount} from node ${sourceNode.id} to ${address}`);
      
      // Example API call (replace with actual implementation)
      const response = await fetch('https://api.example.com/btc/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAddress: sourceNode.address,
          toAddress: address,
          amount: amount,
        }),
      });

      if (!response.ok) {
        throw new Error('Transfer failed');
      }

      return true;
    } catch (error) {
      console.error('BTC transfer error:', error);
      addAlert(`Transfer failed: ${error.message}`, 'error');
      return false;
    }
  };
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (isExternalTransfer) {
        if (!btcAddress || !amount) return;
        if (!validateBtcAddress(btcAddress)) {
            addAlert('Invalid BTC address', 'error');
            return;
        }
        try {
            const txid = await processBitcoinTransaction(
                sourceNode.wallet,
                btcAddress,
                parseFloat(amount)
            );
            addAlert(`Transaction broadcast successful. TXID: ${txid}`);
        } catch (error) {
            addAlert(`Transaction failed: ${error.message}`, 'error');
            return;
        }
    } else {
        if (!recipient || !amount) return;
    }

    const sourceNode = nodes.find(n => n.id === selectedNode);
    const targetNode = nodes.find(n => n.id === parseInt(recipient));
    const parsedAmount = parseFloat(amount);

    if ((!sourceNode || !targetNode) && !isExternalTransfer) {
        addAlert('Invalid nodes selected', 'error');
        return;
    }

    if (parsedAmount <= 0 || parsedAmount > sourceNode.balance) {
        addAlert('Invalid amount or insufficient balance', 'error');
        return;
    }

    const transactionFee = parsedAmount * 0.0001;
    const totalAmount = parsedAmount + transactionFee;

    const transaction = {
        id: `TX-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        from: sourceNode.id,
        to: isExternalTransfer ? btcAddress : targetNode.id,
        amount: parsedAmount,
        fee: transactionFee,
        timestamp: new Date().toISOString(),
        status: 'PENDING'
    };

    setNodes(prev => prev.map(node => {
        if (node.id === sourceNode.id) {
            return {
                ...node,
                balance: node.balance - totalAmount,
                transactions: [transaction, ...node.transactions]
            };
        }
        if (!isExternalTransfer && node.id === targetNode.id) {
            return {
                ...node,
                balance: node.balance + parsedAmount,
                transactions: [transaction, ...node.transactions]
            };
        }
        return node;
    }));

    addAlert(`Transfer of ${formatBTC(parsedAmount)} BTC initiated`);
    setShowTransferModal(false);
    setRecipient('');
    setAmount('');
    setBtcAddress('');

    setTimeout(() => {
        setNodes(prev => prev.map(node => ({
            ...node,
            transactions: node.transactions.map(tx => 
                tx.id === transaction.id 
                    ? { ...tx, status: 'COMPLETED' }
                    : tx
            )
        })));
        addAlert(`Transfer of ${formatBTC(parsedAmount)} BTC completed`);
    }, 3000);
};

  const renderNodeCard = (node) => (
    <div key={node.id} className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{node.name}</h3>
        <button
          onClick={() => handleNodeConnectionToggle(node.id)}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            node.connected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}
        >
          {node.connected ? 'Connected' : 'Disconnected'}
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-gray-500">
          {node.host}:{node.port}
        </p>
        <p className="text-lg font-bold">
          {formatBTC(node.balance)} BTC
        </p>
        <button
          onClick={() => {
            setSelectedNode(node.id);
            setShowTransferModal(true);
          }}
          className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Transfer
        </button>
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {node.transactions.slice(0, 3).map(tx => (
            <div key={tx.id} className="text-sm border-b pb-2">
              <div className="flex justify-between">
                <span>{tx.id}</span>
                <span className={
                  tx.status === 'COMPLETED' 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                }>
                  {tx.status}
                </span>
              </div>
              <div className="text-gray-500">
                {formatBTC(tx.amount)} BTC
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Multi-Node Blockchain Wallet
        </h1>
        <p className="text-gray-600 mt-2">
          Managing {nodes.length} nodes
        </p>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="mb-6">
          {alerts.map(alert => (
            <div key={alert.id} className="mb-2 p-4 rounded-lg bg-blue-100 text-blue-800">
              {alert.message}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {nodes.map(renderNodeCard)}
        </div>

        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Transfer BTC</h3>
                <button 
                  onClick={() => setShowTransferModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    From
                  </label>
                  <select
                    value={selectedNode}
                    onChange={(e) => setSelectedNode(parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    {nodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.name} - {formatBTC(node.balance)} BTC
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsExternalTransfer(false)}
                      className={`px-4 py-2 rounded-lg ${!isExternalTransfer 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700'}`}
                    >
                      Internal Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsExternalTransfer(true)}
                      className={`px-4 py-2 rounded-lg ${isExternalTransfer 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700'}`}
                    >
                      External Transfer
                    </button>
                  </div>
                </div>

                {!isExternalTransfer ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      To Node
                    </label>
                    <select
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                      <option value="">Select recipient node</option>
                      {nodes
                        .filter(node => node.id !== selectedNode)
                        .map(node => (
                          <option key={node.id} value={node.id}>
                            {node.name} - {formatBTC(node.balance)} BTC
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      To BTC Address
                    </label>
                    <input
                      type="text"
                      value={btcAddress}
                      onChange={(e) => setBtcAddress(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      placeholder="Enter BTC address"
                    />
                    {btcAddress && !validateBtcAddress(btcAddress) && (
                      <p className="mt-1 text-sm text-red-600">
                        Invalid BTC address format
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount (BTC)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.00000001"
                    min="0.00000001"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="0.00000000"
                  />
                  {amount && (
                    <p className="mt-1 text-sm text-gray-500">
                      Fee: {formatBTC(parseFloat(amount) * 0.0001)} BTC
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Transfer
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BlockchainWallet;import React, { useState } from 'react';
import { X } from 'lucide-react';

// Node configuration
const NODE_CONFIG = Array.from({ length: 13 }, (_, i) => ({
  id: i + 1,
  host: '51.158.253.120',
  port: i === 0 ? 300 : 3000 + i,
  name: `Node ${i + 1}`,
  initialBalance: 1000.00000000
}));

const BlockchainWallet = () => {
  const [nodes, setNodes] = useState(NODE_CONFIG.map(node => ({
    ...node,
    connected: true,
    balance: node.initialBalance,
    pendingBalance: 0,
    transactions: [],
    address: `bc1${Math.random().toString(36).substring(2, 15)}` // Simulated BTC address
  })));

  const [selectedNode, setSelectedNode] = useState(1);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [btcAddress, setBtcAddress] = useState('');
  const [isExternalTransfer, setIsExternalTransfer] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const addAlert = (message, type = 'info') => {
    const newAlert = {
      id: Date.now(),
      message,
      type
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  const formatBTC = (value) => {
    return Number(value).toFixed(8);
  };

  const handleNodeConnectionToggle = (nodeId) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, connected: !node.connected }
        : node
    ));
    const node = nodes.find(n => n.id === nodeId);
    addAlert(`Node ${nodeId} ${node.connected ? 'disconnected' : 'connected'}`);
  };

  const validateBtcAddress = (address) => {
    // Basic BTC address validation
    const regex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[ac-hj-np-zAC-HJ-NP-Z02-9]{11,71}$/;
    return regex.test(address);
  };

  const handleRealBtcTransfer = async (sourceNode, amount, address) => {
    try {
      // Here you would integrate with a real BTC wallet/node API
      console.log(`Initiating real BTC transfer of ${amount} from node ${sourceNode.id} to ${address}`);
      
      // Example API call (replace with actual implementation)
      const response = await fetch('https://api.example.com/btc/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAddress: sourceNode.address,
          toAddress: address,
          amount: amount,
        }),
      });

      if (!response.ok) {
        throw new Error('Transfer failed');
      }

      return true;
    } catch (error) {
      console.error('BTC transfer error:', error);
      addAlert(`Transfer failed: ${error.message}`, 'error');
      return false;
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (isExternalTransfer) {
      if (!btcAddress || !amount) return;
      if (!validateBtcAddress(btcAddress)) {
        addAlert('Invalid BTC address', 'error');
        return;
      }
    } else {
      if (!recipient || !amount) return;
    }

    const sourceNode = nodes.find(n => n.id === selectedNode);
    const targetNode = nodes.find(n => n.id === parseInt(recipient));
    const parsedAmount = parseFloat(amount);

    if (!sourceNode || !targetNode) {
      addAlert('Invalid nodes selected', 'error');
      return;
    }

    if (parsedAmount <= 0 || parsedAmount > sourceNode.balance) {
      addAlert('Invalid amount or insufficient balance', 'error');
      return;
    }

    const transactionFee = parsedAmount * 0.0001;
    const totalAmount = parsedAmount + transactionFee;

    const transaction = {
      id: `TX-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
      from: sourceNode.id,
      to: targetNode.id,
      amount: parsedAmount,
      fee: transactionFee,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };

    setNodes(prev => prev.map(node => {
      if (node.id === sourceNode.id) {
        return {
          ...node,
          balance: node.balance - totalAmount,
          transactions: [transaction, ...node.transactions]
        };
      }
      if (node.id === targetNode.id) {
        return {
          ...node,
          balance: node.balance + parsedAmount,
          transactions: [transaction, ...node.transactions]
        };
      }
      return node;
    }));

    addAlert(`Transfer of ${formatBTC(parsedAmount)} BTC initiated`);
    setShowTransferModal(false);
    setRecipient('');
    setAmount('');

    setTimeout(() => {
      setNodes(prev => prev.map(node => ({
        ...node,
        transactions: node.transactions.map(tx => 
          tx.id === transaction.id 
            ? { ...tx, status: 'COMPLETED' }
            : tx
        )
      })));
      addAlert(`Transfer of ${formatBTC(parsedAmount)} BTC completed`);
    }, 3000);
  };

  const renderNodeCard = (node) => (
    <div key={node.id} className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{node.name}</h3>
        <button
          onClick={() => handleNodeConnectionToggle(node.id)}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            node.connected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}
        >
          {node.connected ? 'Connected' : 'Disconnected'}
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-gray-500">
          {node.host}:{node.port}
        </p>
        <p className="text-lg font-bold">
          {formatBTC(node.balance)} BTC
        </p>
        <button
          onClick={() => {
            setSelectedNode(node.id);
            setShowTransferModal(true);
          }}
          className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Transfer
        </button>
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {node.transactions.slice(0, 3).map(tx => (
            <div key={tx.id} className="text-sm border-b pb-2">
              <div className="flex justify-between">
                <span>{tx.id}</span>
                <span className={
                  tx.status === 'COMPLETED' 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                }>
                  {tx.status}
                </span>
              </div>
              <div className="text-gray-500">
                {formatBTC(tx.amount)} BTC
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Multi-Node Blockchain Wallet
        </h1>
        <p className="text-gray-600 mt-2">
          Managing {nodes.length} nodes
        </p>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="mb-6">
          {alerts.map(alert => (
            <div key={alert.id} className="mb-2 p-4 rounded-lg bg-blue-100 text-blue-800">
              {alert.message}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {nodes.map(renderNodeCard)}
        </div>

        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Transfer BTC</h3>
                <button 
                  onClick={() => setShowTransferModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    From
                  </label>
                  <select
                    value={selectedNode}
                    onChange={(e) => setSelectedNode(parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    {nodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.name} - {formatBTC(node.balance)} BTC
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsExternalTransfer(false)}
                      className={`px-4 py-2 rounded-lg ${!isExternalTransfer 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700'}`}
                    >
                      Internal Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsExternalTransfer(true)}
                      className={`px-4 py-2 rounded-lg ${isExternalTransfer 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700'}`}
                    >
                      External Transfer
                    </button>
                  </div>
                </div>

                {!isExternalTransfer ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      To Node
                    </label>
                    <select
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                      <option value="">Select recipient node</option>
                      {nodes
                        .filter(node => node.id !== selectedNode)
                        .map(node => (
                          <option key={node.id} value={node.id}>
                            {node.name} - {formatBTC(node.balance)} BTC
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      To BTC Address
                    </label>
                    <input
                      type="text"
                      value={btcAddress}
                      onChange={(e) => setBtcAddress(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      placeholder="Enter BTC address"
                    />
                    {btcAddress && !validateBtcAddress(btcAddress) && (
                      <p className="mt-1 text-sm text-red-600">
                        Invalid BTC address format
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount (BTC)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.00000001"
                    min="0.00000001"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="0.00000000"
                  />
                  {amount && (
                    <p className="mt-1 text-sm text-gray-500">
                      Fee: {formatBTC(parseFloat(amount) * 0.0001)} BTC
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Transfer
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BlockchainWallet;