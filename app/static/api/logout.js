
import { deleteCookie } from "../js/cookie";


async function logoutUser() {
    deleteCookie("access_token");
    deleteCookie("refresh_token");
    window.location.href = "/u/login/";
}