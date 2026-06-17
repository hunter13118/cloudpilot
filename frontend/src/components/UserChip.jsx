import { UserButton } from "@clerk/clerk-react";
import { afterAuthUrl } from "../lib/appBase.js";

/** Clerk avatar + sign-out menu. Only mounted when Clerk is configured. */
export default function UserChip() {
  return (
    <div className="flex items-center pl-1" data-testid="user-chip">
      <UserButton
        afterSignOutUrl={afterAuthUrl}
        appearance={{ elements: { avatarBox: "w-8 h-8 ring-1 ring-indigo-300/20" } }}
      />
    </div>
  );
}
