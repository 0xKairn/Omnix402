// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import { OmnixDVN } from "../../contracts/OmnixDVN.sol";
import { IReceiveUlnE2 } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/interfaces/IReceiveUlnE2.sol";
import { ILayerZeroDVN } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/interfaces/ILayerZeroDVN.sol";

contract MockReceiveUln is IReceiveUlnE2 {
    bool public verifyCalled;
    bool public commitCalled;

    function verify(bytes calldata, bytes32, uint64) external override {
        verifyCalled = true;
    }

    function commitVerification(bytes calldata, bytes32) external override {
        commitCalled = true;
    }
}

contract OmnixDVNTest is Test {
    OmnixDVN public dvn;
    MockReceiveUln public mockReceiveUln;

    address public owner;
    uint32 public constant LOCAL_EID = 30184;
    uint32 public constant REMOTE_EID = 30109;

    bytes public constant SAMPLE_MESSAGE = hex"1234567890abcdef";
    uint64 public constant SAMPLE_NONCE = 12345;
    bytes32 public constant REMOTE_OAPP = 0x1234567890123456789012345678901234567890123456789012345678901234;
    address public constant LOCAL_OAPP = 0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD;

    event PayloadVerified(bytes32 indexed guid);
    event PayloadCommitted(bytes32 indexed guid);

    function setUp() public {
        owner = makeAddr("owner");
        mockReceiveUln = new MockReceiveUln();

        vm.prank(owner);
        dvn = new OmnixDVN(address(mockReceiveUln), LOCAL_EID);
    }

    function test_constructor() public view {
        assertEq(address(dvn.receiveUln()), address(mockReceiveUln));
        assertEq(dvn.localEid(), LOCAL_EID);
        assertEq(dvn.owner(), owner);
        assertEq(dvn.PACKET_VERSION(), 1);
        assertEq(dvn.DVN_FEE(), 0);
    }

    function test_getFee_returnsZero() public view {
        uint256 fee = dvn.getFee(REMOTE_EID, 1, address(0x123), hex"1234");
        assertEq(fee, 0);
    }

    function test_assignJob_returnsZero() public {
        ILayerZeroDVN.AssignJobParam memory param = ILayerZeroDVN.AssignJobParam({
            dstEid: REMOTE_EID,
            packetHeader: hex"1234",
            payloadHash: bytes32(uint256(0x5678)),
            confirmations: 1,
            sender: address(0x123)
        });

        uint256 fee = dvn.assignJob(param, hex"1234");
        assertEq(fee, 0);
    }

    function test_verify_success() public {
        bytes32 localOAppB32 = bytes32(uint256(uint160(LOCAL_OAPP)));
        bytes32 expectedGuid = keccak256(
            abi.encodePacked(SAMPLE_NONCE, REMOTE_EID, REMOTE_OAPP, LOCAL_EID, localOAppB32)
        );

        vm.expectEmit(true, false, false, false);
        emit PayloadVerified(expectedGuid);

        vm.prank(owner);
        dvn.verify(SAMPLE_MESSAGE, SAMPLE_NONCE, REMOTE_EID, REMOTE_OAPP, LOCAL_EID, LOCAL_OAPP);

        assertTrue(mockReceiveUln.verifyCalled());
    }

    function test_commit_success() public {
        bytes32 localOAppB32 = bytes32(uint256(uint160(LOCAL_OAPP)));
        bytes32 expectedGuid = keccak256(
            abi.encodePacked(SAMPLE_NONCE, REMOTE_EID, REMOTE_OAPP, LOCAL_EID, localOAppB32)
        );

        vm.expectEmit(true, false, false, false);
        emit PayloadCommitted(expectedGuid);

        vm.prank(owner);
        dvn.commit(SAMPLE_MESSAGE, SAMPLE_NONCE, REMOTE_EID, REMOTE_OAPP, LOCAL_EID, LOCAL_OAPP);

        assertTrue(mockReceiveUln.commitCalled());
    }

    function test_verify_revertsOnInvalidLocalEid() public {
        uint32 wrongEid = 999;

        vm.expectRevert(abi.encodeWithSelector(OmnixDVN.InvalidLocalEid.selector, LOCAL_EID, wrongEid));

        vm.prank(owner);
        dvn.verify(SAMPLE_MESSAGE, SAMPLE_NONCE, REMOTE_EID, REMOTE_OAPP, wrongEid, LOCAL_OAPP);
    }

    function test_verify_revertsWhenNotOwner() public {
        address nonOwner = makeAddr("nonOwner");

        vm.expectRevert();
        vm.prank(nonOwner);
        dvn.verify(SAMPLE_MESSAGE, SAMPLE_NONCE, REMOTE_EID, REMOTE_OAPP, LOCAL_EID, LOCAL_OAPP);
    }

    function test_commit_revertsWhenNotOwner() public {
        address nonOwner = makeAddr("nonOwner");

        vm.expectRevert();
        vm.prank(nonOwner);
        dvn.commit(SAMPLE_MESSAGE, SAMPLE_NONCE, REMOTE_EID, REMOTE_OAPP, LOCAL_EID, LOCAL_OAPP);
    }

    function test_commit_revertsOnInvalidLocalEid() public {
        uint32 wrongEid = 999;

        vm.expectRevert(abi.encodeWithSelector(OmnixDVN.InvalidLocalEid.selector, LOCAL_EID, wrongEid));

        vm.prank(owner);
        dvn.commit(SAMPLE_MESSAGE, SAMPLE_NONCE, REMOTE_EID, REMOTE_OAPP, wrongEid, LOCAL_OAPP);
    }
}

