// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import { USDO } from "../../contracts/USDO.sol";
import { OmnixRouter } from "../../contracts/OmnixRouter.sol";

contract USDOTest is Test {
    address USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address lzEndpointBase = 0x1a44076050125825900e736c501f859c50fE728c;
    address owner;

    USDO usdo;
    OmnixRouter omnixRouter;

    uint32 eidArbitrum = 30110;
    uint32 eidBase = 30184;

    uint256 baseChainId = 8453;
    uint256 arbitrumChainId = 42161;

    uint256 tokensToSend = 1 * 10 ** 6; // 10 tokens with 6 decimals

    function setUp() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        owner = vm.addr(privateKey);
        vm.startPrank(owner);

        omnixRouter = new OmnixRouter(owner);
        omnixRouter.setChainIdEidOFT(arbitrumChainId, eidArbitrum, address(omnixRouter));
        usdo = new USDO("USDO", "USDO", lzEndpointBase, owner, USDC);

        usdo.setAuthorizedRouter(address(omnixRouter), true);
        usdo.setPeer(eidArbitrum, 0x0000000000000000000000002936944c6ab1f6f9dafdbd8ab050b4b3cd6eb223);
    }

    function test_transferWithAuthorization() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        bytes32 nonce = keccak256(abi.encodePacked(block.timestamp));

        bytes memory routerData = abi.encode(arbitrumChainId, owner);
        bytes memory data = abi.encode(address(omnixRouter), routerData);

        (uint8 v, bytes32 r, bytes32 s) = _buildTransferWithAuthorization(
            usdo,
            owner,
            privateKey,
            address(omnixRouter),
            tokensToSend,
            nonce,
            data
        );

        usdo.transferWithAuthorization(
            owner,
            address(omnixRouter),
            tokensToSend,
            block.timestamp - 100,
            block.timestamp + 1000,
            nonce,
            data,
            v,
            r,
            s
        );
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
        bytes32 USDCDomainSeparator = keccak256(
            abi.encode(
                0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f,
                keccak256(bytes(token.name())),
                keccak256(bytes("1")),
                block.chainid,
                address(token)
            )
        );

        return MessageHashUtils.toTypedDataHash(USDCDomainSeparator, structHash);
    }
}
