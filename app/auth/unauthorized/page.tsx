import { RestrictedAccess } from "@/components/restricted-access";

export const dynamic = "force-dynamic";

export default function UnauthorizedPage() {
  return <RestrictedAccess />;
}
