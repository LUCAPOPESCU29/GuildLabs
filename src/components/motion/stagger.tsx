"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { staggerParent, staggerChild } from "@/lib/motion";

/**
 * Entrance-stagger wrapper for grids/lists. Wrap the container in <Stagger> and
 * each child in <StaggerItem>. Reveals once on scroll-in.
 */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerParent}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-60px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerChild} className={className}>
      {children}
    </motion.div>
  );
}
