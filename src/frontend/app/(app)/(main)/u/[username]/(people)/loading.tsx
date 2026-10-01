import { MemberListSkeleton } from "@/components/profile/profile-skeletons";
import { Panel } from "@/components/ui/panel";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function PeopleLoading() {
  return (
    <PageSkeleton label="Loading members">
      <Panel>
        <MemberListSkeleton />
      </Panel>
    </PageSkeleton>
  );
}
