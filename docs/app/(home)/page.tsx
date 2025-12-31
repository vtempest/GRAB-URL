import { HeroSection } from "@/app/components/hero-section"
import { FeaturesGrid } from "@/app/components/features-grid"
import { CodeExample } from "@/app/components/code-example"
import { ComparisonTable } from "@/app/components/comparison-table"
import { Footer } from "@/app/components/footer"

import API2AILanding from "@/app/components/api2ai-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <API2AILanding />
      <FeaturesGrid />
      <CodeExample />
      <ComparisonTable />
      <Footer />
    </main>
  )
}
