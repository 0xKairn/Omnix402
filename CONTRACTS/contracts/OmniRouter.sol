// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
contract OmniRouter {
    constructor() {}

    function execute(
        address from,
        address to,
        uint256 value,
        bytes32 nonce,
        bytes memory data
    ) external returns (bool) {
        // TODO bridge

        console2.log("YEES");
        return true;
    }
}
