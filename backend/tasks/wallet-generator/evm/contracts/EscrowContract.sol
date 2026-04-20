// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EscrowContract {
    address public immutable relayer;

    enum OrderStatus { FUNDED, RELEASED, REFUNDED, DISPUTED }

    struct EscrowOrder {
        address seller;
        address providerWallet;
        uint256 amount;
        OrderStatus status;
        uint256 createdAt;
    }

    mapping(bytes32 => EscrowOrder) public orders;

    event OrderCreated(bytes32 indexed orderId, address seller, address providerWallet, uint256 amount);
    event FundsReleased(bytes32 indexed orderId, address providerWallet, uint256 amount);
    event FundsRefunded(bytes32 indexed orderId, address seller, uint256 amount);
    event DisputeOpened(bytes32 indexed orderId);

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer");
        _;
    }

    constructor() {
        relayer = msg.sender;
    }

    /// @notice Backend deposits funds on behalf of the seller into escrow
    /// @param orderId Unique order identifier (keccak256 hash of UUID)
    /// @param seller Address of the seller's wallet
    /// @param providerWallet Address of the provider's destination wallet
    function createOrder(
        bytes32 orderId,
        address seller,
        address providerWallet
    ) external payable {
        require(msg.value > 0, "No value sent");
        require(orders[orderId].amount == 0, "Order already exists");
        require(seller != address(0), "Invalid seller");
        require(providerWallet != address(0), "Invalid provider wallet");

        orders[orderId] = EscrowOrder({
            seller: seller,
            providerWallet: providerWallet,
            amount: msg.value,
            status: OrderStatus.FUNDED,
            createdAt: block.timestamp
        });

        emit OrderCreated(orderId, seller, providerWallet, msg.value);
    }

    /// @notice Release escrowed funds to the provider's wallet
    /// @param orderId The order to release funds for
    function releaseFunds(bytes32 orderId) external onlyRelayer {
        EscrowOrder storage order = orders[orderId];
        require(order.amount > 0, "Order not found");
        require(order.status == OrderStatus.FUNDED, "Order not in funded state");

        order.status = OrderStatus.RELEASED;

        (bool success, ) = payable(order.providerWallet).call{value: order.amount}("");
        require(success, "Transfer to provider failed");

        emit FundsReleased(orderId, order.providerWallet, order.amount);
    }

    /// @notice Refund escrowed funds back to the seller (dispute resolution or cancellation)
    /// @param orderId The order to refund
    function refundFunds(bytes32 orderId) external onlyRelayer {
        EscrowOrder storage order = orders[orderId];
        require(order.amount > 0, "Order not found");
        require(
            order.status == OrderStatus.FUNDED || order.status == OrderStatus.DISPUTED,
            "Cannot refund in current state"
        );

        order.status = OrderStatus.REFUNDED;

        (bool success, ) = payable(order.seller).call{value: order.amount}("");
        require(success, "Refund to seller failed");

        emit FundsRefunded(orderId, order.seller, order.amount);
    }

    /// @notice Mark an order as disputed (freezes funds until admin resolution)
    /// @param orderId The order to dispute
    function markDisputed(bytes32 orderId) external onlyRelayer {
        EscrowOrder storage order = orders[orderId];
        require(order.amount > 0, "Order not found");
        require(order.status == OrderStatus.FUNDED, "Can only dispute funded orders");

        order.status = OrderStatus.DISPUTED;
        emit DisputeOpened(orderId);
    }

    /// @notice Get order details
    function getOrder(bytes32 orderId) external view returns (
        address seller,
        address providerWallet,
        uint256 amount,
        OrderStatus status,
        uint256 createdAt
    ) {
        EscrowOrder storage order = orders[orderId];
        return (order.seller, order.providerWallet, order.amount, order.status, order.createdAt);
    }

    /// @notice Get contract balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Allow contract to receive ETH directly (for gas refills)
    receive() external payable {}
}
