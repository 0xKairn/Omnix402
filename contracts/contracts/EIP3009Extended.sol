// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import { EIP712Domain } from "./lib/EIP712Domain.sol";
import { EIP712 } from "./lib/EIP712.sol";
import { EIP3009 } from "./lib/EIP3009.sol";

/*
TO IMPROVE : 
We propose an extended version of EIP3009.

This version enables more data to be signed and included in the authorization process.
This is done by overriding the type hashes for TransferWithAuthorization and ReceiveWithAuthorization
to include one field name "data" of type bytes in the struct.
*/

abstract contract EIP3009Extended is EIP3009 {
    bytes32 public constant TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH =
        keccak256(
            "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce, bytes data)"
        );

    bytes32 public constant RECEIVE_WITH_AUTHORIZATION_EXTENDED_TYPEHASH =
        keccak256(
            "ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce, bytes data)"
        );

    /// @notice Thrown when a required command has failed
    error ExecutionFailed(address router, bytes message);

    /// @notice Thrown when an unauthorized router is called
    error UnauthorizedRouter(address router);

    // Authorized Routers to be called when data is included
    mapping(address => bool) public authorizedRouters;

    /**
     * @notice Execute a transfer with a signed authorization
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        _transferWithAuthorization(
            TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH,
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            "",
            v,
            r,
            s
        );
    }

    /**
     * @notice Execute a transfer with a signed authorization
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param data          Additional data to be included in the authorization
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory data,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        _transferWithAuthorization(
            TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH,
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            data,
            v,
            r,
            s
        );
    }

    /**
     * @notice Receive a transfer with a signed authorization from the payer
     * @dev This has an additional check to ensure that the payee's address matches
     * the caller of this function to prevent front-running attacks. (See security
     * considerations)
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        require(to == msg.sender, "EIP3009: caller must be the payee");

        _transferWithAuthorization(
            RECEIVE_WITH_AUTHORIZATION_EXTENDED_TYPEHASH,
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            "",
            v,
            r,
            s
        );
    }

    /**
     * @notice Receive a transfer with a signed authorization from the payer
     * @dev This has an additional check to ensure that the payee's address matches
     * the caller of this function to prevent front-running attacks. (See security
     * considerations)
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory data,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(to == msg.sender, "EIP3009: caller must be the payee");

        _transferWithAuthorization(
            RECEIVE_WITH_AUTHORIZATION_EXTENDED_TYPEHASH,
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            data,
            v,
            r,
            s
        );
    }

    function _transferWithAuthorization(
        bytes32 typeHash,
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory _data,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        require(block.timestamp > validAfter, "EIP3009: authorization is not yet valid");
        require(block.timestamp < validBefore, "EIP3009: authorization is expired");
        require(!_authorizationStates[from][nonce], _AUTHORIZATION_USED_ERROR);

        bytes memory data = abi.encode(typeHash, from, to, value, validAfter, validBefore, nonce, _data);
        require(EIP712.recover(DOMAIN_SEPARATOR, v, r, s, data) == from, _INVALID_SIGNATURE_ERROR);

        _authorizationStates[from][nonce] = true;
        emit AuthorizationUsed(from, nonce);

        _update(from, to, value);

        if (_data.length > 0) {
            _decodePackedData(from, to, value, nonce, _data);
        }
    }

    function _decodePackedData(
        address from,
        address to,
        uint256 value,
        bytes32 nonce,
        bytes memory data
    ) internal virtual {
        // Decode the data and call an authorized router
        (address routerAddress, bytes memory routerPayload) = abi.decode(data, (address, bytes));

        if (!authorizedRouters[routerAddress]) {
            revert UnauthorizedRouter(routerAddress);
        }

        // Call router with clean input
        (bool success, bytes memory ret) = routerAddress.call(
            abi.encodeWithSignature(
                "execute(address,address,uint256,bytes32,bytes)",
                from,
                to,
                value,
                nonce,
                routerPayload
            )
        );

        if (!success) {
            revert ExecutionFailed(routerAddress, ret);
        }
    }

    function setAuthorizedRouter(address router, bool authorized) external virtual;
}
