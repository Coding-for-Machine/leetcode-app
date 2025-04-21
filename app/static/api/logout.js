
import { deleteCookie } from "../js/cookie";


async function logoutUser() {
    deleteCookie("access_token");
    deleteCookie("refresh_token");
    localStorage.removeItem("user")
    window.location.href = "/u/login/";
}