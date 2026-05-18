"use client";

import Link from "next/link";

interface ComingSoonToolProps {
  title: string;
  description: string;
  icon: string;
}

export default function ComingSoonTool({ title, description, icon }: ComingSoonToolProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="text-center py-16">
        <div className="text-6xl mb-6">{icon}</div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 inline-block max-w-md">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Coming Soon!</h2>
          <p className="text-yellow-700 text-sm mb-4">
            This tool requires advanced document conversion capabilities and is currently under development.
            We are working hard to bring this feature to you soon!
          </p>
          <Link href="/" className="btn-secondary inline-block">
            ← Back to All Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
