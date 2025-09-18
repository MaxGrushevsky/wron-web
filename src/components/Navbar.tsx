"use client";
import Link from "next/link";
import ThemeChanger from "./DarkSwitch";
import Image from "next/image"
import { Disclosure } from "@headlessui/react";

export const Navbar = () => {

  return (
    <div className="w-full">
      <nav className="container relative flex flex-wrap items-center justify-between p-8 mx-auto lg:justify-between xl:px-1">
        <Link href="/">
          <span className="flex items-center space-x-2 text-2xl font-medium text-indigo-500 dark:text-gray-100">
            <span>🐦‍⬛ Wroniak</span>
          </span>
        </Link>

        <div className="gap-3 nav__item mr-2 lg:flex ml-auto lg:ml-0 lg:order-2">
            <ThemeChanger />
            <Link href="https://www.wroclaw.pl/" className="inline-block px-4 py-2 text-sm font-normal text-gray-800 no-underline rounded-md dark:text-gray-200 hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:focus:bg-gray-800">
              wroclaw.pl
          </Link>
        </div>
      </nav>
    </div>
  );
}

