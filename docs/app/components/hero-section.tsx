"use client"

import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Copy, Github, BookOpen, Check } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

export function HeroSection() {
  const [copied, setCopied] = useState(false)

  const copyCommand = () => {
    navigator.clipboard.writeText("npm i grab-url")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 animated-grid-bg" />
      <div className="absolute inset-0 grid-glow" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      <div className="container mx-auto px-4 py-20 md:py-32 relative">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="mb-8 relative" style={{ animation: "float 6s ease-in-out infinite" }}>
            <Image
              src="https://i.imgur.com/Rwl5P3p.png"
              alt="GRAB - Generate Request to API from Browser"
              width={200}
              height={200}
              className="drop-shadow-2xl"
            />
          </div>

          <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/30 text-primary">
            v1.0 — Zero Dependencies, 4KB
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-4">
            Why <span className="line-through text-muted-foreground">fetch</span> when you can just
          </h1>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="shimmer-text">GRAB</span>
            <span className="text-primary">?</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground mb-2 font-mono">
            Generate Request {"{"}to: <span className="text-primary">API</span> from:{" "}
            <span className="text-foreground">Browser</span>
            {"}"}
          </p>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mb-8 text-pretty">
            Functionally Brilliant, Elegantly Simple. One function, no dependencies, minimalist syntax with more
            features than alternatives.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
            <Button onClick={() => window.location.href = "/docs"} size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <BookOpen className="h-4 w-4" />
              Documentation
            </Button>

            <div
              onClick={copyCommand}
              className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-2.5 cursor-pointer hover:border-primary/50 transition-colors group"
            >
              <code className="font-mono text-sm text-foreground">npm i grab-url</code>
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </div>

            <Button variant="outline" size="lg" className="gap-2 bg-transparent">
              <Github className="h-4 w-4" />
              GitHub
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pt-8 border-t border-border w-full max-w-2xl">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">4KB</p>
              <p className="text-sm text-muted-foreground">Minified + Gzip</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Dependencies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">20+</p>
              <p className="text-sm text-muted-foreground">Features</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">100%</p>
              <p className="text-sm text-muted-foreground">TypeScript</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
