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
        } catch (error) {
            addAlert(`Transaction failed: ${error.message}`, 'error');
            return;
        }
    }
    // ... 나머지 코드는 그대로 유지
};