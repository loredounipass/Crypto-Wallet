// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Interfaz mínima requerida para interactuar con tokens ERC-20
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract WalletContract {

    uint256 private constant MIN = 10000000000000000; // 0.01 
    address private constant HOT_WALLET = 0xA3c3a32Fe09709f30CCbfaD233c12b85290361d1;
    // REEMPLAZA ESTA DIRECCIÓN CON LA LLAVE PÚBLICA DE TU RELAYER (El que paga el gas en el backend)
    address private constant RELAYER_WALLET = 0x91a2b4dF6Ca3C09C5B5B170AD319D7fec2F8EEFD; 

    event DepositedOnMetaDapp();
    event TokenForwarded(address indexed token, uint256 amount);

    modifier onlyRelayer() {
        require(msg.sender == RELAYER_WALLET, "Not authorized: only relayer");
        _;
    }

    // --- LÓGICA ORIGINAL PARA MONEDA NATIVA ---
    function forward() private {
        if(msg.value >= MIN){
            (bool success, ) = payable(HOT_WALLET).call{value: address(this).balance}("");
            require(success);
            emit DepositedOnMetaDapp();
        }
    }

    receive() external payable { forward(); }
    fallback() external payable { forward(); }

    // --- NUEVA LÓGICA COMPATIBLE CON CUALQUIER ERC-20 (INCLUYENDO USDT) ---
    // Esta función permite enviar el saldo de CUALQUIER token a la HOT_WALLET
    function forwardToken(address tokenAddress) external onlyRelayer {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        
        require(balance > 0, "No hay tokens para transferir");
        
        // Llamada de bajo nivel (low-level call) para soportar USDT en Mainnet
        // ya que el transfer de USDT no retorna un booleano y haría revert de la forma tradicional.
        (bool success, bytes memory data) = tokenAddress.call(
            abi.encodeWithSelector(token.transfer.selector, HOT_WALLET, balance)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transferencia ERC20 fallida");
        
        emit TokenForwarded(tokenAddress, balance);
    }
}