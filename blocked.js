/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const browser = chrome;

var gBlockedURL;
var gBlockedSet;
var gHashCode;
var gRecordId;

// Get element by ID
//
function getElement(id) { return document.getElementById(id); }

// Create 32-bit integer hash code from string
//
function hashCode32(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
	}
	return hash;
}

// Processes info for blocking page
//
function processBlockInfo(info) {
	if (!info) return;

	gBlockedURL = info.blockedURL;
	gBlockedSet = info.blockedSet;
	gHashCode = info.password ? hashCode32(info.password) : 0;

	// Set theme
	let themeLink = document.getElementById("themeLink");
	if (themeLink) {
		themeLink.href = "/themes/" + (info.theme ? `${info.theme}.css` : "default.css");
	}

	// Set custom style
	let customStyle = document.getElementById("customStyle");
	if (customStyle) {
		customStyle.innerText = info.customStyle;
	}

	let blockedURL = document.getElementById("lbBlockedURL");
	if (info.blockedURL && blockedURL) {
		if (info.blockedURL.length > 60) {
			blockedURL.innerText = info.blockedURL.substring(0, 57) + "...";
		} else {
			blockedURL.innerText = info.blockedURL;
		}
	}

	// Log blocked website to API
	logBlockedWebsiteToAPI(info.blockedURL);

	let blockedURLLink = document.getElementById("lbBlockedURLLink");
	if (info.blockedURL && blockedURLLink && !info.disableLink) {
		blockedURLLink.setAttribute("href", info.blockedURL);
	}

	let blockedSet = document.getElementById("lbBlockedSet");
	if (info.blockedSet && blockedSet) {
		if (info.blockedSetName) {
			blockedSet.innerText = info.blockedSetName;
		} else {
			blockedSet.innerText += " " + info.blockedSet;
		}
		document.title += " (" + blockedSet.innerText + ")";
	}

	let keywordMatched = document.getElementById("lbKeywordMatched");
	let keywordMatch = document.getElementById("lbKeywordMatch");
	if (keywordMatched && keywordMatch) {
		if (info.keywordMatch) {
			keywordMatch.innerText = info.keywordMatch;
			keywordMatched.style.display = "";
		} else {
			keywordMatched.style.display = "none";
		}
	}

	let passwordInput = document.getElementById("lbPasswordInput");
	let passwordSubmit = document.getElementById("lbPasswordSubmit");
	if (passwordInput && passwordSubmit) {
		passwordInput.focus();
		passwordSubmit.onclick = onSubmitPassword;
	}

	let customMsgDiv = document.getElementById("lbCustomMsgDiv");
	let customMsg = document.getElementById("lbCustomMsg");
	if (customMsgDiv && customMsg) {
		if (info.customMsg) {
			customMsg.innerText = info.customMsg;
			customMsgDiv.style.display = "";
		} else {
			customMsgDiv.style.display = "none";
		}
	}

	let unblockTime = document.getElementById("lbUnblockTime");
	if (info.unblockTime && unblockTime) {
		unblockTime.innerText = info.unblockTime;
	}

	let delaySecs = document.getElementById("lbDelaySeconds");
	if (info.delaySecs && delaySecs) {
		delaySecs.innerText = info.delaySecs;

		// Start countdown timer
		let countdown = {
			delaySecs: info.delaySecs,
			delayCancel: info.delayCancel
		};
		countdown.interval = window.setInterval(onCountdownTimer, 1000, countdown);
	}

	if (info.reloadSecs) {
		// Reload blocked page after specified time
		window.setTimeout(reloadBlockedPage, info.reloadSecs * 1000);
	}
}

// Handle countdown on delaying page
//
function onCountdownTimer(countdown) {
	// Cancel countdown if document not focused
	if (countdown.delayCancel && !document.hasFocus()) {
		// Clear countdown timer
		window.clearInterval(countdown.interval);

		// Strike through countdown text
		let countdownText = document.getElementById("lbCountdownText");
		if (countdownText) {
			countdownText.style.textDecoration = "line-through";
		}

		return;
	}

	countdown.delaySecs--;

	// Update countdown seconds on page
	let delaySecs = document.getElementById("lbDelaySeconds");
	if (delaySecs) {
		delaySecs.innerText = countdown.delaySecs;
	}

	if (countdown.delaySecs == 0) {
		// Clear countdown timer
		window.clearInterval(countdown.interval);

		// Notify extension that delay countdown has completed
		let message = {
			type: "delayed",
			blockedURL: gBlockedURL,
			blockedSet: gBlockedSet
		};
		try {
			browser.runtime.sendMessage(message).catch(error => {
				console.log("[LBNG] Failed to send delayed message: " + error.message);
			});
		} catch (error) {
			console.log("[LBNG] Error sending delayed message: " + error.message);
		}
	}
}

// Handle submit button on password page
//
function onSubmitPassword() {
	let passwordInput = document.getElementById("lbPasswordInput");
	if (hashCode32(passwordInput.value) == gHashCode) {
		// Notify extension that password was successfully entered
		let message = {
			type: "password",
			blockedURL: gBlockedURL,
			blockedSet: gBlockedSet
		};
		try {
			browser.runtime.sendMessage(message).catch(error => {
				console.log("[LBNG] Failed to send password message: " + error.message);
			});
		} catch (error) {
			console.log("[LBNG] Error sending password message: " + error.message);
		}
	} else {
		// Clear input field and flash background
		passwordInput.value = "";
		passwordInput.classList.add("error");
		window.setTimeout(() => { passwordInput.classList.remove("error"); }, 400);
	}
}

// Attempt to reload blocked page
//
function reloadBlockedPage() {
	if (gBlockedURL) {
		document.location.href = gBlockedURL;
	}
}

// Log blocked website to external API and show reason input
//
function logBlockedWebsiteToAPI(url) {
	console.log("[LBNG DEBUG] logBlockedWebsiteToAPI called with URL:", url);

	// Send message to background script to handle API call
	// This ensures API calls are made from the background context
	// which has more consistent network access and permissions
	if (url && typeof url === "string") {
		try {
			browser.runtime.sendMessage({
				type: "logBlockedWebsite",
				url: url
			}).then(response => {
				console.log("[LBNG DEBUG] API response received:", response);

				// Store record_id and show reason input if API call succeeded
				if (response && response.recordId) {
					console.log("[LBNG DEBUG] recordId found:", response.recordId);
					gRecordId = response.recordId;
					showReasonInput();
				} else {
					console.log("[LBNG DEBUG] No recordId in response, reason input will not be shown");
					// Optional: Show debug message to user
					let reasonDiv = getElement("lbReasonDiv");
					if (reasonDiv) {
						reasonDiv.style.display = "block";
						let statusElement = getElement("lbReasonStatus");
						if (statusElement) {
							statusElement.textContent = "API call completed but no record ID received";
							statusElement.className = "status-message";
						}
						// Hide input and button since no recordId
						let reasonInput = getElement("lbReasonInput");
						let submitButton = getElement("lbReasonSubmit");
						if (reasonInput) reasonInput.style.display = "none";
						if (submitButton) submitButton.style.display = "none";
					}
				}
			}).catch(error => {
				console.log("[LBNG DEBUG] Error in API call:", error);
				// Handle extension context invalidated and other errors
				handleExtensionError(error, "API logging");
			});
		} catch (error) {
			console.log("[LBNG DEBUG] Synchronous error:", error);
			// Handle synchronous errors (e.g., extension context already invalidated)
			handleExtensionError(error, "API logging");
		}
	} else {
		console.log("[LBNG DEBUG] Invalid URL:", url);
	}
}

// Show reason input form
//
function showReasonInput() {
	console.log("[LBNG DEBUG] showReasonInput called");

	let reasonDiv = getElement("lbReasonDiv");
	if (reasonDiv) {
		console.log("[LBNG DEBUG] Found reasonDiv, showing it");
		reasonDiv.style.display = "block";

		// Show input and button
		let reasonInput = getElement("lbReasonInput");
		let submitButton = getElement("lbReasonSubmit");
		let statusElement = getElement("lbReasonStatus");

		if (reasonInput) {
			reasonInput.style.display = "block";
			console.log("[LBNG DEBUG] Found and showing reasonInput");
		}
		if (submitButton) {
			submitButton.style.display = "block";
			console.log("[LBNG DEBUG] Found and showing submitButton");
		}
		if (statusElement) {
			statusElement.textContent = "";
			statusElement.className = "status-message";
		}

		// Set up event listeners for reason submission
		if (submitButton && reasonInput) {
			// Remove existing listeners to avoid duplicates
			submitButton.removeEventListener("click", submitReason);
			reasonInput.removeEventListener("keydown", submitReasonHandler);

			submitButton.addEventListener("click", submitReason);
			reasonInput.addEventListener("keydown", submitReasonHandler);
			console.log("[LBNG DEBUG] Event listeners added");
		} else {
			console.log("[LBNG DEBUG] Could not find submitButton or reasonInput");
		}
	} else {
		console.log("[LBNG DEBUG] Could not find reasonDiv");
	}
}

// Helper function for keydown event handler
function submitReasonHandler(event) {
	if (event.key === "Enter" && event.ctrlKey) {
		submitReason();
	}
}

// Submit reason to update record
//
function submitReason() {
	console.log("[LBNG DEBUG] submitReason called");

	let reasonInput = getElement("lbReasonInput");
	let statusElement = getElement("lbReasonStatus");
	let submitButton = getElement("lbReasonSubmit");

	if (!reasonInput || !statusElement || !submitButton) {
		console.log("[LBNG DEBUG] Missing elements: reasonInput, statusElement or submitButton");
		return;
	}

	let reason = reasonInput.value.trim();
	console.log("[LBNG DEBUG] Reason entered:", reason);

	// Validate reason
	if (!reason) {
		statusElement.textContent = "Please enter a reason";
		statusElement.className = "status-message error";
		return;
	}

	if (!gRecordId) {
		console.log("[LBNG DEBUG] No gRecordId available, gRecordId:", gRecordId);
		statusElement.textContent = "Record ID not available";
		statusElement.className = "status-message error";
		return;
	}

	console.log("[LBNG DEBUG] All validations passed, sending update request");

	// Disable submit button during submission
	submitButton.disabled = true;
	submitButton.textContent = "Submitting...";
	statusElement.textContent = "Submitting...";
	statusElement.className = "status-message";

	// Send message to background script to update record
	try {
		browser.runtime.sendMessage({
			type: "updateRecordWithReason",
			recordId: gRecordId,
			reason: reason
		}).then(response => {
			console.log("[LBNG DEBUG] Update response received:", response);

			if (response && response.success) {
				statusElement.textContent = "Reason submitted successfully! You can modify and resubmit.";
				statusElement.className = "status-message success";
				submitButton.disabled = false;
				submitButton.textContent = "Submit Reason";
				
				// Clear the input field after successful submission
				// reasonInput.value = ""; // Uncomment if you want to clear the input
				
				// Auto-hide success message after 3 seconds
				setTimeout(function() {
					if (statusElement.className === "status-message success") {
						statusElement.textContent = "";
						statusElement.className = "status-message";
					}
				}, 3000);
			} else {
				statusElement.textContent = "Failed to submit reason. Please try again.";
				statusElement.className = "status-message error";
				submitButton.disabled = false;
				submitButton.textContent = "Submit Reason";
			}
		}).catch(error => {
			console.log("[LBNG DEBUG] Error in update request:", error);
			handleExtensionError(error, "reason submission", statusElement, submitButton);
		});
	} catch (error) {
		console.log("[LBNG DEBUG] Synchronous error in update request:", error);
		handleExtensionError(error, "reason submission", statusElement, submitButton);
	}
}

// Handle extension context invalidated and other errors
//
function handleExtensionError(error, operation, statusElement, submitButton) {
	console.log("[LBNG] Error during " + operation + ": " + error.message);

	// Check for extension context invalidated error
	if (error.message && error.message.includes("Extension context invalidated")) {
		// Show user-friendly message about extension reload
		if (statusElement) {
			statusElement.textContent = "Extension has been reloaded. Please refresh the page.";
			statusElement.className = "status-message error";
		}
		if (submitButton) {
			submitButton.disabled = false;
			submitButton.textContent = "Submit Reason";
		}

		// Add a refresh button if it doesn't exist
		addRefreshButton();
	} else if (error.message && error.message.includes("Receiving end does not exist")) {
		// Extension context not available
		if (statusElement) {
			statusElement.textContent = "Extension temporarily unavailable. Please try again.";
			statusElement.className = "status-message error";
		}
		if (submitButton) {
			submitButton.disabled = false;
			submitButton.textContent = "Submit Reason";
		}
	} else {
		// Other errors
		if (statusElement) {
			statusElement.textContent = "Network error. Please try again.";
			statusElement.className = "status-message error";
		}
		if (submitButton) {
			submitButton.disabled = false;
			submitButton.textContent = "Submit Reason";
		}
	}
}

// Add refresh button when extension context is invalidated
//
function addRefreshButton() {
	// Check if refresh button already exists
	if (getElement("lbRefreshButton")) {
		return;
	}

	let reasonDiv = getElement("lbReasonDiv");
	if (!reasonDiv) return;

	// Create refresh button
	let refreshButton = document.createElement("button");
	refreshButton.id = "lbRefreshButton";
	refreshButton.textContent = "Refresh Page";
	refreshButton.style.marginLeft = "10px";
	refreshButton.onclick = function() {
		window.location.reload();
	};

	// Add to the reason div
	let submitButton = getElement("lbReasonSubmit");
	if (submitButton && submitButton.parentNode) {
		submitButton.parentNode.appendChild(refreshButton);
	}
}

// Request block info from extension with error handling
function requestBlockInfo() {
	try {
		browser.runtime.sendMessage({ type: "blocked" }).then(processBlockInfo).catch(error => {
			console.log("[LBNG] Failed to get block info: " + error.message);
			// If extension context is invalidated, show a message
			if (error.message && error.message.includes("Extension context invalidated")) {
				let warningDiv = getElement("lbWarningMsgDiv");
				if (warningDiv) {
					warningDiv.innerHTML = "<h1>Extension has been reloaded. Please refresh the page.</h1>";
				}
				addRefreshButton();
			}
		});
	} catch (error) {
		console.log("[LBNG] Error requesting block info: " + error.message);
		// Handle synchronous errors
		let warningDiv = getElement("lbWarningMsgDiv");
		if (warningDiv) {
			warningDiv.innerHTML = "<h1>Extension temporarily unavailable. Please refresh the page.</h1>";
		}
		addRefreshButton();
	}
}

requestBlockInfo();
