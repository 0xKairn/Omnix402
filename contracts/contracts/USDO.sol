// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { OApp, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { OFTMsgCodec } from "@layerzerolabs/oft-evm/contracts/libs/OFTMsgCodec.sol";
import { EIP3009Extended } from "./EIP3009Extended.sol";
import { EIP712 } from "./lib/EIP712.sol";
import { IERC20Internal } from "./lib/IERC20Internal.sol";

contract USDO is OFT, EIP3009Extended {
    using SafeERC20 for ERC20;
    using OFTMsgCodec for bytes;
    using OFTMsgCodec for bytes32;

    ERC20 public USDC;
    uint256 public _decimals = 6;

    error InsufficientBalance();
    error InsufficientAllowance();
    error InvalidReceiver();

    event Deposit(address indexed account, uint256 amount);
    event Withdraw(address indexed account, uint256 amount);
    event x402Bridge(address indexed from, address indexed to, bytes32 indexed nonce, uint256 amount);

    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate,
        address _USDC
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {
        DOMAIN_SEPARATOR = EIP712.makeDomainSeparator(_name, "1");

        USDC = ERC20(_USDC);

        // Only for test, in prod mint should be restricted to deposit/withdraw 
        _mint(msg.sender, 100000 * (10 ** _decimals));
    }

    // =====================================================
    // -------------- OFTCore Implementations --------------
    // =====================================================

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor, // @dev unused in the default implementation.
        bytes calldata _extraData // @dev unused in the default implementation.
    ) internal virtual override {
        bytes memory composeMsg = OFTMsgCodec.composeMsg(_message);
        (, bytes32 nonce, address receiver, address sender) = abi.decode(
            composeMsg,
            (address, bytes32, address, address)
        );

        require(!_authorizationStates[sender][nonce], _AUTHORIZATION_USED_ERROR);

        _authorizationStates[sender][nonce] = true;
        emit AuthorizationUsed(sender, nonce);

        address toAddress = OFTMsgCodec.sendTo(_message).bytes32ToAddress();
        uint256 amountLD = _toLD(OFTMsgCodec.amountSD(_message));

        if (toAddress != address(this)) {
            revert InvalidReceiver();
        }

        if (USDC.balanceOf(address(this)) < amountLD) {
            revert InsufficientBalance();
        }

        USDC.safeTransfer(receiver, amountLD);

        emit x402Bridge(sender, receiver, nonce, amountLD);
    }

    // =====================================================
    // -------------- USDC SWAP Implementations ------------
    // =====================================================

    function deposit(uint256 amount) external {
        SafeERC20.safeTransferFrom(USDC, msg.sender, address(this), amount);
        _mint(msg.sender, amount);

        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        SafeERC20.safeTransfer(USDC, msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }

    // for test purposes only, should be remove in prod
    function retrieveERC20(address tokenAddress, uint256 amount) external onlyOwner {
        ERC20(tokenAddress).safeTransfer(owner(), amount);
    }

    // =====================================================
    // ----------- EIP3009Extended Implementations ----------
    // =====================================================

    function setAuthorizedRouter(address router, bool authorized) external override onlyOwner {
        authorizedRouters[router] = authorized;
    }

    // =====================================================
    // ----------- IERC20Internal Implementations ----------
    // =====================================================

    // same as USDC
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function _update(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual override(ERC20, IERC20Internal) {
        super._update(sender, recipient, amount);
    }

    function _increaseAllowance(
        address owner,
        address spender,
        uint256 increment
    ) internal virtual override(IERC20Internal) {
        uint256 currentAllowance = allowance(owner, spender);
        _approve(owner, spender, currentAllowance + increment);
    }

    function _decreaseAllowance(
        address owner,
        address spender,
        uint256 decrement
    ) internal virtual override(IERC20Internal) {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < decrement) revert InsufficientAllowance();
        _approve(owner, spender, currentAllowance - decrement);
    }
}
