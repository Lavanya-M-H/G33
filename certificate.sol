// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateManagement {
    struct Certificate {
        uint256 id;
        string certType; // "birth" or "death"
        string details; // JSON string containing certificate details
    }

    Certificate[] private certificates;

    mapping(uint256 => bool) private certificateExists;

    // Add a new certificate
    function addCertificate(uint256 _id, string memory _certType, string memory _details) public {
        require(!certificateExists[_id], "Certificate ID already exists");

        Certificate memory newCertificate = Certificate({
            id: _id,
            certType: _certType,
            details: _details
        });

        certificates.push(newCertificate);
        certificateExists[_id] = true;
    }

    // Read certificate by ID
    function getCertificate(uint256 _id) public view returns (string memory certType, string memory details) {
        for (uint256 i = 0; i < certificates.length; i++) {
            if (certificates[i].id == _id) {
                return (certificates[i].certType, certificates[i].details);
            }
        }
        revert("Certificate not found");
    }

    // Get total count of certificates
    function getCertificateCount() public view returns (uint256) {
        return certificates.length;
    }

    // Verify if a certificate exists
    function verifyCertificate(uint256 _id) public view returns (bool) {
        return certificateExists[_id];
    }
}
