/* eslint-disable @typescript-eslint/no-misused-promises */
import LogoButton from "@/components/ui/logo-button";
import { AuthFormComponent } from "@/components/ui/auth-form";
import { Suspense } from "react";

export default function AuthenticationPage() {
  return (
    <div>
      <div
        className="container relative h-screen flex-col items-center
          justify-center sm:grid lg:max-w-none lg:grid-cols-2 lg:px-0"
      >
        {/* the gray thing on the left side */}
        <div
          className="relative hidden h-full flex-col bg-muted p-10 text-white
            lg:flex dark:border-r"
        >
          <div className="absolute inset-0 bg-zinc-900" />
          <LogoButton />
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                {`"Pylon makes building AI workflows as simple as connecting the dots. It's visual programming for the AI era."`}
              </p>
              <footer className="text-sm">- Me, probably</footer>
            </blockquote>
          </div>
        </div>
        <div className="absolute sm:hidden flex">
          <LogoButton />
        </div>
        <div className="lg:p-8 w-full flex h-full ">
          <div
            className="mx-auto flex w-full flex-col justify-center space-y-6
              sm:w-[350px]"
          >
            {/* <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Build powerful AI workflows visually
              </h1>
            </div> */}
            <Suspense fallback={<div>Loading...</div>}>
              <AuthFormComponent />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
