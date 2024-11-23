let web3;
let contract;

// ABI and Contract Address
const ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_certType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_details",
				"type": "string"
			}
		],
		"name": "addCertificate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "getCertificate",
		"outputs": [
			{
				"internalType": "string",
				"name": "certType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "details",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getCertificateCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "verifyCertificate",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
const CONTRACT_ADDRESS = "0x0408dC88dE1425f3aadb356F56dE3DfBDDbBe24B"

// Initialize counts on page load
window.onload = async () => {
    /*
    const code = await web3.eth.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
        console.error("Contract not found at this address:", CONTRACT_ADDRESS);
        alert("Contract address is invalid or not deployed on the current network.");
    }*/

    if (window.ethereum) {
        try {
            // Request account access
            await window.ethereum.request({ method: "eth_requestAccounts" });

            // Initialize Web3
            web3 = new Web3(window.ethereum);

            // Initialize Contract
            contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

            console.log("Connected to Ethereum and contract initialized!");
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            alert("Failed to connect to MetaMask. Check console for details.");
        }
    } else {
        alert("MetaMask not detected. Please install MetaMask and try again.");
    }
};


/*
window.onload = async () => {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
        console.log("Connected to Ethereum!");
    } else {
        alert("Please install MetaMask!");
    }
};
*/

// Add Certificate to Blockchain
async function addCertificate(type) {
    const form = type === 'birth' ? document.getElementById('birthForm') : document.getElementById('deathForm');
    const certificateDetails = JSON.stringify(
        type === 'birth' ? {
            childName: form.childName.value,
            dob: form.dob.value,
            timeOfBirth: form.timeOfBirth.value,
            hospitalName: form.hospitalName.value,
            gender: form.gender.value,
            abnormalities: form.abnormalities.value || "None",
            parentName: form.parentName.value,
            placeOfBirth: form.placeOfBirth.value
        } : {
            deceasedName: form.deceasedName.value,
            dateOfDeath: form.dateOfDeath.value,
            timeOfDeath: form.timeOfDeath.value,
            placeOfDeath: form.placeOfDeath.value,
            causeOfDeath: form.causeOfDeath.value,
            reportedDeath: form.reportedDeath.value
        }
    );

    if (Object.values(JSON.parse(certificateDetails)).some(value => !value)) {
        alert("Please fill all the details.");
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        const certificateId = Date.now();

        // Add the certificate to the blockchain
        await contract.methods.addCertificate(certificateId, type, certificateDetails).send({ from: accounts[0] });
        alert("Certificate added to blockchain!");

        // Retrieve existing certificates from localStorage
        const certificates = JSON.parse(localStorage.getItem('certificates')) || [];

        // Add the new certificate to the localStorage array
        certificates.push({
            id: certificateId,
            type: type,
            details: JSON.parse(certificateDetails)
        });

        // Save the updated certificates array back to localStorage
        localStorage.setItem('certificates', JSON.stringify(certificates));

        // Update UI and counts
        updateCounts();
        filterCertificates('all');
    } catch (error) {
        console.error(error);
        alert("Error adding certificate!");
    }
}



// Verify Certificate
/*
async function verifyCertificate() {
    const id = document.getElementById('certificateId').value;
    try {
        const exists = await contract.methods.verifyCertificate(id).call();
        document.getElementById('verificationResult').textContent = exists
            ? "Certificate is valid!"
            : "Certificate not found.";
    } catch (error) {
        console.error(error);
        alert("Error verifying certificate!");
    }
}*/
function verifyCertificate() {
    const id = document.getElementById('certificateId').value;
    const certificates = JSON.parse(localStorage.getItem('certificates')) || [];
    const exists = certificates.some(cert => cert.id == id);
    document.getElementById('verificationResult').textContent = exists ? "Certificate is valid!" : "Certificate not found.";
}

// Find Certificate
async function findCertificate() {
    const id = parseInt(document.getElementById('findCertificateId').value, 10); // Get and parse the entered ID
    try {
        // Retrieve and parse the certificates from localStorage
        const certificates = JSON.parse(localStorage.getItem('certificates'));

        if (!certificates || !Array.isArray(certificates)) {
            throw new Error("Certificates data is missing or invalid.");
        }

        // Find the certificate with the matching ID
        const certificate = certificates.find(cert => cert.id === id);

        if (certificate) {
            // Display certificate details
            document.getElementById('certificateDetails').innerHTML = `
                <strong>ID:</strong> ${certificate.id}<br>
                <strong>Type:</strong> ${certificate.type}<br>
                <strong>Details:</strong> <pre>${JSON.stringify(certificate.details, null, 2)}</pre>
            `;
        } else {
            alert("Certificate not found!");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while retrieving the certificate!");
    }
}


// Update Counts from Blockchain
async function updateCounts() {
    try {
        const total = await contract.methods.getCertificateCount().call();
        document.getElementById('totalAll').textContent = total;
    } catch (error) {
        console.error(error);
    }
}

// Download Certificate as PDF
function downloadCertificate(type) {
    const form = type === 'birth' ? document.getElementById('birthForm') : document.getElementById('deathForm');
    const doc = new jsPDF();
    doc.text(20, 20, `${type.charAt(0).toUpperCase() + type.slice(1)} Certificate`);
    [...form.elements].forEach((el, i) => {
        if (el.value) doc.text(20, 40 + i * 10, `${el.placeholder}: ${el.value}`);
    });
    doc.save(`${type}_certificate.pdf`);
}

function filterCertificates(type) {
    const certificates = JSON.parse(localStorage.getItem('certificates')) || [];
    console.log("Certificates from LocalStorage:", certificates); // Debugging
    
    // Count totals for each category
    const totalAll = certificates.length;
    const totalBirth = certificates.filter(cert => cert.type === 'birth').length;
    const totalDeath = certificates.filter(cert => cert.type === 'death').length;

    // Update the counts in the UI
    document.getElementById('totalAll').textContent = totalAll;
    document.getElementById('totalBirth').textContent = totalBirth;
    document.getElementById('totalDeath').textContent = totalDeath;

    // Filter certificates based on the selected type
    const filteredCertificates = type === 'all'
        ? certificates
        : certificates.filter(cert => cert.type === type);

    console.log("Filtered Certificates:", filteredCertificates); // Debugging

    // Update the certificate list
    const listElement = document.getElementById('certificatesList');
    listElement.innerHTML = ''; // Clear existing content

    filteredCertificates.forEach(cert => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cert.id}</td>
            <td>${cert.type.charAt(0).toUpperCase() + cert.type.slice(1)}</td>
            <td>
                <div>
                    <strong>Details:</strong><br>
                    ${cert.type === 'birth' ? `
                        Child's Name: ${cert.details.childName}<br>
                        Date of Birth: ${cert.details.dob}<br>
                        Time of Birth: ${cert.details.timeOfBirth}<br>
                        Hospital: ${cert.details.hospitalName}<br>
                        Gender: ${cert.details.gender}<br>
                        Abnormalities: ${cert.details.abnormalities || 'None'}<br>
                        Parent's Name: ${cert.details.parentName}<br>
                        Place of Birth: ${cert.details.placeOfBirth}
                    ` : `
                        Deceased Name: ${cert.details.deceasedName}<br>
                        Date of Death: ${cert.details.dateOfDeath}<br>
                        Time of Death: ${cert.details.timeOfDeath}<br>
                        Place of Death: ${cert.details.placeOfDeath}<br>
                        Cause of Death: ${cert.details.causeOfDeath}<br>
                        Reported Death: ${cert.details.reportedDeath}
                    `}
                </div>
                <i class="fas fa-check-circle" style="color: green;"></i> Verified
            </td>
        `;
        console.log("Row HTML:", row.innerHTML); // Debugging
        listElement.appendChild(row);
    });
}

function renderCertificates() {
    const certificates = JSON.parse(localStorage.getItem('certificates')) || [];
    const certificateList = document.getElementById('certificateList');

    // Clear the existing list
    certificateList.innerHTML = '';

    if (certificates.length === 0) {
        certificateList.innerHTML = '<p>No certificates available.</p>';
        return;
    }

    // Generate the list of certificates
    certificates.forEach((cert, index) => {
        const certDiv = document.createElement('div');
        certDiv.classList.add('certificate');

        certDiv.innerHTML = `
            <h3>Certificate ${index + 1}</h3>
            <p><strong>Type:</strong> ${cert.type}</p>
            <p><strong>Details:</strong> ${JSON.stringify(cert.details, null, 2)}</p>
            <button onclick="downloadCertificate(${index})">Download PDF</button>
        `;

        certificateList.appendChild(certDiv);
    });
}

function downloadCertificate(index) {
    const certificates = JSON.parse(localStorage.getItem('certificates')) || [];
    const cert = certificates[index];

    if (!cert) {
        alert('Certificate not found!');
        return;
    }

    const { type, details } = cert;

    // Generate the PDF using jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add content to the PDF
    doc.text('Certificate Details', 10, 10);
    doc.text(`Type: ${type}`, 10, 20);
    doc.text(`Details:`, 10, 30);
    let yOffset = 40;
    for (const [key, value] of Object.entries(details)) {
        doc.text(`${key}: ${value}`, 10, yOffset);
        yOffset += 10;
    }

    // Save the PDF
    doc.save(`certificate-${index + 1}.pdf`);
}

// Call renderCertificates to populate the list on page load
renderCertificates();


/*const storageKey = 'certificates';

// Add a certificate (birth or death)
function addCertificate(type) {
    const form = type === 'birth' ? document.getElementById('birthForm') : document.getElementById('deathForm');

    const certificate = {
        id: Date.now(),
        type: type,
        details: {}
    };

    // Collect certificate details based on type
    if (type === 'birth') {
        certificate.details = {
            childName: document.getElementById('childName').value,
            dob: document.getElementById('dob').value,
            timeOfBirth: document.getElementById('timeOfBirth').value,
            hospitalName: document.getElementById('hospitalName').value,
            gender: document.getElementById('gender').value,
            abnormalities: document.getElementById('abnormalities').value,
            parentName: document.getElementById('parentName').value,
            placeOfBirth: document.getElementById('placeOfBirth').value,
        };
    } else {
        certificate.details = {
            deceasedName: document.getElementById('deceasedName').value,
            dateOfDeath: document.getElementById('dateOfDeath').value,
            timeOfDeath: document.getElementById('timeOfDeath').value,
            placeOfDeath: document.getElementById('placeOfDeath').value,
            causeOfDeath: document.getElementById('causeOfDeath').value,
            reportedDeath: document.getElementById('reportedDeath').value,
        };
    }

    // Check for empty fields and alert the user
    const hasEmptyFields = Object.values(certificate.details).some(value => value === '' || value === null);
    if (hasEmptyFields) {
        alert("Please fill all the details.");
        return; // Stop further execution
    }

    // Store the certificate in localStorage
    let certificates = JSON.parse(localStorage.getItem(storageKey)) || [];
    certificates.push(certificate);
    localStorage.setItem(storageKey, JSON.stringify(certificates));
    alert(`${type.charAt(0).toUpperCase() + type.slice(1)} certificate added!`);
    updateCertificateList();
}

// Verify the certificate based on ID
function verifyCertificate() {
    const id = document.getElementById('certificateId').value;
    const certificates = JSON.parse(localStorage.getItem(storageKey)) || [];
    const exists = certificates.some(cert => cert.id == id);
    document.getElementById('verificationResult').textContent = exists ? "Certificate is valid!" : "Certificate not found.";
}

// Update the displayed list of certificates
function updateCertificateList() {
    const certificates = JSON.parse(localStorage.getItem(storageKey)) || [];
    const listElement = document.getElementById('certificatesList');
    listElement.innerHTML = ''; // Clear current list

    certificates.forEach(cert => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cert.id}</td>
            <td>${cert.type.charAt(0).toUpperCase() + cert.type.slice(1)}</td>
            <td>
                <div>
                    <strong>Details:</strong><br>
                    ${cert.type === 'birth' ? `
                        Child's Name: ${cert.details.childName}<br>
                        Date of Birth: ${cert.details.dob}<br>
                        Time of Birth: ${cert.details.timeOfBirth}<br>
                        Hospital: ${cert.details.hospitalName}<br>
                        Gender: ${cert.details.gender}<br>
                        Abnormalities: ${cert.details.abnormalities || 'None'}<br>
                        Parent's Name: ${cert.details.parentName}<br>
                        Place of Birth: ${cert.details.placeOfBirth}
                    ` : `
                        Deceased Name: ${cert.details.deceasedName}<br>
                        Date of Death: ${cert.details.dateOfDeath}<br>
                        Time of Death: ${cert.details.timeOfDeath}<br>
                        Place of Death: ${cert.details.placeOfDeath}<br>
                        Cause of Death: ${cert.details.causeOfDeath}<br>
                        Reported Death: ${cert.details.reportedDeath}
                    `}
                </div>
                <i class="fas fa-check-circle" style="color: green;"></i> Verified
            </td>
        `;
        listElement.appendChild(row);
    });

    updateCounts(certificates); // Update counts for each category
}

// Update the counts for birth and death certificates
function updateCounts(certificates) {
    const totalBirth = certificates.filter(cert => cert.type === 'birth').length;
    const totalDeath = certificates.filter(cert => cert.type === 'death').length;

    document.getElementById('totalAll').textContent = certificates.length;
    document.getElementById('totalBirth').textContent = totalBirth;
    document.getElementById('totalDeath').textContent = totalDeath;
}

// Filter the displayed certificates based on type
function filterCertificates(type) {
    const certificates = JSON.parse(localStorage.getItem(storageKey)) || [];
    const filteredCertificates = type === 'all' ? certificates : certificates.filter(cert => cert.type === type);
    const listElement = document.getElementById('certificatesList');
    listElement.innerHTML = '';

    filteredCertificates.forEach(cert => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cert.id}</td>
            <td>${cert.type.charAt(0).toUpperCase() + cert.type.slice(1)}</td>
            <td>
                <div>
                    <strong>Details:</strong><br>
                    ${cert.type === 'birth' ? `
                        Child's Name: ${cert.details.childName}<br>
                        Date of Birth: ${cert.details.dob}<br>
                        Time of Birth: ${cert.details.timeOfBirth}<br>
                        Hospital: ${cert.details.hospitalName}<br>
                        Gender: ${cert.details.gender}<br>
                        Abnormalities: ${cert.details.abnormalities || 'None'}<br>
                        Parent's Name: ${cert.details.parentName}<br>
                        Place of Birth: ${cert.details.placeOfBirth}
                    ` : `
                        Deceased Name: ${cert.details.deceasedName}<br>
                        Date of Death: ${cert.details.dateOfDeath}<br>
                        Time of Death: ${cert.details.timeOfDeath}<br>
                        Place of Death: ${cert.details.placeOfDeath}<br>
                        Cause of Death: ${cert.details.causeOfDeath}<br>
                        Reported Death: ${cert.details.reportedDeath}
                    `}
                </div>
                <i class="fas fa-check-circle" style="color: green;"></i> Verified
            </td>
        `;
        listElement.appendChild(row);
    });

    updateCounts(certificates); // Update counts after filtering
}

// Initial call to populate the table and counts if there are existing certificates
updateCertificateList();

// Find and display certificate details by ID
function findCertificate() {
    const id = document.getElementById('findCertificateId').value;
    const certificates = JSON.parse(localStorage.getItem(storageKey)) || [];
    const certificate = certificates.find(cert => cert.id == id);
    const detailsDiv = document.getElementById('certificateDetails');
    detailsDiv.innerHTML = '';

    if (certificate) {
        detailsDiv.innerHTML = `
            <h3>Certificate Found</h3>
            <div>
                <strong>Type:</strong> ${certificate.type.charAt(0).toUpperCase() + certificate.type.slice(1)}<br>
                <strong>Details:</strong><br>
                ${certificate.type === 'birth' ? `
                    Child's Name: ${certificate.details.childName}<br>
                    Date of Birth: ${certificate.details.dob}<br>
                    Time of Birth: ${certificate.details.timeOfBirth}<br>
                    Hospital: ${certificate.details.hospitalName}<br>
                    Gender: ${certificate.details.gender}<br>
                    Abnormalities: ${certificate.details.abnormalities || 'None'}<br>
                    Parent's Name: ${certificate.details.parentName}<br>
                    Place of Birth: ${certificate.details.placeOfBirth}
                ` : `
                    Deceased Name: ${certificate.details.deceasedName}<br>
                    Date of Death: ${certificate.details.dateOfDeath}<br>
                    Time of Death: ${certificate.details.timeOfDeath}<br>
                    Place of Death: ${certificate.details.placeOfDeath}<br>
                    Cause of Death: ${certificate.details.causeOfDeath}<br>
                    Reported Death: ${certificate.details.reportedDeath}
                `}
            </div>
            <button onclick="editCertificate(${certificate.id})">Edit Record</button>
            <button onclick="downloadCertificate('${certificate.type}', ${certificate.id})">Download as PDF</button>
        `;
    } else {
        detailsDiv.innerHTML = "<p>No certificate found with this ID.</p>";
    }
}

// Placeholder for editing certificate functionality
function editCertificate(id) {
    const certificates = JSON.parse(localStorage.getItem(storageKey)) || [];
    const certificate = certificates.find(cert => cert.id == id);
    if (certificate) {
        // Simulate an edit form with current values (you can expand this)
        alert('Edit functionality is a placeholder. Implement accordingly.');
    }
}

// Download certificate as PDF (currently not functional)
function downloadCertificate(type, id) {
    alert("Not connected to the blockchain network. Can't generate a PDF file.");
}
*/