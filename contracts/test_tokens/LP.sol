//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "openzeppelin-contracts/token/ERC20/ERC20.sol";

contract DETHWETHLP is ERC20 {
    constructor() ERC20("dETH-WETH LP", "dETH-WETH LP") {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}