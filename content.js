(function () {
    "use strict";

    const globalData = {};

    const initGlobalData = () => {
        globalData.token = "";
        globalData.tokenError = false;
        globalData.selectedChats = {};
        globalData.extensionOutdated = false;
    };

    const checkBoxHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log("Checkbox clicked!");

        setTimeout(() => {
            e.target.checked = !e.target.checked;
            console.log(`Checkbox state changed: ${e.target.checked}`);
        }, 1);

        const liElement = e.target.closest("li");
        if (!liElement) {
            console.warn("Could not find LI element for chat.");
            return;
        }
        console.log("Found LI element:", liElement);

        const chatLink = liElement.querySelector("a");
        if (!chatLink) {
            console.warn("Could not find chat link inside LI.");
            return;
        }

        const href = chatLink.getAttribute("href"); 
        if (!href || !href.startsWith("/c/")) {
            console.warn("Chat ID not found in href:", href);
            return;
        }

        const chatId = href.replace("/c/", "");
        const chatTitle = chatLink.title || "Untitled Chat";

        console.log("Extracted chat ID:", chatId, "Chat Title:", chatTitle);

        if (chatId) {
            if (e.target.checked) {
                globalData.selectedChats[chatId] = { id: chatId, text: chatTitle };
            } else {
                delete globalData.selectedChats[chatId];
            }
            console.log("Updated selected chats:", globalData.selectedChats);
        }
    };

    const addCheckboxesToChatsIfNeeded = () => {
        console.log("Checking if checkboxes need to be added...");
        const chats = document.querySelectorAll('nav li:not(.customCheckboxAdded)');
        chats.forEach((chat) => {
            if (chat.querySelector(".customCheckbox")) {
                return;
            }
            console.log("Adding checkbox to chat item...");
            const inputElement = document.createElement("input");
            inputElement.setAttribute("type", "checkbox");
            inputElement.setAttribute("class", "customCheckbox");
            inputElement.onclick = checkBoxHandler;
            chat.classList.add("customCheckboxAdded"); // Prevent adding multiple checkboxes
            chat.querySelector("a").insertAdjacentElement("afterbegin", inputElement);
        });
    };

    const getToken = async () => {
        console.log("Fetching user token...");

        try {
            const response = await fetch("https://chatgpt.com/api/auth/session", {
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch token: ${response.status}`);
            }

            const data = await response.json();
            globalData.token = data.accessToken;
            console.log("Token received:", globalData.token);
            return globalData.token;
        } catch (error) {
            console.error("Error fetching token:", error);
            globalData.tokenError = true;
        }
    };

    const sendChatUpdateRequest = async (chatId, action) => {
        console.log(`Attempting to ${action} chat with ID: ${chatId}`);

        if (!globalData.token) {
            console.warn("No token found! Fetching a new token...");
            await getToken();
        }

        console.log("Using token:", globalData.token);

        const body = action === "delete" 
            ? { "is_visible": false } 
            : { "is_archived": true }; 

        try {
            const response = await fetch(`https://chatgpt.com/backend-api/conversation/${chatId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${globalData.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body),
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`Failed to ${action} chat ${chatId}: ${response.status}`);
            }

            console.log(`Chat ${chatId} ${action}d successfully`);
            return await response.json();
        } catch (error) {
            console.error(`Error ${action}ing chat ${chatId}:`, error);
        }
    };

    const processChats = (action) => {
        console.log(`Bulk ${action} initiated`);
        console.log("Chats selected for processing:", globalData.selectedChats);

        const selectedChatIds = Object.keys(globalData.selectedChats);

        if (selectedChatIds.length === 0) {
            console.warn(`No chats selected for ${action}.`);
            alert(`No chats selected for ${action}!`);
            return;
        }

        console.log(`Processing the following chat IDs for ${action}:`, selectedChatIds);

        const promises = selectedChatIds.map(chatId => sendChatUpdateRequest(chatId, action));

        Promise.all(promises).then(() => {
            console.log(`All selected chats ${action}d!`);
            alert(`Chats successfully ${action}d!`);
            location.reload();
        }).catch((err) => {
            console.error(`Error ${action}ing chats:`, err);
        });
    };

    const addControlButtons = () => {
        const buttonContainer = document.createElement("div");
        buttonContainer.style = "position: fixed; bottom: 10px; right: 10px; display: flex; gap: 10px;";
   
        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Bulk Delete";
        deleteButton.setAttribute("id", "bulkDeleteButton");
        deleteButton.style = "padding: 10px; background: red; color: white; border: none; border-radius: 5px; cursor: pointer;";
        deleteButton.onclick = () => processChats("delete");

        const archiveButton = document.createElement("button");
        archiveButton.innerText = "Bulk Archive";
        archiveButton.setAttribute("id", "bulkArchiveButton");
        archiveButton.style = "padding: 10px; background: blue; color: white; border: none; border-radius: 5px; cursor: pointer;";
        archiveButton.onclick = () => processChats("archive");

        buttonContainer.appendChild(deleteButton);
        buttonContainer.appendChild(archiveButton);

        document.body.appendChild(buttonContainer);
        console.log("Bulk Archive & Delete buttons added!");
    };

    const initializeIfNeeded = () => {
        console.log("Initializing script...");

        if (!document.getElementById("bulkDeleteButton") && !document.getElementById("bulkArchiveButton")) {
            console.log("First-time setup - Initializing global data and UI elements.");
            initGlobalData();
            addControlButtons();
        }

        addCheckboxesToChatsIfNeeded();
    };

    setInterval(() => {
        if (document.querySelector('nav li')) {
            initializeIfNeeded();
        }
    }, 200);
})();
