import { Button } from "@/components/ui/button";
import React from "react";
import { LuArrowLeft } from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
const AuthPage = async () => {
  const session = await auth();
  if (session) {
    redirect("/");
  }
  const handleGoogleSignIn = async () => {
    "use server";
    await signIn("google", {
      callbackUrl: "/",
      redirect: true,
    });
  };
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-2 md:p-8">
      <h1 className="mb-5 h-5 text-xl font-bold text-foreground flex items-center gap-2">
        Welcome to Chat-Gpt
        {/* <SidebarLogo className="text-wordmark-color" /> */}
      </h1>
      <div className="mb-8 text-center text-muted-foreground">
        <p className="">
          Sign in below (we'll increase your message limits if you do 😉)
        </p>
      </div>
      <form action={handleGoogleSignIn} className="w-full max-w-sm">
        <Button className="w-full h-14 text-lg flex items-center gap-5">
          <FcGoogle className="size-6 brightness-110" />
          Continue with Google
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-muted-foreground/60">
        <p>
          By continuing, you agree to our{" "}
          <a
            href="/terms-of-service"
            className="text-muted-foreground hover:text-white"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy-policy"
            className="text-muted-foreground hover:text-white"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
