// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSig {
    struct Proposal {
        address proposer;
        bytes32 certificateHash;
        uint256 approvalCount;
        mapping(address => bool) approvals;
        bool executed;
    }
    
    address[] public signers;
    uint256 public requiredApprovals;
    mapping(bytes32 => Proposal) public proposals;
    
    event ProposalCreated(bytes32 indexed proposalId, address proposer);
    event ProposalApproved(bytes32 indexed proposalId, address approver);
    event ProposalExecuted(bytes32 indexed proposalId);
    
    constructor(address[] memory _signers, uint256 _required) {
        require(_signers.length >= _required, "Invalid setup");
        signers = _signers;
        requiredApprovals = _required;
    }
    
    modifier onlySigner() {
        bool isSigner = false;
        for(uint i = 0; i < signers.length; i++) {
            if(signers[i] == msg.sender) {
                isSigner = true;
                break;
            }
        }
        require(isSigner, "Not a signer");
        _;
    }
    
    function propose(bytes32 certHash) external onlySigner returns (bytes32) {
        bytes32 proposalId = keccak256(abi.encodePacked(certHash, block.timestamp));
        Proposal storage p = proposals[proposalId];
        p.proposer = msg.sender;
        p.certificateHash = certHash;
        p.approvals[msg.sender] = true;
        p.approvalCount = 1;
        
        emit ProposalCreated(proposalId, msg.sender);
        return proposalId;
    }
    
    function approve(bytes32 proposalId) external onlySigner {
        Proposal storage p = proposals[proposalId];
        require(!p.executed, "Already executed");
        require(!p.approvals[msg.sender], "Already approved");
        
        p.approvals[msg.sender] = true;
        p.approvalCount++;
        
        emit ProposalApproved(proposalId, msg.sender);
    }
    
    function isApproved(bytes32 proposalId) public view returns (bool) {
        return proposals[proposalId].approvalCount >= requiredApprovals;
    }
}