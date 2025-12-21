import { Button } from "@/app/components/ui/button"
import { Github, BookOpen, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
            Ready to <span className="text-primary">GRAB</span> your data?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Debugging requests is a pain. Make the switch to GRAB and simplify your HTTP layer today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <BookOpen className="h-4 w-4" />
              Read the Docs
            </Button>
            <Button variant="outline" size="lg" className="gap-2 bg-transparent">
              <Github className="h-4 w-4" />
              Star on GitHub
            </Button>
            <Button variant="outline" size="lg" className="gap-2 bg-transparent">
              <MessageCircle className="h-4 w-4" />
              Join Discord
            </Button>
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-muted-foreground text-sm">🌟 Star this repo so it will grow and get updates!</p>
            <p className="text-muted-foreground text-sm mt-2">MIT License — Why fetch things when you can just GRAB?</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
