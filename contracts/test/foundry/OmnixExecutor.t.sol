// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import { OmnixExecutor } from "../../contracts/OmnixExecutor.sol";
import { IReceiveUlnE2 } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/interfaces/IReceiveUlnE2.sol";
import { ILayerZeroEndpointV2, Origin } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";

contract MockEndpoint {
    uint32 public eid;

    constructor(uint32 _eid) {
        eid = _eid;
    }

    function lzReceive(
        Origin calldata,
        address,
        bytes32,
        bytes calldata,
        bytes calldata
    ) external payable {}

    function lzCompose(
        address,
        address,
        bytes32,
        uint16,
        bytes calldata,
        bytes calldata
    ) external payable {}
}

contract MockReceiveUln is IReceiveUlnE2 {
    function verify(bytes calldata, bytes32, uint64) external override {}
    function commitVerification(bytes calldata, bytes32) external override {}
}

contract MockReceiveUlnView {
    enum VerificationState {
        Verifiable,
        Verifying,
        Verified,
        Unverified
    }
    VerificationState public state = VerificationState.Verifiable;

    function verifiable(bytes calldata, bytes32) external view returns (VerificationState) {
        return state;
    }

    function setState(VerificationState _state) external {
        state = _state;
    }
}

contract OmnixExecutorTest is Test {
    OmnixExecutor public executor;
    MockEndpoint public mockEndpoint;
    MockReceiveUln public mockReceiveUln;
    MockReceiveUlnView public mockReceiveUlnView;

    address public admin;
    address public user;
    uint32 public constant LOCAL_EID = 30184;
    uint32 public constant REMOTE_EID = 30109;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MESSAGE_LIB_ROLE = keccak256("MESSAGE_LIB_ROLE");

    function setUp() public {
        admin = makeAddr("admin");
        user = makeAddr("user");

        mockEndpoint = new MockEndpoint(LOCAL_EID);
        mockReceiveUln = new MockReceiveUln();
        mockReceiveUlnView = new MockReceiveUlnView();

        address[] memory messageLibs = new address[](1);
        messageLibs[0] = address(0x123);

        vm.prank(admin);
        executor = new OmnixExecutor(
            address(mockEndpoint),
            messageLibs,
            address(mockReceiveUln),
            address(mockReceiveUlnView)
        );
    }

    function test_constructor() public view {
        assertEq(address(executor.endpoint()), address(mockEndpoint));
        assertEq(executor.localEidV2(), LOCAL_EID);
        assertTrue(executor.hasRole(executor.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(executor.hasRole(ADMIN_ROLE, admin));
        assertTrue(executor.hasRole(MESSAGE_LIB_ROLE, address(0x123)));
        assertEq(executor.receiveUln302(), address(mockReceiveUln));
    }

    function test_assignJob_returnsZero() public {
        vm.prank(address(0x123));
        uint256 fee = executor.assignJob(REMOTE_EID, user, 1000, hex"1234");
        assertEq(fee, 0);
    }

    function test_getFee_returnsZero() public view {
        uint256 fee = executor.getFee(REMOTE_EID, user, 1000, hex"1234");
        assertEq(fee, 0);
    }

    function test_assignJob_revertsWhenNotMessageLib() public {
        vm.expectRevert();
        vm.prank(user);
        executor.assignJob(REMOTE_EID, user, 1000, hex"1234");
    }

    function test_hasAcl_allowsAnyoneWhenNoAllowlist() public view {
        assertTrue(executor.hasAcl(user));
        assertTrue(executor.hasAcl(admin));
    }

    function test_setPriceFeed_success() public {
        address newPriceFeed = address(0x456);

        vm.prank(admin);
        executor.setPriceFeed(newPriceFeed);

        assertEq(executor.priceFeed(), newPriceFeed);
    }

    function test_setPriceFeed_revertsWhenNotAdmin() public {
        vm.expectRevert();
        vm.prank(user);
        executor.setPriceFeed(address(0x456));
    }

    function test_setDefaultMultiplierBps_success() public {
        uint16 newMultiplier = 15000;

        vm.prank(admin);
        executor.setDefaultMultiplierBps(newMultiplier);

        assertEq(executor.defaultMultiplierBps(), newMultiplier);
    }

    function test_setDefaultMultiplierBps_revertsWhenNotAdmin() public {
        vm.expectRevert();
        vm.prank(user);
        executor.setDefaultMultiplierBps(15000);
    }

    function test_setSupportedOptionTypes_success() public {
        uint8[] memory optionTypes = new uint8[](2);
        optionTypes[0] = 1;
        optionTypes[1] = 2;

        vm.prank(admin);
        executor.setSupportedOptionTypes(REMOTE_EID, optionTypes);

        uint8[] memory result = executor.getSupportedOptionTypes(REMOTE_EID);
        assertEq(result.length, 2);
        assertEq(result[0], 1);
        assertEq(result[1], 2);
    }

    function test_commitAndExecute_revertsWhenNotAdmin() public {
        Origin memory origin = Origin({ srcEid: REMOTE_EID, sender: bytes32(uint256(0x123)), nonce: 1 });

        OmnixExecutor.LzReceiveParam memory lzParam = OmnixExecutor.LzReceiveParam({
            origin: origin,
            receiver: address(0x456),
            guid: bytes32(uint256(0x789)),
            message: hex"1234",
            extraData: hex"",
            gas: 200000,
            value: 0
        });

        OmnixExecutor.NativeDropParam[] memory nativeDropParams = new OmnixExecutor.NativeDropParam[](0);

        vm.expectRevert();
        vm.prank(user);
        executor.commitAndExecute(address(mockReceiveUln), lzParam, nativeDropParams);
    }

    function test_withdrawFee_revertsWhenNotAdmin() public {
        vm.expectRevert();
        vm.prank(user);
        executor.withdrawFee(address(0x123), user, 1 ether);
    }

    function test_renounceRole_alwaysReverts() public {
        vm.expectRevert();
        vm.prank(admin);
        executor.renounceRole(ADMIN_ROLE, admin);
    }
}

