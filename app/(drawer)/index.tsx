import { Redirect } from "expo-router";
import "../../global.css";

const DrawerHome = () => {
    // Redirect to tabs when drawer index is accessed
    return <Redirect href="/(tab)" />;
};

export default DrawerHome;