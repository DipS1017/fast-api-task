import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";

export function TopBar() {
  const { isAuthenticated, session, signOut } = useAuth();
  if (!isAuthenticated) return null;

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link to="/" className="font-semibold">
          TechKraft <span className="text-muted-foreground">· Candidate Review</span>
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="uppercase">
            {session.role}
          </Badge>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4" /> Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
