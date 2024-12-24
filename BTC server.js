const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');
const axios = require('axios');

const ECPair = ECPairFactory(ecc);
const network = bitcoin.networks.bitcoin; // mainnet
// const network = bitcoin.networks.testnet; // testnet

// 비트코인 트랜잭션 처리 함수
async function processBitcoinTransaction(sourceWallet, targetAddress, amount) {
    try {
        const keyPair = ECPair.fromWIF(sourceWallet.privateKey, network);
        const { address } = bitcoin.payments.p2pkh({ 
            pubkey: keyPair.publicKey,
            network 
        });

        // UTXO 데이터 가져오기
        const utxos = await getUTXOs(address);
        
        // 트랜잭션 생성
        const txb = new bitcoin.TransactionBuilder(network);
        
        let totalAmount = 0;
        utxos.forEach(utxo => {
            txb.addInput(utxo.txid, utxo.vout);
            totalAmount += utxo.value;
        });

        // 수수료 계산 (예시: 1000 satoshis)
        const fee = 1000;
        const amountToSend = Math.floor(amount * 100000000); // BTC to satoshis
        const changeAmount = totalAmount - amountToSend - fee;

        // 출력 추가
        txb.addOutput(targetAddress, amountToSend);
        if (changeAmount > 0) {
            txb.addOutput(address, changeAmount);
        }

        // 트랜잭션 서명
        utxos.forEach((utxo, index) => {
            txb.sign(index, keyPair);
        });

        // 최종 트랜잭션 생성
        const tx = txb.build();
        const txHex = tx.toHex();

        // 트랜잭션 브로드캐스트
        const response = await broadcastTransaction(txHex);
        return response.data.txid;

    } catch (error) {
        console.error('Bitcoin transaction error:', error);
        throw error;
    }
}

// UTXO 데이터 가져오기
async function getUTXOs(address) {
    const response = await axios.get(`https://blockchain.info/unspent?active=${address}`);
    return response.data.unspent_outputs;
}

// 트랜잭션 브로드캐스트
async function broadcastTransaction(txHex) {
    return await axios.post('https://blockchain.info/pushtx', {
        tx: txHex
    });
}