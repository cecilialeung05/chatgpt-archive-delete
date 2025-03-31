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

    const createIcon = (svgPath) => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "16");
        svg.setAttribute("height", "16");
        svg.setAttribute("fill", "currentColor");
        svg.style.marginRight = "8px";
      
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", svgPath);
        svg.appendChild(path);
      
        return svg;
    };
    const addControlButtons = () => {
        if (document.getElementById("chatManagerControls")) return;
      
        const buttonContainer = document.createElement("div");
        buttonContainer.id = "chatManagerControls";
      
        const deleteButton = document.createElement("button");
        deleteButton.id = "bulkDeleteButton";
        deleteButton.onclick = () => processChats("delete");
      
        const deleteIconPath = "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zm3.46-9.12 1.41-1.41L12 10.59l1.12-1.12 1.41 1.41L13.41 12l1.12 1.12-1.41 1.41L12 13.41l-1.12 1.12-1.41-1.41L10.59 12l-1.12-1.12z M15.5 4l-1-1h-5l-1 1H5v2h14V4z";
        const deleteIcon = createIcon(deleteIconPath);
        deleteButton.appendChild(deleteIcon);
        deleteButton.appendChild(document.createTextNode("Bulk Delete"));
      
        const archiveButton = document.createElement("button");
        archiveButton.id = "bulkArchiveButton";
        archiveButton.onclick = () => processChats("archive");
      
        const archiveIconPath = "M20.54 5.23 19.15 3.5A2 2 0 0 0 17.43 3H6.57A2 2 0 0 0 4.85 3.5L3.46 5.23A2 2 0 0 0 3 6.57V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.57a2 2 0 0 0-.46-1.34zM12 17l-5-5h3V9h4v3h3l-5 5z";
        const archiveIcon = createIcon(archiveIconPath);
        archiveButton.appendChild(archiveIcon);
        archiveButton.appendChild(document.createTextNode("Bulk Archive"));
      
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
