// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

import { ILayerZeroEndpointV2, Origin } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { Transfer } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/Transfer.sol";
import { ExecutionState, EndpointV2View } from "@layerzerolabs/lz-evm-protocol-v2/contracts/EndpointV2View.sol";

import { IExecutor } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/interfaces/IExecutor.sol";
import { IWorker } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/interfaces/IWorker.sol";
import { VerificationState } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/uln302/ReceiveUln302View.sol";
import { IReceiveUlnE2 } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/interfaces/IReceiveUlnE2.sol";

interface IReceiveUlnView {
    function verifiable(bytes calldata _packetHeader, bytes32 _payloadHash) external view returns (VerificationState);
}

/**
 * @title OmnixExecutor
 * @notice Omnix executor for private bridge - Zero fees, admin-only execution
 */
contract OmnixExecutor is IWorker, AccessControl, ReentrancyGuard, IExecutor, EndpointV2View {
    bytes32 internal constant MESSAGE_LIB_ROLE = keccak256("MESSAGE_LIB_ROLE");
    bytes32 internal constant ALLOWLIST = keccak256("ALLOWLIST");
    bytes32 internal constant DENYLIST = keccak256("DENYLIST");
    bytes32 internal constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(uint32 dstEid => DstConfig) public dstConfig;

    uint32 public localEidV2;
    address public receiveUln302;
    mapping(address receiveLib => address receiveLibView) public receiveLibToView;

    event ReceiveLibViewSet(address _receiveLib, address _receiveLibView);

    address public workerFeeLib;
    uint64 public allowlistSize;
    uint16 public defaultMultiplierBps;
    address public priceFeed;
    mapping(uint32 eid => uint8[] optionTypes) internal supportedOptionTypes;

    constructor(address _endpoint, address[] memory _messageLibs, address _receiveUln302, address _receiveUln302View) {
        endpoint = ILayerZeroEndpointV2(_endpoint);
        localEidV2 = endpoint.eid();

        defaultMultiplierBps = 12000;
        priceFeed = address(0);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        for (uint256 i = 0; i < _messageLibs.length; ++i) {
            _grantRole(MESSAGE_LIB_ROLE, _messageLibs[i]);
        }

        receiveUln302 = _receiveUln302;
        receiveLibToView[_receiveUln302] = _receiveUln302View;
        emit ReceiveLibViewSet(_receiveUln302, _receiveUln302View);
    }

    function withdrawFee(address _lib, address _to, uint256 _amount) external onlyRole(ADMIN_ROLE) {
        if (!hasRole(MESSAGE_LIB_ROLE, _lib)) revert Worker_OnlyMessageLib();
        emit Withdraw(_lib, _to, _amount);
    }

    function setPriceFeed(address _priceFeed) external onlyRole(ADMIN_ROLE) {
        priceFeed = _priceFeed;
        emit SetPriceFeed(_priceFeed);
    }

    function setDefaultMultiplierBps(uint16 _multiplierBps) external onlyRole(ADMIN_ROLE) {
        defaultMultiplierBps = _multiplierBps;
        emit SetDefaultMultiplierBps(_multiplierBps);
    }

    function setSupportedOptionTypes(uint32 _eid, uint8[] calldata _optionTypes) external onlyRole(ADMIN_ROLE) {
        supportedOptionTypes[_eid] = _optionTypes;
        emit SetSupportedOptionTypes(_eid, _optionTypes);
    }

    function getSupportedOptionTypes(uint32 _eid) external view returns (uint8[] memory) {
        return supportedOptionTypes[_eid];
    }

    modifier onlyAcl(address _sender) {
        if (!hasAcl(_sender)) {
            revert Worker_NotAllowed();
        }
        _;
    }

    function hasAcl(address _sender) public view returns (bool) {
        if (hasRole(DENYLIST, _sender)) {
            return false;
        } else if (allowlistSize == 0 || hasRole(ALLOWLIST, _sender)) {
            return true;
        } else {
            return false;
        }
    }

    function _grantRole(bytes32 _role, address _account) internal override returns (bool) {
        if (_role == ALLOWLIST && !hasRole(_role, _account)) {
            ++allowlistSize;
        }
        return super._grantRole(_role, _account);
    }

    function _revokeRole(bytes32 _role, address _account) internal override returns (bool) {
        if (_role == ALLOWLIST && hasRole(_role, _account)) {
            --allowlistSize;
        }
        return super._revokeRole(_role, _account);
    }

    function renounceRole(bytes32 /*role*/, address /*account*/) public pure override {
        revert Worker_RoleRenouncingDisabled();
    }

    function setDstConfig(DstConfigParam[] memory _params) external onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < _params.length; i++) {
            DstConfigParam memory param = _params[i];
            dstConfig[param.dstEid] = DstConfig(
                param.lzReceiveBaseGas,
                param.multiplierBps,
                param.floorMarginUSD,
                param.nativeCap,
                param.lzComposeBaseGas
            );
        }
        emit DstConfigSet(_params);
    }

    function nativeDrop(
        Origin calldata _origin,
        uint32 _dstEid,
        address _oapp,
        NativeDropParams[] calldata _nativeDropParams,
        uint256 _nativeDropGasLimit
    ) external payable onlyRole(ADMIN_ROLE) nonReentrant {
        _nativeDrop(_origin, _dstEid, _oapp, _nativeDropParams, _nativeDropGasLimit);
    }

    function execute302(ExecutionParams calldata _executionParams) external payable onlyRole(ADMIN_ROLE) nonReentrant {
        endpoint.lzReceive{ value: msg.value, gas: _executionParams.gasLimit }(
            _executionParams.origin,
            _executionParams.receiver,
            _executionParams.guid,
            _executionParams.message,
            _executionParams.extraData
        );
    }

    function compose302(
        address _from,
        address _to,
        bytes32 _guid,
        uint16 _index,
        bytes calldata _message,
        bytes calldata _extraData,
        uint256 _gasLimit
    ) external payable onlyRole(ADMIN_ROLE) nonReentrant {
        endpoint.lzCompose{ value: msg.value, gas: _gasLimit }(_from, _to, _guid, _index, _message, _extraData);
    }

    function nativeDropAndExecute302(
        NativeDropParams[] calldata _nativeDropParams,
        uint256 _nativeDropGasLimit,
        ExecutionParams calldata _executionParams
    ) external payable onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 spent = _nativeDrop(
            _executionParams.origin,
            localEidV2,
            _executionParams.receiver,
            _nativeDropParams,
            _nativeDropGasLimit
        );

        uint256 value = msg.value - spent;
        endpoint.lzReceive{ value: value, gas: _executionParams.gasLimit }(
            _executionParams.origin,
            _executionParams.receiver,
            _executionParams.guid,
            _executionParams.message,
            _executionParams.extraData
        );
    }

    struct LzReceiveParam {
        Origin origin;
        address receiver;
        bytes32 guid;
        bytes message;
        bytes extraData;
        uint256 gas;
        uint256 value;
    }

    struct NativeDropParam {
        address _receiver;
        uint256 _amount;
    }

    function commitAndExecute(
        address _receiveLib,
        LzReceiveParam calldata _lzReceiveParam,
        NativeDropParam[] calldata _nativeDropParams
    ) external payable onlyRole(ADMIN_ROLE) {
        ExecutionState executionState = executable(_lzReceiveParam.origin, _lzReceiveParam.receiver);
        if (executionState == ExecutionState.Executed) revert LzExecutor_Executed();

        if (executionState != ExecutionState.Executable) {
            address receiveLib = receiveUln302 == address(0x0) ? _receiveLib : address(receiveUln302);
            bytes memory packetHeader = abi.encodePacked(
                uint8(1),
                _lzReceiveParam.origin.nonce,
                _lzReceiveParam.origin.srcEid,
                _lzReceiveParam.origin.sender,
                localEidV2,
                bytes32(uint256(uint160(_lzReceiveParam.receiver)))
            );
            bytes32 payloadHash = keccak256(abi.encodePacked(_lzReceiveParam.guid, _lzReceiveParam.message));

            address receiveLibView = receiveLibToView[receiveLib];
            if (receiveLibView == address(0x0)) revert LzExecutor_ReceiveLibViewNotSet();

            VerificationState verificationState = IReceiveUlnView(receiveLibView).verifiable(packetHeader, payloadHash);
            if (verificationState == VerificationState.Verifiable) {
                IReceiveUlnE2(receiveLib).commitVerification(packetHeader, payloadHash);
            } else if (verificationState == VerificationState.Verifying) {
                revert LzExecutor_Verifying();
            }
        }

        for (uint256 i = 0; i < _nativeDropParams.length; i++) {
            NativeDropParam calldata param = _nativeDropParams[i];
            Transfer.native(param._receiver, param._amount);
        }

        endpoint.lzReceive{ gas: _lzReceiveParam.gas, value: _lzReceiveParam.value }(
            _lzReceiveParam.origin,
            _lzReceiveParam.receiver,
            _lzReceiveParam.guid,
            _lzReceiveParam.message,
            _lzReceiveParam.extraData
        );
    }

    error LzExecutor_Executed();
    error LzExecutor_Verifying();
    error LzExecutor_ReceiveLibViewNotSet();

    // Zero fees
    function assignJob(
        uint32 /*_dstEid*/,
        address _sender,
        uint256 /*_calldataSize*/,
        bytes calldata /*_options*/
    ) external virtual onlyRole(MESSAGE_LIB_ROLE) onlyAcl(_sender) returns (uint256 fee) {
        fee = 0;
    }

    function assignJob(
        address _sender,
        bytes calldata /*_options*/
    ) external virtual onlyRole(MESSAGE_LIB_ROLE) onlyAcl(_sender) returns (uint256 fee) {
        fee = 0;
    }

    function getFee(
        uint32 /*_dstEid*/,
        address _sender,
        uint256 /*_calldataSize*/,
        bytes calldata /*_options*/
    ) external view virtual onlyAcl(_sender) returns (uint256 fee) {
        fee = 0;
    }

    function getFee(
        address _sender,
        bytes calldata /*_options*/
    ) external view virtual onlyAcl(_sender) returns (uint256 fee) {
        fee = 0;
    }

    function _nativeDrop(
        Origin calldata _origin,
        uint32 _dstEid,
        address _oapp,
        NativeDropParams[] calldata _nativeDropParams,
        uint256 _nativeDropGasLimit
    ) internal returns (uint256 spent) {
        bool[] memory success = new bool[](_nativeDropParams.length);
        for (uint256 i = 0; i < _nativeDropParams.length; i++) {
            NativeDropParams memory param = _nativeDropParams[i];

            (bool sent, ) = param.receiver.call{ value: param.amount, gas: _nativeDropGasLimit }("");

            success[i] = sent;
            spent += param.amount;
        }
        emit NativeDropApplied(_origin, _dstEid, _oapp, _nativeDropParams, success);
    }
}

