import React from "react";

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
};

const PrivateRoute = ({ children }) => {
    const userToken = getCookie("accessToken");

    if (!userToken) {
        window.location.href = "http://localhost:5173";
        return null;
    }

    return children;
};

export default PrivateRoute;
//test