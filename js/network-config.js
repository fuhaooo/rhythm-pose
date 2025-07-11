/**
 * Network Configuration for Rhythm Pose
 * Supports multiple networks including Sonic Blaze Testnet
 */

const NetworkConfig = {
    // Sonic Blaze Testnet Configuration
    sonicBlaze: {
        chainId: '0xDEDE', // 57054 in hex
        chainName: 'Sonic Blaze Testnet',
        nativeCurrency: {
            name: 'Sonic',
            symbol: 'S',
            decimals: 18
        },
        rpcUrls: ['https://rpc.blaze.soniclabs.com'],
        blockExplorerUrls: ['https://blaze.soniclabs.com/']
    },
    
    // Ethereum Mainnet (for reference)
    ethereum: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
        blockExplorerUrls: ['https://etherscan.io/']
    },
    
    // Polygon Mumbai Testnet (for reference)
    mumbai: {
        chainId: '0x13881',
        chainName: 'Polygon Mumbai Testnet',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com/']
    }
};

/**
 * Network Manager Class
 * Handles network switching and configuration
 */
class NetworkManager {
    constructor() {
        this.currentNetwork = null;
        this.web3Provider = null;
        this.defaultNetwork = 'sonicBlaze'; // Default to Sonic Blaze Testnet
    }

    /**
     * Initialize network manager
     */
    async initialize() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                this.web3Provider = window.ethereum;
                
                // Get current network
                const chainId = await this.web3Provider.request({ method: 'eth_chainId' });
                this.currentNetwork = this.getNetworkByChainId(chainId);
                
                console.log('🌐 Network Manager initialized:', {
                    currentChainId: chainId,
                    currentNetwork: this.currentNetwork
                });
                
                return true;
            } else {
                throw new Error('No Web3 provider found');
            }
        } catch (error) {
            console.error('❌ Network Manager initialization failed:', error);
            return false;
        }
    }

    /**
     * Get network configuration by chain ID
     */
    getNetworkByChainId(chainId) {
        for (const [networkName, config] of Object.entries(NetworkConfig)) {
            if (config.chainId === chainId) {
                return networkName;
            }
        }
        return 'unknown';
    }

    /**
     * Switch to Sonic Blaze Testnet
     */
    async switchToSonicBlaze() {
        return await this.switchNetwork('sonicBlaze');
    }

    /**
     * Switch to specified network
     */
    async switchNetwork(networkName) {
        try {
            if (!NetworkConfig[networkName]) {
                throw new Error(`Network ${networkName} not configured`);
            }

            const networkConfig = NetworkConfig[networkName];
            
            // Try to switch to the network
            try {
                await this.web3Provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: networkConfig.chainId }],
                });
                
                this.currentNetwork = networkName;
                console.log(`✅ Switched to ${networkConfig.chainName}`);
                return true;
                
            } catch (switchError) {
                // If network doesn't exist, add it
                if (switchError.code === 4902) {
                    await this.addNetwork(networkName);
                    return await this.switchNetwork(networkName);
                } else {
                    throw switchError;
                }
            }
            
        } catch (error) {
            console.error(`❌ Failed to switch to ${networkName}:`, error);
            throw error;
        }
    }

    /**
     * Add network to MetaMask
     */
    async addNetwork(networkName) {
        try {
            const networkConfig = NetworkConfig[networkName];
            
            await this.web3Provider.request({
                method: 'wallet_addEthereumChain',
                params: [networkConfig],
            });
            
            console.log(`✅ Added ${networkConfig.chainName} to MetaMask`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to add ${networkName}:`, error);
            throw error;
        }
    }

    /**
     * Get current network configuration
     */
    getCurrentNetworkConfig() {
        if (this.currentNetwork && NetworkConfig[this.currentNetwork]) {
            return NetworkConfig[this.currentNetwork];
        }
        return null;
    }

    /**
     * Check if current network is Sonic Blaze
     */
    isSonicBlaze() {
        return this.currentNetwork === 'sonicBlaze';
    }

    /**
     * Get network status
     */
    getStatus() {
        return {
            currentNetwork: this.currentNetwork,
            networkConfig: this.getCurrentNetworkConfig(),
            isConnected: !!this.web3Provider,
            isSonicBlaze: this.isSonicBlaze()
        };
    }

    /**
     * Listen for network changes
     */
    onNetworkChange(callback) {
        if (this.web3Provider) {
            this.web3Provider.on('chainChanged', (chainId) => {
                this.currentNetwork = this.getNetworkByChainId(chainId);
                console.log('🔄 Network changed to:', this.currentNetwork);
                if (callback) callback(this.currentNetwork, chainId);
            });
        }
    }

    /**
     * Format balance for display
     */
    formatBalance(balance, decimals = 4) {
        const networkConfig = this.getCurrentNetworkConfig();
        const symbol = networkConfig ? networkConfig.nativeCurrency.symbol : 'ETH';
        
        if (typeof balance === 'string') {
            balance = parseFloat(balance);
        }
        
        return `${balance.toFixed(decimals)} ${symbol}`;
    }
}

// Export for global use
window.NetworkConfig = NetworkConfig;
window.NetworkManager = NetworkManager;

console.log('🌐 Network configuration loaded');
console.log('📋 Available networks:', Object.keys(NetworkConfig));
