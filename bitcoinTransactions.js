const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
const ecc = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');

const ECPair = ECPairFactory(ecc);
const network = bitcoin.networks.bitcoin; // mainnet, testnet으로 변경 가능

// UTXO 데이터를 가져오는 함수
async function getUTXOs(address) {
    try {
        // Blockstream API 사용
        const response = await axios.get(`https://blockstream.info/api/address/${address}/utxo`);
        return response.data;
    } catch (error) {
        console.error('Error fetching UTXOs:', error);
        throw new Error('Failed to fetch UTXOs');
    }
}

// 트랜잭션 수수료 계산
function calculateFee(inputCount, outputCount) {
    // 기본 트랜잭션 크기 계산
    const baseSize = 10; // 버전 + locktime
    const inputSize = inputCount * 148; // 평균 입력 크기
    const outputSize = outputCount * 34; // 평균 출력 크기
    const totalSize = baseSize + inputSize + outputSize;
    
    // satoshis/byte 단위로 수수료 계산 (현재 시세에 따라 조정 필요)
    const feeRate = 100; // satoshis/byte
    return totalSize * feeRate;
}

async function processBitcoinTransaction(sourceWallet, destinationAddress, amountBTC) {
    try {
        // 개인키로부터 키페어 생성
        const keyPair = ECPair.fromWIF(sourceWallet.privateKey, network);
        const { address } = bitcoin.payments.p2pkh({ 
            pubkey: keyPair.publicKey,
            network 
        });

        // UTXO 데이터 가져오기
        const utxos = await getUTXOs(address);
        if (!utxos.length) {
            throw new Error('No available UTXOs');
        }

        // 트랜잭션 빌더 생성
        const psbt = new bitcoin.Psbt({ network });
        
        // BTC를 satoshi로 변환
        const amountSatoshi = Math.floor(amountBTC * 100000000);
        let inputAmount = 0;

        // 입력 추가
        for (const utxo of utxos) {
            psbt.addInput({
                hash: utxo.txid,
                index: utxo.vout,
                witnessUtxo: {
                    script: bitcoin.address.toOutputScript(address, network),
                    value: utxo.value
                }
            });
            inputAmount += utxo.value;
            if (inputAmount >= amountSatoshi) {
                break;
            }
        }

        // 수수료 계산
        const fee = calculateFee(psbt.inputCount, 2); // 2 outputs: destination + change
        
        // 잔액 확인
        if (inputAmount < amountSatoshi + fee) {
            throw new Error('Insufficient funds including fee');
        }

        // 출력 추가 (목적지 주소)
        psbt.addOutput({
            address: destinationAddress,
            value: amountSatoshi
        });

        // 잔액이 있다면 change 출력 추가
        const changeAmount = inputAmount - amountSatoshi - fee;
        if (changeAmount > 546) { // dust limit
            psbt.addOutput({
                address: address,
                value: changeAmount
            });
        }

        // 모든 입력에 서명
        psbt.signAllInputs(keyPair);
        psbt.finalizeAllInputs();

        // 최종 트랜잭션 추출
        const transaction = psbt.extractTransaction();
        const transactionHex = transaction.toHex();

        // 트랜잭션 브로드캐스트
        const broadcastResult = await broadcastTransaction(transactionHex);

        return broadcastResult.data.txid;
    } catch (error) {
        console.error('Bitcoin transaction error:', error);
        throw new Error(error.message || 'Transaction failed');
    }
}

// 트랜잭션을 네트워크에 브로드캐스트
async function broadcastTransaction(transactionHex) {
    try {
        // Blockstream API 사용
        return await axios.post('https://blockstream.info/api/tx', transactionHex);
    } catch (error) {
        console.error('Broadcast error:', error);
        throw new Error('Failed to broadcast transaction');
    }
}

// 기존 handleTransfer 함수 내에서 호출
const handleTransfer = async (e) => {
    e.preventDefault();
    if (isExternalTransfer) {
        try {
            const txid = await processBitcoinTransaction(
                sourceNode.wallet,
                btcAddress,
                parseFloat(amount)
            );
            addAlert(`Transaction broadcast successful. TXID: ${txid}`);
            
            // 트랜잭션 추적을 위한 상태 업데이트
            const transaction = {
                id: txid,
                from: sourceNode.address,
                to: btcAddress,
                amount: parseFloat(amount),
                timestamp: new Date().toISOString(),
                status: 'PENDING'
            };
            
            // 노드 상태 업데이트
            setNodes(prev => prev.map(node => {
                if (node.id === selectedNode) {
                    return {
                        ...node,
                        transactions: [transaction, ...node.transactions]
                    };
                }
                return node;
            }));

            // 트랜잭션 상태 모니터링 시작
            monitorTransaction(txid);
            
        } catch (error) {
            addAlert(`Transaction failed: ${error.message}`, 'error');
            return;
        }
    }
    // ... 나머지 코드
};

// 트랜잭션 상태 모니터링
async function monitorTransaction(txid) {
    const checkStatus = async () => {
        try {
            const response = await axios.get(`https://blockstream.info/api/tx/${txid}`);
            const confirmations = response.data.status.confirmed ? response.data.status.block_height : 0;
            
            if (confirmations > 0) {
                // 트랜잭션이 확인됨
                setNodes(prev => prev.map(node => ({
                    ...node,
                    transactions: node.transactions.map(tx => 
                        tx.id === txid 
                            ? { ...tx, status: 'COMPLETED', confirmations } 
                            : tx
                    )
                })));
                addAlert(`Transaction ${txid} confirmed with ${confirmations} confirmations`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error monitoring transaction:', error);
            return false;
        }
    };

    // 10초마다 상태 확인
    const interval = setInterval(async () => {
        const confirmed = await checkStatus();
        if (confirmed) {
            clearInterval(interval);
        }
    }, 10000);
}