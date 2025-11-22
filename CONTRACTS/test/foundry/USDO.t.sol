import "forge-std/Test.sol";
import "forge-std/console.sol";

import { USDO } from "../../contracts/USDO.sol";

contract USDO is Test {
    address USDC = 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913;

    address lzEndpointBase = 0x1a44076050125825900e736c501f859c50fE728c;

    USDO usdo;
    OmniRouter omniRouter;

    function setUp() public {
        owner = makeAddr("owner");
        vm.startPrank(owner);

        omniRouter = new OmniRouter();
        usdo = new USDO("USDO", "USDO", lzEndpointBase, owner, USDC);

        usdo.setAuthorizedRouter(address(omniRouter), true);
    }

    function test_transferWithAuthorization() public {
        bytes32 nonce = keccak256(abi.encodePacked(block.timestamp, user, tokensToSend));

        bytes memory data = abi.encode(address(omniRouter)chainIdToSend, user);

        (uint8 v, bytes32 r, bytes32 s) = _buildTransferWithAuthorization(
            usdo,
            user,
            privateKey,
            address(usdo),
            tokensToSend,
            nonce,
            data
        );

        usdo.transferWithAuthorization(
            user,
            address(usdo),
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
        MyOFT token,
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
}
