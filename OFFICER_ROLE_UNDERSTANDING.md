# Officer role: understanding

## What I understood
- Create a new role named **Officer**.
- An Officer can only see the projects assigned to them (no access to unassigned projects).
- Inside an assigned project, if there are follow-ups, the Officer must be able to see them.
- The follow-up view should appear as a **Follow Up** tab, similar to what Admin users see.
- The Officer follow-up view should match how Admin sees follow-ups at `/projects/follow-up`.

## Open questions / confirmations
- Can Officer users see any other project tabs or details besides the Follow Up tab and basic project info?
- Should Officers be able to create or edit follow-ups, or only view them?
- Should Officers see project lists in the same UI as other roles, but filtered to assigned projects?
- Are there any existing roles whose permissions are closest to Officer (so we can mirror/adjust them)?
- Should Officers access `/projects/follow-up` directly, or only see follow-ups within assigned projects? **Answer:** Same as Admin, but limited to projects they have access to (assigned projects only).
