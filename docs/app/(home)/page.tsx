import { HeroSection } from "@/components/homepage/hero-section"
import { FeaturesGrid } from "@/components/homepage/features-grid"
import { CodeExample } from "@/components/homepage/code-example"
import { ComparisonTable } from "@/components/homepage/comparison-table"
import { Footer } from "@/components/homepage/footer"
import API2AILanding from "@/components/homepage/api2ai-section"

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
