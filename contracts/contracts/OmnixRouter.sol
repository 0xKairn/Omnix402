// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OptionsBuilder } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";
import {
    IOFT,
    SendParam,
    OFTLimit,
    OFTReceipt,
    OFTFeeDetail,
    MessagingReceipt,
    MessagingFee
} from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";

contract OmnixRouter is Ownable {
    using OptionsBuilder for bytes;

    constructor(address _owner) Ownable(_owner) {}

    // To know what is the endpointId of any supported chains
    mapping(uint256 => uint32) public chainIdToEid;

    // To know what is the oft token USDO of any supported chains
    mapping(uint256 => address) public chainIdToOFT;

    error InvalidChainId();
    error InvalidReceiver();

    // =====================================================
    // -------------- OFTCore Implementations --------------
    // =====================================================

    function setChainIdEidOFT(uint256 chainId, uint32 eid, address oftAddress) external onlyOwner {
        chainIdToEid[chainId] = eid;
        chainIdToOFT[chainId] = oftAddress;
    }

    function execute(
        address from,
        address to,
        uint256 value,
        bytes32 nonce,
        bytes memory data
    ) external returns (bool) {
        OFT oft = OFT(msg.sender);
        (uint256 chainIdTo, address receiver) = abi.decode(data, (uint256, address));

        if (chainIdTo == 0 || chainIdTo == block.chainid) {
            revert InvalidChainId();
        }

        if (receiver == address(0)) {
            revert InvalidReceiver();
        }

        bytes memory extraOptions = OptionsBuilder.newOptions().addExecutorLzReceiveOption(150000, 0);

        SendParam memory sendParam = SendParam({
            dstEid: chainIdToEid[chainIdTo],
            to: bytes32(uint256(uint160(chainIdToOFT[chainIdTo]))),
            amountLD: value,
            minAmountLD: value,
            extraOptions: extraOptions,
            composeMsg: abi.encode(nonce, receiver, from),
            oftCmd: bytes("")
        });

        MessagingFee memory msgFee = oft.quoteSend(sendParam, false);

        oft.send(sendParam, msgFee, address(this));

        return true;
    }
}
