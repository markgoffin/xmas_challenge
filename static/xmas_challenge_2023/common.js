
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function deleteCookie(name) {
    document.cookie = name + "=" +
      ";path=/"+
      ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
}

function askForUserName() {
    return window.prompt("Please enter a userame:", "");
}

const COOKIES = {
    CURRENT_USER: "current_user",
    USER_LIST: "user_list",
};

COOKIE_DURATION_DAYS = 30;
function setCurrentUser(user) {
    setCookie(COOKIES.CURRENT_USER, user, COOKIE_DURATION_DAYS);
}

function getCurrentUser() {
    let user = getCookie(COOKIES.CURRENT_USER);
    if (user == '') {
        user = newUser();
    }
    return user
}

function userStateCookieName(username) {
    return username + "_state";
}

function getUserState(username) {
    const USER_STATE = userStateCookieName(username);
    const state_str = getCookie(USER_STATE);
    if (state_str == '') {
        return { "puzzles": {} }
    } else {
        return JSON.parse(state_str);
    }
}

function clearCurrentUserState() {
    clearUserState(getCurrentUser());
}

function clearUserState(username) {
    deleteCookie(userStateCookieName(username));
}

function updateUserState() {
    const user = getCurrentUser();
    let state = getUserState(user);
    const titleEle = $("#puzzle-title")
    if (titleEle.length > 0) {
        const puzzleIndex = titleEle.data("puzzle-index");
        const puzzleName = titleEle.text();
        if (puzzleIndex == undefined) {
            return;  // shouldn't get here but protects puzzle list in case it does
        }
        state.puzzles[puzzleIndex] = {"url": window.location.pathname, "name": puzzleName};
    } else {
        const ele = document.getElementById("challenge-complete");
        if (ele) {
            state.complete = window.location.pathname;
        }
    }
    setCookie(userStateCookieName(user), JSON.stringify(state), COOKIE_DURATION_DAYS);
}

function updatePuzzleDropdown() {
    const user = getCurrentUser();
    let state = getUserState(user);
    let nav = $("#puzzle-dropdown");
    const puzzles = state.puzzles;
    const count = Object.keys(puzzles).length
    for (let ii = 0; ii < count; ii++) {
        const c = puzzles[ii];
        nav.append("<a class='dropdown-item' href='" + c.url + "'>" + c.name + "</a>");
    }
}

function addUserToUserList(user) {
    let userList = getUserList();
    userList[user] = true;
    setCookie(COOKIES.USER_LIST, JSON.stringify(userList), COOKIE_DURATION_DAYS);
    return userList;
}

function deleteUserFromUserList(user) {
    let userList = getUserList();
    delete userList[user];
    setCookie(COOKIES.USER_LIST, JSON.stringify(userList), COOKIE_DURATION_DAYS);
    return userList;
}

function newUser() {
    let user = askForUserName();
    if (!user) {
        user = "default";
    }
    addUserToUserList(user);
    switchUser(user);
    return user;
}

function switchUser(user) {
    setCurrentUser(user);
    updatePuzzleDropdown();
    // Go to latest puzzle
    const state = getUserState(user);
    const count = Object.keys(state.puzzles).length
    if (count != 0) {
        const latestPuzzle = state.puzzles[count-1];
        window.location = latestPuzzle.url;
    } else {
        window.location = "start.html";
    }
}

function getUserList() {
    const userList = getCookie(COOKIES.USER_LIST);
    if (userList == '') {
        return {};
    }
    return JSON.parse(userList);
}

function populateUserDropdown() {
    const user = getCurrentUser();
    let userDropdown = $("#user-dropdown")
    const userList = getUserList();
    for (const u of Object.keys(userList)) {
        let userLink = $("<button type='button' style='display: flex; justify-content: space-between' class='dropdown-item'><span>" + u + "</span><span class='delete-user'>&#x2715;</span></a>");
        userLink.click(function(){
            switchUser(u);
        });
        let deleteCross = userLink.find(".delete-user");
        deleteCross.on("click", {"user": u}, function(event) {
            const user = event.data.user;
            const confirmed = window.confirm("Are you sure you want to delete user " + user + "?");
            if (!confirmed) {
                return;
            }
            let crossEle = $(event.target);
            let userRow = crossEle.parent();
            userRow.remove();
            deleteUser(event.data.user);
        });
        userDropdown.append(userLink);
    }
    userDropdown.append('<div class="dropdown-divider"></div>');
    let addUserLink = $("<button type='button' class='dropdown-item'>Add user</a>");
    addUserLink.click(function(){
        newUser();
    });
    userDropdown.append(addUserLink);
    $("#user-dropdown-button").text("User: " + user);
}

function updateChallengeNav() {
    const user = getCurrentUser();
    const state = getUserState(user);
    if (state.complete) {
        $("#congratulations-link").html("<a class='btn btn-success' role='button' href='" + state.complete + "'>Congratulations!!</a>");
    }
}

function deleteUser(user) {
    clearUserState(user);
    deleteUserFromUserList(user);
    const currentUser = getCurrentUser();
    if (user == currentUser) {
        deleteCookie(COOKIES.CURRENT_USER);
        window.location = "start.html";
        return;
    }
}

function clearAllCookies() {
    const userList = getUserList();
    for (const user of Object.keys(userList)) {
        clearUserState(user);
    }
    deleteCookie(COOKIES.CURRENT_USER);
    deleteCookie(COOKIES.USER_LIST);
}

function addListenerToInput() {
    let input = document.getElementById("answer")
    if (!input) { return; }
    input.addEventListener("keypress", function(event) {
      // If the user presses the "Enter" key on the keyboard
      if (event.key === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("submit").click();
      }
    });
}

$(document).ready(function() {
    populateUserDropdown();
    updateUserState();
    updatePuzzleDropdown();
    updateChallengeNav();
    addListenerToInput();
});
