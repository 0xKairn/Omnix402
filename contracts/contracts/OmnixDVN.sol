// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IReceiveUlnE2 } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/interfaces/IReceiveUlnE2.sol";
import { ILayerZeroDVN } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/interfaces/ILayerZeroDVN.sol";

/**
 * @title OmnixDVN
 * @notice Omnix DVN for private bridge - Zero fees, owner-only verification
 * @dev Accepts sender and receiver as bytes32 to support arbitrary remote address formats
 */
contract OmnixDVN is Ownable, ILayerZeroDVN {
    error InvalidLocalEid(uint32 expected, uint32 got);
    event PayloadVerified(bytes32 indexed guid);
    event PayloadCommitted(bytes32 indexed guid);

    uint8 public constant PACKET_VERSION = 1;
    uint32 public immutable localEid;
    IReceiveUlnE2 public immutable receiveUln;

    constructor(address _receiveUln, uint32 _localEid) Ownable(msg.sender) {
        receiveUln = IReceiveUlnE2(_receiveUln);
        localEid = _localEid;
    }

    // Zero fees
    uint256 public constant DVN_FEE = 0;

    function getFee(
        uint32 _dstEid,
        uint64 _confirmations,
        address _sender,
        bytes calldata _options
    ) external pure virtual override returns (uint256 fee) {
        (_dstEid, _confirmations, _sender, _options);
        return DVN_FEE;
    }

    function assignJob(
        AssignJobParam calldata _param,
        bytes calldata _options
    ) external payable virtual override returns (uint256 fee) {
        (_param, _options);
        return DVN_FEE;
    }

    function verify(
        bytes calldata _message,
        uint64 _nonce,
        uint32 _srcEid,
        bytes32 _remoteOApp,
        uint32 _dstEid,
        address _localOApp
    ) external onlyOwner {
        if (_dstEid != localEid) {
            revert InvalidLocalEid(localEid, _dstEid);
        }
        bytes32 localOAppB32 = bytes32(uint256(uint160(_localOApp)));
        bytes32 _guid = _encodeGuid(_nonce, _srcEid, _remoteOApp, _dstEid, localOAppB32);

        receiveUln.verify(
            _encodeHeader(_nonce, _srcEid, _remoteOApp, _dstEid, localOAppB32),
            _encodePayloadHash(_guid, _message),
            1
        );
        emit PayloadVerified(_guid);
    }

    function commit(
        bytes calldata _message,
        uint64 _nonce,
        uint32 _srcEid,
        bytes32 _remoteOApp,
        uint32 _dstEid,
        address _localOApp
    ) external onlyOwner {
        if (_dstEid != localEid) {
            revert InvalidLocalEid(localEid, _dstEid);
        }
        bytes32 localOAppB32 = bytes32(uint256(uint160(_localOApp)));
        bytes32 _guid = _encodeGuid(_nonce, _srcEid, _remoteOApp, _dstEid, localOAppB32);

        receiveUln.commitVerification(
            _encodeHeader(_nonce, _srcEid, _remoteOApp, _dstEid, localOAppB32),
            _encodePayloadHash(_guid, _message)
        );
        emit PayloadCommitted(_guid);
    }

    function _encodeHeader(
        uint64 _nonce,
        uint32 _srcEid,
        bytes32 _sender,
        uint32 _dstEid,
        bytes32 _receiver
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(PACKET_VERSION, _nonce, _srcEid, _sender, _dstEid, _receiver);
    }

    function _encodePayloadHash(bytes32 _guid, bytes memory _message) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_guid, _message));
    }

    function _encodeGuid(
        uint64 _nonce,
        uint32 _srcEid,
        bytes32 _sender,
        uint32 _dstEid,
        bytes32 _receiver
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_nonce, _srcEid, _sender, _dstEid, _receiver));
    }
}

