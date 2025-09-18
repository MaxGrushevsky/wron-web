import React from "react";
import { Container } from "@/components/Container";

export function Footer() {
  return (
    <div className="relative">
      <div className="border-t border-gray-200 dark:border-gray-700"></div>
      <Container>
        <div className="my-10 text-sm text-center text-gray-600 dark:text-gray-400">
          © 2025 Wroniak. All rights reserved.
        </div>
      </Container>
    </div>
  );
}
