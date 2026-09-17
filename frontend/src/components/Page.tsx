import Navbar from "./Navbar"
import { Outlet, useLoaderData } from "react-router"

export default function Page() {
    const userData = useLoaderData();
    return (
        <>
            <Navbar email={userData?.email} />
            <Outlet />
        </>

    )



}