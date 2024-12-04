/* eslint-disable @typescript-eslint/naming-convention */
import { redirect } from "next/navigation";
import { createServersideClient } from "@/lib/supabase/server";
import { AuthWrapper } from "@/components/ui/auth-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, LogOut } from "lucide-react";
import Link from "next/link";

export default async function Profile() {
  const supabase = createServersideClient();

  const { data, error } = await supabase.auth.getUser();
  if (error ?? !data?.user) {
    redirect("/login");
  }

  const { user } = data;
  const { email, user_metadata } = user;
  const { full_name, avatar_url } = user_metadata;

  return (
    <AuthWrapper>
      <div className="container mx-auto p-4 ml-16">
        <Card className="max-w-md mx-auto">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage
                src={avatar_url || "/placeholder.svg?height=64&width=64"}
                alt="Profile picture"
              />
              <AvatarFallback>
                {full_name
                  ? full_name
                      .split(" ")
                      .map((n: any[]) => n[0])
                      .join("")
                      .toUpperCase()
                  : email?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">Profile</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your personal information
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Name
                </h3>
                <p className="text-lg">{full_name || "Not set"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Email
                </h3>
                <p className="text-lg">{email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Account Created
                </h3>
                <p className="text-lg">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    href="https://discord.gg/V6KwQ2BCst"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    Submit Feedback or Feature Request
                  </Link>
                </Button>
                <Button variant="destructive" className="w-full" asChild>
                  <Link href="/auth/signout" prefetch={false}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
