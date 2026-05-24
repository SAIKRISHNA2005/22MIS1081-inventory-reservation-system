"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";

export function Navbar1() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((open) => !open);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/30 bg-white/80 shadow-sm backdrop-blur-xl backdrop-saturate-150">
      <div className="relative mx-auto grid h-20 w-full grid-cols-1 items-center px-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:px-6 lg:px-8">
        <div className="z-10 col-start-1 row-start-1 justify-self-start">
          <Link href="/products" aria-label="Allo Health home" className="shrink-0">
            <motion.div
              className="relative h-16 w-36 overflow-hidden rounded-xl sm:h-[4.5rem] sm:w-40"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.25 }}
            >
              <Image
                src="/images/logo.png"
                alt="Allo Health"
                fill
                sizes="(max-width: 640px) 144px, 160px"
                className="object-contain object-left"
                priority
              />
            </motion.div>
          </Link>
        </div>

        <motion.p
          className="pointer-events-none z-0 col-start-1 row-start-1 max-w-[11rem] justify-self-center text-center text-sm font-semibold leading-snug tracking-tight text-slate-900 sm:pointer-events-auto sm:col-start-2 sm:row-start-1 sm:max-w-none sm:text-base sm:leading-normal"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          Allo Health Inventory System
        </motion.p>

        <div className="z-10 col-start-1 row-start-1 flex justify-self-end sm:col-start-3 sm:row-start-1">
          <motion.div
            className="hidden sm:block"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/products"
              className="inline-flex h-9 items-center rounded-full bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Get Started
            </Link>
          </motion.div>

          <motion.button
            type="button"
            className="flex items-center sm:hidden"
            onClick={toggleMenu}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="h-6 w-6 text-slate-900" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-white/95 px-6 pt-20 backdrop-blur-xl sm:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              type="button"
              className="absolute right-6 top-5 p-2"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              aria-label="Close menu"
            >
              <X className="h-6 w-6 text-slate-900" />
            </motion.button>

            <div className="flex flex-col gap-6">
              <p className="text-base font-semibold text-slate-900">
                Allo Health Inventory System
              </p>
              <Link
                href="/products"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-900 text-base font-medium text-white hover:bg-slate-800"
                onClick={toggleMenu}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
