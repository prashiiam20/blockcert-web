const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  let registry, owner, institution, student, recruiter;

  beforeEach(async function () {
    [owner, institution, student, recruiter] = await ethers.getSigners();
    
    const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    registry = await CertificateRegistry.deploy();
    await registry.waitForDeployment();
    
    // Role enum: NONE=0, GOVERNMENT=1, REGULATORY=2, INSTITUTION=3, STUDENT=4, RECRUITER=5
    await registry.grantRole(institution.address, 3); // INSTITUTION
    await registry.grantRole(student.address, 4);     // STUDENT
    await registry.grantRole(recruiter.address, 5);   // RECRUITER
  });

  it("Should issue certificate", async function () {
    const tx = await registry.connect(institution).issueCertificate(
      "QmTest123",
      ethers.keccak256(ethers.toUtf8Bytes("test")),
      student.address,
      Math.floor(Date.now() / 1000) + 31536000
    );
    
    await expect(tx).to.emit(registry, "CertificateIssued");
  });

  it("Should revoke certificate", async function () {
    const tx = await registry.connect(institution).issueCertificate(
      "QmTest123",
      ethers.keccak256(ethers.toUtf8Bytes("test")),
      student.address,
      0
    );
    
    const receipt = await tx.wait();
    const certId = receipt.logs[0].topics[1];
    
    await registry.connect(institution).revokeCertificate(certId);
    expect(await registry.isRevoked(certId)).to.be.true;
  });

  it("Should batch issue", async function () {
    const tx = await registry.connect(institution).issueBatch(
      ethers.keccak256(ethers.toUtf8Bytes("merkleroot")),
      100
    );
    
    await expect(tx).to.emit(registry, "BatchIssued");
  });
});