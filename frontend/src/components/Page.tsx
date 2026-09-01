import Navbar from "./Navbar"
import { Outlet } from "react-router"

export default function Page() {
    return (
        <>
            <Navbar isLogged={false} />
            <Outlet />
        </>

    )



}