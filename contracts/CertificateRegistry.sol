// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract CertificateRegistry is AccessControl {
    struct Certificate {
        string ipfsCID;
        bytes32 certHash;
        address student;
        address institution;
        uint256 issueDate;
        uint256 expiryDate;
        bool revoked;
        bytes32 merkleRoot;
    }
    
    mapping(bytes32 => Certificate) public certificates;
    mapping(address => bytes32[]) public studentCertificates;
    
    bytes32[] public revocationRegistry;
    
    event CertificateIssued(bytes32 indexed certId, address student, address institution);
    event CertificateRevoked(bytes32 indexed certId, uint256 timestamp);
    event BatchIssued(bytes32 indexed merkleRoot, uint256 count);
    
    function issueCertificate(
        string memory ipfsCID,
        bytes32 certHash,
        address student,
        uint256 expiryDate
    ) external onlyRole(Role.INSTITUTION) returns (bytes32) {
        bytes32 certId = keccak256(abi.encodePacked(certHash, student, block.timestamp));
        
        certificates[certId] = Certificate({
            ipfsCID: ipfsCID,
            certHash: certHash,
            student: student,
            institution: msg.sender,
            issueDate: block.timestamp,
            expiryDate: expiryDate,
            revoked: false,
            merkleRoot: bytes32(0)
        });
        
        studentCertificates[student].push(certId);
        
        emit CertificateIssued(certId, student, msg.sender);
        return certId;
    }
    
    function issueBatch(
        bytes32 merkleRoot,
        uint256 count
    ) external onlyRole(Role.INSTITUTION) {
        emit BatchIssued(merkleRoot, count);
    }
    
    function verifyCertificate(
        bytes32 certId,
        bytes32[] memory proof,
        bytes32 merkleRoot
    ) public view returns (bool) {
        Certificate memory cert = certificates[certId];
        
        if(cert.revoked) return false;
        if(cert.expiryDate > 0 && block.timestamp > cert.expiryDate) return false;
        
        if(merkleRoot != bytes32(0)) {
            return MerkleProof.verify(proof, merkleRoot, certId);
        }
        
        return cert.certHash != bytes32(0);
    }
    
    function revokeCertificate(bytes32 certId) external onlyRole(Role.INSTITUTION) {
        Certificate storage cert = certificates[certId];
        require(cert.institution == msg.sender, "Not your certificate");
        require(!cert.revoked, "Already revoked");
        
        cert.revoked = true;
        revocationRegistry.push(certId);
        
        emit CertificateRevoked(certId, block.timestamp);
    }
    
    function getCertificate(bytes32 certId) external view returns (Certificate memory) {
        return certificates[certId];
    }
    
    function getStudentCertificates(address student) external view returns (bytes32[] memory) {
        return studentCertificates[student];
    }
    
    function isRevoked(bytes32 certId) public view returns (bool) {
        return certificates[certId].revoked;
    }
}