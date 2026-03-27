// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AccessControl {
    enum Role { NONE, GOVERNMENT, REGULATORY, INSTITUTION, STUDENT, RECRUITER }
    
    mapping(address => Role) public roles;
    address public admin;
    
    event RoleGranted(address indexed account, Role role);
    event RoleRevoked(address indexed account);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "Unauthorized");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.GOVERNMENT;
    }
    
    function grantRole(address account, Role role) external onlyAdmin {
        roles[account] = role;
        emit RoleGranted(account, role);
    }
    
    function revokeRole(address account) external onlyAdmin {
        roles[account] = Role.NONE;
        emit RoleRevoked(account);
    }
    
    function hasRole(address account, Role role) public view returns (bool) {
        return roles[account] == role;
    }
}