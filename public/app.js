
let currentUser = null;

const getElement = id => document.getElementById(id);

function getUsers() {
    return JSON.parse(localStorage.getItem("leaveUsers") || "{}");
}

function saveUsers(users) {
    localStorage.setItem("leaveUsers", JSON.stringify(users));
}

function showMessage(message, id = "response-message") {
    getElement(id).textContent = message;
}

function showLogin() {
    getElement("login-section").hidden = false;
    getElement("registration-section").hidden = true;
    getElement("dashboard-section").hidden = true;
}

function showRegistration() {
    getElement("login-section").hidden = true;
    getElement("registration-section").hidden = false;
    getElement("dashboard-section").hidden = true;
}

function showDashboard() {
    if (!currentUser) return;

    getElement("login-section").hidden = true;
    getElement("registration-section").hidden = true;
    getElement("dashboard-section").hidden = false;

    getElement("username-display").textContent = currentUser.username;
    getElement("roll-number-display").textContent = currentUser.rollNumber;

    getElement("casual-leave-display").textContent = currentUser.casualLeave;
    getElement("medical-leave-display").textContent = currentUser.medicalLeave;
}

// Register user
function registerUser(event) {
    event.preventDefault();

    const username = getElement("username").value.trim();
    const email = getElement("reg-email").value.trim().toLowerCase();
    const rollNumber = getElement("roll-number").value.trim();

    const casualLeave = Number(getElement("casual-leave").value);
    const medicalLeave = Number(getElement("medical-leave").value);

    if (!username || !email || !rollNumber) {
        showMessage("Please fill all fields.", "registration-response");
        return;
    }

    if (
        !Number.isSafeInteger(casualLeave) ||
        casualLeave < 0 ||
        !Number.isSafeInteger(medicalLeave) ||
        medicalLeave < 0
    ) {
        showMessage("Enter valid leave balances.", "registration-response");
        return;
    }

    const users = getUsers();

    if (users[email]) {
        showMessage("User already exists.", "registration-response");
        return;
    }

    users[email] = {
        username,
        email,
        rollNumber,
        casualLeave,
        medicalLeave
    };

    saveUsers(users);

    getElement("registration-form").reset();

    showMessage("Registration successful. Please login.", "response-message");

    showLogin();
}

// Login user
function loginUser(event) {
    event.preventDefault();

    const email = getElement("email").value.trim().toLowerCase();
    const users = getUsers();

    if (!users[email]) {
        showMessage("User not found. Please register.");
        return;
    }

    currentUser = email;

    const user = users[email];
    currentUser = user;

    getElement("login-form").reset();

    showDashboard();

    showMessage("Login successful.");
}

// Refresh balance
function refreshLeaveBalance() {
    if (!currentUser) return;

    const users = getUsers();
    currentUser = users[currentUser.email];

    if (!currentUser) {
        logoutUser();
        return;
    }

    showDashboard();
    showMessage("Leave balance updated.");
}

// Apply leave
function applyLeave(event) {
    event.preventDefault();

    if (!currentUser) {
        showMessage("Please login first.");
        return;
    }

    const type = getElement("leave-type").value;
    const days = Number(getElement("leave-days").value);

    if (!Number.isSafeInteger(days) || days <= 0) {
        showMessage("Enter a valid number of days.");
        return;
    }

    const users = getUsers();
    const user = users[currentUser.email];

    const field = type === "casual" ? "casualLeave" : "medicalLeave";

    if (user[field] < days) {
        showMessage("Insufficient leave balance.");
        return;
    }

    user[field] -= days;

    users[currentUser.email] = user;

    saveUsers(users);

    currentUser = user;

    showDashboard();

    getElement("leave-form").reset();

    showMessage("Leave applied successfully.");
}

// Logout
function logoutUser() {
    currentUser = null;

    getElement("login-form").reset();
    getElement("leave-form").reset();

    showLogin();

    showMessage("Logged out successfully.");
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {

    getElement("login-form").addEventListener("submit", loginUser);

    getElement("registration-form").addEventListener("submit", registerUser);

    getElement("leave-form").addEventListener("submit", applyLeave);

    getElement("show-registration").addEventListener("click", event => {
        event.preventDefault();
        showRegistration();
    });

    getElement("show-login").addEventListener("click", event => {
        event.preventDefault();
        showLogin();
    });

    getElement("logout-button").addEventListener("click", logoutUser);

    getElement("refresh-balance").addEventListener("click", refreshLeaveBalance);

    showLogin();
});