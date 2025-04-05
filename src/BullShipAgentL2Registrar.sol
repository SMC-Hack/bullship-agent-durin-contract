// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {StringUtils} from "@ensdomains/ens-contracts/utils/StringUtils.sol";

import {IL2Registry} from "./interfaces/IL2Registry.sol";

contract BullShipAgentL2Registrar {
    using StringUtils for string;

    event NameRegistered(string indexed label, address indexed owner);

    IL2Registry public immutable registry;
    address public immutable admin;

    uint256 public chainId;

    uint256 public immutable coinType;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    constructor(address _registry) {
        assembly {
            sstore(chainId.slot, chainid())
        }

        coinType = (0x80000000 | chainId) >> 0;
        registry = IL2Registry(_registry);
        admin = msg.sender;
    }

    function register(string calldata label, address owner) external onlyAdmin {
        bytes32 node = _labelToNode(label);
        bytes memory addr = abi.encodePacked(owner);

        registry.setAddr(node, coinType, addr);

        registry.setAddr(node, 60, addr);

        registry.createSubnode(
            registry.baseNode(),
            label,
            owner,
            new bytes[](0)
        );
        emit NameRegistered(label, owner);
    }

    function available(string calldata label) external view returns (bool) {
        bytes32 node = _labelToNode(label);
        uint256 tokenId = uint256(node);

        try registry.ownerOf(tokenId) {
            return false;
        } catch {
            if (label.strlen() >= 3) {
                return true;
            }
            return false;
        }
    }

    function _labelToNode(
        string calldata label
    ) private view returns (bytes32) {
        return registry.makeNode(registry.baseNode(), label);
    }
}
