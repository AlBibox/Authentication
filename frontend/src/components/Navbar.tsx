'use client'

import { useState, useCallback } from 'react'
import {
    Dialog,
    DialogPanel,
    PopoverGroup,
} from '@headlessui/react'
import {
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { NavLink, useNavigate } from "react-router";
import axios from 'axios';

const apiUrl = import.meta.env.MODE === "production" ? import.meta.env.VITE_API_ENDPOINT : "http://localhost:3000"



export default function Navbar({ email }: { email: string | undefined }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = useCallback(async () => {
        await axios.post(`${apiUrl}/logout`, {}, { withCredentials: true })
        navigate("/")
    }, []);

    return (
        <header className="bg-blue-50">
            <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                    <a href="#" className="-m-1.5 p-1.5">
                        <span className="sr-only">Your Company</span>
                        <img
                            alt=""
                            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                            className="h-8 w-auto"
                        />
                    </a>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className="size-6" />
                    </button>
                </div>
                <PopoverGroup className="hidden lg:flex lg:gap-x-12">
                    {!email ? <>
                        <NavLink to="/" end className="text-sm/6 font-semibold text-gray-900">
                            Home
                        </NavLink>
                        <NavLink to="/login" className="text-sm/6 font-semibold text-gray-900">
                            Login
                        </NavLink>
                        <NavLink to="/register" className="text-sm/6 font-semibold text-gray-900">
                            Register
                        </NavLink>
                    </> :
                        <>
                            <span className="text-sm/6 text-gray-900">Hello {email}</span>
                            <button onClick={handleLogout} className="text-sm/6 font-semibold text-gray-900 cursor-pointer">
                                Logout
                            </button></>}

                </PopoverGroup>
            </nav>
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-50 " />
                <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-blue-50 p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                    <div className="flex items-center justify-between">
                        <a href="#" className="-m-1.5 p-1.5">
                            <span className="sr-only">Your Company</span>
                            <img
                                alt=""
                                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                                className="h-8 w-auto"
                            />
                        </a>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="-m-2.5 rounded-md p-2.5 text-gray-700"
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-500/10">
                            <div className="space-y-2 py-6">
                                {!email ?
                                    <>
                                        <NavLink
                                            to="/"
                                            end
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                        >
                                            Home
                                        </NavLink>
                                        <NavLink
                                            to="/login"
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                        >
                                            Login
                                        </NavLink>
                                        <NavLink
                                            to="/register"
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                        >
                                            Register
                                        </NavLink>
                                    </> :
                                    <>
                                        <span className="text-sm/6 text-gray-900">Hello {email}</span>
                                        <button
                                            onClick={handleLogout}
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 cursor-pointer"
                                        >
                                            Log out
                                        </button></>}


                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    )
}