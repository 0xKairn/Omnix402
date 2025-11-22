// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import { USDO } from "../contracts/USDO.sol";
import { SendParam } from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";
import { OptionsBuilder } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";
import { MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract TransferAndSend is Script {
    using OptionsBuilder for bytes;

    address omnixRouterAddressBase = 0xC1333a31EE5f3F302CB0428921f2908e6CAddEb1; // Base Mainnet OmniRouter address
    address omnixRouterAddressPolygon = 0xC1333a31EE5f3F302CB0428921f2908e6CAddEb1; // Polygon One OmniRouter address

    address usdoAddressBase = 0x5FAC7F2c99d9e06deff2f579FDE67a2eCDf0E0aC; // Base Mainnet Myusdo address
    address usdoAddressPolygon = 0x5FAC7F2c99d9e06deff2f579FDE67a2eCDf0E0aC; // Polygon One Myusdo address

    uint32 eidPolygon = 30109;
    uint32 eidBase = 30184;

    uint256 baseChainId = 8453;
    uint256 polygonChainId = 137;

    uint256 tokensToSend = 1 * 10 ** 6; // 10 tokens with 6 decimals

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    function getUSDOAddress() internal view returns (address) {
        if (block.chainid == 8453) return usdoAddressBase; // Base
        if (block.chainid == 42161) return usdoAddressPolygon; // Polygon
        revert("Chain not supported");
    }

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(privateKey);

        vm.startBroadcast(privateKey);

        USDO usdo = USDO(getUSDOAddress());
        usdoAddressBase = address(usdo);

        bytes32 nonce = keccak256(abi.encodePacked(block.timestamp, user, tokensToSend));

        bytes memory routerData = abi.encode(polygonChainId, user);
        bytes memory data = abi.encode(address(omnixRouterAddressBase), routerData);

        (uint8 v, bytes32 r, bytes32 s) = _buildTransferWithAuthorization(
            usdo,
            user,
            privateKey,
            address(omnixRouterAddressBase),
            tokensToSend,
            nonce,
            data
        );

        usdo.transferWithAuthorizationData(
            user,
            address(omnixRouterAddressBase),
            tokensToSend,
            block.timestamp - 100,
            block.timestamp + 1000,
            nonce,
            data,
            v,
            r,
            s
        );

        vm.stopBroadcast();
    }

    function _buildTransferWithAuthorization(
        USDO token,
        address from,
        uint256 fromPK,
        address to,
        uint256 value,
        bytes32 nonce,
        bytes memory data
    ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        uint256 validAfter = block.timestamp - 100;
        uint256 validBefore = block.timestamp + 1000;

        bytes32 structHash = keccak256(
            abi.encode(
                token.TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH(),
                from,
                to,
                value,
                validAfter,
                validBefore,
                nonce,
                data
            )
        );

        bytes32 digest = getTokenHashTypedData(structHash, token);
        (v, r, s) = vm.sign(fromPK, digest);
    }

    function getTokenHashTypedData(bytes32 structHash, USDO token) public view virtual returns (bytes32) {
        // SAME
        bytes32 USDCDomainSeparator = keccak256(
            abi.encode(
                0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f,
                keccak256(bytes(token.name())),
                keccak256(bytes("1")),
                block.chainid,
                address(token)
            )
        );

        // bytes32 USDCDomainSeparator = 0x02fa7265e7c5d81118673727957699e4d68f74cd74b7db77da710fe8a2c7834f;

        return MessageHashUtils.toTypedDataHash(USDCDomainSeparator, structHash);
    }
}
